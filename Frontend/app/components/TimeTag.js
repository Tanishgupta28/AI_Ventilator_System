"use client";

export default function TimeTag({ label, time }) {
  return (
    <div className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2 shadow-sm bg-white w-full">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm font-bold">{time}</span>
    </div>
  );
}
