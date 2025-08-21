"use client";
import Dashboard1 from "@/components/Dashboard1";
import { use, useEffect, useState } from "react";

export default function AdminPage() {
  const [id, setId] = useState(null);
  useEffect(() => {
    const id = localStorage.getItem("id");
    setId(id);
  }, []);
  return <Dashboard1 role="admin" id={id} info={false} />;
}
