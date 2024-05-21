import React, { useState, useEffect } from "react";
import axios from "axios";
import "tailwindcss/tailwind.css"; // Assurez-vous que Tailwind CSS est correctement importé

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const hours = Array.from({ length: (16 - 8) * 2 + 1 }, (_, i) => 8 + i * 0.5); // de 8h à 16h, chaque 30 minutes

const getWeekDates = (start) => {
  let dates = [new Date(start)];
  for (let i = 1; i < 5; i++) {
    let nextDay = new Date(start);
    nextDay.setDate(nextDay.getDate() + i);
    dates.push(nextDay);
  }
  return dates;
};

const formatDateISO = (date) => {
  return date ? date.toISOString().substring(0, 10) : undefined; // Produit "YYYY-MM-DD" si date est définie
};

const roundToNearestHalfHour = (date) => {
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

const WeeklyScheduler = () => {
  const [weekStartDate, setWeekStartDate] = useState(new Date());
  const [orders, setOrders] = useState({});
  const [weekDates, setWeekDates] = useState([]);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [weeklyItems, setWeeklyItems] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [blockedDays, setBlockedDays] = useState({});
  const [blockedSlots, setBlockedSlots] = useState({});

  const fetchBlockedDays = async () => {
    try {
      const response = await axios.get(
        "https://bcd-backend-1ba2057cf6f6.herokuapp.com/blocked-dates"
      );
      const blocked = {};
      const blockedSlots = {};
      response.data.forEach((item) => {
        const date = formatDateISO(new Date(item.date));
        blocked[date] = item.dayBlocked;
        blockedSlots[date] = item.blockedTimes || [];
      });
      console.log("Blocked days fetched:", blocked);
      console.log("Blocked slots fetched:", blockedSlots);
      setBlockedDays(blocked);
      setBlockedSlots(blockedSlots);
    } catch (error) {
      console.error("Error fetching blocked days:", error);
    }
  };

  
  const toggleDayBlock = async () => {
    const formattedDate = formatDateISO(weekDates[selectedDay]);
    const isBlocked = blockedDays[formattedDate];
  
    try {
      if (isBlocked) {
        console.log(`Sending request to unblock date ${formattedDate}`);
        const response = await axios.delete(
          `https://bcd-backend-1ba2057cf6f6.herokuapp.com/blocked-dates/${formattedDate}`,
          {
            headers: { "Content-Type": "application/json" },
            data: {} // Ajoutez un objet vide pour spécifier le `Content-Type`
          }
        );
        console.log("Response from unblocking:", response.data);
        setBlockedDays((prev) => {
          const updated = { ...prev };
          delete updated[formattedDate];
          return updated;
        });
        setBlockedSlots((prev) => {
          const updated = { ...prev };
          delete updated[formattedDate];
          return updated;
        });
      } else {
        const slotsToBlock = hours.map(
          (hour) => `${Math.floor(hour)}:${hour % 1 === 0 ? "00" : "30"}`
        );
        console.log(`Sending request to block date ${formattedDate}`);
        const response = await axios.post(
          "https://bcd-backend-1ba2057cf6f6.herokuapp.com/blocked-dates",
          {
            date: formattedDate,
            blockedTimes: slotsToBlock,
            dayBlocked: true
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        console.log("Response from blocking:", response.data);
        setBlockedDays((prev) => ({
          ...prev,
          [formattedDate]: true,
        }));
        setBlockedSlots((prev) => ({
          ...prev,
          [formattedDate]: slotsToBlock,
        }));
      }
      fetchBlockedDays();
      setShowModal(false);
    } catch (error) {
      console.error(
        "Error toggling day block:",
        error.response ? error.response.data : error.message
      );
    }
  };
  

  const toggleSlotBlock = async () => {
    if (
      !selectedSlot ||
      selectedSlot.dayIndex === undefined ||
      !selectedSlot.slot
    ) {
      console.error("Selected slot or day index is not defined");
      return;
    }
  
    const formattedDate = formatDateISO(weekDates[selectedSlot.dayIndex]);
    const slot = selectedSlot.slot;
    const isBlockedSlot =
      blockedSlots[formattedDate] && blockedSlots[formattedDate].includes(slot);
  
    try {
      if (isBlockedSlot) {
        console.log(
          `Sending request to unblock slot ${slot} on date ${formattedDate}`
        );
        const response = await axios.delete(
          `https://bcd-backend-1ba2057cf6f6.herokuapp.com/blocked-dates/${formattedDate}`,
          {
            headers: { "Content-Type": "application/json" },
            data: { times: [slot] },
          }
        );
        console.log("Response from unblocking slot:", response.data);
  
        setBlockedSlots((prevState) => {
          const updatedSlots = { ...prevState };
          if (updatedSlots[formattedDate]) {
            updatedSlots[formattedDate] = updatedSlots[formattedDate].filter(
              (time) => time !== slot
            );
            if (updatedSlots[formattedDate].length === 0) {
              delete updatedSlots[formattedDate];
            }
          }
          return updatedSlots;
        });
      } else {
        console.log(
          `Sending request to block slot ${slot} on date ${formattedDate}`
        );
        const response = await axios.post(
          "https://bcd-backend-1ba2057cf6f6.herokuapp.com/blocked-dates",
          {
            date: formattedDate,
            blockedTimes: [slot],
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        console.log("Response from blocking slot:", response.data);
  
        setBlockedSlots((prevState) => {
          const updatedSlots = { ...prevState };
          if (updatedSlots[formattedDate]) {
            updatedSlots[formattedDate].push(slot);
          } else {
            updatedSlots[formattedDate] = [slot];
          }
          return updatedSlots;
        });
      }
  
      fetchBlockedDays();
      setShowSlotModal(false);
    } catch (error) {
      console.error(
        "Error toggling slot block:",
        error.response ? error.response.data : error.message
      );
    }
  };
  

  useEffect(() => {
    fetchBlockedDays(); // Assurez-vous que cette fonction est appelée au montage
  }, []);

  const handleDayClick = (index) => {
    setSelectedDay(index);
    setShowModal(true);
  };

  const handleSlotClick = (dayIndex, slot) => {
    setSelectedSlot({ dayIndex, slot });
    setShowSlotModal(true);
  };

  // Ajoutez cette fonction pour formater la date selon le format "28 mai 2024"
  const formatDateLong = (date) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(date).toLocaleDateString("fr-FR", options);
  };

  const Modal = () => {
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
  };

  const SlotModal = () => {
    if (!showSlotModal) return null;

    const date = weekDates[selectedSlot.dayIndex];
    const formattedDate = formatDateISO(date);
    const slot = selectedSlot.slot;
    const isBlockedSlot =
      blockedSlots[formattedDate] && blockedSlots[formattedDate].includes(slot);
    const formattedDateLong = formatDateLong(date);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 p-6 rounded-lg shadow-xl text-white w-full max-w-md">
          <h4 className="text-xl font-semibold mb-6 text-center">
            {isBlockedSlot ? "Débloquer" : "Bloquer"} le créneau de {slot} le{" "}
            {formattedDateLong} ?
          </h4>
          <div className="flex justify-between">
            <button
              onClick={toggleSlotBlock}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded transition duration-300 ease-in-out flex-grow"
            >
              Oui
            </button>
            <button
              onClick={() => setShowSlotModal(false)}
              className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded transition duration-300 ease-in-out flex-grow ml-4"
            >
              Non
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const monday = new Date(weekStartDate);
    monday.setDate(monday.getDate() - monday.getDay() + 1); // Ajuster au lundi de la semaine
    console.log("Calculated Monday:", monday);
    const dates = getWeekDates(monday);
    console.log("Week dates:", dates);
    setWeekDates(dates);
    if (dates.length > 0) {
      loadOrders(dates[0]);
    }
  }, [weekStartDate]);

  const loadOrders = async (startDate) => {
    const formattedDate = startDate.toISOString().substring(0, 10); // YYYY-MM-DD

    try {
      const response = await axios.get(
        `https://bcd-backend-1ba2057cf6f6.herokuapp.com/get-week-orders?start_date=${formattedDate}`
      );
      const weeklyOrders = {};
      let totalRevenue = 0;
      let totalItems = {};

      response.data.forEach((order) => {
        const orderDate = new Date(order.date);
        const day = days[orderDate.getUTCDay() - 1];
        const hourKey = roundToNearestHalfHour(orderDate);
        weeklyOrders[day] = weeklyOrders[day] || {};
        weeklyOrders[day][hourKey] = weeklyOrders[day][hourKey] || {
          city: order.items[0].city,
          items: [],
        };

        order.items.forEach((item) => {
          weeklyOrders[day][hourKey].items.push({
            name: item.name,
            quantity: item.quantity,
          });
          totalItems[item.name] = (totalItems[item.name] || 0) + item.quantity;
        });

        totalRevenue += order.cartTotal;
      });

      setOrders(weeklyOrders);
      setWeeklyTotal(totalRevenue);
      setWeeklyItems(totalItems);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handlePrevWeek = () => {
    setWeekStartDate(
      new Date(weekStartDate.setDate(weekStartDate.getDate() - 7))
    );
  };

  const handleNextWeek = () => {
    setWeekStartDate(
      new Date(weekStartDate.setDate(weekStartDate.getDate() + 7))
    );
  };

  const itemsOrder = [
    "Stère en 50 cm",
    "Stère en 33 cm",
    "Stère en 25 cm",
    "Stère de galettes",
    "Filet de bois d'allumage",
    "Filet de bûchettes",
  ];

  const getTotalItemsForDay = (day) => {
    const itemsOrder = [
      "Stère en 50 cm",
      "Stère en 33 cm",
      "Stère en 25 cm",
      "Stère de galettes",
      "Filet de bois d'allumage",
      "Filet de bûchettes",
    ];

    const totals = Object.entries(orders[day] || {}).reduce(
      (totals, [_, slot]) => {
        slot.items.forEach((item) => {
          totals[item.name] = (totals[item.name] || 0) + item.quantity;
        });
        return totals;
      },
      {}
    );

    return itemsOrder
      .filter((item) => totals[item])
      .map((item) => ({ name: item, quantity: totals[item] }))
      .concat(
        Object.entries(totals)
          .filter(([name]) => !itemsOrder.includes(name))
          .map(([name, quantity]) => ({ name, quantity }))
      );
  };

  const getTotalItems = (type) => {
    let totals;
    if (type === "weeklySteres") {
      totals = steresItems.reduce((totals, [name, quantity]) => {
        totals[name] = (totals[name] || 0) + quantity;
        return totals;
      }, {});
    } else {
      totals = Object.entries(weeklyItems).reduce(
        (totals, [name, quantity]) => {
          if (!name.includes("Stère")) {
            totals[name] = (totals[name] || 0) + quantity;
          }
          return totals;
        },
        {}
      );
    }

    return itemsOrder
      .filter((item) => totals[item])
      .map((item) => ({ name: item, quantity: totals[item] }))
      .concat(
        Object.entries(totals)
          .filter(([name]) => !itemsOrder.includes(name))
          .map(([name, quantity]) => ({ name, quantity }))
      );
  };

  const getSteresTotal = () => {
    const steresItems = Object.entries(weeklyItems).filter(([name]) =>
      name.includes("Stère")
    );
    const steresTotal = steresItems.reduce(
      (total, [, quantity]) => total + quantity,
      0
    );

    return { steresTotal, steresItems };
  };

  const { steresTotal, steresItems } = getSteresTotal();

  const formatWeekRange = (startDate) => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4);
    return `${formatDateLong(startDate)} au ${formatDateLong(endDate)}`;
  };

  

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto px-4 py-6 flex space-x-4">
        <div className="flex flex-col flex-grow">
          <div className="flex justify-between items-center mb-6">
            <Modal />
            <SlotModal />
            <button
              onClick={handlePrevWeek}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition duration-200"
            >
              Semaine Précédente
            </button>
            <h2 className="text-xl font-bold text-center">
              Semaine du {formatWeekRange(weekDates[0] || new Date())}
            </h2>
            <button
              onClick={handleNextWeek}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition duration-200"
            >
              Semaine Suivante
            </button>
          </div>
          <div className="flex w-full max-w-7xl mx-auto mt-10">
            {days.map((day, index) => (
              <div
                key={day}
                className="flex flex-col flex-grow border-r border-gray-500 last:border-r-0"
              >
                <h2
                  className={`text-lg font-bold p-2 text-center border-b border-gray-500 cursor-pointer ${
                    blockedDays[formatDateISO(weekDates[index])]
                      ? "bg-gray-700 text-gray-400"
                      : "bg-gray-700 text-white"
                  }`}
                  onClick={() => handleDayClick(index)}
                >
                  {`${day} ${
                    weekDates[index] ? formatDateLong(weekDates[index]) : ""
                  }`}
                </h2>

                <div
                  className={`flex-grow flex flex-col justify-between ${
                    blockedDays[formatDateISO(weekDates[index])]
                      ? "bg-gray-600"
                      : ""
                  }`}
                >
                  <div
                    className={`flex flex-col flex-grow divide-y divide-gray-600 ${
                      blockedDays[formatDateISO(weekDates[index])]
                        ? "divide-gray-700"
                        : ""
                    }`}
                    style={{ minHeight: "90vh" }}
                  >
                    {hours.map((hour, i) => {
                      const hourKey = `${Math.floor(hour)}:${
                        hour % 1 === 0 ? "00" : "30"
                      }`;
                      const tasks = orders[day] && orders[day][hourKey];
                      const isBlockedSlot =
                        blockedSlots[formatDateISO(weekDates[index])] &&
                        blockedSlots[formatDateISO(weekDates[index])].includes(
                          hourKey
                        );
                      return (
                        <div
                          key={i}
                          className={`flex items-start p-2 text-xs flex-grow ${
                            tasks
                              ? "bg-red-200"
                              : isBlockedSlot
                              ? "bg-gray-600 text-gray-400"
                              : "bg-green-200"
                          } hover:bg-opacity-75 cursor-pointer transition duration-200 ease-in-out`}
                          onClick={() => handleSlotClick(index, hourKey)}
                        >
                          <div className="w-16 font-semibold text-gray-900">
                            {hourKey}
                          </div>
                          <div className="flex flex-col flex-grow">
                            {tasks ? (
                              <>
                                <div className="text-gray-800 font-semibold">
                                  {tasks.city}
                                </div>
                                {tasks.items.map((item, index) => (
                                  <div key={index} className="text-gray-800">
                                    {item.name} - {item.quantity}
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="text-gray-400 flex-grow">
                                {isBlockedSlot ? "Bloqué" : "Libre"}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="bg-gray-700 p-4 mt-2 shadow-lg rounded-lg h-40 flex items-center justify-center"
                >
                  <div>
                    {getTotalItemsForDay(day).map((item, index) => (
                      <div
                        key={index}
                        className="text-gray-200"
                      >
                        <span className="font-semibold">{item.name} :</span>{" "}
                        {item.quantity}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-800 p-6 shadow-lg rounded-lg h-full flex-grow-0 flex-shrink-0 w-80">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Résumé de la semaine
          </h2>
          <div className="space-y-6">
            <div className="border-b border-gray-700 pb-4">
              <h3 className="text-xl font-semibold mb-2">Stères</h3>
              <div className="text-blue-400 font-semibold mb-2">
                Total des stères : {steresTotal}
              </div>
              {getTotalItems("weeklySteres").map((item, index) => (
                <div key={index} className="text-gray-300">
                  <span className="font-semibold">{item.name} :</span>{" "}
                  {item.quantity}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold mb-2">Autres</h3>
              {getTotalItems("weeklyOthers").map((item, index) => (
                <div key={index} className="text-gray-300">
                  <span className="font-semibold">{item.name} :</span>{" "}
                  {item.quantity}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 border-t border-gray-700 pt-4">
            <div className="text-red-400 font-semibold mb-2">
              Chiffre d'affaires estimé:
            </div>
            <div className="text-green-400 font-bold text-lg">
              {weeklyTotal.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduler;
