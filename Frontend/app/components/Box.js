"use client";
import Image from "next/image";

export default function PatientBox({
  name = "Unknown",
  age = 0,
  bed = "N/A",
  image = "/hospitalIcon.png",
  alert = "/questionMark.png",
  bgColor = "bg-red-500",
}) {
  return (
    <div
      className={`relative ${bgColor} text-white rounded-xl p-4 w-48 shadow-lg`}
    >
      <div className="flex items-center space-x-4">
        <Image
          src={image}
          alt="User Avatar"
          width={40}
          height={40}
          className="rounded-full"
        />
        <button className="relative">
          <Image src={alert} alt="Alert" width={24} height={24} />
        </button>
      </div>

      <div className="text-center mt-2">
        <h3 className="text-md font-bold">{name}</h3>
        <div className="flex text-md">
          <p className="text-sm">Age: {age}</p>
          <p className="text-sm">Bed: {bed}</p>
        </div>
      </div>
    </div>
  );
}
