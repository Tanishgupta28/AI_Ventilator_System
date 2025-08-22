"use client";
import Profile from "@/components/Profile";
import Medication from "@/components/Medication";
import { url } from "@/url";
import axios from "axios";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PatientDetails() {
  const { patientId } = useParams();
  const [data, setData] = useState({});
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const patientRes = await axios.get(`${url}/patient/${patientId}`);
        setData(patientRes.data.data);

        const medRes = await axios.get(`${url}/medication/${patientId}`);
        const raw = medRes.data?.data?.medication || [];

        const normalized = raw.map((m) => {
          const time = new Date(m.date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          return { label: m.msg, time, _id: m._id };
        });

        setMedications(normalized);
      } catch (err) {
        console.error("Error fetching patient details:", err);
      }
    })();
  }, [patientId]);

  const handleMedicationSubmit = async ({ label, time }) => {
  try {
    const today = new Date();
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    today.setHours(hour, minute, 0, 0);
    const payload = {
      msg: label,
      date: today.toISOString(),
      patient: patientId,
    };

    console.log("Submitting medication:", payload);

    const res = await axios.post(
      `${url}/medication/register/${patientId}`,
      payload
    );

    const saved = res.data?.data?.medication;
    console.log("Saved medication:", saved);
    const formattedTime = new Date(saved.date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const newMed = { label: saved.msg, time: formattedTime, _id: saved._id };
    setMedications((prev) => [...prev, newMed]);
  } catch (err) {
    console.error(
      "Error saving medication:",
      err.response?.data || err.message
    );
  }
};


  return (
    <div className="p-6 flex-1 flex flex-col gap-6 h-screen overflow-y-auto ml-40">
      <div className="flex ml-100">
        <Image src="/lovelogo.png" alt="Add Patient" width={150} height={100} />
      </div>

      <div className="w-[900px] bg-white shadow-lg rounded-2xl flex flex-col items-center justify-start overflow-hidden">
        <Profile
          name={data?.name}
          age={data?.dob}
          bed={data?.bed}
          bool={false}
          width={900}
          iw={100}
          namesize="text-3xl"
          agesize="text-xl"
        />
        <Medication schedules={medications} onSubmit={handleMedicationSubmit} />
      </div>
    </div>
  );
}
