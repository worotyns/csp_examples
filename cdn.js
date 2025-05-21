import { join } from "https://deno.land/std@0.152.0/path/mod.ts";

console.log(`CDN server running on http://localhost:8888`);

// Handle incoming requests
const handleRequest = async (req) => {
  const url = new URL(req.url);
  
  // Serve static files from the third-party-scripts directory
  try {
    const fullPath = join(Deno.cwd(), 'third-party-scripts', url.pathname);
    console.log('Serving file:', fullPath);

    // Security: Prevent directory traversal
    if (!fullPath.startsWith(join(Deno.cwd(), 'third-party-scripts'))) {
      return new Response('Access Denied', { status: 403 });
    }

    const file = await Deno.readFile(fullPath);
    
    const contentType = 'application/javascript';
    
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
    });

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
  { port: 8888 },
  async (req) => {
    try {
      return await handleRequest(req);
    } catch (err) {
      console.error('Unhandled error:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
);