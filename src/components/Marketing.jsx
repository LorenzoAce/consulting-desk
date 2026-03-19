import React, { useState, useEffect } from 'react';
import { Send, Mail, MessageSquare, Users, Search, CheckCircle, AlertCircle, Loader2, Filter, Trash2, FolderArchive, Building } from 'lucide-react';
import { getApiUrl } from '../utils/api';

const Marketing = () => {
  const [leads, setLeads] = useState([]);
  const [dataSource, setDataSource] = useState('crm'); // 'crm' | 'archive'
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('email'); // 'email', 'sms'
  const [filterStatus, setFilterStatus] = useState('');
  
  // Message content
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    sent: 0,
    failed: 0
  });

  useEffect(() => {
    fetchLeads();
  }, [dataSource]);

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
    const hasContactInfo = activeTab === 'email' ? lead.email : lead.phone;
    
    return matchesSearch && matchesStatus && hasContactInfo;
  });

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
    if (activeTab === 'email' && !subject.trim()) {
      alert('Inserisci un oggetto per l\'email');
      return;
    }

    setSending(true);
    try {
      const apiUrl = getApiUrl();
      const selectedData = leads.filter(l => selectedLeads.has(l.id));
      
      const payload = {
        type: activeTab,
        recipients: selectedData.map(l => ({
          id: l.id,
          email: l.email,
          phone: l.phone,
          name: l.contact_name || l.business_name
        })),
        subject: activeTab === 'email' ? subject : undefined,
        message: message
      };

      const res = await fetch(`${apiUrl}/api/marketing/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Invio completato! Inviati: ${result.sent}, Falliti: ${result.failed}`);
        setStats({ sent: result.sent, failed: result.failed });
        // Clear message after success
        setMessage('');
        setSubject('');
        setSelectedLeads(new Set());
      } else {
        throw new Error('Errore durante l\'invio');
      }
    } catch (err) {
      alert('Errore: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* HEADER COERENTE */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Send className="h-6 w-6 text-blue-600" />
              Marketing
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gestione campagne Email e SMS massivi per i tuoi contatti.
            </p>
          </div>
          
          {/* Stats in Header */}
          {(stats.sent > 0 || stats.failed > 0) && (
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
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* COLONNA SINISTRA: COMPOSIZIONE (STILE FORM) */}
        <div className="w-full lg:w-[400px] xl:w-[450px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">Composizione</h2>
              <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <button
                  onClick={() => { setActiveTab('email'); setSelectedLeads(new Set()); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'email' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Email"
                >
                  <Mail className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setActiveTab('sms'); setSelectedLeads(new Set()); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'sms' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="SMS"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {activeTab === 'email' && (
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
                  Messaggio {activeTab === 'email' ? 'Email' : 'SMS'}
                </label>
                <textarea
                  rows={14}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder={activeTab === 'email' ? "Corpo dell'email..." : "Testo dell'SMS..."}
                />
                <div className="mt-2 flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {activeTab === 'sms' ? `${message.length} caratteri / ${Math.ceil(message.length / 160)} SMS` : ""}
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

        {/* COLONNA DESTRA: TABELLA DESTINATARI (STILE CRM/ARCHIVIO) */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 min-w-0">
          {/* BARRA FILTRI COERENTE */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* SORGENTE DATI */}
                <div className="flex p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                  <button
                    onClick={() => setDataSource('crm')}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                      dataSource === 'crm' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Building className="h-3.5 w-3.5" />
                    CRM
                  </button>
                  <button
                    onClick={() => setDataSource('archive')}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                      dataSource === 'archive' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FolderArchive className="h-3.5 w-3.5" />
                    ARCHIVIO
                  </button>
                </div>

                <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 hidden xl:block"></div>

                {/* FILTRO STATO (SOLO PER CRM) */}
                {dataSource === 'crm' && (
                  <select
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">Tutti gli stati</option>
                    <option value="new">Nuovo</option>
                    <option value="contacted">Contattato</option>
                    <option value="interested">Interessato</option>
                    <option value="client">Cliente</option>
                    <option value="closed">Chiuso</option>
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
                    className="block w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* SELEZIONE RAPIDA */}
                <button 
                  onClick={toggleSelectAll}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 rounded-xl text-xs font-bold uppercase tracking-tight hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all whitespace-nowrap"
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
                    {activeTab === 'email' ? 'Recapito Email' : 'Recapito SMS'}
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
                  filteredLeads.map((lead) => (
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
                          <div className={`p-1.5 rounded-lg ${activeTab === 'email' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'bg-green-50 text-green-600 dark:bg-green-900/30'}`}>
                            {activeTab === 'email' ? <Mail className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                          </div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {activeTab === 'email' ? (lead.email || '-') : (lead.phone || '-')}
                          </span>
                        </div>
                      </td>
                      {dataSource === 'crm' && (
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-[10px] leading-5 font-bold uppercase tracking-wider rounded-xl border ${
                            lead.status === 'client' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                            lead.status === 'interested' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' :
                            'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/30 dark:text-gray-400 dark:border-gray-600'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketing;
