"""Measured targeting failure regressions; no camera or GUI imports."""
from dataclasses import replace
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'AI models'))
from gaze.communication import TargetStability, CommunicationController, make_layout
from gaze.config import DEFAULT_SETTINGS

class StabilityTests(unittest.TestCase):
    def setUp(self):
        self.f = TargetStability(.25, .25)
    def test_rapid_changes_do_not_focus(self):
        for i in range(20):
            self.assertIsNone(self.f.update('water' if i % 2 else 'yes', i*.05))
    def test_continuous_candidate_qualifies_at_boundary(self):
        self.assertIsNone(self.f.update('water', 0))
        self.assertIsNone(self.f.update('water', .249))
        self.assertEqual(self.f.update('water', .25), 'water')
    def test_brief_gap_retains_focus(self):
        self.f.update('water', 0); self.f.update('water', .25)
        self.assertEqual(self.f.update(None, .3), 'water')
        self.assertFalse(self.f.eligible(.3))
        self.assertEqual(self.f.update('water', .4), 'water')
    def test_prolonged_gap_clears_focus(self):
        self.f.update('water', 0); self.f.update('water', .25)
        self.f.update(None, .5)
        self.assertIsNone(self.f.update(None, .75))
    def test_neighbor_requires_its_own_dwell(self):
        self.f.update('water', 0); self.f.update('water', .25)
        self.assertEqual(self.f.update('yes', .3), 'water')
        self.assertFalse(self.f.eligible(.4))
        self.assertEqual(self.f.update('yes', .56), 'yes')
    def test_pause_does_not_credit_closed_time(self):
        self.f.update('water', 0); self.f.pause()
        self.assertIsNone(self.f.update('water', 2))
    def test_invalid_timing_rejected(self):
        for value in (-1, float('nan'), float('inf')):
            with self.assertRaises(ValueError): TargetStability(value, .25)

class LockedSelectionTests(unittest.TestCase):
    def setUp(self):
        self.buttons=make_layout(1280,720)
        self.c=CommunicationController(self.buttons)
        self.water=(300,190); self.yes=(300,540)
        self.requests=[]
    def update(self,p,closed,t,valid=True):
        r=self.c.update(p,closed,t,valid,timestamp=123)
        if r: self.requests.append(r)
        return r
    def qualify(self,p,t=0):
        self.update(p,False,t); self.update(p,False,t+.26)
    def blink(self,p,t):
        self.update(p,True,t); self.update(p,False,t+.1)
        return self.update(p,False,t+.17)
    def test_water_to_yes_during_blink_selects_locked_water(self):
        self.qualify(self.water)
        self.blink(self.yes, .4)
        self.assertEqual(self.c.locked_target.id,'water')
        r=self.blink(self.yes,.7)
        self.assertEqual(r.id,'water')
        self.assertIsNone(self.c.locked_target)
    def test_no_stable_target_cannot_select_later_button(self):
        self.update(self.water,False,0)
        self.blink(self.water,.1); self.blink(self.yes,.4)
        self.assertEqual(self.requests,[])
    def test_transient_changed_candidate_not_eligible(self):
        self.qualify(self.water)
        self.update(self.yes,False,.3)
        self.blink(self.yes,.4); self.blink(self.yes,.7)
        self.assertEqual(self.requests,[])
    def test_tracking_loss_cancels_locked_target(self):
        self.qualify(self.water); self.blink(self.water,.4)
        self.update(None,False,.6,False)
        self.assertIsNone(self.c.locked_target)
        self.assertIsNone(self.c.intent.pending_at)
        self.qualify(self.yes,.7); self.blink(self.yes,1.1)
        self.assertEqual(self.requests,[])
    def test_pair_timeout_clears_lock(self):
        self.qualify(self.water); self.blink(self.water,.4)
        self.update(self.water,False,1.23)
        self.assertIsNone(self.c.locked_target)
        self.assertIsNone(self.c.intent.pending_at)
    def test_exactly_one_request_and_no_frame_repeats(self):
        self.qualify(self.water); self.blink(self.water,.4); self.blink(self.water,.7)
        for i in range(40): self.update(self.water,False,1+i*.03)
        self.assertEqual(len(self.requests),1)
    def test_sustained_closure_no_request_or_pending_lock(self):
        self.qualify(self.water)
        for i in range(80): self.update(self.water,True,.4+i*.03)
        self.update(self.water,False,3); self.update(self.water,False,3.1)
        self.assertEqual(self.requests,[])
        self.assertIsNone(self.c.locked_target)
    def test_unstable_natural_pair_no_request(self):
        for i in range(8): self.update(self.water if i%2 else self.yes,False,i*.03)
        self.blink(self.water,.3); self.blink(self.water,.6)
        self.assertEqual(self.requests,[])
    def test_reopening_coordinates_do_not_change_focus(self):
        self.qualify(self.water)
        self.update(self.yes,True,.4); self.update(self.yes,False,.5)
        self.assertEqual(self.c.focused.id,'water')
        self.update(self.yes,False,.57)
        self.assertEqual(self.c.focused.id,'water')
    def test_cooldown_consumes_pair(self):
        self.c=CommunicationController(self.buttons,replace(DEFAULT_SETTINGS,click_debounce_seconds=3))
        self.qualify(self.water); self.blink(self.water,.4); self.blink(self.water,.7)
        self.qualify(self.water,1); self.blink(self.water,1.4); self.blink(self.water,1.7)
        self.assertEqual(len(self.requests),1)
        self.assertIsNone(self.c.locked_target)
        self.assertIsNone(self.c.intent.pending_at)
