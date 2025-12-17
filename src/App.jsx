import React, { useState, useEffect } from 'react';
import ConsultingForm from './components/ConsultingForm';
import Archive from './components/Archive';
import Layout from './components/Layout';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('form'); // 'form', 'archive', 'profile', 'settings'
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


export default App;
