// using express, when a client connects to the service, return the client IP address

const express = require('express');
const app = express();
var parser = require('ua-parser-js');

app.set('trust proxy', true)

app.get('/', (req, res) => {
    var info = parser(req.headers['user-agent']);
    res.send(`<html>
    <head>
        <title>${req.ip}</title>
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
        .footer {
            position: fixed;
            bottom: 10;
            width: 100%;
            text-align: center;
            color: #ffffff;
        }
        p a {
            color: #ffffff;
            text-decoration: none;
        }
    </style>
    <body>
        <h1>IP address: ${req.ip}</h1>
        <h1>Browser: ${info.browser.name} version ${info.browser.version}</h1>
        <div class="footer">
            <p>Gabriel Slayton - <a href="https://www.slaytons.net">Slayton\'s Technology Services</a></p>
    </body>
    </html>`);
}
);

const port = process.env.PORT || 80;

app.listen(port, () => console.log(`Listening on port ${port}`));

