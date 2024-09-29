// app.js
import express from 'express';
// import cors from 'cors';
// import axios from 'axios'; 
import  fetch from 'node-fetch'; // Ensure you have node-fetch installed
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the 'public' directory

// Endpoint to fetch player data
app.get('/api/player/:tag', async (req, res) => {
    const playerTag = req.params.tag;
    const url = `https://api.brawlstars.com/v1/players/%23${playerTag}`;
    const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjU3M2EwNzQ2LWRlMGQtNGViNy04MTM5LTQxMmYzYjU4OGRkNyIsImlhdCI6MTcyNzU3NTc1OCwic3ViIjoiZGV2ZWxvcGVyL2Y1N2IyMGRjLTA1ZDYtODBmMy00ZGU2LWRkMGY0OWI3NmJkMSIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiMTY1LjkxLjEzLjIwMSJdLCJ0eXBlIjoiY2xpZW50In1dfQ.te-3gHzZ1wGL2tJrSmP5a6uHGhCSJCn0vIcb70ZZSVg1sry_l8AC9ahStfRel1iV5DxQDHFg5FJz88Er0PCKdg';

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching player data:', error);
        res.status(500).json({ error: 'Failed to fetch player data' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
