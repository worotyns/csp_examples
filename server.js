import { ensureDir } from "https://deno.land/std@0.152.0/fs/mod.ts";
import { extname, join } from "https://deno.land/std@0.152.0/path/mod.ts";

const csp = [
  "default-src 'self'", // Allow styles.css
  "script-src 'self' http://localhost:8888", // Allow index.js and other local scripts
  "worker-src 'self'",
  "connect-src 'none'",
]

// Ensure logs directory exists
await ensureDir('./logs');

// Helper function to log CSP violations
async function logViolation(violation) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${JSON.stringify(violation)}\n`;
  
  try {
    await Deno.writeTextFile(
      './logs/csp-violations.log',
      logEntry,
      { append: true, create: true }
    );
    console.log('CSP violation logged');
  } catch (err) {
    console.error('Failed to log CSP violation:', err);
  }
}

// Create HTTP server
console.log(`HTTP server running on http://localhost:8000`);

// Handle incoming requests
const handleRequest = async (req) => {
  const url = new URL(req.url);
  const pathname = url.pathname;
  
  // Handle CSP violation reports
  if (pathname === '/csp-violation-report-endpoint' && req.method === 'POST') {
    try {
      const body = await req.json();
      await logViolation(body);
      return new Response('CSP violation logged', { status: 200 });
    } catch (err) {
      console.error('Error processing CSP report:', err);
      return new Response('Bad Request', { status: 400 });
    }
  }
  
  // Handle OPTIONS (preflight) requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  
  // Serve static files from the public directory
  try {
    // Default to index.html for the root path
    const filePath = pathname === '/' ? '/index.html' : pathname;
    const fullPath = join(Deno.cwd(), 'public', filePath);
    
    // Security: Prevent directory traversal
    if (!fullPath.startsWith(join(Deno.cwd(), 'public'))) {
      return new Response('Access Denied', { status: 403 });
    }
    
    const file = await Deno.readFile(fullPath);
    
    // Set content type based on file extension
    const ext = extname(filePath).toLowerCase();
    const contentTypeMap = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
    });

    if (filePath.includes('index.html')) {
      headers.set('Content-Security-Policy', csp.concat("report-uri http://localhost:8000/csp-violation-report-endpoint").join('; '));
    }
    console.log('Serving file:', fullPath);

    return new Response(file, { headers });
    
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return new Response('Not Found', { status: 404 });
    }
    console.error('Error serving file:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};

// Start the server
Deno.serve(
  { port: 8000 },
  async (req) => {
    try {
      return await handleRequest(req);
    } catch (err) {
      console.error('Unhandled error:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
);
