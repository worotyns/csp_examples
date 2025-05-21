// This script is located on 'self' origin

// Import the worker script from third party resource
// importScripts('http://localhost:8888/worker.js');

fetch('http://localhost:8888/worker.js', {
  integrity: 'sha384-T068YnjR6cJn0WcYOTjC6rfSsc2GOXcbPl6CL0DVbDDZhkRcShn/SapO9C8q1/8Z'
}).then(() => {

  // Listen for messages from the main thread
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PING') {
      console.log('Service Worker received ping');
      // Respond to the ping with a pong
      event.ports[0].postMessage({ type: 'PONG' });
    }
  });

  console.log('Worker script loaded via importScripts');
  importScripts('http://localhost:8888/worker.js');
})