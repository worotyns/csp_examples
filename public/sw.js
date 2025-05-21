// This script is located on 'self' origin

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PING') {
    console.log('Service Worker received ping');
    // Respond to the ping with a pong
    event.ports[0].postMessage({ type: 'PONG' });
  }
});

// Import the worker script from third party resource
// importScripts('http://localhost:8888/worker.js');

// Use a integrity partner proxy
importScripts('http://localhost:9000/?url=http://localhost:8888/worker.js&integrity=sha384-lEKbZ20O1biXGvrc1Xeq+uuVoBgTs1xn+n8D8SE8xTD0zE0lBwLtd9myuQePR7bn');