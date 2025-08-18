"use client";
import Image from "next/image";

export default function Box({
  name = "Unknown",
  age = 0,
  bed = "N/A",
  image = "/hospitalIcon.png",
  alert = "/questionMark.png",
  bgColor = "bg-red-500",
}) {
  return (
    <div
      className={`relative ${bgColor} text-white rounded-xl p-4 w-48 shadow-lg flex flex-col items-center`}
    >
      <div className="absolute top-2 right-2">
        <Image src={alert} alt="Alert" width={20} height={20} />
      </div>

      <Image
        src={image}
        alt="User Avatar"
        width={60}
        height={60}
        className="rounded-full border-2 border-white"
      />

      <h3 className="mt-2 text-md font-bold">{name}</h3>

      <div className="flex justify-center space-x-2 text-sm">
        <p>Age: {age}</p>
        <p>Bed: {bed}</p>
      </div>
    </div>
  );
}
