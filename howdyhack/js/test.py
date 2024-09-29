import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import ast
from tensorflow import keras
from tensorflow.keras import layers

# Load the data
df = pd.read_csv('raw_battlelogs.csv')

# Convert battle_result to binary
df['battle_result'] = df['battle_result'].apply(lambda x: 1 if x == 'victory' else 0)

# Function to safely evaluate the string representation of battle_teams
def safe_eval(x):
    if pd.isna(x):  # Check for NaN
        return None  # or return an empty structure, e.g., [[], []]
    try:
        return ast.literal_eval(x)
    except (ValueError, SyntaxError):
        return None  # or return an empty structure

# Extracting brawler IDs for each team
teams = df['battle_teams'].apply(safe_eval)
df['battle_team1_brawler1'] = teams.apply(lambda x: x[0][0]['brawler']['id'] if x and len(x) > 0 and len(x[0]) > 0 else None)
df['battle_team1_brawler2'] = teams.apply(lambda x: x[0][1]['brawler']['id'] if x and len(x) > 0 and len(x[0]) > 1 else None)
df['battle_team1_brawler3'] = teams.apply(lambda x: x[0][2]['brawler']['id'] if x and len(x) > 0 and len(x[0]) > 2 else None)
df['battle_team2_brawler1'] = teams.apply(lambda x: x[1][0]['brawler']['id'] if x and len(x) > 1 and len(x[1]) > 0 else None)
df['battle_team2_brawler2'] = teams.apply(lambda x: x[1][1]['brawler']['id'] if x and len(x) > 1 and len(x[1]) > 1 else None)
df['battle_team2_brawler3'] = teams.apply(lambda x: x[1][2]['brawler']['id'] if x and len(x) > 1 and len(x[1]) > 2 else None)

# One-hot encoding for categorical variables
df = pd.get_dummies(df, columns=['event_mode', 'event_map', 'battle_mode', 'battle_type', 'battle_level_name'], drop_first=True)

# Select relevant features for the model (including brawler IDs)
features = [
    'battle_team1_brawler1', 'battle_team1_brawler2', 'battle_team1_brawler3',
    'battle_team2_brawler1', 'battle_team2_brawler2', 'battle_team2_brawler3'
] + [col for col in df.columns if col.startswith('event_mode_') or col.startswith('event_map_') or col.startswith('battle_mode_') or col.startswith('battle_type_') or col.startswith('battle_level_name_')]

X = df[features]
y = df['battle_result']

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Build the Neural Network Model
model = keras.Sequential([
    layers.Dense(64, activation='relu', input_shape=(X_train.shape[1],)),  # First hidden layer
    layers.Dense(32, activation='relu'),                                   # Second hidden layer
    layers.Dense(1, activation='sigmoid')                                 # Output layer for binary classification
])

# Compile the model
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

# Train the model
model.fit(X_train, y_train, epochs=10, batch_size=32)

# Evaluate the model
loss, accuracy = model.evaluate(X_test, y_test)
print(f'Model Accuracy: {accuracy:.2f}')

def predict_winner(user_input):
    # Prepare the input data for prediction
    input_data = {
        'battle_team1_brawler1': user_input['team1'][0]['brawler_id'],
        'battle_team1_brawler2': user_input['team1'][1]['brawler_id'],
        'battle_team1_brawler3': user_input['team1'][2]['brawler_id'],
        'battle_team2_brawler1': user_input['team2'][0]['brawler_id'],
        'battle_team2_brawler2': user_input['team2'][1]['brawler_id'],
        'battle_team2_brawler3': user_input['team2'][2]['brawler_id'],
    }

    # One-hot encoding for event_map based on training data
    input_df = pd.DataFrame([input_data])
    input_df['event_map'] = user_input['event_map']
    input_df = pd.get_dummies(input_df, columns=['event_map'], drop_first=True)

    # Align input with model's expected feature columns
    input_df = input_df.reindex(columns=X.columns, fill_value=0)
    
    # Make prediction
    prediction = model.predict(input_df)
    return "Win" if prediction[0] == 1 else "Lose"

# Example user input
user_input = {
    'event_map': 'Goldarm Gulch',
    'team1': [
        {'brawler_id': 16000021},
        {'brawler_id': 16000015},
        {'brawler_id': 16000019}
    ],
    'team2': [
        {'brawler_id': 16000057},
        {'brawler_id': 16000046},
        {'brawler_id': 16000054}
    ]
}

result = predict_winner(user_input)
print(f'The predicted outcome for the match is: {result}')

user_input = {
    'event_map': 'Deep Diner',
    'team1': [
        {'brawler_id': 16000061},
        {'brawler_id': 16000012},
        {'brawler_id': 16000018}
    ],
    'team2': [
        {'brawler_id': 16000011},
        {'brawler_id': 16000054},
        {'brawler_id': 16000007}
    ]
}

result = predict_winner(user_input)
print(f'The predicted outcome for the match is: {result}')

user_input = {
    'event_map': 'Sneaky Fields',
    'team1': [
        {'brawler_id': 16000004},
        {'brawler_id': 16000008},
        {'brawler_id': 16000010}
    ],
    'team2': [
        {'brawler_id': 16000011},
        {'brawler_id': 16000030},
        {'brawler_id': 16000020}
    ]
}

result = predict_winner(user_input)
print(f'The predicted outcome for the match is: {result}')
model.save("model.keras")

