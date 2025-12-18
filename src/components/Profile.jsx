import React from 'react';
import { User, Mail, Phone, MapPin, Briefcase } from 'lucide-react';

const Profile = () => {
  // Mock user data
  const user = {
    name: 'Mario Rossi',
    role: 'Senior Consultant',
    email: 'mario.rossi@consulting.it',
    phone: '+39 333 1234567',
    location: 'Milano, Italia',
    company: 'Consulting Desk S.r.l.',
    bio: 'Consulente esperto con oltre 10 anni di esperienza nel settore energetico e betting. Specializzato in ottimizzazione dei processi e gestione clienti.',
    avatar: 'https://ui-avatars.com/api/?name=Mario+Rossi&background=2563eb&color=fff'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Profilo Utente</h2>
      
      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        <div className="px-6 pb-6">
          <div className="relative flex items-end -mt-16 mb-4">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="h-32 w-32 rounded-full border-4 border-white dark:border-gray-800 bg-white"
            />
            <div className="ml-4 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">{user.role}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Informazioni di Contatto</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Mail className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Phone className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{user.phone}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{user.location}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Briefcase className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{user.company}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Bio</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {user.bio}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats or other info could go here */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-blue-600 mb-1">124</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Pratiche Gestite</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-green-600 mb-1">98%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Tasso di Successo</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-purple-600 mb-1">4.9</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Valutazione Media</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
