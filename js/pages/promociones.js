document.addEventListener("DOMContentLoaded", function () {
  const promociones = [
    {
      id: "promo-1",
      nombre: "Promo Encomienda Express",
      categoria: "encomiendas",
      etiqueta: "Encomiendas"
    },
    {
      id: "promo-2",
      nombre: "Tarifa Ahorro para Carga",
      categoria: "carga",
      etiqueta: "Carga"
    },
    {
      id: "promo-3",
      nombre: "Promo Pasajero Mundialista",
      categoria: "viajes",
      etiqueta: "Viajes"
    },
    {
      id: "promo-4",
      nombre: "Vive la Fiesta de Chachapoyas",
      categoria: "viajes",
      etiqueta: "Viajes"
    }
  ];

  const filtros = [
    { valor: "todas", texto: "Todas", icono: "bi-grid-fill" },
    { valor: "viajes", texto: "Viajes", icono: "bi-bus-front-fill" },
    { valor: "encomiendas", texto: "Encomiendas", icono: "bi-box-seam-fill" },
    { valor: "carga", texto: "Carga", icono: "bi-truck-front-fill" }
  ];

  const seccion = document.querySelector(".promociones-seccion");
  const slider = document.querySelector(".promociones-slider");
  const contenedor = document.querySelector(".promociones-container");
  const indicadores = document.querySelector(".promociones-indicadores");
  const tarjetas = Array.from(document.querySelectorAll(".promocion-card"));

  if (!seccion || !slider || !contenedor || tarjetas.length === 0) {
    return;
  }

  let categoriaActiva = "todas";
  let indiceActivo = 0;

  agregarEstilos();
  prepararTarjetas();

  const barra = crearBarraFiltros();
  const controles = crearControlesSlider();
  const mensajeVacio = crearMensajeVacio();

  seccion.insertBefore(barra, slider);
  slider.appendChild(controles.botonAnterior);
  slider.appendChild(controles.botonSiguiente);
  seccion.insertBefore(mensajeVacio, indicadores || slider.nextSibling);

  actualizarVista();

  contenedor.addEventListener("scroll", function () {
    actualizarIndicadorPorScroll();
  });

  window.addEventListener("resize", function () {
    actualizarBotonesSlider();
    actualizarIndicadorPorScroll();
  });

  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") {
      cerrarModalActiva();
    }
  });

  document.querySelectorAll(".modal-overlay").forEach(function (modal) {
    modal.addEventListener("click", function (evento) {
      if (evento.target === modal) {
        cerrarModalActiva();
      }
    });
  });

  function prepararTarjetas() {
    tarjetas.forEach(function (tarjeta) {
      const promocion = promociones.find(function (item) {
        return item.id === tarjeta.id;
      });

      if (!promocion) {
        return;
      }

      tarjeta.dataset.categoria = promocion.categoria;

      tarjeta.querySelectorAll(".btn-mas-info, .promocion-card__link").forEach(function (boton) {
        boton.addEventListener("click", function () {
          mostrarDetalleRapido(promocion);
        });
      });
    });
  }

  function crearBarraFiltros() {
    const barraFiltros = document.createElement("div");
    barraFiltros.className = "promociones-js-barra";

    const grupoFiltros = document.createElement("div");
    grupoFiltros.className = "promociones-js-filtros";
    grupoFiltros.setAttribute("aria-label", "Filtrar promociones");

    filtros.forEach(function (filtro) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "promociones-js-filtro";
      boton.dataset.filtro = filtro.valor;
      boton.setAttribute("aria-pressed", filtro.valor === categoriaActiva ? "true" : "false");
      boton.innerHTML = '<i class="bi ' + filtro.icono + '" aria-hidden="true"></i><span>' + filtro.texto + "</span>";

      boton.addEventListener("click", function () {
        categoriaActiva = filtro.valor;
        indiceActivo = 0;
        actualizarVista();
      });

      grupoFiltros.appendChild(boton);
    });

    const contador = document.createElement("p");
    contador.className = "promociones-js-contador";
    contador.setAttribute("aria-live", "polite");

    barraFiltros.appendChild(grupoFiltros);
    barraFiltros.appendChild(contador);

    return barraFiltros;
  }

  function crearControlesSlider() {
    return {
      botonAnterior: crearBotonSlider("anterior", "bi-chevron-left", "Promocion anterior"),
      botonSiguiente: crearBotonSlider("siguiente", "bi-chevron-right", "Promocion siguiente")
    };
  }

  function crearBotonSlider(direccion, icono, etiqueta) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "promociones-js-nav promociones-js-nav--" + direccion;
    boton.setAttribute("aria-label", etiqueta);
    boton.innerHTML = '<i class="bi ' + icono + '" aria-hidden="true"></i>';

    boton.addEventListener("click", function () {
      moverSlider(direccion === "siguiente" ? 1 : -1);
    });

    return boton;
  }

  function crearMensajeVacio() {
    const mensaje = document.createElement("p");
    mensaje.className = "promociones-js-vacio";
    mensaje.textContent = "No hay promociones disponibles para este filtro.";
    return mensaje;
  }

  function actualizarVista() {
    const visibles = obtenerTarjetasVisibles();

    tarjetas.forEach(function (tarjeta) {
      const visible = categoriaActiva === "todas" || tarjeta.dataset.categoria === categoriaActiva;
      tarjeta.classList.toggle("promocion-card--oculta", !visible);
      tarjeta.setAttribute("aria-hidden", visible ? "false" : "true");
    });

    barra.querySelectorAll(".promociones-js-filtro").forEach(function (boton) {
      const activo = boton.dataset.filtro === categoriaActiva;
      boton.classList.toggle("activo", activo);
      boton.setAttribute("aria-pressed", activo ? "true" : "false");
    });

    barra.querySelector(".promociones-js-contador").textContent =
      "Promociones activas: " + visibles.length;

    mensajeVacio.classList.toggle("activo", visibles.length === 0);
    contenedor.classList.toggle("sin-resultados", visibles.length === 0);

    crearIndicadores(visibles.length);
    actualizarBotonesSlider();
    enfocarPromocionActiva();
  }

  function obtenerTarjetasVisibles() {
    return tarjetas.filter(function (tarjeta) {
      return categoriaActiva === "todas" || tarjeta.dataset.categoria === categoriaActiva;
    });
  }

  function crearIndicadores(total) {
    if (!indicadores) {
      return;
    }

    indicadores.innerHTML = "";

    for (let i = 0; i < total; i += 1) {
      const indicador = document.createElement("button");
      indicador.type = "button";
      indicador.className = "promocion-indicador";
      indicador.setAttribute("aria-label", "Ir a promocion " + (i + 1));

      indicador.addEventListener("click", function () {
        indiceActivo = i;
        enfocarPromocionActiva();
      });

      indicadores.appendChild(indicador);
    }

    actualizarIndicadores();
  }

  function moverSlider(direccion) {
    const visibles = obtenerTarjetasVisibles();

    if (visibles.length === 0) {
      return;
    }

    indiceActivo = (indiceActivo + direccion + visibles.length) % visibles.length;
    enfocarPromocionActiva();
  }

  function enfocarPromocionActiva() {
    const visibles = obtenerTarjetasVisibles();

    if (visibles.length === 0) {
      return;
    }

    indiceActivo = Math.min(indiceActivo, visibles.length - 1);

    visibles[indiceActivo].scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start"
    });

    actualizarIndicadores();
    actualizarBotonesSlider();
  }

  function actualizarIndicadorPorScroll() {
    const visibles = obtenerTarjetasVisibles();

    if (visibles.length === 0) {
      return;
    }

    let cercano = 0;
    let distanciaMenor = Number.POSITIVE_INFINITY;

    visibles.forEach(function (tarjeta, indice) {
      const distancia = Math.abs(tarjeta.offsetLeft - contenedor.scrollLeft - contenedor.offsetLeft);

      if (distancia < distanciaMenor) {
        distanciaMenor = distancia;
        cercano = indice;
      }
    });

    indiceActivo = cercano;
    actualizarIndicadores();
    actualizarBotonesSlider();
  }

  function actualizarIndicadores() {
    if (!indicadores) {
      return;
    }

    Array.from(indicadores.children).forEach(function (indicador, indice) {
      indicador.classList.toggle("activo", indice === indiceActivo);
    });
  }

  function actualizarBotonesSlider() {
    const visibles = obtenerTarjetasVisibles();
    const mostrar = visibles.length > 1;

    controles.botonAnterior.hidden = !mostrar;
    controles.botonSiguiente.hidden = !mostrar;
  }

  function mostrarDetalleRapido(promocion) {
    const avisoAnterior = document.querySelector(".promociones-js-toast");

    if (avisoAnterior) {
      avisoAnterior.remove();
    }

    const aviso = document.createElement("div");
    aviso.className = "promociones-js-toast";
    aviso.textContent = promocion.nombre + " - " + promocion.etiqueta;
    document.body.appendChild(aviso);

    window.setTimeout(function () {
      aviso.classList.add("visible");
    }, 10);

    window.setTimeout(function () {
      aviso.classList.remove("visible");
      window.setTimeout(function () {
        aviso.remove();
      }, 220);
    }, 2200);
  }

  function cerrarModalActiva() {
    if (window.location.hash.indexOf("#modal-promo") === 0) {
      history.pushState("", document.title, window.location.pathname + window.location.search);
    }
  }

  function agregarEstilos() {
    if (document.querySelector("#promociones-js-estilos")) {
      return;
    }

    const estilos = document.createElement("style");
    estilos.id = "promociones-js-estilos";
    estilos.textContent = `
      .promociones-js-barra {
        width: calc(100% - clamp(32px, 6vw, 80px));
        margin: 0 auto 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
      }

      .promociones-js-filtros {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .promociones-js-filtro {
        min-height: 44px;
        border: 1px solid #d9e2ec;
        border-radius: 12px;
        background: #ffffff;
        color: #0f172a;
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 10px 15px;
        font: inherit;
        font-size: 0.9rem;
        font-weight: 800;
        line-height: 1.1;
        cursor: pointer;
        box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
        transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
      }

      .promociones-js-filtro i {
        color: var(--naranja);
      }

      .promociones-js-filtro:hover,
      .promociones-js-filtro:focus-visible {
        border-color: var(--naranja);
        transform: translateY(-1px);
      }

      .promociones-js-filtro.activo {
        border-color: var(--naranja);
        background: var(--naranja);
        color: #ffffff;
      }

      .promociones-js-filtro.activo i {
        color: #ffffff;
      }

      .promociones-js-contador {
        margin: 0;
        color: #475569;
        font-size: 0.92rem;
        font-weight: 800;
        white-space: nowrap;
      }

      .promociones-slider {
        position: relative;
      }

      .promociones-js-nav {
        position: absolute;
        top: 50%;
        z-index: 4;
        width: 46px;
        height: 46px;
        border: 1px solid rgba(148, 163, 184, 0.28);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.96);
        color: #0f172a;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 16px 34px rgba(15, 23, 42, 0.16);
        cursor: pointer;
        transform: translateY(-50%);
        transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
      }

      .promociones-js-nav:hover,
      .promociones-js-nav:focus-visible {
        background: var(--naranja);
        color: #ffffff;
        transform: translateY(-50%) scale(1.04);
      }

      .promociones-js-nav--anterior {
        left: clamp(10px, 2vw, 26px);
      }

      .promociones-js-nav--siguiente {
        right: clamp(10px, 2vw, 26px);
      }

      .promocion-indicador {
        border: 0;
        padding: 0;
        cursor: pointer;
      }

      .promocion-indicador:focus-visible {
        outline: 3px solid rgba(249, 115, 22, 0.35);
        outline-offset: 4px;
      }

      .promocion-card--oculta {
        display: none !important;
      }

      .promociones-js-vacio {
        display: none;
        width: calc(100% - clamp(32px, 6vw, 80px));
        margin: 16px auto 0;
        border: 1px dashed #cbd5e1;
        border-radius: 14px;
        background: #ffffff;
        color: #475569;
        padding: 18px;
        text-align: center;
        font-weight: 800;
      }

      .promociones-js-vacio.activo {
        display: block;
      }

      .promociones-js-toast {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 100000;
        max-width: min(360px, calc(100vw - 48px));
        border-radius: 14px;
        background: #0f172a;
        color: #ffffff;
        padding: 14px 18px;
        font-size: 0.92rem;
        font-weight: 800;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.28);
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.22s ease, transform 0.22s ease;
      }

      .promociones-js-toast.visible {
        opacity: 1;
        transform: translateY(0);
      }

      @media (max-width: 767.98px) {
        .promociones-js-barra {
          align-items: flex-start;
          flex-direction: column;
        }

        .promociones-js-filtros {
          width: 100%;
        }

        .promociones-js-filtro {
          flex: 1 1 calc(50% - 10px);
          justify-content: center;
        }

        .promociones-js-contador {
          white-space: normal;
        }

        .promociones-js-nav {
          width: 42px;
          height: 42px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .promociones-js-filtro,
        .promociones-js-nav,
        .promociones-js-toast {
          transition: none;
        }
      }
    `;

    document.head.appendChild(estilos);
  }
});
