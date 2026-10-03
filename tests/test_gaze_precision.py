"""Subpixel regressions compare identical synthetic landmarks with legacy math."""
from pathlib import Path
from types import SimpleNamespace
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'AI models'))
from gaze.config import LEFT_IRIS, RIGHT_IRIS, EYE_TOP, EYE_BOTTOM, EYE_X_BOUNDS
from gaze.geometry import extract_eye_geometry, normalize_gaze, valid_geometry

WIDTH, HEIGHT = 640, 480

def landmarks_at(x=320.1, y=240.1):
    points=[SimpleNamespace(x=.5,y=.5) for _ in range(478)]
    for index in LEFT_IRIS + RIGHT_IRIS:
        points[index].x=x/WIDTH; points[index].y=y/HEIGHT
    points[EYE_X_BOUNDS[0]].x=256/WIDTH
    points[EYE_X_BOUNDS[1]].x=384/WIDTH
    for index in EYE_TOP: points[index].y=229/HEIGHT
    for index in EYE_BOTTOM: points[index].y=253/HEIGHT
    return points

def legacy_normalize(points):
    # Explicit frozen reference for the removed pre-normalization truncations.
    indices=LEFT_IRIS+RIGHT_IRIS
    x=int(sum(points[i].x for i in indices)/8*WIDTH)
    y=int(sum(points[i].y for i in indices)/8*HEIGHT)
    left=int(points[EYE_X_BOUNDS[0]].x*WIDTH)
    right=int(points[EYE_X_BOUNDS[1]].x*WIDTH)
    top=int(sum(points[i].y for i in EYE_TOP)/2*HEIGHT)+1
    bottom=int(sum(points[i].y for i in EYE_BOTTOM)/2*HEIGHT)-1
    return (x-left)/max(1,right-left), (y-top)/max(1,bottom-top)

class PrecisionTests(unittest.TestCase):
    def test_horizontal_subpixel_motion_survives(self):
        points=[landmarks_at(x=320.1+d) for d in (0,.2,.4,.8)]
        old=[legacy_normalize(p)[0] for p in points]
        new=[normalize_gaze(extract_eye_geometry(p,WIDTH,HEIGHT))[0] for p in points]
        self.assertEqual(len(set(old)),1)
        self.assertEqual(len(set(new)),4)
        for value,delta in zip(new,(0,.2,.4,.8)):
            self.assertAlmostEqual(value-new[0],delta/128,places=12)
    def test_vertical_subpixel_motion_survives(self):
        points=[landmarks_at(y=240.1+d) for d in (0,.2,.4,.8)]
        old=[legacy_normalize(p)[1] for p in points]
        new=[normalize_gaze(extract_eye_geometry(p,WIDTH,HEIGHT))[1] for p in points]
        self.assertEqual(len(set(old)),1)
        self.assertEqual(len(set(new)),4)
        for value,delta in zip(new,(0,.2,.4,.8)):
            self.assertAlmostEqual(value-new[0],delta/22,places=12)
    def test_identical_inputs_are_identical(self):
        p=landmarks_at()
        self.assertEqual(extract_eye_geometry(p,WIDTH,HEIGHT),extract_eye_geometry(p,WIDTH,HEIGHT))
    def test_subpixel_bounds_are_not_truncated(self):
        p=landmarks_at()
        p[EYE_X_BOUNDS[0]].x=256.2/WIDTH
        p[EYE_X_BOUNDS[1]].x=384.8/WIDTH
        for i in EYE_TOP:p[i].y=229.3/HEIGHT
        for i in EYE_BOTTOM:p[i].y=253.7/HEIGHT
        g=extract_eye_geometry(p,WIDTH,HEIGHT)
        for got,want in zip(g.bounds,(256.2,230.3,384.8,252.7)):
            self.assertAlmostEqual(got,want)
        self.assertTrue(valid_geometry(g))
    def test_whole_pixel_inputs_match_legacy(self):
        for x,y in ((300,235),(320,240),(360,250)):
            p=landmarks_at(x,y)
            for new,old in zip(normalize_gaze(extract_eye_geometry(p,WIDTH,HEIGHT)),legacy_normalize(p)):
                self.assertAlmostEqual(new,old,places=12)
    def test_original_landmark_order_and_offsets_preserved(self):
        g=extract_eye_geometry(landmarks_at(),WIDTH,HEIGHT)
        self.assertEqual(g.bounds,(256,230,384,252))
        self.assertLess(g.bounds[0],g.iris[0]); self.assertLess(g.iris[0],g.bounds[2])
        self.assertLess(g.bounds[1],g.iris[1]); self.assertLess(g.iris[1],g.bounds[3])
    def test_valid_inside_eye_samples_remain_bounded(self):
        for offset in (0,.2,.4,.8):
            g=extract_eye_geometry(landmarks_at(320.1+offset,240.1+offset),WIDTH,HEIGHT)
            self.assertTrue(valid_geometry(g))
            self.assertTrue(all(0<=v<=1 for v in normalize_gaze(g)))
    def test_dense_subpixel_sequence_remains_distinguishable(self):
        values=[normalize_gaze(extract_eye_geometry(landmarks_at(320.1+i*.8/199,240.1+i*.8/199),WIDTH,HEIGHT)) for i in range(200)]
        self.assertEqual(len(set(x for x,y in values)),200)
        self.assertEqual(len(set(y for x,y in values)),200)
