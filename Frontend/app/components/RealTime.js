"use client";
import Image from "next/image";
import { LineChart, Line, Area, ResponsiveContainer } from "recharts";

export default function RealTime({
  label1 = "Oxygen",
  label2 = "Saturation",
  value = "98%",
  icon = "/OxygenSaturation.png",
  data = [95, 96, 97, 98, 97, 99, 98],
  graphColor = "#eb7425",   // NEW PROP
  iconBg = "bg-orange-100", // NEW PROP (Tailwind class)
}) {
  let status = "";
  let statusColor = "";

  const numericValue = parseInt(value);

  if (!isNaN(numericValue)) {
    if (numericValue >= 95 && numericValue <= 100) {
      status = "Normal";
      statusColor = "bg-orange-100 text-black-700";
    } else if (numericValue < 95) {
      status = "Low";
      statusColor = "bg-red-100 text-black-700";
    } else {
      status = "High";
      statusColor = "bg-yellow-100 text-black-700";
    }
  }

  const chartData = data.map((d, i) => ({ time: i, value: d }));

  return (
    <div className="w-[200px] h-[220px] bg-white rounded-2xl shadow-lg p-4 flex flex-col justify-between border border-gray-200">
      <div className="flex items-start gap-6">
        <div className="flex flex-col items-center">
          {/* ICON WITH CUSTOM BG */}
          <div className={`flex items-center justify-center w-14 h-14 ${iconBg} rounded-full`}>
            <Image src={icon} alt="Icon" width={35} height={35} />
          </div>
          <p className="text-xl font-bold text-gray-900 mt-2">{value}</p>
          {status && (
            <span
              className={`mt-1 px-2 py-0.5 rounded-md text-xs font-bold ${statusColor}`}
            >
              {status}
            </span>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-lg font-semibold text-gray-700">{label1}</p>
          <p className="text-lg font-semibold text-gray-700 -mt-1">{label2}</p>
        </div>
      </div>

      {/* CHART WITH CUSTOM COLOR */}
      <div className="h-28 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id={`colorGradient-${graphColor}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={graphColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={graphColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill={`url(#colorGradient-${graphColor})`}
              fillOpacity={0.4}
              activeDot={false}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke={graphColor}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
