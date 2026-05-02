# scripts/1_extract_keypoints.py
import os
import cv2
import mediapipe as mp
import numpy as np
from tqdm import tqdm

DATASET_PATH = 'videos'
OUTPUT_PATH = 'keypoints_data'
os.makedirs(OUTPUT_PATH, exist_ok=True)

mp_holistic = mp.solutions.holistic

def extract_keypoints(results):
    pose = np.array([[res.x, res.y, res.z] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*3)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, lh, rh])

for label in os.listdir(DATASET_PATH):
    label_path = os.path.join(DATASET_PATH, label)
    for video_file in tqdm(os.listdir(label_path)):
        video_path = os.path.join(label_path, video_file)
        cap = cv2.VideoCapture(video_path)
        sequence = []

        with mp_holistic.Holistic() as holistic:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = holistic.process(image)
                keypoints = extract_keypoints(results)
                sequence.append(keypoints)
            cap.release()

        sequence = np.array(sequence)
        np.save(os.path.join(OUTPUT_PATH, f"{label}_{video_file.split('.')[0]}.npy"), sequence)
