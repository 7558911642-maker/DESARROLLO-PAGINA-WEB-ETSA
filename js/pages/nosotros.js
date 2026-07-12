"use strict";

(function () {
  const dotGroups = document.querySelectorAll("[data-slider-dots]");

  dotGroups.forEach(function (group) {
    const slider = document.getElementById(group.dataset.sliderDots);
    const dots = Array.from(group.querySelectorAll(".nosotros-slider-dot"));

    if (!slider || !dots.length) return;

    const getItems = function () {
      return Array.from(slider.children).filter(function (item) {
        return !item.hidden;
      });
    };
    let ticking = false;

    const setActiveDot = function (index) {
      dots.forEach(function (dot, dotIndex) {
        const active = dotIndex === index;
        dot.classList.toggle("nosotros-slider-dot--activo", active);
        dot.toggleAttribute("aria-current", active);
      });
    };

    const getCurrentIndex = function () {
      const items = getItems();
      const sliderCenter = slider.scrollLeft + slider.clientWidth / 2;

      return items.reduce(function (closestIndex, item, index) {
        const itemCenter = item.offsetLeft + item.clientWidth / 2;
        const closestItem = items[closestIndex];
        const closestCenter = closestItem.offsetLeft + closestItem.clientWidth / 2;

        return Math.abs(itemCenter - sliderCenter) < Math.abs(closestCenter - sliderCenter)
          ? index
          : closestIndex;
      }, 0);
    };

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        const item = getItems()[index];
        if (!item) return;

        item.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "start"
        });
        setActiveDot(index);
      });
    });

    slider.addEventListener("scroll", function () {
      if (ticking) return;

      window.requestAnimationFrame(function () {
        setActiveDot(getCurrentIndex());
        ticking = false;
      });

      ticking = true;
    }, { passive: true });
  });
})();
