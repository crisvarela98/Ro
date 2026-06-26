window.initPdfDownload = ({ downloadBtn, bookPage, updateBookContent, totalPages, getCurrentPage, setCurrentPage, fileName = 'Libro-de-recuerdos.pdf' }) => {
  if (!downloadBtn || !bookPage || !updateBookContent || typeof getCurrentPage !== 'function' || typeof setCurrentPage !== 'function') {
    console.error('❌ ERROR EN INICIALIZACIÓN PDF: Faltan argumentos requeridos.');
    downloadBtn && (downloadBtn.disabled = true);
    return;
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let isGeneratingPdf = false;

  // Dimensiones del contenedor de captura (landscape A4 a 150dpi aprox)
  const CAPTURE_W = 1587;
  const CAPTURE_H = 1122;

  const cargarLibrerias = async (maxIntentos = 80) => {
    for (let i = 0; i < maxIntentos; i++) {
      const h2c = window.html2canvas;
      const jsPDF = window.jspdf?.jsPDF;
      if (h2c && jsPDF) return { html2canvas: h2c, jsPDF };
      await sleep(100);
    }
    return { html2canvas: null, jsPDF: null };
  };

  // Crea el contenedor oculto de alta calidad para captura
  const crearContenedorCaptura = () => {
    const existing = document.getElementById('pdf-capture-container');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.id = 'pdf-capture-container';
    wrap.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: ${CAPTURE_W}px;
      height: ${CAPTURE_H}px;
      background: linear-gradient(180deg, #fff8f0 0%, #fff5ec 100%);
      border-radius: 0;
      display: flex;
      flex-direction: row;
      overflow: hidden;
      font-family: 'Lora', Georgia, serif;
      z-index: -1;
    `;

    // Columna izquierda: imagen
    const imgCol = document.createElement('div');
    imgCol.id = 'pdf-img-col';
    imgCol.style.cssText = `
      width: 65%;
      height: 100%;
      overflow: hidden;
      flex-shrink: 0;
      position: relative;
    `;
    const img = document.createElement('img');
    img.id = 'pdf-img';
    img.crossOrigin = 'anonymous';
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
      display: block;
      background: #fff5f0;
    `;
    imgCol.appendChild(img);

    // Columna derecha: texto + número de página
    const textCol = document.createElement('div');
    textCol.id = 'pdf-text-col';
    textCol.style.cssText = `
      width: 35%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      padding: 60px 50px;
      background: linear-gradient(160deg, #fff8f5, #fff0ec);
      box-sizing: border-box;
      position: relative;
    `;

    const decorLine = document.createElement('div');
    decorLine.style.cssText = `
      width: 48px;
      height: 4px;
      background: linear-gradient(90deg, #d88a9b, #d8b57a);
      border-radius: 4px;
      margin-bottom: 32px;
    `;

    const textNode = document.createElement('p');
    textNode.id = 'pdf-text';
    textNode.style.cssText = `
      font-family: 'Lora', Georgia, serif;
      font-style: italic;
      font-size: 28px;
      line-height: 1.8;
      color: #4c2a33;
      margin: 0 0 auto 0;
      word-break: break-word;
    `;

    const pageNum = document.createElement('span');
    pageNum.id = 'pdf-pagenum';
    pageNum.style.cssText = `
      margin-top: 40px;
      font-family: 'Noto Sans', sans-serif;
      font-size: 20px;
      color: #b07080;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    `;

    textCol.appendChild(decorLine);
    textCol.appendChild(textNode);
    textCol.appendChild(pageNum);

    wrap.appendChild(imgCol);
    wrap.appendChild(textCol);
    document.body.appendChild(wrap);
    return wrap;
  };

  const mostrarError = (titulo, mensaje) => {
    alert(`${titulo}\n\n${mensaje}`);
  };

  downloadBtn.addEventListener('click', async () => {
    if (isGeneratingPdf) return;
    isGeneratingPdf = true;

    const previousLabel = downloadBtn.textContent;

    try {
      downloadBtn.disabled = true;
      downloadBtn.textContent = '⏳ Preparando...';
      downloadBtn.style.opacity = '0.6';

      const { html2canvas, jsPDF } = await cargarLibrerias();

      if (!html2canvas || !jsPDF) {
        throw new Error('No se pudieron cargar las librerías. Recargá la página e intentá de nuevo.');
      }

      // PDF en landscape A4
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
        compress: true,
      });

      pdf.setProperties({
        title: 'Libro de Recuerdos',
        author: 'Con amor',
        subject: 'Libro personalizado de recuerdos',
      });

      const originalPage = getCurrentPage();
      const captureWrap = crearContenedorCaptura();
      const captureImg = document.getElementById('pdf-img');
      const captureText = document.getElementById('pdf-text');
      const capturePageNum = document.getElementById('pdf-pagenum');

      // Cargar fuente de Google para el contenedor oculto
      if (!document.getElementById('pdf-font-link')) {
        const link = document.createElement('link');
        link.id = 'pdf-font-link';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Lora:ital@1&display=swap';
        document.head.appendChild(link);
        await sleep(800);
      }

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      for (let page = 1; page <= totalPages; page++) {
        downloadBtn.textContent = `⏳ ${Math.round((page / totalPages) * 100)}% (${page}/${totalPages})`;

        // Obtener datos de la página actual desde el libro
        setCurrentPage(page);
        updateBookContent(page);
        await sleep(300);

        // Obtener src de la imagen activa
        const activeImg = document.getElementById('pageImage');
        const activeText = document.getElementById('pageText');

        captureImg.src = activeImg ? activeImg.src : '';
        captureText.textContent = activeText ? activeText.textContent : '';
        capturePageNum.textContent = `${page} / ${totalPages}`;

        // Esperar a que la imagen cargue
        if (captureImg.src) {
          await new Promise((res) => {
            if (captureImg.complete && captureImg.naturalWidth > 0) return res();
            captureImg.onload = res;
            captureImg.onerror = res;
            setTimeout(res, 4000);
          });
        }

        await sleep(200);

        const canvas = await html2canvas(captureWrap, {
          backgroundColor: '#fff8f0',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: CAPTURE_W,
          height: CAPTURE_H,
          imageTimeout: 30000,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);

        if (page < totalPages) pdf.addPage();
        console.log(`✅ Página ${page}/${totalPages}`);
      }

      captureWrap.remove();
      setCurrentPage(originalPage);
      updateBookContent(originalPage);

      pdf.save(fileName);

      downloadBtn.textContent = '✅ PDF Descargado';
      downloadBtn.style.background = '#51cf66';
      setTimeout(() => {
        downloadBtn.textContent = previousLabel;
        downloadBtn.style.background = '';
      }, 2500);

    } catch (error) {
      console.error('❌ ERROR:', error);
      mostrarError('No se pudo generar el PDF', error.message);
      downloadBtn.textContent = previousLabel;
      downloadBtn.style.background = '';
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.style.opacity = '1';
      downloadBtn.style.cursor = 'pointer';
      isGeneratingPdf = false;
    }
  });

  console.log('✅ Sistema PDF inicializado (v3.0 - Multi-CDN)');
};
