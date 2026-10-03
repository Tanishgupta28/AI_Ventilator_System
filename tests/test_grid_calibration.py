"""Synthetic quality, affine and held-out regressions without camera or GUI."""
from pathlib import Path
import json
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'AI models'))
from gaze.calibration import save_profile
from gaze.calibration_quality import sample_statistics, separation_quality, five_point_quality, distribution_overlap
from gaze.grid_calibration import (GRID_POINTS, GridCollection, GridSession, AffineMapping,
    fit_affine, split_collection, evaluate, compare_mappings, load_grid, load_affine, compare_runs)

def known_collection(reversed_axis=False):
    samples={}
    for key,(x,y) in GRID_POINTS.items():
        # Invertible coupled signal; optional horizontal reversal.
        a=.2+.1*x+.02*y
        b=.3+.03*x+.12*y
        if reversed_axis:a=1-a
        samples[key]=[(a,b) for _ in range(30)]
    return GridCollection(samples)

class QualityTests(unittest.TestCase):
    def test_statistics_have_median_std_mad_and_distinct(self):
        s=sample_statistics([(0,1),(1,2),(2,3)])
        self.assertEqual(s['horizontal']['median'],1)
        self.assertEqual(s['horizontal']['mad'],1)
        self.assertEqual(s['vertical']['distinct'],3)
        self.assertGreater(s['horizontal']['stddev'],0)
    def test_clearly_separated_is_good(self):
        center=[(.5,.5+i*.0001) for i in range(30)]
        down=[(.5,.7+i*.0001) for i in range(30)]
        self.assertEqual(separation_quality(center,down,1)['status'],'GOOD')
    def test_overlapping_vertical_is_low(self):
        center=[(.5,.5+i*.0001) for i in range(30)]
        down=[(.5,.5001+i*.0001) for i in range(30)]
        self.assertEqual(separation_quality(center,down,1)['status'],'LOW')
    def test_identical_constant_groups_are_low(self):
        self.assertEqual(separation_quality([(.5,.5)]*5,[(.5,.5)]*5,1)['status'],'LOW')
    def test_zero_spread_separated_groups_do_not_serialize_infinity(self):
        s=separation_quality([(.5,.5)]*5,[(.5,.8)]*5,1)
        self.assertEqual(s['status'],'GOOD');self.assertIsNone(s['ratio'])
        json.dumps(s,allow_nan=False)
    def test_five_point_reports_weak_down(self):
        samples={k:[(.5,.5+i*.0001) for i in range(30)] for k in ('CENTER','LEFT','RIGHT','UP','DOWN')}
        for target,axis,offset in (('LEFT',0,-.2),('RIGHT',0,.2),('UP',1,-.2)):
            samples[target]=[tuple(v+offset if a==axis else v for a,v in enumerate(p)) for p in samples[target]]
        q=five_point_quality(samples)
        self.assertEqual(q['status'],'LOW');self.assertEqual(q['directions']['DOWN']['status'],'LOW')
    def test_invalid_statistics_rejected(self):
        for s in ([],[(float('nan'),0)],[(0,)],[(True,0)]):
            with self.assertRaises(ValueError):sample_statistics(s)

class GridTests(unittest.TestCase):
    def test_all_nine_grid_targets_required(self):
        s=known_collection().samples.copy();s.pop('CENTER')
        with self.assertRaises(ValueError):GridCollection(s)
    def test_invalid_sample_and_unequal_counts_rejected(self):
        s=known_collection().samples.copy();s['CENTER']=[(0,0)]*29
        with self.assertRaises(ValueError):GridCollection(s)
        s['CENTER']=[(0,float('inf'))]*30
        with self.assertRaises(ValueError):GridCollection(s)
    def test_serialization_loading_round_trip(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'grid.json';c=known_collection();save_profile(c,p)
            self.assertEqual(load_grid(p).samples,json.loads(json.dumps(c.samples)))
    def test_wrong_target_coordinates_rejected(self):
        d=known_collection().to_dict();d['points']['CENTER']=[.1,.1]
        with self.assertRaises(ValueError):GridCollection.from_dict(d)
    def test_invalid_grid_falls_back_to_none(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'grid.json'
            self.assertIsNone(load_grid(p));p.write_text('{}')
            self.assertIsNone(load_grid(p))
    def test_session_requires_all_points_and_ignores_invalid_samples(self):
        s=GridSession(9,0)
        self.assertFalse(s.add_sample((0,0),0))
        for target in GRID_POINTS:
            self.assertEqual(s.target,target);s.start_target(0)
            self.assertFalse(s.add_sample((float('nan'),0),0))
            for _ in range(9):self.assertTrue(s.add_sample((.5,.5),0))
        self.assertTrue(s.done);self.assertEqual(len(s.profile().samples),9)
    def test_affine_recovers_known_coupled_mapping(self):
        c=known_collection();m=fit_affine(c.samples)
        for k,values in c.samples.items():
            for got,want in zip(m.map(values[0]),GRID_POINTS[k]):self.assertAlmostEqual(got,want,places=10)
    def test_affine_supports_reversed_orientation(self):
        c=known_collection(True);m=fit_affine(c.samples)
        self.assertAlmostEqual(m.map(c.samples['BOTTOM-LEFT'][0])[0],.25,places=10)
    def test_degenerate_affine_rejected(self):
        c=GridCollection({k:[(.5,.5)]*30 for k in GRID_POINTS})
        with self.assertRaises(ValueError):fit_affine(c.samples)
    def test_affine_serialization_round_trip_and_invalid_fallback(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'affine.json';m=fit_affine(known_collection().samples);save_profile(m,p)
            self.assertEqual(load_affine(p),m)
            p.write_text('{"version":1,"type":"affine_grid","coefficients":[[0,0]]}')
            self.assertIsNone(load_affine(p))
    def test_affine_nonfinite_coefficients_rejected(self):
        with self.assertRaises(ValueError):AffineMapping(((0,1,2),(0,float('inf'),1)))
    def test_split_is_temporal_disjoint_and_deterministic(self):
        s={k:[(.1+i*.001,.2+i*.001) for i in range(30)] for k in GRID_POINTS}
        c=GridCollection(s);train,test=split_collection(c)
        self.assertEqual(train['CENTER'],s['CENTER'][:20]);self.assertEqual(test['CENTER'],s['CENTER'][20:])
        self.assertFalse(set(train['CENTER']) & set(test['CENTER']))
        self.assertEqual((train,test),split_collection(c))
    def test_held_out_evaluation_exact_model_is_zero_error(self):
        train,test=split_collection(known_collection())
        e=evaluate(fit_affine(train),test)
        self.assertLess(e['p90_pixel_error'],1e-8)
        self.assertEqual(e['correct_button_samples'],60);self.assertEqual(e['button_samples'],60)
        self.assertEqual(e['samples'],90)
    def test_held_out_perturbation_changes_error_not_training_fit(self):
        train,test=split_collection(known_collection());m=fit_affine(train)
        changed={k:[(a+.01,b) for a,b in v] for k,v in test.items()}
        self.assertGreater(evaluate(m,changed)['mean_pixel_error'],10)
        self.assertEqual(m,fit_affine(train))
    def test_compare_reports_both_models_and_degeneracy(self):
        r=compare_mappings(known_collection())
        self.assertIn('grid_five_point',r);self.assertIn('affine',r)
        self.assertIn('BOTTOM-CENTER',r['vertical_separation'])


class RepeatabilityTests(unittest.TestCase):
    def test_overlap_counts_and_separate_ranges(self):
        result = distribution_overlap([(0, 1), (0, 2), (0, 3)],
                                      [(0, 2), (0, 3), (0, 4)])
        self.assertEqual(result['shared_range'], [2, 3])
        self.assertEqual(result['center_samples_in_shared_range'], 2)
        self.assertEqual(result['target_samples_in_shared_range'], 2)
        self.assertIsNone(distribution_overlap([(0, 1)], [(0, 4)])['shared_range'])

    def test_identical_runs_have_zero_drift_and_transfer_error(self):
        first = known_collection()
        result = compare_runs(first, first)
        self.assertTrue(all(drift['horizontal'] == drift['vertical'] == 0
                            for drift in result['median_drift'].values()))
        self.assertLess(result['cross_run']['1_to_2']['affine']['p90_pixel_error'], 1e-8)

    def test_shifted_independent_run_exposes_drift_and_transfer_error(self):
        first = known_collection()
        second = GridCollection({key: [(x + .01, y + .02) for x, y in values]
                                 for key, values in first.samples.items()})
        result = compare_runs(first, second)
        self.assertAlmostEqual(result['median_drift']['CENTER']['vertical'], .02)
        self.assertGreater(result['cross_run']['1_to_2']['affine']['mean_pixel_error'], 10)
        self.assertLess(result['runs'][1]['affine']['p90_pixel_error'], 1e-8)
