// CoreSmart Scroll-to-Site Engine (Inline / Seamless)

(function(){

  "use strict";

  const DEFAULTS = {
    linkToOpen: "",
    linkToShow: "",
    previewImage: "",
    previewImageMob: "",
    minVisiblePercent: 0.8,
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

  const isMobile = window.innerWidth <= 767;
  const imgSrc = isMobile && this.options.previewImageMob 
    ? this.options.previewImageMob 
    : this.options.previewImage;

  const html = `
      <div class="cs-s2s-container">
        <div class="cs-s2s-preview">
          <div class="cs-s2s-card">
            <div class="cs-s2s-browser">
              <div class="cs-s2s-browser-top">
                <div class="cs-s2s-browser-bar">
                  <svg class="cs-s2s-lock" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="2.5" y="5" width="7" height="5.5" rx="1" fill="#999"/>
                    <path d="M4 5V3.5C4 2.4 4.9 1.5 6 1.5C7.1 1.5 8 2.4 8 3.5V5" stroke="#999" stroke-width="1.2" fill="none"/>
                  </svg>
                  <span class="cs-s2s-url-text">${this.options.linkToShow || 'example.com'}</span>
                  
                  <svg class="cs-s2s-reload" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M20 12A8 8 0 1 1 12 4" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 1L12 4L9 7" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  
                </div>
              </div>
              <div class="cs-s2s-image">
                <img src="${imgSrc}" alt="Preview" loading="lazy">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  this.el = createElement(html);
  document.body.appendChild(this.el);
  this.preview = this.el.querySelector(".cs-s2s-preview");
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

        const progress = 1 - Math.max(0, rect.top / windowH)

        const clamped = Math.min(Math.max(progress, 0), 1)

        const scale = 0.6 + clamped * 0.4

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

      document.body.style.transition = "transform .5s ease, opacity .5s ease .5s"
      this.preview.style.transition = "transform .7s ease, opacity .5s ease .5s"
      this.preview.style.transform =
          `scale(1) translateY(-20vh)`
      document.body.style.opacity = "0"

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