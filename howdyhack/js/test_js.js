const tf = require('@tensorflow/tfjs-node');
const Papa = require('papaparse');
const fs = require('fs');

// Load the data
const rawData = fs.readFileSync('raw_battlelogs.csv', 'utf8');
let df = Papa.parse(rawData, { header: true, dynamicTyping: true }).data;

// Convert battle_result to binary
df = df.map(row => ({
    ...row,
    battle_result: row.battle_result === 'victory' ? 1 : 0
}));

// Function to safely evaluate the string representation of battle_teams
function safeEval(x) {
    if (x === null || x === undefined) {
        return null;
    }
    try {
        return JSON.parse(x);
    } catch (error) {
        return null;
    }
}

// Extracting brawler IDs for each team
df = df.map(row => {
    const teams = safeEval(row.battle_teams);
    return {
        ...row,
        battle_team1_brawler1: teams && teams[0] && teams[0][0] ? teams[0][0].brawler.id : null,
        battle_team1_brawler2: teams && teams[0] && teams[0][1] ? teams[0][1].brawler.id : null,
        battle_team1_brawler3: teams && teams[0] && teams[0][2] ? teams[0][2].brawler.id : null,
        battle_team2_brawler1: teams && teams[1] && teams[1][0] ? teams[1][0].brawler.id : null,
        battle_team2_brawler2: teams && teams[1] && teams[1][1] ? teams[1][1].brawler.id : null,
        battle_team2_brawler3: teams && teams[1] && teams[1][2] ? teams[1][2].brawler.id : null
    };
});

// One-hot encoding for categorical variables
const categoricalColumns = ['event_mode', 'event_map', 'battle_mode', 'battle_type', 'battle_level_name'];
categoricalColumns.forEach(column => {
    const uniqueValues = [...new Set(df.map(row => row[column]))];
    uniqueValues.slice(1).forEach(value => {
        const columnName = `${column}_${value}`;
        df = df.map(row => ({
            ...row,
            [columnName]: row[column] === value ? 1 : 0
        }));
    });
});

// Select relevant features for the model
const features = [
    'battle_team1_brawler1', 'battle_team1_brawler2', 'battle_team1_brawler3',
    'battle_team2_brawler1', 'battle_team2_brawler2', 'battle_team2_brawler3'
].concat(Object.keys(df[0]).filter(col => 
    col.startsWith('event_mode_') || 
    col.startsWith('event_map_') || 
    col.startsWith('battle_mode_') || 
    col.startsWith('battle_type_') || 
    col.startsWith('battle_level_name_')
));

const X = df.map(row => features.map(feature => row[feature]));
const y = df.map(row => row.battle_result);

// Split the data
function trainTestSplit(X, y, testSize = 0.2, randomState = 42) {
    const shuffled = X.map((x, i) => ({ x, y: y[i] }))
        .sort(() => Math.random() - 0.5);
    const testLen = Math.floor(shuffled.length * testSize);
    const test = shuffled.slice(0, testLen);
    const train = shuffled.slice(testLen);
    return {
        X_train: train.map(item => item.x),
        X_test: test.map(item => item.x),
        y_train: train.map(item => item.y),
        y_test: test.map(item => item.y)
    };
}

const { X_train, X_test, y_train, y_test } = trainTestSplit(X, y);

// Standardize the data
function standardize(data) {
    const mean = data.reduce((acc, val) => acc.map((v, i) => v + val[i]), new Array(data[0].length).fill(0))
        .map(v => v / data.length);
    const std = data.reduce((acc, val) => acc.map((v, i) => v + Math.pow(val[i] - mean[i], 2)), new Array(data[0].length).fill(0))
        .map(v => Math.sqrt(v / (data.length - 1)));
    return {
        standardizedData: data.map(row => row.map((v, i) => (v - mean[i]) / std[i])),
        mean,
        std
    };
}

const { standardizedData: X_train_scaled, mean, std } = standardize(X_train);
const X_test_scaled = X_test.map(row => row.map((v, i) => (v - mean[i]) / std[i]));

// Build the Neural Network Model
const model = tf.sequential();
model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [X_train_scaled[0].length] }));
model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

// Compile the model
model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });

// Train the model
async function trainModel() {
    await model.fit(tf.tensor2d(X_train_scaled), tf.tensor1d(y_train), {
        epochs: 10,
        batchSize: 32,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
            }
        }
    });

    // Evaluate the model
    const [loss, accuracy] = model.evaluate(tf.tensor2d(X_test_scaled), tf.tensor1d(y_test));
    console.log(`Model Accuracy: ${accuracy.toFixed(2)}`);
}

trainModel();

function predictWinner(userInput) {
    // Prepare the input data for prediction
    const inputData = {
        battle_team1_brawler1: userInput.team1[0].brawler_id,
        battle_team1_brawler2: userInput.team1[1].brawler_id,
        battle_team1_brawler3: userInput.team1[2].brawler_id,
        battle_team2_brawler1: userInput.team2[0].brawler_id,
        battle_team2_brawler2: userInput.team2[1].brawler_id,
        battle_team2_brawler3: userInput.team2[2].brawler_id,
    };

    // One-hot encoding for event_map based on training data
    features.forEach(feature => {
        if (feature.startsWith('event_map_')) {
            inputData[feature] = feature === `event_map_${userInput.event_map}` ? 1 : 0;
        }
    });

    // Prepare input tensor
    const inputTensor = tf.tensor2d([features.map(feature => inputData[feature] || 0)]);

    // Standardize the input
    const standardizedInput = inputTensor.sub(tf.tensor1d(mean)).div(tf.tensor1d(std));

    // Make prediction
    const prediction = model.predict(standardizedInput);
    return prediction.dataSync()[0] >= 0.5 ? "Win" : "Lose";
}

// Example user inputs
const userInputs = [
    {
        event_map: 'Goldarm Gulch',
        team1: [
            { brawler_id: 16000021 },
            { brawler_id: 16000015 },
            { brawler_id: 16000019 }
        ],
        team2: [
            { brawler_id: 16000057 },
            { brawler_id: 16000046 },
            { brawler_id: 16000054 }
        ]
    },
    {
        event_map: 'Deep Diner',
        team1: [
            { brawler_id: 16000061 },
            { brawler_id: 16000012 },
            { brawler_id: 16000018 }
        ],
        team2: [
            { brawler_id: 16000011 },
            { brawler_id: 16000054 },
            { brawler_id: 16000007 }
        ]
    },
    {
        event_map: 'Sneaky Fields',
        team1: [
            { brawler_id: 16000004 },
            { brawler_id: 16000008 },
            { brawler_id: 16000010 }
        ],
        team2: [
            { brawler_id: 16000011 },
            { brawler_id: 16000030 },
            { brawler_id: 16000020 }
        ]
    }
];

userInputs.forEach((input, index) => {
    const result = predictWinner(input);
    console.log(`The predicted outcome for match ${index + 1} is: ${result}`);
});

