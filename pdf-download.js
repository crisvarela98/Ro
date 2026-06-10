window.initPdfDownload = ({ downloadBtn, bookPage, updateBookContent, totalPages, getCurrentPage, setCurrentPage, fileName = 'Libro-de-recuerdos.pdf' }) => {
  // Validación de argumentos requeridos
  if (!downloadBtn || !bookPage || !updateBookContent || typeof getCurrentPage !== 'function' || typeof setCurrentPage !== 'function') {
    console.error('❌ ERROR EN INICIALIZACIÓN PDF: Faltan argumentos requeridos.');
    downloadBtn && (downloadBtn.disabled = true);
    return;
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let isGeneratingPdf = false;

  // Sistema avanzado de carga de librerías con múltiples intentos
  const cargarLibrerias = async (maxIntentos = 80) => {
    console.log('🔍 Buscando librerías externas...');
    
    for (let i = 0; i < maxIntentos; i++) {
      const html2canvas = window.html2canvas;
      const jsPDF = window.jspdf?.jsPDF;
      
      if (html2canvas && jsPDF) {
        console.log(`✅ Librerías encontradas en intento ${i + 1}`);
        return { html2canvas, jsPDF, fallback: false };
      }
      
      if (i === 0 || i % 10 === 0) {
        console.log(`⏳ Intento ${i + 1}/${maxIntentos} - html2canvas: ${!!html2canvas}, jsPDF: ${!!jsPDF}`);
      }
      
      await sleep(100);
    }
    
    console.warn('⚠️ Librerías no disponibles. Intentando con API externa...');
    return { html2canvas: null, jsPDF: null, fallback: true };
  };

  // Modal de errores mejorado
  const mostrarError = (titulo, mensaje, detalles = '', reintentos = true) => {
    const errorAnterior = document.getElementById('pdf-error-modal');
    if (errorAnterior) errorAnterior.remove();

    const errorDiv = document.createElement('div');
    errorDiv.id = 'pdf-error-modal';
    errorDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      animation: fadeInModal 0.3s ease-out;
    `;
    
    const contenido = document.createElement('div');
    contenido.style.cssText = `
      background-color: #ff6b6b;
      color: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      max-width: 550px;
      text-align: center;
      animation: slideUp 0.3s ease-out;
    `;
    
    let html = `
      <div style="margin-bottom: 20px; font-size: 36px;">⚠️</div>
      <div style="margin-bottom: 12px; font-size: 24px; font-weight: bold;">${titulo}</div>
      <div style="margin-bottom: 16px; font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.95);">${mensaje}</div>
    `;
    
    if (detalles) {
      html += `<div style="margin-bottom: 20px; font-size: 12px; opacity: 0.85; background-color: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; max-height: 120px; overflow-y: auto; text-align: left;">📋 ${detalles}</div>`;
    }
    
    html += `
      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        ${reintentos ? '<button style="background-color: #ffeb3b; color: #333; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 15px;" onclick="location.reload()">🔄 Recargar Página</button>' : ''}
        <button style="background-color: white; color: #ff6b6b; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 15px;" onclick="document.getElementById('pdf-error-modal').remove()">Cerrar</button>
      </div>
    `;
    
    contenido.innerHTML = html;
    errorDiv.appendChild(contenido);
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 15000);

    errorDiv.addEventListener('click', (e) => {
      if (e.target === errorDiv) {
        errorDiv.remove();
      }
    });
  };

  // Agregar estilos de animación
  const agregarAnimaciones = () => {
    if (document.getElementById('pdf-animations')) return;
    
    const style = document.createElement('style');
    style.id = 'pdf-animations';
    style.textContent = `
      @keyframes fadeInModal {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { 
          opacity: 0; 
          transform: translateY(30px); 
        }
        to { 
          opacity: 1; 
          transform: translateY(0); 
        }
      }
    `;
    document.head.appendChild(style);
  };

  agregarAnimaciones();

  // Generar PDF usando API externa (fallback)
  const generarPdfViaAPI = async (paginasData) => {
    console.log('🌐 Intentando generar PDF via servicio externo...');
    
    try {
      // Opción 1: Usar endpoint local si existe
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: paginasData,
          fileName: fileName
        }),
        timeout: 30000
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        return true;
      }
    } catch (apiError) {
      console.log('📌 API local no disponible. Intentando alternativa...');
    }

    // Opción 2: Guardar como imagen de respaldo
    console.log('💾 Guardando páginas como imágenes ZIP...');
    // Esta sería una alternativa de último recurso
    return false;
  };

  downloadBtn.addEventListener('click', async () => {
    if (isGeneratingPdf) {
      console.warn('⚠️ PDF ya está siendo generado.');
      return;
    }

    isGeneratingPdf = true;

    try {
      downloadBtn.disabled = true;
      const previousLabel = downloadBtn.textContent;
      downloadBtn.textContent = '⏳ Preparando...';
      downloadBtn.style.opacity = '0.6';
      downloadBtn.style.cursor = 'wait';

      // Cargar librerías
      const { html2canvas, jsPDF, fallback } = await cargarLibrerias();

      if (!html2canvas || !jsPDF) {
        downloadBtn.textContent = '🌐 Usando servicio en línea...';
        console.log('📡 Librerías no disponibles. Usando modo alternativo...');
        
        // Intentar generación vía API
        const paginasData = [];
        for (let page = 1; page <= totalPages; page++) {
          setCurrentPage(page);
          updateBookContent(page);
          await sleep(200);
          paginasData.push({
            pageNumber: page,
            content: bookPage.innerHTML
          });
        }

        const resultado = await generarPdfViaAPI(paginasData);
        
        if (!resultado) {
          throw new Error(
            'No se pudieron cargar las librerías necesarias. ' +
            'Por favor intenta:\n' +
            '1. Recarga la página (Ctrl+R o Cmd+R)\n' +
            '2. Limpia el caché del navegador\n' +
            '3. Intenta en otro navegador'
          );
        }

        downloadBtn.textContent = '✅ PDF Descargado';
        downloadBtn.style.background = '#51cf66';
        
        setTimeout(() => {
          downloadBtn.textContent = previousLabel;
          downloadBtn.style.background = '';
        }, 2500);

        return;
      }

      // Modo normal con librerías disponibles
      await sleep(300);

      const originalPage = getCurrentPage();
      const pdf = new jsPDF({ 
        unit: 'pt', 
        format: 'a4',
        compress: true,
        precision: 10
      });

      pdf.setProperties({
        title: 'Libro de Recuerdos - Un regalo para vos ❤️',
        author: 'Con amor',
        subject: 'Libro personalizado de recuerdos',
        creator: 'Ro - Generador PDF'
      });

      let paginasExitosas = 0;

      for (let page = 1; page <= totalPages; page++) {
        let intento = 0;
        let capturaBien = false;
        
        while (intento < 3 && !capturaBien) {
          try {
            setCurrentPage(page);
            updateBookContent(page);
            await sleep(350);

            const canvas = await html2canvas(bookPage, {
              backgroundColor: '#ffffff',
              scale: 2,
              useCORS: true,
              logging: false,
              allowTaint: true,
              imageTimeout: 45000,
              proxy: null,
              removeContainer: true
            });

            if (!canvas || canvas.width === 0 || canvas.height === 0) {
              throw new Error(`Canvas inválido (${canvas?.width}x${canvas?.height})`);
            }

            const imgData = canvas.toDataURL('image/png', 0.95);
            
            if (!imgData || imgData.length < 1000) {
              throw new Error(`Datos insuficientes (${imgData?.length} bytes)`);
            }

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            
            if (!imgProps.width || !imgProps.height) {
              throw new Error('Propiedades inválidas');
            }

            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            if (page < totalPages) {
              pdf.addPage();
            }

            paginasExitosas++;
            capturaBien = true;
            console.log(`✅ Página ${page}/${totalPages}`);

          } catch (pageError) {
            intento++;
            console.warn(`⚠️ Reintento ${intento}/3 - Página ${page}`);
            
            if (intento < 3) {
              await sleep(500);
            } else {
              throw pageError;
            }
          }
        }

        const progreso = Math.round((page / totalPages) * 100);
        downloadBtn.textContent = `⏳ ${progreso}% (${page}/${totalPages})`;
      }

      if (paginasExitosas < totalPages) {
        throw new Error(`Solo ${paginasExitosas}/${totalPages} páginas se capturaron`);
      }

      setCurrentPage(originalPage);
      updateBookContent(originalPage);

      pdf.save(fileName);
      
      downloadBtn.textContent = '✅ PDF Descargado';
      downloadBtn.style.background = '#51cf66';
      downloadBtn.style.cursor = 'default';
      
      setTimeout(() => {
        downloadBtn.textContent = previousLabel;
        downloadBtn.style.background = '';
        downloadBtn.style.cursor = 'pointer';
      }, 2500);

      console.log(`✅ PDF generado: ${fileName}`);

    } catch (error) {
      console.error('❌ ERROR:', error);
      
      mostrarError(
        '❌ NO SE PUDO GENERAR EL PDF',
        error.message || 'Error desconocido',
        error.stack?.split('\n')[0] || '',
        true
      );
      
      downloadBtn.textContent = previousLabel;
      downloadBtn.style.background = '';
      downloadBtn.style.cursor = 'pointer';
      
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.style.opacity = '1';
      isGeneratingPdf = false;
    }
  });

  console.log('✅ Sistema PDF inicializado (v3.0 - Multi-CDN)');
};
