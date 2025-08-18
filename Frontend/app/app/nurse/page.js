"use client";
import Dashboard1 from "@/components/Dashboard1";
import Navbar from "@/components/Navbar";
import Notify from "@/components/Notify";

export default function NursePage() {
  return (
    <div className="flex">
      <Navbar role="nurse" />
      <Dashboard1 role="nurse" />
      <Notify role="nurse" />
    </div>
  );
}

