"""Compatibility entry point for the modular iris-gaze demo."""
import os

from gaze.app import run


def main():
    return run(
        camera_index=int(os.environ.get("AI_CAMERA_INDEX", "0")),
        dry_run=os.environ.get("AI_DRY_RUN") == "1",
        max_frames=int(os.environ.get("AI_MAX_FRAMES", "60")),
    )


if __name__ == "__main__":
    raise SystemExit(main())
