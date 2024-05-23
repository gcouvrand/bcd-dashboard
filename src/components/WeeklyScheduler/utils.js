import axios from 'axios';

export const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
export const hours = Array.from({ length: (16 - 8) * 2 + 1 }, (_, i) => 8 + i * 0.5);

export const getWeekDates = (start) => {
    let dates = [new Date(start)];
    for (let i = 1; i < 5; i++) {
        let nextDay = new Date(start);
        nextDay.setDate(nextDay.getDate() + i);
        dates.push(nextDay);
    }
    return dates;
};

export const formatDateISO = (date) => {
    return date ? date.toISOString().substring(0, 10) : undefined;
};

export const formatDateLong = (date) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(date).toLocaleDateString("fr-FR", options);
};

export const formatName = (name) => {
    return name
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
};

export const roundToNearestHalfHour = (date) => {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    if (minutes < 15) {
        return `${hours}:00`;
    } else if (minutes < 45) {
        return `${hours}:30`;
    } else {
        return `${hours + 1}:00`;
    }
};

export const fetchBlockedDays = async () => {
    try {
        const response = await axios.get("https://bcd-backend-1ba2057cf6f6.herokuapp.com/blocked-dates");
        const blocked = {};
        const blockedSlots = {};
        response.data.forEach((item) => {
            const date = formatDateISO(new Date(item.date));
            blocked[date] = item.dayBlocked;
            blockedSlots[date] = item.blockedTimes || [];
        });
        return { blocked, blockedSlots };
    } catch (error) {
        console.error("Error fetching blocked days:", error);
        throw error;
    }
};
