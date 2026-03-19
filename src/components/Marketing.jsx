import React, { useState, useEffect } from 'react';
import { Send, Mail, MessageSquare, Users, Search, CheckCircle, AlertCircle, Loader2, Filter, Trash2, FolderArchive, Building, FileText, Layout, Plus, FolderPlus, Calendar, Hash, BarChart2, MousePointer2, UserMinus, RefreshCw, ChevronLeft, ChevronRight, MoreVertical, Pencil, Image as ImageIcon, Type, Columns, Footprints, Save, Eye, Palette, Trash } from 'lucide-react';
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

const Marketing = () => {
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'templates'
  const [campaignView, setCampaignView] = useState('list'); // 'list' | 'create'
  const [creationStep, setCreationStep] = useState('select-type'); // 'select-type' | 'details' | 'configure'
  const [campaignType, setCampaignType] = useState('email'); // 'email' | 'sms' | 'whatsapp'
  const [campaignName, setCampaignName] = useState('');
  const [campaignFolder, setCampaignFolder] = useState('');
  const [configSubView, setConfigSubView] = useState('main'); // 'main' | 'recipients' | 'content' | 'subject' | 'sender'
  
  const [leads, setLeads] = useState([]);
  const [dataSource, setDataSource] = useState('crm'); // 'crm' | 'archive'
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [crmStatuses, setCrmStatuses] = useState([]);
  const [smtpAccounts, setSmtpAccounts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [templateView, setTemplateView] = useState('list'); // 'list' | 'editor'
  const [currentTemplate, setCurrentTemplate] = useState({
    id: null,
    name: '',
    type: 'email',
    blocks: [], // { id, type, content }
    settings: {
      fontFamily: 'Inter, sans-serif',
      backgroundColor: '#f9fafb',
      contentWidth: '600px'
    }
  });
  const [editingId, setEditingId] = useState(null);
  const [editingBlockId, setEditingBlockId] = useState(null);
  
  // Message content
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sender, setSender] = useState('');
  
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
    initializeMarketing();
    fetchCampaigns();
    fetchTemplates();
    setCurrentPage(1); // Reset page on data source change
  }, [dataSource]);

  const fetchTemplates = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/marketing/templates`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleAddBlock = (type) => {
    const newBlock = {
      id: `block_${Date.now()}`,
      type: type,
      content: getDefaultContent(type)
    };
    setCurrentTemplate(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));
  };

  const getDefaultContent = (type) => {
    switch (type) {
      case 'header': return { logoUrl: '', title: 'Intestazione' };
      case 'text': return { text: 'Inserisci il tuo testo qui...' };
      case 'image': return { imageUrl: '', altText: 'Immagine' };
      case 'columns': return { left: 'Colonna Sinistra', right: 'Colonna Destra' };
      case 'footer': return { companyInfo: 'Info Azienda', socialLinks: [] };
      default: return {};
    }
  };

  const handleSaveTemplate = async () => {
    if (!currentTemplate.name) {
      alert('Inserisci un nome per il modello');
      return;
    }
    try {
      const apiUrl = getApiUrl();
      const isUpdate = !!currentTemplate.id;
      const endpoint = isUpdate ? `/api/marketing/templates/${currentTemplate.id}` : '/api/marketing/templates';
      const method = isUpdate ? 'PUT' : 'POST';
      
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTemplate)
      });
      
      if (res.ok) {
        alert('Modello salvato con successo!');
        setTemplateView('list');
        fetchTemplates();
      }
    } catch (err) {
      console.error('Error saving template:', err);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Vuoi eliminare questo modello?')) return;
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/marketing/templates/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  const initializeMarketing = async () => {
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/marketing/init`, { method: 'POST' });
    } catch (error) {
      console.error('Error initializing marketing:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/marketing/campaigns`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.crm_statuses) {
          setCrmStatuses(data.crm_statuses);
        }
        if (data.marketing_settings && data.marketing_settings.smtp_accounts) {
          setSmtpAccounts(data.marketing_settings.smtp_accounts);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter/tab change
  }, [searchTerm, filterStatus, campaignType]);

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
    const hasContactInfo = campaignType === 'email' ? lead.email : lead.phone;
    
    return matchesSearch && matchesStatus && hasContactInfo;
  });

  const filteredCampaigns = campaigns.filter(campaign => {
    return campaign.type === campaignType;
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
    // Check if we are trying to re-send an already sent campaign
    const existingCampaign = campaigns.find(c => c.id === editingId);
    if (existingCampaign && existingCampaign.status === 'Inviata') {
      alert('Questa campagna è già stata inviata.');
      return;
    }

    if (selectedLeads.size === 0) {
      alert('Seleziona almeno un destinatario');
      return;
    }
    if (!message.trim()) {
      alert('Inserisci un messaggio');
      return;
    }
    if (campaignType === 'email' && !subject.trim()) {
      alert('Inserisci un oggetto per l\'email');
      return;
    }

    setSending(true);
    try {
      const apiUrl = getApiUrl();
      const selectedData = leads.filter(l => selectedLeads.has(l.id));
      
      const payload = {
        type: campaignType,
        senderId: sender,
        recipients: selectedData.map(l => ({
          id: l.id,
          email: l.email ? l.email.toLowerCase() : '',
          phone: l.phone,
          name: l.contact_name || l.business_name
        })),
        subject: campaignType === 'email' ? subject : undefined,
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
        
        // Salva o aggiorna la campagna nel database come "Inviata"
        try {
          const campaignPayload = {
            name: campaignName,
            folder: campaignFolder,
            type: campaignType,
            sender: sender,
            recipients: Array.from(selectedLeads),
            subject: subject,
            message: message,
            status: 'Inviata',
            stats: {
              recipients: { count: selectedLeads.size, percentage: 100 },
              opens: { count: 0, percentage: 0 },
              clicks: { count: 0, percentage: 0 },
              unsubscribes: { count: 0, percentage: 0 },
              conversions: { count: 0, percentage: 0 }
            }
          };

          const endpoint = editingId 
            ? `${apiUrl}/api/marketing/campaigns/${editingId}`
            : `${apiUrl}/api/marketing/campaigns`;
          
          await fetch(endpoint, {
            method: editingId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(campaignPayload)
          });
          
          fetchCampaigns();
        } catch (saveErr) {
          console.error('Error saving sent campaign:', saveErr);
        }

        resetCreationState();
        setCampaignView('list');
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

  const handleDirectSend = async (campaign) => {
    if (campaign.status === 'Inviata') {
      alert('Questa campagna è già stata inviata.');
      return;
    }
    if (!campaign.recipients || campaign.recipients.length === 0) {
      alert('Questa campagna non ha destinatari.');
      return;
    }
    if (!campaign.message) {
      alert('Questa campagna non ha un messaggio.');
      return;
    }
    if (!window.confirm(`Vuoi inviare la campagna "${campaign.name}" a ${campaign.recipients.length} destinatari?`)) return;

    setSending(true);
    try {
      const apiUrl = getApiUrl();
      
      // Fetch full lead data for the recipients in this campaign
      // Note: campaign.recipients stores IDs
      const sourceEndpoint = dataSource === 'crm' ? '/api/crm/leads' : '/api/cards';
      const leadsRes = await fetch(`${apiUrl}${sourceEndpoint}`);
      const allLeads = await leadsRes.json();
      
      const recipientIds = new Set(campaign.recipients);
      const selectedData = allLeads.filter(l => recipientIds.has(l.id));

      const payload = {
        type: campaign.type,
        senderId: campaign.sender_id,
        recipients: selectedData.map(l => ({
          id: l.id,
          email: l.email ? l.email.toLowerCase() : '',
          phone: l.phone,
          name: l.contact_name || l.business_name || l.full_name
        })),
        subject: campaign.type === 'email' ? campaign.subject : undefined,
        message: campaign.message
      };

      const res = await fetch(`${apiUrl}/api/marketing/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok && result.success) {
        alert(result.message || 'Invio completato con successo!');
        // Update campaign status to 'Inviata' in DB and set initial stats
        await fetch(`${apiUrl}/api/marketing/campaigns/${campaign.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...campaign, 
            status: 'Inviata',
            stats: {
              recipients: { count: selectedData.length, percentage: 100 },
              opens: { count: 0, percentage: 0 },
              clicks: { count: 0, percentage: 0 },
              unsubscribes: { count: 0, percentage: 0 },
              conversions: { count: 0, percentage: 0 }
            }
          })
        });
        fetchCampaigns();
      } else {
        const errorDetail = result.errors ? result.errors.join('\n') : (result.error || 'Dettagli non disponibili');
        alert(`Si sono verificati degli errori durante l'invio:\n\n${errorDetail}`);
      }
    } catch (err) {
      console.error('Error in direct send:', err);
      alert('Errore di connessione durante l\'invio.');
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const apiUrl = getApiUrl();
      
      // Se stiamo modificando una campagna già inviata, non permettiamo di salvarla come bozza
      const existingCampaign = campaigns.find(c => c.id === editingId);
      if (existingCampaign && existingCampaign.status === 'Inviata') {
        alert('Questa campagna è già stata inviata e non può essere riportata in bozza.');
        return;
      }

      const payload = {
        name: campaignName,
        folder: campaignFolder,
        type: campaignType,
        sender: sender,
        recipients: Array.from(selectedLeads),
        subject: subject,
        message: message,
        status: 'Bozza'
      };

      const endpoint = editingId 
        ? `${apiUrl}/api/marketing/campaigns/${editingId}`
        : `${apiUrl}/api/marketing/campaigns`;
      
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(editingId ? 'Campagna aggiornata con successo!' : 'Bozza salvata con successo!');
        setCampaignView('list');
        fetchCampaigns();
        resetCreationState();
      } else {
        const error = await res.json();
        alert('Errore nel salvataggio: ' + (error.message || 'Errore sconosciuto'));
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      alert('Errore di connessione durante il salvataggio.');
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa campagna?')) return;
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/marketing/campaigns/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchCampaigns();
      } else {
        alert('Errore durante l\'eliminazione della campagna.');
      }
    } catch (err) {
      console.error('Error deleting campaign:', err);
    }
  };

  const handleEditCampaign = (campaign) => {
    setEditingId(campaign.id);
    setCampaignName(campaign.name);
    setCampaignFolder(campaign.folder || '');
    setCampaignType(campaign.type);
    setSender(campaign.sender_id || '');
    setSubject(campaign.subject || '');
    setMessage(campaign.message || '');
    
    // Convert recipients from stored JSON (ids) to Set
    const recipientIds = Array.isArray(campaign.recipients) ? campaign.recipients : [];
    setSelectedLeads(new Set(recipientIds));
    
    setCampaignView('create');
    setCreationStep('configure'); // Go directly to configuration or details? Configure seems better for editing.
    setConfigSubView('main');
  };

  const resetCreationState = () => {
    setEditingId(null);
    setCampaignName('');
    setCampaignFolder('');
    setCampaignType('email');
    setSender('');
    setSubject('');
    setMessage('');
    setSelectedLeads(new Set());
    setCreationStep('select-type');
    setConfigSubView('main');
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
                onClick={() => setCampaignType('email')}
                className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm border transition-all ${campaignType === 'email' ? 'bg-blue-600 text-white border-transparent shadow-blue-500/20' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700'}`}
            >
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  EMAIL
                </div>
            </button>
            <button
                onClick={() => setCampaignType('sms')}
                className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm border transition-all ${campaignType === 'sms' ? 'bg-blue-600 text-white border-transparent shadow-blue-500/20' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700'}`}
            >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5" />
                  SMS
                </div>
            </button>
            <button
                onClick={() => setCampaignType('whatsapp')}
                className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm border transition-all ${campaignType === 'whatsapp' ? 'bg-blue-600 text-white border-transparent shadow-blue-500/20' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700'}`}
            >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5" />
                  WHATSAPP
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
                  <button 
                    onClick={() => { resetCreationState(); setCampaignView('create'); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-tight hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    Crea campagna
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
                  <select className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                    <option className="dark:bg-gray-900">Tutti gli stati</option>
                    <option className="dark:bg-gray-900">Inviata</option>
                    <option className="dark:bg-gray-900">Bozza</option>
                    <option className="dark:bg-gray-900">In corso</option>
                  </select>
                  
                  {/* Pagination Stats Info */}
                  <div className="flex items-center gap-4 ml-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                      1-{filteredCampaigns.length} of {filteredCampaigns.length}
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
                {filteredCampaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      {/* Campaign Main Info */}
                      <div className="flex items-start gap-4 min-w-[200px]">
                        <div className={`p-3 rounded-2xl ${
                          campaign.type === 'email' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 
                          campaign.type === 'whatsapp' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 
                          'bg-green-50 text-green-600 dark:bg-green-900/30'
                        }`}>
                          {campaign.type === 'email' ? <Mail className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{campaign.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${
                              campaign.status === 'Bozza' 
                                ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                                : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                            }`}>
                              {campaign.status}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {campaign.status === 'Bozza' ? 'Creata il ' : 'Inviata il '}{new Date(campaign.created_at).toLocaleDateString('it-IT')}
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
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{campaign.stats?.recipients?.count || 0}</span>
                            <span className="text-xs font-bold text-gray-400">{campaign.stats?.recipients?.percentage || 0}%</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Aperture
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{campaign.stats?.opens?.count || 0}</span>
                            <span className="text-xs font-bold text-blue-500">{campaign.stats?.opens?.percentage || 0}%</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <MousePointer2 className="h-3 w-3" />
                            Clic
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{campaign.stats?.clicks?.count || '-'}</span>
                            <span className="text-xs font-bold text-blue-500">{campaign.stats?.clicks?.percentage || 0}%</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <UserMinus className="h-3 w-3" />
                            Disiscrizioni
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{campaign.stats?.unsubscribes?.count || 0}</span>
                            <span className="text-xs font-bold text-red-500">{campaign.stats?.unsubscribes?.percentage || 0}%</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            Conversioni
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{campaign.stats?.conversions?.count || '-'}</span>
                            <span className="text-xs font-bold text-gray-400">{campaign.stats?.conversions?.percentage || 0}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all" title="Statistiche">
                          <BarChart2 className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDirectSend(campaign)}
                          disabled={campaign.status === 'Inviata'}
                          className={`p-2 rounded-xl transition-all ${
                            campaign.status === 'Inviata' 
                              ? 'text-gray-200 dark:text-gray-700 cursor-not-allowed' 
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                          }`}
                          title={campaign.status === 'Inviata' ? 'Campagna già inviata' : 'Invia Campagna'}
                        >
                          <Send className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleEditCampaign(campaign)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all" 
                          title="Modifica"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all" 
                          title="Elimina"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredCampaigns.length === 0 && (
                  <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">Nessuna campagna {campaignType.toUpperCase()} trovata.</p>
                    <button 
                      onClick={() => { setCampaignView('create'); setCreationStep('select-type'); setConfigSubView('main'); }}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                    >
                      Crea la tua prima campagna {campaignType.toUpperCase()}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CREATE VIEW - Step-by-step flow */
            <div className="space-y-8">
              {/* Back Button and Progress */}
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => {
                    if (creationStep === 'select-type') {
                      resetCreationState();
                      setCampaignView('list');
                    } else if (creationStep === 'details') {
                      setCreationStep('select-type');
                    } else if (creationStep === 'configure') {
                      setCreationStep('details');
                    }
                  }}
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tight"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {creationStep === 'select-type' ? 'Torna alla lista' : 'Indietro'}
                </button>
                
                {/* Progress Indicators */}
                <div className="flex items-center gap-4">
                  {[
                    { step: 'select-type', label: 'Tipo' },
                    { step: 'details', label: 'Dettagli' },
                    { step: 'configure', label: 'Configura' }
                  ].map((s, idx) => (
                    <React.Fragment key={s.step}>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          creationStep === s.step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                          creationStep === s.step ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                          {s.label}
                        </span>
                      </div>
                      {idx < 2 && <div className="w-8 h-px bg-gray-200"></div>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {creationStep === 'select-type' && (
                <div className="max-w-4xl mx-auto py-12 animate-in fade-in zoom-in-95 duration-300">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Che tipo di campagna vuoi creare?</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { id: 'email', label: 'Email', icon: Mail, desc: 'Invia newsletter e comunicazioni ricche.', color: 'blue' },
                      { id: 'sms', label: 'SMS', icon: MessageSquare, desc: 'Messaggi rapidi e diretti sul cellulare.', color: 'green' },
                      { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, desc: 'Ingaggia i clienti su WhatsApp.', color: 'emerald' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { setCampaignType(t.id); setCreationStep('details'); }}
                        className="group bg-white dark:bg-gray-800 p-8 rounded-3xl border-2 border-transparent hover:border-blue-500 shadow-xl hover:shadow-2xl transition-all text-center space-y-4"
                      >
                        <div className={`w-20 h-20 mx-auto rounded-2xl bg-${t.color}-50 dark:bg-${t.color}-900/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <t.icon className={`h-10 w-10 text-${t.color}-600 dark:text-${t.color}-400`} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.label}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {creationStep === 'details' && (
                <div className="max-w-xl mx-auto py-12 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 space-y-8">
                    <div className="text-center">
                      <div className="inline-flex p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 mb-4">
                        {campaignType === 'email' ? <Mail className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dettagli Campagna {campaignType.toUpperCase()}</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Nome della campagna</label>
                        <input
                          type="text"
                          value={campaignName}
                          onChange={(e) => setCampaignName(e.target.value)}
                          placeholder="es. Promozione Primavera 2026"
                          className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Seleziona cartella</label>
                        <select
                          value={campaignFolder}
                          onChange={(e) => setCampaignFolder(e.target.value)}
                          className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                        >
                          <option value="">Nessuna cartella (Root)</option>
                          <option value="promozioni">Promozioni</option>
                          <option value="newsletter">Newsletter</option>
                          <option value="test">Test</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => { if (campaignName.trim()) setCreationStep('configure'); }}
                      disabled={!campaignName.trim()}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/20 transition-all transform active:scale-95"
                    >
                      Continua alla configurazione
                    </button>
                  </div>
                </div>
              )}

              {creationStep === 'configure' && (
                <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {configSubView === 'main' ? (
                    <div className="grid grid-cols-1 gap-6">
                      {/* Config Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{campaignName}</h2>
                            <button 
                              onClick={() => setCreationStep('details')}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                              title="Modifica nome e cartella"
                            >
                              <Pencil className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1">
                              <FolderArchive className="h-3 w-3" />
                              {campaignFolder || 'Nessuna cartella'}
                            </span>
                            <span className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1">
                              {campaignType === 'email' ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                              {campaignType.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {(!editingId || campaigns.find(c => c.id === editingId)?.status !== 'Inviata') && (
                            <>
                              <button
                                onClick={handleSaveDraft}
                                className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-bold uppercase tracking-tight hover:bg-gray-50 transition-all"
                              >
                                Salva Bozza
                              </button>
                              <button
                                onClick={handleSend}
                                disabled={sending || selectedLeads.size === 0 || !message.trim()}
                                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-tight hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2"
                              >
                                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                Invia Campagna
                              </button>
                            </>
                          )}
                          {editingId && campaigns.find(c => c.id === editingId)?.status === 'Inviata' && (
                            <div className="px-6 py-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl font-bold uppercase tracking-tight border border-green-100 dark:border-green-800 flex items-center gap-2">
                              <CheckCircle className="h-5 w-5" />
                              Campagna Inviata
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CONFIGURATION SECTIONS */}
                      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                        
                        {/* Mittente */}
                        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                              <Building className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mittente</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {sender ? `Mittente selezionato: ${smtpAccounts.find(a => a.id === sender)?.label || sender}` : 'Chi invia questa campagna email?'}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setConfigSubView('sender')}
                            className="px-6 py-2 border-2 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold uppercase tracking-tight hover:bg-blue-50 transition-all"
                          >
                            {sender ? 'Cambia mittente' : 'Seleziona mittente'}
                          </button>
                        </div>

                        {/* Destinatari */}
                        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                              <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Destinatari</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Le persone che ricevono la tua campagna ({selectedLeads.size} selezionati)</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setConfigSubView('recipients')}
                            className="px-6 py-2 border-2 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold uppercase tracking-tight hover:bg-blue-50 transition-all"
                          >
                            Aggiungi destinatari
                          </button>
                        </div>

                        {/* Oggetto (Solo Email) */}
                        {campaignType === 'email' && (
                          <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                            <div className="flex gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center shrink-0">
                                <FileText className="h-6 w-6 text-yellow-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Oggetto</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {subject ? `Oggetto: ${subject}` : 'Aggiungi un oggetto a questa campagna.'}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setConfigSubView('subject')}
                              className="px-6 py-2 border-2 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold uppercase tracking-tight hover:bg-blue-50 transition-all"
                            >
                              {subject ? 'Modifica oggetto' : 'Aggiungi oggetto'}
                            </button>
                          </div>
                        )}

                        {/* Ideazione / Contenuto */}
                        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                              <Layout className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ideazione</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Crea contenuto email</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setConfigSubView('content')}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-tight hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                          >
                            Inizia a progettare
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : configSubView === 'recipients' ? (
                    /* RECIPIENTS SUB-VIEW */
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => setConfigSubView('main')}
                          className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tight"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Torna alla configurazione
                        </button>
                        <div className="flex items-center gap-3">
                          <button
                              onClick={() => setDataSource('crm')}
                              className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm border transition-all ${dataSource === 'crm' ? 'bg-blue-600 text-white border-transparent' : 'bg-white text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200'}`}
                          >
                              SORGENTE CRM
                          </button>
                          <button
                              onClick={() => setDataSource('archive')}
                              className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm border transition-all ${dataSource === 'archive' ? 'bg-blue-600 text-white border-transparent' : 'bg-white text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200'}`}
                          >
                              SORGENTE ARCHIVIO
                          </button>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Filters and Table (Same as before but inside config) */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-1">
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
                            <button 
                              onClick={toggleSelectAll}
                              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold uppercase tracking-tight hover:bg-blue-100 transition-all"
                            >
                              {selectedLeads.size === filteredLeads.length ? 'Deseleziona' : 'Seleziona Tutti'}
                            </button>
                          </div>
                        </div>
                        
                        <div className="max-h-[500px] overflow-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                              <tr>
                                <th className="px-6 py-4 text-left w-12"><input type="checkbox" checked={selectedLeads.size === filteredLeads.length} onChange={toggleSelectAll} className="rounded border-gray-300 dark:border-gray-600 text-blue-600 h-5 w-5 bg-white dark:bg-gray-800" /></th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Contatto</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Recapito</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {currentLeads.map((lead) => (
                                <tr key={lead.id} onClick={() => toggleLeadSelection(lead.id)} className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedLeads.has(lead.id) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                  <td className="px-6 py-4"><input type="checkbox" checked={selectedLeads.has(lead.id)} onChange={() => {}} className="rounded border-gray-300 dark:border-gray-600 text-blue-600 h-5 w-5 bg-white dark:bg-gray-800" /></td>
                                  <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{lead.contact_name}</td>
                                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{campaignType === 'email' ? lead.email : lead.phone}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : configSubView === 'content' ? (
                    /* CONTENT SUB-VIEW */
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => setConfigSubView('main')}
                          className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tight"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Torna alla configurazione
                        </button>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Contenuto del messaggio ({campaignType})</label>
                        <textarea
                          rows={15}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                          placeholder={`Inserisci il testo per la tua campagna ${campaignType}...`}
                        />
                        <div className="mt-4 flex justify-end">
                          <button 
                            onClick={() => setConfigSubView('main')}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-tight hover:bg-blue-700"
                          >
                            Salva e torna
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : configSubView === 'subject' ? (
                    /* SUBJECT SUB-VIEW */
                    <div className="max-w-xl mx-auto py-12 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 space-y-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Oggetto della Campagna</h3>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Inserisci l'oggetto</label>
                          <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="es. Scopri le nuove offerte di Marzo"
                          />
                        </div>
                        <button 
                          onClick={() => setConfigSubView('main')}
                          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-tight hover:bg-blue-700"
                        >
                          Salva Oggetto
                        </button>
                      </div>
                    </div>
                  ) : configSubView === 'sender' ? (
                    /* SENDER SUB-VIEW */
                    <div className="max-w-2xl mx-auto py-12 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Seleziona Mittente</h3>
                          <button 
                            onClick={() => setConfigSubView('main')}
                            className="text-sm font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tight"
                          >
                            Annulla
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          {smtpAccounts.length > 0 ? (
                            smtpAccounts.map((account) => (
                              <button
                                key={account.id}
                                onClick={() => { setSender(account.id); setConfigSubView('main'); }}
                                className={`w-full p-6 text-left rounded-2xl border-2 transition-all flex items-center justify-between group ${
                                  sender === account.id 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                    : 'border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-800'
                                }`}
                              >
                                <div>
                                  <div className="font-bold text-gray-900 dark:text-white">{account.label}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{account.user} ({account.host})</div>
                                </div>
                                {sender === account.id && <CheckCircle className="h-6 w-6 text-blue-500" />}
                              </button>
                            ))
                          ) : (
                            <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                              <p className="text-sm text-gray-500 dark:text-gray-400">Nessun account SMTP configurato.</p>
                              <p className="text-xs text-gray-400 mt-1">Vai in Impostazioni {'>'} Marketing per aggiungerne uno.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* SECTION: MODELLI */
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {templateView === 'list' ? (
            <div className="space-y-6">
              {/* Toolbar Modelli */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => {
                    setCurrentTemplate({
                      id: null,
                      name: '',
                      type: 'email',
                      blocks: [],
                      settings: { fontFamily: 'Inter, sans-serif', backgroundColor: '#f9fafb', contentWidth: '600px' }
                    });
                    setTemplateView('editor');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-tight hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  <Plus className="h-4 w-4" />
                  Nuovo Modello
                </button>
              </div>

              {/* Grid Modelli */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div key={template.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-2xl transition-all">
                    <div className="h-40 bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative overflow-hidden">
                      {template.thumbnail ? (
                        <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                      )}
                      <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                        <button 
                          onClick={() => { setCurrentTemplate(template); setTemplateView('editor'); }}
                          className="p-3 bg-white text-blue-600 rounded-2xl shadow-xl hover:scale-110 transition-all"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-3 bg-white text-red-600 rounded-2xl shadow-xl hover:scale-110 transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{template.name}</h3>
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                          {template.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ultima modifica: {new Date(template.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}

                {templates.length === 0 && (
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px] col-span-full">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-full h-20 w-20 flex items-center justify-center">
                      <FileText className="h-10 w-10 text-gray-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nessun Modello</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Inizia creando il tuo primo modello di messaggio.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setCurrentTemplate({
                          id: null,
                          name: '',
                          type: 'email',
                          blocks: [],
                          settings: { fontFamily: 'Inter, sans-serif', backgroundColor: '#f9fafb', contentWidth: '600px' }
                        });
                        setTemplateView('editor');
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      CREA MODELLO
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TEMPLATE EDITOR */
            <div className="h-[calc(100vh-12rem)] flex gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Sidebar: Blocks & Settings */}
              <div className="w-80 flex flex-col gap-6 overflow-auto pr-2">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-xs">Blocchi</h3>
                    <Palette className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { type: 'header', icon: Layout, label: 'Header' },
                      { type: 'text', icon: Type, label: 'Testo' },
                      { type: 'image', icon: ImageIcon, label: 'Immagine' },
                      { type: 'columns', icon: Columns, label: 'Colonne' },
                      { type: 'footer', icon: Footprints, label: 'Footer' }
                    ].map(b => (
                      <button
                        key={b.type}
                        onClick={() => handleAddBlock(b.type)}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-transparent hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                      >
                        <b.icon className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 group-hover:text-blue-600">{b.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 space-y-6">
                  <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-xs">Impostazioni</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome Modello</label>
                      <input 
                        type="text"
                        value={currentTemplate.name}
                        onChange={(e) => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Nome modello..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Font Family</label>
                      <select 
                        value={currentTemplate.settings.fontFamily}
                        onChange={(e) => setCurrentTemplate(prev => ({ ...prev, settings: { ...prev.settings, fontFamily: e.target.value } }))}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="Inter, sans-serif">Inter</option>
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="'Courier New', monospace">Courier New</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Area: Preview / Editor Canvas */}
              <div className="flex-1 flex flex-col gap-6">
                {/* Editor Header */}
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => setTemplateView('list')}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 uppercase tracking-tight"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Indietro
                  </button>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleSaveTemplate}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-2xl text-xs font-bold uppercase tracking-tight hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                    >
                      <Save className="h-4 w-4" />
                      Salva Modello
                    </button>
                  </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-3xl overflow-auto p-12 flex flex-col items-center border border-gray-200 dark:border-gray-700 shadow-inner">
                  <div 
                    className="bg-white shadow-2xl min-h-full transition-all duration-500 overflow-hidden text-gray-900"
                    style={{ 
                      width: currentTemplate.settings.contentWidth,
                      fontFamily: currentTemplate.settings.fontFamily,
                      backgroundColor: currentTemplate.settings.backgroundColor
                    }}
                  >
                    {currentTemplate.blocks.length === 0 ? (
                      <div className="h-60 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 m-8 rounded-2xl">
                        <Plus className="h-8 w-8 mb-2" />
                        <p className="text-sm font-bold uppercase tracking-widest">Aggiungi blocchi dalla sidebar</p>
                      </div>
                    ) : (
                      currentTemplate.blocks.map((block, index) => (
                        <div 
                          key={block.id} 
                          className={`group relative border-2 border-transparent hover:border-blue-400 transition-all cursor-pointer`}
                          onClick={() => setEditingBlockId(block.id)}
                        >
                          {/* Block Actions */}
                          <div className="absolute -right-12 top-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const newBlocks = currentTemplate.blocks.filter(b => b.id !== block.id);
                                setCurrentTemplate(prev => ({ ...prev, blocks: newBlocks }));
                              }}
                              className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Block Content Rendering */}
                          <div className="p-4">
                            {block.type === 'header' && (
                              <div className="text-center space-y-4 py-8 border-b border-gray-100">
                                {block.content.logoUrl ? (
                                  <img src={block.content.logoUrl} alt="Logo" className="h-12 mx-auto" />
                                ) : (
                                  <div className="w-16 h-16 bg-gray-50 mx-auto rounded-full flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-gray-300" />
                                  </div>
                                )}
                                <h1 className="text-2xl font-bold text-gray-900">{block.content.title}</h1>
                              </div>
                            )}

                            {block.type === 'text' && (
                              <div className="py-4 px-4 text-gray-800 leading-relaxed whitespace-pre-wrap">
                                {block.content.text}
                              </div>
                            )}

                            {block.type === 'image' && (
                              <div className="py-4">
                                {block.content.imageUrl ? (
                                  <img src={block.content.imageUrl} alt={block.content.altText} className="w-full rounded-xl" />
                                ) : (
                                  <div className="w-full h-40 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                                    <ImageIcon className="h-8 w-8 mr-2" />
                                    <span>Seleziona Immagine</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {block.type === 'columns' && (
                              <div className="grid grid-cols-2 gap-8 py-8 border-y border-gray-100">
                                <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 whitespace-pre-wrap text-gray-800">{block.content.left}</div>
                                <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 whitespace-pre-wrap text-gray-800">{block.content.right}</div>
                              </div>
                            )}

                            {block.type === 'footer' && (
                              <div className="py-8 border-t border-gray-100 mt-8 text-center text-gray-400 text-xs space-y-4">
                                <p className="whitespace-pre-wrap">{block.content.companyInfo}</p>
                                <div className="flex justify-center gap-4">
                                  <div className="w-6 h-6 rounded-full bg-gray-50"></div>
                                  <div className="w-6 h-6 rounded-full bg-gray-50"></div>
                                  <div className="w-6 h-6 rounded-full bg-gray-50"></div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Block Editor Overlay (Inline-ish) */}
                          {editingBlockId === block.id && (
                            <div className="absolute inset-0 bg-white dark:bg-gray-800 z-10 flex flex-col p-6 animate-in zoom-in-95 duration-200 shadow-2xl overflow-auto">
                              <div className="flex items-center justify-between mb-6">
                                <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-xs">Modifica Blocco {block.type}</h4>
                                <button onClick={() => setEditingBlockId(null)} className="px-4 py-1 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase tracking-tight hover:bg-blue-700 transition-all">Chiudi</button>
                              </div>
                              <div className="flex-1 space-y-4">
                                {block.type === 'header' && (
                                  <>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">URL Logo</label>
                                      <input 
                                        type="text" 
                                        value={block.content.logoUrl} 
                                        onChange={(e) => {
                                          const newBlocks = currentTemplate.blocks.map(b => b.id === block.id ? { ...b, content: { ...b.content, logoUrl: e.target.value } } : b);
                                          setCurrentTemplate(prev => ({ ...prev, blocks: newBlocks }));
                                        }}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                        placeholder="https://..."
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Titolo Intestazione</label>
                                      <input 
                                        type="text" 
                                        value={block.content.title} 
                                        onChange={(e) => {
                                          const newBlocks = currentTemplate.blocks.map(b => b.id === block.id ? { ...b, content: { ...b.content, title: e.target.value } } : b);
                                          setCurrentTemplate(prev => ({ ...prev, blocks: newBlocks }));
                                        }}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                      />
                                    </div>
                                  </>
                                )}
                                {block.type === 'text' && (
                                  <textarea 
                                    rows={8}
                                    value={block.content.text}
                                    onChange={(e) => {
                                      const newBlocks = currentTemplate.blocks.map(b => b.id === block.id ? { ...b, content: { ...b.content, text: e.target.value } } : b);
                                      setCurrentTemplate(prev => ({ ...prev, blocks: newBlocks }));
                                    }}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                  />
                                )}
                                {block.type === 'image' && (
                                  <>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">URL Immagine</label>
                                      <input 
                                        type="text" 
                                        value={block.content.imageUrl} 
                                        onChange={(e) => {
                                          const newBlocks = currentTemplate.blocks.map(b => b.id === block.id ? { ...b, content: { ...b.content, imageUrl: e.target.value } } : b);
                                          setCurrentTemplate(prev => ({ ...prev, blocks: newBlocks }));
                                        }}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                        placeholder="https://..."
                                      />
                                    </div>
                                  </>
                                )}
                                {block.type === 'columns' && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sinistra</label>
                                      <textarea 
                                        value={block.content.left}
                                        onChange={(e) => {
                                          const newBlocks = currentTemplate.blocks.map(b => b.id === block.id ? { ...b, content: { ...b.content, left: e.target.value } } : b);
                                          setCurrentTemplate(prev => ({ ...prev, blocks: newBlocks }));
                                        }}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Destra</label>
                                      <textarea 
                                        value={block.content.right}
                                        onChange={(e) => {
                                          const newBlocks = currentTemplate.blocks.map(b => b.id === block.id ? { ...b, content: { ...b.content, right: e.target.value } } : b);
                                          setCurrentTemplate(prev => ({ ...prev, blocks: newBlocks }));
                                        }}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                      />
                                    </div>
                                  </div>
                                )}
                                {block.type === 'footer' && (
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Info Azienda</label>
                                    <textarea 
                                      value={block.content.companyInfo}
                                      onChange={(e) => {
                                        const newBlocks = currentTemplate.blocks.map(b => b.id === block.id ? { ...b, content: { ...b.content, companyInfo: e.target.value } } : b);
                                        setCurrentTemplate(prev => ({ ...prev, blocks: newBlocks }));
                                      }}
                                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Marketing;
