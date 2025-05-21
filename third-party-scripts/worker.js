// Simple worker that responds to ping messages
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PING') {
        console.log('Worker received ping');
        // Send a pong message back to the main thread
        event.ports[0].postMessage({ type: 'PONG' });
    }
});
