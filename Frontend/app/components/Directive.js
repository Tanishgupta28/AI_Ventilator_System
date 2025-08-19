import Text from "./Text";

export default function Directive({ color, message, patientId, bed, time }) {
  return (
    <div className="bg-gray-800 p-4 mb-3 rounded-xl shadow-md flex items-start gap-3">
      <span
        className={`w-3 h-3 rounded-full mt-1`}
        style={{ backgroundColor: color }}
      ></span>

      <div className="flex flex-col">
        <Text bold size="text-sm">Patient Alert</Text>
        <Text size="text-xs" color="text-gray-300">{message}</Text>
        <Text size="text-xs" color="text-gray-400">Patient: {patientId} | Bed: {bed}</Text>
        <Text size="text-xs" color="text-gray-500">{time}</Text>
      </div>
    </div>
  );
}
