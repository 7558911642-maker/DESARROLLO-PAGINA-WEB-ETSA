"use strict";

(() => {
  const SELECTORES = {
    dotsSlider: "[data-slider-dots]",
    dot: ".contacto-slider__dot",
    tarjetaMapa: ".sucursal-card--mapa",
    enlaceUbicacion: ".sucursal-contacto--ubicacion",
    interactivo: "a, button, input, select, textarea, [role='button']"
  };

  const abrirEnNuevaPestana = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const inicializarSlidersContacto = () => {
    const gruposDots = document.querySelectorAll(SELECTORES.dotsSlider);

    gruposDots.forEach((grupo) => {
      const slider = document.getElementById(grupo.dataset.sliderDots);
      const dots = Array.from(grupo.querySelectorAll(SELECTORES.dot));

      if (!slider || !dots.length) return;

      const obtenerItems = () => Array.from(slider.children).filter((item) => !item.hidden);
      let esperandoAnimacion = false;

      const activarDot = (indiceActivo) => {
        dots.forEach((dot, indiceDot) => {
          const activo = indiceDot === indiceActivo;
          dot.classList.toggle("contacto-slider__dot--activo", activo);
          dot.toggleAttribute("aria-current", activo);
        });
      };

      const obtenerIndiceActual = () => {
        const items = obtenerItems();
        const centroSlider = slider.scrollLeft + slider.clientWidth / 2;

        return items.reduce((indiceCercano, item, indice) => {
          const centroItem = item.offsetLeft + item.clientWidth / 2;
          const itemCercano = items[indiceCercano];
          const centroItemCercano = itemCercano.offsetLeft + itemCercano.clientWidth / 2;

          return Math.abs(centroItem - centroSlider) < Math.abs(centroItemCercano - centroSlider)
            ? indice
            : indiceCercano;
        }, 0);
      };

      dots.forEach((dot, indice) => {
        dot.addEventListener("click", () => {
          const item = obtenerItems()[indice];
          if (!item) return;

          item.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "start"
          });
          activarDot(indice);
        });
      });

      slider.addEventListener("scroll", () => {
        if (esperandoAnimacion) return;

        window.requestAnimationFrame(() => {
          activarDot(obtenerIndiceActual());
          esperandoAnimacion = false;
        });

        esperandoAnimacion = true;
      }, { passive: true });
    });
  };

  const inicializarTarjetasDeAgencias = () => {
    const tarjetas = document.querySelectorAll(SELECTORES.tarjetaMapa);

    tarjetas.forEach((tarjeta) => {
      const enlaceUbicacion = tarjeta.querySelector(SELECTORES.enlaceUbicacion);
      if (!enlaceUbicacion) return;

      tarjeta.addEventListener("click", (evento) => {
        const objetivo = evento.target instanceof Element ? evento.target : evento.target.parentElement;
        if (objetivo?.closest(SELECTORES.interactivo)) return;

        abrirEnNuevaPestana(enlaceUbicacion.href);
      });

      tarjeta.addEventListener("keydown", (evento) => {
        const esActivacion = evento.key === "Enter" || evento.key === " ";
        if (!esActivacion || evento.target !== tarjeta) return;

        evento.preventDefault();
        abrirEnNuevaPestana(enlaceUbicacion.href);
      });
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    inicializarSlidersContacto();
    inicializarTarjetasDeAgencias();
  });
})();
