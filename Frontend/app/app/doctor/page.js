"use client";
import Dashboard1 from "@/components/Dashboard1";
import { useSearchParams } from "next/navigation";

export default function DoctorPage() {
  const searchParams = useSearchParams();
  const data = searchParams.get("data");
  const doctorId = JSON.parse(data).doctor.id;

  return <Dashboard1 role="doctor" doctorId={doctorId} />;
}
