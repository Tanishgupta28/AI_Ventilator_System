"use client";
import Navbar from "@/components/Navbar";
import Notify from "@/components/Notify";

export default function NursePage() {
  return (
    <div className="flex">
      <Navbar role="nurse" />
      {children}
      <Notify role="nurse" />
    </div>
  );
}

