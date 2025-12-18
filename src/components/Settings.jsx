import React from 'react';
import { Bell, Shield, Smartphone, Globe, Moon, Database } from 'lucide-react';

const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Impostazioni</h1>
      
      {/* General Settings */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Generale
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Lingua</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Seleziona la lingua dell'interfaccia</p>
            </div>
            <select className="mt-1 block w-40 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white text-sm">
              <option>Italiano</option>
              <option>English</option>
              <option>Español</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-500" />
            Notifiche
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Notifiche Email</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ricevi aggiornamenti via email</p>
            </div>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input type="checkbox" name="toggle" id="toggle1" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-blue-600"/>
              <label htmlFor="toggle1" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer checked:bg-blue-600"></label>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Sicurezza
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Cambia Password
          </button>
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
             <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Attiva Autenticazione a Due Fattori
          </button>
          </div>
        </div>
      </div>
      
       {/* Data */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-500" />
            Dati
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            Esporta Tutti i Dati
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
