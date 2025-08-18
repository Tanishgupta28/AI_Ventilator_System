"use client";
import Clock from "./Clock";
import UserAvatar from "./UserAvatar";
import Text from "./Text";

export default function Title() {
  return (
    <header className="flex items-center justify-between px-6 py-1 bg-white shadow">
      <div className="flex items-center space-x-3">
        <UserAvatar image="/hospitalIcon.png" width={55} height={80} />
        <Text size="text-xl" bold color="text-gray-800">Reut Hospital Dashboard</Text>
      </div>
      <div className="flex items-center space-x-4">
        <Clock />
        <UserAvatar image="/kissan.png" width={50} height={50} />
      </div>
    </header>
  );
}
