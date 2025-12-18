import React, { useEffect, useState } from 'react';
import { FileText, Search, Calendar, User, Building, Trash2, Edit, LayoutGrid, List, Filter } from 'lucide-react';

const Archive = ({ onLoadCard }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  
  // Advanced filters state
  const [filters, setFilters] = useState({
    globalSearch: '',
    businessName: [],
    fullName: [],
    address: '',
    city: [],
    province: [],
    mainInterest: [],
    assignedConsultant: [],
    operatorName: []
  });

  const [uniqueValues, setUniqueValues] = useState({
    businessName: [],
    fullName: [],
    city: [],
    province: [],
    mainInterest: [],
    assignedConsultant: [],
    operatorName: []
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCards();
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
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
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

  const deleteCard = async (id, e) => {
    e.stopPropagation(); // Prevent card click
    if (!window.confirm('Sei sicuro di voler eliminare questa scheda?')) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
      const response = await fetch(`${apiUrl}/api/cards/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCards(cards.filter(card => card.id !== id));
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Archivio Schede</h2>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
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
              Filtri Avanzati
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
          <FilterDropdown 
            label="Ragione Sociale" 
            options={uniqueValues.businessName} 
            selected={filters.businessName} 
            onChange={handleCheckboxChange} 
            category="businessName" 
          />
          <FilterDropdown 
            label="Referente" 
            options={uniqueValues.fullName} 
            selected={filters.fullName} 
            onChange={handleCheckboxChange} 
            category="fullName" 
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
            options={uniqueValues.assignedConsultant} 
            selected={filters.assignedConsultant} 
            onChange={handleCheckboxChange} 
            category="assignedConsultant" 
          />

          <FilterDropdown 
            label="Operatore" 
            options={uniqueValues.operatorName} 
            selected={filters.operatorName} 
            onChange={handleCheckboxChange} 
            category="operatorName" 
          />
        </div>
      )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Trovate {filteredCards.length} schede
      </div>

      {viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <div key={card.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onLoadCard(card)}
                  className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                  title="Modifica"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={(e) => deleteCard(card.id, e)}
                  className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                  title="Elimina"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
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

              <button
                onClick={() => onLoadCard(card)}
                className="w-full mt-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium"
              >
                Visualizza Dettagli
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
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
                  <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer" onClick={() => onLoadCard(card)}>
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
