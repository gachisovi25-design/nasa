// Node.js Local Development Server
// Automatically loads NASA_API_KEY from local .env file

const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Parse .env file locally
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const parts = trimmed.split('=');
                const key = parts[0] ? parts[0].trim() : '';
                const val = parts.slice(1).join('=').trim();
                if (key) {
                    process.env[key] = val;
                }
            }
        });
    }
}

loadEnv();

const PORT = process.env.PORT || 8000;
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = parsedUrl.pathname;

    // Handle Local API Proxy for /api/apod (Loads NASA_API_KEY from .env)
    if (pathname === '/api/apod') {
        const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
        const date = parsedUrl.searchParams.get('date');
        const count = parsedUrl.searchParams.get('count');
        const startDate = parsedUrl.searchParams.get('start_date');
        const endDate = parsedUrl.searchParams.get('end_date');

        let targetUrl = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;
        if (date) targetUrl += `&date=${date}`;
        if (count) targetUrl += `&count=${count}`;
        if (startDate && endDate) targetUrl += `&start_date=${startDate}&end_date=${endDate}`;

        https.get(targetUrl, (nasaRes) => {
            let body = '';
            nasaRes.on('data', chunk => body += chunk);
            nasaRes.on('end', () => {
                res.writeHead(nasaRes.statusCode, {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(body);
            });
        }).on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'NASA Fetch Failed', details: err.message }));
        });
        return;
    }

    // Serve Static Files
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 Not Found</h1>');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 [Local Server] http://localhost:${PORT} 에서 실행 중`);
    console.log(`🔑 [.env 적용 확인] NASA_API_KEY: ${process.env.NASA_API_KEY ? process.env.NASA_API_KEY.substring(0, 6) + '...' : '미설정(DEMO_KEY)'}`);
});
