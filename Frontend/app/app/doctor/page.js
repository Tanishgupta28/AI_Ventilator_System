"use client";
import { useSearchParams } from "next/navigation";
import Dashboard1 from "@/components/Dashboard1";
import Navbar from "@/components/Navbar";
import Notify from "@/components/Notify";

export default function DoctorPage() {
    const searchParams = useSearchParams();
    const data = searchParams.get("data");
    const doctorId = JSON.parse(data).doctor.id;
    console.log("Doctor ID:", doctorId);
  return (
    <div className="flex">
      <Navbar role="doctor" />
      <Dashboard1 role="doctor" doctorId={doctorId} />
      <Notify role="doctor" />
    </div>
  );
}

