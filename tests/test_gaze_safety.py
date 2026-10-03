"""Pure Stage 3 calibration, timing, tracking-loss, and action-gate tests."""
from dataclasses import replace
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "AI models"))

from gaze.calibration import CalibrationProfile, CalibrationSession, load_profile, save_profile
from gaze.config import DEFAULT_SETTINGS
from gaze.geometry import (EyeGeometry, GazeEstimator, apply_dead_zone,
                           extract_valid_eye_geometry, normalize_gaze, valid_geometry)
from gaze.interaction import BlinkDetector, DoubleBlinkIntent, InteractionController


def sample_profile():
    return CalibrationProfile((0.5, 0.5), 0.3, 0.8, 0.2, 0.7, 5)


class CalibrationTests(unittest.TestCase):
    def test_targets_map_to_center_and_edges(self):
        profile = sample_profile()
        for sample, expected in (((0.5, 0.5), (0.5, 0.5)), ((0.3, 0.2), (0, 0)),
                                 ((0.8, 0.7), (1, 1)), ((0.4, 0.6), (0.25, 0.75))):
            actual = profile.map(sample)
            for value, target in zip(actual, expected):
                self.assertAlmostEqual(value, target)

    def test_reversed_camera_axes_are_supported(self):
        profile = CalibrationProfile((0.5, 0.5), 0.8, 0.3, 0.7, 0.2, 5)
        self.assertEqual(profile.map((0.8, 0.7)), (0, 0))
        self.assertEqual(profile.map((0.3, 0.2)), (1, 1))

    def test_invalid_profiles_are_rejected(self):
        data = sample_profile().to_dict()
        for changes in ({"left": 0.5}, {"left": 0.4999}, {"right": 0.4},
                        {"down": float("nan")}, {"up": float("inf")},
                        {"left": "0.3"}, {"left": True}, {"center": [0.5]},
                        {"samples_per_target": 4}, {"version": 2}, {"version": True},
                        {"unexpected": 1}, {"left": 10 ** 1000}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                CalibrationProfile.from_dict(data | changes)

    def test_missing_corrupt_or_invalid_file_falls_back(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "user.calibration.json"
            self.assertIsNone(load_profile(path))
            for text in ("{", "[]", '{"version":1}', 'null'):
                path.write_text(text)
                self.assertIsNone(load_profile(path))

    def test_profile_round_trip(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "nested" / "user.calibration.json"
            save_profile(sample_profile(), path)
            self.assertEqual(load_profile(path), sample_profile())
            self.assertEqual(json.loads(path.read_text())["version"], 1)

    def test_calibration_medians_ignore_outlier_and_invalid_samples(self):
        session = CalibrationSession(5)
        samples = {"CENTER": (0.5, 0.5), "LEFT": (0.3, 0.5), "RIGHT": (0.8, 0.5),
                   "UP": (0.5, 0.2), "DOWN": (0.5, 0.7)}
        self.assertFalse(session.add_sample((0.5, 0.5), 0))
        for target, sample in samples.items():
            self.assertEqual(session.target, target)
            session.start_target(0)
            self.assertFalse(session.add_sample(sample, 0.4))
            self.assertFalse(session.add_sample(None, 1))
            self.assertFalse(session.add_sample((float("nan"), 0.5), 1))
            for item in (sample, sample, (100, -100), sample, sample):
                self.assertTrue(session.add_sample(item, 1))
        self.assertTrue(session.done)
        self.assertEqual(session.profile(), sample_profile())
        self.assertFalse(session.add_sample((0.5, 0.5), 2))

    def test_incomplete_or_no_range_session_is_rejected(self):
        session = CalibrationSession(5, settle_seconds=0)
        with self.assertRaises(ValueError):
            session.profile()
        while not session.done:
            session.start_target(0)
            for _ in range(5):
                session.add_sample((0.5, 0.5), 1)
        with self.assertRaises(ValueError):
            session.profile()

    def test_calibrated_smoothing_and_reset_retain_profile(self):
        profile = sample_profile()
        estimator = GazeEstimator(profile=profile)
        geometry = EyeGeometry((30, 20), (0, 0, 100, 100), 0, 0.02, 0.02)
        self.assertEqual(normalize_gaze(geometry), (0.3, 0.2))
        self.assertEqual(estimator.estimate(geometry), (0.35, 0.35))
        estimator.reset()
        self.assertEqual(estimator.previous_relative, (0.5, 0.5))
        self.assertIs(estimator.profile, profile)


class StabilityTests(unittest.TestCase):
    def test_dead_zone_center_boundaries_and_endpoints(self):
        for value in (0.49, 0.495, 0.5, 0.505, 0.51):
            result = apply_dead_zone((value, value), 0.01)
            self.assertAlmostEqual(result[0], 0.5)
            self.assertAlmostEqual(result[1], 0.5)
        self.assertEqual(apply_dead_zone((0, 1)), (0, 1))
        self.assertLess(apply_dead_zone((0.489, 0.511))[0], 0.5)
        self.assertGreater(apply_dead_zone((0.489, 0.511))[1], 0.5)

    def test_dead_zone_can_be_disabled_and_rejects_invalid_widths(self):
        self.assertEqual(apply_dead_zone((-2, 3), 0), (-2, 3))
        for width in (-0.01, 0.5, float("nan"), float("inf")):
            with self.assertRaises(ValueError):
                apply_dead_zone((0.5, 0.5), width)

    def test_unavailable_or_nonfinite_landmarks_are_invalid_tracking(self):
        self.assertIsNone(extract_valid_eye_geometry(None, 640, 480))
        self.assertIsNone(extract_valid_eye_geometry([], 640, 480))
        landmarks = [SimpleNamespace(x=0.5, y=0.5) for _ in range(478)]
        self.assertIsNone(extract_valid_eye_geometry(landmarks, 640, 480))
        landmarks[474].x = float("nan")
        self.assertIsNone(extract_valid_eye_geometry(landmarks, 640, 480))
        self.assertFalse(valid_geometry(EyeGeometry((10, 20), (10, 20, 9, 20), 0, 0.02, 0.02)))


class BlinkTests(unittest.TestCase):
    def test_open_closed_confirmed_open_is_one_blink(self):
        detector = BlinkDetector()
        events = [detector.update(closed, now) for closed, now in
                  ((False, 0), (True, 0.1), (True, 0.15), (False, 0.2), (False, 0.27), (False, 0.4))]
        self.assertEqual(events, [False, False, False, False, True, False])

    def test_long_closure_and_continuous_open_do_not_emit_events(self):
        detector = BlinkDetector()
        for i in range(10):
            self.assertFalse(detector.update(False, i / 10))
        for i in range(100):
            self.assertFalse(detector.update(True, 1 + i / 10))
        self.assertFalse(detector.update(False, 12))
        self.assertFalse(detector.update(False, 12.1))

    def test_single_frame_closure_noise_is_rejected(self):
        detector = BlinkDetector()
        for closed, now in ((False, 0), (True, 0.1), (False, 0.12), (False, 0.2)):
            self.assertFalse(detector.update(closed, now))

    def test_single_frame_reopening_noise_is_not_a_blink(self):
        detector = BlinkDetector()
        for closed, now in ((False, 0), (True, 0.1), (False, 0.2), (True, 0.21), (False, 0.3)):
            self.assertFalse(detector.update(closed, now))
        self.assertTrue(detector.update(False, 0.37))
        self.assertFalse(detector.update(False, 0.4))

    def test_closed_start_and_loss_reset_require_open_observation(self):
        detector = BlinkDetector()
        self.assertFalse(detector.update(True, 0))
        self.assertFalse(detector.update(False, 0.2))
        self.assertFalse(detector.update(True, 0.3))
        detector.reset()
        self.assertFalse(detector.update(False, 0.5))
        self.assertFalse(detector.update(False, 0.6))

    def test_minimum_maximum_and_confirmation_boundaries(self):
        settings = replace(DEFAULT_SETTINGS, blink_min_closed_seconds=0.0625,
                           blink_max_closed_seconds=0.5, blink_reopen_seconds=0.0625)
        for duration, accepted in ((0.03125, False), (0.0625, True), (0.5, True), (0.5625, False)):
            detector = BlinkDetector(settings)
            detector.update(False, 0)
            detector.update(True, 1)
            detector.update(False, 1 + duration)
            self.assertEqual(detector.update(False, 1 + duration + 0.0625), accepted)

    def test_double_blink_pair_is_consumed_once_and_expires(self):
        intent = DoubleBlinkIntent(interval=0.5)
        self.assertFalse(intent.update(True, 10))
        self.assertTrue(intent.update(True, 10.5))
        self.assertFalse(intent.update(False, 10.6))
        self.assertFalse(intent.update(True, 11))
        self.assertFalse(intent.update(True, 11.6))
        intent.reset()
        self.assertFalse(intent.update(True, 11.7))


class GuardedMouse:
    """A hardware-free sink that fails any attempt to execute a desktop action."""
    def position(self):
        return (0, 0)

    def moveTo(self, *args):
        raise AssertionError("Mouse movement escaped dry-run gate")

    def click(self):
        raise AssertionError("Mouse click escaped dry-run gate")


class IntentSafetyTests(unittest.TestCase):
    def setUp(self):
        self.controller = InteractionController(GuardedMouse(), {"test": (90, 190, 110, 210)}, dry_run=True)
        self.open = EyeGeometry((50, 50), (0, 0, 100, 100), 22, 0.02, 0.02)
        self.closed = replace(self.open, left_lid_gap=0, right_lid_gap=0)

    def blink(self, started_at):
        for geometry, now in ((self.closed, started_at), (self.open, started_at + 0.07),
                              (self.open, started_at + 0.135)):
            self.controller.process(geometry, (100, 200), now)

    def test_two_completed_blinks_produce_one_gated_click(self):
        self.controller.process(self.open, (100, 200), 0)
        self.blink(1)
        self.blink(1.14)
        self.assertEqual(self.controller.completed_blinks, 2)
        self.assertEqual(self.controller.click_attempts, 1)
        self.assertEqual(self.controller.actual_mouse_actions, 0)
        self.assertEqual(self.controller.cursor_position(), (100, 200))
        self.controller.process(self.open, (100, 200), 2)
        self.assertEqual(self.controller.click_attempts, 1)

    def test_debounce_consumes_intent_without_a_delayed_retry(self):
        self.controller.process(self.open, (100, 200), 0)
        for start in (1, 1.14, 1.28, 1.42):
            self.blink(start)
        self.assertEqual(self.controller.completed_blinks, 4)
        self.assertEqual(self.controller.click_attempts, 1)
        self.controller.process(self.open, (100, 200), 3)
        self.assertEqual(self.controller.click_attempts, 1)

    def test_closure_and_loss_suppress_actions_and_reset_pending_state(self):
        self.controller.process(self.open, (100, 200), 0)
        self.blink(1)
        self.controller.state.hold_cursor((100, 200), 1.2)
        before = self.controller.action_attempts
        for i in range(20):
            self.controller.process(self.closed, (500, 600), 1.3 + i / 10)
        self.assertEqual(self.controller.action_attempts, before)
        self.controller.process(None, None, 4)
        self.assertIsNone(self.controller.state.lock_position)
        self.assertIsNone(self.controller.intent.pending_at)
        self.assertEqual(self.controller.blinks.state, "UNKNOWN")
        self.controller.move_cursor((500, 600))
        self.assertEqual(self.controller.action_attempts, before)
        self.controller.process(self.open, (300, 400), 5)
        self.assertEqual(self.controller.click_attempts, 0)
        self.assertEqual(self.controller.cursor_position(), (300, 400))

    def test_eyebrow_snap_is_one_event_and_loss_clears_lock(self):
        raised = replace(self.open, eyebrow_gap=26)
        relaxed = replace(self.open, eyebrow_gap=19)
        self.controller.process(raised, (80, 180), 0)
        self.controller.process(relaxed, (80, 180), 0.4)
        for i in range(10):
            self.controller.process(relaxed, (300, 400), 0.5 + i / 10)
        self.assertEqual(self.controller.snap_attempts, 1)
        self.assertEqual(self.controller.cursor_position(), (100, 200))
        self.controller.tracking_lost()
        self.assertIsNone(self.controller.state.lock_position)

    def test_tracking_loss_cancels_an_incomplete_double_blink(self):
        self.controller.process(self.open, (100, 200), 0)
        self.blink(1)
        self.assertIsNotNone(self.controller.intent.pending_at)
        self.controller.tracking_lost()
        self.controller.process(self.open, (100, 200), 1.2)
        self.blink(1.25)
        self.assertEqual(self.controller.completed_blinks, 2)
        self.assertEqual(self.controller.click_attempts, 0)

    def test_execution_moves_to_current_target_before_a_single_click(self):
        calls = []
        mouse = SimpleNamespace(position=lambda: (0, 0),
                                moveTo=lambda *position: calls.append(("move", position)),
                                click=lambda: calls.append(("click",)))
        self.controller = InteractionController(mouse, {}, dry_run=False)
        self.controller.process(self.open, (100, 200), 0)
        self.blink(1)
        self.controller.process(self.closed, (300, 400), 1.14)
        self.controller.process(self.open, (300, 400), 1.21)
        self.controller.process(self.open, (300, 400), 1.28)
        self.assertEqual(calls[-2:], [("move", (300, 400)), ("click",)])
        self.assertEqual(sum(call[0] == "click" for call in calls), 1)


if __name__ == "__main__":
    unittest.main()
