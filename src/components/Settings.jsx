import React, { useState, useEffect } from 'react';
import { 
  Upload, Check, AlertTriangle, FileText, Save, GripVertical, 
  Plus, Trash2, Send, Mail, MessageSquare, Layout, 
  Settings as SettingsIcon, Database, Image as ImageIcon
} from 'lucide-react';
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

const DEFAULT_CRM_STATUSES = [
  { id: 'new', label: 'Nuovo', color: 'green' },
  { id: 'contacted', label: 'Contattato', color: 'blue' },
  { id: 'interested', label: 'Interessato', color: 'yellow' },
  { id: 'client', label: 'Cliente', color: 'purple' },
  { id: 'closed', label: 'Chiuso', color: 'red' }
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('marketing');
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
    assigned_consultant: true,
    status_width: 160
  });
  const [archiveOptions, setArchiveOptions] = useState({
    business_name: true,
    full_name: true,
    address: true,
    city: true,
    province: true,
    phone: true,
    email: true,
    piva: true,
    main_interest: true,
    availability: true,
    assigned_consultant: true,
    operator_name: true,
    created_at: true,
    updated_at: true
  });
  const [marketingSettings, setMarketingSettings] = useState({
    email_provider: 'smtp',
    smtp_accounts: [], // [{ id, host, port, user, pass, label }]
    sms_provider: 'mock',
    sms_api_key: ''
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
        if (data.archive_options) {
            setArchiveOptions(data.archive_options);
        }
        if (data.marketing_settings) {
            setMarketingSettings(data.marketing_settings);
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

  const handleArchiveOptionChange = (option) => {
    setArchiveOptions(prev => ({
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

  const handleMarketingSettingChange = (field, value) => {
    setMarketingSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSmtpAccount = () => {
    const newAccount = {
      id: `smtp_${Date.now()}`,
      label: 'Nuovo Account SMTP',
      host: '',
      port: 587,
      user: '',
      pass: ''
    };
    setMarketingSettings(prev => ({
      ...prev,
      smtp_accounts: [...(prev.smtp_accounts || []), newAccount]
    }));
  };

  const handleRemoveSmtpAccount = (id) => {
    if (window.confirm('Rimuovere questo account SMTP?')) {
      setMarketingSettings(prev => ({
        ...prev,
        smtp_accounts: prev.smtp_accounts.filter(acc => acc.id !== id)
      }));
    }
  };

  const handleSmtpAccountChange = (id, field, value) => {
    setMarketingSettings(prev => ({
      ...prev,
      smtp_accounts: prev.smtp_accounts.map(acc => 
        acc.id === id ? { ...acc, [field]: value } : acc
      )
    }));
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
          crmStatuses,
          archiveOptions,
          marketingSettings,
          logo,
          logoDimensions
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

  const tabs = [
    { id: 'marketing', label: 'Marketing', icon: <Send className="h-4 w-4" />, description: 'Email e SMS' },
    { id: 'crm', label: 'CRM', icon: <Layout className="h-4 w-4" />, description: 'Tabelle e Stati' },
    { id: 'archive', label: 'Archivio', icon: <Database className="h-4 w-4" />, description: 'Campi PDF e Liste' },
    { id: 'logo', label: 'Logo', icon: <ImageIcon className="h-4 w-4" />, description: 'Identità Visiva' }
  ];

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-gray-500" />
            Impostazioni
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Configura il comportamento globale dell'applicazione.</p>
        </div>

        <button
          onClick={saveSettings}
          disabled={isSavingSettings}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${
            isSavingSettings
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 shadow-green-500/20'
          }`}
        >
          {isSavingSettings ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Save className="h-5 w-5" />
          )}
          Salva Tutto
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors border-l-4 ${
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className={`p-2 rounded-lg ${activeTab === tab.id ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  {tab.icon}
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight">{tab.label}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          {activeTab === 'marketing' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-500" />
                    Configurazione Email (SMTP)
                  </h3>
                  <button
                    onClick={handleAddSmtpAccount}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    Aggiungi SMTP
                  </button>
                </div>
                
                <div className="space-y-6">
                  {(marketingSettings.smtp_accounts || []).map((account) => (
                    <div key={account.id} className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4 group relative">
                      <button 
                        onClick={() => handleRemoveSmtpAccount(account.id)}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nome Account (es. Info Azienda)</label>
                          <input 
                            type="text"
                            value={account.label}
                            onChange={(e) => handleSmtpAccountChange(account.id, 'label', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 dark:text-white text-sm outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Server SMTP</label>
                          <input 
                            type="text"
                            value={account.host}
                            onChange={(e) => handleSmtpAccountChange(account.id, 'host', e.target.value)}
                            placeholder="smtp.gmail.com"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 dark:text-white text-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Porta</label>
                          <input 
                            type="number"
                            value={account.port}
                            onChange={(e) => handleSmtpAccountChange(account.id, 'port', parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 dark:text-white text-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Utente / Email</label>
                          <input 
                            type="text"
                            value={account.user}
                            onChange={(e) => handleSmtpAccountChange(account.id, 'user', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 dark:text-white text-sm outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Password / App Key</label>
                          <input 
                            type="password"
                            value={account.pass}
                            onChange={(e) => handleSmtpAccountChange(account.id, 'pass', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 dark:text-white text-sm outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!marketingSettings.smtp_accounts || marketingSettings.smtp_accounts.length === 0) && (
                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                      Nessun account SMTP configurato. Clicca su "Aggiungi SMTP" per iniziare.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  Configurazione SMS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Provider SMS</label>
                    <select 
                      value={marketingSettings.sms_provider}
                      onChange={(e) => handleMarketingSettingChange('sms_provider', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="mock">Simulazione (Test)</option>
                      <option value="twilio">Twilio</option>
                      <option value="skebby">Skebby</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">API Key / Auth Token</label>
                    <input 
                      type="password"
                      value={marketingSettings.sms_api_key}
                      onChange={(e) => handleMarketingSettingChange('sms_api_key', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-purple-500" />
                    Stati del CRM
                  </h3>
                  <button
                    onClick={handleAddStatus}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-all shadow-md shadow-purple-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    Aggiungi
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {crmStatuses.map((status, index) => (
                    <div key={status.id || index} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-700 group">
                      <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Etichetta</label>
                          <input
                            type="text"
                            value={status.label}
                            onChange={(e) => handleStatusChange(index, 'label', e.target.value)}
                            className="block w-full px-3 py-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Colore</label>
                          <select
                            value={status.color}
                            onChange={(e) => handleStatusChange(index, 'color', e.target.value)}
                            className="block w-full px-3 py-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm dark:bg-gray-800 dark:text-white"
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
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm ${
                            COLOR_OPTIONS.find(c => c.value === status.color)?.classes || 'bg-gray-100'
                        }`}>
                            <span className="text-xs font-bold">Aa</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveStatus(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Layout className="h-5 w-5 text-blue-500" />
                  Visualizzazione Tabella CRM
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: 'business_name', label: 'R.Sociale' },
                    { id: 'contact_name', label: 'Contatto' },
                    { id: 'address', label: 'Indirizzo' },
                    { id: 'city', label: 'Città' },
                    { id: 'province', label: 'Provincia' },
                    { id: 'phone', label: 'Telefono' },
                    { id: 'email', label: 'Email' },
                    { id: 'piva', label: 'P.IVA' },
                    { id: 'main_interest', label: 'Interesse' },
                    { id: 'availability', label: 'Disponibilità' },
                    { id: 'services', label: 'Servizi' },
                    { id: 'status', label: 'Stato' },
                    { id: 'source', label: 'Fonte' },
                    { id: 'notes', label: 'Note' },
                    { id: 'assigned_consultant', label: 'Consulente' }
                  ].map((col) => (
                    <label key={col.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800">
                      <input 
                        type="checkbox" 
                        checked={crmOptions[col.id]} 
                        onChange={() => handleCrmOptionChange(col.id)}
                        className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{col.label}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                    Larghezza Colonna Stato ({crmOptions.status_width}px)
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="400"
                    step="10"
                    value={crmOptions.status_width || 160}
                    onChange={(e) => setCrmOptions(prev => ({ ...prev, status_width: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-xl appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'archive' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-500" />
                  Sezioni PDF Esportabile
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'anagrafica', label: 'Anagrafica Cliente' },
                    { id: 'dettagli', label: 'Dettagli Servizio' },
                    { id: 'note', label: 'Note e Richieste' },
                    { id: 'assegnazione', label: 'Assegnazione' },
                    { id: 'firma', label: 'Sezione Firme' },
                    { id: 'disclaimer', label: 'Disclaimer Legale' }
                  ].map((opt) => (
                    <label key={opt.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800">
                      <input 
                        type="checkbox" 
                        checked={pdfOptions[opt.id]} 
                        onChange={() => handlePdfOptionChange(opt.id)}
                        className="rounded-md border-gray-300 text-red-600 focus:ring-red-500 h-5 w-5"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-500" />
                  Colonne Tabella Archivio
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: 'business_name', label: 'R.Sociale' },
                    { id: 'full_name', label: 'Nome e Cognome' },
                    { id: 'city', label: 'Città' },
                    { id: 'province', label: 'Provincia' },
                    { id: 'phone', label: 'Telefono' },
                    { id: 'email', label: 'Email' },
                    { id: 'piva', label: 'P.IVA' },
                    { id: 'main_interest', label: 'Interesse' },
                    { id: 'availability', label: 'Disponibilità' },
                    { id: 'assigned_consultant', label: 'Consulente' },
                    { id: 'operator_name', label: 'Operatore' },
                    { id: 'created_at', label: 'Creazione' }
                  ].map((col) => (
                    <label key={col.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors border border-transparent hover:border-green-200 dark:hover:border-green-800">
                      <input 
                        type="checkbox" 
                        checked={archiveOptions[col.id]} 
                        onChange={() => handleArchiveOptionChange(col.id)}
                        className="rounded-md border-gray-300 text-green-600 focus:ring-green-500 h-5 w-5"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logo' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                  Logo Globale dell'Agenzia
                </h3>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-5 flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                      Il logo caricato qui sarà utilizzato come <strong>predefinito</strong> per tutte le nuove schede e per i PDF.
                      Puoi anche forzare l'aggiornamento su tutte le schede già esistenti.
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-10 hover:border-blue-500 dark:hover:border-blue-500 transition-all bg-gray-50 dark:bg-gray-900/50 group">
                    {logo ? (
                      <div className="relative group/image">
                        <img 
                          src={logo} 
                          alt="Logo Preview" 
                          className="max-h-48 object-contain mx-auto transition-transform group-hover/image:scale-105"
                        />
                        <button 
                          onClick={() => { setLogo(null); setLogoDimensions(null); }}
                          className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 text-red-500 rounded-full p-2 shadow-xl border border-gray-100 dark:border-gray-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center">
                        <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="h-10 w-10 text-blue-500" />
                        </div>
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Trascina o clicca per caricare</span>
                        <span className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium">PNG, JPG fino a 2MB</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoUpload}
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={applyLogoToAll}
                      disabled={!logo || isUploading}
                      className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-bold transition-all shadow-lg ${
                        !logo || isUploading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20 active:scale-95'
                      }`}
                    >
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <Check className="h-5 w-5" />
                      )}
                      Applica a tutto l'archivio
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
