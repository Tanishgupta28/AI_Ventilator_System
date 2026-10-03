"""Original eyebrow/blink state and the single boundary for mouse actions."""
import time

from .config import DEFAULT_SETTINGS
from .geometry import nearest_button


class GestureState:
    """Pure state transitions; time is supplied by the caller."""
    def __init__(self, settings=DEFAULT_SETTINGS):
        self.settings = settings
        self.eyebrow_state = "relaxed"
        self.last_blink_time = 0
        self.blink_count = 0
        self.locked_until = 0
        self.lock_position = None

    def update_eyebrow(self, gap):
        if gap > self.settings.eyebrow_raise_pixels and self.eyebrow_state == "relaxed":
            self.eyebrow_state = "raised"
            return "raised"
        if gap < self.settings.eyebrow_relax_pixels and self.eyebrow_state == "raised":
            self.eyebrow_state = "relaxed"
            return "snap"
        return None

    def update_blink(self, now):
        # Deliberately preserve per-closed-frame counting, not open/closed edges.
        if now - self.last_blink_time < self.settings.double_blink_seconds:
            self.blink_count += 1
        else:
            self.blink_count = 1
        self.last_blink_time = now
        if self.blink_count == 2:
            self.blink_count = 0
            return True
        return False

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

    def move_cursor(self, position):
        if not self.dry_run:
            self.mouse.moveTo(*position)

    def handle_gestures(self, geometry):
        event = self.state.update_eyebrow(geometry.eyebrow_gap)
        if event == "raised":
            print("Eyebrow Raised")
        elif event == "snap":
            print("Eyebrow Relaxed -> SNAP")
            nearest = nearest_button(*self.mouse.position(), self.regions)
            if nearest:
                cx, cy, label = nearest
                print(f"Snapped to: {label}")
                self.move_cursor((cx, cy))
                self.state.hold_cursor((cx, cy), time.time())

        if (geometry.left_lid_gap < self.settings.blink_threshold
                and geometry.right_lid_gap < self.settings.blink_threshold):
            if self.state.update_blink(time.time()):
                if not self.dry_run:
                    self.mouse.click()
                    print("Double Blink -> Click")
                time.sleep(self.settings.click_debounce_seconds)

    def update_cursor(self, position):
        self.move_cursor(self.state.cursor_target(position, time.time()))
