"use client";
import Image from "next/image";
import UserAvatar from "@/components/UserAvatar";
import { calculateAge } from "@/lib/dob";
import Text from "@/components/Text";

export default function Profile({
  image = "/kissan.png",
  icon = "/questionMark.png",
  name = "N/A",
  age = "N/A",
  bed = "N/A",
  bool=true,
  width=900,
  iw=60,
}) {
  return (
    <div className={`flex items-center justify-between p-3 bg-white rounded-lg w-[${width}px]`}>
      <div className="flex items-center space-x-3">
        <UserAvatar image={image || "/kissan.png"} width={iw} height={iw} />
        <div>
          <Text size="text-2xl" bold>
            {name || "N/A"}
          </Text>
          <Text size="text-m" bold>
            Age: {calculateAge(age) || "N/A"} &nbsp; Bed: {bed || "N/A"}
          </Text>
        </div>
      </div>
      {bool && (
        <Image
          src={icon?.alertImage || "/questionMark.png"}
          alt="Status Icon"
          width={40}
          height={30}
          className="ml-3"
        />
      )}
    </div>
  );
}
