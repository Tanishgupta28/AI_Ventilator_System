import Box1 from "./Box1";
import Box2 from "./Box2";

export default function Dashboard2() {
  return (
    <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-6">
      {/* First 4 boxes */}
      <Box1
        text="Box 1"
        color="#1E3A8A"
        borderColor="#2563EB"
        icon="/img1.png"
      />
      <Box1
        text="Box 2"
        color="#065F46"
        borderColor="#10B981"
        icon="/img2.png"
      />
      <Box1
        text="Box 3"
        color="#78350F"
        borderColor="#F59E0B"
        icon="/img3.png"
      />
      <Box1
        text="Box 4"
        color="#7C2D12"
        borderColor="#F87171"
        icon="/img4.png"
      />

      {/* Yes / No Boxes */}
      <Box2 text="YES" bgColor="green" icon="/yes.png" />
      <Box2 text="NO" bgColor="red" icon="/no.png" />
    </div>
  );
}
