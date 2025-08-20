"use client";
import Dashboard1 from "@/components/Dashboard1";

export default function AdminPage() {
  const id = localStorage.getItem("id");
  return <Dashboard1 role="admin" id={id} info={false} />;
}
