import Link from "next/link";

export default function Notify({ role }) {
  return (
    <nav className="w-48 h-screen bg-gray-900 text-white flex flex-col p-4 fixed right-0 top-0">
      <h2 className="text-xl font-bold mb-6">Notify</h2>

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
