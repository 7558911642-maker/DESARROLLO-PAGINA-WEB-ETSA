"use strict";

document.addEventListener("DOMContentLoaded", function () {
  document.body.classList.add("etsa-servicios-js");

  const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tarjetas = Array.from(document.querySelectorAll(".servicio-card"));
  const columnas = Array.from(document.querySelectorAll(".servicios-grid > [class*='col-']"));
  const secciones = document.querySelectorAll("main > section:not(.servicios-hero)");
  const pasos = document.querySelector(".servicios-pasos__linea");

  const acciones = [
    { texto: "Reservar pasaje", enlace: "reserva.html" },
    { texto: "Ver encomiendas", enlace: "encomiendas.html" },
    { texto: "Informaci\u00f3n de viaje", enlace: "info-viaje.html" },
    {
      texto: "Hablar por WhatsApp",
      enlace: "https://wa.me/51904178833?text=Hola%20ETSA%2C%20necesito%20ayuda%20con%20un%20servicio",
      externo: true
    }
  ];

  tarjetas.forEach(function (tarjeta, indice) {
    const lista = tarjeta.querySelector(":scope > ul");
    const titulo = tarjeta.querySelector("h3")?.textContent.trim() || `Servicio ${indice + 1}`;
    const accion = acciones[indice];

    if (lista) {
      lista.id = `beneficios-servicio-${indice + 1}`;

      const boton = document.createElement("button");
      boton.className = "etsa-beneficios-toggle";
      boton.type = "button";
      boton.setAttribute("aria-expanded", "false");
      boton.setAttribute("aria-controls", lista.id);
      boton.innerHTML = 'Ver beneficios <i class="bi bi-chevron-down" aria-hidden="true"></i>';
      lista.before(boton);

      boton.addEventListener("click", function () {
        const expandida = tarjeta.classList.toggle("etsa-card--expanded");
        boton.setAttribute("aria-expanded", String(expandida));
        boton.firstChild.textContent = expandida ? "Ocultar beneficios " : "Ver beneficios ";
      });
    }

    if (accion) {
      const enlace = document.createElement("a");
      enlace.className = "etsa-servicio-accion";
      enlace.href = accion.enlace;
      enlace.innerHTML = `${accion.texto} <i class="bi bi-arrow-right" aria-hidden="true"></i>`;
      enlace.setAttribute("aria-label", `${accion.texto}: ${titulo}`);

      if (accion.externo) {
        enlace.target = "_blank";
        enlace.rel = "noopener noreferrer";
      }

      tarjeta.appendChild(enlace);
    }
  });

  document.querySelectorAll("main img").forEach(function (imagen) {
    imagen.loading = "lazy";
    imagen.decoding = "async";
  });

  configurarAparicion(secciones, reducirMovimiento);
  configurarAparicion(columnas, reducirMovimiento, true);

  if (pasos) {
    if (reducirMovimiento || !("IntersectionObserver" in window)) {
      pasos.classList.add("etsa-pasos--visible");
    } else {
      const observadorPasos = new IntersectionObserver(
        function (entradas) {
          if (entradas.some(function (entrada) { return entrada.isIntersecting; })) {
            pasos.classList.add("etsa-pasos--visible");
            observadorPasos.disconnect();
          }
        },
        { threshold: 0.35 }
      );
      observadorPasos.observe(pasos);
    }
  }

  function configurarAparicion(elementos, sinMovimiento, escalonada) {
    elementos.forEach(function (elemento, indice) {
      elemento.classList.add(escalonada ? "etsa-servicio-reveal" : "etsa-reveal");
      if (escalonada) {
        elemento.style.setProperty("--etsa-delay", `${indice * 75}ms`);
      }
    });

    if (sinMovimiento || !("IntersectionObserver" in window)) {
      elementos.forEach(function (elemento) {
        elemento.classList.add("etsa-reveal--visible");
      });
      return;
    }

    const observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) {
            return;
          }

          entrada.target.classList.add("etsa-reveal--visible");
          observador.unobserve(entrada.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -35px" }
    );

    elementos.forEach(function (elemento) {
      observador.observe(elemento);
    });
  }
});
