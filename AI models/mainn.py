# import cv2
# import mediapipe as mp
# import pyautogui
# import time

# # Initialize FaceMesh
# facemesh = mp.solutions.face_mesh.FaceMesh(refine_landmarks=True)

# # Open camera
# cam = cv2.VideoCapture(0)
# screen_w, screen_h = pyautogui.size()

# if not cam.isOpened():
#     print("Camera not detected")
#     exit()

# # --- For smoothing movement ---
# prev_rel_y = 0.5  # start in middle
# prev_rel_x = 0.5  # start in middle

# while True:
#     ret, frame = cam.read()
#     if not ret:
#         print("Failed to capture frame")
#         break

#     frame = cv2.flip(frame, 1)
#     rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#     output = facemesh.process(rgb_frame)
#     landmark_points = output.multi_face_landmarks
#     frame_h, frame_w, _ = frame.shape

#     if landmark_points:
#         landmarks = landmark_points[0].landmark

#         # --- Nose tip tracking ---
#         nose_tip = landmarks[1]
#         nose_x = int(nose_tip.x * frame_w)
#         nose_y = int(nose_tip.y * frame_h)
#         cv2.circle(frame, (nose_x, nose_y), 3, (255, 0, 0), -1)

#         # Relative position
#         rel_x = nose_x / frame_w
#         rel_y = nose_y / frame_h

#         # Smooth it
#         alpha = 0.3
#         rel_x = alpha * rel_x + (1 - alpha) * prev_rel_x
#         rel_y = alpha * rel_y + (1 - alpha) * prev_rel_y
#         prev_rel_x, prev_rel_y = rel_x, rel_y

#         # Map to screen coords
# # Amplify movements around center
#         amp_factor_x = 8.0  # increase for more sensitivity (try 1.5–3.0)
#         amp_factor_y = 20.0 

# # Recenter around 0 (so middle of screen = 0)
#         dx = (rel_x - 0.5) * amp_factor_x
#         dy = (rel_y - 0.5) * amp_factor_y

# # Shift back to [0,1] range
#         rel_x = 0.5 + dx
#         rel_y = 0.5 + dy

# # Clamp to avoid going outside screen
#         rel_x = max(0, min(1, rel_x))
#         rel_y = max(0, min(1, rel_y))

# # Map to screen coords
#         screen_x = rel_x * screen_w
#         screen_y = rel_y * screen_h

#         # Clamp to avoid edges
#         screen_x = max(10, min(screen_x, screen_w - 10))
#         screen_y = max(10, min(screen_y, screen_h - 10))

#         # Smooth movement
#         prev_x, prev_y = pyautogui.position()
#         smooth_x = 0.7 * prev_x + 0.3 * screen_x
#         smooth_y = 0.7 * prev_y + 0.3 * screen_y
#         pyautogui.moveTo(smooth_x, smooth_y)

#         # --- Blink detection (still useful for clicking) ---
#         left_eye = [landmarks[145], landmarks[159]]
#         right_eye = [landmarks[386], landmarks[374]]

#         left_dist = abs(left_eye[0].y - left_eye[1].y)
#         right_dist = abs(right_eye[0].y - right_eye[1].y)  

#         if left_dist < 0.01 and right_dist < 0.01:  # both eyes closed
#             pyautogui.click()
#             time.sleep(0.25)  # avoid multiple clicks
#             print("Click detected (both eyes blinked)")

#     else:
#         print("No face detected")

#     cv2.imshow("Cursor Control", frame)

#     key = cv2.waitKey(5) 
#     if key == ord('q') or key == 27:
#         print("Exiting...")
#         break

# cam.release()
# cv2.destroyAllWindows()






import cv2
import mediapipe as mp
import pyautogui
import time

# Initialize FaceMesh

facemesh = mp.solutions.face_mesh.FaceMesh(refine_landmarks=True)

# Open camera
cam = cv2.VideoCapture(0)
screen_w, screen_h = pyautogui.size()

if not cam.isOpened():
    print("Camera not detected")
    exit()

# --- For smoothing movement ---
prev_rel_y = 0.5  
prev_rel_x = 0.5  

# --- Calibration variables ---
calib_x, calib_y = 0.5, 0.5   # default center
calibrated = False

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

        # --- Nose tip tracking ---
        nose_tip = landmarks[1]
        nose_x = int(nose_tip.x * frame_w)
        nose_y = int(nose_tip.y * frame_h)
        cv2.circle(frame, (nose_x, nose_y), 3, (255, 0, 0), -1)

        # Relative position
        rel_x = nose_x / frame_w
        rel_y = nose_y / frame_h

        # If calibrated, shift relative to calibration center
        if calibrated:
            rel_x = rel_x - calib_x + 0.5
            rel_y = rel_y - calib_y + 0.5

        # Smooth it
        alpha = 0.5
        rel_x = alpha * rel_x + (1 - alpha) * prev_rel_x
        rel_y = alpha * rel_y + (1 - alpha) * prev_rel_y
        prev_rel_x, prev_rel_y = rel_x, rel_y

        # Amplify movements
        amp_factor_x = 10.0  
        amp_factor_y = 20.0 
        dx = (rel_x - 0.5) * amp_factor_x
        dy = (rel_y - 0.5) * amp_factor_y
        rel_x = 0.5 + dx
        rel_y = 0.5 + dy

        # Clamp to screen
        rel_x = max(0, min(1, rel_x))
        rel_y = max(0, min(1, rel_y))
        screen_x = rel_x * screen_w
        screen_y = rel_y * screen_h

        # Avoid edges
        screen_x = max(10, min(screen_x, screen_w - 10))
        screen_y = max(10, min(screen_y, screen_h - 10))

        # Smooth movement
        prev_x, prev_y = pyautogui.position()
        smooth_x = 0.7 * prev_x + 0.3 * screen_x
        smooth_y = 0.7 * prev_y + 0.3 * screen_y
        pyautogui.moveTo(smooth_x, smooth_y)

        # --- Blink detection (clicking) ---
        left_eye = [landmarks[145], landmarks[159]]
        right_eye = [landmarks[386], landmarks[374]]
        left_dist = abs(left_eye[0].y - left_eye[1].y)
        right_dist = abs(right_eye[0].y - right_eye[1].y)

        if left_dist < 0.01 and right_dist < 0.01:
            pyautogui.click()
            time.sleep(0.25)
            print("Click detected (both eyes blinked)")

    else:
        print("No face detected")

    cv2.putText(frame, "Press 'c' to calibrate center", (30, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.imshow("Cursor Control", frame)

    key = cv2.waitKey(5) 
    if key == ord('q') or key == 27:
        print("Exiting...")
        break
    elif key == ord('c') and landmark_points:
        calib_x = nose_x / frame_w
        calib_y = nose_y / frame_h
        calibrated = True
        print(f"Calibrated at ({calib_x:.2f}, {calib_y:.2f})")

cam.release()
cv2.destroyAllWindows()
