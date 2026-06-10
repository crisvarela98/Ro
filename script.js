// Clave de acceso para abrir el libro. Cambiala fácilmente aquí.
const ACCESS_KEY = '12345678';

// Contenido de cada página del libro.
// Cambia el texto y el nombre de la imagen para personalizar cada página.
const PAGE_DATA = [
  {
    image: 'foto1.jpg',
    text: 'Cada momento a tu lado es una página nueva de este libro que escribimos juntos. Mi corazón guarda las sonrisas de tus ojos y esa calma que me regalas al estar a tu lado.'
  },
  {
    image: 'foto2.jpg',
    text: 'Tus risas se convierten en la melodía más dulce que escucho cada día. Me enamoro de tu forma de ser, de tu ternura en los gestos pequeños y de las palabras que nunca dejan de abrazarme.'
  },
  {
    image: 'foto3.jpg',
    text: 'Cada abrazo tuyo es un refugio cálido donde me siento en casa. Contar nuestras anécdotas y soñar juntos es la prueba de que cada instante a tu lado vale infinitamente más.'
  },
  {
    image: 'foto4.jpg',
    text: 'En este libro hay recuerdos de caminatas, miradas cómplices, cafés compartidos y sueños dibujados de la mano. Gracias por ser mi compañera de aventuras y mi cómplice de ternura.'
  },
  {
    image: 'foto5.jpg',
    text: 'Eres la razón por la que celebro los pequeños detalles. Cuando pienso en vos, siento una alegría suave y profunda que transforma cualquier día en un día especial.'
  },
  {
    image: 'foto6.jpg',
    text: 'Gracias por cada gesto, cada palabra de aliento, cada momento en el que me comprendiste sin que dijera nada. Tu amor me inspira a ser mejor cada día.'
  },
  {
    image: 'foto7.jpg',
    text: 'Contar nuestras historias es descubrir que el amor verdadero se construye con cariño, paciencia y ganas de mirarse a los ojos. Me encanta imaginar todo lo que nos espera por vivir.'
  },
  {
    image: 'foto8.jpg',
    text: 'Tus manos son un abrazo permanente y tu voz es mi canción favorita. Me pierdo en tus detalles y me encuentro en lo nuestro, en el brillo de nuestra complicidad.'
  },
  {
    image: 'foto9.jpg',
    text: 'Juntos hemos tejido un mundo lleno de ternura, magia y promesas que todavía quiero seguir escribiendo. Siempre te elijo, hoy y todos los días que quedan por venir.'
  },
  {
    image: 'foto10.jpg',
    text: 'Gracias por cada momento juntos. Este libro es solo una pequeña parte de todo lo que siento por vos. Te amo con todo mi corazón, hoy, mañana y siempre. ❤️'
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
      downloadPdfBtn.classList.remove('hidden');
    } else {
      nextBtn.textContent = 'Siguiente';
      restartBtn.classList.add('hidden');
      downloadPdfBtn.classList.add('hidden');
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
