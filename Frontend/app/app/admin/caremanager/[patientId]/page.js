"use client";
import NotifyBox from "@/components/NotifyBox";
import Profile from "@/components/Profile";
import RealTime from "@/components/RealTime";
import { alertConfig } from "@/lib/alert";
import { calculateAge } from "@/lib/dob";
import { url } from "@/url";
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PatientDetails() {
  const { patientId} = useParams();
  const [data, setData] = useState({});
  const [length, setLength] = useState(0);

  useEffect(() => {
    async function fetchPatientDetails() {
      try {
        const response = await axios.get(
          `${url}/patient/${patientId}`
        );
        console.log(response.data.data);
        setData(response.data.data);
      } catch (err) {
        console.error("Error fetching patient details:", err);
      }
    }
      fetchPatientDetails();
  }, [patientId]);

  return (
    <div className="p-6 ml-48 flex flex-col gap-7">
      <Profile
        name={data?.name}
        age={data?.dob}
        bed={data?.bed}
      />
    </div>
  );
}
