window.initPdfDownload = ({ downloadBtn, bookPage, updateBookContent, totalPages, getCurrentPage, setCurrentPage, fileName = 'Libro-de-recuerdos.pdf' }) => {
  // Validación de argumentos requeridos
  if (!downloadBtn || !bookPage || !updateBookContent || typeof getCurrentPage !== 'function' || typeof setCurrentPage !== 'function') {
    console.error('❌ ERROR EN INICIALIZACIÓN PDF: Faltan argumentos requeridos.');
    return;
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Esperar a que las librerías estén disponibles
  const esperarLibrerias = async (maxIntentos = 30) => {
    for (let i = 0; i < maxIntentos; i++) {
      const html2canvas = window.html2canvas;
      const jsPDF = window.jspdf?.jsPDF;
      
      if (html2canvas && jsPDF) {
        console.log('✅ Librerías cargadas correctamente');
        return { html2canvas, jsPDF };
      }
      
      await sleep(100);
    }
    
    throw new Error('Las librerías no se cargaron. Por favor, recarga la página completamente.');
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
    
    // Auto-cerrar después de 8 segundos
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 8000);
  };

  downloadBtn.addEventListener('click', async () => {
    try {
      // Esperar a que las librerías estén disponibles
      const { html2canvas, jsPDF } = await esperarLibrerias();

      // Deshabilitar botón y mostrar progreso
      downloadBtn.disabled = true;
      const previousLabel = downloadBtn.textContent;
      downloadBtn.textContent = '⏳ Cargando librerías...';
      downloadBtn.style.opacity = '0.6';

      // Pequeña pausa para asegurar que todo está listo
      await sleep(200);

      const originalPage = getCurrentPage();
      const pdf = new jsPDF({ 
        unit: 'pt', 
        format: 'a4',
        compress: true
      });

      downloadBtn.textContent = '⏳ Capturando páginas...';

      // Procesar cada página
      for (let page = 1; page <= totalPages; page += 1) {
        try {
          setCurrentPage(page);
          updateBookContent(page);
          
          // Esperar a que el contenido se renderice completamente
          await sleep(300);

          // Capturar la página como imagen
          const canvas = await html2canvas(bookPage, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
            imageTimeout: 30000,
            proxy: null
          });

          if (!canvas) {
            throw new Error(`No se pudo capturar la página ${page}. Intenta nuevamente.`);
          }

          const imgData = canvas.toDataURL('image/png');
          
          if (!imgData) {
            throw new Error(`No se generó la imagen de la página ${page}. Intenta nuevamente.`);
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
      const errorMsg = error.message || 'No se pudo generar el PDF. Intenta nuevamente.';
      mostrarError(`❌ NO SE PUDO GENERAR EL PDF<br><br>${errorMsg}<br><br>Intenta nuevamente`);
      
      // También mostrar alerta como respaldo
      alert('⚠️ NO SE PUDO GENERAR EL PDF\n\n' + errorMsg + '\n\nIntenta nuevamente');
      
      downloadBtn.textContent = previousLabel;
      downloadBtn.style.background = '';
      
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.style.opacity = '1';
    }
  });

  console.log('✅ Sistema de descarga de PDF inicializado correctamente');
};
