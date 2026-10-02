import os
import cv2
from deepface import DeepFace
from collections import deque, Counter
import requests
import time

faceCascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
cap = cv2.VideoCapture(int(os.environ.get("AI_CAMERA_INDEX", "0")))

if not cap.isOpened():
    raise IOError("Cannot open webcam")


history = deque(maxlen=7)
last_emotion = "..."


URL = os.environ.get("AI_BACKEND_URL", "")


last_sent_time = 0
SEND_INTERVAL = 30   

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to capture frame")
        break

    frame = cv2.flip(frame, 1)

    
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    
    result = DeepFace.analyze(rgb_frame, actions=['emotion'], enforce_detection=False)

    
    current_emotion = result[0]['dominant_emotion']
    history.append(current_emotion)

    
    most_common = Counter(history).most_common(1)
    if most_common:
        last_emotion = most_common[0][0]

        
        try:
            print(last_emotion)
            current_time = time.time()

           
            if URL and last_emotion in ["fear", "fearful","sad"]:
                if current_time - last_sent_time >= SEND_INTERVAL:
                    response = requests.post(URL, json={"text": last_emotion}, timeout=10)
                    response.raise_for_status()
                    last_sent_time = current_time
                    print("Sent fear to backend (cooldown 30s started)")
        except Exception as e:
            print("Error sending POST:", e)

   
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = faceCascade.detectMultiScale(gray, 1.1, 4)

    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

    # Display smoothed emotion
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(frame, last_emotion, (2, 50), font, 2, (0, 0, 225), 2, cv2.LINE_4)

    cv2.imshow("Emotion Detection", frame)

    key = cv2.waitKey(5)
    if key == ord('q') or key == 27:
        print("Exiting...")
        break

cap.release()
cv2.destroyAllWindows()
