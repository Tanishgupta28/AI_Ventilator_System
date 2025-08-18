"use client";
import Clock from "./Clock";
import UserAvatar from "./UserAvatar";

export default function Title() {
  return (
    <header className="flex items-center justify-between px-6 py-1 bg-white shadow">
      <div className="flex items-center space-x-3">
        <UserAvatar image="/hospitalIcon.png" width={55} height={80} />
        <h1 className="text-xl font-bold">Reut Hospital Dashboard</h1>
      </div>
      <div className="flex items-center space-x-4">
        <Clock />
        <UserAvatar image="/kissan.png" width={50} height={50} />
      </div>
    </header>
  );
}
