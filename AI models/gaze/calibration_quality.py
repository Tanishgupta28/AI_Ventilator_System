"""Engineering calibration diagnostics; warnings never invalidate a profile."""
import math
from statistics import median, pstdev
from .calibration import valid_sample

# A descriptive warning: separation less than twice combined within-target spread.
# Not a probability, clinical confidence, or automatic acceptance criterion.
LOW_SEPARATION_RATIO = 2.0

def sample_statistics(samples):
    if not samples or not all(valid_sample(s) for s in samples):
        raise ValueError('Expected finite two-axis calibration samples')
    result=[]
    for axis in (0,1):
        values=[s[axis] for s in samples]
        center=median(values)
        mad=median(abs(v-center) for v in values)
        std=pstdev(values)
        result.append(dict(median=center,stddev=std,mad=mad,distinct=len(set(values)),
                           spread=max(std,1.4826*mad)))
    return dict(horizontal=result[0],vertical=result[1],samples=len(samples))

def separation_quality(center_samples, target_samples, axis):
    key=('horizontal','vertical')[axis]
    center=sample_statistics(center_samples)[key]
    target=sample_statistics(target_samples)[key]
    separation=abs(target['median']-center['median'])
    spread=math.hypot(center['spread'],target['spread'])
    ratio=separation/spread if spread else None
    low=(separation==0 or (ratio is not None and ratio < LOW_SEPARATION_RATIO))
    return dict(separation=separation,combined_spread=spread,ratio=ratio,
                status='LOW' if low else 'GOOD',zero_variance=spread==0)

def five_point_quality(samples):
    required=('CENTER','LEFT','RIGHT','UP','DOWN')
    if not all(k in samples for k in required):
        raise ValueError('Missing five-point sample groups')
    directions={target:separation_quality(samples['CENTER'],samples[target],axis)
                for target,axis in (('LEFT',0),('RIGHT',0),('UP',1),('DOWN',1))}
    return dict(targets={k:sample_statistics(samples[k]) for k in required},
                directions=directions,
                status='LOW' if any(v['status']=='LOW' for v in directions.values()) else 'GOOD')


def distribution_overlap(center_samples, target_samples, axis=1):
    """Observed range overlap, not a probability or distributional assumption."""
    import numpy as np
    sample_statistics(center_samples)
    sample_statistics(target_samples)
    center = np.asarray([p[axis] for p in center_samples])
    target = np.asarray([p[axis] for p in target_samples])
    low = float(max(center.min(), target.min()))
    high = float(min(center.max(), target.max()))
    return dict(
        center_quantiles=np.percentile(center, [10, 50, 90]).tolist(),
        target_quantiles=np.percentile(target, [10, 50, 90]).tolist(),
        shared_range=[low, high] if low <= high else None,
        center_samples_in_shared_range=int(((center >= low) & (center <= high)).sum()),
        target_samples_in_shared_range=int(((target >= low) & (target <= high)).sum()),
        center_samples=len(center), target_samples=len(target),
    )
