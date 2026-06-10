window.initPdfDownload = ({ downloadBtn, bookPage, updateBookContent, totalPages, getCurrentPage, setCurrentPage, fileName = 'Libro-de-recuerdos.pdf' }) => {
  // Validación de argumentos requeridos
  if (!downloadBtn || !bookPage || !updateBookContent || typeof getCurrentPage !== 'function' || typeof setCurrentPage !== 'function') {
    console.error('❌ ERROR EN INICIALIZACIÓN PDF: Faltan argumentos requeridos.');
    downloadBtn && (downloadBtn.disabled = true);
    return;
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let isGeneratingPdf = false;

  // Esperar a que las librerías estén disponibles con reintentos mejorados
  const esperarLibrerias = async (maxIntentos = 40) => {
    let ultimoError = null;
    
    for (let i = 0; i < maxIntentos; i++) {
      try {
        const html2canvas = window.html2canvas;
        const jsPDF = window.jspdf?.jsPDF;
        
        if (html2canvas && jsPDF) {
          console.log('✅ Librerías externas cargadas exitosamente');
          return { html2canvas, jsPDF };
        }
        
        if (i === maxIntentos - 1) {
          ultimoError = new Error(
            `Librerías no disponibles después de ${maxIntentos * 100}ms. ` +
            `html2canvas: ${!!window.html2canvas}, jsPDF: ${!!window.jspdf?.jsPDF}`
          );
        }
      } catch (err) {
        ultimoError = err;
      }
      
      await sleep(100);
    }
    
    throw ultimoError || new Error('No se pudieron cargar las librerías externas. Recarga la página.');
  };

  // Crear elemento para mostrar errores con mejor estilos
  const mostrarError = (titulo, mensaje, detalles = '') => {
    // Remover error anterior si existe
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
      background-color: rgba(0, 0, 0, 0.5);
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
      max-width: 500px;
      text-align: center;
      animation: slideUp 0.3s ease-out;
    `;
    
    let html = `
      <div style="margin-bottom: 20px; font-size: 32px;">⚠️</div>
      <div style="margin-bottom: 12px; font-size: 22px; font-weight: bold;">${titulo}</div>
      <div style="margin-bottom: 16px; font-size: 15px; line-height: 1.6;">${mensaje}</div>
    `;
    
    if (detalles) {
      html += `<div style="margin-bottom: 20px; font-size: 13px; opacity: 0.9; background-color: rgba(0,0,0,0.1); padding: 10px; border-radius: 8px; max-height: 100px; overflow-y: auto;">📋 ${detalles}</div>`;
    }
    
    html += `
      <button style="
        background-color: white;
        color: #ff6b6b;
        border: none;
        padding: 12px 28px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 16px;
        transition: transform 0.2s ease;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="document.getElementById('pdf-error-modal').remove()">Entendido</button>
    `;
    
    contenido.innerHTML = html;
    errorDiv.appendChild(contenido);
    document.body.appendChild(errorDiv);
    
    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 10000);

    // Cerrar al hacer clic fuera
    errorDiv.addEventListener('click', (e) => {
      if (e.target === errorDiv) {
        errorDiv.remove();
      }
    });
  };

  // Agregar estilos de animación al documento
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

  downloadBtn.addEventListener('click', async () => {
    // Prevenir múltiples clics
    if (isGeneratingPdf) {
      console.warn('⚠️ PDF ya está siendo generado. Espera a que termine.');
      return;
    }

    isGeneratingPdf = true;

    try {
      // Esperar a que las librerías estén disponibles
      const { html2canvas, jsPDF } = await esperarLibrerias();

      // Deshabilitar botón y mostrar progreso
      downloadBtn.disabled = true;
      const previousLabel = downloadBtn.textContent;
      downloadBtn.textContent = '⏳ Cargando librerías...';
      downloadBtn.style.opacity = '0.6';
      downloadBtn.style.cursor = 'wait';

      await sleep(300);

      const originalPage = getCurrentPage();
      const pdf = new jsPDF({ 
        unit: 'pt', 
        format: 'a4',
        compress: true,
        precision: 10
      });

      // Añadir metadata al PDF
      pdf.setProperties({
        title: 'Libro de Recuerdos - Un regalo para vos',
        author: 'Con amor ❤️',
        subject: 'Libro personalizado de recuerdos',
        creator: 'Ro - Generador de PDF de Recuerdos'
      });

      let paginasExitosas = 0;

      // Procesar cada página
      for (let page = 1; page <= totalPages; page += 1) {
        let intentos = 0;
        let capturaBien = false;
        
        while (intentos < 3 && !capturaBien) {
          try {
            setCurrentPage(page);
            updateBookContent(page);
            
            // Esperar a que el contenido se renderice completamente
            await sleep(350);

            // Capturar la página como imagen
            const canvas = await html2canvas(bookPage, {
              backgroundColor: '#ffffff',
              scale: 2,
              useCORS: true,
              logging: false,
              allowTaint: true,
              imageTimeout: 40000,
              proxy: null,
              removeContainer: true
            });

            if (!canvas || canvas.width === 0 || canvas.height === 0) {
              throw new Error(`Canvas inválido (${canvas?.width}x${canvas?.height})`);
            }

            const imgData = canvas.toDataURL('image/png', 0.95);
            
            if (!imgData || imgData.length < 1000) {
              throw new Error(`Datos de imagen insuficientes (${imgData?.length} bytes)`);
            }

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            
            if (!imgProps.width || !imgProps.height) {
              throw new Error('Propiedades de imagen inválidas');
            }

            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Agregar imagen al PDF
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            if (page < totalPages) {
              pdf.addPage();
            }

            paginasExitosas++;
            capturaBien = true;
            console.log(`✅ Página ${page}/${totalPages} capturada correctamente`);

          } catch (pageError) {
            intentos++;
            console.warn(`⚠️ Intento ${intentos}/3 - Página ${page}:`, pageError.message);
            
            if (intentos < 3) {
              await sleep(500);
            } else {
              throw new Error(`Página ${page} falló después de 3 intentos: ${pageError.message}`);
            }
          }
        }

        // Actualizar progreso con información detallada
        const progreso = Math.round((page / totalPages) * 100);
        downloadBtn.textContent = `⏳ Página ${page}/${totalPages} (${progreso}%)`;
      }

      // Validar que todas las páginas fueron capturadas
      if (paginasExitosas < totalPages) {
        throw new Error(`Solo se capturaron ${paginasExitosas}/${totalPages} páginas correctamente`);
      }

      // Restaurar página original
      setCurrentPage(originalPage);
      updateBookContent(originalPage);

      // Descargar PDF
      pdf.save(fileName);
      
      // Restablecer botón con confirmación
      downloadBtn.textContent = '✅ PDF Descargado';
      downloadBtn.style.background = '#51cf66';
      downloadBtn.style.cursor = 'default';
      
      setTimeout(() => {
        downloadBtn.textContent = previousLabel;
        downloadBtn.style.background = '';
        downloadBtn.style.cursor = 'pointer';
      }, 2500);

      console.log(`✅ PDF generado exitosamente: ${fileName} (${paginasExitosas} páginas)`);

    } catch (error) {
      console.error('❌ ERROR CRÍTICO generando PDF:', error);
      
      const titulo = '❌ NO SE PUDO GENERAR EL PDF';
      const mensaje = error.message || 'Error desconocido. Intenta nuevamente.';
      const detalles = error.stack?.split('\n')[0] || '';

      mostrarError(titulo, mensaje, detalles);
      
      downloadBtn.textContent = previousLabel;
      downloadBtn.style.background = '';
      downloadBtn.style.cursor = 'pointer';
      
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.style.opacity = '1';
      isGeneratingPdf = false;
    }
  });

  console.log('✅ Sistema de descarga de PDF inicializado correctamente');
  console.log(`📄 Configurado para generar: ${fileName}`);
};
