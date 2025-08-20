"use client";

import Navbar from "@/components/Navbar";
import Notify from "@/components/Notify";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }) {
  const [id, setId] = useState(null);
  useEffect(() => {
    setId(localStorage.getItem("id"));
  }, []);
  return (
    <div className="flex">
      <Navbar role="admin" />
      {children}
      <Notify role="admin" id={id} />
    </div>
  );
}
