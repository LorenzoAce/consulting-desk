import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { generatePDF as generatePDFUtility } from '../utils/pdfGenerator';
import { getApiUrl } from '../utils/api';
import { Eraser, FileDown, PenTool, Type, Plus, X, Upload, Save, ArrowLeft } from 'lucide-react';

const ConsultingForm = ({ initialData, onBack }) => {
  const [signatureType, setSignatureType] = useState('type'); // 'draw' | 'type'
  const [logo, setLogo] = useState(null);
  const [logoDimensions, setLogoDimensions] = useState(null);
  const [formData, setFormData] = useState({
    businessName: '',
    fullName: '',
    address: '',
    city: '',
    province: '',
    phone: '',
    email: '',
    source: 'TELEFONO',
    availability: 'MEDIA',
    bettingActive: 'NO',
    utilitiesActive: 'NO',
    mainInterest: 'SCOMMESSE',
    requests: '',
    notes: '',
    assignedConsultant: '',
    operatorName: ''
  });

  const [bettingPartners, setBettingPartners] = useState([]);
  const [utilityPartners, setUtilityPartners] = useState([]);
  const [newBettingPartner, setNewBettingPartner] = useState('');
  const [newUtilityPartner, setNewUtilityPartner] = useState('');
  const [consultantsList, setConsultantsList] = useState([]);
  
  // Cities autocomplete state
  const [allCities, setAllCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isCityLoading, setIsCityLoading] = useState(false);

  // Address autocomplete state
  const [filteredAddresses, setFilteredAddresses] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const addressTimeoutRef = useRef(null);

  // PDF Generation Options State
  const [pdfOptions, setPdfOptions] = useState({
    anagrafica: true,
    dettagli: false,
    note: true,
    assegnazione: true,
    firma: true,
    disclaimer: true
  });

  const sigCanvas = useRef({});

  // Load cities data and global settings
  useEffect(() => {
    const fetchCities = async () => {
      setIsCityLoading(true);
      try {
        // Using a reliable open source repository for Italian municipalities
        const response = await fetch('https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json');
        if (response.ok) {
          const data = await response.json();
          setAllCities(data);
        }
      } catch (error) {
        console.error('Error loading cities:', error);
      } finally {
        setIsCityLoading(false);
      }
    };
    
    const fetchSettings = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/settings`);
        if (response.ok) {
          const data = await response.json();
          if (data.pdf_options) {
            setPdfOptions(data.pdf_options);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
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
        console.error('Error loading consultants:', error);
      }
    };

    fetchCities();
    fetchSettings();
    fetchConsultants();
  }, []);

  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData({
        businessName: initialData.business_name || '',
        fullName: initialData.full_name || '',
        address: initialData.address || '',
        city: initialData.city || '',
        province: initialData.province || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        source: initialData.source || 'TELEFONO',
        availability: initialData.availability || 'MEDIA',
        bettingActive: initialData.betting_active || 'NO',
        utilitiesActive: initialData.utilities_active || 'NO',
        mainInterest: initialData.main_interest || 'SCOMMESSE',
        requests: initialData.requests || '',
        notes: initialData.notes || '',
        assignedConsultant: initialData.assigned_consultant || '',
        operatorName: initialData.operator_name || ''
      });
      
      setBettingPartners(initialData.betting_partners || []);
      setUtilityPartners(initialData.utility_partners || []);
      
      if (initialData.logo) {
        setLogo(initialData.logo);
        setLogoDimensions(initialData.logo_dimensions);
      }

      if (initialData.signature_type) {
        setSignatureType(initialData.signature_type);
      }
      
      // Note: We cannot easily restore the drawn signature to the canvas
      // But we can restore the typed signature
    }
  }, [initialData]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        // Create an image to get dimensions
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    const upperValue = value.toUpperCase();
    
    setFormData(prev => ({ ...prev, [name]: upperValue }));

    // Handle city autocomplete logic
    if (name === 'city') {
      if (value.length > 1) {
        const matches = allCities.filter(c => 
          c.nome.toUpperCase().startsWith(upperValue)
        ).slice(0, 10); // Limit to 10 suggestions
        setFilteredCities(matches);
        setShowCitySuggestions(true);
      } else {
        setShowCitySuggestions(false);
      }
    }

    // Handle address autocomplete logic
    if (name === 'address') {
      if (addressTimeoutRef.current) clearTimeout(addressTimeoutRef.current);
      
      if (value.length > 2) {
        setIsAddressLoading(true);
        addressTimeoutRef.current = setTimeout(async () => {
          try {
            // Use Nominatim OpenStreetMap API for address search
            // Focus on Italy
            const query = encodeURIComponent(value);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=it&addressdetails=1&limit=5`);
            
            if (response.ok) {
              const data = await response.json();
              setFilteredAddresses(data);
              setShowAddressSuggestions(true);
            }
          } catch (error) {
            console.error('Error searching address:', error);
          } finally {
            setIsAddressLoading(false);
          }
        }, 500); // Debounce 500ms to avoid too many requests
      } else {
        setShowAddressSuggestions(false);
        setIsAddressLoading(false);
      }
    }
  };

  const selectCity = (cityData) => {
    setFormData(prev => ({
      ...prev,
      city: cityData.nome.toUpperCase(),
      province: cityData.sigla.toUpperCase()
    }));
    setShowCitySuggestions(false);
  };

  const selectAddress = (addressData) => {
    // Extract address components
    const road = addressData.address.road || '';
    const houseNumber = addressData.address.house_number || '';
    const fullAddress = `${road} ${houseNumber}`.trim().toUpperCase();
    
    // Extract city and province if available
    const city = (addressData.address.city || addressData.address.town || addressData.address.village || '').toUpperCase();
    
    // Find province code if possible (Nominatim returns full province name usually)
    let provinceCode = '';
    
    if (city) {
        // Try to find matching city in our local database to get the correct province code
        const matchingCity = allCities.find(c => c.nome.toUpperCase() === city);
        if (matchingCity) {
            provinceCode = matchingCity.sigla;
        }
    }

    setFormData(prev => ({
      ...prev,
      address: fullAddress || addressData.display_name.split(',')[0].toUpperCase(),
      city: city || prev.city,
      province: provinceCode || prev.province
    }));
    
    setShowAddressSuggestions(false);
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  const addPartner = (type) => {
    if (type === 'betting' && newBettingPartner.trim()) {
      setBettingPartners([...bettingPartners, newBettingPartner.trim().toUpperCase()]);
      setNewBettingPartner('');
    } else if (type === 'utility' && newUtilityPartner.trim()) {
      setUtilityPartners([...utilityPartners, newUtilityPartner.trim().toUpperCase()]);
      setNewUtilityPartner('');
    }
  };

  const removePartner = (type, index) => {
    if (type === 'betting') {
      setBettingPartners(bettingPartners.filter((_, i) => i !== index));
    } else if (type === 'utility') {
      setUtilityPartners(utilityPartners.filter((_, i) => i !== index));
    }
  };

  const generatePDF = () => {
    let signatureDataToUse = '';
    if (signatureType === 'draw') {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
          signatureDataToUse = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        } else if (initialData && initialData.signature_type === 'draw') {
           signatureDataToUse = initialData.signature_data;
        }
    }

    const cardData = {
        ...formData,
        signatureType,
        signatureData: signatureDataToUse,
        bettingPartners,
        utilityPartners,
        logo,
        logoDimensions
    };
    
    generatePDFUtility(cardData, { pdfOptions });
  };

  const handleSave = async () => {
    // Check for duplicates before saving
    try {
      const apiUrl = getApiUrl();
      const checkResponse = await fetch(`${apiUrl}/api/cards/check-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          email: formData.email,
          phone: formData.phone,
          id: initialData ? initialData.id : null
        })
      });

      if (checkResponse.ok) {
        const { duplicates } = await checkResponse.json();
        if (duplicates.length > 0) {
          const duplicate = duplicates[0];
          let message = 'Attenzione: Esiste già una scheda con ';
          if (duplicate.business_name === formData.businessName) message += 'questa Ragione Sociale.';
          else if (duplicate.phone === formData.phone) message += 'questo Telefono.';
          else if (duplicate.email === formData.email) message += 'questa Email.';
          
          message += '\nVuoi procedere comunque al salvataggio?';
          
          if (!window.confirm(message)) {
            return;
          }
        }
      }
    } catch (error) {
      console.error("Error checking duplicates:", error);
      // Continue saving if check fails to avoid blocking the user
    }

    try {
      let signatureDataToSave = '';

      if (signatureType === 'draw') {
        if (!sigCanvas.current.isEmpty()) {
          // Get the base64 string directly from the canvas
          signatureDataToSave = sigCanvas.current.toDataURL('image/png');
        } else if (initialData && initialData.signature_type === 'draw') {
           // Keep existing signature if not modified
           signatureDataToSave = initialData.signature_data;
        }
      } else {
         signatureDataToSave = formData.operatorName;
      }
      
      const dataToSubmit = {
        ...formData,
        signatureType,
        signatureData: signatureDataToSave,
        bettingPartners,
        utilityPartners,
        logo,
        logoDimensions
      };

      const apiUrl = getApiUrl();
      
      const isUpdate = initialData && initialData.id;
      const url = isUpdate ? `${apiUrl}/api/cards/${initialData.id}` : `${apiUrl}/api/cards`;
      const method = isUpdate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (response.ok) {
        alert(isUpdate ? 'Scheda aggiornata con successo!' : 'Scheda salvata con successo!');
        
        if (!initialData) {
            setFormData({
                businessName: '',
                fullName: '',
                address: '',
                city: '',
                province: '',
                phone: '',
                email: '',
                source: 'TELEFONO',
                availability: 'MEDIA',
                bettingActive: 'NO',
                utilitiesActive: 'NO',
                mainInterest: 'SCOMMESSE',
                requests: '',
                notes: '',
                assignedConsultant: '',
                operatorName: ''
              });
              setBettingPartners([]);
              setUtilityPartners([]);
              if (sigCanvas.current && typeof sigCanvas.current.clear === 'function') {
                  sigCanvas.current.clear();
              }
        }
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        alert(`Errore durante il salvataggio della scheda: ${errorData.details || errorData.error || 'Errore sconosciuto'}`);
      }
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Errore di connessione al server');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden transition-colors duration-200">
      
      {onBack && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-16 z-10">
           <button 
             onClick={onBack}
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors animate-pulse-scale"
           >
             <ArrowLeft className="h-4 w-4" />
             Torna Indietro
           </button>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Logo Upload (Optional) */}
        <section className="border-b dark:border-gray-700 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Logo Agenzia</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Carica il logo della tua agenzia per personalizzare il PDF (opzionale)</p>
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              {!logo ? (
                <label
                  htmlFor="logo-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Carica Logo
                </label>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 relative border dark:border-gray-600 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                    <img src={logo} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                  </div>
                  <button
                    onClick={() => setLogo(null)}
                    className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Rimuovi Logo"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Anagrafica */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 pb-2 mb-4">Anagrafica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">R.Sociale - Insegna</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome e Cognome</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Indirizzo</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                autoComplete="off"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
                placeholder={isAddressLoading ? "Ricerca indirizzo..." : ""}
              />
              {showAddressSuggestions && filteredAddresses.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                  {filteredAddresses.map((item, index) => (
                    <li
                      key={`${item.place_id}-${index}`}
                      onClick={() => selectAddress(item)}
                      className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 last:border-0"
                    >
                      <div className="font-medium">{item.address.road} {item.address.house_number}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.address.city || item.address.town || item.address.village}, {item.address.county || item.address.province}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Comune</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                onFocus={() => formData.city.length > 1 && setShowCitySuggestions(true)}
                autoComplete="off"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
                placeholder={isCityLoading ? "Caricamento comuni..." : ""}
              />
              {showCitySuggestions && filteredCities.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                  {filteredCities.map((city, index) => (
                    <li
                      key={`${city.codice}-${index}`}
                      onClick={() => selectCity(city)}
                      className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                    >
                      {city.nome} ({city.sigla})
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provincia</label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefono</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fonte Acquisizione</label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
              >
                <option value="TELEFONO">TELEFONO</option>
                <option value="WEB">WEB</option>
                <option value="PASSAPAROLA">PASSAPAROLA</option>
                <option value="ALTRO">ALTRO</option>
              </select>
            </div>
          </div>
        </section>

        {/* Dettagli */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 pb-2 mb-4">Dettagli Servizio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Disponibilità Cliente</label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
              >
                <option value="BASSA">BASSA</option>
                <option value="MEDIA">MEDIA</option>
                <option value="ALTA">ALTA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Interesse Maggiore</label>
              <select
                name="mainInterest"
                value={formData.mainInterest}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
              >
                <option value="SCOMMESSE">PVR</option>
                <option value="UTENZE">UTENZE</option>
                <option value="ENTRAMBI">ENTRAMBI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Servizio PVR Attivo</label>
              <select
                name="bettingActive"
                value={formData.bettingActive}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
              >
                <option value="SI">SI</option>
                <option value="NO">NO</option>
              </select>
              {formData.bettingActive === 'SI' && (
                <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Aggiungi Partner PVR</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newBettingPartner}
                      onChange={(e) => setNewBettingPartner(e.target.value.toUpperCase())}
                      placeholder="Nome Partner"
                      className="flex-1 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1 bg-white dark:bg-gray-700 dark:text-white"
                      onKeyPress={(e) => e.key === 'Enter' && addPartner('betting')}
                    />
                    <button
                      onClick={() => addPartner('betting')}
                      className="bg-blue-600 dark:bg-blue-500 text-white p-1 rounded hover:bg-blue-700 dark:hover:bg-blue-600"
                      title="Aggiungi"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {bettingPartners.length > 0 && (
                    <ul className="space-y-1">
                      {bettingPartners.map((partner, index) => (
                        <li key={index} className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-1 rounded border border-gray-200 dark:border-gray-700">
                          <span className="truncate dark:text-gray-300">{partner}</span>
                          <button
                            onClick={() => removePartner('betting', index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Servizio Utenze Attivo</label>
              <select
                name="utilitiesActive"
                value={formData.utilitiesActive}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
              >
                <option value="SI">SI</option>
                <option value="NO">NO</option>
              </select>
              {formData.utilitiesActive === 'SI' && (
                <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Aggiungi Partner Utenze</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newUtilityPartner}
                      onChange={(e) => setNewUtilityPartner(e.target.value.toUpperCase())}
                      placeholder="Nome Partner"
                      className="flex-1 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1 bg-white dark:bg-gray-700 dark:text-white"
                      onKeyPress={(e) => e.key === 'Enter' && addPartner('utility')}
                    />
                    <button
                      onClick={() => addPartner('utility')}
                      className="bg-blue-600 dark:bg-blue-500 text-white p-1 rounded hover:bg-blue-700 dark:hover:bg-blue-600"
                      title="Aggiungi"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {utilityPartners.length > 0 && (
                    <ul className="space-y-1">
                      {utilityPartners.map((partner, index) => (
                        <li key={index} className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-1 rounded border border-gray-200 dark:border-gray-700">
                          <span className="truncate dark:text-gray-300">{partner}</span>
                          <button
                            onClick={() => removePartner('utility', index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Note */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 pb-2 mb-4">Note e Richieste</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Richieste del Cliente</label>
              <textarea
                name="requests"
                value={formData.requests}
                onChange={handleChange}
                rows={1}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Note Varie</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={1}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
              />
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 pb-2 mb-4">Assegnazione</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Consulente Assegnato</label>
            <select
              name="assignedConsultant"
              value={formData.assignedConsultant}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
            >
              <option value="">Seleziona un consulente...</option>
              {consultantsList.map((consultant) => (
                <option key={consultant.id} value={consultant.name}>
                  {consultant.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Firma */}
        <section>
          <div className="flex justify-between items-center border-b dark:border-gray-700 pb-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <PenTool className="h-5 w-5" /> Firma Operatore
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSignatureType('draw')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  signatureType === 'draw'
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span className="flex items-center gap-1"><PenTool className="h-3 w-3" /> Disegna</span>
              </button>
              <button
                onClick={() => setSignatureType('type')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  signatureType === 'type'
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span className="flex items-center gap-1"><Type className="h-3 w-3" /> Scrivi</span>
              </button>
            </div>
          </div>

          {signatureType === 'draw' ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{
                  className: 'w-full h-40 bg-white border border-gray-200 rounded-md cursor-crosshair'
                }}
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={clearSignature}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1"
                >
                  <Eraser className="h-4 w-4" /> Pulisci
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inserisci nome operatore</label>
               <input
                type="text"
                name="operatorName"
                value={formData.operatorName}
                onChange={handleChange}
                placeholder="Nome e Cognome"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white border p-2"
              />
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <div className="pt-6 flex flex-col sm:flex-row gap-4 border-t dark:border-gray-700 mt-6">
          <button
            onClick={generatePDF}
            className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <FileDown className="h-5 w-5" />
            Genera PDF
          </button>

          <button
            onClick={handleSave}
            className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            <Save className="h-5 w-5" />
            Salva in Archivio
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultingForm;
