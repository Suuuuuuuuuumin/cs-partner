/**
 * CS Partnership Dashboard
 * Interactive Portfolio Style App Logic
 */

// ========================================
// Category Configuration
// ========================================
const CATEGORIES = {
  food: { icon: '🍽️', label: 'Food', labelKo: '밥집' },
  bar: { icon: '🍸', label: 'Bar', labelKo: '술집' },
  cafe: { icon: '☕', label: 'Cafe', labelKo: '카페' },
  convenience: { icon: '🛒', label: 'Store', labelKo: '편의점' },
  culture: { icon: '🎬', label: 'Culture', labelKo: '문화' },
  other: { icon: '✦', label: 'Other', labelKo: '기타' }
};

// ========================================
// Category Keywords for Search
// ========================================
const CATEGORY_KEYWORDS = {
  food: ['음식', '밥', '밥집', '식당', '맛집', '먹을곳'],
  bar: ['술', '술집', '주점', '호프', '맥주'],
  cafe: ['카페', '커피', '디저트', '음료'],
  convenience: ['편의점', '마트', '씨유', 'cu']
};

// ========================================
// State
// ========================================
let stores = [];
let currentFilter = 'all';
let searchQuery = '';
let reactiveText = null;
let cardManager = null;

// ========================================
// DOM Elements
// ========================================
const cardGrid = document.getElementById('card-grid');
const storeCount = document.getElementById('store-count');
const searchInput = document.getElementById('search-input');
const emptyState = document.getElementById('empty-state');

// ========================================
// Text Morph Animation Class
// ========================================
class TextMorphAnimation {
  constructor(element, options = {}) {
    this.element = element;
    this.fullText = '컴퓨터소프트웨어공학과';
    this.shortText = '컴소공';
    this.chars = [];
    this.isAnimating = false;
    this.currentState = 'full'; // 'full' or 'short'
    this.animationId = null;

    this.options = {
      eraseDelay: 80,      // 글자 지우는 간격
      fillDelay: 60,       // 글자 채우는 간격
      pauseDuration: 3000, // 상태 유지 시간
      ...options
    };

    this.init();
  }

  init() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.element.textContent = this.fullText;
      return;
    }

    this.wrapChars();
    this.startAnimation();
  }

  wrapChars() {
    this.element.innerHTML = '';
    this.chars = [];

    this.fullText.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'char visible';
      span.textContent = char;
      span.dataset.index = i;
      this.element.appendChild(span);
      this.chars.push(span);
    });
  }

  async startAnimation() {
    while (true) {
      // Wait in full state
      await this.wait(this.options.pauseDuration);

      // Erase from edges to center (컴퓨터소프트웨어공학과 → 컴소공)
      await this.eraseToShort();

      // Wait in short state
      await this.wait(this.options.pauseDuration);

      // Fill from center to edges (컴소공 → 컴퓨터소프트웨어공학과)
      await this.fillToFull();
    }
  }

  async eraseToShort() {
    // 컴퓨터소프트웨어공학과 (11 chars)
    // 컴(0), 퓨(1), 터(2), 소(3), 프(4), 트(5), 웨(6), 어(7), 공(8), 학(9), 과(10)
    // 컴소공 = indices 0, 3, 8
    // Keep: 컴(0), 소(3), 공(8)
    // Erase from edges inward

    // Left side erase (after 컴, before 소): 퓨(1), 터(2)
    const leftToErase = [1, 2];
    // Right side erase (after 공): 과(10), 학(9), 어(7), 웨(6), 트(5), 프(4)
    const rightToErase = [10, 9, 7, 6, 5, 4];

    // Erase from both sides simultaneously
    const maxSteps = Math.max(leftToErase.length, rightToErase.length);

    for (let i = 0; i < maxSteps; i++) {
      if (i < leftToErase.length) {
        this.hideChar(leftToErase[i]);
      }
      if (i < rightToErase.length) {
        this.hideChar(rightToErase[i]);
      }
      await this.wait(this.options.eraseDelay);
    }

    this.currentState = 'short';
  }

  async fillToFull() {
    // Fill from center outward
    // 컴소공 → 컴퓨터소프트웨어공학과
    // 컴(0), 퓨(1), 터(2), 소(3), 프(4), 트(5), 웨(6), 어(7), 공(8), 학(9), 과(10)
    // Keep indices: 컴(0), 소(3), 공(8)
    // Fill order: from center (between 소=3 and 공=8) outward
    // Between 소 and 공: 프(4), 트(5), 웨(6), 어(7)
    // Left of 소: 터(2), 퓨(1)
    // Right of 공: 학(9), 과(10)

    const fillOrder = [
      [4, 7],     // 프, 어 (closest to center between 소 and 공)
      [5, 6],     // 트, 웨
      [2, 9],     // 터, 학 (outside 컴소공)
      [1, 10],    // 퓨, 과 (outermost)
    ];

    for (const indices of fillOrder) {
      for (const idx of indices) {
        if (idx < this.chars.length) {
          this.showChar(idx);
        }
      }
      await this.wait(this.options.fillDelay);
    }

    this.currentState = 'full';
  }

  hideChar(index) {
    if (this.chars[index]) {
      this.chars[index].classList.remove('visible');
      this.chars[index].classList.add('hidden');
    }
  }

  showChar(index) {
    if (this.chars[index]) {
      this.chars[index].classList.remove('hidden');
      this.chars[index].classList.add('visible');
    }
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy() {
    this.isAnimating = false;
  }
}

// ========================================
// Reactive Typography Class
// ========================================
class ReactiveTypography {
  constructor(element, options = {}) {
    this.element = element;
    this.letters = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.rafId = null;
    this.isActive = true;

    this.options = {
      maxDistance: 150,
      maxDisplacement: 30,
      easing: 0.15,
      ...options
    };

    this.init();
  }

  init() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Check for touch device - disable on mobile
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return;
    }

    this.wrapLetters();
    this.cachePositions();
    this.bindEvents();
    this.startAnimation();
  }

  wrapLetters() {
    const text = this.element.textContent;
    this.element.innerHTML = '';

    text.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.dataset.index = i;
      this.element.appendChild(span);
      this.letters.push({
        el: span,
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        centerX: 0,
        centerY: 0
      });
    });
  }

  cachePositions() {
    this.letters.forEach(letter => {
      const rect = letter.el.getBoundingClientRect();
      letter.centerX = rect.left + rect.width / 2;
      letter.centerY = rect.top + rect.height / 2;
    });
  }

  bindEvents() {
    // Throttled mouse move
    let lastMove = 0;
    const throttleMs = 16; // ~60fps

    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastMove < throttleMs) return;
      lastMove = now;

      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    }, { passive: true });

    // Recache positions on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.cachePositions(), 100);
    }, { passive: true });

    // Recache on scroll
    let scrollTimer;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => this.cachePositions(), 50);
    }, { passive: true });
  }

  startAnimation() {
    const animate = () => {
      if (!this.isActive) return;

      this.letters.forEach(letter => {
        const dx = this.mouseX - letter.centerX;
        const dy = this.mouseY - letter.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.options.maxDistance) {
          const force = 1 - (distance / this.options.maxDistance);
          const angle = Math.atan2(dy, dx);
          const displacement = force * this.options.maxDisplacement;

          // Push letters away from cursor
          letter.targetX = -Math.cos(angle) * displacement;
          letter.targetY = -Math.sin(angle) * displacement;
        } else {
          letter.targetX = 0;
          letter.targetY = 0;
        }

        // Smooth easing
        letter.x += (letter.targetX - letter.x) * this.options.easing;
        letter.y += (letter.targetY - letter.y) * this.options.easing;

        // Apply transform
        letter.el.style.transform = `translate(${letter.x}px, ${letter.y}px)`;
      });

      this.rafId = requestAnimationFrame(animate);
    };

    animate();
  }

  destroy() {
    this.isActive = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}

// ========================================
// Card Flip Manager Class
// ========================================
class CardFlipManager {
  constructor() {
    this.flippedCard = null;
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.init();
  }

  init() {
    // Only add click handlers for touch devices
    if (this.isTouchDevice) {
      this.bindTouchEvents();
    }

    // Always bind keyboard events for accessibility
    this.bindKeyboardEvents();
  }

  bindTouchEvents() {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.flip-card');

      // If clicking the Naver button, let it through
      if (e.target.closest('.naver-btn')) {
        return;
      }

      // If clicking outside any card, unflip current card
      if (!card && this.flippedCard) {
        this.flippedCard.classList.remove('flipped');
        this.flippedCard = null;
        return;
      }

      // If clicking a card
      if (card) {
        // If clicking the same card, toggle it
        if (card === this.flippedCard) {
          card.classList.remove('flipped');
          this.flippedCard = null;
        } else {
          // Unflip previous card
          if (this.flippedCard) {
            this.flippedCard.classList.remove('flipped');
          }
          // Flip new card
          card.classList.add('flipped');
          this.flippedCard = card;
        }
      }
    });

    // Touch feedback
    document.addEventListener('touchstart', (e) => {
      const card = e.target.closest('.flip-card');
      if (card) {
        card.classList.add('touching');
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      document.querySelectorAll('.flip-card.touching').forEach(card => {
        card.classList.remove('touching');
      });
    }, { passive: true });
  }

  bindKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      // Escape to unflip
      if (e.key === 'Escape' && this.flippedCard) {
        this.flippedCard.classList.remove('flipped');
        this.flippedCard = null;
      }

      // Enter/Space to flip focused card
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.flip-card')) {
        e.preventDefault();
        const card = e.target.closest('.flip-card');
        card.classList.toggle('flipped');
        this.flippedCard = card.classList.contains('flipped') ? card : null;
      }
    });
  }

  reset() {
    if (this.flippedCard) {
      this.flippedCard.classList.remove('flipped');
      this.flippedCard = null;
    }
  }
}

// ========================================
// Scroll Reveal Class
// ========================================
class ScrollReveal {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    // Disable for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Immediately reveal all cards
      document.querySelectorAll('.flip-card').forEach(card => {
        card.classList.add('revealed');
      });
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px'
    });
  }

  observe(elements) {
    if (!this.observer) {
      // For reduced motion, just add revealed class
      elements.forEach(el => el.classList.add('revealed'));
      return;
    }
    elements.forEach(el => this.observer.observe(el));
  }

  reset() {
    // Re-observe new elements after render
    const cards = document.querySelectorAll('.flip-card:not(.revealed)');
    this.observe(cards);
  }
}

// ========================================
// Scroll Effects Handler
// ========================================
class ScrollEffects {
  constructor() {
    this.header = document.querySelector('.header');
    this.hero = document.querySelector('.hero');
    this.filterNav = document.querySelector('.filter-nav');
    this.lastScrollY = 0;
    this.ticking = false;

    this.init();
  }

  init() {
    // Disable for reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
  }

  onScroll() {
    this.lastScrollY = window.scrollY;

    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.updateElements();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  updateElements() {
    const scrollY = this.lastScrollY;

    // Header effect
    if (this.header) {
      this.header.classList.toggle('scrolled', scrollY > 50);
    }

    // Hero parallax effect
    if (this.hero) {
      this.hero.classList.toggle('scrolled', scrollY > 100);
    }

    // Filter nav effect
    if (this.filterNav) {
      this.filterNav.classList.toggle('scrolled', scrollY > 150);
    }
  }
}

// ========================================
// State Variables
// ========================================
let scrollReveal = null;
let scrollEffects = null;

// ========================================
// Initialize Application
// ========================================
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadStores();
  setupEventListeners();
  initTextMorphAnimation();
  initCardFlipManager();
  initScrollEffects();
}

// ========================================
// Initialize Text Morph Animation
// ========================================
let textMorphAnimation = null;

function initTextMorphAnimation() {
  const titleMain = document.getElementById('title-main');
  if (titleMain) {
    textMorphAnimation = new TextMorphAnimation(titleMain, {
      eraseDelay: 80,
      fillDelay: 60,
      pauseDuration: 2000
    });
  }
}

// ========================================
// Initialize Scroll Effects
// ========================================
function initScrollEffects() {
  scrollReveal = new ScrollReveal();
  scrollEffects = new ScrollEffects();

  // Observe initial cards
  const cards = document.querySelectorAll('.flip-card');
  scrollReveal.observe(cards);
}

// ========================================
// Load Store Data
// ========================================
async function loadStores() {
  try {
    const response = await fetch('./data/stores.json');
    if (!response.ok) throw new Error('Failed to load stores');
    stores = await response.json();
    storeCount.textContent = stores.length;
    renderCards();
  } catch (error) {
    console.error('Error loading stores:', error);
    cardGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p class="empty-text">Failed to load store data</p>
      </div>
    `;
  }
}

// ========================================
// Setup Event Listeners
// ========================================
function setupEventListeners() {
  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.category;

      // Reset flipped cards when filtering
      if (cardManager) {
        cardManager.reset();
      }

      renderCards();
    });
  });

  // Search input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();

    // Reset flipped cards when searching
    if (cardManager) {
      cardManager.reset();
    }

    renderCards();
  });
}

// ========================================
// Initialize Reactive Typography
// ========================================
function initReactiveTypography() {
  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) {
    reactiveText = new ReactiveTypography(heroTitle, {
      maxDistance: 180,
      maxDisplacement: 35,
      easing: 0.12
    });
  }
}

// ========================================
// Initialize Card Flip Manager
// ========================================
function initCardFlipManager() {
  cardManager = new CardFlipManager();
}

// ========================================
// Filter Stores
// ========================================
function getFilteredStores() {
  return stores.filter(store => {
    // Category filter
    const categoryMatch = currentFilter === 'all' || store.category === currentFilter;

    // If no search query, just apply category filter
    if (!searchQuery) return categoryMatch;

    const query = searchQuery.toLowerCase();

    // 1. Name search
    const nameMatch = store.name.toLowerCase().includes(query);

    // 2. Tag search (menu items, food types)
    const tagMatch = store.tags?.some(tag => tag.toLowerCase().includes(query));

    // 3. Category keyword search (e.g., "카페" -> cafe category)
    const categoryKeywordMatch = Object.entries(CATEGORY_KEYWORDS).some(([cat, keywords]) => {
      return keywords.some(kw => kw.includes(query) || query.includes(kw)) && store.category === cat;
    });

    // 4. Benefit/Address search (existing)
    const benefitMatch = store.benefit.toLowerCase().includes(query);
    const addressMatch = store.address.toLowerCase().includes(query);

    // 5. Category label search (Food, Bar, Cafe, etc.)
    const category = CATEGORIES[store.category];
    const categoryLabelMatch = category && (
      category.label.toLowerCase().includes(query) ||
      category.labelKo.includes(query)
    );

    return categoryMatch && (nameMatch || tagMatch || categoryKeywordMatch || benefitMatch || addressMatch || categoryLabelMatch);
  });
}

// ========================================
// Render Cards
// ========================================
function renderCards() {
  const filtered = getFilteredStores();

  if (filtered.length === 0) {
    cardGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  cardGrid.innerHTML = filtered.map(store => {
    const category = CATEGORIES[store.category] || CATEGORIES.other;

    // Determine category color CSS variable
    const categoryColor = `var(--color-${store.category})`;

    return `
      <article class="flip-card" data-store-id="${store.id}" tabindex="0" role="button" aria-label="View ${store.name} benefits">
        <div class="flip-card-inner">
          <!-- Front Face -->
          <div class="flip-card-front">
            <div class="card-image" style="--category-color: ${categoryColor}">
              ${store.image
                ? `<img src="${store.image}" alt="${store.name}" loading="lazy">`
                : `<span class="card-icon-large">${category.icon}</span>`
              }
            </div>
            <div class="card-content-front">
              <span class="card-category-badge" data-category="${store.category}">${category.label}</span>
              <h3 class="card-name">${store.name}</h3>
            </div>
            <span class="flip-hint">Tap to see benefit</span>
          </div>

          <!-- Back Face -->
          <div class="flip-card-back">
            <div class="card-content-back">
              <div class="benefit-section">
                <span class="benefit-label">Benefit</span>
                <p class="benefit-text">${store.benefit}</p>
              </div>
              <div class="address-section">
                <span class="address-label">Location</span>
                <p class="address-text">${store.address}</p>
              </div>
              <a class="naver-btn" href="${store.naverUrl}" target="_blank" rel="noopener noreferrer">
                <span class="naver-logo">N</span>
                네이버 지도로 보기
              </a>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Re-apply scroll reveal to new cards
  if (scrollReveal) {
    const cards = document.querySelectorAll('.flip-card');
    scrollReveal.observe(cards);
  }
}
