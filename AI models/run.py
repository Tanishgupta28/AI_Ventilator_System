"""Launch the existing demos with explicit runtime configuration."""
import argparse
import importlib
import os
from pathlib import Path
import runpy
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("gaze", "nose", "emotion"))
    parser.add_argument("--camera", type=int, default=0)
    parser.add_argument("--backend-url", default="", help="Optional emotion POST endpoint")
    parser.add_argument("--check", action="store_true", help="Check imports without opening a camera")
    parser.add_argument("--dry-run", action="store_true", help="Gaze verification: disable mouse actions and preview")
    parser.add_argument("--max-frames", type=int, default=60, help="Frame limit for gaze dry run")
    args = parser.parse_args()
    supported = ((3, 11),) if args.mode == "emotion" else ((3, 11), (3, 12))
    if sys.version_info[:2] not in supported:
        parser.error("Use Python 3.11 for emotion; Python 3.11 or 3.12 for gaze/nose.")
    if args.dry_run and (args.mode != "gaze" or args.max_frames < 1):
        parser.error("--dry-run requires gaze mode and a positive --max-frames")
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
