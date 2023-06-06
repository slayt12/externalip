// using express, when a client connects to the service, return the client IP address

const express = require('express');
const app = express();
const fs = require('fs');

app.set('trust proxy', true)

app.get('/', (req, res) => {
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
        <h1>Your browser is ${req.headers['user-agent'].match(/Edg\/\d{1,3}\.\d{1,3}\.\d{1,4}\.\d{1,3}/g) || req.headers['user-agent']}</h1>
    </body>
    </html>`);
    // create an index.html file with the client ip address
    // fs.writeFileSync(`${__dirname}/app/index${req.ip}.html`, `Your IP address is ${req.ip}`, function (err) {
    //     console.log(err);
    // });
    // res.sendFile(__dirname + `app/index${req.ip}.html`);
}
);

const port = process.env.PORT || 80;

app.listen(port, () => console.log(`Listening on port ${port}`));

