import { useState } from "react";

function Medication ({ schedules = [], onSubmit }) {
  const [items, setItems] = useState(schedules);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newTime, setNewTime] = useState("");

  const handleAddClick = () => {
    setIsAdding(true);
  };

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
    <div className="w-[350px] bg-gradient-to-b from-green-50 to-green-100 shadow-md rounded-xl p-4 flex flex-col items-center">
      <h2 className="text-lg font-semibold mb-3">Add Schedule</h2>
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto w-full pr-2 no-scrollbar">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center px-3 py-2 rounded-lg border border-gray-300 bg-white"
          >
            <span className="text-sm font-medium">{item.label}</span>
            <span className="text-sm font-semibold text-gray-700 border border-red-300 rounded-md px-2 py-1">
              {item.time}
            </span>
          </div>
        ))}
        {isAdding && (
          <div className="flex justify-between items-center px-3 py-2 rounded-lg border border-blue-300 bg-white">
            <input
              type="text"
              placeholder="Label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="outline-none text-sm flex-1 mr-2"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="outline-none text-sm border border-gray-300 rounded-md px-2 py-1"
            />
          </div>
        )}
      </div>
      {!isAdding ? (
        <button
          onClick={handleAddClick}
          className="mt-4 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-2xl"
        >
          +
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          className="mt-4 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium"
        >
          Submit
        </button>
      )}
    </div>
  );
}

export default Medication;
