import React, { memo } from 'react';
import { formatDateISO, formatDateLong } from './utils';

const Modal = memo(({ showModal, selectedDay, weekDates, toggleDayBlock, blockedDays, setShowModal }) => {
    if (!showModal) return null;

    const date = weekDates[selectedDay];
    const formattedDate = formatDateISO(date);
    const isBlocked = blockedDays[formattedDate];
    const formattedDateLong = formatDateLong(date);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 p-6 rounded-lg shadow-xl text-white w-full max-w-md">
                <h4 className="text-xl font-semibold mb-6 text-center">
                    {isBlocked ? "Débloquer" : "Bloquer"} le {formattedDateLong} ?
                </h4>
                <div className="flex justify-between">
                    <button
                        onClick={toggleDayBlock}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded transition duration-300 ease-in-out flex-grow"
                    >
                        Oui
                    </button>
                    <button
                        onClick={() => setShowModal(false)}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded transition duration-300 ease-in-out flex-grow ml-4"
                    >
                        Non
                    </button>
                </div>
            </div>
        </div>
    );
});

export default Modal;
