"use strict";

(function () {
  const SELECTORS = {
    form: "formulario-reserva",
    nombre: "reserva-nombre",
    dni: "reserva-dni",
    origen: "reserva-origen",
    destino: "reserva-destino",
    fecha: "reserva-fecha",
    observaciones: "mensaje-adicional",
    contador: "contador-mensaje",
    mensaje: "mensaje-reserva",
    asientoSeleccionado: "asiento-seleccionado",
    resumenOrigen: "resumen-origen",
    resumenDestino: "resumen-destino",
    resumenFecha: "resumen-fecha",
    resumenAsiento: "resumen-asiento",
    confirmacionModal: "reserva-confirmacion-modal",
    comprobanteCodigo: "comprobante-codigo",
    comprobanteNombre: "comprobante-nombre",
    comprobanteDni: "comprobante-dni",
    comprobanteRuta: "comprobante-ruta",
    comprobanteFecha: "comprobante-fecha",
    comprobanteAsiento: "comprobante-asiento",
    comprobantePrecio: "comprobante-precio",
    comprobanteEstado: "comprobante-estado",
    btnImprimirComprobante: "btn-imprimir-comprobante",
    btnDescargarComprobante: "btn-descargar-comprobante",
    btnNuevaReservaConfirmacion: "btn-reserva-confirmacion-nueva",
  };

  const FIELD_NAMES = [
    "nombre",
    "dni",
    "origen",
    "destino",
    "fecha",
    "asiento",
    "observaciones",
  ];

  const DESTINO_PLACEHOLDER = "Seleccione un destino";

  document.addEventListener("DOMContentLoaded", function () {
    const form = byId(SELECTORS.form);

    if (!form || !window.ReservasValidaciones || !window.ReservasJsonManager) {
      return;
    }

    iniciarModuloReservas(form);
  });

  async function iniciarModuloReservas(form) {
    const storage = window.ReservasJsonManager;
    const validator = window.ReservasValidaciones;

    await storage.inicializar({ fuenteJson: "data/reservas.json" });

    const estado = {
      reservas: storage.listar(),
      asientoOcupadosBase: storage.obtenerAsientosOcupados(),
      destinosBase: [],
      ultimaReserva: null,
    };

    const ui = obtenerElementos(form);

    if (!tieneElementosMinimos(ui)) {
      return;
    }

    estado.destinosBase = obtenerOpcionesDestinoBase(ui.campos.destino);
    reconstruirOpcionesDestino(ui, estado);
    form.noValidate = true;
    validator.aplicarRestriccionesNativas(ui.campos);
    configurarSelectorFecha(ui, validator);
    prepararFeedback(ui);
    enlazarEventos(form, ui, estado, storage, validator);
    sincronizarDisponibilidadAsientos(ui, estado);
    actualizarResumen(ui);
  }

  function obtenerElementos(form) {
    return {
      form,
      campos: {
        nombre: byId(SELECTORS.nombre),
        dni: byId(SELECTORS.dni),
        origen: byId(SELECTORS.origen),
        destino: byId(SELECTORS.destino),
        fecha: byId(SELECTORS.fecha),
        observaciones: byId(SELECTORS.observaciones),
      },
      asientoInputs: Array.from(form.querySelectorAll(".reserva-seat-input")),
      feedback: {},
      contador: byId(SELECTORS.contador),
      mensaje: byId(SELECTORS.mensaje),
      asientoSeleccionado: byId(SELECTORS.asientoSeleccionado),
      resumen: {
        origen: byId(SELECTORS.resumenOrigen),
        destino: byId(SELECTORS.resumenDestino),
        fecha: byId(SELECTORS.resumenFecha),
        asiento: byId(SELECTORS.resumenAsiento),
      },
      confirmacion: {
        modal: byId(SELECTORS.confirmacionModal),
        codigo: byId(SELECTORS.comprobanteCodigo),
        nombre: byId(SELECTORS.comprobanteNombre),
        dni: byId(SELECTORS.comprobanteDni),
        ruta: byId(SELECTORS.comprobanteRuta),
        fecha: byId(SELECTORS.comprobanteFecha),
        asiento: byId(SELECTORS.comprobanteAsiento),
        precio: byId(SELECTORS.comprobantePrecio),
        estado: byId(SELECTORS.comprobanteEstado),
        btnImprimir: byId(SELECTORS.btnImprimirComprobante),
        btnDescargar: byId(SELECTORS.btnDescargarComprobante),
        btnNueva: byId(SELECTORS.btnNuevaReservaConfirmacion),
      },
    };
  }

  function tieneElementosMinimos(ui) {
    return Boolean(
      ui.campos.nombre &&
        ui.campos.dni &&
        ui.campos.origen &&
        ui.campos.destino &&
        ui.campos.fecha &&
        ui.campos.observaciones &&
        ui.mensaje
    );
  }

  function prepararFeedback(ui) {
    FIELD_NAMES.forEach(function (nombreCampo) {
      if (nombreCampo === "asiento") {
        ui.feedback.asiento = crearFeedbackAsiento(ui.form);
        return;
      }

      const campo = ui.campos[nombreCampo];

      if (!campo) {
        return;
      }

      const feedback = document.createElement("p");
      feedback.className = "reserva-feedback";
      feedback.id = `${campo.id}-feedback`;
      feedback.setAttribute("aria-live", "polite");

      const contenedorControl = campo.closest(".reserva-field__control");
      const referencia = contenedorControl || campo;

      referencia.insertAdjacentElement("afterend", feedback);
      campo.setAttribute("aria-describedby", combinarDescripciones(campo, feedback.id));
      ui.feedback[nombreCampo] = feedback;
    });
  }

  function crearFeedbackAsiento(form) {
    const mapaAsientos = form.querySelector(".reserva-bus-map");
    const referencia = form.querySelector(".reserva-bus-map__caption") || mapaAsientos;

    if (!referencia) {
      return null;
    }

    const feedback = document.createElement("p");
    feedback.className = "reserva-feedback reserva-feedback--asiento";
    feedback.id = "reserva-asiento-feedback";
    feedback.setAttribute("aria-live", "polite");
    referencia.insertAdjacentElement("afterend", feedback);

    if (mapaAsientos) {
      mapaAsientos.setAttribute("aria-describedby", feedback.id);
    }

    return feedback;
  }

  function combinarDescripciones(campo, feedbackId) {
    const actual = campo.getAttribute("aria-describedby");

    if (!actual) {
      return feedbackId;
    }

    return actual.includes(feedbackId) ? actual : `${actual} ${feedbackId}`;
  }

  function enlazarEventos(form, ui, estado, storage, validator) {
    const validarYActualizar = function (nombreCampo) {
      normalizarEntradaEnTiempoReal(ui, nombreCampo, validator);
      sincronizarDisponibilidadAsientos(ui, estado);
      actualizarResumen(ui);
      validarCampo(ui, estado, validator, nombreCampo);
    };

    ["nombre", "dni", "fecha", "observaciones"].forEach(function (nombreCampo) {
      const campo = ui.campos[nombreCampo];

      campo.addEventListener("input", function () {
        validarYActualizar(nombreCampo);
      });

      campo.addEventListener("blur", function () {
        normalizarCampoAlPerderFoco(ui, nombreCampo, validator);
        sincronizarDisponibilidadAsientos(ui, estado);
        actualizarResumen(ui);
        validarCampo(ui, estado, validator, nombreCampo);
      });
    });

    ui.campos.origen.addEventListener("change", function () {
      reconstruirOpcionesDestino(ui, estado);
      sincronizarDisponibilidadAsientos(ui, estado);
      actualizarResumen(ui);
      validarCampo(ui, estado, validator, "origen");
      validarCampo(ui, estado, validator, "destino");
      validarCampo(ui, estado, validator, "asiento");
    });

    ui.campos.destino.addEventListener("change", function () {
      sincronizarDisponibilidadAsientos(ui, estado);
      actualizarResumen(ui);
      validarCampo(ui, estado, validator, "origen");
      validarCampo(ui, estado, validator, "destino");
      validarCampo(ui, estado, validator, "asiento");
    });

    ui.asientoInputs.forEach(function (input) {
      input.addEventListener("change", function () {
        actualizarResumen(ui);
        validarCampo(ui, estado, validator, "asiento");
      });
    });

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      registrarOActualizarReserva(ui, estado, storage, validator);
    });

    ui.confirmacion.btnNueva?.addEventListener("click", function () {
      limpiarFormulario(ui, estado, validator);
    });

    ui.confirmacion.btnImprimir?.addEventListener("click", function () {
      imprimirComprobante(estado.ultimaReserva);
    });

    ui.confirmacion.btnDescargar?.addEventListener("click", function () {
      descargarComprobante(estado.ultimaReserva);
    });
  }

  function normalizarEntradaEnTiempoReal(ui, nombreCampo, validator) {
    const campo = ui.campos[nombreCampo];

    if (!campo) {
      return;
    }

    if (nombreCampo === "dni") {
      campo.value = validator.normalizarDni(campo.value);
    }

    if (nombreCampo === "fecha" && campo.type !== "date") {
      campo.value = validator.formatearFechaMientrasEscribe(campo.value);
    }

    if (nombreCampo === "observaciones") {
      campo.value = validator.limitarTexto(campo.value, validator.LIMITES.observacionesMax);
      actualizarContador(ui, validator);
    }
  }

  function normalizarCampoAlPerderFoco(ui, nombreCampo, validator) {
    const campo = ui.campos[nombreCampo];

    if (!campo) {
      return;
    }

    if (nombreCampo === "nombre") {
      campo.value = validator.normalizarNombre(campo.value);
    }

    if (nombreCampo === "observaciones") {
      campo.value = validator.normalizarEspacios(campo.value);
      actualizarContador(ui, validator);
    }
  }

  function obtenerOpcionesDestinoBase(selectDestino) {
    const opcionesUnicas = new Map();

    Array.from(selectDestino.options).forEach(function (option) {
      const value = option.value.trim();

      if (!value || opcionesUnicas.has(value)) {
        return;
      }

      opcionesUnicas.set(value, {
        value,
        text: option.textContent.trim() || value,
      });
    });

    return Array.from(opcionesUnicas.values());
  }

  function reconstruirOpcionesDestino(ui, estado, opciones) {
    const destino = ui.campos.destino;
    const origenSeleccionado = ui.campos.origen.value;
    const destinoActual = opciones?.valorSeleccionado ?? destino.value;
    const fragment = document.createDocumentFragment();
    const placeholder = new Option(DESTINO_PLACEHOLDER, "", true, true);

    placeholder.disabled = true;
    fragment.appendChild(placeholder);

    estado.destinosBase
      .filter(function (option) {
        return option.value !== origenSeleccionado;
      })
      .forEach(function (option) {
        fragment.appendChild(new Option(option.text, option.value));
      });

    destino.replaceChildren(fragment);

    if (destinoActual && destinoActual !== origenSeleccionado && existeOpcion(destino, destinoActual)) {
      destino.value = destinoActual;
      return;
    }

    destino.value = "";
  }

  function existeOpcion(select, value) {
    return Array.from(select.options).some(function (option) {
      return option.value === value;
    });
  }

  function configurarSelectorFecha(ui, validator) {
    const campoFecha = ui.campos.fecha;
    const controlFecha = campoFecha.closest(".reserva-field__control--fecha");

    campoFecha.min = validator.obtenerHoyISO();

    campoFecha.addEventListener("click", function () {
      abrirCalendarioNativo(campoFecha);
    });

    controlFecha?.addEventListener("click", function (evento) {
      if (evento.target === campoFecha) {
        return;
      }

      abrirCalendarioNativo(campoFecha);
    });
  }

  function abrirCalendarioNativo(campoFecha) {
    campoFecha.focus();

    if (typeof campoFecha.showPicker !== "function") {
      return;
    }

    try {
      campoFecha.showPicker();
    } catch (error) {
      // Algunos navegadores solo permiten showPicker durante gestos directos del usuario.
    }
  }

  function actualizarContador(ui, validator) {
    if (!ui.contador) {
      return;
    }

    const longitud = ui.campos.observaciones.value.length;
    const limite = validator.LIMITES.observacionesMax;

    ui.contador.textContent = `${longitud}/${limite} caracteres`;
    ui.contador.classList.toggle("reserva-ayuda-campo--error", longitud > limite);
  }

  function registrarOActualizarReserva(ui, estado, storage, validator) {
    normalizarCampoAlPerderFoco(ui, "nombre", validator);
    normalizarCampoAlPerderFoco(ui, "observaciones", validator);
    sincronizarDisponibilidadAsientos(ui, estado);
    actualizarResumen(ui);

    const datos = obtenerDatosFormulario(ui);
    const resultado = validator.validarReserva(datos, {
      asientoDisponible: asientoDisponibleParaReserva(datos, estado),
    });

    aplicarResultadoValidacion(ui, validator, resultado);

    if (!resultado.valido || !ui.form.checkValidity()) {
      mostrarMensaje(ui, resultado.primerError || "Revise los campos marcados.", false);
      enfocarPrimerCampoInvalido(ui, resultado.errores);
      return;
    }

    const reserva = storage.guardar(datos);
    estado.reservas = storage.listar();
    estado.ultimaReserva = reserva;
    sincronizarDisponibilidadAsientos(ui, estado);
    limpiarEstadoCampo(ui, "asiento");
    actualizarResumen(ui);
    mostrarMensaje(ui, `Reserva ${reserva.codigo} registrada correctamente.`, true);
    mostrarConfirmacionReserva(ui, reserva);
  }

  function obtenerDatosFormulario(ui) {
    return {
      nombre: ui.campos.nombre.value,
      dni: ui.campos.dni.value,
      origen: ui.campos.origen.value,
      destino: ui.campos.destino.value,
      fecha: obtenerFechaVisual(ui),
      asiento: obtenerAsientoSeleccionado(ui),
      observaciones: ui.campos.observaciones.value,
    };
  }

  function obtenerFechaVisual(ui) {
    return window.ReservasValidaciones.convertirISOAFecha(ui.campos.fecha.value);
  }

  function obtenerAsientoSeleccionado(ui) {
    const elegido = ui.asientoInputs.find(function (input) {
      return input.checked;
    });

    return elegido ? elegido.value : "";
  }

  function aplicarResultadoValidacion(ui, validator, resultado) {
    FIELD_NAMES.forEach(function (nombreCampo) {
      const estadoCampo = resultado.campos[nombreCampo] || { valido: true, mensaje: "" };
      aplicarEstadoCampo(ui, nombreCampo, estadoCampo);
    });

    actualizarContador(ui, validator);
  }

  function validarCampo(ui, estado, validator, nombreCampo) {
    const datos = obtenerDatosFormulario(ui);
    const resultadoCampo = validator.validarCampo(nombreCampo, datos, {
      asientoDisponible: asientoDisponibleParaReserva(datos, estado),
    });

    aplicarEstadoCampo(ui, nombreCampo, resultadoCampo);
    limpiarMensajeGlobal(ui);
  }

  function aplicarEstadoCampo(ui, nombreCampo, resultado) {
    const mensaje = resultado.valido ? resultado.mensajeExito || "" : resultado.mensaje;

    if (nombreCampo === "asiento") {
      aplicarEstadoAsiento(ui, resultado);
      return;
    }

    const campo = ui.campos[nombreCampo];
    const feedback = ui.feedback[nombreCampo];

    if (!campo) {
      return;
    }

    campo.setCustomValidity(resultado.valido ? "" : resultado.mensaje);
    campo.classList.toggle("is-valid", resultado.valido && campo.value.trim() !== "");
    campo.classList.toggle("is-invalid", !resultado.valido);
    campo.setAttribute("aria-invalid", String(!resultado.valido));

    if (feedback) {
      feedback.textContent = mensaje;
      feedback.classList.toggle("reserva-feedback--ok", resultado.valido && mensaje !== "");
      feedback.classList.toggle("reserva-feedback--error", !resultado.valido);
    }
  }

  function aplicarEstadoAsiento(ui, resultado) {
    const primerAsiento = ui.asientoInputs.find(function (input) {
      return !input.disabled;
    });
    const mapa = ui.form.querySelector(".reserva-bus-map");
    const feedback = ui.feedback.asiento;
    const tieneSeleccion = Boolean(obtenerAsientoSeleccionado(ui));

    if (primerAsiento) {
      primerAsiento.setCustomValidity(resultado.valido ? "" : resultado.mensaje);
    }

    mapa?.classList.toggle("is-valid", resultado.valido && tieneSeleccion);
    mapa?.classList.toggle("is-invalid", !resultado.valido);
    mapa?.setAttribute("aria-invalid", String(!resultado.valido));

    if (feedback) {
      feedback.textContent = resultado.valido ? resultado.mensajeExito || "" : resultado.mensaje;
      feedback.classList.toggle("reserva-feedback--ok", resultado.valido && tieneSeleccion);
      feedback.classList.toggle("reserva-feedback--error", !resultado.valido);
    }
  }

  function asientoDisponibleParaReserva(datos, estado) {
    if (!datos.asiento || !datos.origen || !datos.destino || !datos.fecha) {
      return true;
    }

    if (estado.asientoOcupadosBase.includes(datos.asiento)) {
      return false;
    }

    return !estado.reservas.some(function (reserva) {
      return (
        reserva.asiento === datos.asiento &&
        reserva.origen === datos.origen &&
        reserva.destino === datos.destino &&
        reserva.fecha === datos.fecha
      );
    });
  }

  function sincronizarDisponibilidadAsientos(ui, estado) {
    const datos = obtenerDatosFormulario(ui);
    const ocupadosPorViaje = obtenerAsientosReservadosParaViaje(datos, estado);
    const ocupados = new Set(estado.asientoOcupadosBase.concat(ocupadosPorViaje));

    ui.asientoInputs.forEach(function (input) {
      const ocupado = ocupados.has(input.value);
      const label = ui.form.querySelector(`label[for="${input.id}"]`);

      input.disabled = ocupado;

      if (ocupado && input.checked) {
        input.checked = false;
      }

      if (label) {
        label.classList.toggle("reserva-seat--reservado", ocupado);
        label.setAttribute(
          "aria-label",
          ocupado ? `Asiento ${input.value} ocupado` : `Asiento ${input.value} disponible`
        );
      }
    });
  }

  function obtenerAsientosReservadosParaViaje(datos, estado) {
    if (!datos.origen || !datos.destino || !datos.fecha) {
      return [];
    }

    return estado.reservas
      .filter(function (reserva) {
        return (
          reserva.origen === datos.origen &&
          reserva.destino === datos.destino &&
          reserva.fecha === datos.fecha
        );
      })
      .map(function (reserva) {
        return reserva.asiento;
      });
  }

  function actualizarResumen(ui) {
    const asiento = obtenerAsientoSeleccionado(ui);

    ui.asientoSeleccionado.textContent = asiento
      ? `Asiento seleccionado: ${asiento}`
      : "Asiento seleccionado: ninguno";
    ui.resumen.origen.textContent = ui.campos.origen.value || "Por seleccionar";
    ui.resumen.destino.textContent = ui.campos.destino.value || "Por seleccionar";
    ui.resumen.fecha.textContent = obtenerFechaVisual(ui) || "Por seleccionar";
    ui.resumen.asiento.textContent = asiento || "Por seleccionar";
  }

  function limpiarFormulario(ui, estado, validator) {
    ui.form.reset();
    reconstruirOpcionesDestino(ui, estado);
    ui.asientoInputs.forEach(function (input) {
      input.checked = false;
      input.setCustomValidity("");
    });

    FIELD_NAMES.forEach(function (nombreCampo) {
      limpiarEstadoCampo(ui, nombreCampo);
    });

    actualizarContador(ui, validator);
    sincronizarDisponibilidadAsientos(ui, estado);
    actualizarResumen(ui);
    limpiarMensajeGlobal(ui);
    ui.campos.nombre.focus();
  }

  function limpiarEstadoCampo(ui, nombreCampo) {
    if (nombreCampo === "asiento") {
      const mapa = ui.form.querySelector(".reserva-bus-map");
      mapa?.classList.remove("is-valid", "is-invalid");
      mapa?.removeAttribute("aria-invalid");

      if (ui.feedback.asiento) {
        ui.feedback.asiento.textContent = "";
        ui.feedback.asiento.classList.remove("reserva-feedback--ok", "reserva-feedback--error");
      }

      return;
    }

    const campo = ui.campos[nombreCampo];
    const feedback = ui.feedback[nombreCampo];

    campo?.classList.remove("is-valid", "is-invalid");
    campo?.removeAttribute("aria-invalid");
    campo?.setCustomValidity("");

    if (feedback) {
      feedback.textContent = "";
      feedback.classList.remove("reserva-feedback--ok", "reserva-feedback--error");
    }
  }

  function mostrarConfirmacionReserva(ui, reserva) {
    llenarComprobante(ui, reserva);

    if (!ui.confirmacion.modal || !window.bootstrap?.Modal) {
      return;
    }

    window.bootstrap.Modal.getOrCreateInstance(ui.confirmacion.modal).show();
  }

  function llenarComprobante(ui, reserva) {
    const datos = obtenerDatosComprobante(reserva);

    escribirTexto(ui.confirmacion.codigo, datos.codigo);
    escribirTexto(ui.confirmacion.nombre, datos.nombre);
    escribirTexto(ui.confirmacion.dni, datos.dni);
    escribirTexto(ui.confirmacion.ruta, datos.ruta);
    escribirTexto(ui.confirmacion.fecha, datos.fecha);
    escribirTexto(ui.confirmacion.asiento, datos.asiento);
    escribirTexto(ui.confirmacion.precio, datos.precio);
    escribirTexto(ui.confirmacion.estado, datos.estado);
  }

  function imprimirComprobante(reserva) {
    if (!reserva) {
      return;
    }

    const ventana = window.open("", "_blank", "width=820,height=720");

    if (!ventana) {
      window.print();
      return;
    }

    ventana.document.write(crearHtmlComprobante(reserva));
    ventana.document.close();
    ventana.focus();
    ventana.print();
  }

  function descargarComprobante(reserva) {
    if (!reserva) {
      return;
    }

    const blob = new Blob([crearTextoComprobante(reserva)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = `${reserva.codigo || "comprobante-reserva"}.txt`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }

  function obtenerDatosComprobante(reserva) {
    return {
      codigo: reserva.codigo,
      nombre: reserva.nombre,
      dni: reserva.dni,
      ruta: `${reserva.origen} - ${reserva.destino}`,
      fecha: reserva.fecha,
      asiento: reserva.asiento,
      precio: formatearPrecio(reserva),
      estado: formatearEstado(reserva.estado),
    };
  }

  function crearTextoComprobante(reserva) {
    const datos = obtenerDatosComprobante(reserva);

    return [
      "ETSA Sol Amazonense - Comprobante de reserva",
      `Codigo: ${datos.codigo}`,
      `Pasajero: ${datos.nombre}`,
      `DNI: ${datos.dni}`,
      `Ruta: ${datos.ruta}`,
      `Fecha: ${datos.fecha}`,
      `Asiento: ${datos.asiento}`,
      `Precio: ${datos.precio}`,
      `Estado: ${datos.estado}`,
    ].join("\n");
  }

  function crearHtmlComprobante(reserva) {
    const datos = obtenerDatosComprobante(reserva);

    return `
      <!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Comprobante ${escaparHtml(datos.codigo)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; }
          h1 { margin: 0 0 8px; font-size: 26px; }
          p { margin: 0 0 24px; color: #475569; }
          dl { display: grid; grid-template-columns: 160px 1fr; gap: 12px 18px; }
          dt { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 12px; }
          dd { margin: 0; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>ETSA Sol Amazonense</h1>
        <p>Comprobante de reserva</p>
        <dl>
          <dt>Codigo</dt><dd>${escaparHtml(datos.codigo)}</dd>
          <dt>Pasajero</dt><dd>${escaparHtml(datos.nombre)}</dd>
          <dt>DNI</dt><dd>${escaparHtml(datos.dni)}</dd>
          <dt>Ruta</dt><dd>${escaparHtml(datos.ruta)}</dd>
          <dt>Fecha</dt><dd>${escaparHtml(datos.fecha)}</dd>
          <dt>Asiento</dt><dd>${escaparHtml(datos.asiento)}</dd>
          <dt>Precio</dt><dd>${escaparHtml(datos.precio)}</dd>
          <dt>Estado</dt><dd>${escaparHtml(datos.estado)}</dd>
        </dl>
      </body>
      </html>
    `;
  }

  function formatearPrecio(reserva) {
    const precio = Number(reserva.precio || 85);

    return `S/ ${precio.toFixed(2)}`;
  }

  function formatearEstado(estado) {
    const texto = String(estado || "pendiente").trim();

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  function escribirTexto(elemento, texto) {
    if (elemento) {
      elemento.textContent = texto || "-";
    }
  }

  function enfocarPrimerCampoInvalido(ui, errores) {
    const primerCampo = FIELD_NAMES.find(function (nombreCampo) {
      return errores[nombreCampo];
    });

    if (!primerCampo) {
      return;
    }

    if (primerCampo === "asiento") {
      ui.asientoInputs.find(function (input) {
        return !input.disabled;
      })?.focus();
      return;
    }

    ui.campos[primerCampo]?.focus();
  }

  function mostrarMensaje(ui, texto, ok) {
    ui.mensaje.className = `reserva-mensaje ${ok ? "reserva-ok" : "reserva-error-dom"}`;
    ui.mensaje.textContent = texto;
  }

  function limpiarMensajeGlobal(ui) {
    ui.mensaje.textContent = "";
    ui.mensaje.className = "reserva-mensaje";
  }

  function escaparHtml(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function byId(id) {
    return document.getElementById(id);
  }
})();
