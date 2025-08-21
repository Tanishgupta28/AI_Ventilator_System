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
  const { patientId, notificationId } = useParams();
  const [data, setData] = useState({});
  const [length, setLength] = useState(0);

  useEffect(() => {
    async function fetchPatientDetails() {
      try {
        const response = await axios.get(
          `${url}/patient/${patientId}/notification/${notificationId}`
        );

        const notifications = (response.data.data.notifications || []).slice().reverse();
        console.log("Patient Details:", response.data.data);
        console.log("Notification length:", notifications.length);

        setLength(notifications.length * 20);
        setData(response.data.data);
      } catch (err) {
        console.error("Error fetching patient details:", err);
      }
    }

    if (patientId && notificationId) {
      fetchPatientDetails();
    }
  }, [patientId, notificationId]);

  return (
    <div className="p-6 ml-48 flex flex-col gap-7">
      <Profile
        name={data?.name}
        age={data?.dob}
        bed={data?.bed}
        icon={alertConfig[data?.alert]}
      />
      <RealTime />
      <div
        className="max-h-[80vh] overflow-y-auto"
        style={{ paddingBottom: `${length}px` }}
      >
        <NotifyBox
          day={calculateAge(data?.dob)}
          notifications={data?.notifications?.slice().reverse() || []}
        />
      </div>
    </div>
  );
}
