// ============================================
// CORESMART NATIVE — TINDER MECHANIC
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
  // CONFIG
  // ============================================

  const stepTexts = [
    'Мои клиенты чаще покупают...',
    'Мои клиенты чаще покупают...',
    'Какие клиенты вам подходят?'
  ];

  // ============================================
  // STATE
  // ============================================

  let cardData = [];
  let currentData = [];
  let currentCard = null;
  let results = [];
  let isAnimating = false;
  let mechanicStarted = false;
  let mechanicCompleted = false;
  let mainScrollTrigger = null;
  let originalScrollBehavior = null;
  let scrollBlocker = null;
  let touchStartY = 0;
  let minScrollY = 0;

  // ============================================
  // DOM ELEMENTS
  // ============================================

  const tinderBlock = document.querySelector('.tinder-window');
  const cardContainer = document.getElementById('cardContainer');
  const dynamicText = document.getElementById('dynamicText');
  const questionCounter = document.getElementById('questionCounter');
  const successBlock = document.getElementById('successBlock');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const loadingText = document.getElementById('loadingText');
  const successCheck = document.getElementById('successCheck');
  const contentBefore = document.getElementById('contentBefore');
  const contentAfter = document.getElementById('contentAfter');
  const cardDescriptionText = document.getElementById('cardDescriptionText');

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
      paddingRight: document.body.style.paddingRight
    };
    
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.classList.add('no-scroll');
  }

  function enableScroll() {
    if (!originalScrollBehavior) return;
    
    const scrollY = Math.abs(parseInt(document.body.style.top || '0'));
    document.body.style.position = originalScrollBehavior.position || '';
    document.body.style.top = originalScrollBehavior.top || '';
    document.body.style.width = originalScrollBehavior.width || '';
    document.body.style.paddingRight = originalScrollBehavior.paddingRight || '';
    document.body.classList.remove('no-scroll');
    
    if (!mechanicCompleted) {
      window.scrollTo(0, scrollY);
    }
    
    originalScrollBehavior = null;
  }

  // ============================================
  // SCROLL BLOCKER (AFTER MECHANIC)
  // ============================================
  
  function setupScrollBlocker() {
    if (!contentAfter) return;
    
    minScrollY = contentAfter.offsetTop - 50;
    
    if (scrollBlocker) {
      cleanupScrollBlocker();
    }
    
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
        
        if (touchStartY < touchY && window.scrollY <= minScrollY) {
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
  // DATA LOADING
  // ============================================
  
  async function loadData() {
    try {
      const response = await fetch('./data.json');
      cardData = await response.json();
      initScrollAnimation();
      loadCards();
    } catch (error) {
      console.warn('Data.json not found, using fallback:', error);
      cardData = [
        {
          "name": "Дорогие товары(премиум)",
          "image": "imgs/1.png",
          "correct": true,
          "type": "type-1",
          "description": "Большинство компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов. Эти показатели важны, но они описывают только начало "
        },
        {
          "name": "Новинки и эксперементы",
          "image": "imgs/2.png",
          "correct": true,
          "type": "type-1",
          "description": "Большинство3 компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов. Эти показатели важны, но они описывают только начало "
        },
        {
          "name": "Товары по акции или скидке",
          "image": "imgs/3.png",
          "correct": true,
          "type": "type-1",
          "description": "Большинство2 компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов. Эти показатели важны, но они описывают только начало "
        }
      ];
      initScrollAnimation();
      loadCards();
    }
  }

  // ============================================
  // GSAP SCROLL ANIMATION
  // ============================================
  
  function initScrollAnimation() {
    gsap.registerPlugin(ScrollTrigger);
    
    gsap.set(tinderBlock, {
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
    
    entryTl.to(tinderBlock, {
      width: "min(1430px, 95vw)",
      height: "min(846px, 85vh)",
      borderRadius: "16px",
      ease: "power1.inOut"
    });
    
    mainScrollTrigger = ScrollTrigger.create({
      trigger: ".animation-wrapper",
      start: "center center",
      end: "+=1500",
      pin: true,
      onEnter: () => {
        if (!mechanicStarted && !mechanicCompleted) {
          mechanicStarted = true;
          document.body.classList.add('tinder-active');
          disableScroll();
          
          entryTl.kill();
          
          gsap.set(tinderBlock, {
            width: "min(1430px, 95vw)",
            height: "min(846px, 85vh)",
            borderRadius: "16px",
            clearProps: "transform"
          });
          
          loadCards();
        }
      }
    });
  }

  // ============================================
  // UPDATE DESCRIPTION TEXT
  // ============================================
  
  function updateDescriptionText(cardData) {
    if (!cardDescriptionText) return;
    
    if (cardData && cardData.description) {
      gsap.to(cardDescriptionText, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          cardDescriptionText.textContent = cardData.description;
          gsap.to(cardDescriptionText, {
            opacity: 1,
            duration: 0.3
          });
        }
      });
    } else {
      cardDescriptionText.textContent = 'Большинство компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов. Эти показатели важны, но они описывают только начало';
    }
  }

  // ============================================
  // EXIT ANIMATION
  // ============================================

  function playExitAnimation() {
    const exitTl = gsap.timeline({
      onComplete: () => {
        mechanicCompleted = true;
        
        if (mainScrollTrigger) {
          mainScrollTrigger.kill();
        }
        
        const animationWrapper = document.querySelector('.animation-wrapper');
        if (animationWrapper) {
          animationWrapper.style.display = 'none';
        }
        
        if (contentBefore) {
          contentBefore.style.display = 'none';
        }
        
        document.body.classList.remove('tinder-active');
        enableScroll();
        setupScrollBlocker();
        
            if (typeof CoreSmartS2S !== 'undefined') {
              CoreSmartS2S.init({
                linkToOpen: "https://inpool.ru/",
                linkToShow: "inpool.ru",
                previewImage: "./imgs/preview.png",
                previewImageMob: "./imgs/previewMob.png",
                minScrollPercent: 100
              });
            }
        
        if (contentAfter) {
          contentAfter.style.opacity = '1';
          contentAfter.style.visibility = 'visible';
        }
        
        // Просто скроллим к контенту после механики
        if (contentAfter) {
          setTimeout(() => {
            contentAfter.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // const s2sContainer = document.querySelector('.cs-s2s-container');
    
          }, 100);
        }
      }
    });

    exitTl.to(tinderBlock, {
      height: "300px",
      duration: 0.8,
      ease: "power2.inOut"
    })
    .to(tinderBlock, {
      y: "-120vh",
      opacity: 0,
      duration: 0.8,
      ease: "power2.in"
    }, "+=0.2");
  }

  // ============================================
  // CARDS LOADING
  // ============================================
  
  function loadCards() {
    cardContainer.innerHTML = '';
    currentData = [...cardData].reverse();
    results = [];
    
    currentData.forEach((item, index) => {
      const card = createCard(item, index);
      cardContainer.appendChild(card);
    });
    
    showNextCard();
    updateCounter();
  }

  function createCard(item, index) {
    const card = document.createElement('div');
    card.className = 'tinder-card';
    card.dataset.index = index;
    card.dataset.type = item.type;
    card.style.zIndex = 1000 - index;
    card.style.opacity = '1';
    
    card.innerHTML = `
      <img class="tinder-card-img" src="${item.image}" alt="${item.name}" draggable="false">
      <div class="tinder-card-footer">
        <div class="tinder-card-name">${item.name}</div>
        <div class="tinder-card-actions">
          <button class="tinder-card-btn tinder-card-btn-nope" data-action="nope">
            <img src="./imgs/nope.png" alt="Nope">
          </button>
          <button class="tinder-card-btn tinder-card-btn-like" data-action="like">
            <img src="./imgs/like.png" alt="Like">
          </button>
        </div>
      </div>
    `;
    
    const nopeBtn = card.querySelector('[data-action="nope"]');
    const likeBtn = card.querySelector('[data-action="like"]');
    
    nopeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isAnimating && mechanicStarted) {
        handleAnswer(false);
      }
    });
    
    likeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isAnimating && mechanicStarted) {
        handleAnswer(true);
      }
    });
    
    return card;
  }

  // ============================================
  // CARDS POSITIONING (CAROUSEL)
  // ============================================
  
  function showNextCard() {
    const cards = document.querySelectorAll('.tinder-card');
    if (cards.length === 0) {
      finishMechanic();
      return;
    }
    
    currentCard = cards[cards.length - 1];
    updateCounter();
    
    const answered = currentData.length - cards.length;
    const step = Math.min(answered, stepTexts.length - 1);
    dynamicText.textContent = stepTexts[step];
    
    // Обновляем текст под окном
    const currentCardData = currentData[currentData.length - cards.length];
    updateDescriptionText(currentCardData);
    
    Array.from(cards).reverse().forEach((card, idx) => {
      card.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease, filter 0.5s ease';
      
      if (idx === 0) {
        card.style.transform = 'translateX(0) translateY(60px) scale(1.05) rotate(0deg)';
        card.style.zIndex = 1000;
        card.style.opacity = '1';
        card.style.filter = 'blur(0px)';
      } else if (idx === 1) {
        card.style.transform = 'translateX(-170px) translateY(30px) scale(0.85)';
        card.style.zIndex = 999;
        card.style.opacity = '1';
        card.style.filter = 'blur(0px)';
      } else if (idx === 2) {
        card.style.transform = 'translateX(170px) translateY(30px) scale(0.85)';
        card.style.zIndex = 998;
        card.style.opacity = '1';
        card.style.filter = 'blur(0px)';
      } else {
        card.style.transform = 'translateX(0) translateY(30px) scale(0.8)';
        card.style.opacity = '0';
        card.style.filter = 'blur(0px)';
        card.style.zIndex = 900 - idx;
      }
    });
    
    setupCardListeners(currentCard);
  }

  // ============================================
  // SWIPE HANDLERS
  // ============================================
  
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  let rAF_ID = null;

  function setupCardListeners(card) {
    card.removeEventListener('mousedown', onDragStart);
    card.removeEventListener('touchstart', onDragStart);
    
    card.addEventListener('mousedown', onDragStart);
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    
    card.addEventListener('touchstart', onDragStart, { passive: true });
    card.addEventListener('touchmove', onDragMove, { passive: false });
    card.addEventListener('touchend', onDragEnd);
  }

  function onDragStart(e) {
    if (isAnimating) return;
    isDragging = true;
    startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    currentCard.style.transition = 'none';
  }

  function updateCardPosition() {
    if (currentCard && isDragging) {
      const rotate = currentX * 0.05;
      currentCard.style.transform = `translate3d(${currentX}px, 0, 0) rotate(${rotate}deg)`;
    }
    rAF_ID = null;
  }

  function onDragMove(e) {
    if (!isDragging || isAnimating) return;
    
    if (!e.type.includes('mouse') && e.cancelable) {
      e.preventDefault();
    }
    
    currentX = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - startX;
    
    if (!rAF_ID) {
      rAF_ID = requestAnimationFrame(updateCardPosition);
    }
  }

  function onDragEnd() {
    if (!isDragging || isAnimating) return;
    isDragging = false;
    
    if (rAF_ID) {
      cancelAnimationFrame(rAF_ID);
      rAF_ID = null;
    }
    
    if (Math.abs(currentX) > 100) {
      handleAnswer(currentX > 0);
    } else {
      currentCard.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease';
      currentCard.style.transform = 'translateX(0) translateY(0) scale(1) rotate(0deg)';
    }
    
    startX = 0;
    currentX = 0;
  }

  function handleAnswer(isLike) {
    if (isAnimating) return;
    isAnimating = true;
    
    const moveX = isLike ? window.innerWidth : -window.innerWidth;
    const rotate = isLike ? 20 : -20;
    
    currentCard.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease';
    currentCard.style.transform = `translateX(${moveX}px) translateY(20px) rotate(${rotate}deg)`;
    currentCard.style.opacity = '0';
    
    results.push({ type: currentCard.dataset.type, answer: isLike });
    
    setTimeout(() => {
      const parent = currentCard.parentNode;
      if (parent.contains(currentCard)) {
        parent.removeChild(currentCard);
      }
      
      isAnimating = false;
      showNextCard();
    }, 400);
  }

  // ============================================
  // MECHANIC COMPLETION
  // ============================================
  
  function finishMechanic() {
    cardContainer.style.display = 'none';
    
    const buttonsContainer = document.querySelector('.tinder-buttons');
    if (buttonsContainer) buttonsContainer.style.display = 'none';
    
    questionCounter.style.display = 'none';
    dynamicText.style.display = 'none';
    
    // Скрываем текст описания
    if (cardDescriptionText) {
      gsap.to(cardDescriptionText, {
        opacity: 0,
        duration: 0.3
      });
    }
    
    successBlock.style.display = 'block';
    determineWinner();
    
    setTimeout(() => {
      gsap.to(loadingSpinner, { opacity: 0, duration: 0.3 });
      gsap.to(loadingText, { opacity: 0, duration: 0.3, onComplete: () => {
        loadingSpinner.style.display = 'none';
        loadingText.style.display = 'none';
        successCheck.style.display = 'block';
        
        gsap.fromTo("#whitePulse", 
          { opacity: 0 },
          { opacity: 0.6, duration: 0.25, yoyo: true, repeat: 1, ease: "power1.inOut" }
        );
        
        gsap.fromTo(successCheck, 
          { scale: 0.5, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
        );
        
        setTimeout(() => {
          playExitAnimation();
        }, 1200);
      }});
    }, 2000);
  }

  function determineWinner() {
    // Просто подсчитываем результаты (без отображения)
    const typeCounts = { 'type-1': 0, 'type-2': 0, 'type-3': 0 };
    
    results.forEach(r => {
      if (r.answer) typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    });
    
    let maxType = 'type-1';
    let maxCount = 0;
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxType = type;
      }
    });
    
    // Можно логировать в консоль для отладки
    console.log('Механика завершена! Выбран тип:', maxType);
    
    return maxType;
  }

  function updateCounter() {
    const answered = currentData.length - document.querySelectorAll('.tinder-card').length;
    questionCounter.textContent = `${answered}/${currentData.length}`;
  }

  // ============================================
  // RESET
  // ============================================
  
  window.resetMechanic = function() {
    mechanicCompleted = false;
    mechanicStarted = false;
    
    cleanupScrollBlocker();
    
    const animationWrapper = document.querySelector('.animation-wrapper');
    if (animationWrapper) {
      animationWrapper.style.display = '';
    }
    
    if (contentBefore) {
      contentBefore.style.display = '';
    }
    
    if (cardDescriptionText) {
      cardDescriptionText.style.opacity = '0';
      cardDescriptionText.style.visibility = 'hidden';
    }
    
    gsap.set(tinderBlock, {
      y: 0,
      opacity: 1,
      height: "min(548px, 60vh)",
      width: "min(926px, 95vw)"
    });
    
    cardContainer.style.display = '';
    
    const buttonsContainer = document.querySelector('.tinder-buttons');
    if (buttonsContainer) buttonsContainer.style.display = 'none';
    
    questionCounter.style.display = '';
    dynamicText.style.display = '';
    successBlock.style.display = 'none';
    loadingSpinner.style.display = '';
    loadingSpinner.style.opacity = '1';
    loadingText.style.display = '';
    loadingText.style.opacity = '1';
    successCheck.style.display = 'none';
    
    ScrollTrigger.refresh();
    loadCards();
  };

  // ============================================
  // S2S INIT
  // ============================================
  
  window.addEventListener('load', function() {
    // const s2sContainer = document.querySelector('.cs-s2s-container');
    
    // if (s2sContainer && typeof CoreSmartS2S !== 'undefined') {
    //   CoreSmartS2S.init({
    //     linkToOpen: "https://inpool.ru/",
    //     linkToShow: "inpool.ru",
    //     previewImage: "./imgs/preview.png",
    //     previewImageMob: "./imgs/previewMob.png",
    //     minScrollPercent: 100
    //   });
    // }
  });

  // ============================================
  // START
  // ============================================
  
  loadData();

})();