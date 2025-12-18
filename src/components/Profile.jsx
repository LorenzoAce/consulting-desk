import React from 'react';
import { User, Mail, Phone, MapPin, Building } from 'lucide-react';

const Profile = () => {
  // Mock data for now
  const user = {
    name: 'Mario Rossi',
    role: 'Senior Consultant',
    email: 'mario.rossi@consulting.it',
    phone: '+39 333 1234567',
    location: 'Milano, Italia',
    company: 'Consulting Desk S.r.l.',
    bio: 'Consulente esperto con oltre 10 anni di esperienza nel settore energetico e betting.'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        
        <div className="px-6 py-4 relative">
          {/* Avatar */}
          <div className="absolute -top-16 left-6 border-4 border-white dark:border-gray-800 rounded-full bg-white p-1">
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <User className="h-12 w-12" />
            </div>
          </div>
          
          <div className="ml-32 pt-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">{user.role}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Informazioni Contatto</h3>
              
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
                <Building className="h-5 w-5 mr-3 text-gray-400" />
                <span>{user.company}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bio</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {user.bio}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
