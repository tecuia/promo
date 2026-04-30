// ============================================
// CORESMART NATIVE — QUIZ MECHANIC
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
  // STATE
  // ============================================

  let mechanicStarted = false;
  let mechanicCompleted = false;
  let quizActive = false;
  let mainScrollTrigger = null;
  let originalScrollBehavior = null;
  let scrollBlocker = null;
  let touchStartY = 0;
  let minScrollY = 0;
  let currentQuestion = 1;
  const totalQuestions = 5;
  
  // Ответы: { 'q1': ['0','2'], 'q2': ['1'] }
  let userAnswers = {};

  // ============================================
  // DOM ELEMENTS
  // ============================================

  const quizBlock = document.querySelector('.quiz-window');
  const quizContent = document.getElementById('quizContent');
  const quizStartBtn = document.getElementById('quizStartBtn');
  const quizDescription = document.getElementById('quizDescription');
  const allQuestionScreens = document.querySelectorAll('.quiz-question-screen');
  const successBlock = document.getElementById('successBlock');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const loadingText = document.getElementById('loadingText');
  const successCheck = document.getElementById('successCheck');
  const contentBefore = document.getElementById('contentBefore');
  const contentAfter = document.getElementById('contentAfter');

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
  // GSAP SCROLL ANIMATION
  // ============================================
  
  function initScrollAnimation() {
    gsap.registerPlugin(ScrollTrigger);
    
    gsap.set(quizBlock, {
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
    
    entryTl.to(quizBlock, {
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
          document.body.classList.add('quiz-active');
          disableScroll();
          
          entryTl.kill();
          
          gsap.set(quizBlock, {
            width: "min(1430px, 95vw)",
            height: "min(846px, 85vh)",
            borderRadius: "16px",
            clearProps: "transform"
          });
        }
      }
    });
  }

  // ============================================
  // SHOW/HIDE DESCRIPTION TEXT
  // ============================================
  
  function showDescription() {
    if (!quizDescription) return;
    quizActive = true;
    quizDescription.style.opacity = '1';
    quizDescription.style.visibility = 'visible';
  }
  
  function hideDescription() {
    if (!quizDescription) return;
    quizActive = false;
    quizDescription.style.opacity = '0';
    quizDescription.style.visibility = 'hidden';
  }

  // ============================================
  // DESCRIPTION TEXT (под кейсом)
  // ============================================
  
  function updateDescription(num) {
    if (!quizDescription) return;
    if (!quizActive) return;
    
    gsap.to(quizDescription, {
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        quizDescription.textContent = 'Большинство' + num + ' компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов. Эти показатели важны, но они описывают только начало';
        gsap.to(quizDescription, {
          opacity: 1,
          duration: 0.2
        });
      }
    });
  }

  // ============================================
  // NAVIGATION
  // ============================================

  function showQuestion(num) {
    currentQuestion = num;
    
    allQuestionScreens.forEach(screen => {
      screen.style.display = 'none';
    });
    
    const target = document.getElementById('quizQuestion' + num);
    if (target) {
      target.style.display = 'flex';
      gsap.fromTo(target, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      setupQuestionListeners(num);
      updateDescription(num);
    }
  }

  function goToNextQuestion() {
    if (currentQuestion < totalQuestions) {
      showQuestion(currentQuestion + 1);
    } else {
      const currentScreen = document.getElementById('quizQuestion' + currentQuestion);
      if (currentScreen) {
        gsap.to(currentScreen, {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            currentScreen.style.display = 'none';
            finishMechanic();
          }
        });
      } else {
        finishMechanic();
      }
    }
  }

  function goToPrevQuestion() {
    if (currentQuestion > 1) {
      showQuestion(currentQuestion - 1);
    }
  }

  // ============================================
  // BUTTON: START → QUESTION 1
  // ============================================
  
  function handleStartClick() {
    if (!mechanicStarted) return;
    
    showDescription();
    
    if (quizContent) {
      gsap.to(quizContent, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          quizContent.style.display = 'none';
          showQuestion(1);
        }
      });
    }
  }

  // ============================================
  // QUESTION LOGIC
  // ============================================
  
  function setupQuestionListeners(num) {
    const qKey = 'q' + num;
    if (!userAnswers[qKey]) userAnswers[qKey] = [];
    
    const answerBtns = document.querySelectorAll('#quizQuestion' + num + ' .quiz-answer-btn');
    
    answerBtns.forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
    });
    
    const freshBtns = document.querySelectorAll('#quizQuestion' + num + ' .quiz-answer-btn');
    freshBtns.forEach(btn => {
      if (userAnswers[qKey].includes(btn.dataset.answer)) {
        btn.classList.add('selected');
      }
      
      btn.addEventListener('click', function() {
        const answerVal = this.dataset.answer;
        const arr = userAnswers[qKey];
        
        if (this.classList.contains('selected')) {
          this.classList.remove('selected');
          const idx = arr.indexOf(answerVal);
          if (idx > -1) arr.splice(idx, 1);
        } else {
          this.classList.add('selected');
          if (!arr.includes(answerVal)) arr.push(answerVal);
        }
        
        updateNextButton(num);
      });
    });
    
    const photoCards = document.querySelectorAll('#quizQuestion' + num + ' .quiz-photo-card');
    
    photoCards.forEach(card => {
      const newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);
    });
    
    const freshPhotoCards = document.querySelectorAll('#quizQuestion' + num + ' .quiz-photo-card');
    freshPhotoCards.forEach(card => {
      if (userAnswers[qKey].includes(card.dataset.answer)) {
        card.classList.add('selected');
      }
      
      card.addEventListener('click', function() {
        const answerVal = this.dataset.answer;
        const arr = userAnswers[qKey];
        
        if (this.classList.contains('selected')) {
          this.classList.remove('selected');
          const idx = arr.indexOf(answerVal);
          if (idx > -1) arr.splice(idx, 1);
        } else {
          this.classList.add('selected');
          if (!arr.includes(answerVal)) arr.push(answerVal);
        }
        
        updateNextButton(num);
      });
    });
    
    updateNextButton(num);
    
    const backBtn = document.getElementById('quizNavBack' + num);
    if (backBtn) {
      const newBackBtn = backBtn.cloneNode(true);
      backBtn.parentNode.replaceChild(newBackBtn, backBtn);
      const freshBackBtn = document.getElementById('quizNavBack' + num);
      if (freshBackBtn) {
        freshBackBtn.addEventListener('click', goToPrevQuestion);
        freshBackBtn.disabled = (num === 1);
      }
    }
    
    const nextBtn = document.getElementById('quizNavNext' + num);
    if (nextBtn) {
      const newNextBtn = nextBtn.cloneNode(true);
      nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
      const freshNextBtn = document.getElementById('quizNavNext' + num);
      if (freshNextBtn) {
        freshNextBtn.addEventListener('click', goToNextQuestion);
      }
    }
  }

  function updateNextButton(num) {
    const nextBtn = document.getElementById('quizNavNext' + num);
    const qKey = 'q' + num;
    if (nextBtn && userAnswers[qKey]) {
      nextBtn.disabled = (userAnswers[qKey].length === 0);
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
        
        document.body.classList.remove('quiz-active');
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
        
        if (contentAfter) {
          setTimeout(() => {
            contentAfter.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }
    });

    exitTl.to(quizBlock, {
      height: "300px",
      duration: 0.8,
      ease: "power2.inOut"
    })
    .to(quizBlock, {
      y: "-120vh",
      opacity: 0,
      duration: 0.8,
      ease: "power2.in"
    }, "+=0.2");
  }

  // ============================================
  // MECHANIC COMPLETION
  // ============================================
  
  function finishMechanic() {
    hideDescription();
    
    successBlock.style.display = 'block';
    
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

  // ============================================
  // EVENT LISTENERS
  // ============================================
  
  if (quizStartBtn) {
    quizStartBtn.addEventListener('click', handleStartClick);
  }

  // ============================================
  // RESET
  // ============================================
  
  window.resetMechanic = function() {
    mechanicCompleted = false;
    mechanicStarted = false;
    quizActive = false;
    currentQuestion = 1;
    userAnswers = {};
    
    cleanupScrollBlocker();
    
    const animationWrapper = document.querySelector('.animation-wrapper');
    if (animationWrapper) {
      animationWrapper.style.display = '';
    }
    
    if (contentBefore) {
      contentBefore.style.display = '';
    }
    
    gsap.set(quizBlock, {
      y: 0,
      opacity: 1,
      height: "min(548px, 60vh)",
      width: "min(926px, 95vw)"
    });
    
    if (quizContent) {
      quizContent.style.display = '';
      quizContent.style.opacity = '1';
    }
    
    allQuestionScreens.forEach(s => {
      s.style.display = 'none';
      s.style.opacity = '0';
    });
    
    hideDescription();
    if (quizDescription) {
      quizDescription.textContent = 'Большинство1 компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов. Эти показатели важны, но они описывают только начало';
    }
    
    successBlock.style.display = 'none';
    loadingSpinner.style.display = '';
    loadingSpinner.style.opacity = '1';
    loadingText.style.display = '';
    loadingText.style.opacity = '1';
    successCheck.style.display = 'none';
    
    document.body.classList.remove('quiz-active');
    
    ScrollTrigger.refresh();
  };

  // ============================================
  // START
  // ============================================
  
  hideDescription();
  
  initScrollAnimation();

})();