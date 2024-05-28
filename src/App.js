import React, { useState } from "react";
import "./index.css";
import SweepingWeeklyScheduler from "./components/SweepingWeeklyScheduler/SweepingWeeklyScheduler";
import WeeklyScheduler from "./components/WeeklyScheduler/WeeklyScheduler";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [selectedScheduler, setSelectedScheduler] = useState('weekly');

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-52 bg-gray-800 text-white flex flex-col">
        <div className="px-4 py-4 text-2xl font-semibold">
          Dashboard
        </div>
        <nav className="flex-1">
          <button 
            className={`w-full text-left px-4 py-3 hover:bg-gray-700 ${selectedScheduler === 'weekly' ? 'bg-gray-700' : ''}`}
            onClick={() => setSelectedScheduler('weekly')}
          >
            Planning Livraisons
          </button>
          <button 
            className={`w-full text-left px-4 py-3 hover:bg-gray-700 ${selectedScheduler === 'sweeping' ? 'bg-gray-700' : ''}`}
            onClick={() => setSelectedScheduler('sweeping')}
          >
            Planning Ramonages
          </button>
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          toastClassName="relative flex p-1 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer"
          bodyClassName="text-sm font-white font-med block p-3"
          className="toast-container"
        />
        {selectedScheduler === 'weekly' && <WeeklyScheduler />}
        {selectedScheduler === 'sweeping' && <SweepingWeeklyScheduler />}
      </div>
    </div>
  );
}

export default App;
