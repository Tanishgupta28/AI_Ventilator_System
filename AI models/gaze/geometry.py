"""Deterministic eye geometry, gaze estimation, and screen mapping."""
from dataclasses import dataclass
import math

from .config import (
    DEFAULT_SETTINGS, EYE_BOTTOM, EYE_TOP, EYE_X_BOUNDS,
    LEFT_BROW, LEFT_EYELID, LEFT_IRIS, RIGHT_BROW, RIGHT_EYELID, RIGHT_IRIS,
)


@dataclass(frozen=True)
class EyeGeometry:
    iris: tuple[int, int]
    bounds: tuple[int, int, int, int]
    eyebrow_gap: float
    left_lid_gap: float
    right_lid_gap: float


def extract_eye_geometry(landmarks, frame_width, frame_height):
    """Read normalized landmarks; retain the original pixel rounding/offsets."""
    right_iris = [landmarks[i] for i in RIGHT_IRIS]
    left_iris = [landmarks[i] for i in LEFT_IRIS]
    iris_x = int((sum(p.x for p in right_iris) + sum(p.x for p in left_iris)) / 8 * frame_width)
    iris_y = int((sum(p.y for p in right_iris) + sum(p.y for p in left_iris)) / 8 * frame_height)
    x_min = int(landmarks[EYE_X_BOUNDS[0]].x * frame_width)
    x_max = int(landmarks[EYE_X_BOUNDS[1]].x * frame_width)
    y_min = int(sum(landmarks[i].y for i in EYE_TOP) / 2 * frame_height) + 1
    y_max = int(sum(landmarks[i].y for i in EYE_BOTTOM) / 2 * frame_height) - 1
    left_brow_y = landmarks[LEFT_BROW].y * frame_height
    left_eye_y = landmarks[LEFT_EYELID[1]].y * frame_height
    right_brow_y = landmarks[RIGHT_BROW].y * frame_height
    right_eye_y = landmarks[RIGHT_EYELID[0]].y * frame_height
    eyebrow_gap = ((left_eye_y - left_brow_y) + (right_eye_y - right_brow_y)) / 2
    left_gap = abs(landmarks[LEFT_EYELID[0]].y - landmarks[LEFT_EYELID[1]].y)
    right_gap = abs(landmarks[RIGHT_EYELID[0]].y - landmarks[RIGHT_EYELID[1]].y)
    return EyeGeometry((iris_x, iris_y), (x_min, y_min, x_max, y_max),
                       eyebrow_gap, left_gap, right_gap)


def scale_from_center(value, negative_sensitivity, positive_sensitivity):
    if value < 0.5:
        return 0.5 - (0.5 - value) * negative_sensitivity
    return 0.5 + (value - 0.5) * positive_sensitivity


def normalize_and_scale(geometry, settings=DEFAULT_SETTINGS):
    iris_x, iris_y = geometry.iris
    x_min, y_min, x_max, y_max = geometry.bounds
    rel_x = (iris_x - x_min) / max(1, x_max - x_min)
    rel_y = (iris_y - y_min) / max(1, y_max - y_min)
    return (
        scale_from_center(rel_x, settings.left_sensitivity, settings.right_sensitivity),
        scale_from_center(rel_y, settings.up_sensitivity, settings.down_sensitivity),
    )


def smooth_point(current, previous, alpha):
    """Exponential smoothing before screen clamping; values can exceed [0, 1]."""
    return tuple(alpha * value + (1 - alpha) * old for value, old in zip(current, previous))


class GazeEstimator:
    """Retain the relative gaze filter state across frames containing a face."""
    def __init__(self, settings=DEFAULT_SETTINGS):
        self.settings = settings
        self.previous_relative = (0.5, 0.5)

    def estimate(self, geometry):
        relative = normalize_and_scale(geometry, self.settings)
        self.previous_relative = smooth_point(relative, self.previous_relative, self.settings.gaze_alpha)
        return self.previous_relative


def map_to_screen(relative, screen_size, margin=10):
    return tuple(max(margin, min(value * size, size - margin))
                 for value, size in zip(relative, screen_size))


def blend_cursor(target, current_cursor, alpha=0.3):
    """Blend with the actual desktop cursor, not the previous gaze estimate."""
    return tuple((1 - alpha) * old + alpha * value
                 for value, old in zip(target, current_cursor))


def nearest_button(x, y, regions):
    nearest = None
    min_distance = float("inf")
    for label, (x1, y1, x2, y2) in regions.items():
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
        distance = math.hypot(x - cx, y - cy)
        if distance < min_distance:
            min_distance = distance
            nearest = (cx, cy, label)
    return nearest
