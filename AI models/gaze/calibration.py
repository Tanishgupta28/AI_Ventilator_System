"""Five-target median calibration; no camera, model, or GUI dependencies."""
from dataclasses import dataclass
import json
import math
from pathlib import Path
from statistics import median
import tempfile

TARGETS = ("CENTER", "LEFT", "RIGHT", "UP", "DOWN")
MIN_RANGE = 0.001


def valid_sample(sample):
    return (isinstance(sample, (tuple, list)) and len(sample) == 2
            and all(finite_number(v) for v in sample))


def finite_number(value):
    try:
        return type(value) in (int, float) and math.isfinite(value)
    except OverflowError:
        return False


@dataclass(frozen=True)
class CalibrationProfile:
    center: tuple[float, float]
    left: float
    right: float
    up: float
    down: float
    samples_per_target: int

    def __post_init__(self):
        if not valid_sample(self.center):
            raise ValueError("Calibration center must contain two finite numbers")
        if type(self.samples_per_target) is not int or self.samples_per_target < 5:
            raise ValueError("At least five samples per target are required")
        for center, negative, positive in ((self.center[0], self.left, self.right),
                                           (self.center[1], self.up, self.down)):
            if not all(finite_number(v) for v in (negative, positive)):
                raise ValueError("Calibration ranges must be finite numbers")
            if not all(math.isfinite(v - center) for v in (negative, positive)):
                raise ValueError("Calibration range overflow")
            if (negative - center) * (positive - center) >= 0:
                raise ValueError("Opposite targets must lie on opposite sides of center")
            if min(abs(negative - center), abs(positive - center)) < MIN_RANGE:
                raise ValueError("Calibration gaze range is too small")

    def map(self, sample):
        """Screen-normalized coordinates: stored center is (0.5, 0.5), not (0, 0)."""
        if not valid_sample(sample):
            raise ValueError("Invalid gaze sample")
        return tuple(map_axis(value, center, negative, positive)
                     for value, center, negative, positive in
                     ((sample[0], self.center[0], self.left, self.right),
                      (sample[1], self.center[1], self.up, self.down)))

    def to_dict(self):
        return {"version": 1, "center": list(self.center), "left": self.left,
                "right": self.right, "up": self.up, "down": self.down,
                "samples_per_target": self.samples_per_target}

    @classmethod
    def from_dict(cls, data):
        fields = {"version", "center", "left", "right", "up", "down", "samples_per_target"}
        if not isinstance(data, dict) or set(data) != fields:
            raise ValueError("Unexpected calibration schema")
        if type(data["version"]) is not int or data["version"] != 1:
            raise ValueError("Unsupported calibration version")
        if not valid_sample(data["center"]):
            raise ValueError("Invalid calibration center")
        return cls(tuple(data["center"]), data["left"], data["right"],
                   data["up"], data["down"], data["samples_per_target"])


def map_axis(value, center, negative, positive):
    """Each side maps linearly to its target, including reversed camera axes."""
    if (value - center) * (negative - center) >= 0:
        return 0.5 - 0.5 * (value - center) / (negative - center)
    return 0.5 + 0.5 * (value - center) / (positive - center)


def load_profile(path):
    """Return None for missing/invalid data so the caller can use fixed mapping."""
    try:
        return CalibrationProfile.from_dict(json.loads(Path(path).read_text(encoding="utf-8")))
    except (OSError, UnicodeError, ValueError, TypeError):
        return None


def save_profile(profile, path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent,
                                         delete=False, suffix=".tmp") as stream:
            temporary = Path(stream.name)
            json.dump(profile.to_dict(), stream, indent=2, allow_nan=False)
            stream.write("\n")
        temporary.replace(path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


class CalibrationSession:
    """Space arms one target; wait for settling, then collect valid open-eye samples."""
    def __init__(self, samples_per_target=30, settle_seconds=0.5):
        if type(samples_per_target) is not int or samples_per_target < 5:
            raise ValueError("At least five samples per target are required")
        self.samples_per_target = samples_per_target
        self.settle_seconds = settle_seconds
        self.samples = {target: [] for target in TARGETS}
        self.target_index = 0
        self.started_at = None

    @property
    def done(self):
        return self.target_index == len(TARGETS)

    @property
    def target(self):
        return None if self.done else TARGETS[self.target_index]

    def start_target(self, now):
        if not self.done and self.started_at is None:
            self.started_at = now

    def add_sample(self, sample, now):
        if (self.done or self.started_at is None
                or now - self.started_at < self.settle_seconds or not valid_sample(sample)):
            return False
        self.samples[self.target].append(tuple(sample))
        if len(self.samples[self.target]) == self.samples_per_target:
            self.target_index += 1
            self.started_at = None
        return True

    def profile(self):
        if not self.done:
            raise ValueError("Calibration is incomplete")
        centers = {target: tuple(median(s[axis] for s in samples) for axis in (0, 1))
                   for target, samples in self.samples.items()}
        return CalibrationProfile(centers["CENTER"], centers["LEFT"][0], centers["RIGHT"][0],
                                  centers["UP"][1], centers["DOWN"][1], self.samples_per_target)
