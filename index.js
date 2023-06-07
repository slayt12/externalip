// using express, when a client connects to the service, return the client IP address

const express = require('express');
const app = express();
var parser = require('ua-parser-js');

app.set('trust proxy', true)

app.get('/', (req, res) => {
    var info = parser(req.headers['user-agent']);
    res.send(`<html>
    <head>
        <title>IP Address</title>
    </head> 
    <style>
        body {
            background-color: #000000;
            color: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 1.5em;
            text-align: center;
            margin-top: 10%;
        }
    </style>
    <body>
        <h1>Your IP address is ${req.ip}</h1>
        <h1>Your browser is ${info.browser.name} version ${info.browser.version}</h1>
    </body>
    </html>`);
}
);

const port = process.env.PORT || 80;

app.listen(port, () => console.log(`Listening on port ${port}`));

