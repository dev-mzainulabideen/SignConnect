# scripts/3_realtime_prediction.py
import cv2
import numpy as np
import mediapipe as mp
from tensorflow.keras.models import load_model
import pyttsx3
import pickle

# Load model and label map
model = load_model('sign_model.h5')
with open('label_map.pkl', 'rb') as f:
    label_map = pickle.load(f)

# Initialize components
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils
engine = pyttsx3.init()
sequence = []

def extract_keypoints(results):
    pose = np.array([[res.x, res.y, res.z] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*3)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, lh, rh])

# Start camera
cap = cv2.VideoCapture(0)

with mp_holistic.Holistic(static_image_mode=False, model_complexity=1) as holistic:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Resize for display
        frame = cv2.flip(frame, 1)
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = holistic.process(image_rgb)

        # Extract and predict
        keypoints = extract_keypoints(results)
        sequence.append(keypoints)
        sequence = sequence[-30:]

        if len(sequence) == 30:
            res = model.predict(np.expand_dims(sequence, axis=0))[0]
            confidence = np.max(res)
            pred_class = np.argmax(res)
            word = label_map[pred_class]

            if confidence > 0.85:
                print(f"Detected: {word} ({confidence:.2f})")
                engine.say(word)
                engine.runAndWait()
                sequence = []

        # Draw original frame
        original_frame = frame.copy()

        # Create a black image for skeleton
        black_image = np.zeros_like(frame)
        if results.pose_landmarks or results.left_hand_landmarks or results.right_hand_landmarks:
            mp_drawing.draw_landmarks(black_image, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS)
            mp_drawing.draw_landmarks(black_image, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
            mp_drawing.draw_landmarks(black_image, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS)

        # Combine both views horizontally
        combined_view = np.hstack((original_frame, black_image))

        cv2.imshow('Sign Detection | Left: Camera | Right: Skeleton', combined_view)

        # Quit
        if cv2.waitKey(10) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
