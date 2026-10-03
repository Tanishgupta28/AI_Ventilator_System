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

## Gaze pipeline and module responsibilities

This is a prototype assistive interaction system, not a medical-device control
system. The current heuristic maps facial geometry to desktop mouse actions;
it does not estimate a calibrated point of visual attention or claim clinical
accuracy. Stage 2 separates responsibilities without redesigning that heuristic.

```text
Camera -> mirrored OpenCV BGR frame -> RGB frame -> MediaPipe Face Mesh
       -> first face's eye/iris geometry -> normalize and apply sensitivity
       -> relative gaze smoothing -> screen mapping and clamping
       -> blend with actual desktop cursor -> interaction controller
```

| Module | Responsibility |
| --- | --- |
| `main3.py` | Small compatibility entry point; reads camera/dry-run environment settings. |
| `run.py` | CLI validation and dependency checks; existing camera, dry-run, and backend options. |
| `gaze/config.py` | Named landmark indices and the original tuning values. |
| `gaze/geometry.py` | Pure landmark geometry, stateful gaze filter, screen mapping, cursor blending, nearest button. |
| `gaze/interaction.py` | Eyebrow/blink transitions, snap lock, and mouse action boundary. |
| `gaze/app.py` | Camera capture, FaceMesh inference, pipeline orchestration, preview, counters, cleanup. |
| `buttons.py` | Single source for the original fixed button regions. |
| `tests/test_gaze_logic.py` | Hardware-free numerical and gesture-state regression tests. |

**Detection and geometry.** Camera selection is the existing `--camera` index.
OpenCV mirrors each frame horizontally and converts BGR to RGB for FaceMesh.
`FaceMesh(refine_landmarks=True)` runs on the CPU; unchanged defaults are
streaming mode, one face, detection confidence 0.5, tracking confidence 0.5.
Only the first face is used. The iris pixel position is the integer-truncated
average of right indices **474–477** and left indices **469–472**.
The eye rectangle uses x indices **133, 362**, top y **27, 257** (plus one pixel),
and bottom y **23, 253** (minus one pixel). Integer conversion happens before
normalization, as in the original code.

**Estimation, smoothing, mapping.** Each axis uses
`relative = (iris - lower_bound) / max(1, upper_bound - lower_bound)`.
Values are amplified around 0.5 with left/right sensitivity **40.0** and
up/down sensitivity **310.0**. An exponential filter uses
`0.3 * current + 0.7 * previous`, initialized at `(0.5, 0.5)`.
The relative filter state is retained when a face disappears. Values can
exceed `[0, 1]`; they are multiplied by the screen dimensions and clamped
to a **10-pixel margin**. A second blend uses **0.7 of the actual desktop
cursor position + 0.3 of the mapped target**. This blend follows clamping;
the final blended point can lie inside the margin if the actual cursor is
already at an edge. Dry runs still read the desktop cursor but never move it.

**Interactions.** Before gaze movement, eyebrow gaps use **65/159** and
**295/386**, measured in frame pixels. A gap above **25** marks eyebrows
raised; a later gap below **20** snaps to the nearest fixed button center.
Centers use integer floor division, equal-distance ties retain button order,
and a snapped cursor stays locked for **5 seconds**. Blink gaps use normalized
y distances **145/159** and **386/374**. Both gaps below **0.012** count as
closed; two qualifying frames within **0.5 seconds** trigger a click and
**0.3-second** debounce. This is the original per-frame counter: sustained
eye closure can produce repeated clicks, so it is not a robust detector of
two separate blinks. That behavior, the fixed button layout, and sensitivity
values are intentionally preserved for this stage. There is no dwell selection
or calibration in iris-gaze mode; the separate nose demo has its own center
calibration and is unchanged.

**Actions, networking, lifecycle.** `InteractionController` gates mouse
movement and clicks with `dry_run`. Dry runs suppress the preview and stop
at the requested frame count. Normal preview mode still exits with `q` or
Escape. The gaze pipeline performs **no backend communication**;
`--backend-url` remains explicit and restricted to the unchanged emotion mode.
An `ExitStack` registers cleanup as each runtime resource is created: camera
release, FaceMesh close, then window cleanup. This also fixes the previous
initialization gap where failure during desktop-size lookup could leak the
already-open camera/model. No gaze formula or interaction timing was changed.

Run the deterministic tests from the repository root:

```powershell
python -m unittest discover -s tests -v
```

These tests need only the Python standard library: no camera, GUI, MediaPipe,
or PyAutoGUI imports. They cover indices/rounding, sensitivity, filter state,
clamping/blending order, button ties, eyebrow hysteresis, blink counting,
and snap expiry. Stage 2 validation passed 12 unit tests and an additional
exact comparison against commit `9f59a2f` over 1,000 generated sequential
landmark cases. The real bounded webcam run processed **60 frames, 60 face
landmark results, and 60 gaze calculations**, with mouse move/click methods
guarded to raise if called. No actions occurred and the application exited
cleanly. An injected desktop-size lookup failure also confirmed that the
real camera was released and the real FaceMesh model closed during failed
initialization. Syntax, CLI help, import smoke checks, and `pip check` also passed.

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
