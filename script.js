/**
 * Cat Gallery — Infinite Scroll Logic
 * Uses The Cat API (free public tier) to fetch random cat images.
 */

(function () {
  'use strict';

  // ===== Config =====
  const API_URL = 'https://api.thecatapi.com/v1/images/search';
  const BATCH_SIZE = 12;
  const SKELETON_HEIGHTS = [220, 280, 340, 260, 300, 240, 320, 200, 360, 250, 290, 310];

  // PASTE YOUR CAT API KEY HERE (e.g., 'live_abcdefg...')
  const API_KEY = 'YOUR_API_KEY_HERE';

  // ===== DOM References =====
  const galleryGrid = document.getElementById('gallery-grid');
  const loadMoreArea = document.getElementById('load-more-area');
  const spinner = document.getElementById('spinner');
  const photoCount = document.getElementById('photo-count');
  const backToTopBtn = document.getElementById('back-to-top');
  const errorBanner = document.getElementById('error-banner');
  const retryBtn = document.getElementById('retry-btn');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  // ===== State =====
  let totalLoaded = 0;
  let isFetching = false;
  let cardIndex = 0;

  // ===== Skeleton Loaders =====
  function showSkeletons() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < BATCH_SIZE; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton-card';
      skeleton.setAttribute('data-skeleton', 'true');

      const img = document.createElement('div');
      img.className = 'skeleton-img';
      img.style.height = SKELETON_HEIGHTS[i % SKELETON_HEIGHTS.length] + 'px';

      skeleton.appendChild(img);
      fragment.appendChild(skeleton);
    }
    galleryGrid.appendChild(fragment);
  }

  function removeSkeletons() {
    const skeletons = galleryGrid.querySelectorAll('[data-skeleton="true"]');
    skeletons.forEach(function (s) { s.remove(); });
  }

  // ===== Fetch Cats =====
  async function fetchCats() {
    if (isFetching) return;
    isFetching = true;

    hideError();
    showSkeletons();
    spinner.style.display = 'block';

    try {
      const headers = {};
      if (API_KEY && API_KEY !== 'live_1XKZ0ASPkw4zbze5t9r5cSdplRYX08sGk1cmJ4Mj4nXkReu4BoryUpSPlwdCAFzq') {
        headers['x-api-key'] = API_KEY;
      }

      const response = await fetch(API_URL + '?limit=' + BATCH_SIZE + '&t=' + Date.now(), {
        headers: headers
      });
      if (!response.ok) throw new Error('API returned ' + response.status);

      const data = await response.json();
      removeSkeletons();
      renderCards(data);
    } catch (err) {
      console.error('Failed to fetch cats:', err);
      removeSkeletons();
      showError();
    } finally {
      isFetching = false;
      spinner.style.display = 'none';
    }
  }

  // ===== Render Cards =====
  function renderCards(cats) {
    const fragment = document.createDocumentFragment();

    cats.forEach(function (cat, i) {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.style.animationDelay = (i * 0.06) + 's';
      card.setAttribute('data-card-index', cardIndex++);

      const img = document.createElement('img');
      img.src = cat.url;
      img.alt = 'Adorable cat #' + (totalLoaded + i + 1);
      img.loading = 'lazy';
      img.decoding = 'async';

      // Open lightbox on card click
      card.addEventListener('click', function () {
        openLightbox(cat.url);
      });

      // Overlay with heart button
      const overlay = document.createElement('div');
      overlay.className = 'card-overlay';

      const heartBtn = document.createElement('button');
      heartBtn.className = 'heart-btn';
      heartBtn.innerHTML = '♡';
      heartBtn.setAttribute('aria-label', 'Like this cat');
      heartBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (heartBtn.classList.contains('liked')) {
          heartBtn.classList.remove('liked');
          heartBtn.innerHTML = '♡';
        } else {
          heartBtn.classList.add('liked');
          heartBtn.innerHTML = '♥';
          heartBtn.style.transform = 'scale(1.3)';
          setTimeout(function () { heartBtn.style.transform = ''; }, 250);
        }
      });

      overlay.appendChild(heartBtn);
      card.appendChild(img);
      card.appendChild(overlay);
      fragment.appendChild(card);
    });

    galleryGrid.appendChild(fragment);
    totalLoaded += cats.length;
    photoCount.textContent = totalLoaded;
  }

  // ===== Lightbox =====
  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(function () { lightboxImg.src = ''; }, 400);
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  // ===== Error Handling =====
  function showError() {
    errorBanner.classList.add('visible');
  }

  function hideError() {
    errorBanner.classList.remove('visible');
  }

  retryBtn.addEventListener('click', function () {
    hideError();
    fetchCats();
  });

  // ===== Infinite Scroll (IntersectionObserver) =====
  const scrollObserver = new IntersectionObserver(
    function (entries) {
      if (entries[0].isIntersecting && !isFetching) {
        fetchCats();
      }
    },
    { rootMargin: '600px' }
  );

  scrollObserver.observe(loadMoreArea);

  // ===== Back to Top =====
  window.addEventListener('scroll', function () {
    if (window.scrollY > 800) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }, { passive: true });

  backToTopBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ===== Initial Load =====
  fetchCats();

})();
