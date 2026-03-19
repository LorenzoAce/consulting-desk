import React, { useState, useEffect } from 'react';
import { Send,import { Send, Mail, MessageSquare, Users, Search, CheckCircle, AlertCircle, Loader2, Filter, Trash2, FolderArchive, Building } from 'lucide-react';

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
    <div className="w-full h-full py-8">
      <div className="px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Send className="h-6 w-6 text-blue-600" />
          Marketing
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Invia comunicazioni massive via Email o SMS ai tuoi contatti.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-t border-gray-200 dark:border-gray-700 h-[calc(100vh-12rem)]">
        {/* Left Column: Message Composition (4/12) */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">1. Componi Messaggio</h2>
            
            <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-md mb-6">
              <button
                onClick={() => { setActiveTab('email'); setSelectedLeads(new Set()); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'email' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
              <button
                onClick={() => { setActiveTab('sms'); setSelectedLeads(new Set()); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'sms' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                SMS
              </button>
            </div>

            <div className="space-y-4">
              {activeTab === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Oggetto</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Oggetto della mail..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Messaggio</label>
                <textarea
                  rows={12}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder={activeTab === 'email' ? "Scrivi il corpo dell'email..." : "Scrivi il testo dell'SMS..."}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {activeTab === 'sms' ? `${message.length} caratteri (circa ${Math.ceil(message.length / 160)} SMS)` : ""}
                </p>
              </div>

              <button
                onClick={handleSend}
                disabled={sending || selectedLeads.size === 0}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md text-white font-semibold transition-all ${
                  sending || selectedLeads.size === 0 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                }`}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Invia a {selectedLeads.size} contatti
                  </>
                )}
              </button>
            </div>

            {/* Stats Summary */}
            {(stats.sent > 0 || stats.failed > 0) && (
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mt-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Riepilogo Ultimo Invio</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.sent}</p>
                    <p className="text-[10px] text-green-700 dark:text-green-300 uppercase font-bold tracking-wider">Inviati</p>
                  </div>
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
                    <p className="text-[10px] text-red-700 dark:text-red-300 uppercase font-bold tracking-wider">Falliti</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recipients Selection (8/12) */}
        <div className="lg:col-span-8 bg-gray-50 dark:bg-gray-900/50 flex flex-col h-full">
          <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. Seleziona Destinatari</h2>
              
              {/* Data Source Selector */}
              <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={() => setDataSource('crm')}
                  className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all uppercase tracking-wider ${
                    dataSource === 'crm' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <Building className="h-3.5 w-3.5" />
                  Da CRM
                </button>
                <button
                  onClick={() => setDataSource('archive')}
                  className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all uppercase tracking-wider ${
                    dataSource === 'archive' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <FolderArchive className="h-3.5 w-3.5" />
                  Da Archivio
                </button>
              </div>
            </div>

            {/* Filters & Bulk Selection */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="text"
                  placeholder="Cerca per nome, email o telefono..."
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {dataSource === 'crm' && (
                <select
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-md border border-blue-100 dark:border-blue-800">
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {selectedLeads.size} selezionati
                </span>
                <div className="h-4 w-px bg-blue-200 dark:bg-blue-800"></div>
                <button 
                  onClick={toggleSelectAll}
                  className="text-sm font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 uppercase tracking-tight"
                >
                  {selectedLeads.size === filteredLeads.length ? 'Deseleziona' : 'Seleziona Tutti'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Contatto</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    {activeTab === 'email' ? 'Email' : 'Telefono'}
                  </th>
                  {dataSource === 'crm' && (
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Stato</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={dataSource === 'crm' ? 4 : 3} className="px-6 py-24 text-center">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600 mb-4" />
                      <p className="text-base font-medium text-gray-500 dark:text-gray-400">Caricamento in corso...</p>
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={dataSource === 'crm' ? 4 : 3} className="px-6 py-24 text-center">
                      <div className="bg-gray-50 dark:bg-gray-700/20 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-base font-medium text-gray-500 dark:text-gray-400">Nessun contatto trovato con i filtri correnti.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-l-4 ${selectedLeads.has(lead.id) ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-500' : 'border-transparent'}`}
                      onClick={() => toggleLeadSelection(lead.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(lead.id)}
                          onChange={() => {}} // Handled by tr onClick
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {lead.contact_name}
                        </div>
                        {lead.business_name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-tighter">{lead.business_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                          {activeTab === 'email' ? (
                            <>
                              <Mail className="h-3.5 w-3.5 text-gray-400" />
                              {lead.email || <span className="italic text-gray-400">Nessuna email</span>}
                            </>
                          ) : (
                            <>
                              <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                              {lead.phone || <span className="italic text-gray-400">Nessun telefono</span>}
                            </>
                          )}
                        </div>
                      </td>
                      {dataSource === 'crm' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 inline-flex text-[10px] leading-5 font-bold uppercase tracking-wider rounded-full ${
                            lead.status === 'client' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            lead.status === 'interested' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
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
