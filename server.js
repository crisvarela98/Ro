/**
 * Servidor backend opcional para generar PDFs como fallback
 * Ejecutar: node server.js
 * URL: http://localhost:3000
 */

const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// Endpoint para generar PDF
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { pages, fileName = 'Libro-de-recuerdos.pdf' } = req.body;

    if (!pages || pages.length === 0) {
      return res.status(400).json({ error: 'No pages provided' });
    }

    console.log(`📄 Generando PDF con ${pages.length} páginas...`);

    // Usar Puppeteer si está disponible
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      const pdfBuffer = await generarPdfConPuppeteer(page, pages);
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(pdfBuffer);
      return;
    } catch (puppeteerError) {
      console.log('⚠️ Puppeteer no disponible. Usando alternativa...');
    }

    // Fallback: usar pdfkit (si está disponible)
    try {
      const PDFDocument = require('pdfkit');
      const Buffer = require('buffer').Buffer;

      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(pdfBuffer);
      });

      // Agregar páginas (versión simplificada)
      pages.forEach((pageData, index) => {
        if (index > 0) doc.addPage();
        doc.fontSize(12).text(`Página ${index + 1}`, 50, 50);
        doc.fontSize(10).text(pageData.content?.substring(0, 500) || '', 50, 100);
      });

      doc.end();
      return;
    } catch (pdfkitError) {
      console.log('⚠️ PDFKit no disponible.');
    }

    res.status(503).json({
      error: 'PDF generation service not available',
      message: 'Por favor instala: npm install puppeteer o npm install pdfkit'
    });

  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    res.status(500).json({ 
      error: 'Error generando PDF',
      message: error.message 
    });
  }
});

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Servidor PDF disponible',
    timestamp: new Date().toISOString()
  });
});

// Función auxiliar para Puppeteer
async function generarPdfConPuppeteer(page, pagesData) {
  // Aquí se implementaría la lógica de generar PDF con Puppeteer
  // Por ahora es un placeholder
  console.log('🔧 Usando Puppeteer para generar PDF...');
  const pdf = await page.pdf({ format: 'A4' });
  return pdf;
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║      🚀 Servidor PDF Fallback Iniciado                    ║
║      📍 http://localhost:${PORT}                              ║
║      🔗 POST /api/generate-pdf                             ║
║      📋 GET /api/health                                    ║
╚════════════════════════════════════════════════════════════╝

Para usar este servidor como fallback:
  1. Instala dependencias: npm install express puppeteer
  2. Ejecuta: node server.js
  3. El app lo usará automáticamente si CDN falla

⚠️ Nota: Puppeteer requiere ~150MB y Chrome instalado
  `)
});

module.exports = app;
