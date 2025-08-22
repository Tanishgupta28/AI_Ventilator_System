import Image from "next/image";

export default function MessageCard({ icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center w-72 h-72 bg-white rounded-2xl shadow-lg p-8 cursor-pointer hover:scale-105 hover:shadow-xl transition-transform duration-300">
      <div className="flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-4">
        <Image
          src={icon}
          alt={message}
          width={130}
          height={130}
          className="object-contain"
        />
      </div>
      <p className="text-center text-xl font-semibold text-gray-700">
        {message}
      </p>
    </div>
  );
}
