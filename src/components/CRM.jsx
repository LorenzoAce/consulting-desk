import React, { useState, useEffect } from 'react';
import { Upload, Database, FileSpreadsheet, Plus, Search, Check, AlertCircle, Pencil, Trash2, X, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getApiUrl } from '../utils/api';

const CRM = ({ onLoadCard, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'import-archive', 'import-excel'
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Edit/Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState(null);
  const [formData, setFormData] = useState({});

  // Archive Import State
  const [archiveCards, setArchiveCards] = useState([]);
  const [selectedCardIds, setSelectedCardIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // List Filters State
  const [listSearch, setListSearch] = useState('');
  const [filterInterest, setFilterInterest] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Excel Import State
  const [excelData, setExcelData] = useState([]);

  // Initial Data Load
  useEffect(() => {
    initCRM();
    fetchLeads();
  }, []);

  const initCRM = async () => {
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/crm/init`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to init CRM', err);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/crm/leads`);
      if (!res.ok) throw new Error('Failed to fetch leads');
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
      // Don't show error immediately on fetch fail if table doesn't exist yet (handled by init)
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo contatto?')) return;
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/crm/leads/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete lead');
      fetchLeads();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditCard = async (lead) => {
    console.log('handleEditCard called with:', lead);
    try {
      if (lead.card_id && onLoadCard) {
        console.log('Fetching card details for ID:', lead.card_id);
        // Fetch full card data to ensure we have everything (including JSON fields)
        try {
          const apiUrl = getApiUrl();
          const res = await fetch(`${apiUrl}/api/cards/${lead.card_id}`);
          if (!res.ok) throw new Error('Failed to fetch card details');
          const card = await res.json();
          console.log('Card details fetched:', card);
          onLoadCard(card);
        } catch (err) {
          console.error(err);
          alert('Impossibile caricare la scheda completa: ' + err.message);
          // Fallback to simple edit if fetch fails
          handleOpenModal(lead);
        }
      } else {
        console.log('Opening simple modal for lead:', lead);
        // Fallback for non-linked leads
        handleOpenModal(lead);
      }
    } catch (error) {
      console.error('Critical error in handleEditCard:', error);
      alert('Si è verificato un errore critico durante l\'apertura della modifica.');
    }
  };

  const handleOpenModal = (lead) => {
    setCurrentLead(lead);
    setFormData({
      businessName: lead.business_name || '',
      contactName: lead.contact_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      address: lead.address || '',
      city: lead.city || '',
      province: lead.province || '',
      status: lead.status || 'new',
      notes: lead.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentLead(null);
    setFormData({});
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/crm/leads/${currentLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, cardId: currentLead.card_id })
      });
      if (!res.ok) throw new Error('Failed to update lead');
      
      handleCloseModal();
      fetchLeads();
    } catch (err) {
      alert('Errore durante il salvataggio: ' + err.message);
    }
  };

  const fetchArchiveCards = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/cards`);
      if (!res.ok) throw new Error('Failed to fetch cards');
      const data = await res.json();
      setArchiveCards(data);
    } catch (err) {
      console.error(err);
      setError('Impossibile caricare l\'archivio schede.');
    }
  };

  // Switch tabs handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'import-archive') {
      fetchArchiveCards();
    }
  };

  // Archive Selection Logic
  const toggleCardSelection = (id) => {
    const newSelected = new Set(selectedCardIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCardIds(newSelected);
  };

  const handleImportFromArchive = async () => {
    if (selectedCardIds.size === 0) return;
    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/crm/import-archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds: Array.from(selectedCardIds) })
      });
      if (!res.ok) throw new Error('Import failed');
      const result = await res.json();
      alert(result.message);
      setActiveTab('list');
      fetchLeads();
      setSelectedCardIds(new Set());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Excel Logic
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setExcelData(data);
    };
    reader.readAsBinaryString(file);
  };

  const handleImportExcel = async () => {
    if (excelData.length === 0) return;
    setLoading(true);
    let count = 0;
    try {
      for (const row of excelData) {
        // Map Excel columns to our fields.
        // Assuming columns: "Business Name", "Contact Name", "Email", "Phone", "Notes"
        // Adjust keys based on expected Excel format or make it flexible.
        const payload = {
            businessName: row['Ragione Sociale'] || row['Business Name'] || row['Nome'] || 'Sconosciuto',
            contactName: row['Referente'] || row['Contact Name'] || '',
            email: row['Email'] || '',
            phone: row['Telefono'] || row['Phone'] || '',
            notes: row['Note'] || row['Notes'] || '',
            source: 'excel'
        };

        const apiUrl = getApiUrl();
        await fetch(`${apiUrl}/api/crm/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        count++;
      }
      alert(`Importati ${count} contatti da Excel`);
      setActiveTab('list');
      fetchLeads();
      setExcelData([]);
    } catch (err) {
      setError('Errore durante importazione Excel: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter leads (list tab)
  const filteredLeads = leads.filter((lead) => {
    const search = listSearch.toLowerCase();

    const matchesSearch =
      !search ||
      (lead.business_name && lead.business_name.toLowerCase().includes(search)) ||
      (lead.contact_name && lead.contact_name.toLowerCase().includes(search)) ||
      (lead.city && lead.city.toLowerCase().includes(search)) ||
      (lead.province && lead.province.toLowerCase().includes(search)) ||
      (lead.email && lead.email.toLowerCase().includes(search)) ||
      (lead.phone && lead.phone.toLowerCase().includes(search));

    const matchesInterest = !filterInterest || lead.main_interest === filterInterest;
    const matchesAvailability = !filterAvailability || lead.availability === filterAvailability;
    const matchesStatus = !filterStatus || lead.status === filterStatus;

    return matchesSearch && matchesInterest && matchesAvailability && matchesStatus;
  });

  // Filter archive cards
  const filteredArchiveCards = archiveCards.filter(card => 
    (card.business_name && card.business_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (card.email && card.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Gestione relazioni e importazione contatti.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
        <button
            onClick={() => handleTabChange('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
            Lista Contatti
        </button>
        <button
            onClick={() => handleTabChange('import-archive')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'import-archive' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
            Importa da Archivio
        </button>
        <button
            onClick={() => handleTabChange('import-excel')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'import-excel' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
            Importa da Excel
        </button>
        
        <div className="flex-grow"></div>

        <button
            onClick={() => onNavigate('form')}
            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 flex items-center"
        >
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Contatto
        </button>
      </div>

      {/* CONTENT */}
      {activeTab === 'list' && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <div className="px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Cerca per ragione sociale, referente, città, telefono o email..."
                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <select
                    className="block w-full border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={filterInterest}
                    onChange={(e) => setFilterInterest(e.target.value)}
                  >
                    <option value="">Tutti gli interessi</option>
                    <option value="SCOMMESSE">SCOMMESSE</option>
                    <option value="UTENZE">UTENZE</option>
                    <option value="ENTRAMBI">ENTRAMBI</option>
                  </select>
                </div>
                <div>
                  <select
                    className="block w-full border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={filterAvailability}
                    onChange={(e) => setFilterAvailability(e.target.value)}
                  >
                    <option value="">Tutte le disponibilità</option>
                    <option value="BASSA">BASSA</option>
                    <option value="MEDIA">MEDIA</option>
                    <option value="ALTA">ALTA</option>
                  </select>
                </div>
                <div>
                  <select
                    className="block w-full border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">Tutti gli stati CRM</option>
                    <option value="new">Nuovo</option>
                    <option value="contacted">Contattato</option>
                    <option value="interested">Interessato</option>
                    <option value="closed">Chiuso</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome Attività</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contatto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Indirizzo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Città</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Provincia</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Interesse</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Disponibilità</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Servizi Attivi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Consulente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Telefono / Cellulare</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stato CRM</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredLeads.length === 0 ? (
                            <tr>
                                <td colSpan="13" className="px-6 py-8 text-center text-gray-500">Nessun contatto presente. Importane alcuni!</td>
                            </tr>
                        ) : (
                            filteredLeads.map(lead => (
                                <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{lead.business_name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Fonte: {lead.source}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-white">{lead.contact_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 dark:text-gray-300">
                                            {lead.address || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 dark:text-gray-300">
                                            {lead.city || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 dark:text-gray-300">
                                            {lead.province || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-white">{lead.main_interest || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-white">{lead.availability || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col space-y-1">
                                            <div className="flex items-center text-xs">
                                                <span className={`w-2 h-2 rounded-full mr-2 ${lead.betting_active === 'Si' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                <span className="text-gray-700 dark:text-gray-300">Scommesse</span>
                                            </div>
                                            <div className="flex items-center text-xs">
                                                <span className={`w-2 h-2 rounded-full mr-2 ${lead.utilities_active === 'Si' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                <span className="text-gray-700 dark:text-gray-300">Utenze</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-white">{lead.assigned_consultant || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-white">{lead.phone || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-white">{lead.email || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            lead.status === 'new' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => handleEditCard(lead)} 
                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                                            title={lead.card_id ? "Modifica Scheda Completa" : "Modifica Lead CRM"}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(lead.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={handleCloseModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <form onSubmit={handleModalSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Modifica Contatto
                    </h3>
                    <button type="button" onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ragione Sociale</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.businessName}
                        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Referente</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.contactName}
                        onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input
                          type="email"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefono</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Indirizzo</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Città</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provincia</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={formData.province}
                          onChange={(e) => setFormData({...formData, province: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stato</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="new">Nuovo</option>
                        <option value="contacted">Contattato</option>
                        <option value="interested">Interessato</option>
                        <option value="closed">Chiuso</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
                      <textarea
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Salva
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500"
                  >
                    Annulla
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'import-archive' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-md p-6">
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Cerca per ragione sociale o email..."
                    className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md mb-4">
                {filteredArchiveCards.map(card => (
                    <div 
                        key={card.id} 
                        onClick={() => toggleCardSelection(card.id)}
                        className={`p-3 flex items-center cursor-pointer border-b last:border-b-0 ${selectedCardIds.has(card.id) ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${selectedCardIds.has(card.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                            {selectedCardIds.has(card.id) && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{card.business_name}</p>
                            <p className="text-xs text-gray-500">{card.email} - {card.phone}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={handleImportFromArchive}
                disabled={loading || selectedCardIds.size === 0}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            >
                {loading ? 'Importazione...' : `Importa Selezionati (${selectedCardIds.size})`}
            </button>
        </div>
      )}

      {activeTab === 'import-excel' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-md p-6">
            <div className="mb-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12">
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-upload"
                />
                <label htmlFor="excel-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                        Clicca per selezionare un file Excel
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                        Formato atteso: Ragione Sociale, Referente, Email, Telefono, Note
                    </span>
                </label>
            </div>

            {excelData.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Anteprima ({excelData.length} righe):</h4>
                    <div className="max-h-60 overflow-y-auto border rounded text-xs">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    {Object.keys(excelData[0] || {}).map(key => (
                                        <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {excelData.slice(0, 5).map((row, idx) => (
                                    <tr key={idx}>
                                        {Object.values(row).map((val, vIdx) => (
                                            <td key={vIdx} className="px-3 py-2 whitespace-nowrap text-gray-500 dark:text-gray-400">{val}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {excelData.length > 5 && <div className="p-2 text-center text-gray-500 italic">...e altre {excelData.length - 5} righe</div>}
                    </div>
                    
                    <button
                        onClick={handleImportExcel}
                        disabled={loading}
                        className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50"
                    >
                        {loading ? 'Importazione...' : 'Conferma Importazione'}
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default CRM;
