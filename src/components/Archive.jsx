import React, { useEffect, useState } from 'react';
import { Search, Calendar, User, Building, Trash2, Edit, LayoutGrid, List, Filter, Download, CheckSquare, Square, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { generatePDF } from '../utils/pdfGenerator';
import { getApiUrl } from '../utils/api';

const Archive = ({ onLoadCard }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  
  // Selection state
  const [selectedCards, setSelectedCards] = useState([]);
  const [pdfOptions, setPdfOptions] = useState(null);
  
  // Bulk Assign State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [consultantToAssign, setConsultantToAssign] = useState('');
  const [consultantsList, setConsultantsList] = useState([]); // Full list from registry

  // Advanced filters state
  const [filters, setFilters] = useState({
    globalSearch: '',
    businessName: '',
    fullName: '',
    address: '',
    city: [],
    province: [],
    mainInterest: [],
    assignedConsultant: [],
    operatorName: []
  });

  const [uniqueValues, setUniqueValues] = useState({
    city: [],
    province: [],
    mainInterest: [],
    assignedConsultant: [],
    operatorName: []
  });

  // Combined consultants list for filter (Cards data + Registry data)
  const consultantFilterOptions = React.useMemo(() => {
    const fromCards = uniqueValues.assignedConsultant || [];
    const fromRegistry = consultantsList.map(c => c.name);
    // Combine and deduplicate
    return [...new Set([...fromCards, ...fromRegistry])].sort();
  }, [uniqueValues.assignedConsultant, consultantsList]);

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCards();
    fetchSettings();
    fetchConsultants();
  }, []);

  useEffect(() => {
    if (cards.length > 0) {
      const getUnique = (key) => [...new Set(cards.map(c => c[key]).filter(Boolean))].sort();
      setUniqueValues({
        city: getUnique('city'),
        province: getUnique('province'),
        mainInterest: getUnique('main_interest'),
        assignedConsultant: getUnique('assigned_consultant'),
        operatorName: getUnique('operator_name')
      });
    }
  }, [cards]);

  const fetchCards = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/cards`);
      if (response.ok) {
        const data = await response.json();
        setCards(data);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        // Handle both snake_case (DB) and camelCase (if passed from other places)
        setPdfOptions(data.pdf_options || data.pdfOptions);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchConsultants = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/consultants`);
      if (response.ok) {
        const data = await response.json();
        setConsultantsList(data);
      }
    } catch (error) {
      console.error('Error fetching consultants:', error);
    }
  };

  const deleteCard = async (id, e) => {
    e.stopPropagation(); // Prevent card click
    if (!window.confirm('Sei sicuro di voler eliminare questa scheda?')) return;

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/cards/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCards(cards.filter(card => card.id !== id));
        setSelectedCards(prev => prev.filter(cardId => cardId !== id));
      } else {
        alert('Errore durante l\'eliminazione della scheda');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (category, value) => {
    setFilters(prev => {
      const currentValues = prev[category];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [category]: newValues };
    });
  };

  const filteredCards = cards.filter(card => {
    const matchesGlobal = filters.globalSearch === '' || 
      Object.values(card).some(val => 
        String(val).toLowerCase().includes(filters.globalSearch.toLowerCase())
      );

    const matchesSpecific = 
      (filters.businessName === '' || card.business_name?.toLowerCase().includes(filters.businessName.toLowerCase())) &&
      (filters.fullName === '' || card.full_name?.toLowerCase().includes(filters.fullName.toLowerCase())) &&
      (filters.address === '' || card.address?.toLowerCase().includes(filters.address.toLowerCase())) &&
      (filters.city.length === 0 || filters.city.includes(card.city)) &&
      (filters.province.length === 0 || filters.province.includes(card.province)) &&
      (filters.mainInterest.length === 0 || filters.mainInterest.includes(card.main_interest)) &&
      (filters.assignedConsultant.length === 0 || filters.assignedConsultant.includes(card.assigned_consultant)) &&
      (filters.operatorName.length === 0 || filters.operatorName.includes(card.operator_name));

    return matchesGlobal && matchesSpecific;
  });

  // Selection Logic
  const handleSelectCard = (id) => {
    setSelectedCards(prev => 
      prev.includes(id) 
        ? prev.filter(cardId => cardId !== id) 
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCards.length === filteredCards.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(filteredCards.map(c => c.id));
    }
  };

  const handleBatchPrint = () => {
    const selected = cards.filter(c => selectedCards.includes(c.id));
    if (selected.length === 0) return;
    
    generatePDF(selected, { pdfOptions });
  };

  const handleBatchAssign = async () => {
    if (!consultantToAssign.trim()) return;

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/cards/bulk-consultant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardIds: selectedCards,
          consultantName: consultantToAssign.toUpperCase()
        })
      });

      if (response.ok) {
        alert('Consulente assegnato con successo!');
        setShowAssignModal(false);
        setConsultantToAssign('');
        setSelectedCards([]);
        fetchCards(); // Refresh data
      } else {
        alert('Errore durante l\'assegnazione del consulente');
      }
    } catch (error) {
      console.error('Error assigning consultant:', error);
      alert('Errore di connessione');
    }
  };

  const exportToExcel = () => {
    const stats = {};
    
    // Group by Province then City
    filteredCards.forEach(card => {
      const province = (card.province || 'Sconosciuta').toUpperCase();
      const city = (card.city || 'Sconosciuto').toUpperCase();
      
      if (!stats[province]) {
        stats[province] = {};
      }
      
      stats[province][city] = (stats[province][city] || 0) + 1;
    });

    // Flatten for Excel
    const data = [];
    Object.keys(stats).sort().forEach(province => {
      Object.keys(stats[province]).sort().forEach(city => {
        data.push({
          'Provincia': province,
          'Comune': city,
          'Numero Schede': stats[province][city]
        });
      });
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statistiche");

    // Auto-width columns
    const wscols = [
      { wch: 20 }, // Provincia
      { wch: 30 }, // Comune
      { wch: 15 }  // Numero Schede
    ];
    ws['!cols'] = wscols;

    // Download file
    XLSX.writeFile(wb, "statistiche_territoriali.xlsx");
  };

  const FilterDropdown = ({ label, options, selected, onChange, category }) => (
    <div className="relative group">
      <div className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white cursor-pointer flex justify-between items-center group-hover:border-blue-500">
        <span className="truncate">{selected.length ? `${selected.length} selezionati` : label}</span>
        <Filter className="h-3 w-3 text-gray-400" />
      </div>
      <div className="hidden group-hover:block absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
        {options.map(option => (
          <label key={option} className="flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onChange(category, option)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-200">{option}</span>
          </label>
        ))}
        {options.length === 0 && (
          <div className="px-4 py-2 text-sm text-gray-500 italic">Nessuna opzione</div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Archivio Schede</h2>
             {selectedCards.length > 0 && (
               <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                 {selectedCards.length} selezionati
               </span>
             )}
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
             {/* Global Search - Always Visible */}
             <div className="relative flex-grow md:flex-grow-0 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  name="globalSearch"
                  placeholder="Cerca ovunque..."
                  value={filters.globalSearch}
                  onChange={handleFilterChange}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 shadow-sm"
                />
              </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtri</span>
            </button>

             {/* Batch Actions */}
            {selectedCards.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-purple-600 border-purple-700 text-white hover:bg-purple-700 transition-colors shadow-sm"
                  title="Assegna Consulente"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Assegna ({selectedCards.length})</span>
                </button>

                <button
                  onClick={handleBatchPrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-blue-600 border-blue-700 text-white hover:bg-blue-700 transition-colors shadow-sm"
                  title="Genera PDF Selezionati"
                >
                  <FileDown className="h-4 w-4" />
                  <span className="hidden sm:inline">Genera PDF ({selectedCards.length})</span>
                </button>
              </div>
            )}

            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/30 transition-colors"
              title="Esporta Excel"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>

             {/* View Toggle */}
             <div className="flex bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                title="Vista Griglia"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                title="Vista Elenco"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all">
          <input
            type="text"
            name="businessName"
            placeholder="Ragione Sociale"
            value={filters.businessName}
            onChange={handleFilterChange}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            name="fullName"
            placeholder="Referente"
            value={filters.fullName}
            onChange={handleFilterChange}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            name="address"
            placeholder="Indirizzo"
            value={filters.address}
            onChange={handleFilterChange}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          
          <FilterDropdown 
            label="Comune" 
            options={uniqueValues.city} 
            selected={filters.city} 
            onChange={handleCheckboxChange} 
            category="city" 
          />
          
          <FilterDropdown 
            label="Provincia" 
            options={uniqueValues.province} 
            selected={filters.province} 
            onChange={handleCheckboxChange} 
            category="province" 
          />
          
          <FilterDropdown 
            label="Interesse" 
            options={uniqueValues.mainInterest} 
            selected={filters.mainInterest} 
            onChange={handleCheckboxChange} 
            category="mainInterest" 
          />
          
          <FilterDropdown 
            label="Consulente" 
            options={consultantFilterOptions} 
            selected={filters.assignedConsultant} 
            onChange={handleCheckboxChange} 
            category="assignedConsultant" 
          />
        </div>
      )}
      </div>

      {/* Assign Consultant Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Assegna Consulente a {selectedCards.length} schede
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleziona Consulente
              </label>
              <select
                value={consultantToAssign}
                onChange={(e) => setConsultantToAssign(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Seleziona un consulente...</option>
                {consultantsList.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleBatchAssign}
                disabled={!consultantToAssign.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Count and Select All */}
      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <div>
           Trovate {filteredCards.length} schede
        </div>
        <button 
          onClick={handleSelectAll}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          {selectedCards.length === filteredCards.length && filteredCards.length > 0 ? 'Deseleziona Tutto' : 'Seleziona Tutto'}
        </button>
      </div>

      {viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => {
            const isSelected = selectedCards.includes(card.id);
            return (
            <div 
              key={card.id} 
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all relative group ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Checkbox for Grid View */}
              <div className="absolute top-4 left-4 z-10">
                <button
                   onClick={(e) => { e.stopPropagation(); handleSelectCard(card.id); }}
                   className={`p-1 rounded-md transition-colors ${isSelected ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600 bg-gray-50'}`}
                >
                  {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                </button>
              </div>

              <div className="flex items-start justify-end mb-4 pl-8">
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(card.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">{card.business_name}</h3>
              
              {/* Address in Grid View */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                {card.address}
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1">
                <User className="h-3 w-3" />
                {card.full_name}
              </p>

              <div className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Città:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{card.city} ({card.province})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Interesse:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{card.main_interest}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Consulente:</span>
                  <span className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{card.assigned_consultant || '-'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => onLoadCard(card)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium"
                  title="Modifica"
                >
                  <Edit className="h-4 w-4" />
                  Modifica
                </button>
                <button 
                  onClick={(e) => deleteCard(card.id, e)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium"
                  title="Elimina"
                >
                  <Trash2 className="h-4 w-4" />
                  Elimina
                </button>
              </div>
            </div>
          )})}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedCards.length === filteredCards.length && filteredCards.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ragione Sociale</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Indirizzo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comune</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Provincia</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Azioni</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCards.map((card) => (
                  <tr key={card.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${selectedCards.includes(card.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`} onClick={() => onLoadCard(card)}>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedCards.includes(card.id)}
                        onChange={() => handleSelectCard(card.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(card.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {card.business_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {card.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {card.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {card.province}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                         <button 
                          onClick={(e) => { e.stopPropagation(); onLoadCard(card); }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => deleteCard(card.id, e)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archive;
