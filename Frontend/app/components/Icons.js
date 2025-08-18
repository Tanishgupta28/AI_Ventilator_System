"use client";
import Image from "next/image";

export default function IconBox({
  label = "Icon",
  image = "",
  bgColor = "bg-blue-100",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center w-24 h-24 rounded-xl shadow-md cursor-pointer hover:scale-105 transition-transform ${bgColor}`}
    >

      <Image src={image} alt="" width={40} height={40} />

      <p className="mt-2 text-sm font-medium text-gray-700">{label}</p>
    </div>
  );
}
