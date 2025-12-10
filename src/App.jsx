import React, { useState, useEffect } from 'react';
import ConsultingForm from './components/ConsultingForm';
import Layout from './components/Layout';

function App() {
  const [darkMode, setDarkMode] = useState(false);

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

  return (
    <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
      <ConsultingForm />
    </Layout>
  );
}

export default App;
