import React, { useState, useEffect } from "react";
import axios from "axios";
import "./index.css";
import SweepingWeeklyScheduler from "./components/SweepingWeeklyScheduler/SweepingWeeklyScheduler";
import WeeklyScheduler from "./components/WeeklyScheduler/WeeklyScheduler";
import Clients from "./components/Clients/Clients";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode"; // Corrigé l'import de jwtDecode
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

function App() {
  const [selectedScheduler, setSelectedScheduler] = useState('weekly');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setIsAuthenticated(true);
          setShowPasswordModal(false);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://bcd-backend-1ba2057cf6f6.herokuapp.com/verify-password', { password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setIsAuthenticated(true);
      setShowPasswordModal(false);
    } catch (err) {
      toast.error('Mot de passe incorrect');
    }
    setPassword(''); // Vider le champ de mot de passe après la tentative de connexion
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setShowPasswordModal(true);
    toast.success('Déconnexion réussie');
  };

  return (
    <>
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
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <form onSubmit={handlePasswordSubmit}>
              <h2 className="text-2xl font-semibold text-center mb-4">Dashboard - BCD</h2>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 text-center"
                placeholder="Mot de passe"
                required
              />
              <button 
                type="submit" 
                className="w-full bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800"
              >
                Connexion
              </button>
            </form>
          </div>
        </div>
      )}
      {isAuthenticated && (
        <div className="flex h-screen bg-gray-100">
          <div className="w-44 bg-gray-800 text-white flex flex-col">
            <div className="px-4 py-4 text-2xl font-semibold">
              Dashboard
            </div>
            <nav className="flex-1">
              <button 
                className={`w-full text-left px-4 py-3 hover:bg-gray-700 ${selectedScheduler === 'weekly' ? 'bg-gray-700' : ''}`}
                onClick={() => setSelectedScheduler('weekly')}
              >
                Livraisons
              </button>
              <button 
                className={`w-full text-left px-4 py-3 hover:bg-gray-700 ${selectedScheduler === 'sweeping' ? 'bg-gray-700' : ''}`}
                onClick={() => setSelectedScheduler('sweeping')}
              >
                Ramonages
              </button>
              <button 
                className={`w-full text-left px-4 py-3 hover:bg-gray-700 ${selectedScheduler === 'clients' ? 'bg-gray-700' : ''}`}
                onClick={() => setSelectedScheduler('clients')}
              >
                Clients
              </button>
            </nav>
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 mt-auto bg-gray-600 hover:bg-gray-700 flex items-center"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
              Déconnexion
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {selectedScheduler === 'weekly' && <WeeklyScheduler />}
            {selectedScheduler === 'sweeping' && <SweepingWeeklyScheduler />}
            {selectedScheduler === 'clients' && <Clients />}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
