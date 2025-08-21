"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Notify from "@/components/Notify";
import axios from "axios";
import { url } from "@/url";

export default function NurseLayout({ children }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
 
    async function fetchData() {
      try {
        const id = localStorage.getItem("id");
        const res = await axios.get(`${url}/notification/nurse/${id}`);
        const patients = res.data.data.patients || [];
        console.log("Fetched patients:", patients);

        const formattedNotifications = patients.flatMap((p) =>
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

        formattedNotifications.sort((a, b) => b.uploadedAt - a.uploadedAt);
        const finalNotifications = formattedNotifications.map((n) => ({
          ...n,
          time: n.uploadedAt.toLocaleString(),
        }));

        setNotifications(finalNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="flex">
      <Navbar role="nurse" />
      <div className="flex-1">{children}</div>
      <Notify notifications={notifications} />
    </div>
  );
}
