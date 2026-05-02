import os
import numpy as np
import cv2

# stickman.py
# Utilities to draw a simple stick avatar from MediaPipe Holistic keypoints.
# Assumes keypoints vector layout: [pose(33*3), left_hand(21*3), right_hand(21*3)]


POSE_LANDMARKS = 33
HAND_LANDMARKS = 21


def vector_to_landmarks(keypoint_vector, image_size=(640, 480)):
    """Convert a flat keypoint vector into dictionaries of 2D pixel coordinates.

    keypoint_vector: 1D numpy array with length 33*3 + 21*3 + 21*3
    image_size: (width, height) to map normalized [0,1] coords to pixels

    Returns: dict with 'pose': Nx2 array, 'left_hand': Mx2 array, 'right_hand': Mx2 array
    """
    w, h = image_size
    expected_len = (POSE_LANDMARKS + 2 * HAND_LANDMARKS) * 3
    if keypoint_vector.size != expected_len:
        raise ValueError(f"Unexpected keypoint vector length: {keypoint_vector.size}, expected {expected_len}")

    arr = keypoint_vector.reshape(-1, 3)
    pose = arr[:POSE_LANDMARKS, :2]
    lh = arr[POSE_LANDMARKS:POSE_LANDMARKS + HAND_LANDMARKS, :2]
    rh = arr[POSE_LANDMARKS + HAND_LANDMARKS:, :2]

    # Convert normalized coords to pixels
    def to_pixels(points):
        pts = np.copy(points)
        pts[:, 0] = pts[:, 0] * w  # x
        pts[:, 1] = pts[:, 1] * h  # y
        return pts.astype(int)

    return {
        'pose': to_pixels(pose),
        'left_hand': to_pixels(lh),
        'right_hand': to_pixels(rh),
    }


# Simple connections to draw stick figure using pose landmarks indices (MediaPipe ordering)
# We'll draw a subset: shoulders, elbows, wrists, hips, knees, ankles, and head (nose)
POSE_CONNECTIONS = [
    (0, 1),  # nose -> left eye (approx head)
    (11, 12),  # left shoulder -> right shoulder
    (11, 13),  # left shoulder -> left elbow
    (13, 15),  # left elbow -> left wrist
    (12, 14),  # right shoulder -> right elbow
    (14, 16),  # right elbow -> right wrist
    (11, 23),  # left shoulder -> left hip
    (12, 24),  # right shoulder -> right hip
    (23, 24),  # left hip -> right hip
    (23, 25),  # left hip -> left knee
    (25, 27),  # left knee -> left ankle
    (24, 26),  # right hip -> right knee
    (26, 28),  # right knee -> right ankle
]


HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (0, 9), (9, 10), (10, 11), (11, 12),
    (0, 13), (13, 14), (14, 15), (15, 16),
    (0, 17), (17, 18), (18, 19), (19, 20),
]


def draw_keypoints_image(landmarks, image_size=(640, 480), bg_color=(0, 0, 0)):
    """Return an image (BGR) with the stick avatar drawn from landmarks.

    landmarks: dict from vector_to_landmarks
    """
    w, h = image_size
    img = np.full((h, w, 3), bg_color, dtype=np.uint8)

    pose = landmarks.get('pose')
    lh = landmarks.get('left_hand')
    rh = landmarks.get('right_hand')

    # draw pose connections
    for a, b in POSE_CONNECTIONS:
        pa = tuple(pose[a])
        pb = tuple(pose[b])
        cv2.line(img, pa, pb, (0, 255, 0), 2)

    # draw joints
    for (x, y) in pose:
        cv2.circle(img, (int(x), int(y)), 4, (0, 200, 200), -1)

    # draw hands
    def draw_hand(hand_pts, color=(0, 120, 255)):
        for (x, y) in hand_pts:
            cv2.circle(img, (int(x), int(y)), 3, color, -1)
        for a, b in HAND_CONNECTIONS:
            pa = tuple(hand_pts[a])
            pb = tuple(hand_pts[b])
            cv2.line(img, pa, pb, color, 1)

    if lh is not None:
        draw_hand(lh, (255, 0, 0))
    if rh is not None:
        draw_hand(rh, (0, 0, 255))

    return img


def draw_human_2d(landmarks, image_size=(640, 480), bg_color=(255, 255, 255)):
    """Draw a filled, human-like 2D avatar from 2D landmarks.

    landmarks: dict with 'pose', 'left_hand', 'right_hand' as Nx2 pixel arrays.
    """
    w, h = image_size
    img = np.full((h, w, 3), bg_color, dtype=np.uint8)

    pose = landmarks.get('pose')
    lh = landmarks.get('left_hand')
    rh = landmarks.get('right_hand')

    # Helper: draw capsule (rounded rectangle) between two points with thickness
    def draw_capsule(img, a, b, thickness, color):
        a = np.array(a).astype(float)
        b = np.array(b).astype(float)
        v = b - a
        L = np.linalg.norm(v)
        if L < 1e-3:
            cv2.circle(img, tuple(a.astype(int)), int(thickness/2), color, -1)
            return
        n = np.array([-v[1], v[0]]) / (np.linalg.norm(v) + 1e-6)
        p1 = a + n * (thickness/2)
        p2 = a - n * (thickness/2)
        p3 = b - n * (thickness/2)
        p4 = b + n * (thickness/2)
        poly = np.array([p1, p2, p3, p4], dtype=np.int32)
        cv2.fillConvexPoly(img, poly, color)
        cv2.circle(img, tuple(a.astype(int)), int(thickness/2), color, -1)
        cv2.circle(img, tuple(b.astype(int)), int(thickness/2), color, -1)

    # Draw torso polygon from shoulders->hips
    try:
        left_sh = pose[11]
        right_sh = pose[12]
        left_hip = pose[23]
        right_hip = pose[24]
        torso_poly = np.array([left_sh, right_sh, right_hip, left_hip], dtype=np.int32)
        cv2.fillConvexPoly(img, torso_poly, (200, 190, 180))
    except Exception:
        pass

    # Limb helper to draw chain of joints with capsules
    def draw_chain(points, base_thickness, color):
        if points is None or points.shape[0] < 2:
            return
        # scale thickness by average segment length
        seg_lens = [np.linalg.norm(points[i+1]-points[i]) for i in range(len(points)-1)]
        avg_len = max(np.mean(seg_lens), 1.0)
        thickness = int(np.clip(base_thickness * (avg_len / 60.0 + 0.5), 6, 60))
        for i in range(len(points)-1):
            draw_capsule(img, points[i], points[i+1], thickness, color)

    # Arms
    try:
        left_arm = np.vstack([pose[11], pose[13], pose[15]])
        right_arm = np.vstack([pose[12], pose[14], pose[16]])
        draw_chain(left_arm, base_thickness=18, color=(180,140,120))
        draw_chain(right_arm, base_thickness=18, color=(180,140,120))
    except Exception:
        pass

    # Legs
    try:
        left_leg = np.vstack([pose[23], pose[25], pose[27]])
        right_leg = np.vstack([pose[24], pose[26], pose[28]])
        draw_chain(left_leg, base_thickness=20, color=(140,160,200))
        draw_chain(right_leg, base_thickness=20, color=(140,160,200))
    except Exception:
        pass

    # Head: ellipse using nose and eyes
    try:
        nose = pose[0]
        left_eye = pose[1]
        right_eye = pose[2]
        eye_dist = np.linalg.norm(left_eye - right_eye)
        head_w = int(max(eye_dist * 2.5, 30))
        head_h = int(head_w * 1.2)
        eye_center = (left_eye + right_eye) / 2.0
        head_center = (nose + eye_center) / 2.0
        cv2.ellipse(img, tuple(head_center.astype(int)), (head_w, head_h), 0, 0, 360, (220,200,180), -1)
        # eyes
        eye_y = int(head_center[1] - head_h*0.15)
        ex_offset = int(eye_dist*0.4)
        cv2.circle(img, (int(head_center[0]-ex_offset), eye_y), max(3, int(eye_dist*0.12)), (30,30,30), -1)
        cv2.circle(img, (int(head_center[0]+ex_offset), eye_y), max(3, int(eye_dist*0.12)), (30,30,30), -1)
        # mouth
        mouth_y = int(head_center[1] + head_h*0.25)
        cv2.ellipse(img, (int(head_center[0]), mouth_y), (int(head_w*0.3), int(head_h*0.12)), 0, 0, 180, (120,40,60), 3)
    except Exception:
        pass

    # Hands: draw fingers as small capsules from wrist toward finger tips if available
    def draw_fingers(hand_pts, wrist_pt, color=(200,180,160)):
        if hand_pts is None or hand_pts.shape[0] == 0:
            return
        # mediapipe hand landmarks: 0 wrist, 1-4 thumb, 5-8 index, 9-12 middle, 13-16 ring, 17-20 pinky
        wrist = hand_pts[0] if hand_pts.shape[0] > 0 else wrist_pt
        finger_tips_idx = [4, 8, 12, 16, 20]
        for idx in finger_tips_idx:
            if idx < hand_pts.shape[0]:
                tip = hand_pts[idx]
                draw_capsule(img, wrist, tip, thickness=8, color=color)

    try:
        draw_fingers(lh, pose[15], color=(200,160,140))
        draw_fingers(rh, pose[16], color=(200,160,140))
    except Exception:
        pass

    # subtle shading / outline
    try:
        # outline torso
        cv2.polylines(img, [torso_poly], True, (100,100,100), 1)
    except Exception:
        pass

    return img


def smooth_sequence(sequence, alpha=0.6):
    """Exponential smoothing for a sequence of frames of shape (N, vector_len). Returns same shape."""
    if sequence.shape[0] == 0:
        return sequence
    smoothed = np.copy(sequence).astype(float)
    prev = smoothed[0]
    for i in range(1, smoothed.shape[0]):
        prev = alpha * smoothed[i] + (1 - alpha) * prev
        smoothed[i] = prev
    return smoothed



def save_stickman_from_vector(keypoint_vector, out_path, image_size=(640, 480), bg_color=(0, 0, 0)):
    landmarks = vector_to_landmarks(keypoint_vector, image_size=image_size)
    img = draw_keypoints_image(landmarks, image_size=image_size, bg_color=bg_color)
    cv2.imwrite(out_path, img)


def render_sequence_to_mp4(sequence, out_path, fps=10, image_size=(640, 480), bg_color=(0, 0, 0)):
    """Render a sequence (N x vector_len) to an MP4 file at given fps."""
    w, h = image_size
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(out_path, fourcc, fps, (w, h))

    for frame_vec in sequence:
        try:
            landmarks = vector_to_landmarks(frame_vec, image_size=(w, h))
            img = draw_keypoints_image(landmarks, image_size=(w, h), bg_color=bg_color)
        except Exception:
            img = np.full((h, w, 3), bg_color, dtype=np.uint8)
        writer.write(img)

    writer.release()


def vector_to_landmarks_3d(keypoint_vector):
    """Return pose, left_hand, right_hand as Nx3 arrays (x,y,z normalized).

    Note: x,y in [0,1], z is as produced by MediaPipe (can be negative)."""
    expected_len = (POSE_LANDMARKS + 2 * HAND_LANDMARKS) * 3
    if keypoint_vector.size != expected_len:
        raise ValueError(f"Unexpected keypoint vector length: {keypoint_vector.size}, expected {expected_len}")
    arr = keypoint_vector.reshape(-1, 3)
    pose = arr[:POSE_LANDMARKS, :3]
    lh = arr[POSE_LANDMARKS:POSE_LANDMARKS + HAND_LANDMARKS, :3]
    rh = arr[POSE_LANDMARKS + HAND_LANDMARKS:, :3]
    return {'pose': pose, 'left_hand': lh, 'right_hand': rh}


def rotate_points(points, rx=0.0, ry=0.0, rz=0.0):
    """Rotate Nx3 points by rx,ry,rz (radians) around origin."""
    if points.size == 0:
        return points
    # Rotation matrices
    sx, cx = np.sin(rx), np.cos(rx)
    sy, cy = np.sin(ry), np.cos(ry)
    sz, cz = np.sin(rz), np.cos(rz)

    Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])

    R = Rz @ Ry @ Rx
    return (R @ points.T).T


def project_points(points3d, image_size=(640, 480), f=1.0, z_offset=0.5):
    """Project normalized 3D points into 2D pixel coordinates using simple perspective.

    points3d: Nx3 with x,y in [0,1], z arbitrary (MediaPipe). Returns Nx2 pixel ints and depth array.
    """
    w, h = image_size
    if points3d.size == 0:
        return np.empty((0, 2), dtype=int), np.empty((0,), dtype=float)

    pts = np.copy(points3d)

    # Treat MediaPipe z: typically negative in front of camera; invert to get positive depth
    pts[:, 2] = -pts[:, 2]

    # For projection we'll center and scale later; here compute normalized projections
    denom = pts[:, 2] + z_offset
    denom = np.where(denom <= 0.01, 0.01, denom)
    x_proj = (pts[:, 0] * f) / denom
    y_proj = (pts[:, 1] * f) / denom

    # Return normalized projection (center at 0, scale relative) so caller can center/scale
    pixels_norm = np.vstack([x_proj, y_proj]).T
    return pixels_norm, denom  # return normalized coords and depth

    pixels = np.vstack([x_pix, y_pix]).T
    pixels = np.nan_to_num(pixels, nan=0.0, posinf=0.0, neginf=0.0)
    return pixels.astype(int), denom  # denom as proxy depth


def draw_3d_frame(landmarks3d, image_size=(640, 480), rotation=(0.0, 0.0, 0.0), bg_color=(0, 0, 0)):
    """Render a single 3D frame: apply rotation, project, depth-sort segments, draw with depth shading."""
    w, h = image_size
    img = np.full((h, w, 3), bg_color, dtype=np.uint8)

    pose3d = landmarks3d.get('pose')
    lh3d = landmarks3d.get('left_hand')
    rh3d = landmarks3d.get('right_hand')

    # Center 3D points around origin before rotation: subtract 0.5 from x,y and mean z
    def prep_and_rotate(pts):
        if pts is None or pts.size == 0:
            return pts
        pts_local = np.copy(pts)
        pts_local[:, 0] -= 0.5
        pts_local[:, 1] -= 0.5
        # keep z as-is (will be inverted in project)
        pts_rot = rotate_points(pts_local, rx=rotation[0], ry=rotation[1], rz=rotation[2])
        # move back to normalized space x,y
        pts_rot[:, 0] += 0.5
        pts_rot[:, 1] += 0.5
        return pts_rot

    pose_r = prep_and_rotate(pose3d)
    lh_r = prep_and_rotate(lh3d)
    rh_r = prep_and_rotate(rh3d)

    # Project (get normalized projections)
    pose_norm, pose_depth = project_points(pose_r, image_size=image_size)
    lh_norm, lh_depth = project_points(lh_r, image_size=image_size)
    rh_norm, rh_depth = project_points(rh_r, image_size=image_size)

    # Combine all visible normalized points to compute centering and scaling
    all_norms = np.vstack([pose_norm, lh_norm, rh_norm]) if (pose_norm.size or lh_norm.size or rh_norm.size) else np.empty((0,2))
    if all_norms.size == 0:
        return img

    # Compute bounding box in normalized projected space
    min_xy = np.min(all_norms, axis=0)
    max_xy = np.max(all_norms, axis=0)
    center_norm = (min_xy + max_xy) / 2.0
    size_norm = np.maximum(max_xy - min_xy, 1e-6)

    # Determine scale so the figure fits the image with padding
    w, h = image_size
    padding = 0.8  # fraction of image to fill
    scale_x = (w * padding) / (size_norm[0] * w) if size_norm[0] != 0 else 1.0
    scale_y = (h * padding) / (size_norm[1] * h) if size_norm[1] != 0 else 1.0
    scale = min(scale_x, scale_y)

    # Convert normalized projected coordinates to pixels using computed center and scale
    def norm_to_pixels(norm_pts):
        if norm_pts.size == 0:
            return np.empty((0,2), dtype=int)
        # shift so center_norm -> 0
        shifted = norm_pts - center_norm
        x_pix = (w / 2.0) + shifted[:,0] * scale * w
        y_pix = (h / 2.0) + shifted[:,1] * scale * h
        pixels = np.vstack([x_pix, y_pix]).T
        return np.nan_to_num(pixels, nan=0.0, posinf=0.0, neginf=0.0).astype(int)

    pose2d = norm_to_pixels(pose_norm)
    lh2d = norm_to_pixels(lh_norm)
    rh2d = norm_to_pixels(rh_norm)

    # Build drawable segments with depth (average depth) so we can depth-sort
    segments = []

    def add_segments(points2d, points3d_depth, connections, color=(0, 255, 0), thickness=2):
        for a, b in connections:
            if a >= points2d.shape[0] or b >= points2d.shape[0]:
                continue
            pa = tuple(points2d[a])
            pb = tuple(points2d[b])
            avg_depth = float((points3d_depth[a] + points3d_depth[b]) / 2.0)
            segments.append((avg_depth, pa, pb, color, thickness))

    add_segments(pose2d, pose_depth, POSE_CONNECTIONS, color=(0, 255, 0), thickness=3)
    add_segments(lh2d, lh_depth, HAND_CONNECTIONS, color=(255, 0, 0), thickness=2)
    add_segments(rh2d, rh_depth, HAND_CONNECTIONS, color=(0, 0, 255), thickness=2)

    # Sort by depth (draw farthest first)
    segments.sort(key=lambda s: s[0], reverse=False)

    # Draw segments with shading based on depth
    if len(segments) > 0:
        min_d = min(s[0] for s in segments)
        max_d = max(s[0] for s in segments)
    else:
        min_d = max_d = 0.0

    for depth, pa, pb, color, thickness in segments:
        # map depth to brightness: nearer -> brighter
        if max_d - min_d > 1e-6:
            t = (depth - min_d) / (max_d - min_d)
        else:
            t = 0.5
        bright = int(255 * (1.0 - np.clip(t, 0.0, 1.0)))
        shaded = tuple(int(c * (0.3 + 0.7 * (bright / 255.0))) for c in color)
        cv2.line(img, pa, pb, shaded, thickness)

    # draw joints for pose
    for (x, y) in pose2d:
        cv2.circle(img, (int(x), int(y)), 4, (0, 200, 200), -1)

    return img


def render_sequence_to_mp4_3d(sequence, out_path, fps=60, image_size=(640, 480), bg_color=(0, 0, 0), rotation_speed=(0.0, 0.02, 0.0)):
    """Render sequence to MP4 using 3D projection; rotation_speed is radians/frame for (rx,ry,rz)."""
    w, h = image_size
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(out_path, fourcc, fps, (w, h))

    rx = ry = rz = 0.0
    for frame_vec in sequence:
        landmarks3d = vector_to_landmarks_3d(frame_vec)
        img = draw_3d_frame(landmarks3d, image_size=image_size, rotation=(rx, ry, rz), bg_color=bg_color)
        writer.write(img)
        rx += rotation_speed[0]
        ry += rotation_speed[1]
        rz += rotation_speed[2]

    writer.release()


if __name__ == '__main__':
    # Simple CLI: find first .npy in keypoints_data and draw first frame
    base = os.path.dirname(__file__)
    data_dir = os.path.join(base, 'keypoints_data')
    if not os.path.isdir(data_dir):
        print('keypoints_data directory not found in project root')
        raise SystemExit(1)

    npy_files = [f for f in os.listdir(data_dir) if f.endswith('.npy')]
    if not npy_files:
        print('No .npy files found in keypoints_data')
        raise SystemExit(1)

    sample = np.load(os.path.join(data_dir, npy_files[0]))

    # If sequence length > 1, render animation
    if sample.shape[0] > 1:
        out2d = os.path.join(base, 'stickman_test.mp4')
        out3d = os.path.join(base, 'stickman_test_3d.mp4')
        outhuman = os.path.join(base, 'stickman_test_human.mp4')
        fps = 60
        w, h = 640, 480
        # 2D animation (flat)
        render_sequence_to_mp4(sample, out2d, fps=fps, image_size=(w, h), bg_color=(0, 0, 0))
        print('Saved 2D animation', out2d, 'at', fps, 'fps')
        # 3D animation without rotation (static 3D view)
        render_sequence_to_mp4_3d(sample, out3d, fps=fps, image_size=(w, h), bg_color=(0, 0, 0), rotation_speed=(0.0, 0.0, 0.0))
        print('Saved 3D animation', out3d, 'at', fps, 'fps')
        # Human-like 2D animation
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        writer = cv2.VideoWriter(outhuman, fourcc, fps, (w, h))
        # Apply temporal smoothing to reduce jitter
        smoothed = smooth_sequence(sample, alpha=0.6)
        for frame_vec in smoothed:
            # build 2D landmarks from vector
            lm2d = vector_to_landmarks(frame_vec, image_size=(w, h))
            # adaptive limb thickness based on torso height
            # compute torso size to pass to draw function via monkeypatch (simple approach)
            img = draw_human_2d(lm2d, image_size=(w, h), bg_color=(255,255,255))
            writer.write(img)
        writer.release()
        print('Saved human-like 2D animation', outhuman, 'at', fps, 'fps')
    else:
        # single frame -> image
        frame_vec = sample[0]
        out = os.path.join(base, 'stickman_test.png')
        save_stickman_from_vector(frame_vec, out)
        print('Saved', out)
