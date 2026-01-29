import jsPDF from 'jspdf';

export const generatePDF = (cards, globalSettings) => {
  const doc = new jsPDF();
  const cardList = Array.isArray(cards) ? cards : [cards];
  const { pdfOptions, logo: globalLogo, logoDimensions: globalLogoDimensions } = globalSettings || {};

  cardList.forEach((card, index) => {
    if (index > 0) doc.addPage();

    // Data preparation
    // Handle both flat structure (from Archive/DB) and nested/state structure (from Form)
    // DB structure: business_name, full_name, etc.
    // Form structure: businessName, fullName, etc.
    // We normalize to camelCase for internal use
    const data = {
      businessName: card.businessName || card.business_name || '',
      fullName: card.fullName || card.full_name || '',
      address: card.address || '',
      city: card.city || '',
      province: card.province || '',
      phone: card.phone || '',
      email: card.email || '',
      source: card.source || 'TELEFONO',
      availability: card.availability || 'MEDIA',
      bettingActive: card.bettingActive || card.betting_active || 'NO',
      utilitiesActive: card.utilitiesActive || card.utilities_active || 'NO',
      mainInterest: card.mainInterest || card.main_interest || 'SCOMMESSE',
      requests: card.requests || '',
      notes: card.notes || '',
      assignedConsultant: card.assignedConsultant || card.assigned_consultant || '',
      operatorName: card.operatorName || card.operator_name || '',
      signatureType: card.signatureType || card.signature_type || 'type',
      signatureData: card.signatureData || card.signature_data || '', // This should be base64 for draw, or name for type
      // Partners might be JSON string from DB or array
      bettingPartners: typeof card.bettingPartners === 'string' 
        ? JSON.parse(card.bettingPartners || '[]') 
        : (card.bettingPartners || card.betting_partners || []),
      utilityPartners: typeof card.utilityPartners === 'string'
        ? JSON.parse(card.utilityPartners || '[]')
        : (card.utilityPartners || card.utility_partners || []),
    };

    // Logo Logic
    // Prioritize global logo if exists (based on recent user request "same logo for all cards")
    // Or maybe card logo? User said "option where I can insert the same logo to all cards".
    // Let's assume global logo overrides if present in settings.
    const logoToUse = globalLogo || card.logo;
    const logoDims = globalLogoDimensions || card.logo_dimensions || card.logoDimensions;

    if (logoToUse && logoDims) {
      try {
        const format = logoToUse.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
        const maxWidth = 40;
        const maxHeight = 25;
        const scaleX = maxWidth / logoDims.width;
        const scaleY = maxHeight / logoDims.height;
        const scale = Math.min(scaleX, scaleY);
        const w = logoDims.width * scale;
        const h = logoDims.height * scale;
        doc.addImage(logoToUse, format, 15, 10, w, h);
      } catch (error) {
        console.error("Error adding logo to PDF:", error);
      }
    }

    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.setFont('helvetica', 'bold');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('SCHEDA CONSULENZA', 105, 25, { align: 'center' });
    
    doc.setFontSize(12);
    let y = 50;
    const leftCol = 20;
    const rightCol = 110;

    const drawField = (label, value, x, y) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, x, y);
      doc.setFont('helvetica', 'normal');
      
      let textToRender = value;
      let yOffset = 5;

      if (!textToRender) {
        textToRender = '_________________________'; 
        yOffset = 10;
      }
      
      const splitText = doc.splitTextToSize(textToRender, 80);
      doc.text(splitText, x, y + yOffset);
      return splitText.length * 5;
    };

    // Use default options if not provided
    const options = pdfOptions || {
      anagrafica: true,
      dettagli: false,
      note: true,
      assegnazione: true,
      firma: true,
      disclaimer: true
    };

    // Section 1: Anagrafica
    if (options.anagrafica) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Anagrafica Cliente', leftCol, y);
      doc.line(leftCol, y + 2, 190, y + 2);
      y += 15;

      doc.setFontSize(11);
      drawField('R.Sociale - Insegna', data.businessName, leftCol, y);
      drawField('Nome e Cognome', data.fullName, rightCol, y);
      y += 15;

      drawField('Indirizzo', data.address, leftCol, y);
      drawField('Comune', data.city, rightCol, y);
      y += 15;

      drawField('Provincia', data.province, leftCol, y);
      drawField('Telefono', data.phone, rightCol, y);
      y += 15;

      drawField('Email', data.email, leftCol, y);
      drawField('Fonte Acquisizione', data.source, rightCol, y);
      y += 20;
    }

    // Section 2: Dettagli Servizio
    if (options.dettagli) {
      if (y + 40 > 280) { doc.addPage(); y = 20; }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Dettagli Servizio', leftCol, y);
      doc.line(leftCol, y + 2, 190, y + 2);
      y += 15;

      doc.setFontSize(11);
      drawField('Disponibilità Cliente', data.availability, leftCol, y);
      drawField('Interesse Maggiore', data.mainInterest === 'SCOMMESSE' ? 'PVR' : data.mainInterest, rightCol, y);
      y += 15;

      drawField('Servizio PVR Attivo', data.bettingActive, leftCol, y);
      drawField('Servizio Utenze Attivo', data.utilitiesActive, rightCol, y);
      
      let extraHeight = 0;
      if (data.bettingActive === 'SI' && data.bettingPartners.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        const partnersText = `Partner: ${data.bettingPartners.join(', ')}`;
        const splitPartners = doc.splitTextToSize(partnersText, 80);
        doc.text(splitPartners, leftCol, y + 10);
        extraHeight = Math.max(extraHeight, splitPartners.length * 5 + 5);
      }

      if (data.utilitiesActive === 'SI' && data.utilityPartners.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        const partnersText = `Partner: ${data.utilityPartners.join(', ')}`;
        const splitPartners = doc.splitTextToSize(partnersText, 80);
        doc.text(splitPartners, rightCol, y + 10);
        extraHeight = Math.max(extraHeight, splitPartners.length * 5 + 5);
      }
      y += 20 + extraHeight;
    }

    // Section 3: Note e Richieste
    if (options.note) {
      if (y + 40 > 280) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Note e Richieste', leftCol, y);
      doc.line(leftCol, y + 2, 190, y + 2);
      y += 15;
      doc.setFontSize(11);
      const reqHeight = drawField('Richieste del Cliente', data.requests, leftCol, y);
      const notesHeight = drawField('Note', data.notes, rightCol, y);
      y += Math.max(reqHeight, notesHeight) + 20;
    }

    // Assegnazione Section
    if (options.assegnazione) {
      if (y + 30 > 280) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Consulente Assegnato:', leftCol, y);
      doc.setFont('helvetica', 'normal');
      const consultantText = data.assignedConsultant || '_________________________';
      doc.text(consultantText, leftCol + 45, y);
      y += 20;
    }

    // Signature Section
    if (options.firma) {
      if (y + 50 > 280) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Firma Operatore', leftCol, y);
      doc.text('Firma Consulente', rightCol, y);
      doc.line(leftCol, y + 2, 190, y + 2);
      y += 10;

      // Operator Signature
      if (data.signatureType === 'draw' && data.signatureData) {
        try {
          doc.addImage(data.signatureData, 'PNG', leftCol, y, 60, 30);
        } catch (e) {
          console.error("Error adding signature image", e);
        }
      } else if (data.signatureType === 'type' && data.operatorName) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(12);
        doc.text(data.operatorName, leftCol, y + 20);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
      } else {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('(Nessuna firma apposta)', leftCol, y + 20);
        doc.setTextColor(0);
      }
      
      // Consultant Signature Placeholder
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('_________________________', rightCol, y + 20);
      doc.setTextColor(0);
      y += 40;
    }
    
    // Disclaimer
    if (options.disclaimer) {
      if (y + 30 > 280) { doc.addPage(); y = 20; }
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'italic');
      const disclaimerText = "Avviso - I contatti presenti in questa scheda sono stati individuati tramite ricerche svolte con criteri accurati e non costituiscono appuntamenti, richieste dirette o manifestazioni di interesse da parte dei soggetti indicati. L’utilizzo dei dati è a esclusiva responsabilità dell’utente, nel rispetto della normativa vigente.";
      const splitDisclaimer = doc.splitTextToSize(disclaimerText, 170);
      doc.text(splitDisclaimer, 105, y, { align: 'center' });
      doc.setTextColor(0);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generato il: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} - CONSULTING DESK by DESA SERVICE S.R.L.S.`, 105, pageHeight - 10, { align: 'center' });
  });

  const fileName = cardList.length === 1 
    ? `scheda_${cardList[0].fullName || cardList[0].full_name || 'cliente'}.pdf`
    : `schede_consulenza_batch_${new Date().toISOString().slice(0,10)}.pdf`;
    
  doc.save(fileName);
};
