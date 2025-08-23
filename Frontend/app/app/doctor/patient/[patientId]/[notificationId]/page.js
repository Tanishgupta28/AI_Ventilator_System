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
    <div className="p-6 ml-40 flex flex-col gap-7">
      <Profile
        name={data?.name}
        age={data?.dob}
        bed={data?.bed}
        icon={alertConfig[data?.alert]}
      />

      <div className="flex gap-6 flex-wrap">
        <RealTime
          label1="Oxygen"
          label2="Saturation"
          value="98%"
          icon="/OxygenSaturation.png"
          data={[15, 18, 22, 25, 22, 18, 21, 24, 20, 17, 19]}
          graphColor="#ebac25ff"     
          iconBg="bg-orange-100"  
        />
        <RealTime
          label1="Heart"
          label2="Rate"
          value="76 bpm"
          icon="/HeartRate.png"
          data={[10, 15, 12, 18, 20, 19, 22, 25, 30]}
          graphColor="#eb2525ff"      
          iconBg="bg-red-100"
        />
        <RealTime
          label1="Blood"
          label2="Pressure"
          value="120/80"
          icon="/BloodPressure.png"
          data={[20, 28, 30, 25, 15, 12, 16, 21, 25, 23, 18]}
          graphColor="#3925ebff"     
          iconBg="bg-blue-100"
        />
        <RealTime
          label1="End-Tidal"
          label2={<span>CO<sub>2</sub> (ETCO<sub>2</sub>)</span>}
          value="4.5 %"
          icon="/etCO2.png"
          data={[11, 16, 14, 19, 23, 21, 24, 27, 25]}
          graphColor="#25eb88ff"   
          iconBg="bg-green-100"
        />
      </div>

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
