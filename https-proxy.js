const fs = require('fs');
const http = require('http');
const https = require('https');

const options = {
    key: fs.readFileSync('192.168.1.10-key.pem'),
    cert: fs.readFileSync('192.168.1.10.pem'),
};

https.createServer(options, (req, res) => {
    const proxyReq = http.request(
        {
            host: '127.0.0.1',
            port: 8000,
            path: req.url,
            method: req.method,
            headers: req.headers,
        },
        (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        },
    );
    req.pipe(proxyReq);
}).listen(8443, '0.0.0.0', () => {
    console.log('HTTPS proxy running on https://192.168.1.10:8443');
});
