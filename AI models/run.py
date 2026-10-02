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
    args = parser.parse_args()
    if sys.version_info[:2] != (3, 11):
        parser.error("Use Python 3.11 and the documented virtual environment.")
    if args.camera < 0:
        parser.error("--camera must be nonnegative")
    if args.backend_url and args.mode != "emotion":
        parser.error("--backend-url is only supported in emotion mode")
    if args.backend_url and not args.backend_url.startswith(("http://", "https://")):
        parser.error("--backend-url must start with http:// or https://")
    os.environ["AI_CAMERA_INDEX"] = str(args.camera)
    os.environ["AI_BACKEND_URL"] = args.backend_url
    if args.check:
        modules = ("cv2", "deepface", "requests") if args.mode == "emotion" else ("cv2", "mediapipe", "pyautogui")
        try:
            imported = {name: importlib.import_module(name) for name in modules}
            if args.mode != "emotion":
                imported["mediapipe"].solutions.face_mesh.FaceMesh
        except (ImportError, AttributeError, OSError) as exc:
            parser.exit(1, f"Dependency check failed: {exc}\nInstall the requirements for this mode.\n")
        print("Dependency check passed; camera, display windows and inference were not started.")
        return
    filename = {"gaze": "main3.py", "nose": "mainn.py", "emotion": "emotionfear1.py"}[args.mode]
    runpy.run_path(str(Path(__file__).resolve().parent / filename), run_name="__main__")


if __name__ == "__main__":
    main()
