"use client";
import Image from "next/image";
import UserAvatar from "@/components/UserAvatar";

export default function Profile({
  image = "/kissan.png",
  icon = "/questionMark.png",
  name = "N/A",
  age = "N/A",
  bed = "N/A",
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm w-200">
      <div className="flex items-center space-x-3">
        <UserAvatar image={image || "/kissan.png"} width={50} height={50} />
        <div>
          <p className="text-sm font-semibold text-gray-900">{name || "N/A"}</p>
          <p className="text-xs text-gray-600">
            Age: {age || "N/A"} &nbsp; Bed: {bed || "N/A"}
          </p>
        </div>
      </div>
      <Image
        src={icon || "/questionMark.png"}
        alt="Status Icon"
        width={30}
        height={30}
        className="ml-3"
      />
    </div>
  );
}
