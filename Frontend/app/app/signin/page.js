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
      router.push(`/${role}`);
    } catch (error) {
      console.error(error);
      alert("Login failed ❌");
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-100 to-blue-100">
    <div className="flex w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden">
      
      <div className="w-1/2 p-8 flex flex-col justify-center">
        <h2 className="text-5xl font-bold mb-10 text-center">LOGIN</h2>

        <div className="mb-4">
          <label className="block text-gray-500 text-sm mb-1">User Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 bg-gray-100 focus:outline-none"
          >
            <option value="">Choose Role</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="patient">Patient</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-500 text-sm mb-1">Email</label>
          <input
            type="email"
            placeholder="Enter your Email here"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 bg-gray-100 focus:outline-none"
          />
        </div>

        <div className="mb-10">
          <label className="block text-gray-500 text-sm mb-1">Password</label>
          <input
            type="password"
            placeholder="Enter your Password here"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 bg-gray-100 focus:outline-none"
          />
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600"
        >
          ENTER
        </button>
      </div>

      <div className="w-1/2 relative">
        <img
          src="/Penguin.png" 
          alt="img"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  </div>
);
}

