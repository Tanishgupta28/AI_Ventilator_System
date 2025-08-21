"use client";
import Link from "next/link";
import IconBox from "./Icons";

export default function Navbar({ role }) {
  
  const handleSignOut = () => {
    localStorage.removeItem("id");
    localStorage.removeItem("token");
    window.location.href = "/signin";
  };

  return (
    <nav className="w-26 h-screen bg-white text-gray-800 flex flex-col p-0 fixed left-0 top-16 space-y-6 pt-6">
      <div className="flex flex-col space-y-6 flex-grow">
        {(role === "doctor" || role === "nurse") && (
          <Link href={`/${role}`}>
            <IconBox label="Dashboard" image="/dashboard.png" bgColor="" />
          </Link>
        )}
        {role === "admin" && (
          <>
            <Link href="/admin/addpatient">
              <IconBox
                label="Add Patient"
                image="/addpatient.png"
                bgColor=""
              />
            </Link>
            <Link href="/admin/caremanager">
              <IconBox
                label="Care Manager"
                image="/caremanager.png"
                bgColor=""
              />
            </Link>
          </>
        )}
      </div>
      <div className="mt-auto mb-16 px-4 space-y-6">
        <div onClick={handleSignOut}>
          <IconBox label="Sign Out" image="/signout.png" bgColor="" />
        </div>
        <Link href="/help">
          <IconBox label="Help" image="/help.png" bgColor="" />
        </Link>
      </div>
    </nav>
  );
}
