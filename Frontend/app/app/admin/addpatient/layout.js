"use client";

import Navbar from "@/components/Navbar";
import Notify from "@/components/Notify";

export default function AdminLayout({ children }) {
  return (
    <div className="flex">
      <Navbar role="admin" />
      {children}
      <Notify role="admin" />
    </div>
  );
}
