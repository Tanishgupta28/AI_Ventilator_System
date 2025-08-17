import Image from "next/image";

export default function UserAvatar({image}) {
  return (
    <div className="flex items-center space-x-3">
      <Image
        src={image}
        alt="User Avatar"
        width={50}
        height={50}
        className="rounded-full border-2 border-gray-300"
      />
      <span className="font-semibold">John Doe</span>
    </div>
  );
}
