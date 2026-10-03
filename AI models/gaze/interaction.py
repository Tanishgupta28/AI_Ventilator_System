"""Completed-blink intent, eyebrow state, and one gated mouse boundary."""
import time

from .config import DEFAULT_SETTINGS
from .geometry import nearest_button


class BlinkDetector:
    """OPEN -> CLOSED -> REOPENING -> OPEN emits one completed blink."""
    def __init__(self, settings=DEFAULT_SETTINGS):
        self.settings = settings
        self.reset()

    def reset(self):
        # Reacquisition must observe open eyes before accepting a closure.
        self.state = 'UNKNOWN'
        self.closed_at = None
        self.reopened_at = None

    def update(self, closed, now):
        if self.state == 'UNKNOWN':
            if not closed:
                self.state = 'OPEN'
        elif self.state == 'OPEN':
            if closed:
                self.state = 'CLOSED'
                self.closed_at = now
        elif self.state == 'CLOSED':
            if not closed:
                duration = now - self.closed_at
                if self.settings.blink_min_closed_seconds <= duration <= self.settings.blink_max_closed_seconds:
                    self.state = 'REOPENING'
                    self.reopened_at = now
                else:
                    self.state = 'OPEN'
                    self.closed_at = None
        elif closed:
            self.state = 'CLOSED'
            self.reopened_at = None
        elif now - self.reopened_at >= self.settings.blink_reopen_seconds:
            self.state = 'OPEN'
            self.closed_at = self.reopened_at = None
            return True
        return False


class DoubleBlinkIntent:
    """Two completed blinks form one selection event; no delayed retry."""
    def __init__(self, interval=0.5):
        self.interval = interval
        self.pending_at = None

    def reset(self):
        self.pending_at = None

    def update(self, completed_blink, now):
        if self.pending_at is not None and now - self.pending_at > self.interval:
            self.pending_at = None
        if not completed_blink:
            return False
        if self.pending_at is not None:
            self.pending_at = None
            return True
        self.pending_at = now
        return False


class GestureState:
    """Eyebrow hysteresis and snap lock; tracking loss clears transient state."""
    def __init__(self, settings=DEFAULT_SETTINGS):
        self.settings = settings
        self.reset()

    def reset(self):
        self.eyebrow_state = 'relaxed'
        self.locked_until = 0
        self.lock_position = None

    def update_eyebrow(self, gap):
        if gap > self.settings.eyebrow_raise_pixels and self.eyebrow_state == 'relaxed':
            self.eyebrow_state = 'raised'
            return 'raised'
        if gap < self.settings.eyebrow_relax_pixels and self.eyebrow_state == 'raised':
            self.eyebrow_state = 'relaxed'
            return 'snap'
        return None

    def hold_cursor(self, position, now):
        self.lock_position = position
        self.locked_until = now + self.settings.snap_hold_seconds

    def cursor_target(self, gaze_position, now):
        if now < self.locked_until and self.lock_position:
            return self.lock_position
        return gaze_position


class InteractionController:
    def __init__(self, mouse, regions, dry_run=False, settings=DEFAULT_SETTINGS):
        self.mouse = mouse
        self.regions = regions
        self.dry_run = dry_run
        self.settings = settings
        self.state = GestureState(settings)
        self.blinks = BlinkDetector(settings)
        self.intent = DoubleBlinkIntent(settings.double_blink_seconds)
        self.last_selection_at = float('-inf')
        self.virtual_cursor = None
        self.last_move_requested = None
        self.tracking_valid = False
        self.completed_blinks = self.action_attempts = self.actual_mouse_actions = 0
        self.click_attempts = self.snap_attempts = self.movement_attempts = 0

    def cursor_position(self):
        if self.dry_run and self.virtual_cursor is not None:
            return self.virtual_cursor
        return self.mouse.position()

    def tracking_lost(self):
        self.tracking_valid = False
        self.blinks.reset()
        self.intent.reset()
        self.state.reset()
        self.last_move_requested = None
        # Calibration is owned by the estimator; cooldown survives brief loss.

    def move_cursor(self, position):
        if not self.tracking_valid or position == self.last_move_requested:
            return
        self.movement_attempts += 1
        self.action_attempts += 1
        if not self.dry_run:
            self.mouse.moveTo(*position)
            self.actual_mouse_actions += 1
        self.virtual_cursor = position
        self.last_move_requested = position

    def process(self, geometry, gaze_position, now=None):
        now = time.monotonic() if now is None else now
        if geometry is None or gaze_position is None:
            self.tracking_lost()
            return
        self.tracking_valid = True
        closed = (geometry.left_lid_gap < self.settings.blink_threshold
                  and geometry.right_lid_gap < self.settings.blink_threshold)
        completed = self.blinks.update(closed, now)
        self.completed_blinks += int(completed)
        click_intent = self.intent.update(completed, now)
        # Do not move, snap, or click while closed or awaiting stable reopening.
        if self.blinks.state != 'OPEN':
            return
        eyebrow_event = self.state.update_eyebrow(geometry.eyebrow_gap)
        can_select = now - self.last_selection_at >= self.settings.click_debounce_seconds
        if eyebrow_event == 'snap' and can_select and not click_intent:
            nearest = nearest_button(*gaze_position, self.regions)
            if nearest:
                cx, cy, label = nearest
                self.snap_attempts += 1
                self.last_selection_at = now
                self.state.hold_cursor((cx, cy), now)
                print(f'Snap intent: {label}')
        # Move to the current gaze/snap target before clicking it, not a stale location.
        target = self.state.cursor_target(gaze_position, now)
        self.move_cursor(target)
        if click_intent and can_select:
            self.click_attempts += 1
            self.action_attempts += 1
            self.last_selection_at = now
            if not self.dry_run:
                self.mouse.click()
                self.actual_mouse_actions += 1
            print('Double completed blink -> selection intent')
