if (window.CoreSmartS2S) {
  window.CoreSmartS2S.init({
    linkToOpen: 'https://Brand.nativepage.ru',
    linkToShow: 'Brand.nativepage.ru',
    previewImage: 'imgs/car.png',
    previewImageMob: 'imgs/car.png',
    minVisiblePercent: 0.8,
    redirectDelay: 400
  });
}

// Swiper — свободный скролл для карточек статей
document.addEventListener('DOMContentLoaded', function() {
  new Swiper('.recommend__grid', {
    slidesPerView: 'auto',
    spaceBetween: 12,
    freeMode: true,
    mousewheel: { forceToAxis: true },
    breakpoints: {
      768: {
        slidesPerView: 2,
        spaceBetween: 20,
        freeMode: false,
        mousewheel: false
      }
    }
  });
});