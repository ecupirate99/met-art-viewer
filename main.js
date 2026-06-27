const micBtn = document.getElementById('mic-btn');
const statusText = document.getElementById('status');
const resultsGrid = document.getElementById('results');
const loadingSpinner = document.getElementById('loading');
const scrollTarget = document.getElementById('scroll-target');

// Modal Elements
const modal = document.getElementById('carousel-modal');
const modalClose = document.getElementById('modal-close');
const carouselImage = document.getElementById('carousel-image');
const prevBtn = document.getElementById('carousel-prev');
const nextBtn = document.getElementById('carousel-next');
const indicatorsContainer = document.getElementById('carousel-indicators');

// List Modal Elements
const listModal = document.getElementById('list-modal');
const listModalClose = document.getElementById('list-modal-close');
const listModalTitle = document.getElementById('list-modal-title');
const listModalUl = document.getElementById('list-modal-ul');
const btnDepartments = document.getElementById('btn-departments');
const btnArtists = document.getElementById('btn-artists');

// State
let currentObjectIDs = [];
let currentPageIndex = 0;
const PAGE_SIZE = 10;
let isLoading = false;

// Carousel State
let currentCarouselImages = [];
let currentCarouselIndex = 0;

// Setup Speech Synthesis for audio feedback
function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

// Setup Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    micBtn.classList.add('listening');
    micBtn.querySelector('.btn-text').textContent = 'Listening...';
    statusText.textContent = 'Listening for a search query...';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    statusText.textContent = `You said: "${transcript}". Searching...`;
    parseAndSearch(transcript);
  };

  recognition.onspeechend = () => {
    recognition.stop();
  };

  recognition.onerror = (event) => {
    recognition.stop();
    statusText.textContent = `Error occurred: ${event.error}`;
  };

  recognition.onend = () => {
    micBtn.classList.remove('listening');
    micBtn.querySelector('.btn-text').textContent = 'Tap to Speak';
  };

  micBtn.addEventListener('click', () => {
    if (micBtn.classList.contains('listening')) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (e) {
        console.error(e);
      }
    }
  });
} else {
  micBtn.disabled = true;
  micBtn.style.opacity = '0.5';
  statusText.textContent = 'Sorry, your browser does not support the Web Speech API.';
}

// Basic NLP Parsing
function parseAndSearch(transcript) {
  let query = transcript;
  let queryParams = new URLSearchParams();
  queryParams.append('hasImages', 'true'); // Filter out objects with no images at all

  // Parse medium (e.g., "paintings", "sculpture")
  const mediumMatch = transcript.match(/\b(paintings|sculpture|ceramics|furniture)\b/i);
  if (mediumMatch) {
    queryParams.append('medium', mediumMatch[1].charAt(0).toUpperCase() + mediumMatch[1].slice(1).toLowerCase());
  }

  // Parse year (e.g., "from 1850")
  const yearMatch = transcript.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
  if (yearMatch) {
    queryParams.append('dateBegin', yearMatch[1]);
    queryParams.append('dateEnd', yearMatch[1]);
  }

  // Extract core query (simple heuristic)
  const byMatch = transcript.match(/by\s+([a-zA-Z\s]+?)(?:\sfrom|\s|$)/i);
  if (byMatch) {
    query = byMatch[1].trim();
  }

  queryParams.append('q', query);

  resetGrid();
  fetchInitialResults(queryParams.toString(), query);
}

function resetGrid() {
  resultsGrid.innerHTML = '';
  currentObjectIDs = [];
  currentPageIndex = 0;
}

async function fetchInitialResults(queryString, displayQuery, mode = 'auto') {
  loadingSpinner.classList.remove('hidden');
  isLoading = true;

  try {
    let res, data;

    if (mode === 'auto' || mode === 'artist') {
      // Attempt 1: Try searching specifically for an artist (without forcing highlights)
      res = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/search?artistOrCulture=true&hasImages=true&q=${encodeURIComponent(displayQuery)}`);
      data = await res.json();
    }

    // Attempt 2: Fallback to the general query (which favors highlights and applies other filters)
    if (!data || !data.objectIDs || data.objectIDs.length === 0 || mode === 'strict') {
      res = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/search?${queryString}`);
      data = await res.json();
    }

    if (!data.objectIDs || data.objectIDs.length === 0) {
      statusText.textContent = `No highlighted results found. Try another term.`;
      speak('I could not find any results for that search.');
      return;
    }

    currentObjectIDs = data.objectIDs;
    statusText.textContent = `Found ${data.total} results for your search. Loading...`;
    
    speak(`I found ${data.total} results. Here are the highlights.`);

    await loadNextPage();
  } catch (err) {
    console.error(err);
    statusText.textContent = 'An error occurred while fetching data.';
  } finally {
    loadingSpinner.classList.add('hidden');
    isLoading = false;
  }
}

async function loadNextPage() {
  if (currentPageIndex >= currentObjectIDs.length) return;

  isLoading = true;
  loadingSpinner.classList.remove('hidden');

  let validItems = [];

  // Keep fetching until we get valid images or run out of IDs
  while (validItems.length === 0 && currentPageIndex < currentObjectIDs.length) {
    const slice = currentObjectIDs.slice(currentPageIndex, currentPageIndex + PAGE_SIZE);
    currentPageIndex += PAGE_SIZE;

    try {
      // Fetch sequentially to prevent hitting API rate limits (80/sec)
      // especially when the while loop aggressively pages through 40+ items
      const results = [];
      for (const id of slice) {
        const item = await fetchObjectDetails(id);
        results.push(item);
      }
      validItems = results.filter(item => item !== null);
    } catch (error) {
      console.error('Error loading page:', error);
      break;
    }
  }

  if (validItems.length > 0) {
    renderResults(validItems);
  } else if (resultsGrid.children.length === 0) {
    statusText.textContent = 'Sorry, the results for this query do not have public domain images available.';
  }

  loadingSpinner.classList.add('hidden');
  isLoading = false;
}

async function fetchObjectDetails(objectID) {
  try {
    const res = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectID}`);
    const data = await res.json();
    if (data && data.primaryImageSmall) {
      return data;
    }
    return null;
  } catch (err) {
    return null;
  }
}

function renderResults(items) {
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'art-card';

    const imgContainer = document.createElement('div');
    imgContainer.className = 'art-image-container';

    const img = document.createElement('img');
    img.className = 'art-image';
    img.src = item.primaryImageSmall;
    img.alt = item.title;
    img.loading = 'lazy';

    const details = document.createElement('div');
    details.className = 'art-details';

    const title = document.createElement('h3');
    title.className = 'art-title';
    title.textContent = item.title || 'Unknown Title';

    const artist = document.createElement('p');
    artist.className = 'art-artist';
    artist.textContent = item.artistDisplayName || 'Unknown Artist';

    const date = document.createElement('p');
    date.className = 'art-date';
    date.textContent = item.objectDate || '';

    imgContainer.appendChild(img);
    details.appendChild(title);
    details.appendChild(artist);
    details.appendChild(date);
    
    card.appendChild(imgContainer);
    card.appendChild(details);

    // Setup Modal Trigger
    card.addEventListener('click', () => {
      let images = [item.primaryImage];
      if (item.additionalImages && item.additionalImages.length > 0) {
        images = images.concat(item.additionalImages);
      }
      openModal(images);
    });

    resultsGrid.appendChild(card);
  });
}

// Intersection Observer for Infinite Scrolling
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !isLoading && currentObjectIDs.length > currentPageIndex) {
    loadNextPage();
  }
}, { rootMargin: '100px' });

observer.observe(scrollTarget);

// --- Modal Carousel Logic ---

function openModal(images) {
  currentCarouselImages = images.filter(img => img); // filter out empty strings
  if (currentCarouselImages.length === 0) return;
  
  currentCarouselIndex = 0;
  updateCarouselView();
  
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // prevent background scrolling
}

function updateCarouselView() {
  carouselImage.src = currentCarouselImages[currentCarouselIndex];
  
  // Update indicators
  indicatorsContainer.innerHTML = '';
  if (currentCarouselImages.length > 1) {
    currentCarouselImages.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `indicator ${idx === currentCarouselIndex ? 'active' : ''}`;
      dot.addEventListener('click', () => {
        currentCarouselIndex = idx;
        updateCarouselView();
      });
      indicatorsContainer.appendChild(dot);
    });
    prevBtn.style.display = 'flex';
    nextBtn.style.display = 'flex';
  } else {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
  }
}

modalClose.addEventListener('click', () => {
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
  carouselImage.src = '';
});

prevBtn.addEventListener('click', () => {
  currentCarouselIndex = (currentCarouselIndex - 1 + currentCarouselImages.length) % currentCarouselImages.length;
  updateCarouselView();
});

nextBtn.addEventListener('click', () => {
  currentCarouselIndex = (currentCarouselIndex + 1) % currentCarouselImages.length;
  updateCarouselView();
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }
    if (!listModal.classList.contains('hidden')) {
      listModal.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }
  }
});

// --- V3: Departments & Famous Artists ---

const famousArtists = [
  "Vincent van Gogh",
  "Claude Monet",
  "Rembrandt",
  "Johannes Vermeer",
  "Edgar Degas",
  "Pierre-Auguste Renoir",
  "Paul Cézanne",
  "Georges Seurat",
  "Gustav Klimt",
  "J.M.W. Turner",
  "Francisco Goya",
  "Diego Velázquez",
  "Titian",
  "Raphael",
  "Michelangelo"
];

let cachedDepartments = [];

async function fetchDepartments() {
  if (cachedDepartments.length > 0) return cachedDepartments;
  try {
    const res = await fetch('https://collectionapi.metmuseum.org/public/collection/v1/departments');
    const data = await res.json();
    if (data && data.departments) {
      cachedDepartments = data.departments;
    }
    return cachedDepartments;
  } catch (e) {
    console.error(e);
    return [];
  }
}

function openListModal(title, items, onClick) {
  listModalTitle.textContent = title;
  listModalUl.innerHTML = '';
  
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.label;
    li.addEventListener('click', () => {
      listModal.classList.add('hidden');
      document.body.style.overflow = 'auto';
      onClick(item);
    });
    listModalUl.appendChild(li);
  });
  
  listModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

listModalClose.addEventListener('click', () => {
  listModal.classList.add('hidden');
  document.body.style.overflow = 'auto';
});

btnArtists.addEventListener('click', () => {
  const items = famousArtists.map(name => ({ label: name, value: name }));
  openListModal('Famous Artists', items, (selected) => {
    statusText.textContent = `Searching for: ${selected.value}...`;
    parseAndSearch(`by ${selected.value}`); // reuse existing voice logic
  });
});

btnDepartments.addEventListener('click', async () => {
  const deps = await fetchDepartments();
  if (deps.length === 0) {
    alert("Could not load departments right now.");
    return;
  }
  const items = deps.map(d => ({ label: d.displayName, value: d.departmentId }));
  openListModal('Explore Departments', items, (selected) => {
    statusText.textContent = `Searching for portraits in ${selected.label}...`;
    
    // Explicit department search
    let queryParams = new URLSearchParams();
    queryParams.append('hasImages', 'true');
    queryParams.append('departmentId', selected.value);
    queryParams.append('q', 'portraits'); // Search for portraits specifically as requested
    
    resetGrid();
    fetchInitialResults(queryParams.toString(), 'portraits', 'strict');
  });
});