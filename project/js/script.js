// ============================================
// CORESMART NATIVE 
// ============================================

(function() {
  'use strict';

  // ============================================
  // GLOBAL PROGRESS BAR
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

  window.addEventListener("scroll", updateProgress, {
    passive: true
  });

  // ============================================
  // 1. TINDER MECHANIC
  // ============================================
  function initTinder() {
    const tinderBlock = document.querySelector('.tinder-window');
    if (!tinderBlock) return;

    const stepTexts = [
      'Мои клиенты чаще покупают...',
      'Мои клиенты чаще покупают...',
      'Какие клиенты вам подходят?'
    ];

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
          if (touchStartY < touch.clientY && window.scrollY <= minScrollY) {
            e.preventDefault();
          }
        }
      };
      window.addEventListener('scroll', scrollBlocker, {
        passive: false
      });
      window.addEventListener('touchstart', touchStart, {
        passive: true
      });
      window.addEventListener('touchmove', touchBlocker, {
        passive: false
      });

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

    async function loadData() {
      try {
        const response = await fetch('./data.json');
        cardData = await response.json();
        initScrollAnimation();
        loadCards();
      } catch (error) {
        console.warn('Data.json not found, using fallback:', error);
        cardData = [{
          "name": "Дорогие товары(премиум)",
          "image": "imgs/1_1.png",
          "correct": true,
          "type": "type-1",
          "description": "Большинство1 компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов."
        }, {
          "name": "Новинки и эксперементы",
          "image": "imgs/2_1.png",
          "correct": true,
          "type": "type-1",
          "description": "Большинство2 компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов."
        }, {
          "name": "Товары по акции или скидке",
          "image": "imgs/3_1.png",
          "correct": true,
          "type": "type-1",
          "description": "Большинство3 компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов."
        }];
        initScrollAnimation();
        loadCards();
      }
    }

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

    function updateDescriptionText(cardData) {
      if (!cardDescriptionText) return;
      gsap.to(cardDescriptionText, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          cardDescriptionText.textContent = cardData?.description || 'Большинство компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов.';
          gsap.to(cardDescriptionText, {
            opacity: 1,
            duration: 0.3
          });
        }
      });
    }

    function playExitAnimation() {
      const exitTl = gsap.timeline({
        onComplete: () => {
          mechanicCompleted = true;
          if (mainScrollTrigger) mainScrollTrigger.kill();
          const animationWrapper = document.querySelector('.animation-wrapper');
          if (animationWrapper) animationWrapper.style.display = 'none';
          if (contentBefore) contentBefore.style.display = 'none';
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
            setTimeout(() => {
              contentAfter.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
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
            <button class="tinder-card-btn tinder-card-btn-nope" data-action="nope"><img src="./imgs/nope.png" alt="Nope"></button>
            <button class="tinder-card-btn tinder-card-btn-like" data-action="like"><img src="./imgs/like.png" alt="Like"></button>
          </div>
        </div>
      `;
      const nopeBtn = card.querySelector('[data-action="nope"]');
      const likeBtn = card.querySelector('[data-action="like"]');
      nopeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isAnimating && mechanicStarted) handleAnswer(false);
      });
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isAnimating && mechanicStarted) handleAnswer(true);
      });
      return card;
    }

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

      const currentCardData = currentData[currentData.length - cards.length];
      updateDescriptionText(currentCardData);

      Array.from(cards).reverse().forEach((card, idx) => {
        card.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease';
        if (idx === 0) {
          card.style.transform = 'translateX(0) translateY(60px) scale(1.05) rotate(0deg)';
          card.style.zIndex = 1000;
          card.style.opacity = '1';
        } else if (idx === 1) {
          card.style.transform = 'translateX(-170px) translateY(30px) scale(0.85)';
          card.style.zIndex = 999;
          card.style.opacity = '1';
        } else if (idx === 2) {
          card.style.transform = 'translateX(170px) translateY(30px) scale(0.85)';
          card.style.zIndex = 998;
          card.style.opacity = '1';
        } else {
          card.style.transform = 'translateX(0) translateY(30px) scale(0.8)';
          card.style.opacity = '0';
          card.style.zIndex = 900 - idx;
        }
      });
      setupCardListeners(currentCard);
    }

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
      card.addEventListener('touchstart', onDragStart, {
        passive: true
      });
      card.addEventListener('touchmove', onDragMove, {
        passive: false
      });
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
      if (!e.type.includes('mouse') && e.cancelable) e.preventDefault();
      currentX = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - startX;
      if (!rAF_ID) rAF_ID = requestAnimationFrame(updateCardPosition);
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
      results.push({
        type: currentCard.dataset.type,
        answer: isLike
      });
      setTimeout(() => {
        const parent = currentCard.parentNode;
        if (parent.contains(currentCard)) parent.removeChild(currentCard);
        isAnimating = false;
        showNextCard();
      }, 400);
    }

    function finishMechanic() {
      cardContainer.style.display = 'none';
      const buttonsContainer = document.querySelector('.tinder-buttons');
      if (buttonsContainer) buttonsContainer.style.display = 'none';
      questionCounter.style.display = 'none';
      dynamicText.style.display = 'none';
      if (cardDescriptionText) gsap.to(cardDescriptionText, {
        opacity: 0,
        duration: 0.3
      });

      successBlock.style.display = 'block';
      determineWinner();

      setTimeout(() => {
        gsap.to(loadingSpinner, {
          opacity: 0,
          duration: 0.3
        });
        gsap.to(loadingText, {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            loadingSpinner.style.display = 'none';
            loadingText.style.display = 'none';
            successCheck.style.display = 'block';
            gsap.fromTo("#whitePulse", {
              opacity: 0
            }, {
              opacity: 0.6,
              duration: 0.25,
              yoyo: true,
              repeat: 1,
              ease: "power1.inOut"
            });
            gsap.fromTo(successCheck, {
              scale: 0.5,
              opacity: 0
            }, {
              scale: 1,
              opacity: 1,
              duration: 0.5,
              ease: 'back.out(1.7)'
            });
            setTimeout(() => {
              playExitAnimation();
            }, 1200);
          }
        });
      }, 2000);
    }

    function determineWinner() {
      const typeCounts = {
        'type-1': 0,
        'type-2': 0,
        'type-3': 0
      };
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
      console.log('Механика завершена! Выбран тип:', maxType);
      return maxType;
    }

    function updateCounter() {
      const answered = currentData.length - document.querySelectorAll('.tinder-card').length;
      questionCounter.textContent = `${answered}/${currentData.length}`;
    }

    window.resetMechanic = function() {
      mechanicCompleted = false;
      mechanicStarted = false;
      cleanupScrollBlocker();
      const animationWrapper = document.querySelector('.animation-wrapper');
      if (animationWrapper) animationWrapper.style.display = '';
      if (contentBefore) contentBefore.style.display = '';
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

    loadData();
  }


  // ============================================
  // 2. QUIZ MECHANIC
  // ============================================
  function initQuiz() {
    const quizBlock = document.querySelector('.quiz-window');
    if (!quizBlock) return;

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
    let userAnswers = {};

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
      if (!mechanicCompleted) window.scrollTo(0, scrollY);
      originalScrollBehavior = null;
    }

    function setupScrollBlocker() {
      if (!contentAfter) return;
      minScrollY = contentAfter.offsetTop - 50;
      if (scrollBlocker) cleanupScrollBlocker();
      scrollBlocker = function(e) {
        if (window.scrollY < minScrollY) window.scrollTo(0, minScrollY);
      };
      const touchStart = function(e) {
        touchStartY = e.touches[0].clientY;
      };
      const touchBlocker = function(e) {
        if (window.scrollY <= minScrollY) {
          const touch = e.touches[0];
          if (touchStartY < touch.clientY && window.scrollY <= minScrollY) e.preventDefault();
        }
      };
      window.addEventListener('scroll', scrollBlocker, {
        passive: false
      });
      window.addEventListener('touchstart', touchStart, {
        passive: true
      });
      window.addEventListener('touchmove', touchBlocker, {
        passive: false
      });
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

    function updateDescription(num) {
      if (!quizDescription || !quizActive) return;
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

    function showQuestion(num) {
      currentQuestion = num;
      allQuestionScreens.forEach(screen => {
        screen.style.display = 'none';
      });
      const target = document.getElementById('quizQuestion' + num);
      if (target) {
        target.style.display = 'flex';
        gsap.fromTo(target, {
          opacity: 0
        }, {
          opacity: 1,
          duration: 0.3
        });
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
        if (userAnswers[qKey].includes(btn.dataset.answer)) btn.classList.add('selected');
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
        if (userAnswers[qKey].includes(card.dataset.answer)) card.classList.add('selected');
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

    function playExitAnimation() {
      const exitTl = gsap.timeline({
        onComplete: () => {
          mechanicCompleted = true;
          if (mainScrollTrigger) mainScrollTrigger.kill();
          const animationWrapper = document.querySelector('.animation-wrapper');
          if (animationWrapper) animationWrapper.style.display = 'none';
          if (contentBefore) contentBefore.style.display = 'none';
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
            setTimeout(() => {
              contentAfter.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
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

    function finishMechanic() {
      hideDescription();
      successBlock.style.display = 'block';
      setTimeout(() => {
        gsap.to(loadingSpinner, {
          opacity: 0,
          duration: 0.3
        });
        gsap.to(loadingText, {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            loadingSpinner.style.display = 'none';
            loadingText.style.display = 'none';
            successCheck.style.display = 'block';
            gsap.fromTo("#whitePulse", {
              opacity: 0
            }, {
              opacity: 0.6,
              duration: 0.25,
              yoyo: true,
              repeat: 1,
              ease: "power1.inOut"
            });
            gsap.fromTo(successCheck, {
              scale: 0.5,
              opacity: 0
            }, {
              scale: 1,
              opacity: 1,
              duration: 0.5,
              ease: 'back.out(1.7)'
            });
            setTimeout(() => {
              playExitAnimation();
            }, 1200);
          }
        });
      }, 2000);
    }

    if (quizStartBtn) quizStartBtn.addEventListener('click', handleStartClick);

    window.resetMechanic = function() {
      mechanicCompleted = false;
      mechanicStarted = false;
      quizActive = false;
      currentQuestion = 1;
      userAnswers = {};
      cleanupScrollBlocker();
      const animationWrapper = document.querySelector('.animation-wrapper');
      if (animationWrapper) animationWrapper.style.display = '';
      if (contentBefore) contentBefore.style.display = '';
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
      if (quizDescription) quizDescription.textContent = 'Большинство1 компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов. Эти показатели важны, но они описывают только начало';
      successBlock.style.display = 'none';
      loadingSpinner.style.display = '';
      loadingSpinner.style.opacity = '1';
      loadingText.style.display = '';
      loadingText.style.opacity = '1';
      successCheck.style.display = 'none';
      document.body.classList.remove('quiz-active');
      ScrollTrigger.refresh();
    };

    hideDescription();
    initScrollAnimation();
  }


  // ============================================
  // 3. RANDOMIZER MECHANIC
  // ============================================
  function initRandomizer() {
    const randomizerBlock = document.querySelector('.randomizer-window');
    if (!randomizerBlock) return;

    const CONTENT_MAP = {
      park: {
        title: 'Топ-10 ЖК возле парков:',
        text: `<p>Жить возле зеленого парка или набережной, в экологически чистой обстановке, иметь возможность совершать утренние и вечерние пробежки рядом с домом, ежедневно гулять с детьми на свежем воздухе — это мечта каждого жителя мегаполиса. Экологичность стала модным трендом и девелоперы стремятся удовлетворить высокие требования клиентов с достатком. В сегодняшней Москве имеется достаточный выбор элитного жилья с необходимыми характеристиками.</p><p>№1 ЖК «Твид Парк». Расположен непосредственно на территории старинного парка Покровское-Стрешнево, на северо-западе Москвы, в 15 минутах от центра столицы. Малоэтажные кирпичные дома класса де-люкс в респектабельном английским стиле великолепно сочетаются с окружающим ландшафтом.</p>`
      },
      studio: {
        title: 'Студии в центре Москвы: Полный гид по выбору и покупке',
        text: `<p>Центр Москвы — это престиж, инфраструктура и жизнь в самом сердце столицы. Студии здесь пользуются особым спросом: у студентов, молодых специалистов, инвесторов и тех, кто ценит время и комфорт. Разбираемся, где искать, сколько стоит и на что обратить внимание.</p><p>Что такое студия и почему она популярна? Студия — это жилое помещение, где кухня и комната объединены в одно пространство, а отдельным помещением является только санузел.</p><p><strong>Тверской район</strong></p><ul class="cs-list"><li>Средняя цена: 15–30 млн ₽</li><li>Метро: Тверская, Пушкинская, Чеховская</li><li>Плюсы: Престиж, инфраструктура, история</li><li>Минусы: Высокие цены, шумные улицы</li></ul>`
      },
      default: {
        title: 'Как выбрать 1-2 комнатную квартиру для семьи',
        text: `<p>Семейная ипотека — одна из самых выгодных программ на российском рынке недвижимости. Ставки от 4,5% до 6% делают покупку квартиры доступной для семей с детьми. Разбираемся, как правильно подобрать жильё и не ошибиться с выбором.</p>`
      }
    };

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

    const SPINNER_HTML = `
      <div class="loading-spinner" style="position: relative; width: 50px; height: 50px;">
        ${Array.from({
          length: 16
        }, (_, i) => `<div class="dot" style="--i: ${i}; position: absolute; top: 22px; left: 22px; width: 6px; height: 6px; background: #000; border-radius: 50%; transform-origin: 3px 3px; transform: rotate(calc(22.5deg * ${i})) translate(0, -22px); animation: fadeDots 1.2s linear infinite; animation-delay: calc(-1.2s + (1.2s / 16 * ${i}));"></div>`).join('')}
      </div>
    `;

    let resultWrapper = null;
    let loadingWrapper = null;
    let overlaySpinner = null;

    function ensureResultWrapper() {
      if (!resultWrapper) {
        resultWrapper = document.createElement('div');
        resultWrapper.className = 'randomizer-result-wrapper';
        resultWrapper.style.cssText = `max-width: 720px; width: 100%; margin: 30px auto 0; padding: 0 20px; box-sizing: border-box; position: relative; z-index: 5; opacity: 0;`;
        if (animationWrapper && randomizerBlock) animationWrapper.insertBefore(resultWrapper, randomizerBlock.nextSibling);
      }
      return resultWrapper;
    }

    function ensureLoadingWrapper() {
      if (!loadingWrapper) {
        loadingWrapper = document.createElement('div');
        loadingWrapper.className = 'randomizer-loading-wrapper';
        loadingWrapper.style.cssText = `display: none; flex-direction: column; align-items: center; justify-content: center; width: 100%; margin-top: 20px; position: relative; z-index: 5;`;
        loadingWrapper.innerHTML = SPINNER_HTML;
        if (animationWrapper && randomizerBlock) animationWrapper.insertBefore(loadingWrapper, randomizerBlock.nextSibling);
      }
      return loadingWrapper;
    }

    function showLoadingExternal() {
      const loader = ensureLoadingWrapper();
      loader.style.display = 'flex';
      gsap.fromTo(loader, {
        opacity: 0,
        y: 15
      }, {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: "power2.out"
      });
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

    function showResubmitLoadingOnResult() {
      const wrapper = ensureResultWrapper();
      if (!overlaySpinner) {
        overlaySpinner = document.createElement('div');
        overlaySpinner.className = 'resubmit-spinner-overlay';
        overlaySpinner.innerHTML = SPINNER_HTML;
        overlaySpinner.style.cssText = `display: flex; align-items: center; justify-content: center; z-index: 10; pointer-events: none; display: none;`;
      }
      if (!overlaySpinner.parentNode) wrapper.parentNode.insertBefore(overlaySpinner, wrapper.nextSibling);
      overlaySpinner.style.display = 'flex';
      positionOverlayOnWrapper();
      gsap.fromTo(overlaySpinner, {
        opacity: 0
      }, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out"
      });
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
          if (overlaySpinner.parentNode) overlaySpinner.parentNode.removeChild(overlaySpinner);
          if (callback) callback();
        }
      });
    }

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

    function setupScrollBlockerWithValue(scrollLimit) {
      cleanupScrollBlocker();
      minScrollY = scrollLimit;
      scrollBlocker = function(e) {
        if (window.scrollY < minScrollY) window.scrollTo(0, minScrollY);
      };
      const touchStart = function(e) {
        touchStartY = e.touches[0].clientY;
      };
      const touchBlocker = function(e) {
        if (window.scrollY <= minScrollY) {
          const touch = e.touches[0];
          if (touchStartY < touch.clientY) e.preventDefault();
        }
      };
      window.addEventListener('scroll', scrollBlocker, {
        passive: false
      });
      window.addEventListener('touchstart', touchStart, {
        passive: true
      });
      window.addEventListener('touchmove', touchBlocker, {
        passive: false
      });
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
            if (!selectedFilters.includes(filterValue)) selectedFilters.push(filterValue);
          } else {
            selectedFilters = selectedFilters.filter(f => f !== filterValue);
          }
        };
      });
    }

    function getContent() {
      if (selectedFilters.includes('studio')) return 'studio';
      if (selectedFilters.includes('park')) return 'park';
      return 'default';
    }

    function collapseWindowForCompletion() {
      isCollapsed = true;
      if (mainScrollTrigger) {
        mainScrollTrigger.kill();
        mainScrollTrigger = null;
      }
      if (contentBefore) contentBefore.style.display = 'none';
      lastContentKey = getContent();
      const wrapper = ensureResultWrapper();
      updateExternalResult(wrapper);
      const tl = gsap.timeline({
        onComplete: () => {
          document.body.classList.remove('randomizer-active');
          if (animationWrapper) animationWrapper.style.display = 'none';
          if (contentAfter && randomizerBlock) contentAfter.insertBefore(randomizerBlock, contentAfter.firstChild);
          if (contentAfter && wrapper) contentAfter.insertBefore(wrapper, contentAfter.children[1] || null);
          if (loadingWrapper && contentAfter) contentAfter.insertBefore(loadingWrapper, contentAfter.children[2] || null);
          if (contentAfter) {
            contentAfter.style.opacity = '1';
            contentAfter.style.visibility = 'visible';
          }
          enableScroll();
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
      }, "-=0.1").to(randomizerBlock, {
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

    function updateExternalResult(wrapper) {
      const content = CONTENT_MAP[lastContentKey] || CONTENT_MAP.default;
      wrapper.innerHTML = `<h2 class="randomizer-result-title" style="font-family: 'Manrope', sans-serif; font-weight: 400; font-size: 32px; line-height: 120%; color: #000; margin-bottom: 16px;">${content.title}</h2><div class="randomizer-result-text" style="font-family: 'Manrope', sans-serif; font-weight: 300; font-size: 18px; line-height: 1.6; color: #333;">${content.text}</div>`;
    }

    function showResultWithLoading() {
      showLoadingExternal();
      setTimeout(() => {
        hideLoadingExternal(() => {
          collapseWindowForCompletion();
        });
      }, 2000);
    }

    function handleResubmit() {
      if (isResubmitting || selectedFilters.length === 0) return;
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

    function handleSubmit() {
      if (!mechanicStarted || selectedFilters.length === 0 || resultShown) return;
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

    if (randomizerSubmitBtn) randomizerSubmitBtn.addEventListener('click', handleSubmit);
    window.addEventListener('resize', () => {
      if (overlaySpinner && overlaySpinner.style.display === 'flex') positionOverlayOnWrapper();
    });

    window.resetMechanic = function() {
      mechanicCompleted = false;
      mechanicStarted = false;
      selectedFilters = [];
      resultShown = false;
      isCollapsed = false;
      isResubmitting = false;
      lastContentKey = 'default';
      cleanupScrollBlocker();
      const s2sContainer = document.querySelector('.cs-s2s-container');
      if (s2sContainer) s2sContainer.remove();
      if (animationWrapper && randomizerBlock) animationWrapper.appendChild(randomizerBlock);
      if (animationWrapper) animationWrapper.style.display = '';
      if (contentBefore) contentBefore.style.display = '';
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
      if (randomizerTop) gsap.set(randomizerTop, {
        y: 0,
        opacity: 1,
        clearProps: "all"
      });
      if (randomizerCtaText) gsap.set(randomizerCtaText, {
        y: 0,
        opacity: 1,
        clearProps: "all"
      });
      if (randomizerFiltersWrapper) gsap.set(randomizerFiltersWrapper, {
        opacity: 1,
        y: 0,
        clearProps: "all"
      });
      if (randomizerSubmitBtn) gsap.set(randomizerSubmitBtn, {
        opacity: 1,
        clearProps: "all"
      });
      document.querySelectorAll('.randomizer-filter-btn').forEach(btn => btn.classList.remove('active'));
      randomizerLoading.classList.remove('active');
      gsap.set(randomizerLoading, {
        opacity: 0,
        y: 0,
        clearProps: "all"
      });
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

    initFilters();
    initScrollAnimation();
  }

  // ============================================
  // INITIALIZE ALL MECHANICS
  // ============================================
  // Скрипт сам найдет нужные классы и запустит требуемую механику.
  initTinder();
  initQuiz();
  initRandomizer();

})();