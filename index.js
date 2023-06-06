// Create web server to listen on port 80 using http module

// Import http module
const http = require('http');

// Set port to 80
const port = process.env.PORT || 80;

// Create web server that returns the ip address of the client
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`IP Address: ${req.connection.remoteAddress}\n 
    Port: ${req.connection.remotePort}\n 
    User-Agent: ${req.headers['user-agent']} \n`);
});

// Start web server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
}
);