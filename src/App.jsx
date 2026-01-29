import React, { useState, useEffect } from 'react';
import ConsultingForm from './components/ConsultingForm';
import Archive from './components/Archive';
import CRM from './components/CRM';
import Settings from './components/Settings';
import ConsultantsManager from './components/ConsultantsManager';
import Layout from './components/Layout';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check system preference on initial load
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    return false;
  });
  const [currentView, setCurrentView] = useState('form'); // 'form', 'archive', 'profile', 'settings'
  const [previousView, setPreviousView] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLoadCard = (card, sourceView = null) => {
    setSelectedCard(card);
    if (sourceView) {
      setPreviousView(sourceView);
    }
    setCurrentView('form');
  };

  const handleBack = () => {
    if (previousView) {
      setCurrentView(previousView);
      setPreviousView(null);
      setSelectedCard(null);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'form':
        return <ConsultingForm initialData={selectedCard} key={selectedCard ? selectedCard.id : 'new'} onBack={previousView ? handleBack : null} />;
      case 'archive':
        return <Archive onLoadCard={(card) => handleLoadCard(card, 'archive')} />;
      case 'crm':
        return <CRM onLoadCard={(card) => handleLoadCard(card, 'crm')} onNavigate={handleNavigate} />;
      case 'consultants':
        return <ConsultantsManager />;
      case 'settings':
        return <Settings />;
      default:
        return <ConsultingForm />;
    }
  };

  const handleNavigate = (viewId) => {
    if (viewId === 'form') {
      setSelectedCard(null);
    }
    setPreviousView(null);
    setCurrentView(viewId);
  };

  return (
    <Layout 
      darkMode={darkMode} 
      toggleDarkMode={toggleDarkMode}
      currentView={currentView}
      onNavigate={handleNavigate}
    >
      {renderView()}
    </Layout>
  );
}

export default App;
