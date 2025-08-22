"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Notify from "@/components/Notify";
import axios from "axios";
import { url } from "@/url";
import { io } from "socket.io-client";

const socket = io(url); // connect to backend WebSocket

export default function DoctorLayout({ children }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const id = localStorage.getItem("id");
        const res = await axios.get(`${url}/notification/doctor/${id}`);
        const patients = res.data.data.patients || [];
        formatAndSet(patients);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    }

    function formatAndSet(patients) {
      const formatted = patients.flatMap((p) =>
        (p.notifications || [])
          .filter((note) => note.alert !== "green")
          .map((note) => ({
            message: note.message,
            patientId: p._id,
            patientName: p.fullname,
            bed: p.assigned_bed,
            uploadedAt: new Date(note.uploadedAt),
            color: note.alert || "default",
          }))
      );
      formatted.sort((a, b) => b.uploadedAt - a.uploadedAt);
      setNotifications(
        formatted.map((n) => ({ ...n, time: n.uploadedAt.toLocaleString() }))
      );
    }

    fetchData();

    // Listen for real-time updates
    socket.on("newNotification", (data) => {
      console.log("New notification received:", data);
      fetchData(); // refetch or append directly
    });

    socket.on("updateNotification", (data) => {
      console.log("Notification updated:", data);
      fetchData();
    });

    return () => {
      socket.off("newNotification");
      socket.off("updateNotification");
    };
  }, []);

  return (
    <div className="flex">
      <Navbar role="doctor" />
      <div className="flex-1">{children}</div>
      <Notify notifications={notifications} />
    </div>
  );
}
