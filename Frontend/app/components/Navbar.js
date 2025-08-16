import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-48 h-screen bg-gray-900 text-white flex flex-col p-4 fixed left-0 top-0">
      <h2 className="text-xl font-bold mb-6">My App</h2>
      <Link href="/" className="mb-3 hover:text-gray-300">
        Home
      </Link>
      <Link href="/about" className="mb-3 hover:text-gray-300">
        About
      </Link>
      <Link href="/contact" className="hover:text-gray-300">
        Contact
      </Link>
    </nav>
  );
}
