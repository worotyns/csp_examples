// Register Service Worker with integrity check
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // Register the service worker - from 'self'
            const registration = await navigator.serviceWorker.register('/sw.js', {
                type: 'classic',
                updateViaCache: 'none'
            });
            
            console.log('ServiceWorker registration successful');
            
            // Test service worker communication
            if (registration.active) {
                testServiceWorker(registration);
            } else {
                registration.addEventListener('updatefound', () => {
                    registration.installing.addEventListener('statechange', () => {
                        if (registration.active) {
                            testServiceWorker(registration);
                        }
                    });
                });
            }
        } catch (err) {
            console.error('ServiceWorker registration failed: ', err);
        }
    });
}

// Test service worker communication
function testServiceWorker(registration) {
    const channel = new MessageChannel();
    channel.port1.onmessage = (e) => {
        if (e.data.type === 'PONG') {
            console.log('Received PONG from Service Worker');
        }
    };
    registration.active.postMessage({ type: 'PING' }, [channel.port2]);
}