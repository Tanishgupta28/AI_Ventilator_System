"""Capture -> FaceMesh -> geometry -> gaze -> mapping -> interaction."""
from contextlib import ExitStack

import cv2
import mediapipe as mp
import pyautogui

from buttons import buttons
from .config import DEFAULT_SETTINGS
from .geometry import GazeEstimator, blend_cursor, extract_eye_geometry, map_to_screen
from .interaction import InteractionController


def run(camera_index=0, dry_run=False, max_frames=60):
    frame_count = landmark_frame_count = gaze_count = 0
    settings = DEFAULT_SETTINGS
    estimator = GazeEstimator(settings)
    interaction = InteractionController(pyautogui, buttons, dry_run, settings)
    with ExitStack() as resources:
        # Register cleanup immediately, including failures during initialization.
        resources.callback(cv2.destroyAllWindows)
        detector = mp.solutions.face_mesh.FaceMesh(refine_landmarks=True)
        resources.callback(detector.close)
        camera = cv2.VideoCapture(camera_index)
        resources.callback(camera.release)
        if not camera.isOpened():
            print("Camera not detected")
            return 1
        screen_size = pyautogui.size()
        while True:
            ok, frame = camera.read()
            if not ok:
                print("Failed to capture frame")
                break
            frame_count += 1
            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            faces = detector.process(rgb_frame).multi_face_landmarks
            if faces:
                landmark_frame_count += 1
                height, width, _ = frame.shape
                geometry = extract_eye_geometry(faces[0].landmark, width, height)
                interaction.handle_gestures(geometry)
                iris_x, iris_y = geometry.iris
                x_min, y_min, x_max, y_max = geometry.bounds
                cv2.circle(frame, (iris_x, iris_y), 2, (0, 255, 0))
                cv2.rectangle(frame, (x_min, y_min), (x_max, y_max), (0, 255, 255), 2)
                relative = estimator.estimate(geometry)
                target = map_to_screen(relative, screen_size, settings.screen_margin)
                cursor = blend_cursor(target, pyautogui.position(), settings.cursor_alpha)
                gaze_count += 1
                interaction.update_cursor(cursor)
            else:
                print("No face detected")
            if dry_run:
                if frame_count >= max_frames:
                    break
                continue
            cv2.imshow("Cursor Control + Eyebrows", frame)
            if cv2.waitKey(5) in (ord("q"), 27):
                print("Exiting...")
                break
    if dry_run:
        print(f"Dry run: frames={frame_count}, landmark_frames={landmark_frame_count}, "
              f"gaze_calculations={gaze_count}; mouse actions disabled")
        return int(frame_count < max_frames)
    return 0
