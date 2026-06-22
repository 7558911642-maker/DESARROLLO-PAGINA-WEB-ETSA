(() => {
  const sliders = document.querySelectorAll("[data-info-slider]");
  const desktopQuery = window.matchMedia("(min-width: 992px)");

  sliders.forEach((slider) => {
    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;
    let hasMoved = false;

    const stopDragging = (event) => {
      if (!isDragging) {
        return;
      }

      isDragging = false;
      slider.classList.remove("is-dragging");

      if (event?.pointerId && slider.releasePointerCapture) {
        try {
          slider.releasePointerCapture(event.pointerId);
        } catch {
          /* Pointer capture may already be released by the browser. */
        }
      }
    };

    slider.addEventListener("pointerdown", (event) => {
      if (desktopQuery.matches || event.button !== 0) {
        return;
      }

      isDragging = true;
      hasMoved = false;
      startX = event.clientX;
      startScrollLeft = slider.scrollLeft;
      slider.classList.add("is-dragging");

      if (slider.setPointerCapture) {
        slider.setPointerCapture(event.pointerId);
      }
    });

    slider.addEventListener("pointermove", (event) => {
      if (!isDragging) {
        return;
      }

      const distance = event.clientX - startX;
      hasMoved = hasMoved || Math.abs(distance) > 5;
      slider.scrollLeft = startScrollLeft - distance;
      event.preventDefault();
    });

    slider.addEventListener("pointerup", stopDragging);
    slider.addEventListener("pointercancel", stopDragging);
    slider.addEventListener("pointerleave", stopDragging);

    slider.addEventListener(
      "click",
      (event) => {
        if (!hasMoved) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        hasMoved = false;
      },
      true
    );
  });
})();
