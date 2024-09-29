const express = require('express');
const bodyParser = require('body-parser');
const tf = require('@tensorflow/tfjs');
const csv = require('csv-parser');
const fs = require('fs');
const { StandardScaler } = require('scikitjs');

const app = express();
app.use(bodyParser.json());

let model;
let features = [];

// Load and preprocess the data
const loadData = () => {
    const results = [];
    fs.createReadStream('raw_battlelogs.csv')
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            const df = results.map(row => ({
                ...row,
                battle_result: row.battle_result === 'victory' ? 1 : 0,
                battle_teams: safeEval(row.battle_teams)
            })).filter(row => row.battle_teams);

            // Extract brawler IDs for each team
            df.forEach(row => {
                const teams = row.battle_teams;
                if (teams.length > 0) {
                    row.battle_team1_brawler1 = teams[0][0].brawler.id || null;
                    row.battle_team1_brawler2 = teams[0][1].brawler.id || null;
                    row.battle_team1_brawler3 = teams[0][2].brawler.id || null;
                }
                if (teams.length > 1) {
                    row.battle_team2_brawler1 = teams[1][0].brawler.id || null;
                    row.battle_team2_brawler2 = teams[1][1].brawler.id || null;
                    row.battle_team2_brawler3 = teams[1][2].brawler.id || null;
                }
            });

            // Prepare features for training
            features = ['battle_team1_brawler1', 'battle_team1_brawler2', 'battle_team1_brawler3',
                'battle_team2_brawler1', 'battle_team2_brawler2', 'battle_team2_brawler3'];

            const X = df.map(row => features.map(f => row[f]));
            const y = df.map(row => row.battle_result);

            // Split the data
            const [X_train, X_test, y_train, y_test] = splitData(X, y, 0.2);
            const scaler = new StandardScaler();
            const X_train_scaled = scaler.fit_transform(X_train);
            const X_test_scaled = scaler.transform(X_test);

            // Build the Neural Network Model
            model = tf.sequential();
            model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [X_train_scaled.shape[1]] }));
            model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
            model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

            // Compile the model
            model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });

            // Train the model
            await model.fit(tf.tensor2d(X_train_scaled), tf.tensor1d(y_train), { epochs: 10, batchSize: 32 });
            const evalResult = model.evaluate(tf.tensor2d(X_test_scaled), tf.tensor1d(y_test));
            evalResult[1].print();  // Print accuracy
        });
};

// Utility to safely evaluate string representations
const safeEval = (x) => {
    if (!x) return null;
    try {
        return JSON.parse(x);
    } catch (e) {
        return null;
    }
};

// Function to split data into training and test sets
const splitData = (X, y, testSize) => {
    const total = X.length;
    const testCount = Math.floor(total * testSize);
    const trainCount = total - testCount;

    const X_train = X.slice(0, trainCount);
    const X_test = X.slice(trainCount);
    const y_train = y.slice(0, trainCount);
    const y_test = y.slice(trainCount);

    return [X_train, X_test, y_train, y_test];
};

// Endpoint to predict the winner
app.post('/predict', async (req, res) => {
    const userInput = req.body;

    // Prepare the input data for prediction
    const inputData = {
        battle_team1_brawler1: userInput.team1[0].brawler_id,
        battle_team1_brawler2: userInput.team1[1].brawler_id,
        battle_team1_brawler3: userInput.team1[2].brawler_id,
        battle_team2_brawler1: userInput.team2[0].brawler_id,
        battle_team2_brawler2: userInput.team2[1].brawler_id,
        battle_team2_brawler3: userInput.team2[2].brawler_id,
    };

    // Create a DataFrame for input
    const inputDf = features.map(f => inputData[f] || 0);
    
    // Make prediction
    const prediction = model.predict(tf.tensor2d([inputDf]));
    const result = (await prediction.array())[0][0] > 0.5 ? "Win" : "Lose";
    res.json({ result });
});

// Load data and start the server
loadData().then(() => {
    app.listen(3001, () => {
        console.log('Server is running on port 3001');
    });
});
