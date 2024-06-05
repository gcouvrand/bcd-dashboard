import React, { memo } from 'react';
import { formatDateISO, formatDateLong, days } from './utils';

const SlotModal = memo(({
    showSlotModal,
    selectedSlot,
    weekDates,
    toggleSlotBlock,
    blockedSlots,
    setShowSlotModal,
    handleEditOrder,
    handleAddOrder,
    handleDeleteOrder,
    orders,
}) => {
    if (!showSlotModal) return null;

    const date = weekDates[selectedSlot.dayIndex];
    const formattedDate = formatDateISO(date);
    const slot = selectedSlot.slot;
    const isBlockedSlot = blockedSlots[formattedDate] && blockedSlots[formattedDate].includes(slot);
    const tasks = orders[days[selectedSlot.dayIndex]] && orders[days[selectedSlot.dayIndex]][slot];
    const formattedDateLong = formatDateLong(date);

    // Filtrer la commande spécifique basée sur orderId
    const selectedOrder = tasks?.find(task => task._id === selectedSlot.orderId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 p-6 rounded-lg shadow-xl text-white w-full max-w-md">
                <h4 className="text-xl font-semibold mb-6 text-center">
                    Actions pour le créneau de {slot} le {formattedDateLong}
                </h4>
                <div className="flex flex-col space-y-4">
                    {selectedOrder ? (
                        <div className="space-y-4">
                            <button
                                onClick={() => {
                                    setShowSlotModal(false);
                                    handleEditOrder(selectedOrder);
                                }}
                                className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out w-full"
                            >
                                Modifier
                            </button>
                            <button
                                onClick={() => handleDeleteOrder(days[selectedSlot.dayIndex], slot, selectedOrder._id)}
                                className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out w-full"
                            >
                                Supprimer
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <button
                                onClick={toggleSlotBlock}
                                className={`bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out w-full ${
                                    isBlockedSlot ? "bg-red-600 hover:bg-red-500" : ""
                                }`}
                            >
                                {isBlockedSlot ? "Débloquer" : "Bloquer"}
                            </button>
                            <button
                                onClick={() => {
                                    setShowSlotModal(false);
                                    handleAddOrder();
                                }}
                                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out w-full"
                            >
                                Ajouter
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => setShowSlotModal(false)}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out w-full"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
});

export default SlotModal;
