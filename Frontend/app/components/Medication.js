import { useState } from "react";

function Medication({ schedules = [], onSubmit }) {
  const [items, setItems] = useState(schedules);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newTime, setNewTime] = useState("");

  const handleAddClick = () => setIsAdding(true);

  const handleSubmit = () => {
    if (!newLabel || !newTime) return;
    const newItem = { label: newLabel, time: newTime };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onSubmit && onSubmit(newItem);

    setNewLabel("");
    setNewTime("");
    setIsAdding(false);
  };

  return (
    <div className="w-[800px] shadow-lg rounded-2xl p-6 flex flex-col items-center">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Medication Schedule
      </h2>
      <div className="flex flex-col gap-3 max-h-48 overflow-y-auto w-full pr-2 no-scrollbar pb-8">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            <span className="text-sm font-medium text-gray-700">
              {item.label}
            </span>
            <span className="text-sm font-semibold text-green-700 border border-green-300 bg-green-50 rounded-md px-3 py-1">
              {item.time}
            </span>
          </div>
        ))}
        {isAdding && (
          <div className="flex gap-2 items-center px-4 py-3 rounded-xl border border-blue-300 bg-white shadow-sm">
            <input
              type="text"
              placeholder="Label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="outline-none text-sm flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="outline-none text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
            />
          </div>
        )}
      </div>
      {!isAdding ? (
        <button
          onClick={handleAddClick}
          className="mt-5 w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center text-2xl shadow-md transition-all duration-200"
        >
          +
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          className="mt-5 px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium shadow-md transition-all duration-200"
        >
          Submit
        </button>
      )}
    </div>
  );
}

export default Medication;
