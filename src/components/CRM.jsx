import React, { useState, useEffect } from 'react';
import { Upload, Database, FileSpreadsheet, Plus, Search, Check, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const CRM = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'import-archive', 'import-excel'
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Archive Import State
  const [archiveCards, setArchiveCards] = useState([]);
  const [selectedCardIds, setSelectedCardIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Excel Import State
  const [excelData, setExcelData] = useState([]);
  const [importStatus, setImportStatus] = useState(null);

  // Initial Data Load
  useEffect(() => {
    initCRM();
    fetchLeads();
  }, []);

  const initCRM = async () => {
    try {
      await fetch(`${API_URL}/crm/init`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to init CRM', err);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/crm/leads`);
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

  const fetchArchiveCards = async () => {
    try {
      const res = await fetch(`${API_URL}/cards`);
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
      const res = await fetch(`${API_URL}/crm/import-archive`, {
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

        await fetch(`${API_URL}/crm/leads`, {
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

  // Filter archive cards
  const filteredArchiveCards = archiveCards.filter(card => 
    (card.business_name && card.business_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (card.email && card.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </div>

      {/* CONTENT */}
      {activeTab === 'list' && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {leads.length === 0 ? (
                    <li className="px-4 py-8 text-center text-gray-500">Nessun contatto presente. Importane alcuni!</li>
                ) : (
                    leads.map(lead => (
                        <li key={lead.id} className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600 truncate">{lead.business_name}</p>
                                    <p className="flex items-center text-sm text-gray-500">
                                        {lead.contact_name && <span className="mr-2">{lead.contact_name}</span>}
                                        {lead.email && <span className="mr-2">&bull; {lead.email}</span>}
                                        {lead.phone && <span>&bull; {lead.phone}</span>}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Fonte: {lead.source}</p>
                                </div>
                                <div className="ml-2 flex-shrink-0 flex">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        lead.status === 'new' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {lead.status}
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))
                )}
            </ul>
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
