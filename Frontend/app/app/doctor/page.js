"use client";
import { useSearchParams } from "next/navigation";
import Dashboard1 from "@/components/Dashboard1";
import Navbar from "@/components/Navbar";
import Notify from "@/components/Notify";

export default function DoctorPage() {
    const searchParams = useSearchParams();
    const data = searchParams.get("data");
    console.log(JSON.parse(data))
  return (
    <div className="flex">
      <Navbar role="doctor" />
      <Dashboard1 role="doctor" />
      <Notify role="doctor" />
    </div>
  );
}

