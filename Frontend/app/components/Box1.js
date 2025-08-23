import Image from "next/image";

export default function Box1({ text, color, icon, borderColor }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl shadow-md p-6 w-36 h-36"
      style={{
        backgroundColor: color || "#f0f0f0",
        border: `3px solid ${borderColor || "#000"}`,
      }}
    >
      {icon && (
        <Image
          src={icon}
          alt={text}
          width={40}
          height={40}
          className="mb-1"
        />
      )}
      <p className="text-white font-semibold text-center text-sm">{text}</p>
    </div>
  );
}
