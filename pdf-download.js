window.initPdfDownload = ({ downloadBtn, bookPage, updateBookContent, totalPages, getCurrentPage, setCurrentPage, fileName = 'Libro-de-recuerdos.pdf' }) => {
  if (!downloadBtn || !bookPage || !updateBookContent || typeof getCurrentPage !== 'function' || typeof setCurrentPage !== 'function') {
    console.warn('PDF download initialization incomplete. Missing required arguments.');
    return;
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  downloadBtn.addEventListener('click', async () => {
    try {
      const { jsPDF } = window.jspdf || {};
      if (!window.html2canvas || !jsPDF) {
        throw new Error('html2canvas o jsPDF no están disponibles.');
      }

      downloadBtn.disabled = true;
      const previousLabel = downloadBtn.textContent;
      downloadBtn.textContent = 'Generando PDF...';

      const originalPage = getCurrentPage();
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });

      for (let page = 1; page <= totalPages; page += 1) {
        setCurrentPage(page);
        updateBookContent(page);
        await sleep(150);

        const canvas = await html2canvas(bookPage, {
          backgroundColor: '#fff',
          scale: 2,
          useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        if (page < totalPages) {
          pdf.addPage();
        }
      }

      setCurrentPage(originalPage);
      updateBookContent(originalPage);
      pdf.save(fileName);
      downloadBtn.textContent = previousLabel;
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('No se pudo generar el PDF. Intentá nuevamente.');
      downloadBtn.textContent = 'Descargar PDF';
    } finally {
      downloadBtn.disabled = false;
    }
  });
};
