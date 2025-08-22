"use client";
import Profile from "@/components/Profile";
import Voice from "@/components/Voice";
import { url } from "@/url";
import axios from "axios";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PatientDetails() {
  const { patientId } = useParams();
  const [data, setData] = useState({});
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const patientRes = await axios.get(`${url}/patient/${patientId}`);
        setData(patientRes.data.data);

        const voiceRes = await axios.get(`${url}/voice/${patientId}`);
        const raw = voiceRes.data?.data || [];

        const normalized = raw.map((v) => {
          const src = typeof v?.voice === "string" ? v.voice : "";
          const audio = src
            ? src.startsWith("http")
              ? src
              : `https://${src}`
            : "";
          return { audio, message: v?.text ?? "" };
        });

        setVoices(normalized);
      } catch (err) {
        console.error("Error fetching patient details:", err);
      }
    })();
  }, [patientId]);

  const handleVoiceSubmit = async ({ file, text }) => {
    try {
      const formData = new FormData();
      formData.append("upload", file);
      formData.append("text", text);

      const res = await axios.post(
        `${url}/voice/register/${patientId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const saved = res.data?.data?.voice;
      const src = typeof saved?.voice === "string" ? saved.voice : "";
      const audio = src
        ? src.startsWith("http")
          ? src
          : `https://${src}`
        : URL.createObjectURL(file);

      setVoices((prev) => [...prev, { audio, message: saved?.text ?? text }]);
    } catch (err) {
      console.error(
        "Error uploading voice:",
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
        <Voice voices={voices} onSubmit={handleVoiceSubmit} />
      </div>
    </div>
  );
}
