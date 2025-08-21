"use client";
import AudioPlayer from "@/components/Audio";
import Button from "@/components/Button";
import Medication from "@/components/Medication";
import Member from "@/components/Member";
import NotifyBox from "@/components/NotifyBox";
import Profile from "@/components/Profile";
import ProfileCard from "@/components/ProfileCard";
import RealTime from "@/components/RealTime";
import Text from "@/components/Text";
import TimeTag from "@/components/TimeTag";
import { alertConfig } from "@/lib/alert";
import { calculateAge } from "@/lib/dob";
import { url } from "@/url";
import axios from "axios";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PatientDetails() {
  const { patientId } = useParams();
  const id = patientId;
  const router = useRouter();
  const [data, setData] = useState({});
  const [length, setLength] = useState(0);

  useEffect(() => {
    async function fetchPatientDetails() {
      try {
        const response = await axios.get(`${url}/patient/${patientId}`);
        console.log(response.data.data);
        setData(response.data.data);
      } catch (err) {
        console.error("Error fetching patient details:", err);
      }
    }
    fetchPatientDetails();
  }, [patientId]);

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
          iw={50}
        />
        <Member
          members={[
            { name: "Alice Johnson", role: "Doctor" },
            { name: "Bob Smith", role: "Nurse" },
            { name: "Charlie Brown", role: "Patient" },
          ]}
          onSubmit={(newMember) => {
            console.log("Send to backend:", newMember);
          }}
        />
      </div>
    </div>
  );
}
