import React, { useState, useEffect, Fragment } from "react";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { EnvelopeIcon, PhoneIcon, MapPinIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

dayjs.locale("fr");
dayjs.extend(localizedFormat);

const formatName = (name) => {
  return name.toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase());
};

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [completedSweepings, setCompletedSweepings] = useState([]);
  const [completedSales, setCompletedSales] = useState([]);
  const [ramonages, setRamonages] = useState([]);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [clientData, setClientData] = useState({
    civilite: "Monsieur",
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    secondTelephone: "",
    adresse: "",
    codePostal: "",
    ville: "",
    zone: "",
    password: "",
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
          "https://bcd-backend-1ba2057cf6f6.herokuapp.com/clients",
          {
            params: {
              page,
              limit: 12,
              search,
            },
          }
      );
      const formattedClients = response.data.clients.map((client) => ({
        ...client,
        prenom: formatName(client.prenom),
        nom: formatName(client.nom),
      }));
      setClients(formattedClients);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, [page, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const fetchClientOrders = async (email) => {
    try {
      const response = await axios.get(
          "https://bcd-backend-1ba2057cf6f6.herokuapp.com/client-orders",
          {
            params: { email },
          }
      );
      setOrders(response.data.orders);
      setCompletedDeliveries(response.data.completedDeliveries);
      setCompletedSweepings(response.data.completedSweepings);
      setCompletedSales(response.data.completedSales);
      setRamonages(response.data.ramonages);
    } catch (error) {
      console.error("Error fetching client orders and ramonages:", error);
      setError(
          "Failed to fetch client orders and ramonages. Please try again later."
      );
    }
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    fetchClientOrders(client.email);
  };

  const closeModal = () => {
    setSelectedClient(null);
    setOrders([]);
    setCompletedDeliveries([]);
    setCompletedSweepings([]);
    setCompletedSales([]);
    setRamonages([]);
    setError("");
    setIsEditing(false);
    setIsAddingClient(false);
    setClientData({
      civilite: "Monsieur",
      prenom: "",
      nom: "",
      email: "",
      telephone: "",
      secondTelephone: "",
      adresse: "",
      codePostal: "",
      ville: "",
      zone: "",
      password: "",
    });
    fetchClients(); // Ajoutez cette ligne pour rafraîchir la liste des clients
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format("dddd D MMMM YYYY, HH:mm:ss");
  };

  const handleDeleteClient = async () => {
    try {
      await axios.delete(
          `https://bcd-backend-1ba2057cf6f6.herokuapp.com/clients/${selectedClient._id}`
      );
      setClients((prevClients) =>
          prevClients.filter((client) => client._id !== selectedClient._id)
      );
      setConfirmDelete(false);
      closeModal();
    } catch (error) {
      console.error("Error deleting client:", error);
      setError("Failed to delete client. Please try again later.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClientData({ ...clientData, [name]: value });
  };

  const handleUpdateClient = async () => {
    try {
      await axios.put(
          `https://bcd-backend-1ba2057cf6f6.herokuapp.com/clients/${selectedClient._id}`,
          clientData
      );
      setClients((prevClients) =>
          prevClients.map((client) =>
              client._id === selectedClient._id ? { ...client, ...clientData } : client
          )
      );
      setIsEditing(false);
      closeModal();
    } catch (error) {
      console.error("Error updating client:", error);
      setError("Failed to update client. Please try again later.");
    }
  };

  const handleAddClient = async () => {
    try {
      const response = await axios.post(
          `https://bcd-backend-1ba2057cf6f6.herokuapp.com/create_client`,
          clientData
      );

      if (response.data.client) {
        await fetchClients(); // Rafraîchir la liste des clients après ajout
        closeModal(); // Fermer la modale après la mise à jour de la liste
      } else {
        throw new Error("Client data is undefined");
      }
    } catch (error) {
      console.error("Error adding client:", error);
      setError("Failed to add client. Please try again later.");
    }
  };






  return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-extrabold my-8 text-center text-gray-800">
          Clients
        </h1>
        <button
            onClick={() => setIsAddingClient(true)}
            className="p-3 mb-4 bg-black text-white rounded-lg hover:bg-gray-800 transition"
        >
          Ajouter un client
        </button>
        <input
            type="text"
            placeholder="Rechercher des clients..."
            value={search}
            onChange={handleSearchChange}
            className="p-4 border border-gray-300 rounded w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ml-4"
        />
          <div className="flex justify-between items-center my-6">
            <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Précédent
            </button>
            <span className="text-gray-700 text-lg">
            Page {page} sur {totalPages}
          </span>
            <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Suivant
            </button>
          </div>
        <div className="flex justify-between items-center mb-6">

        </div>
        {loading ? (
            <p className="text-center text-gray-500 text-lg">Chargement...</p>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {clients.map((client) => (
                  <div
                      key={client._id}
                      className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer"
                      onClick={() => handleClientClick(client)}
                  >
                    <h2 className="text-2xl font-semibold capitalize mb-4 text-gray-800">
                      {client.prenom} {client.nom}
                    </h2>
                    <div className="flex items-center mb-3 text-gray-600">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2"/>
                      <p>{client.email}</p>
                    </div>
                    <div className="flex items-center mb-3 text-gray-600">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-2"/>
                      <p>{client.telephone}</p>
                    </div>
                    <div className="flex items-start text-gray-600 mb-1">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-2"/>
                      <div>
                        <p>{client.adresse}</p>
                        <p>{client.codePostal}</p>
                        <p>{client.ville}</p>
                      </div>
                    </div>
                    <p className="text-gray-600">
                      <strong>Compte créé le:</strong>{" "}
                      {formatDate(client.creation_date)}
                    </p>
                  </div>
              ))}
            </div>
        )}
        <div className="flex justify-between items-center my-6">
          <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Précédent
          </button>
          <span className="text-gray-700 text-lg">
          Page {page} sur {totalPages}
        </span>
          <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Suivant
          </button>
        </div>
        <Transition show={!!selectedClient || isAddingClient} as={Fragment}>
          <Dialog
              as="div"
              className="fixed inset-0 z-10 overflow-y-auto"
              onClose={closeModal}
          >
            <div className="min-h-screen px-4 text-center">
              <div className="fixed inset-0 bg-black bg-opacity-50"/>
              <span
                  className="inline-block h-screen align-middle"
                  aria-hidden="true"
              >
              &#8203;
            </span>
              <div
                  className="inline-block w-full max-w-2xl p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-800">
                    {isAddingClient ? "Ajouter un client" : `${selectedClient?.prenom} ${selectedClient?.nom}`}
                  </h2>
                  <button
                      onClick={closeModal}
                      className="text-gray-500 hover:text-gray-700"
                  >
                    <XMarkIcon className="h-8 w-8"/>
                  </button>
                </div>
                {isEditing || isAddingClient ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 font-semibold mb-1">
                            Prénom
                          </label>
                          <input
                              type="text"
                              name="prenom"
                              value={clientData.prenom}
                              onChange={handleChange}
                              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-semibold mb-1">
                            Nom
                          </label>
                          <input
                              type="text"
                              name="nom"
                              value={clientData.nom}
                              onChange={handleChange}
                              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 font-semibold mb-1">
                            Civilité
                          </label>
                          <select
                              name="civilite"
                              value={clientData.civilite}
                              onChange={handleChange}
                              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Monsieur">Monsieur</option>
                            <option value="Madame">Madame</option>
                            <option value="Société">Société</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-700 font-semibold mb-1">
                            Email
                          </label>
                          <input
                              type="email"
                              name="email"
                              value={clientData.email}
                              onChange={handleChange}
                              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 font-semibold mb-1">
                            Téléphone
                          </label>
                          <input
                              type="text"
                              name="telephone"
                              value={clientData.telephone}
                              onChange={handleChange}
                              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-semibold mb-1">
                            Second Téléphone
                          </label>
                          <input
                              type="text"
                              name="secondTelephone"
                              value={clientData.secondTelephone}
                              onChange={handleChange}
                              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-1">
                          Adresse
                        </label>
                        <input
                            type="text"
                            name="adresse"
                            value={clientData.adresse}
                            onChange={handleChange}
                            className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 font-semibold mb-1">
                            Code Postal
                          </label>
                          <input
                              type="text"
                              name="codePostal"
                              value={clientData.codePostal}
                              onChange={handleChange}
                              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-semibold mb-1">
                            Ville
                          </label>
                          <input
                              type="text"
                              name="ville"
                              value={clientData.ville}
                              onChange={handleChange}
                              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-1">
                          Zone
                        </label>
                        <input
                            type="text"
                            name="zone"
                            value={clientData.zone}
                            onChange={handleChange}
                            className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-1">
                          Mot de passe
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={clientData.password}
                            onChange={handleChange}
                            className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex justify-end space-x-4 mt-4">
                        <button
                            onClick={() => {
                              if (isAddingClient) {
                                setIsAddingClient(false);
                                closeModal();
                              } else {
                                setIsEditing(false);
                                closeModal();
                              }
                            }}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                        >
                          Annuler
                        </button>
                        <button
                            onClick={isAddingClient ? handleAddClient : handleUpdateClient}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                          {isAddingClient ? "Ajouter" : "Enregistrer"}
                        </button>
                      </div>
                    </div>
                ) : (
                    <div className="space-y-4 text-gray-700">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-6 w-6 text-gray-400 mr-2"/>
                        <a href={`mailto:${selectedClient?.email}`} className="hover:underline">
                          {selectedClient?.email}
                        </a>
                      </div>
                      <div className="flex items-center">
                        <PhoneIcon className="h-6 w-6 text-gray-400 mr-2"/>
                        <a href={`tel:${selectedClient?.telephone}`} className="hover:underline">
                          {selectedClient?.telephone}
                        </a>
                      </div>
                      <div className="flex items-start">
                        <MapPinIcon className="h-6 w-6 text-gray-400 mr-2"/>
                        <div>
                          <p>{selectedClient?.adresse}</p>
                          <p>{selectedClient?.codePostal}</p>
                          <p>{selectedClient?.ville}</p>
                        </div>
                      </div>
                      {error && <p className="text-red-500">{error}</p>}
                      {orders.length > 0 && (
                          <div>
                            <h3 className="text-2xl font-semibold mt-6 text-blue-500">
                              Commandes
                            </h3>
                            <hr className="my-4 border-blue-200"/>
                            {orders.map((order, index) => (
                                <div
                                    key={index}
                                    className="bg-blue-50 p-4 rounded-lg shadow-sm my-4"
                                >
                                  <p className="font-semibold">Articles :</p>
                                  <ul className="list-disc ml-6">
                                    {order.cartItems.map((item, idx) => (
                                        <li key={idx}>
                                          {item.name} - {item.quantity}
                                        </li>
                                    ))}
                                  </ul>
                                  <p>
                                    <strong>Frais de livraison :</strong>{" "}
                                    {order.deliveryFee}€
                                  </p>
                                  <p>
                                    <strong>Remise :</strong> {order.discount}€
                                  </p>
                                  <p>
                                    <strong>Total du panier :</strong> {order.cartTotal}€
                                  </p>
                                  <p>
                                    <strong>Date de livraison :</strong>{" "}
                                    {formatDate(order.deliverySlot.date)}
                                  </p>
                                  <p>
                                    <strong>Date de création :</strong>{" "}
                                    {formatDate(order.creation_date)}
                                  </p>
                                </div>
                            ))}
                          </div>
                      )}
                      {ramonages.length > 0 && (
                          <div>
                            <h3 className="text-2xl font-semibold mt-6 text-teal-500">
                              Ramonages
                            </h3>
                            <hr className="my-4 border-teal-200"/>
                            {ramonages.map((ramonage, index) => (
                                <div
                                    key={index}
                                    className="bg-blue-50 p-4 rounded-lg shadow-sm my-4"
                                >
                                  <p className="font-semibold">Articles :</p>
                                  <ul className="list-disc ml-6">
                                    {ramonage.cartItems.map((item, idx) => (
                                        <li key={idx}>
                                          {item.name} - {item.quantity}
                                        </li>
                                    ))}
                                  </ul>
                                  <p>
                                    <strong>Frais de livraison :</strong>{" "}
                                    {ramonage.deliveryFee}€
                                  </p>
                                  <p>
                                    <strong>Remise :</strong> {ramonage.ramonageDiscount}€
                                  </p>
                                  <p>
                                    <strong>Total du panier :</strong>{" "}
                                    {ramonage.cartTotal}€
                                  </p>
                                  <p>
                                    <strong>Date de livraison :</strong>{" "}
                                    {formatDate(ramonage.deliverySlot.date)}
                                  </p>
                                  <p>
                                    <strong>Date de création :</strong>{" "}
                                    {formatDate(ramonage.creation_date)}
                                  </p>
                                </div>
                            ))}
                          </div>
                      )}
                      {completedDeliveries.length > 0 && (
                          <div>
                            <h3 className="text-2xl font-semibold mt-6 text-green-500">
                              Livraisons terminées
                            </h3>
                            <hr className="my-4 border-green-200"/>
                            {completedDeliveries.map((delivery, index) => (
                                <div
                                    key={index}
                                    className="bg-green-50 p-4 rounded-lg shadow-sm my-4"
                                >
                                  <p>
                                    <strong>Numéro de facture :</strong>{" "}
                                    {delivery.invoiceNumber}
                                  </p>
                                  <p>
                                    <strong>Date :</strong>{" "}
                                    {formatDate(delivery.date || delivery.createdAt)}
                                  </p>
                                  <button
                                      onClick={() =>
                                          window.open(delivery.invoiceURL, "_blank")
                                      }
                                      className="text-green-500 hover:underline"
                                  >
                                    Voir la facture
                                  </button>
                                </div>
                            ))}
                          </div>
                      )}
                      {completedSweepings.length > 0 && (
                          <div>
                            <h3 className="text-2xl font-semibold mt-6 text-red-500">
                              Ramonages terminées
                            </h3>
                            <hr className="my-4 border-red-200"/>
                            {completedSweepings.map((sweeping, index) => (
                                <div
                                    key={index}
                                    className="bg-red-50 p-4 rounded-lg shadow-sm my-4"
                                >
                                  <p>
                                    <strong>Numéro de facture :</strong>{" "}
                                    {sweeping.invoiceNumber}
                                  </p>
                                  <p>
                                    <strong>Date :</strong>{" "}
                                    {formatDate(sweeping.date || sweeping.createdAt)}
                                  </p>
                                  <button
                                      onClick={() =>
                                          window.open(sweeping.invoiceURL, "_blank")
                                      }
                                      className="text-red-500 hover:underline"
                                  >
                                    Voir la facture
                                  </button>
                                </div>
                            ))}
                          </div>
                      )}
                      {completedSales.length > 0 && (
                          <div>
                            <h3 className="text-2xl font-semibold mt-6 text-purple-500">
                              Ventes terminées
                            </h3>
                            <hr className="my-4 border-purple-200"/>
                            {completedSales.map((sale, index) => (
                                <div
                                    key={index}
                                    className="bg-purple-50 p-4 rounded-lg shadow-sm my-4"
                                >
                                  <p>
                                    <strong>Numéro de facture :</strong>{" "}
                                    {sale.invoiceNumber}
                                  </p>
                                  <p>
                                    <strong>Date :</strong> {formatDate(sale.createdAt)}
                                  </p>
                                  <button
                                      onClick={() => window.open(sale.invoiceURL, "_blank")}
                                      className="text-purple-500 hover:underline"
                                  >
                                    Voir la facture
                                  </button>
                                </div>
                            ))}
                          </div>
                      )}
                      <div className="flex justify-end space-x-4 mt-8">
                        <button
                            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            onClick={() => {
                              setIsEditing(true);
                              setClientData(selectedClient);
                            }}
                        >
                          <PencilIcon className="h-5 w-5 mr-2"/>
                          Modifier
                        </button>
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          <TrashIcon className="h-5 w-5 mr-2"/>
                          Supprimer
                        </button>
                      </div>
                      <Transition show={confirmDelete} as={Fragment}>
                        <Dialog
                            as="div"
                            className="fixed inset-0 z-10 overflow-y-auto"
                            onClose={() => setConfirmDelete(false)}
                        >
                          <div className="min-h-screen px-4 text-center">
                            <div className="fixed inset-0 bg-black bg-opacity-50"/>
                            <span
                                className="inline-block h-screen align-middle"
                                aria-hidden="true"
                            >
                          &#8203;
                        </span>
                            <div
                                className="inline-block w-full max-w-md p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                              <Dialog.Title
                                  as="h3"
                                  className="text-lg font-medium leading-6 text-gray-900"
                              >
                                Confirmer la suppression
                              </Dialog.Title>
                              <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                  Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
                                </p>
                              </div>
                              <div className="mt-4 flex justify-end space-x-4">
                                <button
                                    onClick={() => setConfirmDelete(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                                >
                                  Annuler
                                </button>
                                <button
                                    onClick={handleDeleteClient}
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          </div>
                        </Dialog>
                      </Transition>
                    </div>
                )}
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
  );
};

export default Clients;
