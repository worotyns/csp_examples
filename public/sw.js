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
importScripts('http://localhost:8888/worker.js');