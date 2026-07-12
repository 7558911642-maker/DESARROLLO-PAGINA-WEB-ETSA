"use strict";

document.querySelectorAll("[data-terminos-carousel]").forEach(function (carousel) {
  const carouselName = carousel.dataset.terminosCarousel;
  const dots = document.querySelector(`[data-terminos-dots="${carouselName}"]`);
  const items = Array.from(carousel.children);

  if (!dots || items.length < 2) {
    return;
  }

  items.forEach(function (item, index) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "terminos-encomiendas-dot";
    dot.setAttribute("aria-label", `Ver tarjeta ${index + 1}`);
    dot.addEventListener("click", function () {
      carousel.scrollTo({
        left: item.offsetLeft,
        behavior: "smooth"
      });
    });
    dots.appendChild(dot);
  });

  const dotButtons = Array.from(dots.children);
  let ticking = false;

  const updateDots = function () {
    const currentIndex = items.reduce(function (activeIndex, item, index) {
      const activeDistance = Math.abs(items[activeIndex].offsetLeft - carousel.scrollLeft);
      const itemDistance = Math.abs(item.offsetLeft - carousel.scrollLeft);
      return itemDistance < activeDistance ? index : activeIndex;
    }, 0);

    dotButtons.forEach(function (dot, index) {
      const isActive = index === currentIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
    ticking = false;
  };

  carousel.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(updateDots);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener("resize", updateDots);
  updateDots();
});
