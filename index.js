// using express, when a client connects to the service, return the client IP address

const express = require('express');
const app = express();
var parser = require('ua-parser-js');

app.set('trust proxy', true)




app.get('/', async (req, res) => {
    async function getISP() {
        const { isp } = await fetch(`http://ip-api.com/json/${req.ip}`).then(res => res.json());
        return isp;
    }

    saveLog(req.ip);
    var info = parser(req.headers['user-agent']);
    res.send(`<html>
    <head>
        <title>IP: ${req.ip}</title>
        <title>${req.ip}</title>
        <meta name="title" content="IP No BS">
<meta name="description" content="Returns the IP and browser version of your current connection.">
<meta name="keywords" content="what is my ip, my ip, ip address, browser version, ipv4, what's my ip">
<meta name="robots" content="index, follow">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="language" content="English">
<meta name="revisit-after" content="10 days">
<meta name="author" content="Gabriel Slayton">
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
        <h1>ISP: ${await getISP()}</h1>
        <script async
  src="https://js.stripe.com/v3/buy-button.js">
</script>

<stripe-buy-button
  buy-button-id="buy_btn_1NiO2oEPb7xHDOFyKoygn0os"
  publishable-key="pk_live_51Ne1OuEPb7xHDOFyN3seam6hy5oV2HPmDSFRbTcPuy0rKC3jqmj23Zys6dvbZ2xLWlbLlOrkzeQjA7wDqWCq3Ob600Z2VISyFc"
>
</stripe-buy-button>
        <div class="footer">
            <p>Gabriel Slayton - <a href="https://www.slaytons.net">Slayton\'s Technology Services</a></p>
    </body>
    </html>`);
}
);


async function saveLog(ip) {
    console.log(ip);
}

const port = process.env.PORT || 80;

app.listen(port, () => console.log(`Listening on port ${port}`));

