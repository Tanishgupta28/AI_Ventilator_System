"""Original gaze indices/smoothing plus explicit prototype safety settings."""
from dataclasses import dataclass

RIGHT_IRIS = (474, 475, 476, 477)
LEFT_IRIS = (469, 470, 471, 472)
EYE_X_BOUNDS = (133, 362)
EYE_TOP = (27, 257)
EYE_BOTTOM = (23, 253)
LEFT_EYELID = (145, 159)
RIGHT_EYELID = (386, 374)
LEFT_BROW = 65
RIGHT_BROW = 295


@dataclass(frozen=True)
class GazeSettings:
    left_sensitivity: float = 40.0
    right_sensitivity: float = 40.0
    up_sensitivity: float = 310.0
    down_sensitivity: float = 310.0
    gaze_alpha: float = 0.3
    cursor_alpha: float = 0.3
    screen_margin: int = 10
    eyebrow_raise_pixels: float = 25
    eyebrow_relax_pixels: float = 20
    blink_threshold: float = 0.012
    blink_min_closed_seconds: float = 0.06
    blink_max_closed_seconds: float = 0.8
    blink_reopen_seconds: float = 0.06
    double_blink_seconds: float = 0.5
    click_debounce_seconds: float = 0.3
    snap_hold_seconds: float = 5
    dead_zone: float = 0.01
    max_invalid_camera_frames: int = 3


DEFAULT_SETTINGS = GazeSettings()
