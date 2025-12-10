import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import { Eraser, FileDown, PenTool, Type, Plus, X, Upload } from 'lucide-react';

const ConsultingForm = () => {
  const [signatureType, setSignatureType] = useState('type'); // 'draw' | 'type'
  const [logo, setLogo] = useState(null);
  const [logoDimensions, setLogoDimensions] = useState(null);
  const [formData, setFormData] = useState({
    businessName: '',
    fullName: '',
    address: '',
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
    operatorName: ''
  });

  const [bettingPartners, setBettingPartners] = useState([]);
  const [utilityPartners, setUtilityPartners] = useState([]);
  const [newBettingPartner, setNewBettingPartner] = useState('');
  const [newUtilityPartner, setNewUtilityPartner] = useState('');

  const sigCanvas = useRef({});

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
    setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
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
    const doc = new jsPDF();
    
    // Header / Logo
    // Logo is positioned at x=15, y=10 with max dimensions 40x25
    // Title is centered at x=105, y=25 to align vertically with the logo
    
    if (logo && logoDimensions) {
      try {
        const format = logo.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
        
        // Define max dimensions for the logo in the PDF
        const maxWidth = 40;
        const maxHeight = 25;

        // Calculate scale factor to fit within max dimensions while maintaining aspect ratio
        const scaleX = maxWidth / logoDimensions.width;
        const scaleY = maxHeight / logoDimensions.height;
        const scale = Math.min(scaleX, scaleY);

        const w = logoDimensions.width * scale;
        const h = logoDimensions.height * scale;

        // Center logo vertically in the 10-35 range if needed, but top-aligning at 10 is fine
        // for "same line" alignment with text at y=25 (baseline)
        doc.addImage(logo, format, 15, 10, w, h);
      } catch (error) {
        console.error("Error adding logo to PDF:", error);
      }
    }

    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235); // Blue-600 #2563eb
    doc.setFont('helvetica', 'bold');
    
    // Subtitle / Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    // Always center the title
    doc.text('SCHEDA CONSULENZA', 105, 25, { align: 'center' });
    
    doc.setFontSize(12);
    let y = 50;
    const lineHeight = 10;
    const leftCol = 20;
    const rightCol = 110;

    // Helper to draw a field
    const drawField = (label, value, x, y) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, x, y);
      doc.setFont('helvetica', 'normal');
      
      let textToRender = value;
      let yOffset = 5;

      if (!textToRender) {
        // Use shorter underscores for empty fields, adapted for manual filling
        // Increased distance from title (yOffset) and reduced length
        textToRender = '_________________________'; 
        yOffset = 10;
      }
      
      const splitText = doc.splitTextToSize(textToRender, 80);
      doc.text(splitText, x, y + yOffset);
      return splitText.length * 5; // Return height used
    };

    // Section 1: Anagrafica
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Anagrafica Cliente', leftCol, y);
    doc.line(leftCol, y + 2, 190, y + 2);
    y += 15;

    doc.setFontSize(11);
    
    drawField('Nome Attività', formData.businessName, leftCol, y);
    drawField('Nome e Cognome', formData.fullName, rightCol, y);
    y += 15;

    drawField('Indirizzo', formData.address, leftCol, y);
    drawField('Provincia', formData.province, rightCol, y);
    y += 15;

    drawField('Telefono', formData.phone, leftCol, y);
    drawField('Email', formData.email, rightCol, y);
    y += 15;

    drawField('Fonte Acquisizione', formData.source, leftCol, y);
    y += 20;

    // Section 2: Dettagli Servizio
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Dettagli Servizio', leftCol, y);
    doc.line(leftCol, y + 2, 190, y + 2);
    y += 15;

    doc.setFontSize(11);
    drawField('Disponibilità Cliente', formData.availability, leftCol, y);
    drawField('Interesse Maggiore', formData.mainInterest, rightCol, y);
    y += 15;

    drawField('Servizio Scommesse Attivo', formData.bettingActive, leftCol, y);
    drawField('Servizio Utenze Attivo', formData.utilitiesActive, rightCol, y);
    
    let extraHeight = 0;
    
    if (formData.bettingActive === 'SI' && bettingPartners.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      const partnersText = `Partner: ${bettingPartners.join(', ')}`;
      const splitPartners = doc.splitTextToSize(partnersText, 80);
      doc.text(splitPartners, leftCol, y + 10);
      extraHeight = Math.max(extraHeight, splitPartners.length * 5 + 5);
    }

    if (formData.utilitiesActive === 'SI' && utilityPartners.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      const partnersText = `Partner: ${utilityPartners.join(', ')}`;
      const splitPartners = doc.splitTextToSize(partnersText, 80);
      doc.text(splitPartners, rightCol, y + 10);
      extraHeight = Math.max(extraHeight, splitPartners.length * 5 + 5);
    }
    
    y += 20 + extraHeight;

    // Section 3: Note e Richieste
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    // Check space for Section 3 Header
    if (y + 40 > 280) {
      doc.addPage();
      y = 20;
    }

    doc.text('Note e Richieste', leftCol, y);
    doc.line(leftCol, y + 2, 190, y + 2);
    y += 15;

    doc.setFontSize(11);
    
    // Requests and Notes side-by-side
    const reqHeight = drawField('Richieste del Cliente', formData.requests, leftCol, y);
    const notesHeight = drawField('Note', formData.notes, rightCol, y);
    
    y += Math.max(reqHeight, notesHeight) + 20;

    // Check if we need a new page for signature
    if (y + 40 > 280) {
      doc.addPage();
      y = 20;
    }

    // Signature Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    // Left: Firma Operatore
    doc.text('Firma Operatore', leftCol, y);
    
    // Right: Firma Consulente
    doc.text('Firma Consulente', rightCol, y);
    
    doc.line(leftCol, y + 2, 190, y + 2);
    y += 10;

    // Render Operator Signature (Left)
    if (signatureType === 'draw' && !sigCanvas.current.isEmpty()) {
      const sigData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      doc.addImage(sigData, 'PNG', leftCol, y, 60, 30);
    } else if (signatureType === 'type' && formData.operatorName) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(12);
      doc.text(formData.operatorName, leftCol, y + 20);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('(Nessuna firma apposta)', leftCol, y + 20);
      doc.setTextColor(0);
    }
    
    // Render Consultant Signature Placeholder (Right)
    doc.setFontSize(10);
    doc.setTextColor(150);
    // Placeholder for manual signature
    doc.text('_________________________', rightCol, y + 20);
    doc.setTextColor(0);

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text(`Generato il: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} - CONSULTING DESK`, 105, pageHeight - 10, { align: 'center' });

    doc.save(`scheda_${formData.fullName.replace(/\s+/g, '_') || 'cliente'}.pdf`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden transition-colors duration-200">
      
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Attività</label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Indirizzo</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white border p-2"
              />
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
                <option value="SCOMMESSE">SCOMMESSE</option>
                <option value="UTENZE">UTENZE</option>
                <option value="ENTRAMBI">ENTRAMBI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Servizio Scommesse Attivo</label>
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
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Aggiungi Partner Scommesse</label>
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

        {/* Action */}
        <div className="pt-6">
          <button
            onClick={generatePDF}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <FileDown className="h-5 w-5" />
            Genera PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultingForm;
