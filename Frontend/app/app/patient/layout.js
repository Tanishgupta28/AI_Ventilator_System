"use client";
import { useEffect, useState } from "react";
import Notify from "@/components/Notify";
import axios from "axios";
import { url } from "@/url";
import { io } from "socket.io-client";

const socket = io(url);

export default function NurseLayout({ children }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const id = localStorage.getItem("id");
        const res = await axios.get(`${url}/notification/nurse/${id}`);
        const patients = res.data.data.patients || [];
        setNotifications(patients);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
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
      <div className="flex-1">{children}</div>
      <Notify notifications={notifications} />
    </div>
  );
}
