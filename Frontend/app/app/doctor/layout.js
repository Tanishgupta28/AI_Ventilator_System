"use client";

import Navbar from "@/components/Navbar";
import Notify from "@/components/Notify";
import { useEffect, useState } from "react";

export default function DoctorLayout({ children }) {
  const [doctorId, setDoctorId] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem("id");
    setDoctorId(id);
  }, []);
  return (
    <div className="flex">
      <Navbar role="doctor" />
      {children}
      <Notify role="doctor" id={doctorId} />
    </div>
  );
}
