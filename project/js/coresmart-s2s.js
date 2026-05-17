// CoreSmart Scroll-to-Site Engine (Inline / Seamless)

(function(){

  "use strict";

  const DEFAULTS = {
    linkToOpen: "",
    previewImage: "",
    previewImageMob: "",
    minVisiblePercent: 0.8, // % блока в viewport
    redirectDelay: 400
  }


  /* ============================
     UTILS
  ============================ */

  function createElement(html){
    const div = document.createElement("div")
    div.innerHTML = html.trim()
    return div.firstChild
  }

  function prefetch(url){
    const link = document.createElement("link")
    link.rel = "prefetch"
    link.href = url
    document.head.appendChild(link)
  }


  /* ============================
     MAIN CLASS
  ============================ */

  class CoreSmartS2S {

    constructor(options){

      this.options = Object.assign({}, DEFAULTS, options)

      this.state = {
        redirected: false
      }

      this.init()
    }


    /* ============================
       INIT
    ============================ */

    init(){

      this.createDOM()
      this.prefetchTarget()
      this.initObserver()
      this.initScrollAnimation()
      this.initSwipe()

    }


    /* ============================
       DOM
    ============================ */

    createDOM(){

      const html = `
        <div class="cs-s2s-container">

          <div class="cs-s2s-preview">
            <div class="cs-s2s-card">
            <picture class="cs-s2s-image">
              <source srcset="${this.options.previewImage}" media="(min-width: 1024px)">
              <source srcset="${this.options.previewImageMob}" media="(max-width: 767px)">
              <img src="${this.options.previewImage}" alt="Responsive image">
            </picture>
            </div>
          </div>

        </div>
      `

      this.el = createElement(html)
      document.body.appendChild(this.el)

      this.preview = this.el.querySelector(".cs-s2s-preview")

    }


    /* ============================
       PREFETCH
    ============================ */

    prefetchTarget(){
      if(this.options.linkToOpen){
        prefetch(this.options.linkToOpen)
      }
    }


    /* ============================
       INTERSECTION OBSERVER
    ============================ */

    initObserver(){

      const observer = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

          if(entry.isIntersecting){

            // когда блок хорошо виден — редирект
            if(entry.intersectionRatio > this.options.minVisiblePercent){

              this.redirect()

            }

          }

        })

      }, {
        threshold: [0.3, 0.6, 0.9]
      })

      observer.observe(this.el)

    }


    /* ============================
       SCROLL ANIMATION (NATIVE)
    ============================ */

    initScrollAnimation(){

      window.addEventListener("scroll", () => {

        if(!this.preview) return
        if(this.state.redirected) return

        const rect = this.el.getBoundingClientRect()
        const windowH = window.innerHeight

        // прогресс появления блока
        const progress = 1 - Math.max(0, rect.top / windowH)

        const clamped = Math.min(Math.max(progress, 0), 1)

        // scale от 0.9 → 1
        const scale = 0.6 + clamped * 0.4

        // лёгкий parallax
        const translateY = (1 - clamped) * 40

        this.preview.style.transform =
          `scale(${scale}) translateY(${translateY}px)`

      })

    }


    /* ============================
       REDIRECT (SEAMLESS)
    ============================ */

    redirect(){

      if(this.state.redirected) return
      this.state.redirected = true

      // блокируем скролл
      // document.body.style.overflow = "hidden"

      // // делаем "втягивание" страницы
      document.body.style.transition = "transform .5s ease, opacity .5s ease .5s"
      // document.body.style.transform = "scale(1.02)"
      this.preview.style.transition = "transform .7s ease, opacity .5s ease .5s"
      this.preview.style.transform =
          `scale(1) translateY(-20vh)`
      document.body.style.opacity = "0"

      // быстрый переход
      setTimeout(() => {
        window.location.href = this.options.linkToOpen
      }, this.options.redirectDelay)

    }


    /* ============================
       MOBILE SWIPE
    ============================ */

    initSwipe(){

      let startY = 0
      let currentY = 0
      let isDragging = false

      const el = this.preview
      if(!el) return

      el.addEventListener("touchstart", (e) => {
        startY = e.touches[0].clientY
        isDragging = true
      })

      el.addEventListener("touchmove", (e) => {

        if(!isDragging) return

        currentY = e.touches[0].clientY
        const diff = currentY - startY

        if(diff < 0){
          el.style.transform = `translateY(${diff}px)`
        }

      }, { passive:false })


      el.addEventListener("touchend", () => {

        isDragging = false

        if(currentY - startY < -80){
          this.redirect()
        }

        el.style.transform = ""

      })

    }

  }


  /* ============================
     API
  ============================ */

  window.CoreSmartS2S = {
    init: function(options){
      return new CoreSmartS2S(options)
    }
  }

})();