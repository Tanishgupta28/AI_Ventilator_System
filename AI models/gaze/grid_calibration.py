"""Experimental grid data and offline affine comparison; no live mapper switch."""
from dataclasses import dataclass
import json
from pathlib import Path
from statistics import median
from .calibration import CalibrationProfile, CalibrationSession, valid_sample, save_profile
from .calibration_quality import sample_statistics, separation_quality, distribution_overlap
from .communication import CANVAS_SIZE, hit_test, make_layout

GRID_POINTS = {
    'TOP-LEFT':(.25,194/720), 'TOP-CENTER':(.5,194/720), 'TOP-RIGHT':(.75,194/720),
    'MIDDLE-LEFT':(.25,370/720), 'CENTER':(.5,370/720), 'MIDDLE-RIGHT':(.75,370/720),
    'BOTTOM-LEFT':(.25,546/720), 'BOTTOM-CENTER':(.5,546/720), 'BOTTOM-RIGHT':(.75,546/720),
}

@dataclass(frozen=True)
class GridCollection:
    samples: dict
    def __post_init__(self):
        if not isinstance(self.samples,dict) or set(self.samples)!=set(GRID_POINTS):
            raise ValueError('Expected all nine grid targets')
        counts=[]
        for values in self.samples.values():
            if not isinstance(values,(list,tuple)) or len(values)<9 or not all(valid_sample(p) for p in values):
                raise ValueError('At least nine finite samples per grid target required')
            counts.append(len(values))
        if len(set(counts))!=1:
            raise ValueError('Grid targets must have equal sample counts')
    def to_dict(self):
        return dict(version=1,type='grid_collection',canvas=list(CANVAS_SIZE),
                    points={k:list(v) for k,v in GRID_POINTS.items()},samples=self.samples)
    @classmethod
    def from_dict(cls,data):
        fields={'version','type','canvas','points','samples'}
        if (not isinstance(data,dict) or set(data)!=fields or type(data['version']) is not int
                or data['version']!=1 or data['type']!='grid_collection'
                or data['canvas']!=list(CANVAS_SIZE)
                or data['points']!={k:list(v) for k,v in GRID_POINTS.items()}):
            raise ValueError('Unsupported grid collection schema or target coordinates')
        return cls(data['samples'])

def load_grid(path):
    try:return GridCollection.from_dict(json.loads(Path(path).read_text(encoding='utf-8')))
    except (OSError,ValueError,TypeError,UnicodeError):return None

class GridSession(CalibrationSession):
    def __init__(self,samples_per_target=30,settle_seconds=.5):
        if type(samples_per_target) is not int or samples_per_target<9:
            raise ValueError('At least nine samples per grid point required')
        super().__init__(samples_per_target,settle_seconds)
        self.samples={k:[] for k in GRID_POINTS}
    @property
    def done(self):return self.target_index==len(GRID_POINTS)
    @property
    def target(self):return None if self.done else tuple(GRID_POINTS)[self.target_index]
    def profile(self):
        if not self.done:raise ValueError('Grid collection incomplete')
        return GridCollection(self.samples)

@dataclass(frozen=True)
class AffineMapping:
    # Rows correspond to output x/y; columns to intercept, raw x, raw y.
    coefficients: tuple
    def __post_init__(self):
        if (not isinstance(self.coefficients,(list,tuple)) or len(self.coefficients)!=2
                or any(not isinstance(row,(list,tuple)) or len(row)!=3 for row in self.coefficients)
                or not all(valid_sample((v,v)) for row in self.coefficients for v in row)):
            raise ValueError('Expected finite 2 x 3 affine coefficients')
    def map(self,sample):
        if not valid_sample(sample):raise ValueError('Invalid gaze sample')
        x,y=sample
        return tuple(row[0]+row[1]*x+row[2]*y for row in self.coefficients)
    def to_dict(self):return dict(version=1,type='affine_grid',coefficients=[list(r) for r in self.coefficients])
    @classmethod
    def from_dict(cls,data):
        if (not isinstance(data,dict) or set(data)!={'version','type','coefficients'}
                or type(data['version']) is not int or data['version']!=1 or data['type']!='affine_grid'):
            raise ValueError('Unsupported affine schema')
        return cls(tuple(tuple(r) for r in data['coefficients']))

def load_affine(path):
    try:return AffineMapping.from_dict(json.loads(Path(path).read_text(encoding='utf-8')))
    except (OSError,ValueError,TypeError,UnicodeError):return None

def fit_affine(samples):
    import numpy as np
    if (set(samples)!=set(GRID_POINTS) or any(len(v)<3 or not all(valid_sample(p) for p in v) for v in samples.values())):
        raise ValueError('Invalid grid training samples')
    x=[];y=[]
    for target,values in samples.items():
        for a,b in values:x.append((1,a,b));y.append(GRID_POINTS[target])
    # Center/scale raw columns for a meaningful rank/conditioning check.
    design=np.asarray(x,dtype=float); outputs=np.asarray(y,dtype=float)
    mean=design[:,1:].mean(axis=0);std=design[:,1:].std(axis=0)
    if np.any(std<1e-12):raise ValueError('Degenerate grid: insufficient gaze variation')
    normalized=np.column_stack((np.ones(len(design)),(design[:,1:]-mean)/std))
    beta,_,rank,singular=np.linalg.lstsq(normalized,outputs,rcond=None)
    if rank<3 or singular[0]/singular[-1]>1e8:
        raise ValueError('Degenerate or ill-conditioned grid')
    slopes=beta[1:]/std[:,None]
    intercept=beta[0]-mean@slopes
    coefficients=np.vstack((intercept,slopes)).T
    return AffineMapping(tuple(tuple(float(v) for v in row) for row in coefficients))

def split_collection(collection):
    # Contiguous final third is held out; never fitted. Cross-run testing is separate.
    train={};test={}
    for target,values in collection.samples.items():
        boundary=len(values)*2//3
        train[target]=values[:boundary];test[target]=values[boundary:]
    return train,test

class GridFivePointMapping:
    """Existing piecewise equation fitted to the grid cross, with known dot anchors."""
    def __init__(self,train):
        centers={k:tuple(median(p[a] for p in train[k]) for a in (0,1)) for k in GRID_POINTS}
        self.profile=CalibrationProfile(centers['CENTER'],centers['MIDDLE-LEFT'][0],
            centers['MIDDLE-RIGHT'][0],centers['TOP-CENTER'][1],centers['BOTTOM-CENTER'][1],len(train['CENTER']))
    def map(self,sample):
        x,y=self.profile.map(sample)
        # Grid cross dots are at .25/.75 and row centers, not screen edges.
        return .25+.5*x, 194/720+(352/720)*y

def evaluate(mapper,test):
    import numpy as np
    errors=[];correct=eligible=0;per_target={};buttons=make_layout(*CANVAS_SIZE)
    for target,values in test.items():
        wanted=GRID_POINTS[target];expected=hit_test(buttons,tuple(v*s for v,s in zip(wanted,CANVAS_SIZE)))
        rows=[]
        for sample in values:
            mapped=mapper.map(sample)
            dx=(mapped[0]-wanted[0])*CANVAS_SIZE[0];dy=(mapped[1]-wanted[1])*CANVAS_SIZE[1]
            row=(float(np.hypot(dx,dy)),abs(dx),abs(dy));errors.append(row);rows.append(row)
            # Evaluate unclamped predictions: clamping must not conceal extrapolation.
            if expected:
                eligible+=1
                actual=hit_test(buttons,tuple(v*s for v,s in zip(mapped,CANVAS_SIZE)))
                correct+=actual==expected
        per_target[target]=dict(median_pixel_error=float(np.median([p[0] for p in rows])))
    array=np.asarray(errors)
    return dict(samples=len(errors),median_pixel_error=float(np.median(array[:,0])),
        mean_pixel_error=float(array[:,0].mean()),p90_pixel_error=float(np.percentile(array[:,0],90)),
        mean_absolute_horizontal_error=float(array[:,1].mean()),mean_absolute_vertical_error=float(array[:,2].mean()),
        correct_button_samples=correct,button_samples=eligible,per_target=per_target)

def compare_mappings(collection,existing=None):
    train,test=split_collection(collection)
    result={'split':'first two thirds train; final third held out','statistics':{k:sample_statistics(v) for k,v in collection.samples.items()},
        'vertical_separation':{k:separation_quality(collection.samples['CENTER'],collection.samples[k],1)
                              for k in ('TOP-CENTER','BOTTOM-CENTER')}}
    for name,fit in (('grid_five_point',lambda:GridFivePointMapping(train)),('affine',lambda:fit_affine(train))):
        try:
            mapper=fit();result[name]=evaluate(mapper,test)
            if name=='affine':result['affine_coefficients']=mapper.to_dict()
        except ValueError as exc:result[name]={'invalid':str(exc)}
    if existing is not None:result['existing_saved_five_point']=evaluate(existing,test)
    return result


def compare_runs(first, second, existing=None):
    """Preserve independent-run drift and transfer error separately from hold-out."""
    runs = [compare_mappings(collection, existing) for collection in (first, second)]
    drift = {}
    for target in GRID_POINTS:
        first_stats = runs[0]['statistics'][target]
        second_stats = runs[1]['statistics'][target]
        drift[target] = {
            axis: second_stats[axis]['median'] - first_stats[axis]['median']
            for axis in ('horizontal', 'vertical')
        }
    cross_run = {}
    for name, source, destination in (
            ('1_to_2', first, second), ('2_to_1', second, first)):
        train, _ = split_collection(source)
        cross_run[name] = {}
        for strategy, fit in (
                ('five_point', lambda: GridFivePointMapping(train)),
                ('affine', lambda: fit_affine(train))):
            try:
                cross_run[name][strategy] = evaluate(fit(), destination.samples)
            except ValueError as exc:
                cross_run[name][strategy] = {'invalid': str(exc)}
    return dict(
        runs=runs, median_drift=drift, cross_run=cross_run,
        bottom_overlap=[distribution_overlap(collection.samples['CENTER'],
                                             collection.samples['BOTTOM-CENTER'])
                        for collection in (first, second)],
    )
