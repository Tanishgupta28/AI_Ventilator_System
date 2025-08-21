import Text from "./Text";

export default function Directive({ color, message, patientName, bed, time }) {
  return (
    <div className="bg-gray-800 p-4 mb-3 rounded-xl shadow-md flex items-start gap-3">
      <span
        className={`w-3 h-3 rounded-full mt-1`}
        style={{ backgroundColor: color }}
      ></span>

      <div className="flex flex-col">
        <Text bold size="text-sm" color="text-white">Patient Alert</Text>
        <Text size="text-xs" color="text-white">{message}</Text>
        <Text size="text-xs" color="text-white">Patient: {patientName}</Text>
        <Text size="text-xs" color="text-white">Bed: {bed}</Text>
        <Text size="text-xs" color="text-white">{time}</Text>
      </div>
    </div>
  );
}
