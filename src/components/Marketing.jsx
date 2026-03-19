import React, { useState, useEffect } from 'react';
import { Send, Mail, MessageSquare, Users, Search, CheckCircle, AlertCircle, Loader2, Filter, Trash2, FolderArchive, Building, FileText, Layout, Plus, FolderPlus, Calendar, Hash, BarChart2, MousePointer2, UserMinus, RefreshCw, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
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

const MOCK_CAMPAIGNS = [
  {
    id: 7,
    name: 'Test-4',
    status: 'Inviata',
    date: '19 feb 2026 16:42',
    type: 'email',
    stats: {
      recipients: { count: 248, percentage: 100 },
      opens: { count: 76, percentage: 32.2 },
      clicks: { count: 5, percentage: 2.12 },
      unsubscribes: { count: 3, percentage: 1.27 },
      conversions: { count: 0, percentage: 0 }
    }
  },
  {
    id: 6,
    name: 'Test-3',
    status: 'Inviata',
    date: '7 nov 2025 12:08',
    type: 'email',
    stats: {
      recipients: { count: 292, percentage: 100 },
      opens: { count: 83, percentage: 30.63 },
      clicks: { count: 0, percentage: 0 },
      unsubscribes: { count: 2, percentage: 0.74 },
      conversions: { count: 0, percentage: 0 }
    }
  },
  {
    id: 3,
    name: 'Test-2',
    status: 'Inviata',
    date: '24 ott 2025 17:01',
    type: 'email',
    stats: {
      recipients: { count: 275, percentage: 100 },
      opens: { count: 92, percentage: 37.55 },
      clicks: { count: 0, percentage: 0 },
      unsubscribes: { count: 5, percentage: 2.04 },
      conversions: { count: 0, percentage: 0 }
    }
  },
  {
    id: 2,
    name: 'Test',
    status: 'Inviata',
    date: '20 giu 2025 15:54',
    type: 'email',
    stats: {
      recipients: { count: 172, percentage: 100 },
      opens: { count: 45, percentage: 27.95 },
      clicks: { count: 0, percentage: 0 },
      unsubscribes: { count: 6, percentage: 3.73 },
      conversions: { count: 0, percentage: 0 }
    }
  }
];

const Marketing = () => {
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'templates'
  const [campaignView, setCampaignView] = useState('list'); // 'list' | 'create'
  const [leads, setLeads] = useState([]);
  const [dataSource, setDataSource] = useState('crm'); // 'crm' | 'archive'
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageType, setMessageType] = useState('email'); // 'email', 'sms'
  const [filterStatus, setFilterStatus] = useState('');
  const [crmStatuses, setCrmStatuses] = useState([]);
  
  // Message content
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    sent: 0,
    failed: 0
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    fetchLeads();
    fetchSettings();
    setCurrentPage(1); // Reset page on data source change
  }, [dataSource]);

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter/tab change
  }, [searchTerm, filterStatus, messageType]);

  const fetchSettings = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.crm_statuses) {
          setCrmStatuses(data.crm_statuses);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    setSelectedLeads(new Set());
    try {
      const apiUrl = getApiUrl();
      const endpoint = dataSource === 'crm' ? '/api/crm/leads' : '/api/cards';
      const res = await fetch(`${apiUrl}${endpoint}`);
      if (res.ok) {
        const data = await res.json();
        // Normalizza i dati dell'archivio se necessario
        const normalizedData = data.map(item => ({
          ...item,
          contact_name: item.contact_name || item.full_name || '',
          business_name: item.business_name || '',
          email: item.email || '',
          phone: item.phone || ''
        }));
        setLeads(normalizedData);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.business_name && lead.business_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.contact_name && lead.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.phone && lead.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !filterStatus || lead.status === filterStatus;
    
    // Filter out leads without email or phone based on active tab
    const hasContactInfo = messageType === 'email' ? lead.email : lead.phone;
    
    return matchesSearch && matchesStatus && hasContactInfo;
  });

  // Paginazione
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);

  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const toggleLeadSelection = (id) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeads(newSelected);
  };

  const handleSend = async () => {
    if (selectedLeads.size === 0) {
      alert('Seleziona almeno un destinatario');
      return;
    }
    if (!message.trim()) {
      alert('Inserisci un messaggio');
      return;
    }
    if (messageType === 'email' && !subject.trim()) {
      alert('Inserisci un oggetto per l\'email');
      return;
    }

    setSending(true);
    try {
      const apiUrl = getApiUrl();
      const selectedData = leads.filter(l => selectedLeads.has(l.id));
      
      const payload = {
        type: messageType,
        recipients: selectedData.map(l => ({
          id: l.id,
          email: l.email ? l.email.toLowerCase() : '',
          phone: l.phone,
          name: l.contact_name || l.business_name
        })),
        subject: messageType === 'email' ? subject : undefined,
        message: message
      };

      const res = await fetch(`${apiUrl}/api/marketing/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok && result.success) {
        alert(result.message || `Invio completato! Inviati: ${result.sent}, Falliti: ${result.failed}`);
        setStats({ sent: result.sent, failed: result.failed });
        setMessage('');
        setSubject('');
        setSelectedLeads(new Set());
      } else {
        // Gestisce sia errori di rete/server che errori di invio parziali
        const errorDetail = result.errors ? result.errors.join('\n') : (result.error || 'Dettagli non disponibili');
        const errorMessage = `Si sono verificati degli errori durante l'invio.\n\n${result.message || ''}\n\nDettagli:\n${errorDetail}`;
        alert(errorMessage);
        setStats({ sent: result.sent || 0, failed: result.failed || selectedLeads.size });
      }
    } catch (err) {
      alert('Errore di connessione: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* HEADER UNIFORMATO */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Send className="h-6 w-6 text-blue-600" />
            Marketing
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {activeTab === 'campaigns' ? 'Gestione campagne Email e SMS massivi per i tuoi contatti.' : 'Gestione modelli predefiniti per le tue comunicazioni.'}
          </p>
        </div>
        
        {/* Stats in Header */}
        {activeTab === 'campaigns' && (stats.sent > 0 || stats.failed > 0) && (
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
              <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Inviati: {stats.sent}</span>
            </div>
            <div className="px-3 py-1 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
              <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Falliti: {stats.failed}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
        <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
          <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'campaigns' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}
          >
              <Layout className="h-3.5 w-3.5" />
              CAMPAGNE
          </button>
          <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'templates' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}
          >
              <FileText className="h-3.5 w-3.5" />
              MODELLI
          </button>
        </div>

        {activeTab === 'campaigns' && (
          <div className="flex items-center gap-3 ml-auto">
            <button
                onClick={() => setDataSource('crm')}
                className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm border transition-all ${dataSource === 'crm' ? 'bg-blue-600 text-white border-transparent shadow-blue-500/20' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700'}`}
            >
                <div className="flex items-center gap-2">
                  <Building className="h-3.5 w-3.5" />
                  SORGENTE CRM
                </div>
            </button>
            <button
                onClick={() => setDataSource('archive')}
                className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm border transition-all ${dataSource === 'archive' ? 'bg-blue-600 text-white border-transparent shadow-blue-500/20' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700'}`}
            >
                <div className="flex items-center gap-2">
                  <FolderArchive className="h-3.5 w-3.5" />
                  SORGENTE ARCHIVIO
                </div>
            </button>
          </div>
        )}

        {activeTab === 'templates' && (
          <button
            className="ml-auto px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold uppercase tracking-tight hover:bg-green-700 shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuovo Modello
          </button>
        )}
      </div>

      {activeTab === 'campaigns' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {campaignView === 'list' ? (
            <div className="space-y-6">
              {/* Toolbar Campagne */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold uppercase tracking-tight hover:bg-gray-200 transition-all border border-gray-200 dark:border-gray-600">
                    <FolderPlus className="h-4 w-4" />
                    Crea cartella
                  </button>
                  <button 
                    onClick={() => setCampaignView('create')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-tight hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    Crea campagna
                  </button>
                  <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold uppercase tracking-tight hover:bg-gray-50 border border-gray-200 dark:border-gray-700 transition-all">
                    <Mail className="h-4 w-4" />
                    Email
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold uppercase tracking-tight hover:bg-gray-50 border border-gray-200 dark:border-gray-700 transition-all">
                    <MessageSquare className="h-4 w-4" />
                    SMS
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 sm:min-w-[250px]">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="Cerca una campagna..."
                      className="block w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <select className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                    <option>Tutti gli stati</option>
                    <option>Inviata</option>
                    <option>Bozza</option>
                    <option>In corso</option>
                  </select>
                  
                  {/* Pagination Stats Info */}
                  <div className="flex items-center gap-4 ml-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                      1-{MOCK_CAMPAIGNS.length} of {MOCK_CAMPAIGNS.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">1</span>
                      <span className="text-xs text-gray-400">of 1 pages</span>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 disabled:opacity-30" disabled>
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 disabled:opacity-30" disabled>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista Campagne */}
              <div className="grid grid-cols-1 gap-4">
                {MOCK_CAMPAIGNS.map((campaign) => (
                  <div key={campaign.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      {/* Campaign Main Info */}
                      <div className="flex items-start gap-4 min-w-[200px]">
                        <div className={`p-3 rounded-2xl ${campaign.type === 'email' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'bg-green-50 text-green-600 dark:bg-green-900/30'}`}>
                          {campaign.type === 'email' ? <Mail className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{campaign.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-green-200 dark:border-green-800">
                              {campaign.status}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Inviata il {campaign.date}
                            </span>
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              #{campaign.id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Campaign Stats */}
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 border-l border-gray-100 dark:border-gray-700 pl-6">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Destinatari
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{campaign.stats.recipients.count}</span>
                            <span className="text-xs font-bold text-gray-400">{campaign.stats.recipients.percentage}%</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Aperture
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{campaign.stats.opens.count}</span>
                            <span className="text-xs font-bold text-blue-500">{campaign.stats.opens.percentage}%</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <MousePointer2 className="h-3 w-3" />
                            Clic
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{campaign.stats.clicks.count || '-'}</span>
                            <span className="text-xs font-bold text-blue-500">{campaign.stats.clicks.percentage}%</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <UserMinus className="h-3 w-3" />
                            Disiscrizioni
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{campaign.stats.unsubscribes.count}</span>
                            <span className="text-xs font-bold text-red-500">{campaign.stats.unsubscribes.percentage}%</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            Conversioni
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{campaign.stats.conversions.count || '-'}</span>
                            <span className="text-xs font-bold text-gray-400">{campaign.stats.conversions.percentage}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all">
                          <BarChart2 className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* CREATE VIEW - Existing UI */
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full flex items-center mb-4">
                <button 
                  onClick={() => setCampaignView('list')}
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tight"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Torna alla lista
                </button>
              </div>
              <div className="flex flex-col lg:flex-row gap-6 w-full">
                {/* COLONNA SINISTRA: COMPOSIZIONE (STILE CARD) */}
                <div className="w-full lg:w-[400px] xl:w-[450px] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col shrink-0 overflow-hidden">
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">Composizione</h2>
                      <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                        <button
                          onClick={() => { setMessageType('email'); setSelectedLeads(new Set()); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            messageType === 'email' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title="Email"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setMessageType('sms'); setSelectedLeads(new Set()); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            messageType === 'sms' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title="SMS"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {messageType === 'email' && (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Oggetto Email</label>
                          <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Oggetto della campagna..."
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                          Messaggio {messageType === 'email' ? 'Email' : 'SMS'}
                        </label>
                        <textarea
                          rows={14}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                          placeholder={messageType === 'email' ? "Corpo dell'email..." : "Testo dell'SMS..."}
                        />
                        <div className="mt-2 flex justify-between items-center px-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {messageType === 'sms' ? `${message.length} caratteri / ${Math.ceil(message.length / 160)} SMS` : ""}
                          </span>
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
                            {selectedLeads.size} Destinatari Selezionati
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleSend}
                      disabled={sending || selectedLeads.size === 0}
                      className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-white font-bold text-lg shadow-xl transition-all transform active:scale-95 ${
                        sending || selectedLeads.size === 0 
                          ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500' 
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/20'
                      }`}
                    >
                      {sending ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin" />
                          Invio in corso...
                        </>
                      ) : (
                        <>
                          <Send className="h-6 w-6" />
                          Esegui Campagna
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* COLONNA DESTRA: TABELLA DESTINATARI (STILE CARD) */}
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-0">
                  {/* BARRA FILTRI COERENTE */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* FILTRO STATO (SOLO PER CRM) */}
                        {dataSource === 'crm' && (
                          <select
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                          >
                            <option value="">Tutti gli stati</option>
                            {crmStatuses.map(status => (
                              <option key={status.id} value={status.id}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {/* RICERCA */}
                        <div className="relative flex-1 sm:min-w-[300px]">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                          </span>
                          <input
                            type="text"
                            placeholder="Cerca contatti..."
                            className="block w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>

                        {/* SELEZIONE RAPIDA */}
                        <button 
                          onClick={toggleSelectAll}
                          className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 rounded-xl text-xs font-bold uppercase tracking-tight hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all whitespace-nowrap shadow-sm"
                        >
                          {selectedLeads.size === filteredLeads.length ? 'Deseleziona' : 'Seleziona Tutti'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TABELLA COERENTE */}
                  <div className="flex-1 overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-separate border-spacing-0">
                      <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-20">
                        <tr>
                          <th className="px-6 py-4 text-left w-12 border-b border-gray-200 dark:border-gray-700">
                            <input
                              type="checkbox"
                              checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                              onChange={toggleSelectAll}
                              className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                            />
                          </th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Contatto</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">
                            {messageType === 'email' ? 'Recapito Email' : 'Recapito SMS'}
                          </th>
                          {dataSource === 'crm' && (
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Stato</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                        {loading ? (
                          <tr>
                            <td colSpan={dataSource === 'crm' ? 4 : 3} className="px-6 py-32 text-center">
                              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
                              <p className="text-gray-500 font-medium">Sincronizzazione contatti...</p>
                            </td>
                          </tr>
                        ) : filteredLeads.length === 0 ? (
                          <tr>
                            <td colSpan={dataSource === 'crm' ? 4 : 3} className="px-6 py-32 text-center">
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                                <Users className="h-10 w-10 text-gray-300" />
                              </div>
                              <p className="text-gray-500 font-medium">Nessun contatto trovato per i criteri impostati.</p>
                            </td>
                          </tr>
                        ) : (
                          currentLeads.map((lead) => (
                            <tr 
                              key={lead.id} 
                              className={`group hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all ${selectedLeads.has(lead.id) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                              onClick={() => toggleLeadSelection(lead.id)}
                            >
                              <td className="px-6 py-5 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedLeads.has(lead.id)}
                                  onChange={() => {}} 
                                  className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5 transition-transform group-hover:scale-110"
                                />
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap">
                                <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                  {lead.contact_name}
                                </div>
                                {lead.business_name && (
                                  <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter mt-0.5">{lead.business_name}</div>
                                )}
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg ${messageType === 'email' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'bg-green-50 text-green-600 dark:bg-green-900/30'}`}>
                                    {messageType === 'email' ? <Mail className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                                  </div>
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    {messageType === 'email' ? (lead.email || '-') : (lead.phone || '-')}
                                  </span>
                                </div>
                              </td>
                              {dataSource === 'crm' && (
                                <td className="px-6 py-5 whitespace-nowrap">
                                  <span className={`px-3 py-1 inline-flex text-[10px] leading-5 font-bold uppercase tracking-wider rounded-xl border ${
                                    COLOR_OPTIONS.find(c => c.value === crmStatuses.find(s => s.id === lead.status)?.color)?.classes || 'bg-gray-100 text-gray-800 border-gray-200'
                                  }`}>
                                    {crmStatuses.find(s => s.id === lead.status)?.label || lead.status}
                                  </span>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
                        >
                          Precedente
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
                        >
                          Successivo
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Mostrando <span className="font-bold">{indexOfFirstItem + 1}</span> a <span className="font-bold">{Math.min(indexOfLastItem, filteredLeads.length)}</span> di <span className="font-bold">{filteredLeads.length}</span> risultati
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-xl border border-gray-300 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-all"
                            >
                              &larr;
                            </button>
                            {[...Array(totalPages)].map((_, i) => {
                              if (totalPages > 5 && (i + 1 !== 1 && i + 1 !== totalPages && Math.abs(currentPage - (i + 1)) > 1)) {
                                if (i + 1 === 2 || i + 1 === totalPages - 1) return <span key={i} className="px-2 py-2 bg-white dark:bg-gray-800 border-gray-300 text-gray-500">...</span>;
                                return null;
                              }
                              return (
                                <button
                                  key={i}
                                  onClick={() => setCurrentPage(i + 1)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-bold transition-all ${
                                    currentPage === i + 1
                                      ? 'z-10 bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                                      : 'bg-white dark:bg-gray-700 border-gray-300 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  {i + 1}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-xl border border-gray-300 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-all"
                            >
                              &rarr;
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* SECTION: MODELLI */
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder per i modelli */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-full h-20 w-20 flex items-center justify-center">
                <FileText className="h-10 w-10 text-gray-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nessun Modello</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Inizia creando il tuo primo modello di messaggio.</p>
              </div>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                CREA MODELLO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketing;
