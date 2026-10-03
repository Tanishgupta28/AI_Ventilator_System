"""Hardware-free communication layout, focus, and patient selection events."""
from dataclasses import asdict, dataclass, field
import math
import time

from .config import DEFAULT_SETTINGS
from .interaction import BlinkDetector, DoubleBlinkIntent


OPTIONS = (
    ('water', 'Water'), ('pain', 'Pain'),
    ('call_caregiver', 'Call Caregiver'), ('adjust_position', 'Adjust Position'),
    ('yes', 'Yes'), ('no', 'No'),
)
CANVAS_SIZE = (1280, 720)
HEADER_HEIGHT = 116
FOOTER_HEIGHT = 96
LAYOUT_MARGIN = 32
BUTTON_GAP = 20
FEEDBACK_SECONDS = 3.0


@dataclass(frozen=True)
class CommunicationButton:
    id: str
    label: str
    bounds: tuple[int, int, int, int]

    def contains(self, point):
        x, y = point
        left, top, right, bottom = self.bounds
        # Half-open rectangles avoid ambiguous ownership at shared boundaries.
        return left <= x < right and top <= y < bottom


def make_layout(width, height):
    """Two columns, three rows; renderer and hit testing share these bounds."""
    if type(width) is not int or type(height) is not int or width < 640 or height < 480:
        raise ValueError('Communication canvas must be at least 640 x 480 pixels')
    available_width = width - 2 * LAYOUT_MARGIN - BUTTON_GAP
    available_height = height - HEADER_HEIGHT - FOOTER_HEIGHT - 2 * BUTTON_GAP
    buttons = []
    for index, (identifier, label) in enumerate(OPTIONS):
        row, column = divmod(index, 2)
        left = LAYOUT_MARGIN + column * BUTTON_GAP + column * available_width // 2
        right = LAYOUT_MARGIN + column * BUTTON_GAP + (column + 1) * available_width // 2
        top = HEADER_HEIGHT + row * BUTTON_GAP + row * available_height // 3
        bottom = HEADER_HEIGHT + row * BUTTON_GAP + (row + 1) * available_height // 3
        buttons.append(CommunicationButton(identifier, label, (left, top, right, bottom)))
    return tuple(buttons)


def hit_test(buttons, point):
    if point is None or len(point) != 2 or not all(math.isfinite(v) for v in point):
        return None
    return next((button for button in buttons if button.contains(point)), None)


@dataclass(frozen=True)
class PatientRequest:
    id: str
    label: str
    timestamp: float
    type: str = field(default='patient_request', init=False)

    def to_dict(self):
        return asdict(self)


class TargetStability:
    """A continuous candidate dwell changes focus; short gaps retain focus."""
    def __init__(self, dwell=0.25, clear=0.25):
        if any(not math.isfinite(v) or v < 0 for v in (dwell, clear)):
            raise ValueError('Target timing must be finite and nonnegative')
        self.dwell, self.clear = dwell, clear
        self.reset()

    def reset(self):
        self.candidate = self.focused = None
        self.candidate_since = None

    def pause(self):
        # Closed/reopening time must not count toward candidate qualification.
        self.candidate = None
        self.candidate_since = None

    def update(self, candidate, now):
        if candidate != self.candidate or self.candidate_since is None:
            self.candidate, self.candidate_since = candidate, now
        delay = self.clear if candidate is None else self.dwell
        if now - self.candidate_since >= delay:
            self.focused = candidate
        return self.focused

    def eligible(self, now):
        return (self.focused is not None and self.candidate == self.focused
                and self.candidate_since is not None
                and now - self.candidate_since >= self.dwell)


class CommunicationController:
    """Gaze chooses a target; a completed double blink requests it once."""
    def __init__(self, buttons, settings=DEFAULT_SETTINGS, diagnostics=None):
        self.buttons = buttons
        self.settings = settings
        self.diagnostics = diagnostics
        self.blinks = BlinkDetector(settings, diagnostics)
        self.intent = DoubleBlinkIntent(settings.double_blink_seconds, diagnostics)
        self.stability = TargetStability(settings.target_stability_seconds, settings.target_clear_seconds)
        self.candidate = None
        self.focused = None
        self.locked_target = None
        self.lock_started_at = None
        self.tracking_valid = False
        self.last_selection_at = float('-inf')
        self.last_request = None
        self.feedback_until = float('-inf')
        self.completed_blinks = self.selection_attempts = self.selections = 0

    def tracking_lost(self, now):
        if self.tracking_valid:
            self.emit('tracking_lost', now, pending_blink_at=self.intent.pending_at)
        self.tracking_valid = False
        self.focused = self.candidate = None
        self.stability.reset()
        self.cancel_lock(now, 'tracking_loss')
        self.blinks.reset()
        self.intent.reset()
        # Calibration belongs to the estimator. Feedback/cooldown survive loss.

    def update(self, point, closed, now, tracking_valid=True, timestamp=None):
        if not tracking_valid:
            self.tracking_lost(now)
            return None
        self.tracking_valid = True
        # Expire before considering a fresh first closure, including non-blink frames.
        if self.intent.pending_at is not None and now > self.intent.pending_at + self.intent.interval:
            self.intent.update(False, now)
            self.cancel_lock(now, 'selection_window')
        if (self.intent.pending_at is None and self.lock_started_at is not None
                and now > self.lock_started_at + self.settings.blink_max_closed_seconds + self.settings.blink_reopen_seconds):
            self.cancel_lock(now, 'closure_timeout')
        previous_state = self.blinks.state
        if closed and previous_state == 'OPEN' and self.intent.pending_at is None:
            self.locked_target = self.focused if self.stability.eligible(now) else None
            self.lock_started_at = now
            self.emit('target_locked' if self.locked_target else 'target_lock_rejected', now,
                      target_id=self.locked_target.id if self.locked_target else None,
                      reason=None if self.locked_target else 'no_stable_target')
        completed = self.blinks.update(closed, now)
        self.completed_blinks += int(completed)
        self.candidate = hit_test(self.buttons, point)
        if not closed and previous_state in ('UNKNOWN', 'OPEN') and self.blinks.state == 'OPEN':
            self.focused = self.stability.update(self.candidate, now)
        else:
            self.stability.pause()
        if previous_state == 'CLOSED' and self.blinks.state == 'OPEN' and not completed:
            self.cancel_lock(now, 'invalid_closure')
        if not self.intent.update(completed, now):
            return None
        self.selection_attempts += 1
        target = self.locked_target
        self.cancel_lock(now, 'pair_consumed')
        cooldown = max(0.0, self.settings.click_debounce_seconds - (now - self.last_selection_at))
        if target is None or cooldown > 0:
            self.emit('selection_rejected', now,
                      reason='no_target' if target is None else 'cooldown',
                      cooldown_remaining=cooldown)
            return None
        request = PatientRequest(target.id, target.label,
                                 time.time() if timestamp is None else timestamp)
        self.last_request = request
        self.last_selection_at = now
        self.feedback_until = now + FEEDBACK_SECONDS
        self.selections += 1
        self.emit('selection_accepted', now, target_id=request.id, cooldown_remaining=0.0)
        return request

    def cancel_lock(self, now, reason):
        if self.lock_started_at is not None:
            self.emit('target_lock_cleared', now, reason=reason,
                      target_id=self.locked_target.id if self.locked_target else None)
        self.locked_target = self.lock_started_at = None

    def feedback(self, now):
        if self.last_request is not None and now < self.feedback_until:
            return f'Selected: {self.last_request.label}'
        return ''

    def emit(self, event, now, **details):
        if self.diagnostics is not None:
            self.diagnostics(dict(event=event, at=now, **details))
