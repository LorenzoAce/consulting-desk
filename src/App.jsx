import React, { useState, useEffect } from 'react';
import { NeonAuthUIProvider, AuthView } from '@neondatabase/neon-js/auth/react/ui';
import { authClient } from './auth';
import { authLocalizationIT } from './authLocalization';
import ConsultingForm from './components/ConsultingForm';
import Archive from './components/Archive';
import Layout from './components/Layout';
import { Building } from 'lucide-react';

function AppContent() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check system preference on initial load
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    return false;
  });
  const [currentView, setCurrentView] = useState('form'); // 'form', 'archive', 'profile', 'settings'
  const [selectedCard, setSelectedCard] = useState(null);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
        <div className="absolute top-4 right-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
        </div>
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-8">
            <div className="text-center mb-8">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                  <Building className="w-8 h-8 text-blue-600 dark:text-blue-400" />
               </div>
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Consulting Desk</h1>
               <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Piattaforma di gestione consulenze</p>
            </div>
            <AuthView />
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-gray-400 dark:text-gray-600">
          &copy; {new Date().getFullYear()} Consulting Desk
        </div>
      </div>
    );
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLoadCard = (card) => {
    setSelectedCard(card);
    setCurrentView('form');
  };

  const renderView = () => {
    switch (currentView) {
      case 'form':
        return <ConsultingForm initialData={selectedCard} key={selectedCard ? selectedCard.id : 'new'} />;
      case 'archive':
        return <Archive onLoadCard={handleLoadCard} />;
      default:
        return <ConsultingForm />;
    }
  };

  return (
    <Layout 
      darkMode={darkMode} 
      toggleDarkMode={toggleDarkMode}
      currentView={currentView}
      onNavigate={setCurrentView}
    >
      {renderView()}
    </Layout>
  );
}

function App() {
  return (
    <NeonAuthUIProvider authClient={authClient} localization={authLocalizationIT}>
      <AppContent />
    </NeonAuthUIProvider>
  );
}


export default App;
