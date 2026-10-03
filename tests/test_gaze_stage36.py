"""Center invariants and measured-intent diagnostics without camera dependencies."""
from dataclasses import replace
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'AI models'))
from gaze.calibration import CalibrationProfile
from gaze.config import DEFAULT_SETTINGS
from gaze.geometry import EyeGeometry, GazeEstimator, apply_dead_zone, map_to_screen, blend_cursor
from gaze.interaction import DoubleBlinkIntent, InteractionController
from test_gaze_safety import GuardedMouse

class CenterRegressionTests(unittest.TestCase):
    def test_asymmetric_targets_and_reversed_axes(self):
        for profile in (CalibrationProfile((.46,.48),.31,.79,.43,.62,30),
                        CalibrationProfile((.46,.48),.79,.31,.62,.43,30)):
            for sample, expected in ((profile.center,(.5,.5)),
                    ((profile.left,profile.center[1]),(0,.5)),
                    ((profile.right,profile.center[1]),(1,.5)),
                    ((profile.center[0],profile.up),(.5,0)),
                    ((profile.center[0],profile.down),(.5,1))):
                mapped = profile.map(sample)
                for actual,target in zip(mapped,expected):
                    self.assertAlmostEqual(actual,target,places=12)
                # Signed neutral coordinates are 2*mapped-1, not the stored [0,1] representation.
                if sample == profile.center:
                    for value in mapped:
                        self.assertAlmostEqual(2*value-1,0,places=12)

    def test_center_remains_neutral_through_smoothing_dead_zone_and_screen(self):
        profile=CalibrationProfile((.46,.48),.31,.79,.43,.62,30)
        estimator=GazeEstimator(profile=profile)
        geometry=EyeGeometry((46,48),(0,0,100,100),22,.03,.03)
        for _ in range(10):
            point=apply_dead_zone(estimator.estimate(geometry))
            self.assertEqual(point,(.5,.5))
            target=map_to_screen(point,(1920,1080))
            self.assertEqual(target,(960,540))
            self.assertEqual(blend_cursor(target,(960,540)),target)

    def test_previous_filter_and_cursor_offset_decay_without_permanent_bias(self):
        estimator=GazeEstimator(profile=CalibrationProfile((.46,.48),.31,.79,.43,.62,30))
        estimator.previous_relative=(0,0)
        geometry=EyeGeometry((46,48),(0,0,100,100),22,.03,.03)
        cursor=(0,0)
        for _ in range(80):
            cursor=blend_cursor(map_to_screen(apply_dead_zone(estimator.estimate(geometry)),(1920,1080)),cursor)
        self.assertAlmostEqual(cursor[0],960,places=5)
        self.assertAlmostEqual(cursor[1],540,places=5)

class TimingRegressionTests(unittest.TestCase):
    def test_measured_default_accepts_point_six_but_rejects_point_seven(self):
        self.assertEqual(DEFAULT_SETTINGS.double_blink_seconds,.65)
        self.assertEqual(DEFAULT_SETTINGS.blink_threshold,.012)
        for interval,expected in ((.6,True),(.65,True),(.7,False)):
            intent=DoubleBlinkIntent()
            intent.update(True,10)
            self.assertEqual(intent.update(True,10+interval),expected)

    def test_measured_rejected_intervals_fit_the_tuned_window(self):
        for interval in (.531, .625):
            old = DoubleBlinkIntent(.5)
            tuned = DoubleBlinkIntent()
            old.update(True, 10)
            tuned.update(True, 10)
            self.assertFalse(old.update(True, 10 + interval))
            self.assertTrue(tuned.update(True, 10 + interval))

    def test_optional_logging_does_not_change_decisions(self):
        plain=DoubleBlinkIntent()
        events=[]
        logged=DoubleBlinkIntent(diagnostics=events.append)
        for blink,now in ((True,1),(False,1.3),(True,1.6),(True,2),(False,3),(True,3.1)):
            self.assertEqual(plain.update(blink,now),logged.update(blink,now))
        self.assertGreater(len(events),0)

    def test_window_inside_boundary_and_outside(self):
        for interval in (.5,.625,.65,.75):
            for delta,accepted in ((interval-.001,True),(interval,True),(interval+.001,False)):
                intent=DoubleBlinkIntent(interval)
                self.assertFalse(intent.update(True,10))
                self.assertEqual(intent.update(True,10+delta),accepted)
                self.assertFalse(intent.update(False,12))

    def test_one_event_and_reset_never_select(self):
        intent=DoubleBlinkIntent()
        self.assertFalse(intent.update(True,1))
        self.assertFalse(intent.update(False,1.2))
        intent.reset()
        self.assertFalse(intent.update(True,1.3))

    def test_expiry_reports_actual_inter_blink_interval(self):
        events=[]
        intent=DoubleBlinkIntent(.5,events.append)
        intent.update(True,10)
        intent.update(False,10.6)
        self.assertFalse(intent.update(True,10.75))
        self.assertEqual(next(e for e in events if e['event']=='pair_expired')['reason'],'selection_window')
        received=[e for e in events if e['event']=='blink_received']
        self.assertEqual(received[-1]['inter_blink_seconds'],.75)

    def test_controller_diagnostics_and_cooldown(self):
        events=[]
        settings=replace(DEFAULT_SETTINGS,click_debounce_seconds=1)
        controller=InteractionController(GuardedMouse(),{},True,settings,events.append)
        opened=EyeGeometry((50,50),(0,0,100,100),22,.03,.03)
        closed=replace(opened,left_lid_gap=0,right_lid_gap=0)
        controller.process(opened,(100,100),0)
        for start in (1,1.2,1.4,1.6):
            controller.process(closed,(100,100),start)
            controller.process(opened,(100,100),start+.08)
            controller.process(opened,(100,100),start+.16)
        self.assertEqual(controller.click_attempts,1)
        self.assertEqual(controller.actual_mouse_actions,0)
        self.assertEqual(sum(e['event']=='closure_started' for e in events),4)
        rejected=next(e for e in events if e['event']=='selection_rejected')
        self.assertEqual(rejected['reason'],'cooldown')
        self.assertGreater(rejected['cooldown_remaining'],0)
        self.assertTrue(all('at' in e for e in events))

    def test_loss_and_sustained_closure_cannot_select(self):
        events=[]
        controller=InteractionController(GuardedMouse(),{},True,diagnostics=events.append)
        opened=EyeGeometry((50,50),(0,0,100,100),22,.03,.03)
        closed=replace(opened,left_lid_gap=0,right_lid_gap=0)
        controller.process(opened,(100,100),0)
        controller.process(closed,(100,100),1)
        controller.process(opened,(100,100),1.1)
        controller.process(opened,(100,100),1.2)
        controller.process(None,None,1.3)
        self.assertIsNone(controller.intent.pending_at)
        self.assertEqual(events[-1]['event'],'tracking_lost')
        self.assertEqual(events[-1]['at'],1.3)
        controller.process(opened,(100,100),2)
        controller.process(closed,(100,100),3)
        controller.process(closed,(100,100),5)
        controller.process(opened,(100,100),6)
        controller.process(opened,(100,100),6.2)
        self.assertEqual(controller.click_attempts,0)
        self.assertTrue(any(e.get('reason')=='closure_duration' for e in events))

if __name__=='__main__':
    unittest.main()
