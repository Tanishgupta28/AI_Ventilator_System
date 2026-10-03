"""Safe experimental grid collection; no mouse library or networking."""
from contextlib import ExitStack
import json
from pathlib import Path
import time
import cv2
import mediapipe as mp
import numpy as np
from .calibration import save_profile
from .grid_calibration import GRID_POINTS, GridSession, compare_mappings
from .communication import CANVAS_SIZE
from .config import DEFAULT_SETTINGS
from .geometry import extract_valid_eye_geometry, normalize_gaze

WINDOW='Experimental Gaze Grid Calibration - Research Prototype'

def run(path,camera_index=0,samples_per_target=30):
    destination=Path(path)
    if destination.exists():raise ValueError('Grid output already exists; choose a separate file')
    session=GridSession(samples_per_target)
    frames=landmark_frames=loss_frames=closed_frames=invalid=0
    failed=False;started=time.monotonic()
    with ExitStack() as resources:
        resources.callback(cv2.destroyAllWindows)
        model=mp.solutions.face_mesh.FaceMesh(refine_landmarks=True)
        resources.callback(model.close)
        camera=cv2.VideoCapture(camera_index);resources.callback(camera.release)
        if not camera.isOpened():
            print('Camera not detected',flush=True);return 1
        cv2.namedWindow(WINDOW,cv2.WINDOW_NORMAL)
        cv2.setWindowProperty(WINDOW,cv2.WND_PROP_FULLSCREEN,cv2.WINDOW_FULLSCREEN)
        print('GRID READY: '+WINDOW+'; SPACE starts each target; Q/Escape cancels',flush=True)
        while not session.done:
            ok,frame=camera.read();frames+=1;geometry=None
            valid=ok and frame is not None and frame.size>0 and frame.ndim==3 and frame.shape[2]==3
            if valid:
                invalid=0
                faces=model.process(cv2.cvtColor(cv2.flip(frame,1),cv2.COLOR_BGR2RGB)).multi_face_landmarks
                if faces:geometry=extract_valid_eye_geometry(faces[0].landmark,frame.shape[1],frame.shape[0])
            else:invalid+=1
            now=time.monotonic()
            if geometry is None:loss_frames+=1
            else:
                landmark_frames+=1
                closed=(geometry.left_lid_gap<DEFAULT_SETTINGS.blink_threshold and geometry.right_lid_gap<DEFAULT_SETTINGS.blink_threshold)
                closed_frames+=int(closed)
                if not closed:
                    target=session.target
                    if session.add_sample(normalize_gaze(geometry),now) and session.target!=target:
                        print('COLLECTED '+target+': '+str(samples_per_target)+' samples',flush=True)
            if session.done:break
            canvas=np.full((720,1280,3),(25,22,18),np.uint8)
            x,y=GRID_POINTS[session.target]
            cv2.circle(canvas,(round(x*1280),round(y*720)),12,(0,255,255),-1)
            hint='Look at yellow dot, then SPACE' if session.started_at is None else 'Keep looking at yellow dot'
            cv2.putText(canvas,session.target+': '+str(len(session.samples[session.target]))+'/'+str(samples_per_target),(32,42),cv2.FONT_HERSHEY_SIMPLEX,.8,(245,245,245),2)
            cv2.putText(canvas,hint+'; Q/Escape cancels',(32,78),cv2.FONT_HERSHEY_SIMPLEX,.65,(245,245,245),1)
            status='Tracking available' if geometry else 'Tracking unavailable - samples paused'
            cv2.putText(canvas,status,(32,680),cv2.FONT_HERSHEY_SIMPLEX,.65,(150,230,170),1)
            cv2.imshow(WINDOW,canvas);key=cv2.waitKey(5)
            if key==32:session.start_target(time.monotonic())
            if invalid>=DEFAULT_SETTINGS.max_invalid_camera_frames or key in (ord('q'),27) or cv2.getWindowProperty(WINDOW,cv2.WND_PROP_VISIBLE)<1:
                failed=True;break
        if session.done:
            collection=session.profile();save_profile(collection,destination)
            comparison=compare_mappings(collection)
            report_path=destination.with_suffix('.evaluation.json')
            report_path.write_text(json.dumps(comparison,indent=2,allow_nan=False),encoding='utf-8')
            print('GRID SAVED: '+str(destination),flush=True)
            print('OFFLINE EVALUATION: '+json.dumps({k:comparison[k] for k in ('grid_five_point','affine','vertical_separation')}),flush=True)
        else:print('Grid collection incomplete; no profile saved',flush=True)
    print('Grid runtime: '+json.dumps(dict(frames=frames,landmark_frames=landmark_frames,tracking_loss_frames=loss_frames,closed_frames=closed_frames,fps=round(frames/max(time.monotonic()-started,1e-9),2),actual_os_mouse_actions=0,completed=session.done)),flush=True)
    return int(failed or not session.done)
