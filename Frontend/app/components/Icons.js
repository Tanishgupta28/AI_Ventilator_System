"use client";
import Image from "next/image";

export default function IconBox({
  label = "Icon",
  image = "",
  bgColor = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p - 3 rounded-xl shadow-md cursor-pointer hover:scale-105 transition-transform ${bgColor}`}
    >

      <Image src={image} alt={label} width={33} height={33} />

      <p className="mt- 1 text - center text-sm font-medium text-gray-700" leading-tight>{label}</p>
    </div>
  );
}
