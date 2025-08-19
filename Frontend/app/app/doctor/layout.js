"use client";

import Navbar from "@/components/Navbar";
import Notify from "@/components/Notify";

export default function DoctorLayout({ children }) {
  return (
    <div className="flex">
      <Navbar role="doctor" />
      {children}
      <Notify role="doctor" />
    </div>
  );
}
