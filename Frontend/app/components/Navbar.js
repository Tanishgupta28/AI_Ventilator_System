import Link from "next/link";

export default function Navbar({ role }) {
  return (
    <nav className="w-48 h-screen bg-gray-900 text-white flex flex-col p-4 fixed left-0 top-16">
      <h2 className="text-xl font-bold mb-6">Hospital</h2>

      <Link href="/dashboard" className="mb-3 hover:text-gray-300">
        Dashboard
      </Link>

      {role === "admin" && (
        <Link href="/admin/addpatient" className="mb-3 hover:text-gray-300">
          Add Patient
        </Link>
      )}

      {role === "admin" && (
        <Link href="/admin/caremanager" className="mb-3 hover:text-gray-300">
          Care Manager
        </Link>
      )}
    </nav>
  );
}
