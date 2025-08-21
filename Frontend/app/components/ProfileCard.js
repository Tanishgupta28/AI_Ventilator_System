"use client";

import Image from "next/image";

export default function ProfileCard({ imgSrc, name="Unknown", role="Unknown" }) {
  return (
    <div className="flex items-center gap-2 border rounded-lg px-3 py-2 shadow-sm bg-white w-full">
      <Image
        src={imgSrc || "/kissan.png"}
        alt={name}
        width={35}
        height={35}
        className="rounded-full object-cover"
      />
      <div className="flex flex-col leading-tight">
        <span className="font-semibold text-sm">{name}</span>
        <span className="text-xs text-gray-600">{role}</span>
      </div>
    </div>
  );
}
