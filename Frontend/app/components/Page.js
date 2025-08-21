"use client";

import { useEffect, useState } from "react";
import RealTime from "@/components/RealTime";
import axios from "axios";
import { url } from "@/url";  

export default function Page() {
  const [oxygen, setOxygen] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(`${url}/patient/live-readings`);  //CHECKKKKKKKKKKKK
        setOxygen(res.data.oxygenSaturation); 
      } catch (err) {
        console.error("Error fetching oxygen saturation:", err);
      }
    }

    fetchData();

    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);

  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-100 p-10">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <RealTime 
        label="Oxygen Saturation" 
        value={oxygen ? `${oxygen}%` : "Loading..."} 
        icon="/OxygenSaturation.png" 
      />
    </div>
  );
}
