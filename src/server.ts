/**
 * @file Creates and starts a minimal HTTP server for health checks.
 * This is necessary for deployment platforms like Render that require a service to bind to a port.
 */

import http from 'http';

/**
 * Starts the health check server.
 */
export function startServer(): void {
    const PORT = process.env.PORT || 10000;

    http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Bot is alive!\n');
    }).listen(PORT, () => {
        console.log(`Health check server running on port ${PORT}`);
    });
}
