import { useState } from "react";

function Member({ members = [], onSubmit }) {
  const [items, setItems] = useState(members);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");

  const handleAddClick = () => setIsAdding(true);

  const handleSubmit = () => {
    if (!newName || !newRole) return;
    const newItem = { name: newName, role: newRole };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onSubmit && onSubmit(newItem);

    setNewName("");
    setNewRole("");
    setIsAdding(false);
  };

  return (
    <div className="w-[800px] shadow-lg rounded-2xl p-6 flex flex-col items-center bg-gradient-to-b from-blue-50 to-blue-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Team Members</h2>

      {/* Scrollable List */}
      <div className="flex flex-col gap-3 max-h-48 overflow-y-auto w-full pr-2 no-scrollbar pb-8">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            <span className="text-sm font-medium text-gray-700">{item.name}</span>
            <span className="text-sm font-semibold text-blue-700 border border-blue-300 bg-blue-50 rounded-md px-3 py-1">
              {item.role}
            </span>
          </div>
        ))}

        {isAdding && (
          <div className="flex gap-2 items-center px-4 py-3 rounded-xl border border-blue-300 bg-white shadow-sm">
            <input
              type="text"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="outline-none text-sm flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              placeholder="Role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="outline-none text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
            />
          </div>
        )}
      </div>

      {/* Floating Button */}
      {!isAdding ? (
        <button
          onClick={handleAddClick}
          className="mt-5 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center text-2xl shadow-md transition-all duration-200"
        >
          +
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          className="mt-5 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-md transition-all duration-200"
        >
          Submit
        </button>
      )}
    </div>
  );
}

export default Member;
