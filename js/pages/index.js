(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cabecera = document.querySelector(".site-header");
    const imagenHero = document.querySelector(".hero-img img");
    const secciones = document.querySelectorAll("main > section:not(.hero)");

    optimizarImagenes();
    mejorarCarruseles();
    formatearPreciosRutas();
    configurarAparicion(secciones, reducirMovimiento);

    const botonSubir = document.createElement("button");
    botonSubir.className = "etsa-back-top";
    botonSubir.type = "button";
    botonSubir.setAttribute("aria-label", "Volver al inicio de la página");
    botonSubir.innerHTML = '<i class="bi bi-arrow-up" aria-hidden="true"></i>';
    document.body.appendChild(botonSubir);

    botonSubir.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reducirMovimiento ? "auto" : "smooth" });
    });

    let desplazamientoPendiente = false;

    const actualizarDesplazamiento = () => {
      const desplazamiento = window.scrollY;
      cabecera?.classList.toggle("etsa-header-scrolled", desplazamiento > 24);
      botonSubir.classList.toggle("etsa-back-top--visible", desplazamiento > 520);

      if (!reducirMovimiento && imagenHero && window.innerWidth >= 992) {
        const movimiento = Math.min(desplazamiento * 0.035, 24);
        imagenHero.style.transform = `translate3d(0, ${movimiento}px, 0) scale(1.035)`;
      }

      desplazamientoPendiente = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (desplazamientoPendiente) {
          return;
        }

        desplazamientoPendiente = true;
        window.requestAnimationFrame(actualizarDesplazamiento);
      },
      { passive: true }
    );

    window.addEventListener(
      "resize",
      () => {
        if (imagenHero && (reducirMovimiento || window.innerWidth < 992)) {
          imagenHero.style.transform = "";
        }
      },
      { passive: true }
    );

    actualizarDesplazamiento();

    function optimizarImagenes() {
      document.querySelectorAll("main img").forEach((imagen) => {
        if (imagen.closest(".hero-img")) {
          imagen.setAttribute("fetchpriority", "high");
          imagen.decoding = "async";
          return;
        }

        imagen.loading = "lazy";
        imagen.decoding = "async";
      });
    }

    function mejorarCarruseles() {
      document.querySelectorAll(".carousel").forEach((carrusel) => {
        carrusel.tabIndex = 0;
        carrusel.setAttribute("role", "region");
        carrusel.setAttribute("aria-roledescription", "carrusel");

        const obtenerInstancia = () =>
          window.bootstrap?.Carousel.getOrCreateInstance(carrusel);

        carrusel.addEventListener("keydown", (evento) => {
          if (evento.key === "ArrowLeft") {
            evento.preventDefault();
            obtenerInstancia()?.prev();
          }

          if (evento.key === "ArrowRight") {
            evento.preventDefault();
            obtenerInstancia()?.next();
          }
        });

        carrusel.addEventListener("mouseenter", () => obtenerInstancia()?.pause());
        carrusel.addEventListener("mouseleave", () => obtenerInstancia()?.cycle());
        carrusel.addEventListener("focusin", () => obtenerInstancia()?.pause());
        carrusel.addEventListener("focusout", (evento) => {
          if (!carrusel.contains(evento.relatedTarget)) {
            obtenerInstancia()?.cycle();
          }
        });
      });
    }

    function formatearPreciosRutas() {
      document
        .querySelectorAll(
          ".rutas-index .ruta-slide-card__contenido > strong, " +
          ".rutas-index .rutas-index-card .ruta-index-card__precio"
        )
        .forEach((precio) => {
          const coincidencia = precio.textContent.trim().match(/^S\/\s*(\d+)$/);

          if (!coincidencia) {
            return;
          }

          precio.innerHTML =
            '<span class="etsa-precio-moneda">S/</span>' +
            `<span class="etsa-precio-monto">${coincidencia[1]}</span>`;
        });
    }

    function configurarAparicion(elementos, sinMovimiento) {
      if (sinMovimiento || !("IntersectionObserver" in window)) {
        elementos.forEach((elemento) => elemento.classList.add("etsa-reveal--visible"));
        return;
      }

      elementos.forEach((elemento) => elemento.classList.add("etsa-reveal"));

      const observador = new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            if (!entrada.isIntersecting) {
              return;
            }

            entrada.target.classList.add("etsa-reveal--visible");
            observador.unobserve(entrada.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px" }
      );

      elementos.forEach((elemento) => observador.observe(elemento));
    }
  });
})();
