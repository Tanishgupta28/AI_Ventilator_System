"use client";

import { useEffect, useState } from "react";
import Box from "./Box";
import Text from "./Text";
import axios from "axios";
import Link from "next/link";
import { url } from "@/url";
import { calculateAge } from "@/lib/dob";
import { alertConfig } from "@/lib/alert";

export default function Dashboard1({ role, doctorId }) {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(`${url}/notification/${role}/${doctorId}`);
        const patientsWithAge = (res.data.data.patients || []).map((p) => ({
          ...p,
          age: calculateAge(p.dob),
        }));
        console.log("Patients with Age:", patientsWithAge);
        setPatients(patientsWithAge);
      } catch (err) {
        console.error("Error fetching patients:", err);
      }
    }

    fetchData();
  }, [doctorId, role]);

  return (
    <div className="ml-48 p-6 flex-1 flex flex-col items-center">
      <Text size="text-3xl" bold color="text-gray-800">
        DELTA
      </Text>
      <Text size="text-3xl" bold color="text-gray-800" className="mb-6">
        HELP
      </Text>

      <div className="grid grid-cols-3 gap-6">
        {patients.map((p) => {
          const alertType = p.newNotification?.[0]?.alert || "default";
          const { bgColor, alertImage } = alertConfig[alertType] || alertConfig.default;

          return (
            <Link
              key={p._id}
              href={`/doctor/patient/${p._id}/${p.newNotification?.[0]?._id}`}
            >
              <Box
                name={p.fullname || "Unknown"}
                age={p.age || "Unknown"}
                bed={p.assigned_bed || "Unknown"}
                image={p.image || "/hospitalIcon.png"}
                bgColor={bgColor}
                alert={alertImage}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
