import React, { useState, useEffect, forwardRef } from "react";
import ProductListModal from "./ProductListModal";
import axios from 'axios';
import { toast } from 'react-toastify';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO, isValid, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    formatDateForInput,
    formatTimeForInput,
    parseDateTime,
    calculateTotal,
    generateTimeSlots
} from './utils';

// Enregistrer la localisation française
registerLocale('fr', fr);

const EditSweepingOrderModal = ({ order, onClose, onSave }) => {
    const [editedOrder, setEditedOrder] = useState({
        date: '',
        time: '',
        deliveryFee: '',
        discount: '',
        cartItems: [],
        userInfo: {
            nom: '',
            prenom: '',
            adresse: '',
            codePostal: '',
            ville: '',
            email: '',
            telephone: ''
        }
    });

    const [isProductListModalOpen, setIsProductListModalOpen] = useState(false);

    useEffect(() => {
        if (order) {
            const formattedDate = order.date ? parseISO(order.date) : null;
            setEditedOrder({
                date: formattedDate,
                time: formatTimeForInput(order.date),
                deliveryFee: order.deliveryFee !== undefined ? order.deliveryFee : '',
                discount: order.discount !== undefined ? order.discount : '',
                cartItems: order.cartItems || [],
                userInfo: {
                    nom: order.userInfo.nom || '',
                    prenom: order.userInfo.prenom || '',
                    adresse: order.userInfo.adresse || '',
                    codePostal: order.userInfo.codePostal || '',
                    ville: order.userInfo.ville || '',
                    email: order.userInfo.email || '',
                    telephone: order.userInfo.telephone || ''
                }
            });
        }
    }, [order]);

    const handleInputChange = (e, field) => {
        setEditedOrder({ ...editedOrder, [field]: e.target.value });
    };

    const handleUserInfoChange = (e, field) => {
        setEditedOrder({
            ...editedOrder,
            userInfo: { ...editedOrder.userInfo, [field]: e.target.value }
        });
    };

    const handleQuantityChange = (index, increment) => {
        const updatedItems = [...editedOrder.cartItems];
        const newQuantity = updatedItems[index].quantity + increment;
        if (newQuantity >= 0) {
            updatedItems[index] = {
                ...updatedItems[index],
                quantity: newQuantity
            };
            setEditedOrder({ ...editedOrder, cartItems: updatedItems });
        }
    };

    const handleRemoveItem = (index) => {
        const updatedItems = editedOrder.cartItems.filter((_, i) => i !== index);
        setEditedOrder({ ...editedOrder, cartItems: updatedItems });
    };

    const handleAddItem = (item) => {
        const newItem = { ...item, quantity: 1 };
        delete newItem.id;
        setEditedOrder({ ...editedOrder, cartItems: [...editedOrder.cartItems, newItem] });
        setIsProductListModalOpen(false);
    };

    const handleDateChange = (date) => {
        setEditedOrder({ ...editedOrder, date });
    };

    const handleTimeChange = (e) => {
        setEditedOrder({ ...editedOrder, time: e.target.value });
    };

    const handleSave = async () => {
        if (!order || !order._id) {
            toast.error("L'ID de la commande est manquant.", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                className: 'bg-red-600 text-white',
                progressClassName: 'bg-red-300'
            });
            return;
        }

        const isValidDate = isValid(editedOrder.date);
        const isValidTime = editedOrder.time && editedOrder.time.match(/^([01]\d|2[0-3]):([0-5]\d)$/);

        if (!isValidDate || !isValidTime) {
            toast.error("Date ou heure invalide.", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                className: 'bg-red-600 text-white',
                progressClassName: 'bg-red-300'
            });
            return;
        }

        const combinedDateTimeString = `${format(editedOrder.date, 'yyyy-MM-dd')}T${editedOrder.time}:00`;
        const utcDate = new Date(combinedDateTimeString);

        if (!isValid(utcDate)) {
            toast.error("Erreur lors de la conversion de la date et de l'heure.", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                className: 'bg-red-600 text-white',
                progressClassName: 'bg-red-300'
            });
            return;
        }

        const formattedOrder = {
            ...editedOrder,
            deliverySlot: {
                date: utcDate.toISOString()
            },
            cartItems: editedOrder.cartItems.map(({ id, city, ...rest }) => rest),
            deliveryFee: parseFloat(editedOrder.deliveryFee) || 0,
            discount: parseFloat(editedOrder.discount) || 0,
            cartTotal: calculateTotal(editedOrder.cartItems, editedOrder.deliveryFee, editedOrder.discount)
        };

        try {
            const response = await axios.put(`https://bcd-backend-1ba2057cf6f6.herokuapp.com/ramonages/${order._id}`, formattedOrder);
            if (response.status === 200) {
                toast.success("La commande a été mise à jour avec succès!", {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    className: 'bg-green-600 text-white',
                    progressClassName: 'bg-green-300'
                });
                onSave();
                window.location.reload(); // Rafraîchit la page après la modification
            } else {
                toast.error("Une erreur est survenue lors de la mise à jour de la commande.", {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    className: 'bg-red-600 text-white',
                    progressClassName: 'bg-red-300'
                });
            }
        } catch (error) {
            toast.error("Erreur de connexion avec le serveur!", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                className: 'bg-red-600 text-white',
                progressClassName: 'bg-red-300'
            });
            console.error("Error updating order:", error);
        }
    };

    const CustomInput = forwardRef(({ value, onClick }, ref) => (
        <input 
            type="text" 
            value={value} 
            onClick={onClick} 
            ref={ref} 
            className="w-full p-2 bg-gray-800 text-white rounded"
            readOnly
        />
    ));

    if (!order) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-auto">
            <div className="bg-gray-900 p-6 rounded-lg shadow-xl text-white w-full max-w-4xl m-8 space-y-4">
                <h4 className="text-2xl font-bold mb-6 text-center">Modifier la commande</h4>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h5 className="text-lg font-semibold">Informations du client</h5>
                        <div className="space-y-2">
                            {['nom', 'prenom', 'adresse', 'codePostal', 'ville', 'email', 'telephone'].map((field) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-gray-300 capitalize">{field}</label>
                                    <input
                                        type="text"
                                        value={editedOrder.userInfo[field]}
                                        onChange={(e) => handleUserInfoChange(e, field)}
                                        className="w-full p-2 bg-gray-800 text-white rounded"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h5 className="text-lg font-semibold">Articles</h5>
                        <div className="space-y-4">
                            {editedOrder.cartItems.map((item, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={item.name}
                                        readOnly
                                        className="w-3/5 p-2 bg-gray-800 text-white rounded"
                                    />
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleQuantityChange(index, -1)}
                                            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded transition duration-300 ease-in-out"
                                        >
                                            -
                                        </button>
                                        <span className="text-white">{item.quantity}</span>
                                        <button
                                            onClick={() => handleQuantityChange(index, 1)}
                                            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded transition duration-300 ease-in-out"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(index)}
                                        className="bg-red-700 hover:bg-red-600 text-white font-bold py-1 px-3 rounded transition duration-300 ease-in-out ml-2"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setIsProductListModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out flex items-center justify-center"
                            >
                                <span className="mr-2">+</span> Ajouter un article
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                    <h5 className="text-lg font-semibold">Détails de la commande</h5>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Date de livraison</label>
                            <DatePicker
                                selected={editedOrder.date}
                                onChange={handleDateChange}
                                dateFormat="dd/MM/yyyy"
                                className="w-full p-2 bg-gray-800 text-white rounded"
                                popperClassName="react-datepicker-popper"
                                calendarClassName="react-datepicker"
                                locale="fr"
                                filterDate={date => getDay(date) !== 0 && getDay(date) !== 6}
                                customInput={<CustomInput />}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Heure de livraison</label>
                            <select
                                value={editedOrder.time}
                                onChange={handleTimeChange}
                                className="w-full p-2 bg-gray-800 text-white rounded"
                            >
                                {generateTimeSlots().map((slot) => (
                                    <option key={slot} value={slot}>
                                        {slot}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Frais de livraison</label>
                            <input
                                type="number"
                                value={editedOrder.deliveryFee}
                                onChange={(e) => handleInputChange(e, 'deliveryFee')}
                                className="w-full p-2 bg-gray-800 text-white rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Remise</label>
                            <input
                                type="number"
                                value={editedOrder.discount}
                                onChange={(e) => handleInputChange(e, 'discount')}
                                className="w-full p-2 bg-gray-800 text-white rounded"
                            />
                        </div>
                        <div>
                            <h5 className="text-lg font-semibold">Total de la commande</h5>
                            <div className="w-full p-2 bg-gray-800 text-white rounded">
                                {calculateTotal(editedOrder.cartItems, editedOrder.deliveryFee, editedOrder.discount).toFixed(2)} €
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={handleSave}
                            className="bg-green-700 hover:bg-green-600 text-white font-bold py-3 px-6 rounded transition duration-300 ease-in-out flex-grow"
                        >
                            Valider
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded transition duration-300 ease-in-out flex-grow ml-4"
                        >
                            Annuler
                        </button>
                    </div>
                </div>

                {isProductListModalOpen && (
                    <ProductListModal
                        onClose={() => setIsProductListModalOpen(false)}
                        onAdd={handleAddItem}
                    />
                )}
            </div>
        </div>
    );
};

export default EditSweepingOrderModal;
