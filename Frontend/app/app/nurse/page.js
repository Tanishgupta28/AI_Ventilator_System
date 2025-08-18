"use client";
import Box from "@/components/Box";
import Navbar from "@/components/Navbar";
import Notify from "@/components/Notify";

export default function NursePage() {
  return (
    <div className="flex">
      <Navbar role="nurse" />
      <div className="ml-48 p-6 flex-1">
        <Box/>
        <h1 className="text-2xl font-bold">Nurse Dashboard</h1>
        <p>Welcome, nurse! Your tasks are listed here.</p>
      </div>
      <Notify role="nurse" />
    </div>
  );
}
