"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { url } from "@/url";

function Member({ members = [], onSubmit, id }) {
  const [items, setItems] = useState(members);
  const [isAdding, setIsAdding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setItems(members);
  }, [members]);

  const [formData, setFormData] = useState({
    fullname: "",
    role: "",
    email: "",
    contactno: "",
    password: "",
  });
  const [imageFile, setImageFile] = useState(null);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!formData.fullname || !formData.role) return;

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      if (imageFile) {
        data.append("image", imageFile);
      }

      const res = await axios.post(`${url}/member/register/${id}`, data);

      const newItem = res.data.data?.member || res.data.member;

      if (!newItem) {
        console.error("Member not returned:", res.data);
        alert("Member registration failed");
        return;
      }

      setItems((prev) => [...prev, newItem]);
      onSubmit && onSubmit(newItem);

      setFormData({
        fullname: "",
        role: "",
        email: "",
        contactno: "",
        password: "",
      });
      setImageFile(null);
      setIsAdding(false);
    } catch (error) {
      console.error("Upload failed:", error.response?.data || error.message);
      alert("Failed to add member");
    }
  };

  return (
    <div className="w-[800px] max-h-[calc(100vh-100px)] shadow-lg rounded-2xl p-6 flex flex-col items-center bg-gradient-to-b from-blue-50 to-blue-100 overflow-y-auto pb-16">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Add Members</h2>

      {/* Scrollable List */}
      <div className="flex flex-col gap-3 w-full pr-2 pb-4">
        {items.map((item, idx) => (
          <div
            key={item._id || idx}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Profile Image */}
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={item.image?.url || item.image || "/kissan.png"}
                alt={item.fullname}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Details */}
            <div className="flex justify-between items-center w-full">
              <span className="text-sm font-medium text-gray-700">
                {item.fullname}
              </span>
              <span className="text-sm font-semibold text-blue-700 border border-blue-300 bg-blue-50 rounded-md px-3 py-1">
                {item.role}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="mt-6 bg-white rounded-2xl shadow-md p-6 w-full">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullname}
                onChange={handleChange("fullname")}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Member Role
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={handleChange("role")}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Contact
              </label>
              <input
                type="tel"
                value={formData.contactno}
                onChange={handleChange("contactno")}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Password
              </label>
              <div className="flex items-center border rounded-lg p-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange("password")}
                  className="flex-1 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Profile Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleSubmit}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            >
              Submit
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-6 py-2 rounded-lg bg-gray-400 hover:bg-gray-500 text-white shadow-md"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-5 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center text-2xl shadow-md"
        >
          +
        </button>
      )}
    </div>
  );
}

export default Member;
