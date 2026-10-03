"""Communication interaction tests; no webcam, GUI, or desktop mouse needed."""
from dataclasses import replace
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'AI models'))

from gaze.communication import (CANVAS_SIZE, HEADER_HEIGHT, FOOTER_HEIGHT,
                                CommunicationController, PatientRequest, hit_test, make_layout)
from gaze.config import DEFAULT_SETTINGS


def center(button):
    left, top, right, bottom = button.bounds
    return (left + right) / 2, (top + bottom) / 2


class LayoutTests(unittest.TestCase):
    def setUp(self):
        self.buttons = make_layout(*CANVAS_SIZE)

    def test_six_options_in_row_order(self):
        self.assertEqual([b.id for b in self.buttons],
                         ['water', 'pain', 'call_caregiver', 'adjust_position', 'yes', 'no'])
        self.assertEqual(len(set(b.id for b in self.buttons)), 6)

    def test_center_of_every_button_hits_that_button(self):
        for button in self.buttons:
            self.assertIs(hit_test(self.buttons, center(button)), button)

    def test_half_open_boundaries(self):
        for button in self.buttons:
            left, top, right, bottom = button.bounds
            self.assertIs(hit_test(self.buttons, (left, top)), button)
            self.assertIs(hit_test(self.buttons, (right - .001, bottom - .001)), button)
            for point in ((right, top), (left, bottom), (left - .001, top), (left, top - .001)):
                self.assertIsNone(hit_test(self.buttons, point))

    def test_gaps_header_footer_and_screen_edges_have_no_target(self):
        width, height = CANVAS_SIZE
        for point in ((0, 0), (width - 1, height - 1), (width, height), (-1, -1),
                      (width / 2, height / 2), (width / 2, HEADER_HEIGHT / 2),
                      (width / 2, height - FOOTER_HEIGHT / 2)):
            self.assertIsNone(hit_test(self.buttons, point))

    def test_missing_and_nonfinite_points_have_no_target(self):
        for point in (None, (), (1,), (float('nan'), 100), (100, float('inf'))):
            self.assertIsNone(hit_test(self.buttons, point))

    def test_layout_dimensions_and_nonoverlap(self):
        for width, height in ((640, 480), CANVAS_SIZE, (1365, 769)):
            buttons = make_layout(width, height)
            for button in buttons:
                left, top, right, bottom = button.bounds
                self.assertTrue(0 < left < right < width)
                self.assertTrue(HEADER_HEIGHT <= top < bottom <= height - FOOTER_HEIGHT)
            for index, first in enumerate(buttons):
                for second in buttons[index + 1:]:
                    a, b = first.bounds, second.bounds
                    self.assertFalse(a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3])

    def test_invalid_dimensions_are_rejected(self):
        for size in ((639, 480), (640, 479), (0, 0), (640.0, 480), (True, 480)):
            with self.assertRaises(ValueError):
                make_layout(*size)


class CommunicationTests(unittest.TestCase):
    def setUp(self):
        self.buttons = make_layout(*CANVAS_SIZE)
        self.controller = CommunicationController(self.buttons)
        self.water = center(self.buttons[0])
        self.yes = center(self.buttons[4])
        self.no_target = (0, 0)
        self.events = []

    def update(self, point, closed, now, tracking_valid=True):
        event = self.controller.update(point, closed, now, tracking_valid, timestamp=1234567890.0)
        if event is not None:
            self.events.append(event)
        return event

    def blink(self, point, start):
        self.update(point, True, start)
        self.update(point, False, start + .1)
        return self.update(point, False, start + .17)

    def double_blink(self, point, start):
        self.blink(point, start)
        return self.blink(point, start + .3)

    def test_looking_alone_highlights_without_selecting(self):
        for i in range(100):
            self.assertIsNone(self.update(self.water, False, i / 30))
        self.assertEqual(self.controller.focused.id, 'water')
        self.assertEqual(self.events, [])

    def test_target_changes_and_leaving_buttons_clear_focus(self):
        self.update(self.water, False, 0)
        self.update(self.yes, False, .1)
        self.assertEqual(self.controller.focused.id, 'yes')
        self.update(self.no_target, False, .2)
        self.assertIsNone(self.controller.focused)

    def test_single_blink_never_selects(self):
        self.update(self.water, False, 0)
        self.blink(self.water, 1)
        self.update(self.water, False, 2)
        self.assertEqual(self.events, [])

    def test_double_blink_with_target_produces_one_structured_request(self):
        self.update(self.water, False, 0)
        event = self.double_blink(self.water, 1)
        self.assertIsInstance(event, PatientRequest)
        self.assertEqual(event.to_dict(), {'type': 'patient_request', 'id': 'water',
                                          'label': 'Water', 'timestamp': 1234567890.0})
        self.assertEqual(self.controller.selections, 1)
        self.assertEqual(len(self.events), 1)

    def test_double_blink_without_target_is_consumed_without_selection(self):
        self.update(self.no_target, False, 0)
        self.assertIsNone(self.double_blink(self.no_target, 1))
        self.update(self.water, False, 2)
        self.assertEqual(self.controller.selection_attempts, 1)
        self.assertEqual(self.events, [])
        self.assertIsNone(self.controller.intent.pending_at)

    def test_remaining_on_target_does_not_repeat_selection(self):
        self.update(self.water, False, 0)
        self.double_blink(self.water, 1)
        for i in range(100):
            self.assertIsNone(self.update(self.water, False, 2 + i / 30))
        self.assertEqual(len(self.events), 1)

    def test_selection_uses_current_target_not_first_blink_target(self):
        self.update(self.water, False, 0)
        self.blink(self.water, 1)
        self.update(self.yes, False, 1.2)
        self.blink(self.yes, 1.3)
        self.assertEqual(self.events[0].id, 'yes')

    def test_leaving_target_before_second_blink_prevents_selection(self):
        self.update(self.water, False, 0)
        self.blink(self.water, 1)
        self.update(self.no_target, False, 1.2)
        self.blink(self.no_target, 1.3)
        self.assertEqual(self.events, [])

    def test_closure_holds_focus_but_never_selects(self):
        self.update(self.water, False, 0)
        for i in range(100):
            self.assertIsNone(self.update(self.yes, True, 1 + i / 30))
        self.assertEqual(self.controller.focused.id, 'water')
        self.update(self.water, False, 5)
        self.update(self.water, False, 5.1)
        self.assertEqual(self.events, [])

    def test_tracking_loss_clears_focus_and_pending_blink(self):
        self.update(self.water, False, 0)
        self.blink(self.water, 1)
        self.update(None, False, 1.2, tracking_valid=False)
        self.assertIsNone(self.controller.focused)
        self.assertIsNone(self.controller.intent.pending_at)
        self.assertFalse(self.controller.tracking_valid)
        self.update(self.yes, False, 1.25)
        self.blink(self.yes, 1.3)
        self.assertEqual(self.events, [])

    def test_recovery_accepts_a_fresh_pair(self):
        self.update(self.water, False, 0)
        self.update(None, False, .1, tracking_valid=False)
        self.update(self.yes, False, .2)
        self.double_blink(self.yes, 1)
        self.assertEqual(self.events[0].id, 'yes')

    def test_cooldown_rejects_and_consumes_a_second_pair(self):
        settings = replace(DEFAULT_SETTINGS, click_debounce_seconds=1.0)
        diagnostics = []
        self.controller = CommunicationController(self.buttons, settings, diagnostics.append)
        self.update(self.water, False, 0)
        self.double_blink(self.water, 1)
        self.double_blink(self.water, 1.6)
        self.update(self.water, False, 4)
        self.assertEqual(self.controller.selection_attempts, 2)
        self.assertEqual(len(self.events), 1)
        rejected = [event for event in diagnostics if event["event"] == "selection_rejected"]
        self.assertEqual(rejected[0]["reason"], "cooldown")
        self.assertGreater(rejected[0]["cooldown_remaining"], 0)

    def test_separate_intent_after_cooldown_can_select_again(self):
        self.update(self.water, False, 0)
        self.double_blink(self.water, 1)
        self.double_blink(self.water, 3)
        self.assertEqual(len(self.events), 2)

    def test_feedback_expires_and_survives_brief_tracking_loss(self):
        self.update(self.water, False, 0)
        self.double_blink(self.water, 1)
        self.assertEqual(self.controller.feedback(2), 'Selected: Water')
        self.update(None, False, 2.1, tracking_valid=False)
        self.assertEqual(self.controller.feedback(2.2), 'Selected: Water')
        self.assertEqual(self.controller.feedback(5), '')

    def test_no_target_has_an_explicit_diagnostic_reason(self):
        diagnostics = []
        self.controller = CommunicationController(self.buttons, diagnostics=diagnostics.append)
        self.update(self.no_target, False, 0)
        self.double_blink(self.no_target, 1)
        rejected = [event for event in diagnostics if event['event'] == 'selection_rejected']
        self.assertEqual(rejected[0]['reason'], 'no_target')


if __name__ == '__main__':
    unittest.main()
