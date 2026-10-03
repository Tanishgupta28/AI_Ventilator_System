"""OpenCV communication screen; no PyAutoGUI, networking, or device control."""
from contextlib import ExitStack
from dataclasses import asdict, dataclass, replace
import json
import math
import time

import cv2
import mediapipe as mp
import numpy as np

from .calibration import load_profile
from .communication import CANVAS_SIZE, CommunicationController, make_layout
from .config import DEFAULT_SETTINGS
from .geometry import GazeEstimator, apply_dead_zone, extract_valid_eye_geometry, map_to_screen

WINDOW = 'Patient Communication - Research Prototype'


@dataclass
class CommunicationMetrics:
    frames: int = 0
    landmark_frames: int = 0
    gaze_calculations: int = 0
    tracking_loss_frames: int = 0
    invalid_camera_frames: int = 0
    fps: float = 0.0


def render_screen(controller, calibration_status, point, now, size=CANVAS_SIZE):
    width, height = size
    canvas = np.full((height, width, 3), (25, 22, 18), dtype=np.uint8)
    cv2.putText(canvas, 'PATIENT COMMUNICATION', (32, 42), cv2.FONT_HERSHEY_SIMPLEX,
                1.0, (245, 245, 245), 2)
    tracking = 'Tracking: available' if controller.tracking_valid else 'Tracking: unavailable - selections paused'
    cv2.putText(canvas, tracking, (32, 78), cv2.FONT_HERSHEY_SIMPLEX, .6,
                (150, 230, 170) if controller.tracking_valid else (130, 180, 255), 1)
    cv2.putText(canvas, calibration_status, (750, 78), cv2.FONT_HERSHEY_SIMPLEX,
                .55, (210, 210, 210), 1)
    for button in controller.buttons:
        left, top, right, bottom = button.bounds
        focused = controller.focused == button
        color = (100, 95, 35) if focused else (62, 52, 40)
        cv2.rectangle(canvas, (left, top), (right - 1, bottom - 1), color, -1)
        cv2.rectangle(canvas, (left, top), (right - 1, bottom - 1),
                      (100, 245, 245) if focused else (110, 100, 85), 4 if focused else 2)
        label = button.label.upper()
        scale = .9
        text_width, text_height = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, scale, 2)[0]
        cv2.putText(canvas, label, ((left + right - text_width) // 2,
                                  (top + bottom + text_height) // 2),
                    cv2.FONT_HERSHEY_SIMPLEX, scale, (245, 245, 245), 2)
    if point is not None and controller.tracking_valid:
        cv2.circle(canvas, tuple(round(v) for v in point), 9, (100, 245, 245), 2)
    feedback = controller.feedback(now)
    focus = controller.focused.label if controller.focused is not None else 'None'
    cv2.putText(canvas, feedback or f'Target: {focus}', (32, height - 56),
                cv2.FONT_HERSHEY_SIMPLEX, .8, (150, 245, 190), 2)
    cv2.putText(canvas, 'Look to highlight. Double blink to select. Q / ESC exits.',
                (32, height - 22), cv2.FONT_HERSHEY_SIMPLEX, .6, (210, 210, 210), 1)
    return canvas


def run(camera_index=0, dry_run=False, max_frames=60, calibration_path=None,
        dead_zone=DEFAULT_SETTINGS.dead_zone, blink_threshold=DEFAULT_SETTINGS.blink_threshold,
        double_blink_window=DEFAULT_SETTINGS.double_blink_seconds, intent_diagnostics=False):
    if type(camera_index) is not int or camera_index < 0:
        raise ValueError('Camera index must be a nonnegative integer')
    if dry_run and (type(max_frames) is not int or max_frames < 1):
        raise ValueError('A bounded run requires a positive frame count')
    if not math.isfinite(blink_threshold) or not 0 < blink_threshold < 1:
        raise ValueError('Blink threshold must be finite and in (0, 1)')
    if not math.isfinite(double_blink_window) or double_blink_window <= 0:
        raise ValueError('Double-blink window must be finite and positive')
    apply_dead_zone((.5, .5), dead_zone)
    settings = replace(DEFAULT_SETTINGS, dead_zone=dead_zone, blink_threshold=blink_threshold,
                       double_blink_seconds=double_blink_window)
    profile = load_profile(calibration_path) if calibration_path else None
    calibration_status = ('Calibration: loaded' if profile else
                          'Calibration: invalid / fallback' if calibration_path else
                          'Calibration: fallback')
    print(calibration_status, flush=True)
    def log_intent(event):
        print('Intent diagnostics: ' + json.dumps(event), flush=True)
    controller = CommunicationController(make_layout(*CANVAS_SIZE), settings,
                                         log_intent if intent_diagnostics else None)
    estimator = GazeEstimator(settings, profile)
    metrics = CommunicationMetrics()
    failed = False
    consecutive_invalid = 0
    with ExitStack() as resources:
        resources.callback(cv2.destroyAllWindows)
        detector = mp.solutions.face_mesh.FaceMesh(refine_landmarks=True)
        resources.callback(detector.close)
        camera = cv2.VideoCapture(camera_index)
        resources.callback(camera.release)
        if not camera.isOpened():
            print('Camera not detected', flush=True)
            return 1
        cv2.namedWindow(WINDOW, cv2.WINDOW_NORMAL)
        cv2.setWindowProperty(WINDOW, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
        started_at = time.monotonic()
        while not dry_run or metrics.frames < max_frames:
            ok, frame = camera.read()
            metrics.frames += 1
            geometry = None
            valid_frame = (ok and frame is not None and frame.size > 0
                           and frame.ndim == 3 and frame.shape[2] == 3)
            if not valid_frame:
                metrics.invalid_camera_frames += 1
                consecutive_invalid += 1
                if consecutive_invalid >= settings.max_invalid_camera_frames:
                    print('Camera returned three consecutive invalid frames; stopping safely', flush=True)
                    failed = True
            else:
                consecutive_invalid = 0
                frame = cv2.flip(frame, 1)
                faces = detector.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)).multi_face_landmarks
                if faces:
                    geometry = extract_valid_eye_geometry(faces[0].landmark, frame.shape[1], frame.shape[0])
            now = time.monotonic()
            point = None
            if geometry is None:
                metrics.tracking_loss_frames += 1
                estimator.reset()
                controller.update(None, False, now, tracking_valid=False)
            else:
                metrics.landmark_frames += 1
                closed = (geometry.left_lid_gap < settings.blink_threshold
                          and geometry.right_lid_gap < settings.blink_threshold)
                relative = estimator.previous_relative if closed else estimator.estimate(geometry)
                metrics.gaze_calculations += int(not closed)
                point = map_to_screen(apply_dead_zone(relative, settings.dead_zone),
                                      CANVAS_SIZE, settings.screen_margin)
                request = controller.update(point, closed, now)
                if request is not None:
                    print(json.dumps(request.to_dict()), flush=True)
            cv2.imshow(WINDOW, render_screen(controller, calibration_status, point, now))
            key = cv2.waitKey(5)
            if failed or key in (ord('q'), 27) or cv2.getWindowProperty(WINDOW, cv2.WND_PROP_VISIBLE) < 1:
                break
        metrics.fps = round(metrics.frames / max(time.monotonic() - started_at, 1e-9), 2)
    report = asdict(metrics)
    report.update(completed_blinks=controller.completed_blinks,
                  selection_attempts=controller.selection_attempts,
                  selections=controller.selections, actual_os_mouse_actions=0,
                  mapping='calibrated' if profile else 'fallback')
    print('Communication diagnostics: ' + json.dumps(report), flush=True)
    return int(failed)
