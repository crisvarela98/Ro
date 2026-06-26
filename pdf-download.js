window.initPdfDownload = ({ downloadBtn, bookPage, updateBookContent, totalPages, getCurrentPage, setCurrentPage, fileName = 'Libro-de-recuerdos.pdf' }) => {
  if (!downloadBtn || !bookPage || !updateBookContent || typeof getCurrentPage !== 'function' || typeof setCurrentPage !== 'function') {
    console.error('❌ ERROR EN INICIALIZACIÓN PDF: Faltan argumentos requeridos.');
    downloadBtn && (downloadBtn.disabled = true);
    return;
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let isGeneratingPdf = false;

  // A4 landscape a 150dpi: 297mm × 210mm → px
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
      background: #fffaf6;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: Georgia, serif;
    `;

    /* ── Franja superior ── */
    const header = document.createElement('div');
    header.style.cssText = `
      width: 100%;
      height: 52px;
      background: linear-gradient(90deg, #c97b8e, #d8a87c);
      display: flex;
      align-items: center;
      padding: 0 48px;
      box-sizing: border-box;
      flex-shrink: 0;
    `;
    const headerTitle = document.createElement('span');
    headerTitle.textContent = 'Libro de recuerdos';
    headerTitle.style.cssText = `
      color: white;
      font-size: 22px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      font-family: Georgia, serif;
    `;
    header.appendChild(headerTitle);

    /* ── Cuerpo: imagen + texto ── */
    const body = document.createElement('div');
    body.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: row;
      min-height: 0;
    `;

    /* Columna imagen */
    const imgCol = document.createElement('div');
    imgCol.style.cssText = `
      width: 68%;
      height: 100%;
      overflow: hidden;
      flex-shrink: 0;
      background: #f5ece8;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    const img = document.createElement('img');
    img.id = 'pdf-img';
    img.crossOrigin = 'anonymous';
    img.style.cssText = `
      display: block;
      max-width: 100%;
      max-height: 100%;
    `;
    imgCol.appendChild(img);

    /* Columna texto */
    const textCol = document.createElement('div');
    textCol.style.cssText = `
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 52px 48px 40px 48px;
      box-sizing: border-box;
      background: linear-gradient(160deg, #fffaf7 0%, #fff3ee 100%);
      border-left: 1px solid rgba(200,150,140,0.18);
    `;

    /* Florcita decorativa */
    const deco = document.createElement('div');
    deco.style.cssText = `
      font-size: 28px;
      margin-bottom: 24px;
      color: #c97b8e;
    `;
    deco.textContent = '❤';

    const textNode = document.createElement('p');
    textNode.id = 'pdf-text';
    textNode.style.cssText = `
      font-family: Georgia, 'Times New Roman', serif;
      font-style: italic;
      font-size: 26px;
      line-height: 1.85;
      color: #4c2a33;
      margin: 0 0 auto 0;
      word-break: break-word;
    `;

    /* Número de página */
    const pageNumWrap = document.createElement('div');
    pageNumWrap.style.cssText = `
      margin-top: 36px;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    const pageNumLine = document.createElement('div');
    pageNumLine.style.cssText = `
      height: 1px;
      width: 32px;
      background: #c97b8e;
    `;
    const pageNum = document.createElement('span');
    pageNum.id = 'pdf-pagenum';
    pageNum.style.cssText = `
      font-family: Georgia, serif;
      font-size: 18px;
      color: #b07080;
      letter-spacing: 0.12em;
    `;
    pageNumWrap.appendChild(pageNumLine);
    pageNumWrap.appendChild(pageNum);

    textCol.appendChild(deco);
    textCol.appendChild(textNode);
    textCol.appendChild(pageNumWrap);

    body.appendChild(imgCol);
    body.appendChild(textCol);

    wrap.appendChild(header);
    wrap.appendChild(body);
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
      const captureImg  = document.getElementById('pdf-img');
      const captureText = document.getElementById('pdf-text');
      const capturePageNum = document.getElementById('pdf-pagenum');

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      for (let page = 1; page <= totalPages; page++) {
        downloadBtn.textContent = `⏳ ${Math.round((page / totalPages) * 100)}% — pág. ${page}/${totalPages}`;

        setCurrentPage(page);
        updateBookContent(page);
        await sleep(400);

        const activeImg  = document.getElementById('pageImage');
        const activeText = document.getElementById('pageText');

        captureText.textContent = activeText ? activeText.textContent : '';
        capturePageNum.textContent = `${page}  /  ${totalPages}`;

        // Resetear dimensiones antes de cargar nueva imagen
        captureImg.style.width  = '';
        captureImg.style.height = '';
        captureImg.src = activeImg ? activeImg.src : '';

        // Esperar carga de imagen con timeout
        if (captureImg.src) {
          await new Promise((res) => {
            if (captureImg.complete && captureImg.naturalWidth > 0) return res();
            captureImg.onload  = res;
            captureImg.onerror = res;
            setTimeout(res, 5000);
          });
        }

        // Calcular dimensiones reales manteniendo proporción (html2canvas ignora object-fit)
        const imgColW = Math.round(CAPTURE_W * 0.68);
        const imgColH = CAPTURE_H - 52; // restar altura del header
        const natW = captureImg.naturalWidth  || imgColW;
        const natH = captureImg.naturalHeight || imgColH;
        const scale = Math.min(imgColW / natW, imgColH / natH);
        captureImg.style.width  = `${Math.round(natW * scale)}px`;
        captureImg.style.height = `${Math.round(natH * scale)}px`;

        // Pequeña espera extra para que el render sea estable
        await sleep(250);

        const canvas = await html2canvas(captureWrap, {
          backgroundColor: '#fffaf6',
          scale: 3,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width:  CAPTURE_W,
          height: CAPTURE_H,
          imageTimeout: 30000,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.97);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
        if (page < totalPages) pdf.addPage();

        console.log(`✅ Página ${page}/${totalPages}`);
      }

      captureWrap.remove();
      setCurrentPage(originalPage);
      updateBookContent(originalPage);

      pdf.save(fileName);

      downloadBtn.textContent = '✅ ¡PDF listo!';
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
      downloadBtn.style.cursor  = 'pointer';
      isGeneratingPdf = false;
    }
  });

  console.log('✅ Sistema PDF inicializado (v3.0 - Multi-CDN)');
};
