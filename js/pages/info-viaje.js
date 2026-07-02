document.addEventListener("DOMContentLoaded", function () {
  const grupos = [
    {
      categoria: "politicas",
      etiqueta: "Politicas de viaje",
      selector: ".politica-card",
      icono: "bi-shield-check"
    },
    {
      categoria: "adicional",
      etiqueta: "Info adicional",
      selector: ".info-card",
      icono: "bi-info-circle"
    },
    {
      categoria: "equipaje",
      etiqueta: "Equipaje",
      selector: ".equipaje-card",
      icono: "bi-suitcase"
    }
  ];

  const filtros = [
    { valor: "todas", texto: "Todas las categorias", icono: "bi-grid-fill" },
    { valor: "politicas", texto: "Politicas", icono: "bi-shield-check" },
    { valor: "adicional", texto: "Info adicional", icono: "bi-info-circle" },
    { valor: "equipaje", texto: "Equipaje", icono: "bi-suitcase" }
  ];

  const main = document.querySelector("main");
  const breadcrumb = document.querySelector(".breadcrumb-info-viaje");
  const mensajeViaje = document.querySelector(".mensaje-viaje");
  const tarjetas = obtenerTarjetas();

  if (!main || tarjetas.length === 0) {
    return;
  }

  let categoriaActiva = "todas";
  let busquedaActiva = "";
  let tarjetaActiva = null;

  agregarEstilos();
  prepararTarjetas();

  const panel = crearPanelHerramientas();
  const mensajeEstado = crearMensajeEstado();
  const modal = crearModalDetalle();
  const referenciaPanel = mensajeViaje || (breadcrumb ? breadcrumb.nextSibling : main.firstChild);

  main.insertBefore(panel, referenciaPanel);
  main.insertBefore(mensajeEstado, mensajeViaje || panel.nextSibling);
  document.body.appendChild(modal.overlay);

  actualizarVista();

  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") {
      cerrarModal();
    }
  });

  function obtenerTarjetas() {
    const lista = [];

    grupos.forEach(function (grupo) {
      document.querySelectorAll(grupo.selector).forEach(function (card) {
        const titulo = card.querySelector("h3");
        const texto = card.textContent.replace(/\s+/g, " ").trim();

        lista.push({
          card: card,
          categoria: grupo.categoria,
          etiqueta: grupo.etiqueta,
          icono: grupo.icono,
          titulo: titulo ? titulo.textContent.trim() : "Informacion",
          texto: texto
        });
      });
    });

    return lista;
  }

  function prepararTarjetas() {
    tarjetas.forEach(function (item, indice) {
      item.card.dataset.categoria = item.categoria;
      item.card.dataset.busqueda = normalizarTexto(item.titulo + " " + item.texto + " " + item.etiqueta);
      item.card.tabIndex = 0;
      item.card.setAttribute("role", "button");
      item.card.setAttribute("aria-expanded", "false");

      const contenido = item.card.querySelector('[class$="__contenido"]');
      const acciones = document.createElement("div");
      const botonVerMas = document.createElement("button");

      acciones.className = "info-js-acciones";
      botonVerMas.type = "button";
      botonVerMas.className = "info-js-ver-mas";
      botonVerMas.innerHTML = 'Ver mas <i class="bi bi-arrow-right" aria-hidden="true"></i>';
      botonVerMas.setAttribute("aria-label", "Ver mas sobre " + item.titulo);

      botonVerMas.addEventListener("click", function (evento) {
        evento.stopPropagation();
        abrirModal(item);
      });

      acciones.appendChild(botonVerMas);

      if (contenido) {
        contenido.appendChild(acciones);
      }

      item.card.addEventListener("click", function () {
        alternarTarjeta(item);
      });

      item.card.addEventListener("keydown", function (evento) {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          alternarTarjeta(item);
        }
      });

      if (indice === 0) {
        tarjetaActiva = item.card;
      }
    });
  }

  function crearPanelHerramientas() {
    const panel = document.createElement("section");
    panel.className = "info-js-panel";
    panel.setAttribute("aria-label", "Herramientas para consultar informacion de viaje");

    const filtrosWrap = document.createElement("div");
    filtrosWrap.className = "info-js-filtros";

    filtros.forEach(function (filtro) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "info-js-filtro";
      boton.dataset.filtro = filtro.valor;
      boton.setAttribute("aria-pressed", filtro.valor === categoriaActiva ? "true" : "false");
      boton.innerHTML = '<i class="bi ' + filtro.icono + '" aria-hidden="true"></i><span>' + filtro.texto + "</span>";

      boton.addEventListener("click", function () {
        categoriaActiva = filtro.valor;
        actualizarVista();
      });

      filtrosWrap.appendChild(boton);
    });

    const busqueda = document.createElement("label");
    busqueda.className = "info-js-busqueda";
    busqueda.innerHTML = '<i class="bi bi-search" aria-hidden="true"></i><span class="sr-only">Buscar informacion</span>';

    const input = document.createElement("input");
    input.type = "search";
    input.placeholder = "Buscar informacion...";
    input.setAttribute("aria-label", "Buscar informacion para tu viaje");

    input.addEventListener("input", function () {
      busquedaActiva = input.value;
      actualizarVista();
    });

    busqueda.appendChild(input);
    panel.appendChild(filtrosWrap);
    panel.appendChild(busqueda);

    return panel;
  }

  function crearMensajeEstado() {
    const mensaje = document.createElement("p");
    mensaje.className = "info-js-estado";
    mensaje.setAttribute("aria-live", "polite");
    return mensaje;
  }

  function crearModalDetalle() {
    const overlay = document.createElement("div");
    overlay.className = "info-js-modal";
    overlay.setAttribute("aria-hidden", "true");

    const ventana = document.createElement("article");
    ventana.className = "info-js-modal__ventana";
    ventana.setAttribute("role", "dialog");
    ventana.setAttribute("aria-modal", "true");
    ventana.setAttribute("aria-labelledby", "info-js-modal-titulo");

    ventana.innerHTML =
      '<header class="info-js-modal__header">' +
      '<div><p class="info-js-modal__categoria"></p><h3 id="info-js-modal-titulo"></h3></div>' +
      '<button type="button" class="info-js-modal__cerrar" aria-label="Cerrar detalle"><i class="bi bi-x-lg" aria-hidden="true"></i></button>' +
      '</header>' +
      '<div class="info-js-modal__body"></div>';

    overlay.appendChild(ventana);

    overlay.addEventListener("click", function (evento) {
      if (evento.target === overlay) {
        cerrarModal();
      }
    });

    ventana.querySelector(".info-js-modal__cerrar").addEventListener("click", cerrarModal);

    return {
      overlay: overlay,
      categoria: ventana.querySelector(".info-js-modal__categoria"),
      titulo: ventana.querySelector("#info-js-modal-titulo"),
      body: ventana.querySelector(".info-js-modal__body"),
      cerrar: ventana.querySelector(".info-js-modal__cerrar")
    };
  }

  function actualizarVista() {
    const termino = normalizarTexto(busquedaActiva);
    let visibles = 0;

    tarjetas.forEach(function (item) {
      const coincideCategoria = categoriaActiva === "todas" || item.categoria === categoriaActiva;
      const coincideBusqueda = termino === "" || item.card.dataset.busqueda.indexOf(termino) >= 0;
      const visible = coincideCategoria && coincideBusqueda;

      item.card.classList.toggle("info-js-oculta", !visible);
      item.card.setAttribute("aria-hidden", visible ? "false" : "true");

      if (visible) {
        visibles += 1;
      }
    });

    panel.querySelectorAll(".info-js-filtro").forEach(function (boton) {
      const activo = boton.dataset.filtro === categoriaActiva;
      boton.classList.toggle("activo", activo);
      boton.setAttribute("aria-pressed", activo ? "true" : "false");
    });

    actualizarEstado(visibles);
    resaltarPrimeraVisible();
  }

  function actualizarEstado(total) {
    if (total === 0) {
      mensajeEstado.className = "info-js-estado info-js-estado--alerta";
      mensajeEstado.innerHTML = '<i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i> No se encontraron resultados. Prueba con otra categoria o palabra clave.';
      return;
    }

    mensajeEstado.className = "info-js-estado";
    mensajeEstado.innerHTML = '<i class="bi bi-check-circle-fill" aria-hidden="true"></i> Mostrando ' + total + " politica" + (total === 1 ? "" : "s") + " de viaje.";
  }

  function resaltarPrimeraVisible() {
    const visible = tarjetas.find(function (item) {
      return !item.card.classList.contains("info-js-oculta");
    });

    tarjetas.forEach(function (item) {
      item.card.classList.remove("info-js-activa");
    });

    if (visible && (!tarjetaActiva || tarjetaActiva.classList.contains("info-js-oculta"))) {
      tarjetaActiva = visible.card;
    }

    if (tarjetaActiva && !tarjetaActiva.classList.contains("info-js-oculta")) {
      tarjetaActiva.classList.add("info-js-activa");
    }
  }

  function alternarTarjeta(item) {
    const estaAbierta = item.card.classList.contains("info-js-desplegada");

    tarjetas.forEach(function (tarjeta) {
      tarjeta.card.classList.remove("info-js-desplegada", "info-js-activa");
      tarjeta.card.setAttribute("aria-expanded", "false");
    });

    tarjetaActiva = item.card;
    item.card.classList.add("info-js-activa");

    if (!estaAbierta) {
      item.card.classList.add("info-js-desplegada");
      item.card.setAttribute("aria-expanded", "true");
    }
  }

  function abrirModal(item) {
    const contenido = item.card.querySelector('[class$="__contenido"]');
    const copia = contenido ? contenido.cloneNode(true) : document.createElement("div");
    const acciones = copia.querySelector(".info-js-acciones");

    if (acciones) {
      acciones.remove();
    }

    modal.categoria.textContent = item.etiqueta;
    modal.titulo.textContent = item.titulo;
    modal.body.innerHTML = "";
    modal.body.appendChild(copia);
    modal.overlay.classList.add("abierto");
    modal.overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("info-js-modal-abierto");

    window.setTimeout(function () {
      modal.cerrar.focus();
    }, 20);
  }

  function cerrarModal() {
    modal.overlay.classList.remove("abierto");
    modal.overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("info-js-modal-abierto");
  }

  function normalizarTexto(texto) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function agregarEstilos() {
    if (document.querySelector("#info-viaje-js-estilos")) {
      return;
    }

    const estilos = document.createElement("style");
    estilos.id = "info-viaje-js-estilos";
    estilos.textContent = `
      .info-js-panel {
        width: min(1180px, calc(100% - 32px));
        margin: 28px auto 14px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(260px, 420px);
        gap: 16px;
        align-items: center;
      }

      .info-js-filtros {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .info-js-filtro {
        min-height: 44px;
        border: 1px solid #d9e2ec;
        border-radius: 10px;
        background: #ffffff;
        color: #0f172a;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        padding: 10px 14px;
        font: inherit;
        font-size: 0.9rem;
        font-weight: 800;
        line-height: 1.1;
        cursor: pointer;
        box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
        transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
      }

      .info-js-filtro i {
        color: var(--naranja);
      }

      .info-js-filtro:hover,
      .info-js-filtro:focus-visible {
        border-color: var(--naranja);
        transform: translateY(-1px);
      }

      .info-js-filtro.activo {
        border-color: var(--naranja);
        background: var(--naranja);
        color: #ffffff;
      }

      .info-js-filtro.activo i {
        color: #ffffff;
      }

      .info-js-busqueda {
        min-width: 0;
        min-height: 48px;
        border: 1px solid #d9e2ec;
        border-radius: 10px;
        background: #ffffff;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 14px;
        box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
      }

      .info-js-busqueda i {
        color: #0f172a;
        font-size: 1.05rem;
      }

      .info-js-busqueda input {
        width: 100%;
        min-width: 0;
        border: 0;
        outline: 0;
        background: transparent;
        color: #0f172a;
        font: inherit;
        font-size: 0.94rem;
        font-weight: 700;
      }

      .info-js-estado {
        width: min(1180px, calc(100% - 32px));
        min-height: 44px;
        margin: 0 auto 26px;
        border: 1px solid rgba(34, 197, 94, 0.2);
        border-radius: 10px;
        background: #f0fdf4;
        color: #166534;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 14px;
        font-size: 0.92rem;
        font-weight: 800;
      }

      .info-js-estado i {
        color: #22c55e;
      }

      .info-js-estado--alerta {
        border-color: rgba(249, 115, 22, 0.28);
        background: #fff7ed;
        color: #9a3412;
      }

      .info-js-estado--alerta i {
        color: var(--naranja);
      }

      .politica-card.info-js-activa,
      .info-card.info-js-activa,
      .equipaje-card.info-js-activa {
        border-color: rgba(249, 115, 22, 0.72);
        box-shadow: 0 18px 38px rgba(249, 115, 22, 0.15);
      }

      .politica-card.info-js-oculta,
      .info-card.info-js-oculta,
      .equipaje-card.info-js-oculta {
        display: none !important;
      }

      .politica-card:not(.info-js-desplegada) .politica-card__contenido p,
      .info-card:not(.info-js-desplegada) .info-card__contenido p,
      .equipaje-card:not(.info-js-desplegada) .equipaje-card__contenido p,
      .equipaje-card:not(.info-js-desplegada) .equipaje-card__contenido ul,
      .info-card:not(.info-js-desplegada) .info-card__subtitulo {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .info-js-desplegada {
        cursor: default;
      }

      .info-js-acciones {
        margin-top: auto;
        padding-top: 18px;
        display: flex;
        justify-content: flex-end;
      }

      .info-js-ver-mas {
        border: 0;
        background: transparent;
        color: var(--naranja);
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 0;
        font: inherit;
        font-size: 0.86rem;
        font-weight: 900;
        cursor: pointer;
      }

      .info-js-ver-mas:hover,
      .info-js-ver-mas:focus-visible {
        color: var(--naranja-oscuro);
        text-decoration: underline;
      }

      .info-js-modal {
        position: fixed;
        inset: 0;
        z-index: 100000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(2, 6, 23, 0.66);
        backdrop-filter: blur(4px);
      }

      .info-js-modal.abierto {
        display: flex;
      }

      body.info-js-modal-abierto {
        overflow: hidden;
      }

      .info-js-modal__ventana {
        width: min(100%, 620px);
        max-height: calc(100vh - 40px);
        overflow: hidden;
        border-radius: 14px;
        background: #ffffff;
        box-shadow: 0 24px 70px rgba(2, 6, 23, 0.36);
      }

      .info-js-modal__header {
        background: #0f172a;
        color: #ffffff;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        padding: 20px 22px;
      }

      .info-js-modal__categoria {
        margin: 0 0 6px;
        color: var(--naranja);
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .info-js-modal__header h3 {
        margin: 0;
        color: #ffffff;
        font-size: clamp(1.2rem, 2.6vw, 1.65rem);
        font-weight: 900;
        line-height: 1.15;
      }

      .info-js-modal__cerrar {
        flex: 0 0 auto;
        width: 40px;
        height: 40px;
        border: 0;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .info-js-modal__cerrar:hover,
      .info-js-modal__cerrar:focus-visible {
        background: var(--naranja);
      }

      .info-js-modal__body {
        max-height: calc(100vh - 138px);
        overflow-y: auto;
        padding: 26px 28px;
      }

      .info-js-modal__body [class$="__contenido"] {
        padding: 0;
      }

      .info-js-modal__body h3 {
        display: none;
      }

      .info-js-modal__body p,
      .info-js-modal__body li {
        color: #334155;
        font-size: 1rem;
        line-height: 1.75;
      }

      .info-js-modal__body ul {
        margin-top: 8px;
      }

      @media (max-width: 767.98px) {
        .info-js-panel {
          grid-template-columns: 1fr;
          margin-top: 20px;
        }

        .info-js-filtro {
          flex: 1 1 calc(50% - 10px);
        }

        .info-js-estado {
          align-items: flex-start;
        }

        .info-js-modal {
          padding: 14px;
        }

        .info-js-modal__body {
          padding: 22px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .info-js-filtro {
          transition: none;
        }
      }
    `;

    document.head.appendChild(estilos);
  }
});
