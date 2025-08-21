"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { url } from "@/url";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${url}/${role}/login`, {
        email,
        password,
      });
      localStorage.setItem("id", res.data.data?.[`${role}`]?.id);
      const token = res.data.data.token;
      localStorage.setItem("token", token);
      alert("Login successful ✅");
      const data = JSON.stringify(res.data.data);
      if (role == "admin") router.push(`/admin/addpatient`);
      else router.push(`/${role}`);
    } catch (error) {
      console.error(error);
      alert("Login failed ❌");
    }
  };

  return (
    <div className="flex flex-col gap-3 max-w-sm mx-auto mt-10">
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="border px-2 py-1"
      >
        <option value="">Select Role</option>
        <option value="doctor">Doctor</option>
        <option value="nurse">Nurse</option>
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border px-2 py-1"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border px-2 py-1"
      />

      <button
        onClick={handleLogin}
        className="bg-green-500 text-white py-2 rounded"
      >
        Login
      </button>
    </div>
  );
}
