# AI demos

Use **64-bit Python 3.11** on a desktop with a webcam. These scripts open
OpenCV windows; gaze and nose modes also move and click the system mouse.
They are experimental demos, not validated clinical measurements.

## Gaze and nose tracking

From the repository root in PowerShell:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r "AI models/requirements.txt"
.\.venv\Scripts\python.exe -m pip check
.\.venv\Scripts\python.exe "AI models/run.py" gaze --check
.\.venv\Scripts\python.exe "AI models/run.py" gaze --camera 0
```

Use `nose` instead of `gaze` for nose tracking; press `c` in its preview
window to calibrate the center. Gaze mode uses the original fixed button
coordinates, which must match your interface layout. Both modes control the
mouse immediately. Keep PyAutoGUI's corner fail-safe enabled. Press `q` or
Escape with the preview focused to exit.

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
complete transitive dependency locks and model weights are not vendored.

On Linux/macOS, use `python3.11 -m venv` and the environment's `bin/python`
instead of the Windows commands. Linux also needs a desktop display, Tk
and OpenCV GUI system libraries. Camera permissions must be enabled.
If camera 0 is unavailable, try `--camera 1`; if imports fail, ensure you
installed the correct requirements in the interpreter used to launch.

`taking_coordinates.py` is a legacy calibration helper requiring an external
screenshot named `Screenshot 2025-08-20 191946.png` in the working directory;
it overwrites `buttons.py` there. It is not part of the launcher.
