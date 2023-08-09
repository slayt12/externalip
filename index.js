// using express, when a client connects to the service, return the client IP address

const express = require('express');
const app = express();
var parser = require('ua-parser-js');

app.set('trust proxy', true)

app.get('/', (req, res) => {
    var info = parser(req.headers['user-agent']);
    res.send(`<html>
    <head>
<<<<<<< HEAD
        <title>IP: ${req.ip}</title>
=======
        <title>${req.ip}</title>
        <meta name="title" content="IP No BS">
<meta name="description" content="Returns the IP and browser version of your current connection.">
<meta name="keywords" content="what is my ip, my ip, ip address, browser version, ipv4, what's my ip">
<meta name="robots" content="index, follow">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="language" content="English">
<meta name="revisit-after" content="10 days">
<meta name="author" content="Gabriel Slayton">
>>>>>>> 3aa9b61837d7dabe25fcdba9c77f239f732b11a9
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
    <!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-68ZJDQH8YZ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-68ZJDQH8YZ');
</script>
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

