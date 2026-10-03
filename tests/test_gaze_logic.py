"""Hardware-free regression checks: python -m unittest discover -s tests -v."""
from pathlib import Path
import sys
from types import SimpleNamespace
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "AI models"))

from gaze.geometry import (
    EyeGeometry, GazeEstimator, blend_cursor, extract_eye_geometry,
    map_to_screen, nearest_button, normalize_and_scale, scale_from_center, smooth_point,
)
from gaze.interaction import GestureState


class GazeGeometryTests(unittest.TestCase):
    def test_landmark_indices_and_pixel_offsets(self):
        landmarks = [SimpleNamespace(x=0.5, y=0.5) for _ in range(478)]
        for index in (474, 475, 476, 477, 469, 470, 471, 472):
            landmarks[index] = SimpleNamespace(x=0.5625, y=0.28125)
        landmarks[133].x = 0.4
        landmarks[362].x = 0.6
        for index in (27, 257, 65, 295):
            landmarks[index].y = 0.4
        for index in (23, 253):
            landmarks[index].y = 0.6
        landmarks[159].y = landmarks[386].y = 0.48
        geometry = extract_eye_geometry(landmarks, 640, 480)
        self.assertEqual(geometry.iris, (360, 135))
        self.assertEqual(geometry.bounds, (256, 193, 384, 287))
        self.assertAlmostEqual(geometry.eyebrow_gap, 38.4)
        self.assertAlmostEqual(geometry.left_lid_gap, 0.02)
        self.assertAlmostEqual(geometry.right_lid_gap, 0.02)

    def test_iris_averages_all_eight_points(self):
        landmarks = [SimpleNamespace(x=0, y=0) for _ in range(478)]
        for index in (474, 475, 476, 477, 469, 470, 471, 472):
            landmarks[index].x = 1
            landmarks[index].y = 1
            self.assertEqual(extract_eye_geometry(landmarks, 640, 480).iris, (80, 60))
            landmarks[index].x = landmarks[index].y = 0

    def test_center_is_fixed_under_asymmetric_sensitivity(self):
        self.assertEqual(scale_from_center(0.5, 20, 80), 0.5)
        self.assertAlmostEqual(scale_from_center(0.45, 20, 80), -0.5)
        self.assertAlmostEqual(scale_from_center(0.55, 20, 80), 4.5)

    def test_existing_sensitivity_and_filter_state(self):
        geometry = EyeGeometry((55, 45), (0, 0, 100, 100), 0, 0, 0)
        scaled = normalize_and_scale(geometry)
        self.assertAlmostEqual(scaled[0], 2.5)
        self.assertAlmostEqual(scaled[1], -15)
        estimator = GazeEstimator()
        first = estimator.estimate(geometry)
        self.assertAlmostEqual(first[0], 1.1)
        self.assertAlmostEqual(first[1], -4.15)
        second = estimator.estimate(geometry)
        self.assertAlmostEqual(second[0], 1.52)
        self.assertAlmostEqual(second[1], -7.405)

    def test_zero_or_reversed_bounds_keep_original_denominator_guard(self):
        geometry = EyeGeometry((10, 20), (10, 20, 9, 20), 0, 0, 0)
        self.assertEqual(normalize_and_scale(geometry), (-19.5, -154.5))

    def test_smoothing_retains_unclamped_values(self):
        self.assertEqual(smooth_point((10, -10), (0, 0), 0.3), (3, -3))

    def test_screen_mapping_clamps_before_cursor_blending(self):
        self.assertEqual(map_to_screen((0.5, 0.5), (1920, 1080)), (960, 540))
        self.assertEqual(map_to_screen((-5, 5), (1920, 1080)), (10, 1070))
        # Final blend can fall inside the margin when the current cursor is at an edge.
        self.assertEqual(blend_cursor((10, 1070), (0, 0)), (3, 321))
        self.assertEqual(blend_cursor((100, 200), (20, 40)), (44, 88))

    def test_nearest_button_uses_integer_centers_and_stable_ties(self):
        regions = {"first": (0, 0, 11, 11), "second": (10, 0, 21, 11)}
        self.assertEqual(nearest_button(10, 5, regions), (5, 5, "first"))
        self.assertEqual(nearest_button(15, 5, regions), (15, 5, "second"))
        self.assertIsNone(nearest_button(0, 0, {}))


class GestureStateTests(unittest.TestCase):
    def test_eyebrow_hysteresis_and_strict_thresholds(self):
        state = GestureState()
        self.assertIsNone(state.update_eyebrow(25))
        self.assertEqual(state.update_eyebrow(26), "raised")
        self.assertIsNone(state.update_eyebrow(26))
        self.assertIsNone(state.update_eyebrow(20))
        self.assertEqual(state.update_eyebrow(19), "snap")
        self.assertIsNone(state.update_eyebrow(19))

    def test_consecutive_closed_frames_keep_existing_click_behavior(self):
        state = GestureState()
        self.assertFalse(state.update_blink(10))
        self.assertTrue(state.update_blink(10.1))
        self.assertEqual(state.blink_count, 0)
        self.assertFalse(state.update_blink(10.2))
        self.assertTrue(state.update_blink(10.3))

    def test_half_second_blink_gap_resets_counter(self):
        state = GestureState()
        self.assertFalse(state.update_blink(10))
        self.assertFalse(state.update_blink(10.5))
        self.assertTrue(state.update_blink(10.6))

    def test_snap_lock_expires_at_five_seconds(self):
        state = GestureState()
        state.hold_cursor((100, 200), 10)
        self.assertEqual(state.cursor_target((300, 400), 14.999), (100, 200))
        self.assertEqual(state.cursor_target((300, 400), 15), (300, 400))


if __name__ == "__main__":
    unittest.main()
