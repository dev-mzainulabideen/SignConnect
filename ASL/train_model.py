import os
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
import pickle

DATA_PATH = 'keypoints_data'
sequences, labels = [], []
label_map = {}
reverse_map = {}

# Build label map
words = sorted(set(file.split('_')[0] for file in os.listdir(DATA_PATH)))
for i, word in enumerate(words):
    label_map[word] = i
    reverse_map[i] = word

with open('label_map.pkl', 'wb') as f:
    pickle.dump(reverse_map, f)

# Process all data files
for file in os.listdir(DATA_PATH):
    label = file.split('_')[0]
    data = np.load(os.path.join(DATA_PATH, file))
    n_frames = data.shape[0]

    # Skip videos with fewer than 30 frames
    if n_frames < 30:
        continue

    # Slice video into overlapping sequences of 30 frames
    for start in range(0, n_frames - 30 + 1, 5):  # step=5 for overlap; change as needed
        segment = data[start:start + 30]
        sequences.append(segment)
        labels.append(label_map[label])

X = np.array(sequences)
y = to_categorical(labels).astype(int)

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Build model
model = Sequential()
model.add(LSTM(64, return_sequences=True, activation='relu', input_shape=(30, X.shape[2])))
model.add(LSTM(128, return_sequences=False, activation='relu'))
model.add(Dense(64, activation='relu'))
model.add(Dense(len(label_map), activation='softmax'))

# Compile & train
model.compile(optimizer='Adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(X_train, y_train, epochs=50, validation_data=(X_test, y_test))

# Save model
model.save('sign_model.h5')
