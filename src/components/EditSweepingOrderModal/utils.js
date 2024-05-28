import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export const formatDateForInput = (date) => {
    return date ? format(toZonedTime(new Date(date), 'Europe/Paris'), 'dd/MM/yyyy', { locale: fr }) : '';
};

export const formatTimeForInput = (date) => {
    return date ? format(toZonedTime(new Date(date), 'Europe/Paris'), 'HH:mm') : '';
};

export const parseDateTime = (date, time) => {
    const dateTimeString = `${date} ${time}`;
    const parisTime = parse(dateTimeString, 'dd/MM/yyyy HH:mm', new Date());
    return fromZonedTime(parisTime, 'Europe/Paris');
};

export const calculateTotal = (cartItems, deliveryFee, discount) => {
    const itemsTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return itemsTotal + parseFloat(deliveryFee || 0) - parseFloat(discount || 0);
};

export const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 16; hour++) {
        slots.push(`${hour < 10 ? '0' : ''}${hour}:00`);
        if (hour < 16) {
            slots.push(`${hour < 10 ? '0' : ''}${hour}:30`);
        }
    }
    return slots;
};
