
(() => {
  const FILTROS = [
    { id: "todos", texto: "Todos", icono: "bi-grid-3x3-gap-fill" },
    { id: "encomiendas", texto: "Encomiendas", icono: "bi-box-seam-fill" },
    { id: "carga", texto: "Carga", icono: "bi-boxes" },
    { id: "viajes", texto: "Viajes", icono: "bi-bus-front-fill" },
  ];

  const CATEGORIAS_POR_CLASE = [
    { clase: "promocion-card--encomienda", categoria: "encomiendas" },
    { clase: "promocion-card--carga", categoria: "carga" },
    { clase: "promocion-card--mundial", categoria: "viajes" },
    { clase: "promocion-card--raymi", categoria: "viajes" },
  ];

  const obtenerCategoria = (tarjeta) => {
    const categoriaExistente = tarjeta.dataset.promocionCategoria;

    if (categoriaExistente) {
      return categoriaExistente;
    }

    const categoriaDetectada = CATEGORIAS_POR_CLASE.find((item) =>
      tarjeta.classList.contains(item.clase)
    )?.categoria || "viajes";

    tarjeta.dataset.promocionCategoria = categoriaDetectada;
    return categoriaDetectada;
  };

  const crearBotonFiltro = (filtro) => {
    const boton = document.createElement("button");
    const icono = document.createElement("i");
    const texto = document.createTextNode(filtro.texto);

    boton.type = "button";
    boton.className = "promociones-filtro";
    boton.dataset.promocionFiltro = filtro.id;
    boton.setAttribute("aria-pressed", "false");

    icono.className = `bi ${filtro.icono}`;
    icono.setAttribute("aria-hidden", "true");

    boton.append(icono, texto);
    return boton;
  };

  const crearAvisoVacio = () => {
    const aviso = document.createElement("p");
    aviso.className = "promociones-vacio";
    aviso.id = "promocionesVacio";
    aviso.hidden = true;
    aviso.textContent = "No hay promociones disponibles para este filtro.";
    return aviso;
  };

  const initFiltroPromociones = () => {
    const lista = document.getElementById("promocionesLista");

    if (!lista || lista.dataset.filtroPromociones === "ready") {
      return;
    }

    const tarjetas = Array.from(lista.querySelectorAll(".promocion-card"));

    if (!tarjetas.length) {
      return;
    }

    lista.dataset.filtroPromociones = "ready";
    tarjetas.forEach(obtenerCategoria);

    const filtrosWrapper = document.createElement("div");
    filtrosWrapper.className = "promociones-filtros";
    filtrosWrapper.setAttribute("aria-label", "Filtrar promociones");

    FILTROS.forEach((filtro) => {
      filtrosWrapper.appendChild(crearBotonFiltro(filtro));
    });

    const avisoVacio = crearAvisoVacio();
    const slider = lista.closest(".promociones-slider");

    if (slider) {
      slider.insertAdjacentElement("beforebegin", filtrosWrapper);
      slider.appendChild(avisoVacio);
    } else {
      lista.insertAdjacentElement("beforebegin", filtrosWrapper);
      lista.insertAdjacentElement("afterend", avisoVacio);
    }

    const botones = Array.from(filtrosWrapper.querySelectorAll("[data-promocion-filtro]"));

    const aplicarFiltro = (categoriaActiva) => {
      let visibles = 0;

      tarjetas.forEach((tarjeta) => {
        const coincide = categoriaActiva === "todos" || tarjeta.dataset.promocionCategoria === categoriaActiva;

        tarjeta.hidden = !coincide;

        if (coincide) {
          visibles += 1;
        }
      });

      botones.forEach((boton) => {
        const activo = boton.dataset.promocionFiltro === categoriaActiva;
        boton.classList.toggle("is-active", activo);
        boton.setAttribute("aria-pressed", String(activo));
      });

      avisoVacio.hidden = visibles > 0;

      lista.scrollTo({
        left: 0,
        behavior: "smooth",
      });
    };

    botones.forEach((boton) => {
      boton.addEventListener("click", () => {
        aplicarFiltro(boton.dataset.promocionFiltro || "todos");
      });
    });

    aplicarFiltro("todos");
  };

  document.addEventListener("DOMContentLoaded", initFiltroPromociones);
})();
