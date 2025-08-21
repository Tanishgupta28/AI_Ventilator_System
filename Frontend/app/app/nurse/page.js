"use client";
import Dashboard1 from "@/components/Dashboard1";

export default function NursePage() {
  const id = localStorage.getItem("id");
  return <Dashboard1 role="nurse" id={id} info={false} />;
}
