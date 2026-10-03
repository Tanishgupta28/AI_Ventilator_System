# AI demos and communication prototype

Use **64-bit Python 3.11 or 3.12** for gaze/nose tracking on a desktop with a webcam.
The separate emotion environment still requires **Python 3.11** because
TensorFlow 2.15.1 has no Python 3.12 distribution. These scripts open
OpenCV windows; legacy gaze and nose modes also move and click the system mouse.
The dedicated `communication` mode uses local request events and no OS mouse actions.
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
| `buttons.py` | Original desktop-demo rectangles; communication owns a separate layout. |
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

Two completed blinks within **0.65 seconds** form one click intent (Stage 3.6 default). The pair is
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

### Stage 3.6 center and double-blink investigation

Calibration mapping keeps the stored center at `(0.5, 0.5)` in the pipeline's
normalized screen representation. Signed neutral gaze is `2 * mapped - 1`, hence
`(0, 0)`. Each axis uses the same existing equations:

- Toward the negative target: `0.5 - 0.5 * (value-center)/(negative-center)`.
- Toward the positive target: `0.5 + 0.5 * (value-center)/(positive-center)`.

These preserve asymmetric ranges and reversed axes. No center equation was
changed. The dead zone preserves center, and both exponential filters converge
there; a previously displaced cursor/filter may take several frames to settle.
The Stage 3.5 center result was already displaced before filtering, consistent
with a different raw measurement from the stored calibration center. Within-session
center readings also varied during Stage 3.6. This does not establish whether
head posture, pixel rounding, landmark variability or user eye positioning caused
that variation. Repeat calibration at a stable head position rather than adding
an arbitrary screen offset.

Ten new prompted double-blink attempts at the original 0.5-second window each
produced two completed events. Eight selected; the two rejected intervals were
0.531 and 0.625 seconds. Neither cooldown nor tracking loss rejected those trials.
The new **0.65-second** default is a small increase supported by these measurements;
the **0.012 eye-closure threshold**, blink classifier, smoothing and cooldown are
unchanged. A larger pairing window can join unrelated blinks, so further human
false-selection testing remains necessary. The original Stage 3.5 misses cannot
be individually diagnosed because their timestamps were not recorded.

The follow-up 0.65-second live test selected in nine of ten prompted trials.
All nine detected pairs were accepted. The remaining trial registered one
continuous closure of about 0.797 seconds, rather than two completed blink events;
no cooldown or tracking reset interrupted any trial. Its physical cause cannot be
inferred from event logs. Follow-up pair intervals were all at most 0.5 seconds,
so this separate live run does not isolate the benefit of the timing change.
Both human timing sessions had zero tracking-loss frames and zero actual mouse
calls, running at approximately 30 FPS.

Real center checks with the existing profile remained vertically offset. Two
fresh five-target calibration attempts were rejected by existing validation;
in the measured retry, DOWN had exactly the same vertical median as CENTER.
No invalid profile replaced the original, and no arbitrary mapping offset was
introduced. A repeatable head position and distinguishable calibration samples
are still needed; center stability is an unresolved prototype limitation.
Calibration collection and eye geometry were not redesigned in this stage.

Verification: 47 deterministic tests passed (36 existing tests, retaining explicit
0.5-second legacy timing cases, plus 11 new tests). Syntax, CLI/help and invalid
options, dependency imports and diff checks passed. The two human sessions
processed 3,978 valid tracking frames. Subsequent 120-frame bounded app probes
opened the camera and exited cleanly with all desktop actions guarded; however,
no usable landmarks or gaze updates were obtained. An instrumented final probe
confirmed zero MediaPipe face results despite valid camera reads. Camera release
and exactly one MediaPipe close were checked. This validates safe loss handling
and cleanup, not successful gaze inference for those final app probes. It does
not explain the earlier transient; no tracking redesign was made.

Override the interval and inspect lightweight monotonic events in safe mode:

```powershell
.\.venv\Scripts\python.exe "AI models/run.py" gaze --dry-run --max-frames 300 --double-blink-window 0.65 --intent-diagnostics
```

Diagnostics report closure starts, reopening/duration rejection, completed events,
first-event storage, interval expiry, received-event intervals, accepted pairs,
selection/cooldown outcomes and tracking resets. Output is optional and restricted
to dry runs through the CLI. Expiry compares timestamps against the first event's
deadline, retaining an inclusive interval boundary. No images or landmark arrays
are logged. Existing Stage 3.5 loss records combine invalid reads, absent faces and
invalid geometry, so that transient's root cause remains unresolved.

## Stage 4 patient communication interface

This dedicated OpenCV screen is a hackathon/research assistive communication
prototype. It displays local requests only. It does not control a ventilator,
change treatment settings, make clinical decisions, or send caregiver/backend
messages. No framework, GPU requirement, model training, or dependency was added.

From the repository root:

```powershell
.\.venv\Scripts\python.exe "AI models/run.py" communication --check
.\.venv\Scripts\python.exe "AI models/run.py" communication --camera 0 --calibration calibration/user.calibration.json
```

The calibration profile is optional. Missing/invalid profiles visibly select the
existing fixed-sensitivity fallback. To create one, use the existing
`gaze --calibrate calibration/user.calibration.json` flow first. Personal files
remain Git-ignored. Focus the communication window and press Q/Escape to exit.

For a bounded run (the communication preview remains visible):

```powershell
.\.venv\Scripts\python.exe "AI models/run.py" communication --dry-run --max-frames 120 --camera 0 --calibration calibration/user.calibration.json
```

Communication mode is always independent of OS mouse actions, even without
`--dry-run`. It does not import PyAutoGUI, read the desktop cursor, or use the
legacy eyebrow snapping/lock. `gaze` retains the older desktop demo. The shared
blink threshold remains **0.012**, pairing window **0.65 seconds**, smoothing
**0.3 current + 0.7 previous**, and default dead-zone half-width **0.01**.
`--intent-diagnostics` can report communication intent events interactively.

```text
Camera -> mirrored OpenCV frame -> RGB -> MediaPipe FaceMesh/iris landmarks
       -> eye-relative gaze -> optional calibration / fallback -> smoothing
       -> dead zone -> canvas mapping/clamping -> rectangle hit testing
       -> candidate target -> monotonic target-stability filter
       -> stable focused option -> first closure locks eligible target
       -> second completed blink confirms locked target -> one PatientRequest
```

The fullscreen view displays a 1280 x 720 canvas. Six large rectangles are laid
out in two columns and three rows:

| Left | Right |
| --- | --- |
| WATER | PAIN |
| CALL CAREGIVER | ADJUST POSITION |
| YES | NO |

Each target is 598 x 156 canvas pixels, separated by 20-pixel gaps. Bounds are
defined once and shared by drawing and hit testing. Rectangles include their
left/top edges and exclude right/bottom edges. Header, footer, gaps and screen
edges contain no target. The window scales the canvas; gaze coordinates refer
to that same canvas rather than the OS desktop. Large targets, spacing and the
existing filter/dead zone tolerate some drift without adding calibration offsets.
Real center repeatability remains an unresolved limitation.

A focused button has a bright border and colored fill; the gaze marker, tracking
status and calibration status are visible. Looking alone never selects. A candidate
must remain consistent for 250 ms before becoming stable focus; a persistent gap
clears focus after 250 ms. These durations use monotonic time and are configurable
with `--target-stability` and `--target-clear`. Brief departures retain the highlight,
but a stale candidate cannot qualify for selection.

The first closure locks an eligible stable target. Two completed blinks within
0.65 seconds confirm that same target, even if gaze shifts while blinking.
Closed/reopening frames do not qualify new focus or update the communication gaze
smoother. Invalid closure, timeout, tracking loss, and consuming a pair clear the
lock. No-target/cooldown rejection consumes the pair so it cannot activate a later
target. The existing 0.3-second cooldown applies.

Each successful selection prints one local JSON event, for example:

```json
{"type": "patient_request", "id": "water", "label": "Water", "timestamp": 1234567890.0}
```

The timestamp is Unix time in seconds; monotonic time handles pairing, cooldown
and feedback expiry. `Selected: Water` remains visible for three seconds. No
database, network request, audio, or clinical action follows the event.

Tracking loss clears focus and pending blink state, suppresses selections and
resets the transient smoother. Calibration and brief selection feedback survive.
Valid landmarks automatically resume tracking, with a fresh pair required for
selection. Three consecutive invalid camera reads stop safely. Camera/model/window
cleanup uses `ExitStack`, including exceptional exits.

| Module | Responsibility |
| --- | --- |
| `gaze/communication.py` | Pure layout, hit testing, focus, selection/debounce and immutable request structure. |
| `gaze/communication_app.py` | Camera/inference integration, OpenCV rendering, local JSON output and cleanup. |
| `run.py` | Single CLI entry point, communication mode and dependency checks without PyAutoGUI. |
| `tests/test_communication.py` | Hardware-free layout/interaction regressions. |

Dedicated application targets provide larger, predictable interaction areas,
deterministic tests and direct events with reduced accidental desktop interaction.
This does not establish clinical validity or reliable targeting for every user.

Stage 4 verification: **69 tests passed** (47 existing, 22 new). Syntax, CLI/help,
invalid-option checks, gaze/communication imports and visual rendering passed.
A real CPU webcam run processed **120/120 valid landmark and gaze frames** at
approximately **25.8 FPS**, with zero blink events, selections or OS mouse actions.
PyAutoGUI imports were independently blocked, camera release was checked and
MediaPipe closed exactly once. Deliberate WATER/YES/NO selection, no-target blinks
and physical tracking-loss/recovery checks still require human participation;
the automated run is not evidence that those intended selections succeeded.

## Stage 4.6 / 4.7 engineering checkpoint

Computational iris centers and eye bounds now retain floating-point pixel
coordinates through normalization, calibration and smoothing. Integer conversion
occurs only for OpenCV drawing. Landmark indices, bounds offsets, calibration
equations, blink threshold and pairing window remain unchanged. Tests explicitly
show subpixel motion that previously collapsed to identical integer-derived gaze.
Optional local frame diagnostics compare raw, calibrated, smoothed and mapped
gaze with candidate, stable and locked targets; personal profiles/logs are ignored
by Git.

**94 deterministic tests pass, but human communication usability remains unresolved.**
Float geometry and fresh calibration improved vertical row ordering and some
intended stable-focus occupancy. WATER reached 68.5%, PAIN 54.8%, CALL CAREGIVER
39.4%, and ADJUST POSITION 43.8%; YES and NO remained 0%. Downward calibration
separation was small relative to within-target variation, and residual drift and
wrong-row focus persisted. Selection trials were stopped after gaze-only checks;
these results do not establish successful human selection or clinical validity.
Both 250 ms timing defaults remain provisional. Real mouse actions and networking
were disabled during validation. This checkpoint preserves verified engineering
improvements rather than claiming that the interface is usable.

## Stage 4.8 calibration research checkpoint

Calibration schema validity does not establish useful signal separation. The
research tools report median, standard deviation, median absolute deviation,
sample diversity, and directional separation divided by combined within-target
spread. Spread is the larger of standard deviation and scaled MAD; a ratio below
2 triggers an engineering LOW warning. It is not clinical confidence, and does
not reject or delete an existing profile.

Collect an experimental grid into a separate, ignored file:

```powershell
.\.venv\Scripts\python.exe "AI models/run.py" communication --calibrate-grid calibration/grid-run1.json
```

Collect a second file independently to assess repeatability. All nine points use
30 valid open-eye float-geometry samples. Space starts each point; Q/Escape
cancels. Collection does not import PyAutoGUI or send network requests, refuses
to overwrite an existing collection, and releases camera/model/window resources.
Personal profiles, measurements, and generated evaluations under `calibration/`
remain Git-ignored.

`gaze.grid_calibration` exposes `load_grid`, `compare_mappings` and `compare_runs`.
The first two thirds of each target's samples train the models; the final third
is held out. NumPy least squares fits a coupled 2D affine mapping with degeneracy
checks. The comparison includes the original piecewise equation fitted to the
five grid cross targets, accounting for their known canvas anchors. An existing
saved five-point profile can also be supplied as a separate baseline. Predictions
are evaluated without clamping/smoothing so extrapolation is visible. Reports
include median/mean/p90 pixel error, horizontal/vertical mean absolute error, and
button-region matches; the middle-column dots are gaps and are excluded from
button-match denominators. Independent-run comparison additionally reports all
nine median drifts, transfer errors in both directions, and observed center/bottom
range overlap. These are prototype engineering measurements, not clinical accuracy.

Human research collected all nine points twice. The affine candidate improved
some errors and button-region matches, but not consistently across points/runs.
Run 2 yielded 49/60 held-out button matches, including only 1/10 for PAIN; eight
PAIN samples mapped to ADJUST POSITION. CENTER vertical median drift between runs
was about 0.0138. Bottom separation was marginal in one run, and TOP-RIGHT versus
MIDDLE-RIGHT strongly overlapped in that run. The live five-point mapper was
retained; gaze-only and selection trials were not advanced. Six-button direct-gaze
usability remains unresolved. The research checkpoint passes 119 deterministic
tests, including three additional regressions preserving repeatability/overlap
analysis. No successful communication-usability claim follows from these tests.

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
