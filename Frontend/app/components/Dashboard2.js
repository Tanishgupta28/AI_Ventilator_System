import Box1 from "./Box1";
import Box2 from "./Box2";

export default function Dashboard2() {
  return (
    <div className="grid grid-cols-2 gap-x-80 gap-y-4 w-full max-w-md mx-auto">
      <Box1
        text="Change my position"
        borderColor="#25eb8fff"
        icon="/accessibility.png"
        alert="yellow"
      />
      <Box1
        text="Tube is choking me"
        borderColor="#9710b9ff"
        icon="/ventilator.png"
        alert="yellow"
      />
      <Box1
        text="I am shivering"
        borderColor="#360bf5ff"
        icon="/device_thermostat.png"
        alert="yellow"
      />
      <Box1
        text="I am in pain"
        borderColor="#f87171ff"
        icon="/emergency.png"
        alert="red"
      />
      <Box2 text="YES" bgColor="green" icon="/thumb_up.png" />
      <Box2 text="NO" bgColor="red" icon="/thumb_down.png" />
    </div>
  );
}
