# import cv2
# from deepface import DeepFace
# from collections import deque, Counter
# import requests
# import time   # <-- added

# faceCascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
# cap = cv2.VideoCapture(0)

# if not cap.isOpened():
#     raise IOError("Cannot open webcam")

# # Keep history of last 7 predictions
# history = deque(maxlen=7)
# last_emotion = "..."

# # Backend URL
# URL = "https://israel-5mizz.ondigitalocean.app/patient/text"

# # Track last send time
# last_sent_time = 0
# SEND_INTERVAL = 30   # seconds

# while True:
#     ret, frame = cap.read()
#     if not ret:
#         continue

#     frame = cv2.flip(frame, 1)

#     # Convert BGR -> RGB
#     rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

#     # Analyze emotions (safe mode)
#     result = DeepFace.analyze(rgb_frame, actions=['emotion'], enforce_detection=False)

#     # Store detected emotion
#     current_emotion = result[0]['dominant_emotion']
#     history.append(current_emotion)

#     # Smooth: take most common emotion in last N frames
#     most_common = Counter(history).most_common(1)
#     if most_common:
#         last_emotion = most_common[0][0]

#         # --- send to Node.js backend every 30s ---
#         try:
#             print(last_emotion)
#             current_time = time.time()
#             if last_emotion in ["fear", "fearful"] and (current_time - last_sent_time) >= SEND_INTERVAL:
#                 requests.post(URL, json={"text": last_emotion})
#                 last_sent_time = current_time
#                 print("Sent fear to backend")
#         except Exception as e:
#             print("Error sending POST:", e)

#     # Face detection (for bounding box)
#     gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
#     faces = faceCascade.detectMultiScale(gray, 1.1, 4)

#     for (x, y, w, h) in faces:
#         cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

#     # Display smoothed emotion
#     font = cv2.FONT_HERSHEY_SIMPLEX
#     cv2.putText(frame, last_emotion, (2, 50), font, 2, (0, 0, 225), 2, cv2.LINE_4)

#     cv2.imshow("Emotion Detection", frame)

#     key = cv2.waitKey(5)
#     if key == ord('q') or key == 27:
#         print("Exiting...")
#         break

# cap.release()
# cv2.destroyAllWindows()






import cv2
from deepface import DeepFace
from collections import deque, Counter
import requests
import time

faceCascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    raise IOError("Cannot open webcam")


history = deque(maxlen=7)
last_emotion = "..."


URL = "https://israel-5mizz.ondigitalocean.app/patient/text"


last_sent_time = 0
SEND_INTERVAL = 30   

while True:
    ret, frame = cap.read()
    if not ret:
        continue

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

           
            if last_emotion in ["fear", "fearful","sad"]:
                if current_time - last_sent_time >= SEND_INTERVAL:
                    requests.post(URL, json={"text": last_emotion})
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



# import cv2
# from deepface import DeepFace
# from collections import deque, Counter
# import requests
# import time

# faceCascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
# cap = cv2.VideoCapture(0)

# if not cap.isOpened():
#     raise IOError("Cannot open webcam")

# # Keep history of last 7 predictions
# history = deque(maxlen=7)
# last_emotion = "..."

# # Backend URL
# URL = "https://israel-5mizz.ondigitalocean.app/patient/text"

# # Track last send times (per emotion)
# last_sent_time = {}         # short cooldown tracking
# last_hourly_sent_time = {}  # long cooldown tracking

# SHORT_INTERVAL = 30        # seconds (spam guard for any emotion)
# LONG_INTERVAL = 3600       # seconds (1 hour per emotion)

# while True:
#     ret, frame = cap.read()
#     if not ret:
#         continue

#     frame = cv2.flip(frame, 1)

#     # Convert BGR -> RGB
#     rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

#     # Analyze emotions (safe mode)
#     result = DeepFace.analyze(rgb_frame, actions=['emotion'], enforce_detection=False)

#     # Store detected emotion
#     current_emotion = result[0]['dominant_emotion']
#     history.append(current_emotion)

#     # Smooth: take most common emotion in last N frames
#     most_common = Counter(history).most_common(1)
#     if most_common:
#         last_emotion = most_common[0][0]

#         try:
#             print(last_emotion)
#             current_time = time.time()

#             if last_emotion in ["fear", "fearful", "sad"]:
#                 last_short = last_sent_time.get("any", 0)  # spam guard applies globally
#                 last_long = last_hourly_sent_time.get(last_emotion, 0)  # per-emotion 1h guard

#                 # If this emotion already sent in last 1h → skip
#                 if current_time - last_long < LONG_INTERVAL:
#                     continue

#                 # Else apply short cooldown (30s for any emotion)
#                 if current_time - last_short >= SHORT_INTERVAL:
#                     requests.post(URL, json={"text": last_emotion})
#                     last_sent_time["any"] = current_time
#                     last_hourly_sent_time[last_emotion] = current_time
#                     print(f"Sent {last_emotion} to backend")
#         except Exception as e:
#             print("Error sending POST:", e)

#     # Face detection (for bounding box)
#     gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
#     faces = faceCascade.detectMultiScale(gray, 1.1, 4)

#     for (x, y, w, h) in faces:
#         cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

#     # Display smoothed emotion
#     font = cv2.FONT_HERSHEY_SIMPLEX
#     cv2.putText(frame, last_emotion, (2, 50), font, 2, (0, 0, 225), 2, cv2.LINE_4)

#     cv2.imshow("Emotion Detection", frame)

#     key = cv2.waitKey(5)
#     if key == ord('q') or key == 27:
#         print("Exiting...")
#         break

# cap.release()
# cv2.destroyAllWindows()
