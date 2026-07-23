// Vercel Serverless Function for NASA APOD API Proxy
// Keeps process.env.NASA_API_KEY hidden securely on the server side

export default async function handler(req, res) {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    const { date, count, start_date, end_date } = req.query;

    let targetUrl = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;

    if (date) {
        targetUrl += `&date=${date}`;
    }
    if (count) {
        targetUrl += `&count=${count}`;
    }
    if (start_date && end_date) {
        targetUrl += `&start_date=${start_date}&end_date=${end_date}`;
    }

    try {
        const response = await fetch(targetUrl);
        const data = await response.json();
        
        // CORS & Cache Headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        
        return res.status(response.status).json(data);
    } catch (err) {
        console.error('Serverless Proxy Error:', err);
        return res.status(500).json({ error: 'Failed to fetch NASA API data', details: err.message });
    }
}
