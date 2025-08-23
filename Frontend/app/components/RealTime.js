import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export default function RealTime({ label1, label2, value, icon, data, graphColor, iconBg }) {
  const [chartData, setChartData] = useState(data.map((y, i) => ({ x: i, y })));

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prev) => {
        const lastY = prev[prev.length - 1].y;
        const nextValue = lastY + (Math.sin(Date.now() / 500) * 5) + (Math.random() * 4 - 2);

        return [
          ...prev.slice(1),
          { x: prev[prev.length - 1].x + 1, y: Math.max(40, Math.min(160, nextValue)) }
        ];
      });
    }, 800); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-4 rounded-2xl shadow-md">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-3 rounded-full ${iconBg}`}>
          <img src={icon} alt={label1} className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-700">{label1} {label2}</h3>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="y" stroke={graphColor} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
