import cv2
import mediapipe as mp
import pyautogui
import time
import math

# Initialize FaceMesh
facemesh = mp.solutions.face_mesh.FaceMesh(refine_landmarks=True)

# Open camera
cam = cv2.VideoCapture(0)
screen_w, screen_h = pyautogui.size()

if not cam.isOpened():
    print("Camera not detected")
    exit()

# --- For smoothing vertical movement ---
prev_rel_y = 0.5
prev_rel_x = 0.5

# ---------------- NEW: Button regions ----------------
buttons = {
    "I am in pain": (58, 20, 280, 178),
    "I cant breathe": (332, 16, 558, 175),
    "Tube is chocking me": (613, 21, 834, 174),
    "I am shivering": (889, 20, 1115, 177),
    "I need to be cleaned": (59, 228, 277, 384),
    "Change my Position": (336, 231, 556, 378),
    "Adjust my pillow": (614, 227, 834, 378),
    "Call Nurse/Doctor": (888, 227, 1110, 376),
    "I want to talk to Family": (54, 428, 274, 578),
    "Play Some Music": (334, 425, 558, 584),
    "Please stay with me": (610, 428, 834, 579),
    "Emergency": (889, 428, 1111, 575),
}

locked_until = 0
lock_pos = None
eyebrow_state = "relaxed"  # can be "raised" or "relaxed"

def get_nearest_button(x, y):
    nearest_button = None
    min_dist = float("inf")
    for label, (x1, y1, x2, y2) in buttons.items():
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2
        dist = math.hypot(x - cx, y - cy)
        if dist < min_dist:
            min_dist = dist
            nearest_button = (cx, cy, label)
    return nearest_button

def on_eyebrow_snap(cursor_x, cursor_y):
    global locked_until, lock_pos
    nearest_button = get_nearest_button(cursor_x, cursor_y)
    if nearest_button:
        cx, cy, label = nearest_button
        print(f"Snapped to: {label}")
        pyautogui.moveTo(cx, cy)
        lock_pos = (cx, cy)
        locked_until = time.time() + 5  # stay for 5 sec

def update_cursor(x, y):
    global locked_until, lock_pos
    if time.time() < locked_until and lock_pos:
        pyautogui.moveTo(lock_pos)  # hold at snap pos
    else:
        pyautogui.moveTo(x, y)  # free movement

# ---------------- MAIN LOOP ----------------
while True:
    ret, frame = cam.read()
    if not ret:
        print("Failed to capture frame")
        break

    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    output = facemesh.process(rgb_frame)
    landmark_points = output.multi_face_landmarks
    frame_h, frame_w, _ = frame.shape

    if landmark_points:
        landmarks = landmark_points[0].landmark

        # --- Eyebrow detection ---
        left_brow_y = landmarks[65].y * frame_h
        left_eye_y = landmarks[159].y * frame_h
        right_brow_y = landmarks[295].y * frame_h
        right_eye_y = landmarks[386].y * frame_h

        avg_dist = ((left_eye_y - left_brow_y) + (right_eye_y - right_brow_y)) / 2

        if avg_dist > 25 and eyebrow_state == "relaxed":  
            eyebrow_state = "raised"
            print("Eyebrow Raised ✅")

        elif avg_dist < 20 and eyebrow_state == "raised":  
            eyebrow_state = "relaxed"
            print("Eyebrow Relaxed → SNAP")
            x, y = pyautogui.position()
            on_eyebrow_snap(x, y)

        left_eye = [landmarks[145], landmarks[159]]
        right_eye = [landmarks[386], landmarks[374]]

        left_dist = abs(left_eye[0].y - left_eye[1].y)
        right_dist = abs(right_eye[0].y - right_eye[1].y)

        blink_threshold = 0.012  # may need tuning depending on camera/face

        if "last_blink_time" not in globals():
            last_blink_time = 0
            blink_count = 0

        if left_dist < blink_threshold and right_dist < blink_threshold:  
            now = time.time()
            if now - last_blink_time < 0.5:  # second blink within 0.5 sec
                blink_count += 1
            else:
                blink_count = 1  # reset if too much gap

            last_blink_time = now

            if blink_count == 2:  
                pyautogui.click()
                print("Double Blink → Click")
                blink_count = 0  # reset
                time.sleep(0.3)  # debounce

        # ---------------- Your iris-based cursor movement (unchanged) ----------------
        right_iris = [landmarks[474], landmarks[475], landmarks[476], landmarks[477]]
        left_iris = [landmarks[469], landmarks[470], landmarks[471], landmarks[472]]
        iris_x = int((sum([p.x for p in right_iris]) + sum([p.x for p in left_iris])) / 8 * frame_w)
        iris_y = int((sum([p.y for p in right_iris]) + sum([p.y for p in left_iris])) / 8 * frame_h)
        cv2.circle(frame, (iris_x, iris_y), 2, (0, 255, 0))

        x_min = int(landmarks[133].x * frame_w)
        x_max = int(landmarks[362].x * frame_w)
        top_y = int(((landmarks[27].y + landmarks[257].y) / 2) * frame_h) + 1
        bottom_y = int(((landmarks[23].y + landmarks[253].y) / 2) * frame_h) - 1
        y_min = top_y
        y_max = bottom_y
        cv2.rectangle(frame, (x_min, y_min), (x_max, y_max), (0, 255, 255), 2)

        left_factor, right_factor, up_factor, down_factor = 40.0, 40.0, 310.0, 310.0

        rel_x = (iris_x - x_min) / max(1, (x_max - x_min))
        if rel_x < 0.5:
            rel_x = 0.5 - (0.5 - rel_x) * left_factor
        else:
            rel_x = 0.5 + (rel_x - 0.5) * right_factor

        rel_y = (iris_y - y_min) / max(1, (y_max - y_min))
        if rel_y < 0.5:
            rel_y = 0.5 - (0.5 - rel_y) * up_factor
        else:
            rel_y = 0.5 + (rel_y - 0.5) * down_factor

        alpha = 0.3
        rel_x = alpha * rel_x + (1 - alpha) * prev_rel_x
        rel_y = alpha * rel_y + (1 - alpha) * prev_rel_y
        prev_rel_x, prev_rel_y = rel_x, rel_y

        screen_x = rel_x * screen_w
        screen_y = rel_y * screen_h

        screen_x = max(10, min(screen_x, screen_w - 10))
        screen_y = max(10, min(screen_y, screen_h - 10))

        prev_x, prev_y = pyautogui.position()
        smooth_x = 0.7 * prev_x + 0.3 * screen_x
        smooth_y = 0.7 * prev_y + 0.3 * screen_y

        # Update with snapping logic
        update_cursor(smooth_x, smooth_y)

    else:
        print("No face detected")

    cv2.imshow("Cursor Control + Eyebrows", frame)

    key = cv2.waitKey(5) 
    if key == ord('q') or key == 27:
        print("Exiting...")
        break

cam.release()
cv2.destroyAllWindows()
