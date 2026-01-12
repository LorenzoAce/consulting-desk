import React, { useState, useEffect } from 'react';
import { Upload, Check, AlertTriangle, FileText, Save } from 'lucide-react';
import { getApiUrl } from '../utils/api';

const Settings = () => {
  const [logo, setLogo] = useState(null);
  const [logoDimensions, setLogoDimensions] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // PDF Options State
  const [pdfOptions, setPdfOptions] = useState({
    anagrafica: true,
    dettagli: false,
    note: true,
    assegnazione: true,
    firma: true,
    disclaimer: true
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.pdf_options) {
          setPdfOptions(data.pdf_options);
        }
        if (data.logo) setLogo(data.logo);
        if (data.logo_dimensions) setLogoDimensions(data.logo_dimensions);

        if (!data.logo) {
          const logoResponse = await fetch(`${apiUrl}/api/cards/global-logo`);
          if (logoResponse.ok) {
            const logoData = await logoResponse.json();
            if (logoData.logo) setLogo(logoData.logo);
            if (logoData.logo_dimensions) setLogoDimensions(logoData.logo_dimensions);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handlePdfOptionChange = (option) => {
    setPdfOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const savePdfSettings = async () => {
    setIsSavingSettings(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
      const response = await fetch(`${apiUrl}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfOptions
        }),
      });

      if (response.ok) {
        alert('Impostazioni PDF salvate con successo!');
      } else {
        alert('Errore durante il salvataggio delle impostazioni.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Errore di connessione al server.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        const img = new Image();
        img.onload = () => {
          setLogoDimensions({ width: img.width, height: img.height });
          setLogo(result);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const applyLogoToAll = async () => {
    if (!logo || !logoDimensions) return;
    
    if (!window.confirm('Sei sicuro di voler applicare questo logo a TUTTE le schede esistenti? Questa operazione non può essere annullata.')) {
        return;
    }

    setIsUploading(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/cards/bulk-logo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logo,
          logoDimensions
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Operazione completata! Logo aggiornato su ${result.updatedCount} schede.`);
      } else {
        alert('Errore durante l\'aggiornamento delle schede.');
      }
    } catch (error) {
      console.error('Error updating global logo:', error);
      alert('Errore di connessione al server.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Impostazioni</h2>
        <p className="text-gray-500 dark:text-gray-400">Gestisci le configurazioni globali dell'applicazione.</p>
      </div>

      {/* PDF Options Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-red-500" />
          Opzioni PDF Globali
        </h3>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Seleziona quali sezioni includere nel PDF generato per tutte le schede.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={pdfOptions.anagrafica} 
                onChange={() => handlePdfOptionChange('anagrafica')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="text-gray-700 dark:text-gray-200">Anagrafica Cliente</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={pdfOptions.dettagli} 
                onChange={() => handlePdfOptionChange('dettagli')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="text-gray-700 dark:text-gray-200">Dettagli Servizio</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={pdfOptions.note} 
                onChange={() => handlePdfOptionChange('note')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="text-gray-700 dark:text-gray-200">Note e Richieste</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={pdfOptions.assegnazione} 
                onChange={() => handlePdfOptionChange('assegnazione')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="text-gray-700 dark:text-gray-200">Assegnazione Consulente</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={pdfOptions.firma} 
                onChange={() => handlePdfOptionChange('firma')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="text-gray-700 dark:text-gray-200">Sezione Firme</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={pdfOptions.disclaimer} 
                onChange={() => handlePdfOptionChange('disclaimer')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="text-gray-700 dark:text-gray-200">Disclaimer Legale</span>
            </label>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={savePdfSettings}
              disabled={isSavingSettings}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isSavingSettings
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                  : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
              }`}
            >
              {isSavingSettings ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salva Impostazioni PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-500" />
          Logo Globale
        </h3>
        
        <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    Caricando un logo qui e cliccando su "Applica a tutte", aggiornerai il logo presente su <strong>tutte le schede salvate in archivio</strong>.
                    Questa operazione sovrascriverà eventuali loghi diversi caricati precedentemente sulle singole schede.
                </p>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                {logo ? (
                <div className="relative">
                    <img 
                    src={logo} 
                    alt="Logo Preview" 
                    className="max-h-32 object-contain mx-auto"
                    />
                    <button 
                    onClick={() => { setLogo(null); setLogoDimensions(null); }}
                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                    >
                    <span className="sr-only">Rimuovi</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    </button>
                </div>
                ) : (
                <label className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-12 w-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Clicca per caricare un logo</span>
                    <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload}
                    className="hidden" 
                    />
                </label>
                )}
            </div>

            <div className="flex justify-end pt-4">
                <button
                onClick={applyLogoToAll}
                disabled={!logo || isUploading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    !logo || isUploading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                }`}
                >
                {isUploading ? (
                    <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Applicazione in corso...
                    </>
                ) : (
                    <>
                    <Check className="h-4 w-4" />
                    Applica a tutte le schede
                    </>
                )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
