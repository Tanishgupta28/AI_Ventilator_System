"use client";
import { useState } from "react";
import InputField from "./Input";
import Button from "./Button";
import axios from "axios";
import { url } from "@/url";

export default function PatientForm() {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    contactno_Primary: "",
    contactno_Secondary: "",
    gender: "",
    dob: "",
    assigned_bed: "",
    address: "",
    doctorEmail: "",
    nurseEmails: "",
  });

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  // const handleNurseChange = (index, value) => {
  //   const updated = [...formData.nurses];
  //   updated[index] = value;
  //   setFormData({ ...formData, nurses: updated });
  // };

  // const addNurseField = () => {
  //   setFormData({ ...formData, nurses: [...formData.nurses, ""] });
  // };

  const handleSave = async() => {
    console.log("Saved Data:", formData);
    const response=await axios.post(`${url}/patient/register`, formData);
    console.log(response.data)
  };

  const handleReset = () => {
    setFormData({
      fullname: "",
      email: "",
      contactno_Primary: "",
      contactno_Secondary: "",
      gender: "",
      dob: "",
      assigned_bed: "",
      address: "",
      doctorEmail: "",
      nurseEmails: "",
    });
  };

  return (
    <div className="max-w-full mr-8 overflow-x-auto">
      <div className="grid grid-cols-4 gap-4 min-w-max">
        <InputField
          label="Full Name"
          value={formData.fullname}
          onChange={handleChange("fullname")}
          rounded="rounded-2xl"
          width="w-full"
          className="col-span-2"
        />
        <InputField
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleChange("email")}
          rounded="rounded-2xl"
        />
        <InputField
          label="Primary Contact Number"
          value={formData.contactno_Primary}
          onChange={handleChange("contactno_Primary")}
          rounded="rounded-2xl"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <InputField
          label="Secondary Contact Number"
          value={formData.contactno_Secondary}
          onChange={handleChange("contactno_Secondary")}
          rounded="rounded-2xl"
        />
        <div className="mb-4">
          <label htmlFor="gender" className="block text-gray-700 text-xs mb-1">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange("gender")}
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select Gender
            </option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
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
          label="Assigned Bed"
          value={formData.assigned_bed}
          onChange={handleChange("assigned_bed")}
          rounded="rounded-2xl"
        />
      </div>

      <InputField
        label="Residence Address"
        value={formData.address}
        onChange={handleChange("address")}
        rounded="rounded-2xl"
      />

      <div className="flex gap-6 mt-4">
        <div className="flex-1">
          <InputField
            label="Doctor Email"
            type="email"
            value={formData.doctorEmail}
            onChange={handleChange("doctorEmail")}
            rounded="rounded-2xl"
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <InputField
            label="Nurse Email"
            type="email"
            value={formData.nurseEmails}
            onChange={handleChange("nurseEmails")}
            rounded="rounded-2xl"
            className="w-full"
          />
        </div>
        {/* <div className="flex-1"> */}
          {/* <label className="block text-gray-700 text-xs mb-1">
            Nurse Emails
          </label> */}
          {/* {formData.nurses.map((nurse, index) => (
            <InputField
              key={index}
              label={`Nurse Email`}
              type="email"
              value={nurse}
              onChange={(e) => handleNurseChange(index, e.target.value)}
              rounded="rounded-2xl"
              className="mb-2 w-full"
            />
          ))} */}
          {/* <Button
            onClick={addNurseField}
            bgColor="bg-green-500"
            width="w-40"
            className="mt-2"
          >
            + Add Nurse
          </Button> */}
        {/* </div> */}
      </div>

      <div className="flex justify-center gap-4">
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
