# CSP Policy Testing Environment

This project provides a testing environment for Content Security Policy (CSP) with a complete setup including a Deno web server, service worker, and CSP violation reporting.

There is two parts:
 - Local server (server.ts and /public path) - here we will test local scripts (with injections from third-party-scripts via cdn.ts)
 - CDN server (cdn.ts and /third-party-scripts path) - here we will test third party scripts

## Prerequisites

- [Deno](https://deno.land/) - JavaScript/TypeScript runtime
- OpenSSL (for generating hashes)

## Getting Started

1. **Install Deno**
   ```bash
   # On macOS
   brew install deno
   
   # Or using the official installer (macOS/Linux)
   curl -fsSL https://deno.land/x/install/install.sh | sh
   ```

2. **Start the Server**
   ```bash
   # Start the Deno server with necessary permissions
   deno run -A server.js
   ```

  ```bash
   # Third pary scripts worker.js and scripts.js
   deno run -A cdn.js
   ```

3. **Access the Application**
   Open your browser and navigate to: [http://localhost:8000](http://localhost:8000)

## Generating Hashes for Scripts

To generate SHA-384 hashes for script integrity attributes:

```bash
# Make the helper script executable
chmod +x helper.sh

# Generate hashes for all JavaScript files in the public directory
./helper.sh
```

## CSP Violation Reports

CSP violation reports are sent to the Deno server and logged in `logs/csp-violations.log`.

## Step by step securing scripts

### Generate hashes:

```bash
Hash for public/index.js:
sha384-Pf/mgdOkgHqYH2m61o+k36FGWbDih7uuvTXNh/DprqS4XcfP7IVCDuoabE29W7NX

Hash for public/sw.js:
sha384-8y97OeIVc+H7Kv/flflZeXBwwZCH7HbyR5gP7F2XdDSIhWAGprOlpIjDsIuXD0oQ

Hash for third-party-scripts/script.js:
sha384-eSKCHwDqybELLVMLFpGHuNWzs/zBFvRQYw61DiQXocOFZlUs17pHhWKUFtSqoOHd

Hash for third-party-scripts/worker.js:
sha384-T068YnjR6cJn0WcYOTjC6rfSsc2GOXcbPl6CL0DVbDDZhkRcShn/SapO9C8q1/8Z
```

### 1. Start with disallow all:

And change server.js:
```js
const csp = [
  "default-src 'none'",
  "script-src 'none'",
  "worker-src 'none'",
  "connect-src 'none'",
]
```

Status:
 - Local scripts: not allowed
 - Third party scripts: not allowed

```
Refused to load the stylesheet 'http://localhost:8000/style.css' because it violates the following Content Security Policy directive: "default-src 'none'". Note that 'style-src-elem' was not explicitly set, so 'default-src' is used as a fallback.
Understand this error
localhost/:1 Refused to load the script 'http://localhost:8000/index.js' because it violates the following Content Security Policy directive: "script-src 'none'". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.
Understand this error
localhost/:1 Refused to load the script 'http://localhost:8888/script.js' because it violates the following Content Security Policy directive: "script-src 'none'". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.
Understand this error
```

### 2. Allow scripts from same origin and styles

Additionally we will add integrity to prevent scripts from being modified and loaded

```
Hash for public/index.js:
sha384-Pf/mgdOkgHqYH2m61o+k36FGWbDih7uuvTXNh/DprqS4XcfP7IVCDuoabE29W7NX
```

Add to index.html:
```html
<script src="index.js" integrity="sha384-Pf/mgdOkgHqYH2m61o+k36FGWbDih7uuvTXNh/DprqS4XcfP7IVCDuoabE29W7NX" crossorigin="anonymous"></script>
```

And change server.js:
```js
const csp = [
  "default-src 'self'", // Allow styles.css
  "script-src 'self'", // Allow index.js and other local scripts
  "worker-src 'none'",
  "connect-src 'none'",
]
```

Status:
 - Local scripts: allowed and checked by integrity
 - Third party scripts: not allowed

In console you will see:
```
Script loaded - from self index.js
localhost/:1 Refused to load the script 'http://localhost:8888/script.js' because it violates the following Content Security Policy directive: "script-src 'self'". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.
Understand this error
```

3. Allow scripts from third partied by "sha" checksums

And change server.js:
```js
const csp = [
  "default-src 'self'", // Allow styles.css
  "script-src 'self' http://localhost:8888", // Allow index.js and other local scripts
  "worker-src 'none'",
  "connect-src 'none'",
]
```

In index.html add:
```html
<script src="http://localhost:8888/script.js" integrity="sha384-eSKCHwDqybELLVMLFpGHuNWzs/zBFvRQYw61DiQXocOFZlUs17pHhWKUFtSqoOHd" crossorigin="anonymous"></script>
```

Status:
 - Local scripts: allowed via CSP and checked by SRI integrity
 - Third party scripts: allowed via CSP and checked by SRI integrity

Console shows:
```
Script loaded - from self index.js
Refused to create a worker from 'http://localhost:8000/sw.js' because it violates the following Content Security Policy directive: "worker-src 'none'".
ServiceWorker registration failed:  SecurityError: Failed to register a ServiceWorker: The provided scriptURL ('http://localhost:8000/sw.js') violates the Content Security Policy.
```

4. Allow scripts and worker from third partied by "sha" checksums (sw.js)

And change server.js:
```js
const csp = [
  "default-src 'self'", // Allow styles.css
  "script-src 'self' http://localhost:8888", // Allow index.js and other local scripts
  "worker-src 'self'", // Allow sw.js served from self origin
  "connect-src 'none'",
]
```

Status:
 - Local scripts: allowed via CSP and checked by SRI integrity
 - Third party scripts: allowed via CSP and checked by SRI integrity
 - Service worker: allowed via CSP and checked by SRI integrity

Console shows:
```
Script loaded - from self index.js
script.js:11 ServiceWorker registration successful
sw.js:6 Service Worker received ping
worker.js:4 Worker received ping
script.js:36 Received PONG from Service Worker
Script loaded - from self index.js
```

That's mean that sw.js is allowed to injct worker.js without integrity checks.

4. Try to add to CSP 'sha' not works, like:

Multiple variation of SHA addedd to direcrive not works and allow access to scripts where:

```js
  "script-src 'self' http://localhost:8888, 'sha-xxx",
  "worker-src 'sha-xxx'", 
```

## Current state

Even if I add SRI and CSP to script, third party script, then third script can register sw.js.
Sill I cannot check integrity of third-party code in worker.js (this content can be changed to suspicious code).

## License

MIT
