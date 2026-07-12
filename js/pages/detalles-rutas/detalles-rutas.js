"use strict";

(function () {
  const carouselQuery = window.matchMedia("(max-width: 991.98px)");
  const tracks = document.querySelectorAll(
    ".atractivos-ruta .container > .row, .recomendaciones-detalle .container > .row, .actividades-destino .col-12.col-lg-7 > .row"
  );

  tracks.forEach(function (track) {
    const slides = Array.from(track.children);
    if (slides.length < 2) return;

    let activeSlide = 0;
    let startX = 0;
    let startY = 0;

    const dots = document.createElement("div");
    dots.className = "detalle-slider-dots";
    dots.setAttribute("aria-label", "Selector de tarjetas");

    slides.forEach(function (_slide, index) {
      const dot = document.createElement("button");
      dot.className = "detalle-slider-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Ver tarjeta ${index + 1}`);
      dot.addEventListener("click", function () {
        setActiveSlide(index);
      });
      dots.appendChild(dot);
    });

    track.insertAdjacentElement("afterend", dots);
    const dotButtons = Array.from(dots.children);

    const setActiveSlide = function (index) {
      activeSlide = (index + slides.length) % slides.length;
      track.style.setProperty("--detalle-slide", activeSlide);

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === activeSlide);
      });

      dotButtons.forEach(function (dot, dotIndex) {
        const isActive = dotIndex === activeSlide;
        dot.classList.toggle("is-active", isActive);
        if (isActive) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    };

    const handleSwipe = function (endX, endY) {
      if (!carouselQuery.matches) return;

      const distanceX = endX - startX;
      const distanceY = endY - startY;

      if (Math.abs(distanceX) < 45 || Math.abs(distanceX) < Math.abs(distanceY)) return;

      setActiveSlide(activeSlide + (distanceX < 0 ? 1 : -1));
    };

    track.addEventListener("touchstart", function (event) {
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    }, { passive: true });

    track.addEventListener("touchend", function (event) {
      const touch = event.changedTouches[0];
      handleSwipe(touch.clientX, touch.clientY);
    });

    window.addEventListener("resize", function () {
      setActiveSlide(activeSlide);
    });
    setActiveSlide(activeSlide);
  });
})();
