"""Compatibility entry point for the modular iris-gaze demo."""
import os

from gaze.app import run
from gaze.config import DEFAULT_SETTINGS


def main():
    return run(
        camera_index=int(os.environ.get("AI_CAMERA_INDEX", "0")),
        dry_run=os.environ.get("AI_DRY_RUN") == "1",
        max_frames=int(os.environ.get("AI_MAX_FRAMES", "60")),
        calibration_path=os.environ.get("AI_CALIBRATION_PATH") or None,
        calibrate_path=os.environ.get("AI_CALIBRATE_PATH") or None,
        calibration_samples=int(os.environ.get("AI_CALIBRATION_SAMPLES", "30")),
        dead_zone=float(os.environ.get("AI_DEAD_ZONE", "0.01")),
        blink_threshold=float(os.environ.get("AI_BLINK_THRESHOLD", "0.012")),
        double_blink_window=float(os.environ.get("AI_DOUBLE_BLINK_WINDOW", str(DEFAULT_SETTINGS.double_blink_seconds))),
        intent_diagnostics=os.environ.get("AI_INTENT_DIAGNOSTICS") == "1",
    )


if __name__ == "__main__":
    raise SystemExit(main())
