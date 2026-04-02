const CATEGORIES = {
  food: { icon: '🍽️', label: 'Food', labelKo: '밥집' },
  bar: { icon: '🍸', label: 'Bar', labelKo: '술집' },
  cafe: { icon: '☕', label: 'Cafe', labelKo: '카페' },
  convenience: { icon: '🛒', label: 'Store', labelKo: '편의점' },
  culture: { icon: '🎬', label: 'Culture', labelKo: '문화' },
  other: { icon: '✦', label: 'Other', labelKo: '기타' }
};

const CATEGORY_KEYWORDS = {
  food: ['음식', '밥', '밥집', '식당', '맛집', '먹을곳'],
  bar: ['술', '술집', '주점', '호프', '맥주'],
  cafe: ['카페', '커피', '디저트', '음료'],
  convenience: ['편의점', '마트', '씨유', 'cu']
};

let stores = [];
let currentFilter = 'all';
let searchQuery = '';
let reactiveText = null;
let cardManager = null;

const cardGrid = document.getElementById('card-grid');
const storeCount = document.getElementById('store-count');
const searchInput = document.getElementById('search-input');
const emptyState = document.getElementById('empty-state');

class TextMorphAnimation {
  constructor(element, options = {}) {
    this.element = element;
    this.fullText = '컴퓨터소프트웨어공학과';
    this.shortText = '컴소공';
    this.chars = [];
    this.isAnimating = false;
    this.currentState = 'full';
    this.animationId = null;

    this.options = {
      eraseDelay: 80,
      fillDelay: 60,
      pauseDuration: 3000,
      ...options
    };

    this.init();
  }

  init() {
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
      await this.wait(this.options.pauseDuration);
      await this.eraseToShort();
      await this.wait(this.options.pauseDuration);
      await this.fillToFull();
    }
  }

  async eraseToShort() {
    const leftToErase = [1, 2];
    const rightToErase = [10, 9, 7, 6, 5, 4];
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
    const fillOrder = [
      [4, 7],
      [5, 6],
      [2, 9],
      [1, 10],
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

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
    let lastMove = 0;
    const throttleMs = 16;

    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastMove < throttleMs) return;
      lastMove = now;

      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    }, { passive: true });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.cachePositions(), 100);
    }, { passive: true });

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

          letter.targetX = -Math.cos(angle) * displacement;
          letter.targetY = -Math.sin(angle) * displacement;
        } else {
          letter.targetX = 0;
          letter.targetY = 0;
        }

        letter.x += (letter.targetX - letter.x) * this.options.easing;
        letter.y += (letter.targetY - letter.y) * this.options.easing;

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

class CardFlipManager {
  constructor() {
    this.flippedCard = null;
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.init();
  }

  init() {
    this.bindClickEvents();
    this.bindKeyboardEvents();
    if (this.isTouchDevice) {
      this.bindTouchFeedback();
    }
  }

  bindClickEvents() {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.flip-card');

      if (e.target.closest('.naver-btn')) {
        return;
      }

      if (!card && this.flippedCard) {
        this.flippedCard.classList.remove('flipped');
        this.flippedCard = null;
        return;
      }

      if (card) {
        if (card === this.flippedCard) {
          card.classList.remove('flipped');
          this.flippedCard = null;
        } else {
          if (this.flippedCard) {
            this.flippedCard.classList.remove('flipped');
          }
          card.classList.add('flipped');
          this.flippedCard = card;
        }
      }
    });
  }

  bindTouchFeedback() {
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
      if (e.key === 'Escape' && this.flippedCard) {
        this.flippedCard.classList.remove('flipped');
        this.flippedCard = null;
      }

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

class ScrollReveal {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
      elements.forEach(el => el.classList.add('revealed'));
      return;
    }
    elements.forEach(el => this.observer.observe(el));
  }

  reset() {
    const cards = document.querySelectorAll('.flip-card:not(.revealed)');
    this.observe(cards);
  }
}

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

    if (this.header) {
      this.header.classList.toggle('scrolled', scrollY > 50);
    }

    if (this.hero) {
      this.hero.classList.toggle('scrolled', scrollY > 100);
    }

    if (this.filterNav) {
      this.filterNav.classList.toggle('scrolled', scrollY > 150);
    }
  }
}

class TiltEffect {
  constructor() {
    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.isEnabled = false;
    this.tiltX = 0;
    this.tiltY = 0;
    this.targetTiltX = 0;
    this.targetTiltY = 0;
    this.rafId = null;
    this.heroElement = null;
    this.permissionGranted = false;

    this.options = {
      cardRotateMax: 5,
      heroTranslateMax: 10,
      easing: 0.08
    };

    this.init();
  }

  init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.heroElement = document.getElementById('title-main');

    if (this.isMobile) {
      this.initDeviceOrientation();
    } else {
      this.initMouseTracking();
    }
  }

  initDeviceOrientation() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      this.setupIOSPermission();
    } else if ('DeviceOrientationEvent' in window) {
      this.startDeviceOrientation();
    }
  }

  setupIOSPermission() {
    const requestPermission = async () => {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          this.permissionGranted = true;
          this.startDeviceOrientation();
        }
      } catch (error) {
        console.log('DeviceOrientation permission denied');
      }
      document.removeEventListener('touchstart', requestPermission);
    };

    document.addEventListener('touchstart', requestPermission, { once: true });
  }

  startDeviceOrientation() {
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma === null || e.beta === null) return;

      this.targetTiltX = Math.max(-1, Math.min(1, e.gamma / 45));
      this.targetTiltY = Math.max(-1, Math.min(1, (e.beta - 45) / 45));

      if (!this.isEnabled) {
        this.isEnabled = true;
        document.body.classList.add('tilt-enabled');
        this.startAnimation();
      }
    }, { passive: true });
  }

  initMouseTracking() {
    let lastMove = 0;
    const throttleMs = 16;

    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastMove < throttleMs) return;
      lastMove = now;

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      this.targetTiltX = (e.clientX - centerX) / centerX;
      this.targetTiltY = (e.clientY - centerY) / centerY;

      if (!this.isEnabled) {
        this.isEnabled = true;
        document.body.classList.add('tilt-enabled');
        this.startAnimation();
      }
    }, { passive: true });
  }

  startAnimation() {
    const animate = () => {
      this.tiltX += (this.targetTiltX - this.tiltX) * this.options.easing;
      this.tiltY += (this.targetTiltY - this.tiltY) * this.options.easing;

      this.applyTilt();
      this.rafId = requestAnimationFrame(animate);
    };

    animate();
  }

  applyTilt() {
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;

    const cards = document.querySelectorAll('.flip-card');
    cards.forEach(card => {
      const inner = card.querySelector('.flip-card-inner');
      if (!inner) return;

      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;

      const relX = (cardCenterX - viewportCenterX) / viewportCenterX;
      const relY = (cardCenterY - viewportCenterY) / viewportCenterY;

      const positionFactor = 0.4;
      const rotateY = (this.tiltX + relX * this.tiltX * positionFactor) * this.options.cardRotateMax;
      const rotateX = (-this.tiltY - relY * this.tiltY * positionFactor) * this.options.cardRotateMax * 0.6;

      if (card.classList.contains('flipped')) {
        inner.style.setProperty('--tilt-x', '0deg');
        inner.style.setProperty('--tilt-y', '0deg');
      } else {
        inner.style.setProperty('--tilt-x', `${rotateY}deg`);
        inner.style.setProperty('--tilt-y', `${rotateX}deg`);
      }
    });

    if (this.heroElement) {
      const translateX = this.tiltX * this.options.heroTranslateMax;
      const translateY = this.tiltY * this.options.heroTranslateMax * 0.5;
      this.heroElement.style.transform = `translate(${translateX}px, ${translateY}px)`;
    }
  }

  resetCards() {
    const cards = document.querySelectorAll('.flip-card');
    cards.forEach(card => {
      card.style.transform = '';
    });
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    document.body.classList.remove('tilt-enabled');
  }
}

let scrollReveal = null;
let scrollEffects = null;
let tiltEffect = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadStores();
  setupEventListeners();
  initTextMorphAnimation();
  initCardFlipManager();
  initScrollEffects();
  initTiltEffect();
}

function initTiltEffect() {
  tiltEffect = new TiltEffect();
}

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

function initScrollEffects() {
  scrollReveal = new ScrollReveal();
  scrollEffects = new ScrollEffects();

  const cards = document.querySelectorAll('.flip-card');
  scrollReveal.observe(cards);
}

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

function setupEventListeners() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.category;

      if (cardManager) {
        cardManager.reset();
      }

      renderCards();
    });
  });

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();

    if (cardManager) {
      cardManager.reset();
    }

    renderCards();
  });
}

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

function initCardFlipManager() {
  cardManager = new CardFlipManager();
}

function getFilteredStores() {
  return stores.filter(store => {
    const categoryMatch = currentFilter === 'all' || store.category === currentFilter;

    if (!searchQuery) return categoryMatch;

    const query = searchQuery.toLowerCase();

    const nameMatch = store.name.toLowerCase().includes(query);

    const tagMatch = store.tags?.some(tag => tag.toLowerCase().includes(query));

    const categoryKeywordMatch = Object.entries(CATEGORY_KEYWORDS).some(([cat, keywords]) => {
      return keywords.some(kw => kw.includes(query) || query.includes(kw)) && store.category === cat;
    });

    const benefitMatch = store.benefit.toLowerCase().includes(query);
    const addressMatch = store.address.toLowerCase().includes(query);

    const category = CATEGORIES[store.category];
    const categoryLabelMatch = category && (
      category.label.toLowerCase().includes(query) ||
      category.labelKo.includes(query)
    );

    return categoryMatch && (nameMatch || tagMatch || categoryKeywordMatch || benefitMatch || addressMatch || categoryLabelMatch);
  });
}

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
    const categoryColor = `var(--color-${store.category})`;

    return `
      <article class="flip-card" data-store-id="${store.id}" tabindex="0" role="button" aria-label="View ${store.name} benefits">
        <div class="flip-card-inner">
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
              <span class="flip-hint">Tap to see benefit</span>
            </div>
          </div>
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

  if (scrollReveal) {
    const cards = document.querySelectorAll('.flip-card');
    scrollReveal.observe(cards);
  }
}
