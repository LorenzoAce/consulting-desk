import React, { useEffect, useState, useRef } from 'react';
import { Search, Calendar, User, Building, Trash2, Pencil, LayoutGrid, List, Filter, Download, CheckSquare, Square, FileDown, Image, X, ArrowRight, FileSpreadsheet, Upload, FolderArchive } from 'lucide-react';
import * as XLSX from 'xlsx';
import { generatePDF } from '../utils/pdfGenerator';
import { getApiUrl } from '../utils/api';

const Archive = ({ onLoadCard }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'grid' | 'list'
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'import-excel'
  const [excelData, setExcelData] = useState([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Selection state
  const [selectedCards, setSelectedCards] = useState([]);
  const [pdfOptions, setPdfOptions] = useState(null);
  const [crmCardIds, setCrmCardIds] = useState(new Set());
  
  // Image Modal State
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Bulk Assign State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [consultantToAssign, setConsultantToAssign] = useState('');
  const [consultantsList, setConsultantsList] = useState([]); // Full list from registry
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

  // Advanced filters state
  const [filters, setFilters] = useState({
    globalSearch: '',
    businessName: '',
    fullName: '',
    address: '',
    piva: '',
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

  // Filter options based ONLY on active consultants from registry
  const consultantFilterOptions = React.useMemo(() => {
    const options = consultantsList.map(c => c.name).sort();
    return ['DA ASSEGNARE', ...options];
  }, [consultantsList]);

  const [showFilters, setShowFilters] = useState(false);

  const handleViewImage = async (card, e) => {
    e.stopPropagation();
    try {
      const apiUrl = getApiUrl();
      // Fetch the image specifically for this card
      const response = await fetch(`${apiUrl}/api/cards/${card.id}/image`);
      if (response.ok) {
        const data = await response.json();
        if (data.external_image) {
          setSelectedImage(data.external_image);
          setShowImageModal(true);
        } else {
          alert("Immagine non trovata");
        }
      } else {
        alert("Errore nel caricamento dell'immagine");
      }
    } catch (error) {
      console.error("Error fetching image:", error);
      alert("Errore di connessione");
    }
  };

  const handleEditCard = async (card) => {
    try {
      // Fetch full card details before editing
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/cards/${card.id}`);
      if (response.ok) {
        const fullCard = await response.json();
        onLoadCard(fullCard);
      } else {
        alert("Errore nel caricamento della scheda completa");
      }
    } catch (error) {
      console.error("Error fetching full card:", error);
      alert("Errore di connessione");
    }
  };

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
      const apiUrl = getApiUrl();
      for (const row of excelData) {
        // Map Excel columns to our fields for Archive
        const payload = {
            businessName: row['Ragione Sociale'] || row['Business Name'] || row['Nome'] || row['business_name'] || 'Sconosciuto',
            fullName: row['Referente'] || row['Contact Name'] || row['full_name'] || '',
            email: row['Email'] || row['email'] || '',
            phone: row['Telefono'] || row['Phone'] || row['phone'] || '',
            notes: row['Note'] || row['Notes'] || row['notes'] || '',
            piva: row['P.IVA'] || row['Partita IVA'] || row['piva'] || '',
            address: row['Indirizzo'] || row['Address'] || row['address'] || '',
            city: row['Città'] || row['City'] || row['city'] || '',
            province: row['Provincia'] || row['Province'] || row['province'] || '',
            availability: row['Disponibilità'] || row['Availability'] || 'MEDIA',
            mainInterest: row['Interesse'] || row['Interest'] || 'ENTRAMBI',
            source: row['Fonte'] || row['Source'] || 'excel',
            bettingActive: row['PVR Attivo'] || 'NO',
            utilitiesActive: row['Utenze Attive'] || 'NO',
            bettingPartners: [],
            utilityPartners: [],
            requests: '',
            assignedConsultant: row['Consulente'] || '',
            operatorName: row['Operatore'] || '',
            signatureType: 'type',
            signatureData: '',
            logo: null,
            logoDimensions: null,
            externalImage: null
        };

        await fetch(`${apiUrl}/api/cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        count++;
      }
      alert(`Importate ${count} schede da Excel`);
      setActiveTab('list');
      fetchCards();
      setExcelData([]);
    } catch (err) {
      console.error('Errore durante importazione Excel:', err);
      alert('Errore durante importazione Excel: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Scroll Synchronization Refs
  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const isSyncingRef = useRef(false);

  const handleTopScroll = (e) => {
    if (!bottomScrollRef.current) return;
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    bottomScrollRef.current.scrollLeft = e.target.scrollLeft;
    isSyncingRef.current = false;
  };

  const handleBottomScroll = (e) => {
    if (!topScrollRef.current) return;
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    topScrollRef.current.scrollLeft = e.target.scrollLeft;
    isSyncingRef.current = false;
  };

  useEffect(() => {
    const updateWidth = () => {
      if (bottomScrollRef.current) {
        setScrollWidth(bottomScrollRef.current.scrollWidth);
      }
    };
    // Update width when switching to list view or when data changes
    if (viewMode === 'list') {
      // Small timeout to ensure DOM is rendered
      setTimeout(updateWidth, 0);
    }
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [cards, viewMode]);

  useEffect(() => {
    fetchCards();
    fetchConsultants();
    fetchSettings();
    fetchCrmLeads();
    try {
      const saved = localStorage.getItem('archiveFilters');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFilters(parsed);
      }
      const savedView = localStorage.getItem('archiveViewMode');
      if (savedView === 'grid' || savedView === 'list') setViewMode(savedView);
      const savedPage = localStorage.getItem('archiveCurrentPage');
      if (savedPage) {
        const p = parseInt(savedPage, 10);
        if (!isNaN(p) && p > 0) setCurrentPage(p);
      }
      const savedSelection = localStorage.getItem('archiveSelectedCards');
      if (savedSelection) {
        const arr = JSON.parse(savedSelection);
        if (Array.isArray(arr)) setSelectedCards(arr);
      }
    } catch (e) {}
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
      try {
        // sanitize selection to only existing card IDs
        setSelectedCards(prev => prev.filter(id => cards.some(c => c.id === id)));
      } catch (e) {}
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

  const fetchCrmLeads = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/crm/leads`);
      if (response.ok) {
        const data = await response.json();
        const ids = new Set(data.map(l => l.card_id).filter(Boolean));
        setCrmCardIds(ids);
      }
    } catch (error) {
      console.error('Error fetching CRM leads:', error);
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
        if (data.archive_options) {
          setArchiveOptions(data.archive_options);
        }
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

  useEffect(() => {
    try {
      localStorage.setItem('archiveFilters', JSON.stringify(filters));
    } catch (e) {}
  }, [filters]);

  useEffect(() => {
    try {
      localStorage.setItem('archiveViewMode', viewMode);
    } catch (e) {}
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem('archiveCurrentPage', String(currentPage));
    } catch (e) {}
  }, [currentPage]);

  useEffect(() => {
    try {
      localStorage.setItem('archiveSelectedCards', JSON.stringify(selectedCards));
    } catch (e) {}
  }, [selectedCards]);

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
      (filters.piva === '' || (card.piva && card.piva.toLowerCase().includes(filters.piva.toLowerCase()))) &&
      (filters.city.length === 0 || filters.city.includes(card.city)) &&
      (filters.province.length === 0 || filters.province.includes(card.province)) &&
      (filters.mainInterest.length === 0 || filters.mainInterest.includes(card.main_interest)) &&
      (filters.assignedConsultant.length === 0 || 
        (card.assigned_consultant && filters.assignedConsultant.includes(card.assigned_consultant)) ||
        (!card.assigned_consultant && filters.assignedConsultant.includes('DA ASSEGNARE'))) &&
      (filters.operatorName.length === 0 || filters.operatorName.includes(card.operator_name));

    return matchesGlobal && matchesSpecific;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCards.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCards.length / itemsPerPage);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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

  const handleBatchPrint = async () => {
    const selectedIds = selectedCards;
    if (selectedIds.length === 0) return;
    
    try {
      const apiUrl = getApiUrl();
      // Fetch full card details for each selected card to ensure we have images and signatures
      // The list view cards are lightweight and might miss these fields
      const promises = selectedIds.map(id => 
        fetch(`${apiUrl}/api/cards/${id}`).then(res => {
          if (!res.ok) throw new Error(`Failed to fetch card ${id}`);
          return res.json();
        })
      );
      
      const fullCards = await Promise.all(promises);
      generatePDF(fullCards, { pdfOptions });
    } catch (error) {
      console.error("Error fetching full cards for PDF:", error);
      alert("Errore durante la preparazione del PDF. Riprova.");
    }
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

  const moveSelectedToCRM = async () => {
    if (selectedCards.length === 0) return;
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/crm/import-archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds: selectedCards })
      });
      if (response.ok) {
        setCrmCardIds(prev => new Set([...prev, ...selectedCards]));
        alert('Schede selezionate spostate nel CRM');
      } else {
        const errText = await response.text();
        alert('Errore nello spostamento nel CRM: ' + errText);
      }
    } catch (error) {
      console.error('Error moving selected cards to CRM:', error);
      alert('Errore di connessione');
    }
  };

  const moveCardToCRM = async (cardId) => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/crm/import-archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds: [cardId] })
      });
      if (response.ok) {
        setCrmCardIds(prev => new Set([...prev, cardId]));
        alert('Scheda spostata nel CRM');
      } else {
        const errText = await response.text();
        alert('Errore nello spostamento nel CRM: ' + errText);
      }
    } catch (error) {
      console.error('Error moving card to CRM:', error);
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
      <div className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white cursor-pointer flex justify-between items-center group-hover:border-blue-500 transition-all">
        <span className="truncate">{selected.length ? `${selected.length} selezionati` : label}</span>
        <Filter className="h-3 w-3 text-gray-400" />
      </div>
      <div className="hidden group-hover:block absolute z-10 w-full top-full left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto mt-1">
        {options.map(option => (
          <label key={option} className="flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onChange(category, option)}
              className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
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
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Archivio Schede</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Gestione completa delle schede clienti.
          {selectedCards.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300 uppercase tracking-wider">
               {selectedCards.length} selezionati
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
        {/* Navigation Tabs as Buttons */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
          <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}
          >
              <FolderArchive className="h-3.5 w-3.5" />
              LISTA
          </button>
          <button
              onClick={() => setActiveTab('import-excel')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'import-excel' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}
          >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              IMPORTA
          </button>
        </div>

        {activeTab === 'list' && (
          <>
            {/* Buttons Group */}
            <button
                onClick={exportToExcel}
                className="px-4 py-2 text-sm font-bold rounded-xl shadow-sm border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 flex items-center gap-2 transition-all"
            >
                <Download className="h-4 w-4 text-emerald-500" />
                <span className="hidden sm:inline uppercase tracking-tight">Excel</span>
            </button>

            {selectedCards.length > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-4 py-2 text-sm font-bold rounded-xl shadow-lg bg-purple-600 text-white border-transparent hover:bg-purple-700 flex items-center gap-2 transition-all shadow-purple-500/20"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline uppercase tracking-tight">Assegna</span>
                </button>

                <button
                  onClick={moveSelectedToCRM}
                  className="px-4 py-2 text-sm font-bold rounded-xl shadow-lg bg-indigo-600 text-white border-transparent hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-indigo-500/20"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span className="hidden sm:inline uppercase tracking-tight">Sposta in CRM</span>
                </button>

                <button
                  onClick={handleBatchPrint}
                  className="px-4 py-2 text-sm font-bold rounded-xl shadow-lg bg-blue-600 text-white border-transparent hover:bg-blue-700 flex items-center gap-2 transition-all shadow-blue-500/20"
                >
                  <FileDown className="h-4 w-4" />
                  <span className="hidden sm:inline uppercase tracking-tight">PDF</span>
                </button>
              </div>
            )}
          </>
        )}
        
        <div className="flex-grow"></div>

        {activeTab === 'list' && (
          <>
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="text"
                  name="globalSearch"
                  placeholder="Cerca ovunque..."
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={filters.globalSearch}
                  onChange={handleFilterChange}
                />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 text-sm font-bold rounded-xl shadow-sm border transition-all flex items-center gap-2 ${showFilters ? 'bg-blue-600 text-white border-transparent hover:bg-blue-700 shadow-blue-500/20' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700'}`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline uppercase tracking-tight">Filtri</span>
            </button>
            
            <button
              onClick={() => {
                setFilters({
                  globalSearch: '',
                  businessName: '',
                  fullName: '',
                  address: '',
                  piva: '',
                  city: [],
                  province: [],
                  mainInterest: [],
                  assignedConsultant: [],
                  operatorName: []
                });
                try { localStorage.removeItem('archiveFilters'); } catch (e) {}
              }}
              className="px-4 py-2 text-sm font-bold rounded-xl shadow-sm border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 transition-all uppercase tracking-tight"
            >
              Reset
            </button>

            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl p-1 border border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                title="Griglia"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                title="Elenco"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Sezione Filtri Archivio */}
      {activeTab === 'list' && showFilters && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 transition-all mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Ragione Sociale</label>
            <input
              type="text"
              name="businessName"
              placeholder="Filtra per nome..."
              value={filters.businessName}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Referente</label>
            <input
              type="text"
              name="fullName"
              placeholder="Filtra referente..."
              value={filters.fullName}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Indirizzo</label>
            <input
              type="text"
              name="address"
              placeholder="Filtra indirizzo..."
              value={filters.address}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">P.IVA</label>
            <input
              type="text"
              name="piva"
              placeholder="Filtra P.IVA..."
              value={filters.piva}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Comune</label>
            <FilterDropdown 
              label="Tutti i comuni" 
              options={uniqueValues.city} 
              selected={filters.city} 
              onChange={handleCheckboxChange} 
              category="city" 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Provincia</label>
            <FilterDropdown 
              label="Tutte le province" 
              options={uniqueValues.province} 
              selected={filters.province} 
              onChange={handleCheckboxChange} 
              category="province" 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Interesse</label>
            <FilterDropdown 
              label="Tutti gli interessi" 
              options={uniqueValues.mainInterest} 
              selected={filters.mainInterest} 
              onChange={handleCheckboxChange} 
              category="mainInterest" 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Consulente</label>
            <FilterDropdown 
              label="Tutti i consulenti" 
              options={consultantFilterOptions} 
              selected={filters.assignedConsultant} 
              onChange={handleCheckboxChange} 
              category="assignedConsultant" 
            />
          </div>
        </div>
      )}

      {/* Assign Consultant Modal - Fixed */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm transition-all">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Assegna Consulente
              <span className="block text-xs text-gray-500 font-medium mt-1">Stai assegnando {selectedCards.length} schede</span>
            </h3>
            
            <div className="mb-8">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                Seleziona Consulente
              </label>
              <select
                value={consultantToAssign}
                onChange={(e) => setConsultantToAssign(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none"
              >
                <option value="">Scegli un consulente...</option>
                {consultantsList.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all uppercase tracking-tight"
              >
                Annulla
              </button>
              <button
                onClick={handleBatchAssign}
                disabled={!consultantToAssign.trim()}
                className="flex-[2] px-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 uppercase tracking-tight"
              >
                Conferma Assegnazione
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Tabs */}
      {activeTab === 'list' ? (
        <>
          {/* Results Count and Select All */}
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4 px-2">
            <div className="font-bold uppercase tracking-widest text-[10px]">
              Trovate {filteredCards.length} schede
            </div>
            {selectedCards.length === filteredCards.length && filteredCards.length > 0 && (
              <button 
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-bold uppercase tracking-tighter text-[10px]"
              >
                Deseleziona Tutto
              </button>
            )}
          </div>

          {/* Top Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border border-gray-200 dark:border-gray-700 sm:px-6 mb-4 rounded-2xl shadow-sm">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Precedente
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Successivo
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando <span className="font-bold">{indexOfFirstItem + 1}</span> a <span className="font-bold">{Math.min(indexOfLastItem, filteredCards.length)}</span> di <span className="font-bold">{filteredCards.length}</span> risultati
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-xl border border-gray-300 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      <span className="sr-only">Precedente</span>
                      &larr;
                    </button>
                    {/* Page Numbers */}
                    {[...Array(totalPages)].map((_, i) => {
                        // Show max 5 pages logic or simple list if small
                        if (totalPages > 7 && (i + 1 !== 1 && i + 1 !== totalPages && Math.abs(currentPage - (i + 1)) > 1)) {
                          if (i + 1 === 2 || i + 1 === totalPages - 1) return <span key={i} className="px-2 py-2 bg-white dark:bg-gray-700 border-gray-300 text-gray-500">...</span>;
                          return null;
                        }
                        return (
                          <button
                              key={i}
                              onClick={() => setCurrentPage(i + 1)}
                              aria-current={currentPage === i + 1 ? 'page' : undefined}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-bold ${
                                  currentPage === i + 1
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-200'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                              }`}
                          >
                              {i + 1}
                          </button>
                        );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-xl border border-gray-300 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      <span className="sr-only">Successivo</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentItems.map((card) => {
                const isSelected = selectedCards.includes(card.id);
                const isInCrm = crmCardIds.has(card.id);
                return (
                <div 
                  key={card.id} 
                  className={`rounded-2xl shadow-md p-6 hover:shadow-2xl transition-all relative group border ${isSelected ? 'ring-2 ring-blue-500 border-transparent shadow-blue-500/10' : 'border-gray-100 dark:border-gray-700'} ${isInCrm ? 'bg-yellow-100 dark:bg-yellow-900/40' : 'bg-white dark:bg-gray-800'}`}
                >
                  {/* Checkbox for Grid View */}
                  <div className="absolute top-4 left-4 z-10">
                    <button
                       onClick={(e) => { e.stopPropagation(); handleSelectCard(card.id); }}
                       className={`p-1.5 rounded-xl transition-all ${isSelected ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-300 hover:text-gray-500 bg-gray-50 dark:bg-gray-700/50'}`}
                    >
                      {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                    </button>
                  </div>

                  <div className="flex items-start justify-end mb-4 pl-8">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(card.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate leading-tight">{card.business_name}</h3>
                  
                  {card.piva && (
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1 truncate uppercase tracking-tighter">
                      P.IVA: {card.piva}
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate italic">
                    {card.address}
                  </p>

                  <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-4 flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <User className="h-3 w-3 text-gray-400" />
                    </div>
                    {card.full_name}
                  </p>

                  <div className="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4 mb-6">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Città</span>
                      <span className="font-bold text-gray-900 dark:text-white">{card.city} ({card.province})</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Interesse</span>
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-bold">{card.main_interest}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Consulente</span>
                      <span className={`font-bold truncate max-w-[120px] ${!card.assigned_consultant ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                        {card.assigned_consultant || 'DA ASSEGNARE'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => moveCardToCRM(card.id)}
                      disabled={isInCrm}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-tight ${isInCrm ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white shadow-lg shadow-indigo-500/10'}`}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      {isInCrm ? 'In CRM' : 'Sposta'}
                    </button>
                    <button 
                      onClick={() => handleEditCard(card)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-xs font-bold uppercase tracking-tight shadow-lg shadow-blue-500/10"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <div className="flex gap-2 w-full mt-1">
                      {card.has_external_image && (
                        <button 
                          onClick={(e) => handleViewImage(card, e)}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-3 py-2 rounded-xl hover:bg-green-600 hover:text-white transition-all text-xs font-bold uppercase tracking-tight shadow-lg shadow-green-500/10"
                        >
                          <Image className="h-3.5 w-3.5" />
                          Foto
                        </button>
                      )}
                      <button 
                        onClick={(e) => deleteCard(card.id, e)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all text-xs font-bold uppercase tracking-tight shadow-lg shadow-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="bg-white dark:bg-gray-800 shadow-xl overflow-hidden sm:rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto h-4 mb-2 bg-gray-50 dark:bg-gray-900/50" ref={topScrollRef} onScroll={handleTopScroll}>
                    <div style={{ width: scrollWidth, height: 1 }} />
                </div>
                <div className="overflow-x-auto" ref={bottomScrollRef} onScroll={handleBottomScroll}>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-separate border-spacing-0">
                        <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-20">
                    <tr>
                      <th scope="col" className="px-6 py-4 w-12 border-b border-gray-200 dark:border-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedCards.length === filteredCards.length && filteredCards.length > 0}
                          onChange={handleSelectAll}
                          className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                        />
                      </th>
                      {archiveOptions.created_at && <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Data</th>}
                      {archiveOptions.updated_at && <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Modifica</th>}
                      {archiveOptions.business_name && <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Ragione Sociale</th>}
                      {archiveOptions.full_name && <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Contatto</th>}
                      {archiveOptions.piva && <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">P.IVA</th>}
                      {archiveOptions.address && <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Indirizzo</th>}
                      {archiveOptions.city && <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Comune</th>}
                      {archiveOptions.province && <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Pr</th>}
                      {archiveOptions.phone && <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Telefono</th>}
                      {archiveOptions.email && <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Email</th>}
                      {archiveOptions.main_interest && <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Interesse</th>}
                      {archiveOptions.availability && <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Disp.</th>}
                      {archiveOptions.assigned_consultant && <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Consulente</th>}
                      {archiveOptions.operator_name && <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Operatore</th>}
                      <th scope="col" className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest w-[120px] sticky right-0 z-30 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-[-5px_0_15px_-5px_rgba(0,0,0,0.1)]">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                    {currentItems.map((card) => {
                      const isSelected = selectedCards.includes(card.id);
                      const isInCrm = crmCardIds.has(card.id);
                      return (
                      <tr key={card.id} className={`group transition-all cursor-pointer ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} ${isInCrm ? 'bg-yellow-100 dark:bg-yellow-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`} onClick={() => handleEditCard(card)}>
                        <td className="px-6 py-5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectCard(card.id)}
                            className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5 transition-transform group-hover:scale-110"
                          />
                        </td>
                        {archiveOptions.created_at && <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">{new Date(card.created_at).toLocaleDateString()}</td>}
                        {archiveOptions.updated_at && <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">{card.updated_at ? new Date(card.updated_at).toLocaleDateString() : '-'}</td>}
                        {archiveOptions.business_name && (
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className="group-hover:text-blue-600 transition-colors">{card.business_name}</span>
                              {isInCrm && (
                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-xl bg-yellow-300 text-yellow-900 shadow-sm">
                                  In CRM
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        {archiveOptions.full_name && <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-600 dark:text-gray-300">{card.full_name}</td>}
                        {archiveOptions.piva && <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">{card.piva}</td>}
                        {archiveOptions.address && <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400 italic">{card.address}</td>}
                        {archiveOptions.city && <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-700 dark:text-gray-200">{card.city}</td>}
                        {archiveOptions.province && <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-400 dark:text-gray-500">{card.province}</td>}
                        {archiveOptions.phone && <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-600 dark:text-gray-300 font-mono tracking-tight">{card.phone}</td>}
                        {archiveOptions.email && <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400 underline decoration-blue-500/30 underline-offset-4">{card.email}</td>}
                        {archiveOptions.main_interest && (
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold uppercase tracking-tighter">
                              {card.main_interest}
                            </span>
                          </td>
                        )}
                        {archiveOptions.availability && <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">{card.availability}</td>}
                        {archiveOptions.assigned_consultant && (
                          <td className={`px-6 py-5 whitespace-nowrap text-sm font-bold ${!card.assigned_consultant ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-200'}`}>
                            {card.assigned_consultant || 'DA ASSEGNARE'}
                          </td>
                        )}
                        {archiveOptions.operator_name && <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{card.operator_name}</td>}
                        <td className={`px-6 py-5 whitespace-nowrap text-right text-sm font-medium w-[120px] sticky right-0 z-10 shadow-[-5px_0_15px_-5px_rgba(0,0,0,0.1)] transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : isInCrm ? 'bg-yellow-100 dark:bg-yellow-900/40' : 'bg-white dark:bg-gray-800'} group-hover:bg-gray-50 dark:group-hover:bg-gray-700`}>
                          <div className="flex justify-end gap-3">
                            {card.has_external_image && (
                              <button 
                                onClick={(e) => handleViewImage(card, e)}
                                className="p-1.5 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                title="Vedi Foto"
                              >
                                <Image className="h-4 w-4" />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEditCard(card); }}
                              className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              title="Modifica"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={(e) => deleteCard(card.id, e)}
                              className="p-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              title="Elimina"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border border-gray-200 dark:border-gray-700 sm:px-6 mt-6 rounded-2xl shadow-lg">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
                >
                  Precedente
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
                >
                  Successivo
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando <span className="font-bold">{indexOfFirstItem + 1}</span> a <span className="font-bold">{Math.min(indexOfLastItem, filteredCards.length)}</span> di <span className="font-bold">{filteredCards.length}</span> risultati
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-xl border border-gray-300 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-all"
                    >
                      <span className="sr-only">Precedente</span>
                      &larr;
                    </button>
                    {/* Page Numbers */}
                    {[...Array(totalPages)].map((_, i) => {
                        if (totalPages > 7 && (i + 1 !== 1 && i + 1 !== totalPages && Math.abs(currentPage - (i + 1)) > 1)) {
                          if (i + 1 === 2 || i + 1 === totalPages - 1) return <span key={i} className="px-2 py-2 bg-white dark:bg-gray-700 border-gray-300 text-gray-500">...</span>;
                          return null;
                        }
                        return (
                          <button
                              key={i}
                              onClick={() => setCurrentPage(i + 1)}
                              aria-current={currentPage === i + 1 ? 'page' : undefined}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-bold transition-all ${
                                  currentPage === i + 1
                                      ? 'z-10 bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
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
                      <span className="sr-only">Successivo</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* IMPORT EXCEL TAB */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="mb-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-12 hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-900/50">
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-upload"
                />
                <label htmlFor="excel-upload" className="cursor-pointer group block">
                    <Upload className="mx-auto h-16 w-16 text-gray-400 group-hover:text-blue-500 transition-colors mb-4" />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                        Trascina o clicca per caricare il file Excel
                    </span>
                    <p className="mt-2 text-sm text-gray-500 uppercase tracking-widest font-medium">
                        Supporta formati .xlsx e .xls
                    </p>
                </label>
            </div>

            {/* Field Layout Guide - Disposizione Campi */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-6 mb-8">
              <h4 className="text-blue-800 dark:text-blue-300 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Disposizione dei Campi (Intestazioni Excel)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Ragione Sociale', req: true },
                  { name: 'Referente', req: false },
                  { name: 'Email', req: false },
                  { name: 'Telefono', req: false },
                  { name: 'P.IVA', req: false },
                  { name: 'Indirizzo', req: false },
                  { name: 'Città', req: false },
                  { name: 'Provincia', req: false },
                  { name: 'Disponibilità', req: false, desc: 'ALTA, MEDIA, BASSA' },
                  { name: 'Interesse', req: false, desc: 'SCOMMESSE, UTENZE, ENTRAMBI' },
                  { name: 'Consulente', req: false },
                  { name: 'Operatore', req: false },
                  { name: 'Note', req: false },
                  { name: 'Fonte', req: false },
                  { name: 'PVR Attivo', req: false, desc: 'SI/NO' },
                  { name: 'Utenze Attive', req: false, desc: 'SI/NO' }
                ].map((field, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className={`text-xs font-bold ${field.req ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {field.name} {field.req && '*'}
                    </span>
                    {field.desc && <span className="text-[10px] text-gray-500 italic">{field.desc}</span>}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[10px] text-blue-600 dark:text-blue-400 font-medium italic">
                * Campi obbligatori. Se un campo non è presente nell'Excel, verrà usato un valore predefinito.
              </p>
            </div>

            {excelData.length > 0 && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-green-500" />
                        Anteprima Dati ({excelData.length} righe)
                      </h4>
                      <button 
                        onClick={() => setExcelData([])}
                        className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-tighter"
                      >
                        Rimuovi File
                      </button>
                    </div>
                    <div className="max-h-80 overflow-auto border border-gray-200 dark:border-gray-700 rounded-2xl text-xs shadow-inner bg-white dark:bg-gray-900">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                <tr>
                                    {Object.keys(excelData[0] || {}).map(key => (
                                        <th key={key} className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                                {excelData.slice(0, 10).map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        {Object.values(row).map((val, vIdx) => (
                                            <td key={vIdx} className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{String(val)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {excelData.length > 10 && (
                          <div className="p-4 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px] bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                            ...e altre {excelData.length - 10} righe
                          </div>
                        )}
                    </div>
                    
                    <button
                        onClick={handleImportExcel}
                        disabled={loading}
                        className="mt-8 w-full flex justify-center items-center gap-3 py-5 px-6 border border-transparent rounded-2xl shadow-2xl text-xl font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50 transition-all transform active:scale-95 shadow-green-500/20"
                    >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            Importazione in corso...
                          </>
                        ) : (
                          <>
                            <CheckSquare className="h-6 w-6" />
                            CONFERMA IMPORTAZIONE SCHEDE
                          </>
                        )}
                    </button>
                </div>
            )}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4 backdrop-blur-md transition-all animate-in fade-in duration-300" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-5xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-3xl p-3 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-4 -right-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full p-2.5 shadow-2xl hover:bg-red-500 hover:text-white focus:outline-none transition-all border border-gray-100 dark:border-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={selectedImage} 
              alt="Anteprima" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-inner" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Archive;
