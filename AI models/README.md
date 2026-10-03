# AI demos

Use **64-bit Python 3.11 or 3.12** for gaze/nose tracking on a desktop with a webcam.
The separate emotion environment still requires **Python 3.11** because
TensorFlow 2.15.1 has no Python 3.12 distribution. These scripts open
OpenCV windows; gaze and nose modes also move and click the system mouse.
They are experimental demos, not validated clinical measurements.

## Gaze and nose tracking

From the repository root in PowerShell:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r "AI models/requirements.txt"
.\.venv\Scripts\python.exe -m pip check
.\.venv\Scripts\python.exe "AI models/run.py" gaze --check
.\.venv\Scripts\python.exe "AI models/run.py" gaze --camera 0
```

Python 3.11 can also be used for gaze/nose by changing the venv command.
To reproduce the verified Windows x64 / Python 3.12 environment including
transitive dependencies, install `AI models/requirements-gaze-win-py312.lock.txt`
instead of `requirements.txt`. The lock records versions, not wheel hashes;
use the direct manifest on other platforms or Python 3.11.

Use `nose` instead of `gaze` for nose tracking; press `c` in its preview
window to calibrate the center. Gaze mode uses the original fixed button
coordinates, which must match your interface layout. Both modes control the
mouse immediately. Keep PyAutoGUI's corner fail-safe enabled. Press `q` or
Escape with the preview focused to exit.

For bounded verification with no mouse movement, clicking, or preview window:

```powershell
.\.venv\Scripts\python.exe "AI models/run.py" gaze --dry-run --max-frames 60 --camera 0
```

This processes real webcam frames through the existing CPU FaceMesh and gaze
calculations. The final `frames` count confirms frame processing;
`landmark_frames` counts frames with a detected face. A zero landmark count
means gaze calculations were not exercised: repeat while facing the webcam.
The camera and FaceMesh are closed even if processing raises an exception.
No GPU or CUDA installation is required.

Stage 1.5 verification (2026-10-03): Windows x64, Python 3.12.6, clean
`.venv`; installation, `pip check`, syntax, CLI help, and gaze/nose import
checks passed. HP Wide Vision HD Camera index 0 processed 60 frames with
60 face-landmark results through the gaze demo. During that test, PyAutoGUI
movement/click functions were also guarded to raise if invoked; none were
called. The application exited normally. Intel Iris Xe graphics was detected;
OpenCV reported zero CUDA devices. A Windows console encoding crash in the
original eyebrow log was fixed by using plain text in gaze logs.

## Emotion detection

Use a separate environment to avoid installing two OpenCV distributions:

```powershell
py -3.11 -m venv .venv-emotion
.\.venv-emotion\Scripts\python.exe -m pip install -r "AI models/requirements-emotion.txt"
.\.venv-emotion\Scripts\python.exe -m pip check
.\.venv-emotion\Scripts\python.exe "AI models/run.py" emotion --check
.\.venv-emotion\Scripts\python.exe "AI models/run.py" emotion --camera 0
```

Emotion detection runs locally by default. To send the existing fear/sad
messages to your backend, explicitly add
`--backend-url http://localhost:5000/patient/text` (replace host and port with
your backend configuration). Requests have a 10-second timeout and only
successful responses start the 30-second cooldown.

DeepFace downloads emotion model weights on first inference into
`~/.deepface/weights`; internet access is needed for that first run. Keep
that cache for offline runs. The dependency check does not download weights
or run inference. Direct dependencies are pinned; these manifests are not
complete transitive dependency locks (the Windows gaze lock above is separate)
and model weights are not vendored. Emotion installation/inference was not
validated in the Python 3.12 gaze environment.

On Linux/macOS, use `python3.12 -m venv` for gaze/nose (3.11 for emotion) and the environment's `bin/python`
instead of the Windows commands. Linux also needs a desktop display, Tk
and OpenCV GUI system libraries. Camera permissions must be enabled.
If camera 0 is unavailable, try `--camera 1`; if imports fail, ensure you
installed the correct requirements in the interpreter used to launch.

`taking_coordinates.py` is a legacy calibration helper requiring an external
screenshot named `Screenshot 2025-08-20 191946.png` in the working directory;
it overwrites `buttons.py` there. It is not part of the launcher.
