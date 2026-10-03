"""Launch the existing demos with explicit runtime configuration."""
import argparse
import importlib
import math
import os
from pathlib import Path
import runpy
import sys

from gaze.config import DEFAULT_SETTINGS


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("gaze", "nose", "emotion"))
    parser.add_argument("--camera", type=int, default=0)
    parser.add_argument("--backend-url", default="", help="Optional emotion POST endpoint")
    parser.add_argument("--check", action="store_true", help="Check imports without opening a camera")
    parser.add_argument("--dry-run", action="store_true", help="Gaze verification: disable mouse actions and preview")
    parser.add_argument("--max-frames", type=int, default=60, help="Frame limit for gaze dry run")
    calibration = parser.add_mutually_exclusive_group()
    calibration.add_argument("--calibration", help="Optional saved gaze calibration JSON")
    calibration.add_argument("--calibrate", help="Collect five targets and save a gaze calibration JSON; mouse actions disabled")
    parser.add_argument("--calibration-samples", type=int, default=30, help="Valid samples per calibration target (minimum 5)")
    parser.add_argument("--dead-zone", type=float, default=0.01, help="Central normalized half-width; 0 disables (default 0.01)")
    parser.add_argument("--blink-threshold", type=float, default=0.012, help="Normalized eyelid gap classified as closed (default 0.012); validate manually")
    parser.add_argument("--double-blink-window", type=float, default=DEFAULT_SETTINGS.double_blink_seconds, help="Maximum completed-blink interval in seconds (default 0.65)")
    parser.add_argument("--intent-diagnostics", action="store_true", help="Dry-run only: print monotonic blink/selection events")
    args = parser.parse_args()
    supported = ((3, 11),) if args.mode == "emotion" else ((3, 11), (3, 12))
    if sys.version_info[:2] not in supported:
        parser.error("Use Python 3.11 for emotion; Python 3.11 or 3.12 for gaze/nose.")
    if args.dry_run and (args.mode != "gaze" or args.max_frames < 1):
        parser.error("--dry-run requires gaze mode and a positive --max-frames")
    if (args.calibration or args.calibrate or args.calibration_samples != 30
            or args.dead_zone != 0.01 or args.blink_threshold != 0.012
            or args.double_blink_window != DEFAULT_SETTINGS.double_blink_seconds or args.intent_diagnostics) and args.mode != "gaze":
        parser.error("Calibration, stability and blink options require gaze mode")
    if args.calibrate and (args.dry_run or args.check):
        parser.error("--calibrate needs the interactive target window; mouse actions are always disabled")
    if args.calibration_samples < 5:
        parser.error("--calibration-samples must be at least 5")
    if not math.isfinite(args.dead_zone) or not 0 <= args.dead_zone < 0.5:
        parser.error("--dead-zone must be finite and in [0, 0.5)")
    if not math.isfinite(args.blink_threshold) or not 0 < args.blink_threshold < 1:
        parser.error("--blink-threshold must be finite and in (0, 1)")
    if not math.isfinite(args.double_blink_window) or args.double_blink_window <= 0:
        parser.error("--double-blink-window must be finite and positive")
    if args.intent_diagnostics and not args.dry_run:
        parser.error("--intent-diagnostics requires --dry-run")
    if args.camera < 0:
        parser.error("--camera must be nonnegative")
    if args.backend_url and args.mode != "emotion":
        parser.error("--backend-url is only supported in emotion mode")
    if args.backend_url and not args.backend_url.startswith(("http://", "https://")):
        parser.error("--backend-url must start with http:// or https://")
    os.environ["AI_CAMERA_INDEX"] = str(args.camera)
    os.environ["AI_BACKEND_URL"] = args.backend_url
    os.environ["AI_DRY_RUN"] = "1" if args.dry_run else "0"
    os.environ["AI_MAX_FRAMES"] = str(args.max_frames)
    os.environ["AI_CALIBRATION_PATH"] = args.calibration or ""
    os.environ["AI_CALIBRATE_PATH"] = args.calibrate or ""
    os.environ["AI_CALIBRATION_SAMPLES"] = str(args.calibration_samples)
    os.environ["AI_DEAD_ZONE"] = str(args.dead_zone)
    os.environ["AI_BLINK_THRESHOLD"] = str(args.blink_threshold)
    os.environ["AI_DOUBLE_BLINK_WINDOW"] = str(args.double_blink_window)
    os.environ["AI_INTENT_DIAGNOSTICS"] = "1" if args.intent_diagnostics else "0"
    if args.check:
        modules = ("cv2", "numpy", "deepface", "requests") if args.mode == "emotion" else ("cv2", "numpy", "mediapipe", "pyautogui", "requests")
        try:
            imported = {name: importlib.import_module(name) for name in modules}
            if args.mode != "emotion":
                imported["mediapipe"].solutions.face_mesh.FaceMesh
            if args.mode == "gaze":
                importlib.import_module("gaze.app")
        except (ImportError, AttributeError, OSError) as exc:
            parser.exit(1, f"Dependency check failed: {exc}\nInstall the requirements for this mode.\n")
        print("Dependency check passed; camera, display windows and inference were not started.")
        return
    filename = {"gaze": "main3.py", "nose": "mainn.py", "emotion": "emotionfear1.py"}[args.mode]
    runpy.run_path(str(Path(__file__).resolve().parent / filename), run_name="__main__")


if __name__ == "__main__":
    main()
