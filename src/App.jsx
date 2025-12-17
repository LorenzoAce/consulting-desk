import React, { useState, useEffect } from 'react';
import { NeonAuthUIProvider, AuthView, useAuthData } from '@neondatabase/neon-js/auth/react/ui';
import { authClient } from './auth';
import ConsultingForm from './components/ConsultingForm';
import Archive from './components/Archive';
import Layout from './components/Layout';

function AppContent() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('form'); // 'form', 'archive', 'profile', 'settings'
  const [selectedCard, setSelectedCard] = useState(null);
  const { session } = useAuthData();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Consulting Desk</h1>
            <AuthView />
          </div>
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
    <NeonAuthUIProvider authClient={authClient}>
      <AppContent />
    </NeonAuthUIProvider>
  );
}


export default App;
