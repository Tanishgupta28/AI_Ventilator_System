import Image from "next/image";

export default function Box2({ text, bgColor, icon }) {
  return (
    <div
      className="w-80 h-40 rounded-2xl shadow-md p-4 flex flex-row items-center justify-center"
      style={{ backgroundColor: bgColor || "#ddd" }}
    >
      {icon && (
        <Image
          src={icon}
          alt={text}
          width={60}
          height={60}
          className="mr-3"
        />
      )}
      <p className="text-white font-bold text-2xl">{text}</p>
    </div>
  );
}
