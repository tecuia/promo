// ============================================
// CORESMART NATIVE 
// ============================================

(function() {
  'use strict';

  // ============================================
  // PROGRESS BAR
  // ============================================
  
  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    
    const progressBar = document.querySelector(".cs-progress-bar");
    if (progressBar) {
      progressBar.style.width = progress + "%";
    }
  }

  window.addEventListener("scroll", updateProgress, { passive: true });

  // ============================================
  // CONTENT MAP
  // ============================================
  
  const CONTENT_MAP = {
    park: {
      title: 'Топ-10 ЖК возле парков:',
      text: `
        <p>Жить возле зеленого парка или набережной, в экологически чистой обстановке, иметь возможность совершать утренние и вечерние пробежки рядом с домом, ежедневно гулять с детьми на свежем воздухе — это мечта каждого жителя мегаполиса. Экологичность стала модным трендом и девелоперы стремятся удовлетворить высокие требования клиентов с достатком. В сегодняшней Москве имеется достаточный выбор элитного жилья с необходимыми характеристиками.</p>
        <p>№1 ЖК «Твид Парк». Расположен непосредственно на территории старинного парка Покровское-Стрешнево, на северо-западе Москвы, в 15 минутах от центра столицы. Малоэтажные кирпичные дома класса де-люкс в респектабельном английским стиле великолепно сочетаются с окружающим ландшафтом.</p>
      `
    },
    studio: {
      title: 'Студии в центре Москвы: Полный гид по выбору и покупке',
      text: `
        <p>Центр Москвы — это престиж, инфраструктура и жизнь в самом сердце столицы. Студии здесь пользуются особым спросом: у студентов, молодых специалистов, инвесторов и тех, кто ценит время и комфорт. Разбираемся, где искать, сколько стоит и на что обратить внимание.</p>
        <p>Что такое студия и почему она популярна? Студия — это жилое помещение, где кухня и комната объединены в одно пространство, а отдельным помещением является только санузел.</p>
        <p><strong>Тверской район</strong></p>
        <ul class="cs-list">
          <li>Средняя цена: 15–30 млн ₽</li>
          <li>Метро: Тверская, Пушкинская, Чеховская</li>
          <li>Плюсы: Престиж, инфраструктура, история</li>
          <li>Минусы: Высокие цены, шумные улицы</li>
        </ul>
      `
    },
    default: {
      title: 'Как выбрать 1-2 комнатную квартиру для семьи',
      text: `
        <p>Семейная ипотека — одна из самых выгодных программ на российском рынке недвижимости. Ставки от 4,5% до 6% делают покупку квартиры доступной для семей с детьми. Разбираемся, как правильно подобрать жильё и не ошибиться с выбором.</p>
      `
    }
  };

  // ============================================
  // STATE
  // ============================================

  let mechanicStarted = false;
  let mechanicCompleted = false;
  let mainScrollTrigger = null;
  let originalScrollBehavior = null;
  let scrollBlocker = null;
  let touchStartY = 0;
  let minScrollY = 0;
  let selectedFilters = [];
  let resultShown = false;
  let isCollapsed = false;
  let lastContentKey = 'default';
  let isResubmitting = false;

  // ============================================
  // DOM ELEMENTS
  // ============================================

  const randomizerBlock = document.querySelector('.randomizer-window');
  const randomizerContent = document.getElementById('randomizerContent');
  const randomizerTop = document.getElementById('randomizerTop');
  const randomizerSubmitBtn = document.getElementById('randomizerSubmitBtn');
  const randomizerLoading = document.getElementById('randomizerLoading');
  const randomizerResult = document.getElementById('randomizerResult');
  const randomizerCtaText = document.getElementById('randomizerCtaText');
  const randomizerFiltersWrapper = document.getElementById('randomizerFiltersWrapper');
  const contentBefore = document.getElementById('contentBefore');
  const contentAfter = document.getElementById('contentAfter');
  const animationWrapper = document.querySelector('.animation-wrapper');

  // ============================================
  // LOADING SPINNER HTML
  // ============================================

  const SPINNER_HTML = `
    <div class="loading-spinner" style="position: relative; width: 50px; height: 50px;">
      ${Array.from({length: 16}, (_, i) => `
        <div class="dot" style="
          --i: ${i};
          position: absolute;
          top: 22px;
          left: 22px;
          width: 6px;
          height: 6px;
          background: #000;
          border-radius: 50%;
          transform-origin: 3px 3px;
          transform: rotate(calc(22.5deg * ${i})) translate(0, -22px);
          animation: fadeDots 1.2s linear infinite;
          animation-delay: calc(-1.2s + (1.2s / 16 * ${i}));
        "></div>
      `).join('')}
    </div>
  `;

  // ============================================
  // RESULT & LOADING WRAPPERS (вне окна)
  // ============================================

  let resultWrapper = null;
  let loadingWrapper = null;

  function ensureResultWrapper() {
    if (!resultWrapper) {
      resultWrapper = document.createElement('div');
      resultWrapper.className = 'randomizer-result-wrapper';
      resultWrapper.style.cssText = `
        max-width: 720px;
        width: 100%;
        margin: 30px auto 0;
        padding: 0 20px;
        box-sizing: border-box;
        position: relative;
        z-index: 5;
        opacity: 0;
      `;
      if (animationWrapper && randomizerBlock) {
        animationWrapper.insertBefore(resultWrapper, randomizerBlock.nextSibling);
      }
    }
    return resultWrapper;
  }

  function ensureLoadingWrapper() {
    if (!loadingWrapper) {
      loadingWrapper = document.createElement('div');
      loadingWrapper.className = 'randomizer-loading-wrapper';
      loadingWrapper.style.cssText = `
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin-top: 20px;
        position: relative;
        z-index: 5;
      `;
      loadingWrapper.innerHTML = SPINNER_HTML;
      
      if (animationWrapper && randomizerBlock) {
        animationWrapper.insertBefore(loadingWrapper, randomizerBlock.nextSibling);
      }
    }
    return loadingWrapper;
  }

  function showLoadingExternal() {
    const loader = ensureLoadingWrapper();
    loader.style.display = 'flex';
    gsap.fromTo(loader, 
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
    );
  }

  function hideLoadingExternal(callback) {
    const loader = ensureLoadingWrapper();
    gsap.to(loader, {
      opacity: 0,
      y: -10,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        loader.style.display = 'none';
        if (callback) callback();
      }
    });
  }

  // ============================================
  // RESUBMIT LOADING (сосед wrapper, поверх него)
  // ============================================

  let overlaySpinner = null;

  function showResubmitLoadingOnResult() {
    const wrapper = ensureResultWrapper();
    
    if (!overlaySpinner) {
      overlaySpinner = document.createElement('div');
      overlaySpinner.className = 'resubmit-spinner-overlay';
      overlaySpinner.innerHTML = SPINNER_HTML;
      overlaySpinner.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        pointer-events: none;
        display: none;
      `;
    }
    
    if (!overlaySpinner.parentNode) {
      wrapper.parentNode.insertBefore(overlaySpinner, wrapper.nextSibling);
    }
    
    overlaySpinner.style.display = 'flex';
    positionOverlayOnWrapper();
    
    gsap.fromTo(overlaySpinner, 
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: "power2.out" }
    );
  }

  function positionOverlayOnWrapper() {
    if (!overlaySpinner || !resultWrapper) return;
    
    const wrapperRect = resultWrapper.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    overlaySpinner.style.position = 'absolute';
    overlaySpinner.style.top = (wrapperRect.top + scrollTop) + 'px';
    overlaySpinner.style.left = wrapperRect.left + 'px';
    overlaySpinner.style.width = wrapperRect.width + 'px';
    overlaySpinner.style.height = wrapperRect.height + 'px';
  }

  function hideResubmitLoadingOnResult(callback) {
    if (!overlaySpinner) return;
    gsap.to(overlaySpinner, {
      opacity: 0,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        overlaySpinner.style.display = 'none';
        if (overlaySpinner.parentNode) {
          overlaySpinner.parentNode.removeChild(overlaySpinner);
        }
        if (callback) callback();
      }
    });
  }

  // ============================================
  // SCROLL CONTROL
  // ============================================
  
  function disableScroll() {
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    originalScrollBehavior = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight,
      scrollY: scrollY
    };
    
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.classList.add('no-scroll');
  }

  function enableScroll() {
    if (!originalScrollBehavior) return;
    
    const scrollY = originalScrollBehavior.scrollY || Math.abs(parseInt(document.body.style.top || '0'));
    
    document.body.style.position = originalScrollBehavior.position || '';
    document.body.style.top = originalScrollBehavior.top || '';
    document.body.style.width = originalScrollBehavior.width || '';
    document.body.style.paddingRight = originalScrollBehavior.paddingRight || '';
    document.body.classList.remove('no-scroll');
    
    originalScrollBehavior = null;
    
    window.scrollTo(0, scrollY);
  }

  // ============================================
  // SCROLL BLOCKER
  // ============================================
  
  function setupScrollBlockerWithValue(scrollLimit) {
    cleanupScrollBlocker();
    minScrollY = scrollLimit;
    
    scrollBlocker = function(e) {
      if (window.scrollY < minScrollY) {
        window.scrollTo(0, minScrollY);
      }
    };
    
    const touchStart = function(e) {
      touchStartY = e.touches[0].clientY;
    };
    
    const touchBlocker = function(e) {
      if (window.scrollY <= minScrollY) {
        const touch = e.touches[0];
        const touchY = touch.clientY;
        if (touchStartY < touchY) {
          e.preventDefault();
        }
      }
    };
    
    window.addEventListener('scroll', scrollBlocker, { passive: false });
    window.addEventListener('touchstart', touchStart, { passive: true });
    window.addEventListener('touchmove', touchBlocker, { passive: false });
    
    scrollBlocker.cleanup = function() {
      window.removeEventListener('scroll', scrollBlocker);
      window.removeEventListener('touchstart', touchStart);
      window.removeEventListener('touchmove', touchBlocker);
    };
  }
  
  function cleanupScrollBlocker() {
    if (scrollBlocker && scrollBlocker.cleanup) {
      scrollBlocker.cleanup();
      scrollBlocker = null;
    }
  }

  // ============================================
  // GSAP SCROLL ANIMATION
  // ============================================
  
  function initScrollAnimation() {
    gsap.registerPlugin(ScrollTrigger);
    
    gsap.set(randomizerBlock, {
      width: "min(926px, 95vw)",
      height: "min(548px, 60vh)",
      borderRadius: "24px",
      force3D: true
    });
    
    const entryTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".animation-wrapper",
        start: "top 80%",
        end: "center center",
        scrub: 1.2
      }
    });
    
    entryTl.to(randomizerBlock, {
      width: "min(1380px, 95vw)",
      height: "min(489px, 80vh)",
      borderRadius: "16px",
      ease: "power1.inOut"
    });
    
    mainScrollTrigger = ScrollTrigger.create({
      trigger: ".animation-wrapper",
      start: "center center",
      end: "+=3000",
      pin: true,
      onEnter: () => {
        if (!mechanicStarted && !mechanicCompleted) {
          mechanicStarted = true;
          document.body.classList.add('randomizer-active');
          disableScroll();
          
          entryTl.kill();
          
          gsap.set(randomizerBlock, {
            width: "min(1380px, 95vw)",
            height: "min(489px, 80vh)",
            borderRadius: "16px",
            clearProps: "transform"
          });
        }
      }
    });
  }

  // ============================================
  // FILTER LOGIC
  // ============================================
  
  function initFilters() {
    const filterButtons = document.querySelectorAll('.randomizer-filter-btn');
    
    filterButtons.forEach(btn => {
      btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const button = e.currentTarget;
        button.classList.toggle('active');
        
        const filterValue = button.dataset.filter;
        
        if (button.classList.contains('active')) {
          if (!selectedFilters.includes(filterValue)) {
            selectedFilters.push(filterValue);
          }
        } else {
          selectedFilters = selectedFilters.filter(f => f !== filterValue);
        }
        
        console.log('Выбранные фильтры:', selectedFilters);
      };
    });
  }

  // ============================================
  // DETERMINE CONTENT
  // ============================================
  
  function getContent() {
    if (selectedFilters.includes('studio')) return 'studio';
    if (selectedFilters.includes('park')) return 'park';
    return 'default';
  }

  // ============================================
  // COLLAPSE WINDOW
  // ============================================

  function collapseWindowForCompletion() {
    isCollapsed = true;
    
    if (mainScrollTrigger) {
      mainScrollTrigger.kill();
      mainScrollTrigger = null;
    }
    
    if (contentBefore) {
      contentBefore.style.display = 'none';
    }

    lastContentKey = getContent();

    const wrapper = ensureResultWrapper();
    updateExternalResult(wrapper);

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.classList.remove('randomizer-active');
        
        if (animationWrapper) {
          animationWrapper.style.display = 'none';
        }
        
        if (contentAfter && randomizerBlock) {
          contentAfter.insertBefore(randomizerBlock, contentAfter.firstChild);
        }
        
        if (contentAfter && wrapper) {
          contentAfter.insertBefore(wrapper, contentAfter.children[1] || null);
        }
        
        if (loadingWrapper && contentAfter) {
          contentAfter.insertBefore(loadingWrapper, contentAfter.children[2] || null);
        }
        
        if (contentAfter) {
          contentAfter.style.opacity = '1';
          contentAfter.style.visibility = 'visible';
        }
        
        enableScroll();
        
        // Инициализируем CoreSmartS2S как в тиндере
        if (typeof CoreSmartS2S !== 'undefined') {
          CoreSmartS2S.init({
            linkToOpen: "https://inpool.ru/",
            previewImage: "./imgs/preview.png",
            previewImageMob: "./imgs/previewMob.png",
            minVisiblePercent: 0.8,
            redirectDelay: 400
          });
        }
        
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const targetY = contentAfter.getBoundingClientRect().top + window.scrollY;
            
            window.scrollTo({
              top: targetY,
              behavior: 'instant'
            });
            
            setupScrollBlockerWithValue(targetY);
            
            resultShown = false;
          });
        });
        
        mechanicCompleted = true;
      }
    });

    tl.to([randomizerCtaText, randomizerTop], { 
      y: -20, 
      opacity: 0, 
      duration: 0.35, 
      stagger: 0.05,
      ease: "power2.in" 
    }, 0);

    tl.to(randomizerContent, {
      padding: "20px 20px",
      gap: "16px",
      duration: 0.5,
      ease: "power2.inOut"
    }, 0.15);

    tl.to(randomizerBlock, {
      height: "auto",
      width: "min(720px, 95vw)",
      borderRadius: "16px",
      duration: 0.6,
      ease: "power2.inOut"
    }, 0.2);

    tl.to(randomizerBlock, {
      scale: 1.01,
      duration: 0.15,
      ease: "power1.out"
    }, "-=0.1")
    .to(randomizerBlock, {
      scale: 1,
      duration: 0.2,
      ease: "power1.inOut"
    });

    gsap.set(wrapper, { 
      opacity: 0, 
      y: 30
    });
    
    tl.to(wrapper, { 
      opacity: 1, 
      y: 0, 
      duration: 0.5, 
      ease: "power2.out" 
    }, "-=0.2");
  }

  // ============================================
  // UPDATE EXTERNAL RESULT CONTENT
  // ============================================
  
  function updateExternalResult(wrapper) {
    const content = CONTENT_MAP[lastContentKey] || CONTENT_MAP.default;
    wrapper.innerHTML = `
      <h2 class="randomizer-result-title" style="font-family: 'Manrope', sans-serif; font-weight: 400; font-size: 32px; line-height: 120%; color: #000; margin-bottom: 16px;">${content.title}</h2>
      <div class="randomizer-result-text" style="font-family: 'Manrope', sans-serif; font-weight: 300; font-size: 18px; line-height: 1.6; color: #333;">${content.text}</div>
    `;
  }

  // ============================================
  // SHOW RESULT + LOADING (первый сабмит)
  // ============================================
  
  function showResultWithLoading() {
    showLoadingExternal();
    
    setTimeout(() => {
      hideLoadingExternal(() => {
        collapseWindowForCompletion();
      });
    }, 2000);
  }

  // ============================================
  // RESUBMIT
  // ============================================
  
  function handleResubmit() {
    if (isResubmitting) return;
    if (selectedFilters.length === 0) return;
    
    isResubmitting = true;
    
    const newContentKey = getContent();
    if (newContentKey === lastContentKey) {
      isResubmitting = false;
      return;
    }
    
    lastContentKey = newContentKey;
    
    const wrapper = ensureResultWrapper();
    
    gsap.to(wrapper, {
      filter: 'blur(8px)',
      opacity: 0.6,
      duration: 0.3,
      ease: "power2.out"
    });
    
    showResubmitLoadingOnResult();
    
    setTimeout(() => {
      updateExternalResult(wrapper);
      
      hideResubmitLoadingOnResult(() => {
        gsap.to(wrapper, {
          filter: 'blur(0px)',
          opacity: 1,
          duration: 0.4,
          ease: "power2.out"
        });
        
        isResubmitting = false;
      });
    }, 2000);
  }

  // ============================================
  // SUBMIT HANDLER
  // ============================================
  
  function handleSubmit() {
    if (!mechanicStarted) return;
    if (selectedFilters.length === 0) return;
    if (resultShown) return;
    
    if (isCollapsed) {
      handleResubmit();
      return;
    }

    resultShown = true;

    gsap.to(randomizerCtaText, {
      y: -30,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in"
    });

    gsap.to(randomizerTop, {
      y: -20,
      opacity: 0,
      duration: 0.35,
      ease: "power2.in"
    });

    setTimeout(() => {
      showResultWithLoading();
    }, 250);
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================
  
  if (randomizerSubmitBtn) {
    randomizerSubmitBtn.addEventListener('click', handleSubmit);
  }

  window.addEventListener('resize', () => {
    if (overlaySpinner && overlaySpinner.style.display === 'flex') {
      positionOverlayOnWrapper();
    }
  });

  // ============================================
  // RESET
  // ============================================
  
  window.resetMechanic = function() {
    mechanicCompleted = false;
    mechanicStarted = false;
    selectedFilters = [];
    resultShown = false;
    isCollapsed = false;
    isResubmitting = false;
    lastContentKey = 'default';
    
    cleanupScrollBlocker();
    
    // Удаляем S2S контейнер если был создан
    const s2sContainer = document.querySelector('.cs-s2s-container');
    if (s2sContainer) {
      s2sContainer.remove();
    }
    
    if (animationWrapper && randomizerBlock) {
      animationWrapper.appendChild(randomizerBlock);
    }
    
    if (animationWrapper) {
      animationWrapper.style.display = '';
    }
    
    if (contentBefore) {
      contentBefore.style.display = '';
    }
    
    if (contentAfter) {
      contentAfter.style.opacity = '';
      contentAfter.style.visibility = '';
    }
    
    if (resultWrapper) {
      resultWrapper.remove();
      resultWrapper = null;
    }
    
    if (loadingWrapper) {
      loadingWrapper.remove();
      loadingWrapper = null;
    }
    
    if (overlaySpinner) {
      overlaySpinner.remove();
      overlaySpinner = null;
    }
    
    gsap.set(randomizerBlock, {
      y: 0,
      opacity: 1,
      height: "min(548px, 60vh)",
      width: "min(926px, 95vw)",
      minHeight: '',
      scale: 1,
      clearProps: "all"
    });
    
    gsap.set(randomizerContent, {
      padding: '',
      gap: '',
      clearProps: "all"
    });
    
    if (randomizerTop) {
      gsap.set(randomizerTop, { y: 0, opacity: 1, clearProps: "all" });
    }
    
    if (randomizerCtaText) {
      gsap.set(randomizerCtaText, { y: 0, opacity: 1, clearProps: "all" });
    }
    
    if (randomizerFiltersWrapper) {
      gsap.set(randomizerFiltersWrapper, { 
        opacity: 1, 
        y: 0, 
        clearProps: "all" 
      });
    }
    
    if (randomizerSubmitBtn) {
      gsap.set(randomizerSubmitBtn, { 
        opacity: 1, 
        clearProps: "all" 
      });
    }
    
    document.querySelectorAll('.randomizer-filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    randomizerLoading.classList.remove('active');
    gsap.set(randomizerLoading, { opacity: 0, y: 0, clearProps: "all" });
    
    if (randomizerResult) {
      randomizerResult.classList.remove('active');
      randomizerResult.innerHTML = '';
      gsap.set(randomizerResult, { 
        opacity: 0, 
        y: 0, 
        filter: 'blur(0px)', 
        clearProps: "all" 
      });
    }
    
    document.body.classList.remove('randomizer-active');
    
    if (mainScrollTrigger) {
      mainScrollTrigger.kill();
      mainScrollTrigger = null;
    }
    
    ScrollTrigger.refresh();
    initScrollAnimation();
  };

  // ============================================
  // START
  // ============================================
  
  initFilters();
  initScrollAnimation();

})();