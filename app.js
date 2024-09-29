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
    const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6Ijg0MDE0ZjI4LTBmNzMtNDRhYy1iMDc3LTlmYTAwODVmNjkwZSIsImlhdCI6MTcyNzU4ODU2Mywic3ViIjoiZGV2ZWxvcGVyL2Y1N2IyMGRjLTA1ZDYtODBmMy00ZGU2LWRkMGY0OWI3NmJkMSIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiMTY1LjkxLjEzLjIwMSIsIjE5OC45MC4xMDkuMTE2Il0sInR5cGUiOiJjbGllbnQifV19.1ONmPvru7-vJeV_kgTxI8FeRkfSOpo778Rpw4TD8FQnQ6V2Tiue-6VdPlQRfWZd8u7pTUaP27dc99hZ7WH2y3w';

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

app.get('/api/events/rotation', async (req, res) => {
    const url = 'https://api.brawlstars.com/v1/events/rotation';
    const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6Ijg0MDE0ZjI4LTBmNzMtNDRhYy1iMDc3LTlmYTAwODVmNjkwZSIsImlhdCI6MTcyNzU4ODU2Mywic3ViIjoiZGV2ZWxvcGVyL2Y1N2IyMGRjLTA1ZDYtODBmMy00ZGU2LWRkMGY0OWI3NmJkMSIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiMTY1LjkxLjEzLjIwMSIsIjE5OC45MC4xMDkuMTE2Il0sInR5cGUiOiJjbGllbnQifV19.1ONmPvru7-vJeV_kgTxI8FeRkfSOpo778Rpw4TD8FQnQ6V2Tiue-6VdPlQRfWZd8u7pTUaP27dc99hZ7WH2y3w'; // Replace with your actual API key

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
        res.json(data); // Send the data to the frontend
    } catch (error) {
        console.error('Error fetching map rotation data:', error);
        res.status(500).json({ error: 'Failed to fetch map rotation data' });
    }
});

// Endpoint to handle selected map
app.post('/api/select-map', (req, res) => {
    const { map } = req.body; // Get the mapId from the request body
    console.log(`Map selected: ${map}`);
    
    // Here, you would save the mapId to your database or perform whatever action is needed
    // For this example, we'll just send a response back

    res.status(200).json({ message: 'Map saved successfully!', mapId: map });
});

// Endpoint to fetch brawlers
app.get('/api/brawlers', async (req, res) => {
    const url = 'https://api.brawlstars.com/v1/brawlers';
    const token ='eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6Ijg0MDE0ZjI4LTBmNzMtNDRhYy1iMDc3LTlmYTAwODVmNjkwZSIsImlhdCI6MTcyNzU4ODU2Mywic3ViIjoiZGV2ZWxvcGVyL2Y1N2IyMGRjLTA1ZDYtODBmMy00ZGU2LWRkMGY0OWI3NmJkMSIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiMTY1LjkxLjEzLjIwMSIsIjE5OC45MC4xMDkuMTE2Il0sInR5cGUiOiJjbGllbnQifV19.1ONmPvru7-vJeV_kgTxI8FeRkfSOpo778Rpw4TD8FQnQ6V2Tiue-6VdPlQRfWZd8u7pTUaP27dc99hZ7WH2y3w'; // Replace with your actual API key
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
        if (!data.items || !Array.isArray(data.items)) {
            throw new Error('Invalid data structure: items array is missing or not an array');
        }
        const brawlers = data.items.map(brawler => ({
            id: brawler.id,
            name: brawler.name,
            image: `https://cdn.brawlify.com/brawlers/borderless/${brawler.id}.png` // Update with the correct URL for brawler images
        }));

        res.json(brawlers);
    } catch (error) {
        console.error('Error fetching brawlers:', error);
        res.status(500).json({ error: 'Failed to fetch brawlers' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
