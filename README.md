# Project Delta

Project Delta is an AI-powered healthcare platform designed to assist patients on mechanical ventilators. The system integrates real-time vitals monitoring, facial emotion detection, and an eye-tracking communication interface to support patients, families, and medical staff in critical care settings.

---

## Key Features

* **Real-Time Patient Monitoring:** Centralized dashboard for clinicians and nursing staff to track ventilator output and vital signs continuously.
* **Facial Emotion Recognition:** Computer vision models analyze facial expressions to detect signs of pain, distress, or anxiety.
* **Eye-Tracking Interface:** Hands-free communication system allowing intubated patients to signal basic needs and responses (e.g., "Yes/No") using eye movements.
* **Automated Emergency Alerts:** Triggers notifications to duty staff upon detecting abnormal vital trends or elevated patient distress.
* **Family Voice Playback:** Automated playout of pre-recorded family audio messages to soothe anxious patients.
* **Real-Time Voice Messaging:** Streamed audio messages from friends and family to help patients stay connected during recovery.
* **Targeted Music Therapy:** Automated selection and playback of therapeutic audio tailored to the patient's real-time emotional state.

---

## Technical Stack

* **Frontend Framework:** Next.js, Tailwind CSS
* **Backend Architecture:** Node.js, Express.js
* **Database Management:** MongoDB Atlas
* **Authentication:** JSON Web Tokens (JWT)
* **Cloud Infrastructure:** DigitalOcean
* **Mobile Application:** Flutter
* **Computer Vision:** OpenCV, MediaPipe (gaze tracking and facial landmark extraction)
* **Machine Learning:** TensorFlow, DeepFace, ResNet
* **Notification Pipeline:** Python alerting scripts, Email/SMS API integrations

---

## Project Structure

For Python setup, dependency checks, and webcam demo commands, see
[the AI module guide](AI%20models/README.md).
