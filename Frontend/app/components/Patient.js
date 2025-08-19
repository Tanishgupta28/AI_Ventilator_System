"use client";
import { useState } from "react";
import InputField from "./Input";
import Button from "./Button";

export default function PatientForm() {
  const [formData, setFormData] = useState({
    firstName: "Tanisha",
    middleName: "Gupta",
    lastName: "Narula",
    gender: "Female",
    dob: "2004-06-28",
    phone: "+91 9874563210",
    email: "tgnarula@gmail.com",
    bed: "4/6",
    doctor: "Dr. Roushan Sharma",
    address:
      "Flat no. 14B/25, Bana Enclave, Near Infantry Circle, Mamun Cantt, Pathankot-145001, Punjab, India",
  });

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSave = () => {
    console.log("Saved Data:", formData);
  };

  const handleReset = () => {
    setFormData({});
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-3 gap-4">
        <InputField
          label="First Name"
          value={formData.firstName}
          onChange={handleChange("firstName")}
          rounded="rounded-2xl"
        />
        <InputField
          label="Middle Name"
          value={formData.middleName}
          onChange={handleChange("middleName")}
          rounded="rounded-2xl"
        />
        <InputField
          label="Last Name"
          value={formData.lastName}
          onChange={handleChange("lastName")}
          rounded="rounded-2xl"
        />
      </div>

      <div className="grid grid-cols-3 gap-20">
        <div className="mb-4">
          <label htmlFor="gender" className="block text-gray-700 text-xs mb-1">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue=""
          >
            <option value="" disabled>
              Select Gender
            </option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <InputField
          label="Date of Birth"
          type="date"
          value={formData.dob}
          onChange={handleChange("dob")}
          rounded="rounded-2xl"
        />
        <InputField
          label="Phone Number"
          value={formData.phone}
          onChange={handleChange("phone")}
          rounded="rounded-2xl"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <InputField
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleChange("email")}
          rounded="rounded-2xl"
        />
        <InputField
          label="Assigned Bed"
          value={formData.bed}
          onChange={handleChange("bed")}
          rounded="rounded-2xl"
        />
        <InputField
          label="Appointed Doctor"
          value={formData.doctor}
          onChange={handleChange("doctor")}
          rounded="rounded-2xl"
        />
      </div>

      <InputField
        label="Residence Address"
        value={formData.address}
        onChange={handleChange("address")}
        rounded="rounded-2xl"
        className="col-span-3"
      />

      <div className="flex justify-center gap-4 mt-4">
        <Button onClick={handleSave} bgColor="bg-blue-500" width="w-32">
          Save
        </Button>
        <Button onClick={handleReset} bgColor="bg-gray-400" width="w-32">
          Reset
        </Button>
      </div>
    </div>
  );
}
