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


class CommunicationController:
    """Gaze chooses a target; a completed double blink requests it once."""
    def __init__(self, buttons, settings=DEFAULT_SETTINGS, diagnostics=None):
        self.buttons = buttons
        self.settings = settings
        self.diagnostics = diagnostics
        self.blinks = BlinkDetector(settings, diagnostics)
        self.intent = DoubleBlinkIntent(settings.double_blink_seconds, diagnostics)
        self.focused = None
        self.tracking_valid = False
        self.last_selection_at = float('-inf')
        self.last_request = None
        self.feedback_until = float('-inf')
        self.completed_blinks = self.selection_attempts = self.selections = 0

    def tracking_lost(self, now):
        if self.tracking_valid:
            self.emit('tracking_lost', now, pending_blink_at=self.intent.pending_at)
        self.tracking_valid = False
        self.focused = None
        self.blinks.reset()
        self.intent.reset()
        # Calibration belongs to the estimator. Feedback/cooldown survive loss.

    def update(self, point, closed, now, tracking_valid=True, timestamp=None):
        if not tracking_valid:
            self.tracking_lost(now)
            return None
        self.tracking_valid = True
        # Eyelid closure makes iris position unreliable; hold focus until reopening.
        if not closed:
            self.focused = hit_test(self.buttons, point)
        completed = self.blinks.update(closed, now)
        self.completed_blinks += int(completed)
        if not self.intent.update(completed, now):
            return None
        self.selection_attempts += 1
        cooldown = max(0.0, self.settings.click_debounce_seconds - (now - self.last_selection_at))
        if self.focused is None or cooldown > 0:
            self.emit('selection_rejected', now,
                      reason='no_target' if self.focused is None else 'cooldown',
                      cooldown_remaining=cooldown)
            return None
        request = PatientRequest(self.focused.id, self.focused.label,
                                 time.time() if timestamp is None else timestamp)
        self.last_request = request
        self.last_selection_at = now
        self.feedback_until = now + FEEDBACK_SECONDS
        self.selections += 1
        self.emit('selection_accepted', now, target_id=request.id, cooldown_remaining=0.0)
        return request

    def feedback(self, now):
        if self.last_request is not None and now < self.feedback_until:
            return f'Selected: {self.last_request.label}'
        return ''

    def emit(self, event, now, **details):
        if self.diagnostics is not None:
            self.diagnostics(dict(event=event, at=now, **details))
