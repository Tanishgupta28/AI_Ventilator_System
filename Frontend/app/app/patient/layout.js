"use client";
import { useEffect, useState } from "react";
import Notify from "@/components/Notify";
import axios from "axios";
import { url } from "@/url";
import { io } from "socket.io-client";
import AudioPlayer from "@/components/Audio";

const socket = io(url);

export default function PatientLayout({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [audioUrl, setAudioUrl] = useState(null);
  const [text, setText] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const id = localStorage.getItem("id");
        const res = await axios.get(`${url}/memvoice/patient/${id}`);
        const patients = res.data.data.patient.membervoice || [];
        setNotifications(patients);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    }
    fetchData();

    // Notifications
    socket.on("newNotification", (data) => {
      fetchData();
    });
    socket.on("updateNotification", (data) => {
      fetchData();
    });

    // ✅ Listen for new audio URL
    socket.on("newVoiceUrl", (data) => {
      console.log("Received new audio:", data);
      setAudioUrl(data.voiceUrl);
      setText(data.text);
    });

    return () => {
      socket.off("newNotification");
      socket.off("updateNotification");
      socket.off("newVoiceUrl");
    };
  }, []);

  return (
    <div className="flex">
      <div className="flex-1">
        {children}

        {/* Auto-play when audioUrl changes */}
        {audioUrl && (
          <div className="fixed bottom-4 right-4 w-[400px]">
            <AudioPlayer src={audioUrl} autoPlayOnNewUrl={true} />
            <p className="text-gray-400 text-sm mt-2">{text}</p>
          </div>
        )}
      </div>
      <Notify notifications={notifications} isVoice={true} />
    </div>
  );
}
