import cv2
import numpy as np
import os

# === Config ===
KEYPOINTS_FOLDER = "keypoints_data"
WINDOW_NAME = "Sign Animation"
FRAME_DELAY = 0.05  # seconds
WINDOW_SIZE = (720, 480)

# === Functions ===

def get_latest_keypoint_file(word):
    matches = [f for f in os.listdir(KEYPOINTS_FOLDER) if f.startswith(word)]
    if not matches:
        return None
    matches.sort(reverse=True)
    return os.path.join(KEYPOINTS_FOLDER, matches[0])

def draw_keypoints_on_canvas(keypoints_flat, image_size=WINDOW_SIZE):
    canvas = np.zeros((image_size[1], image_size[0], 3), dtype=np.uint8)

    if keypoints_flat.size == 225:
        keypoints = keypoints_flat.reshape((75, 3))  # 75 keypoints × 3
    else:
        print("[!] Unexpected keypoints shape:", keypoints_flat.shape)
        return canvas

    for kp in keypoints:
        x, y = kp[0], kp[1]
        cx, cy = int(x * image_size[0]), int(y * image_size[1])
        if 0 <= cx < image_size[0] and 0 <= cy < image_size[1]:
            cv2.circle(canvas, (cx, cy), 4, (0, 255, 0), -1)

    return canvas

def play_keypoints_file_in_loop(filepath):
    data = np.load(filepath)  # shape: (n_frames, 225)
    print("[i] Press ESC to stop animation loop")

    while True:
        for frame in data:
            canvas = draw_keypoints_on_canvas(frame)
            cv2.imshow(WINDOW_NAME, canvas)
            key = cv2.waitKey(int(FRAME_DELAY * 1000))
            if key == 27:  # ESC to break loop
                return

# === Main ===

if __name__ == "__main__":
    while True:
        word = input("\nEnter a word to animate (or type 'exit' to quit): ").strip().lower()
        if word == 'exit':
            break

        keypoint_file = get_latest_keypoint_file(word)
        if keypoint_file:
            print(f"Playing: {keypoint_file}")
            play_keypoints_file_in_loop(keypoint_file)
        else:
            print(f"[!] No keypoints found for word: {word}")

    cv2.destroyAllWindows()
