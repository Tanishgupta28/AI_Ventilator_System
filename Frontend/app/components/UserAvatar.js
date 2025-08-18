import Image from "next/image";

export default function UserAvatar({image,width,height}) {
  return (
    <div>
      <Image
        src={image}
        alt="User Avatar"
        width={width}
        height={height}
        className="rounded-full"
      />
    </div>
  );
}
