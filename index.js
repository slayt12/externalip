// using express, when a client connects to the service, return the client IP address

const express = require('express');
const app = express();

app.set('trust proxy', true)

app.get('/', (req, res) => {
    res.send(`Your IP address is ${req.ip}`);
    }
);

const port = process.env.PORT || 80;

app.listen(port, () => console.log(`Listening on port ${port}`));

