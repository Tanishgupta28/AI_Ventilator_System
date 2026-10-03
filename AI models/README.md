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

This processes real webcam frames through CPU FaceMesh and the gaze decision
pipeline. `frames` counts capture attempts; `landmark_frames` counts valid eye
geometry; `gaze_calculations` counts open-eye filter updates. A face may be
present while the eyelid threshold suppresses updates. Check the diagnostics
before interpreting a run as successful user interaction.
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

## Stage 3 gaze processing and intentional interaction

This is a research/hackathon assistive interaction prototype, not a clinically
validated medical device or a ventilator controller. No gaze model is trained;
MediaPipe FaceMesh stays CPU-capable and dependency versions are unchanged.

```text
Camera -> mirrored OpenCV BGR frame -> RGB -> refined MediaPipe landmarks
       -> RAW IRIS POSITION -> EYE-RELATIVE NORMALIZATION
       -> OPTIONAL USER CALIBRATION (otherwise fixed sensitivity)
       -> SMOOTHING -> CENTRAL DEAD ZONE -> SCREEN MAPPING/CLAMPING
       -> GAZE POSITION -> BLINK/EYEBROW INTENT -> GATED ACTION CONTROLLER
```

| Module | Responsibility |
| --- | --- |
| `main3.py` | Compatibility entry point and runtime environment settings. |
| `run.py` | CLI validation, optional calibration and safety settings, import check. |
| `gaze/config.py` | Original landmark indices/smoothing plus explicit safety defaults. |
| `gaze/geometry.py` | Extraction/validity, normalization, filtering, dead zone, screen mapping. |
| `gaze/calibration.py` | Five-target samples, medians, validated profile, JSON persistence. |
| `gaze/interaction.py` | Blink state machine, double-blink intent, eyebrow lock, gated actions. |
| `gaze/app.py` | Camera/inference, calibration window, loss handling, diagnostics, cleanup. |
| `buttons.py` | Original fixed button rectangles; no final communication UI yet. |
| `tests/test_gaze_logic.py` | Stage 2 calculations/gestures; two blink expectations explicitly updated. |
| `tests/test_gaze_safety.py` | Calibration, stability, timing, debounce, loss reset, action gating. |

### Raw gaze, smoothing, and stability

Frame preprocessing, iris indices, integer rounding, and eye rectangle offsets
remain unchanged. `FaceMesh(refine_landmarks=True)` uses streaming mode, one face,
and detection/tracking confidence defaults of 0.5. Only the first face is used.
Right iris indices **474-477** and left **469-472** are averaged to a pixel point.
The eye rectangle uses x **133/362**, top y **27/257** plus one pixel, and bottom
y **23/253** minus one pixel. Each axis is normalized as
`(iris - lower) / max(1, upper - lower)`. Runtime rejects missing/nonfinite
landmarks and collapsed/reversed eye rectangles; the pure legacy denominator
formula remains available and tested.

Without a valid profile, relative gaze is amplified around 0.5 with the original
**40.0 horizontal / 310.0 vertical** sensitivities. With a profile, separate linear
slopes on either side of the user's median center map the measured endpoints to
0 and 1. Reversed axes and asymmetric ranges are supported. Both paths keep the
**0.3 current + 0.7 previous** relative filter, initialized at `(0.5, 0.5)`.
Closed-eye frames do not update that filter. The filtered relative point passes
through a configurable central dead zone: default half-width **0.01** makes
`[0.49, 0.51]` map to 0.5 on each axis. Outside that band, the remaining range is
linearly rescaled to preserve 0 and 1 continuously. `--dead-zone 0` disables it.
This suppresses only small central variation; it is not a measured claim of
improved gaze accuracy or an optimum dead-zone size.

The result is scaled to the desktop and clamped to the original **10-pixel
margin**, then blended with the cursor using **0.7 cursor + 0.3 target**.
The blend still follows clamping, so the final point may be inside the margin
if the current cursor is already at an edge. Safe runs keep a virtual cursor
for the same decision flow without moving the desktop cursor.

### Optional five-target user calibration

Calibration addresses differences in eye geometry, posture, camera setup, and
usable eye movement that fixed gains cannot account for. It is a simple linear
mapping, not a trained predictor or polynomial fit.

```powershell
# Interactive procedure; mouse movement and clicks are ALWAYS disabled.
.\.venv\Scripts\python.exe "AI models/run.py" gaze --camera 0 --calibrate calibration/user.calibration.json

# Reuse a validated profile in a bounded safe run.
.\.venv\Scripts\python.exe "AI models/run.py" gaze --camera 0 --calibration calibration/user.calibration.json --dry-run --max-frames 120
```

The OpenCV target window asks for **CENTER, LEFT, RIGHT, UP, DOWN** in that order.
Look at the dot and press **Space** for each target. The collector waits **0.5
seconds** for settling and then accepts **30 valid open-eye samples per target**
(default total **150**). Counts pause on invalid/no-face/closed-eye frames. The
next target requires another Space press. Keep the head/camera stationary.
Q/Escape cancels. Target dots use the center and 10%/90% positions so they remain
visible; the observed directional ranges are stretched to the screen edges.
`--calibration-samples` changes the count, with a minimum of five.

Coordinate-wise medians reduce the effect of isolated outliers. Each measured
left/right or up/down endpoint must be on the opposite side of its axis center,
finite, and at least **0.001 normalized units** away. Degenerate or inconsistent
sessions fail without saving. This minimum avoids near-zero divisors; it is a
prototype guard, not a statistical accuracy guarantee.

A versioned JSON profile stores median center, left/right x, up/down y, and
sample count. Example schema with **synthetic values only**:

```json
{
  "version": 1,
  "center": [0.5, 0.5],
  "left": 0.3,
  "right": 0.8,
  "up": 0.2,
  "down": 0.7,
  "samples_per_target": 5
}
```

Files are written through a temporary file and atomically replaced after
validation. Personal `calibration/` files and `*.calibration.json` are ignored
by Git. Missing, corrupt, unsupported, or invalid profiles produce a warning
and use the fixed-gain fallback. Cancellation/failure does not replace an
existing profile. Persistent calibration survives temporary tracking loss.
Recalibrate after changing posture, camera, resolution, or display layout.
Profiles are not automatically matched to a person/device. Human participation
and actual point-of-attention accuracy still require manual validation.

### Completed blinks and intentional selection

Stage 2 counted closed-eye frames and could repeatedly click during sustained
closure. Stage 3 instead uses **UNKNOWN -> OPEN -> CLOSED -> REOPENING -> OPEN**.
UNKNOWN requires an open observation after startup/loss. Both eyelid y gaps
(**145/159**, **386/374**) below the original **0.012** threshold mean closed.

One completed blink requires closure lasting **0.06-0.8 seconds**, followed by
**0.06 seconds** of observed stable reopening. Short spikes are rejected and
brief reopening during closure does not produce an event. Long closure emits
no events while closed; closures over 0.8 seconds are discarded on reopening.
These conservative timing defaults reduce sampled-frame noise/prolonged-closure
selection; they are configurable in `GazeSettings` and are not clinically tuned.

Two completed blinks within **0.5 seconds** form one click intent. The pair is
consumed once. A **0.3-second** nonblocking monotonic cooldown suppresses rapid
selection events without freezing capture or queuing a delayed retry. Movement
alone never generates a click. Movement, snapping, and clicking are suppressed
while eyes are closed or reopening is unconfirmed. Gaze/snap movement occurs
before clicking so the action uses the current target rather than stale position.

Eyebrow gaps (**65/159**, **295/386**) retain **25/20-pixel** hysteresis. A raise
followed by relaxation produces one nearest-button snap event; the snap target
now uses the computed gaze cursor rather than an unrelated desktop position.
The **five-second** hold remains. Snap and click share the selection cooldown;
click intent takes precedence if both arrive together. Fixed button coordinates
still need to match the user's layout; there is no dwell-selection feature.

The threshold is a heuristic sensitive to posture, camera distance, and face
shape. The default webcam run classified many observed frames as closed. The
measured eyelid-gap medians were about 0.0077/0.0099 in one run, below 0.012.
`--blink-threshold` permits manual tuning without changing the original default:
validate both open and closed eyes in safe mode before enabling actions. A
verification override of 0.006 exercised the pipeline; that does not establish
correct blink detection for a particular user. Deliberate human blink/double-blink
accuracy and false-selection rates remain manual verification items.

### Tracking loss, runtime metrics, and cleanup

No face, unusable geometry, and invalid camera frames suppress actions immediately.
Pending blinks/pairs, eyebrow state, snap lock, and relative smoothing state reset.
Calibration and the recent-selection cooldown are retained. Reacquisition starts
from a neutral filter and requires observing open eyes before accepting a blink.
One or two invalid camera reads can recover; three consecutive invalid frames
stop safely with a nonzero exit status. Face loss itself does not stop the app.

`ExitStack` releases the camera, closes FaceMesh, and destroys windows, including
initialization failures and processing exceptions. Normal preview exits with
Q/Escape. Bounded dry runs report capture attempts, valid landmark frames,
tracking-loss/invalid-camera frames, gaze filter calculations, classified-closed
frames, approximate FPS, completed blinks, movement/click/snap attempts, and
actual mouse calls. FPS includes capture/inference, not resource initialization.
`action_attempts` counts requested move/click operations; snap intents have their
own counter. `actual_mouse_actions` counts executed PyAutoGUI move/click calls.
No gaze backend calls or GPU requirements were added.

### Stage 3 verification

Run pure tests (only the standard library is needed) and the safe runtime:

```powershell
python -m unittest discover -s tests -v
.\.venv\Scripts\python.exe "AI models/run.py" gaze --check
.\.venv\Scripts\python.exe "AI models/run.py" gaze --dry-run --max-frames 120
```

**36 deterministic tests passed**: ten unchanged Stage 2 regression expectations,
two explicitly replaced blink expectations, and 24 additional tests. Syntax,
CLI/help plus invalid-option checks, dependency imports, and `pip check` passed.
Real webcam/CPU MediaPipe runs had move/click methods independently guarded:

| Run | Frames | Valid landmarks | Gaze updates | Loss frames | FPS | Completed blinks | Action attempts | Actual mouse calls |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Default fallback, threshold 0.012 | 120 | 120 | 8 | 0 | 27.63 | 0 | 2 | 0 |
| Fallback plus five blank inference inputs | 90 | 85 | 11 | 5 | 25.71 | 0 | 4 | 0 |
| Synthetic profile, threshold 0.006, five blank inputs and two invalid reads | 90 | 83 | 83 | 7 | 26.92 | 0 | 83 | 0 |

The last two tests intentionally injected loss inputs into an otherwise real
webcam/MediaPipe path; they are not claims that a participant physically left
and returned. Landmarks recovered afterward and real camera/model cleanup was
confirmed. No personal calibration file was generated or committed. Five-target
collection/median mapping and sustained-closure semantics were validated with
synthetic deterministic inputs, not fabricated human participation.

### Stage 3.5 human validation

One participant completed real webcam calibration with 30 valid samples for each
of CENTER, LEFT, RIGHT, UP and DOWN. The saved personal profile validated and
loaded successfully; it remains in the Git-ignored calibration directory.

The measured open-eye and sustained closed-eye signal ranges separated around
the existing `0.012` threshold, so no threshold or algorithm change was justified.
All ten prompted single blinks produced one completed blink each. Four of five
double-blink trials produced two completed blinks, but only two trials produced
a selection intent. No unexpected selection intents were observed. These counts
use participant-confirmed prompts, not independently annotated video ground truth.

A sustained closure with 60 closed frames produced zero completed blink events
and zero selection intents, including the subsequent reopening phase. All mouse
movement and clicks were disabled and independently guarded throughout testing.

The final direction checks mapped LEFT, RIGHT, UP and DOWN appropriately, but
CENTER had a vertical offset. Valid retry inference ran at approximately 30 FPS
with no tracking losses. An earlier attempt lost tracking near its end; those
direction and closure checks were discarded, and camera reopening recovered
60/60 valid probe frames before the retry. The cause of that loss was not isolated.

Double-blink selection reliability, center calibration repeatability and tracking
robustness remain unresolved. These are qualitative results from one session,
not accuracy estimates or evidence of clinical validation. Personal profiles and
signal measurements are not committed.

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
