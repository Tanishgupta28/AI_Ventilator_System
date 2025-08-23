# 🌐 Project Delta

Project Delta is an AI-powered system designed to improve the lives of patients on ventilators. It combines real-time monitoring, emotion detection, and an eye-tracking communication system to support patients, families, and healthcare professionals.

---

## 🚀 Features
- 📊 **Real-Time Monitoring:** Live dashboard for doctors/nurses to monitor ventilator data and patient vitals.
- 🙂 **Emotion Detection:** Detects distress, anxiety, or pain using AI-based facial expression recognition.
- 👀 **Eye-Tracking Communication:** Patients can respond with "Yes/No" and basic needs using eye movements.
- 🚨 **Emergency Alerts:** Triggers immediate alerts when abnormal vitals or patient distress is detected.
- 🎵 **Family Voice Playback:** Plays comforting, pre-recorded messages from family members when patients are anxious.
- 🎤 **Real-Time Friend Voice Messages:** Friends can send voice messages to patients in real time to help them feel connected to society.
- 🎶 **Music Therapy:** Patients receive personalized music therapy when certain emotions are detected to improve well-being.

---

## 🛠️ Tech Stack
- **Frontend:** Next.js, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas
- **Authentication:** JWT
- **Deployment:** Digital Ocean
- **Mobile Interface:** Flutter
- **Computer Vision:** OpenCV, Mediapipe (eye tracking, face detection)
- **AI / ML:** TensorFlow, DeepFace, Resnet, OpenCV
- **Alerts & Notifications:** Email/SMS API, Python alerting scripts

---

## 📁 Folder Structure
```
Israel/
  frontend/             # Next.js frontend app
    app/                # Main app folder
      components/       # Reusable React components
      lib/              # Libraries and helpers
      admin/            # Admin routes
      doctor/           # Doctor routes
      member/           # Member routes
      nurse/            # Nurse routes
      patient/          # Patient routes
      signin/           # Sign-in pages/routes
  backend/              # Node.js backend
    config/             # Configuration files
    middlewares/        # Middleware scripts
    routes/             # API routes
    models/             # Database models
    utils/              # Utility scripts
  app/                  # Flutter mobile app
    assets/             # Images and static assets
    lib/                # Flutter app logic
  AI-models/            # Root project folder
    haarcascade_frontalface_default.xml
    emotionfear1.py
    buttons.py
    taking_coordinates.py
    mainn.py
    main3.py
    tempCodeRunnerFile.py 
```

---

## ⚡ Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Achin-Agarwal/Israel.git
   cd Israel
   ```

2. **Create Virtual Environment (Optional but Recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Linux/Mac
   venv\Scripts\activate     # On Windows
   ```

3. **Install dependencies:**
   - **Backend:** `cd Backend && npm install`
   - **Frontend:** `cd Frontend && cd app && npm install`
   - **Flutter app:** `cd app && flutter pub get`

4. **Install Python dependencies for AI models:**
   - For `mainn.py`:
     ```bash
     pip install opencv-python mediapipe pyautogui numpy
     ```
   - For `main3.py`:
     ```bash
     pip install opencv-python mediapipe pyautogui numpy opencv-contrib-python  # if needed
     ```
   - For `emotionfear1.py`:
     ```bash
     pip install opencv-python deepface numpy
     ```
   - For `tracking_coordinates.py`:
     ```bash
     pip install opencv-python
     ```

5. **Run the application:**
   - **Backend:** `node index.js`
   - **Frontend:** `npm run dev`
   - **Flutter app:** `flutter run`

6. **Run AI models:**
   - Eye/Nose Tracking: `python mainn.py`
   - Alternative Eye Tracking: `python main3.py`
   - Emotion Detection: `python emotionfear1.py`
   - Coordinate Tracking of Interface Buttons: `python tracking_coordinates.py`

7. **Access the app directly:**
   - Frontend: https://frontend-4o2dp.ondigitalocean.app/
   - Backend: https://israel-5mizz.ondigitalocean.app/

---

## 📝 Usage
- Connect a webcam or camera to capture patient facial expressions.
- Doctors can view live vitals and alerts.
- Patients can communicate with basic eye movements.
- Families can upload pre-recorded audio messages for playback.
- Friends can send real-time voice messages.
- Patients receive music therapy based on detected emotions.

---

## Dummy Email Ids and passwords
**Nurse**:  Email: kavya.iyer@nurse.com  Password: NursePass123  
**Doctor**:  Email: manish.kapoor@example.com  Password: DocSecure334  
**Admin**:  Email: admin1@caresync.com  Password: Admin@123  
**Member**:  Email: achin@gmail.com  Password: 12345  
**Patient**:  Email: achinagarwal@gmail.com  Password: 12345

---

## 📬 Contact
For support or queries, contact:  
**Team Project Delta** ✉️

