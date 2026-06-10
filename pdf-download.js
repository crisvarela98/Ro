window.initPdfDownload = ({ downloadBtn, bookPage, updateBookContent, totalPages, getCurrentPage, setCurrentPage, fileName = 'Libro-de-recuerdos.pdf' }) => {
  // Validación de argumentos requeridos
  if (!downloadBtn || !bookPage || !updateBookContent || typeof getCurrentPage !== 'function' || typeof setCurrentPage !== 'function') {
    console.error('❌ ERRO EN INICIALIZACIÓN PDF: Faltan argumentos requeridos.');
    return;
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Verificar que las librerías estén disponibles
  const verificarLibrerias = () => {
    const html2canvas = window.html2canvas;
    const jsPDF = window.jspdf?.jsPDF;
    
    if (!html2canvas) {
      throw new Error('html2canvas no está cargado. Por favor, recarga la página.');
    }
    if (!jsPDF) {
      throw new Error('jsPDF no está cargado. Por favor, recarga la página.');
    }
    return { html2canvas, jsPDF };
  };

  // Crear elemento para mostrar errores
  const mostrarError = (mensaje) => {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: #ff6b6b;
      color: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      max-width: 500px;
      animation: slideIn 0.3s ease-out;
    `;
    
    errorDiv.innerHTML = `
      <div style="margin-bottom: 20px; font-size: 24px;">⚠️</div>
      <div style="margin-bottom: 20px;">${mensaje}</div>
      <button style="
        background-color: white;
        color: #ff6b6b;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 16px;
      " onclick="this.parentElement.remove()">Cerrar</button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-cerrar después de 6 segundos
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 6000);
  };

  downloadBtn.addEventListener('click', async () => {
    try {
      // Verificar disponibilidad de librerías
      const { html2canvas, jsPDF } = verificarLibrerias();

      // Deshabilitar botón y mostrar progreso
      downloadBtn.disabled = true;
      const previousLabel = downloadBtn.textContent;
      downloadBtn.textContent = '⏳ Generando PDF...';
      downloadBtn.style.opacity = '0.6';

      const originalPage = getCurrentPage();
      const pdf = new jsPDF({ 
        unit: 'pt', 
        format: 'a4',
        compress: true
      });

      // Procesar cada página
      for (let page = 1; page <= totalPages; page += 1) {
        try {
          setCurrentPage(page);
          updateBookContent(page);
          
          // Esperar a que el contenido se renderice
          await sleep(200);

          // Capturar la página como imagen
          const canvas = await html2canvas(bookPage, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: false,
            imageTimeout: 15000
          });

          if (!canvas) {
            throw new Error(`No se pudo capturar la página ${page}.`);
          }

          const imgData = canvas.toDataURL('image/png');
          
          if (!imgData) {
            throw new Error(`No se generó la imagen de la página ${page}.`);
          }

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const imgProps = pdf.getImageProperties(imgData);
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          // Agregar imagen al PDF
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          
          if (page < totalPages) {
            pdf.addPage();
          }

          // Actualizar progreso
          const progreso = Math.round((page / totalPages) * 100);
          downloadBtn.textContent = `⏳ ${progreso}%`;

        } catch (pageError) {
          console.error(`Error en página ${page}:`, pageError);
          throw new Error(`Error procesando página ${page}: ${pageError.message}`);
        }
      }

      // Restaurar página original
      setCurrentPage(originalPage);
      updateBookContent(originalPage);

      // Descargar PDF
      pdf.save(fileName);
      
      // Restablecer botón con confirmación
      downloadBtn.textContent = '✅ PDF Descargado';
      downloadBtn.style.background = '#51cf66';
      
      setTimeout(() => {
        downloadBtn.textContent = previousLabel;
        downloadBtn.style.background = '';
      }, 2000);

      console.log('✅ PDF generado y descargado exitosamente');

    } catch (error) {
      console.error('❌ ERROR CRÍTICO generando PDF:', error);
      
      // Mostrar error prominente
      const errorMsg = error.message || 'No se pudo generar el PDF. Intentá nuevamente.';
      mostrarError(`❌ NO SE PUDO GENERAR EL PDF<br><br>${errorMsg}<br><br>Intentá nuevamente`);
      
      // También mostrar alerta como respaldo
      alert('⚠️ NO SE PUDO GENERAR EL PDF\n\n' + errorMsg + '\n\nIntentá nuevamente');
      
      downloadBtn.textContent = previousLabel;
      downloadBtn.style.background = '';
      
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.style.opacity = '1';
    }
  });

  console.log('✅ Sistema de descarga de PDF inicializado correctamente');
};
