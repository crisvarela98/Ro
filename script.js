// Clave de acceso para abrir el libro. Cambiala fácilmente aquí.
const ACCESS_KEY = '26102025';


const PAGE_DATA = [
  {
    image: 'foto1.jpg',
    text: 'Cada momento a tu lado es una página nueva de este libro que escribimos juntos. Mi corazón guarda las sonrisas de tus ojos y esa calma que me regalas al estar a tu lado.'
  },
  {
    image: 'foto2.jpg',
    text: 'Este libro tiene fotos y muchas pruebas de que juntos hacemos un muy buen equipo... Podría escribir mil cosas sobre esta foto, pero la verdad es que cada vez que te miro pienso lo mismo: ¿cómo hice para enamorarla?.'
  },
  {
    image: 'foto3.jpg',
    text: 'Nuestra pequeña familia improvisada. Entre mantas, mimos y momentos simples, ustedes son mi motor para hacer muchas cosas, todo lo que busco y trato de hacer es para poder darles lo mejor a ustedes.'
  },
  {
    image: 'foto4.jpg',
    text: 'Esta es una de mis fotos favoritas, tambien es una foto que me da gracia. Me aceptaste sabiendo que venia con un paquete y me hace bien saber que queres a mi hijo y lo cuidas.'
  },
  {
    image: 'foto5.jpg',
    text: 'Sos la razón por la que celebro los pequeños detalles. Cuando pienso en vos, siento una alegría suave y profunda que transforma cualquier día en un día especial.'
  },
  {
    image: 'foto6.jpg',
    text: 'Creo en que nuestros momentos siempre son especiales porque no importa el lugar, siempre terminamos hablando de sueños, haciendo chistes malos o riéndonos de cualquier cosa y vos poniéndome esa cara de culo que me encanta.'
  },
  {
    image: 'foto7.jpg',
    text: 'Me enamora verte así, modod sexy atrevida y también relajada, siendo vos misma. Porque entendí que el amor no son solo las grandes aventuras, también son los momneots juntos, las tardes de fiaca y las charlas antes de dormir.'
  },
  {
    image: 'foto8.jpg',
    text: 'Esta página está vacía porque todavía nos quedan muchísimas fotos por sacar, viajes por hacer y recuerdos por tener juntos. Pero sé que cada página que escribimos juntos es una prueba de que el amor es una historia que nunca termina.'
  },
  {
    image: 'foto9.jpg',
    text: 'Juntos formamos un mundo lleno de ternura, magia y promesas que todavía quiero seguir escribiendo. Siempre te elijo, hoy y todos los días que quedan por venir.'
  },
  {
    image: 'foto10.jpg',
    text: 'Gracias por cada risa, cada abrazo y cada momento compartido. Prometo seguir llenando este libro con más recuerdos, más aventuras y más fotos donde salgo despeinado, barbudo con cara de dormido y vos salís hermosa. Te amo hoy, mañana y en todas nuestras próximas páginas. ❤️'
  }
];

const TOTAL_PAGES = PAGE_DATA.length;
let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
  const accessScreen = document.getElementById('accessScreen');
  const bookScreen = document.getElementById('bookScreen');
  const accessInput = document.getElementById('accessInput');
  const openBookBtn = document.getElementById('openBookBtn');
  const errorMessage = document.getElementById('errorMessage');
  const pageImage = document.getElementById('pageImage');
  const pageText = document.getElementById('pageText');
  const pageCounter = document.getElementById('pageCounter');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const restartBtn = document.getElementById('restartBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const bookPage = document.getElementById('bookPage');

  // Actualiza los datos visibles del libro cuando cambia la página.
  function updateBookContent(page) {
    const pageData = PAGE_DATA[page - 1];
    const imageSrc = `assets/images/${pageData.image}`;

    pageImage.src = imageSrc;
    pageImage.alt = `Foto de recuerdo ${page}`;
    pageText.textContent = pageData.text;
    pageCounter.textContent = `Página ${page} de ${TOTAL_PAGES}`;

    prevBtn.disabled = page === 1;
    prevBtn.classList.toggle('disabled', page === 1);

    if (page === TOTAL_PAGES) {
      nextBtn.textContent = 'Final';
      restartBtn.classList.remove('hidden');
      downloadPdfBtn.classList.remove('locked');
      downloadPdfBtn.disabled = false;
      downloadPdfBtn.title = '';
      downloadPdfBtn.textContent = '📥 Descargar PDF';
    } else {
      nextBtn.textContent = 'Siguiente';
      restartBtn.classList.add('hidden');
      downloadPdfBtn.classList.add('locked');
      downloadPdfBtn.disabled = true;
      downloadPdfBtn.title = `Llegá a la página 10 para desbloquear`;
      downloadPdfBtn.textContent = `🔒 PDF (pág. ${page}/10)`;
    }
  }

  function animatePageChange(nextPage) {
    bookPage.classList.add('fade-out');
    setTimeout(() => {
      currentPage = nextPage;
      updateBookContent(currentPage);
      bookPage.classList.remove('fade-out');
    }, 250);
  }

  function showBookScreen() {
    accessScreen.classList.remove('active');
    bookScreen.classList.add('active');
    bookScreen.setAttribute('aria-hidden', 'false');
    accessInput.value = '';
    errorMessage.textContent = '';
    updateBookContent(currentPage);
  }

  function handleAccess() {
    const typedKey = accessInput.value.trim().toLowerCase();
    if (typedKey === ACCESS_KEY.toLowerCase()) {
      showBookScreen();
    } else {
      errorMessage.textContent = 'Esa no es la clave correcta ❤️';
      accessInput.focus();
    }
  }

  openBookBtn.addEventListener('click', handleAccess);
  accessInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      handleAccess();
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      animatePageChange(currentPage - 1);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentPage < TOTAL_PAGES) {
      animatePageChange(currentPage + 1);
    }
  });

  restartBtn.addEventListener('click', () => {
    currentPage = 1;
    animatePageChange(currentPage);
  });

  if (window.initPdfDownload) {
    try {
      window.initPdfDownload({
        downloadBtn: downloadPdfBtn,
        bookPage,
        updateBookContent,
        totalPages: TOTAL_PAGES,
        getCurrentPage: () => currentPage,
        setCurrentPage: (page) => { currentPage = page; },
        fileName: 'Libro-de-recuerdos.pdf',
      });
      console.log('✅ Sistema PDF inicializado exitosamente');
    } catch (err) {
      console.error('❌ Error al inicializar PDF:', err);
      downloadPdfBtn.disabled = true;
      downloadPdfBtn.textContent = 'Error en PDF';
    }
  } else {
    console.error('❌ initPdfDownload no está disponible');
  }

  updateBookContent(currentPage);
});
