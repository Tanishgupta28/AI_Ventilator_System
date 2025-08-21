"use client";

import { useEffect, useState, useMemo } from "react";
import Box from "./Box";
import axios from "axios";
import Link from "next/link";
import { url } from "@/url";
import { calculateAge } from "@/lib/dob";
import { alertConfig } from "@/lib/alert";
import Image from "next/image";

export default function Dashboard1({ role, id, info }) {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    if (!id || !role) return;
    async function fetchData() {
      try {
        const id = localStorage.getItem("id");
        const res = await axios.get(`${url}/notification/${role}/${id}`);
        const patientList =
          res.data?.data?.patients || res.data?.patients || [];
        const patientsWithAge = patientList.map((p) => ({
          ...p,
          age: calculateAge(p.dob),
        }));
        console.log("Patients with age:", patientsWithAge);
        setPatients(patientsWithAge);
      } catch (err) {
        console.error("Error fetching patients:", err);
      }
    }

    fetchData();
  }, [id, role]);
  const allNotifications = useMemo(() => {
    return patients.flatMap((p) =>
      (p.notifications || []).map((notif) => ({
        notifId: notif._id,
        patientId: p.id,
        fullname: p.fullname || "Unknown",
        age: p.age || "Unknown",
        bed: p.assigned_bed || "Unknown",
        image: p.image || "/hospitalIcon.png",
        alertType: notif.alert || "default",
      }))
    );
  }, [patients]);
  console.log("All Notifications:", allNotifications);

  return (
    <div className="p-6 flex-1 flex flex-col items-center gap-10 h-screen overflow-y-auto pb-20">
      <Image src="/lovelogo.png" alt="Love Logo" width={150} height={100} />

      {allNotifications.length === 0 ? (
        <p className="text-gray-500 text-sm">No notifications available</p>
      ) : (
        <div className="grid grid-cols-3 gap-6 w-full max-w-3xl">
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
