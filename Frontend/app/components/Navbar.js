"use client";
import Link from "next/link";
import IconBox from "./Icons"; 

export default function Navbar({ role }) {
  return (
    <nav className="w-48 h-screen bg-white text-gray-800 flex flex-col p-0 fixed left-0 top-16 space-y-6 shadow-lg">
      <h2 className="text-xl font-bold mb-6">Hospital</h2>

      <Link href="/dashboard">
        <IconBox label="Dashboard" image="/dashboard.png" bgColor="" />
      </Link>

      <Link href="/addpatient">
        <IconBox label="Add Patient" image="/addpatient.png" bgColor="" />
      </Link>

      <Link href="/caremanager">
        <IconBox label="Info" image="/caremanager.png" bgColor="bg-blue-100" />
      </Link>

      {role === "admin" && (
        <Link href="/admin/addpatient">
          <IconBox label="Add Patient" image="/addpatient.png" bgColor="bg-green-100" />
        </Link>
      )}

      {role === "admin" && (
        <Link href="/admin/caremanager">
          <IconBox label="Care Manager" image="/caremanager.png" bgColor="bg-yellow-100" />
        </Link>
      )}
    </nav>
  );
}
