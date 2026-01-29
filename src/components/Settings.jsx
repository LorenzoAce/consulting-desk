import React, { useState, useEffect } from 'react';
import { Upload, Check, AlertTriangle, FileText, Save, GripVertical, Plus, Trash2 } from 'lucide-react';
import { getApiUrl } from '../utils/api';

const COLOR_OPTIONS = [
  { value: 'green', label: 'Verde', classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800' },
  { value: 'blue', label: 'Blu', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  { value: 'yellow', label: 'Giallo', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' },
  { value: 'purple', label: 'Viola', classes: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  { value: 'red', label: 'Rosso', classes: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800' },
  { value: 'indigo', label: 'Indaco', classes: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  { value: 'pink', label: 'Rosa', classes: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300 border-pink-200 dark:border-pink-800' },
  { value: 'gray', label: 'Grigio', classes: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600' },
];

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
  const [crmOptions, setCrmOptions] = useState({
    business_name: true,
    contact_name: true,
    address: true,
    city: true,
    province: true,
    phone: true,
    email: true,
    main_interest: true,
    availability: true,
    services: true,
    status: true,
    source: true,
    notes: true,
    assigned_consultant: true
  });
  const [crmStatuses, setCrmStatuses] = useState([]);
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
        if (data.crm_options) {
            setCrmOptions(data.crm_options);
        }
        if (data.crm_statuses && data.crm_statuses.length > 0) {
          setCrmStatuses(data.crm_statuses);
        } else {
          setCrmStatuses(DEFAULT_CRM_STATUSES);
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

  const handleCrmOptionChange = (option) => {
    setCrmOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleAddStatus = () => {
    const newId = `status_${Date.now()}`;
    setCrmStatuses([...crmStatuses, { id: newId, label: 'Nuovo Stato', color: 'gray' }]);
  };

  const handleRemoveStatus = (index) => {
    if (window.confirm('Sei sicuro di voler rimuovere questo stato?')) {
      const newStatuses = [...crmStatuses];
      newStatuses.splice(index, 1);
      setCrmStatuses(newStatuses);
    }
  };

  const handleStatusChange = (index, field, value) => {
    const newStatuses = [...crmStatuses];
    newStatuses[index] = { ...newStatuses[index], [field]: value };
    setCrmStatuses(newStatuses);
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfOptions,
          crmOptions,
          crmStatuses
        }),
      });

      if (response.ok) {
        alert('Impostazioni salvate con successo!');
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
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Impostazioni</h2>
        <p className="text-gray-500 dark:text-gray-400">Gestisci le configurazioni globali dell'applicazione.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
          </div>
        </div>

        {/* CRM Column Options Section */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Visibilità Colonne CRM
          </h3>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Seleziona quali colonne visualizzare nella tabella CRM.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'business_name', label: 'R.Sociale - Insegna' },
                { id: 'contact_name', label: 'Contatto' },
                { id: 'address', label: 'Indirizzo' },
                { id: 'city', label: 'Città' },
                { id: 'province', label: 'Provincia' },
                { id: 'phone', label: 'Telefono' },
                { id: 'email', label: 'Email' },
                { id: 'main_interest', label: 'Interesse' },
                { id: 'availability', label: 'Disponibilità' },
                { id: 'services', label: 'Servizi Attivi' },
                { id: 'status', label: 'Stato' },
                { id: 'source', label: 'Fonte' },
                { id: 'notes', label: 'Note' },
                { id: 'assigned_consultant', label: 'Consulente' }
              ].map((col) => (
                <label key={col.id} className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={crmOptions[col.id]} 
                    onChange={() => handleCrmOptionChange(col.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                  />
                  <span className="text-gray-700 dark:text-gray-200">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CRM Statuses Configuration */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <GripVertical className="h-5 w-5 text-purple-500" />
            Configurazione Stati CRM
          </h3>
          <button
            onClick={handleAddStatus}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            Aggiungi Stato
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Personalizza gli stati disponibili nel CRM. Puoi modificare il nome e il colore di ogni stato.
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            {crmStatuses.map((status, index) => (
              <div key={status.id || index} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nome Stato</label>
                    <input
                      type="text"
                      value={status.label}
                      onChange={(e) => handleStatusChange(index, 'label', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      placeholder="Nome dello stato"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Colore</label>
                    <select
                      value={status.color}
                      onChange={(e) => handleStatusChange(index, 'color', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    >
                      {COLOR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex-shrink-0 flex items-end">
                   <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                      COLOR_OPTIONS.find(c => c.value === status.color)?.classes.split(' ').filter(c => c.startsWith('bg-') || c.startsWith('text-')).join(' ') || 'bg-gray-100'
                   }`}>
                      <span className="text-xs font-bold">Aa</span>
                   </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleRemoveStatus(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Rimuovi stato"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {crmStatuses.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
              Nessuno stato configurato. Aggiungine uno per iniziare.
            </div>
          )}
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

      <div className="flex justify-end sticky bottom-6 z-10">
        <button
          onClick={saveSettings}
          disabled={isSavingSettings}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-lg shadow-lg transition-colors transform hover:-translate-y-0.5 ${
            isSavingSettings
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isSavingSettings ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Salva Tutte le Impostazioni
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;
