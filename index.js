// Create web server to listen on port 80 using http module

// Import http module
const http = require('http');

// Set port to 80
const port = process.env.PORT || 80;

// Create web server that returns the ip address of the client
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    // Get ip address of client
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
});

server.on('request', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    // Get ip address of client
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    res.end(`Your IP address is ${req.socket.remoteAddress}`);
});

// Start web server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
}
);