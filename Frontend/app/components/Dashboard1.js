"use client";

import { useEffect, useState, useMemo } from "react";
import Box from "./Box";
import axios from "axios";
import Link from "next/link";
import { url } from "@/url";
import { calculateAge } from "@/lib/dob";
import { alertConfig } from "@/lib/alert";
import Image from "next/image";
import { io } from "socket.io-client";

const socket = io(url);

export default function Dashboard1({ role, id, info }) {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    if (!id || !role) return;

    async function fetchData() {
      try {
        const userId = localStorage.getItem("id");
        const res = await axios.get(`${url}/notification/${role}/${userId}`);
        const patientList =
          res.data?.data?.patients || res.data?.patients || [];
        const patientsWithAge = patientList.map((p) => ({
          ...p,
          age: calculateAge(p.dob),
        }));
        setPatients(patientsWithAge);
      } catch (err) {
        console.error("Error fetching patients:", err);
      }
    }
    
    fetchData();

    const socket = io(url);

    socket.on("newNotification", () => {
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, [id, role]);

  const allNotifications = useMemo(() => {
    return patients
      .flatMap((p) =>
        (p.notifications || []).map((notif) => ({
          notifId: notif._id,
          patientId: p.id,
          fullname: p.fullname || "Unknown",
          age: p.age || "Unknown",
          bed: p.assigned_bed || "Unknown",
          image: p.image || "/hospitalIcon.png",
          alertType: notif.alert || "default",
          uploadedAt: notif.uploadedAt || Date.now(),
        }))
      )
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }, [patients]);

  return (
    <div className="p-6 flex-1 flex flex-col items-start gap-10 h-screen overflow-y-auto pb-20">
     <div className="flex justify-center w-full">
    <Image src="/lovelogo.png" alt="Love Logo" width={150} height={100} />
  </div>

      {allNotifications.length === 0 ? (
        <p className="text-gray-500 text-sm">No notifications available</p>
      ) : (
        <div className="grid grid-cols-4 gap-15 w-full max-w-5xl pl-45">
          {allNotifications.map((item) => {
            const { bgColor, alertImage } =
              alertConfig[item.alertType] || alertConfig.default;

            return (
              <Link
                key={item.notifId}
                href={
                  info
                    ? `/${role}/patient/${item.patientId}/${item.notifId}`
                    : `/admin/caremanager/${item.patientId}`
                }
              >
                <Box
                  name={item.fullname}
                  age={item.age}
                  bed={item.bed}
                  image={item.image}
                  bgColor={bgColor}
                  alert={alertImage}
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
