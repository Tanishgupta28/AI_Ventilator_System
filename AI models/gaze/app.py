"""CPU gaze runtime, optional five-target calibration, and bounded diagnostics."""
from contextlib import ExitStack
from dataclasses import asdict, dataclass, replace
import json
import math
import time

import cv2
import mediapipe as mp
import numpy as np
import pyautogui

from buttons import buttons
from .calibration import CalibrationSession, load_profile, save_profile
from .config import DEFAULT_SETTINGS
from .geometry import (GazeEstimator, apply_dead_zone, blend_cursor,
                       extract_valid_eye_geometry, map_to_screen, normalize_gaze)
from .interaction import InteractionController


@dataclass
class RuntimeMetrics:
    frames: int = 0
    landmark_frames: int = 0
    tracking_loss_frames: int = 0
    invalid_camera_frames: int = 0
    gaze_calculations: int = 0
    closed_eye_frames: int = 0
    fps: float = 0.0


def calibration_preview(session, screen_size):
    width, height = screen_size
    canvas = np.zeros((height, width, 3), dtype=np.uint8)
    points = {'CENTER': (0.5, 0.5), 'LEFT': (0.1, 0.5), 'RIGHT': (0.9, 0.5),
              'UP': (0.5, 0.1), 'DOWN': (0.5, 0.9)}
    x, y = points[session.target]
    cv2.circle(canvas, (int(x * width), int(y * height)), 14, (0, 255, 255), -1)
    progress = len(session.samples[session.target])
    text = f'{session.target}: {progress}/{session.samples_per_target} valid samples'
    hint = 'Look at the dot, then press SPACE' if session.started_at is None else 'Keep looking at the dot'
    cv2.putText(canvas, text, (30, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    cv2.putText(canvas, hint + '; Q/ESC cancels', (30, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.imshow('Gaze calibration', canvas)


def reset_tracking(estimator, interaction):
    estimator.reset()
    interaction.tracking_lost()


def run(camera_index=0, dry_run=False, max_frames=60, calibration_path=None,
        calibrate_path=None, calibration_samples=30, dead_zone=0.01, blink_threshold=0.012):
    if type(camera_index) is not int or camera_index < 0:
        raise ValueError("Camera index must be a nonnegative integer")
    if dry_run and (type(max_frames) is not int or max_frames < 1):
        raise ValueError("A bounded dry run requires a positive frame count")
    if not math.isfinite(blink_threshold) or not 0 < blink_threshold < 1:
        raise ValueError("Blink threshold must be finite and in (0, 1)")
    settings = replace(DEFAULT_SETTINGS, dead_zone=dead_zone, blink_threshold=blink_threshold)
    apply_dead_zone((0.5, 0.5), dead_zone)  # Validate before acquiring resources.
    metrics = RuntimeMetrics()
    profile = load_profile(calibration_path) if calibration_path else None
    if calibration_path and profile is None:
        print('Calibration missing/invalid; using fixed sensitivity fallback')
    print('Gaze mapping: ' + ('calibrated' if profile else 'fixed sensitivity fallback'))
    estimator = GazeEstimator(settings, profile)
    interaction = InteractionController(pyautogui, buttons, dry_run or bool(calibrate_path), settings)
    session = CalibrationSession(calibration_samples) if calibrate_path else None
    failed = False
    consecutive_invalid = 0
    with ExitStack() as resources:
        resources.callback(cv2.destroyAllWindows)
        detector = mp.solutions.face_mesh.FaceMesh(refine_landmarks=True)
        resources.callback(detector.close)
        camera = cv2.VideoCapture(camera_index)
        resources.callback(camera.release)
        if not camera.isOpened():
            print('Camera not detected')
            return 1
        screen_size = pyautogui.size()
        if session:
            cv2.namedWindow('Gaze calibration', cv2.WINDOW_NORMAL)
            cv2.setWindowProperty('Gaze calibration', cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
        started_at = time.monotonic()
        while not dry_run or metrics.frames < max_frames:
            ok, frame = camera.read()
            metrics.frames += 1
            geometry = None
            frame_valid = (ok and frame is not None and frame.size > 0
                           and frame.ndim == 3 and frame.shape[2] == 3)
            if not frame_valid:
                consecutive_invalid += 1
                metrics.invalid_camera_frames += 1
                if consecutive_invalid >= settings.max_invalid_camera_frames:
                    print('Camera returned three consecutive invalid frames; stopping safely')
                    failed = True
            else:
                consecutive_invalid = 0
                frame = cv2.flip(frame, 1)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                faces = detector.process(rgb_frame).multi_face_landmarks
                if faces:
                    height, width, _ = frame.shape
                    geometry = extract_valid_eye_geometry(faces[0].landmark, width, height)
            now = time.monotonic()
            if geometry is None:
                metrics.tracking_loss_frames += 1
                reset_tracking(estimator, interaction)
            else:
                metrics.landmark_frames += 1
                closed = (geometry.left_lid_gap < settings.blink_threshold
                          and geometry.right_lid_gap < settings.blink_threshold)
                metrics.closed_eye_frames += int(closed)
                if session:
                    if not closed:
                        session.add_sample(normalize_gaze(geometry), now)
                    if session.done:
                        try:
                            save_profile(session.profile(), calibrate_path)
                            print(f'Calibration saved: {session.samples_per_target} samples per target')
                        except (ValueError, OSError) as exc:
                            print(f'Calibration not saved: {exc}; repeat the procedure')
                            failed = True
                        break
                else:
                    # Closed-eye iris positions should not contaminate the gaze filter.
                    relative = estimator.previous_relative if closed else estimator.estimate(geometry)
                    if not closed:
                        metrics.gaze_calculations += 1
                    relative = apply_dead_zone(relative, settings.dead_zone)
                    target = map_to_screen(relative, screen_size, settings.screen_margin)
                    cursor = blend_cursor(target, interaction.cursor_position(), settings.cursor_alpha)
                    interaction.process(geometry, cursor, now)
                    iris_x, iris_y = geometry.iris
                    x_min, y_min, x_max, y_max = geometry.bounds
                    cv2.circle(frame, (iris_x, iris_y), 2, (0, 255, 0))
                    cv2.rectangle(frame, (x_min, y_min), (x_max, y_max), (0, 255, 255), 2)
            if failed:
                break
            if session:
                calibration_preview(session, screen_size)
                key = cv2.waitKey(5)
                if key == ord(' '):
                    session.start_target(time.monotonic())
            elif dry_run:
                continue
            else:
                if frame_valid:
                    cv2.imshow('Cursor Control + Eyebrows', frame)
                key = cv2.waitKey(5)
            if key in (ord('q'), 27):
                print('Exiting...')
                break
        metrics.fps = round(metrics.frames / max(time.monotonic() - started_at, 1e-9), 2)
    report = asdict(metrics)
    report.update(completed_blinks=interaction.completed_blinks,
                  action_attempts=interaction.action_attempts,
                  click_attempts=interaction.click_attempts, snap_attempts=interaction.snap_attempts,
                  movement_attempts=interaction.movement_attempts,
                  actual_mouse_actions=interaction.actual_mouse_actions,
                  mapping='calibrated' if profile else 'fallback')
    print('Runtime diagnostics: ' + json.dumps(report, sort_keys=True))
    if session and not session.done:
        print('Calibration cancelled/incomplete; no profile was saved')
        failed = True
    return int(failed or (dry_run and metrics.frames < max_frames))
