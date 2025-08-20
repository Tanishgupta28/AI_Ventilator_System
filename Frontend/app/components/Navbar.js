"use client";
import Link from "next/link";
import IconBox from "./Icons"; 

export default function Navbar({ role }) {
  return (
    <nav className="w-30 h-screen bg-white text-gray-800 flex flex-col p-0 fixed left-0 top-16 space-y-6 pt-6">

      <div className="flex flex-col space-y-6 flex-grow">

        <Link href="/dashboard">
          <IconBox label="Dashboard" image="/dashboard.png" bgColor="" />
        </Link>

        <Link href="/addpatient">
          <IconBox label="Add Patient" image="/addpatient.png" bgColor="" />
        </Link>

        <Link href="/caremanager">
          <IconBox label="Information" image="/caremanager.png" bgColor="" />
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
      </div>

      <div className="mt-auto mb-16 px-4 space-y-6">
        <Link href="/signout">
          <IconBox label="Sign Out" image="/help.png" bgColor="" />
        </Link>

        <Link href="/help">
          <IconBox label="Help" image="/help.png" bgColor="" />
        </Link>
      </div>

    </nav>
  );
}
