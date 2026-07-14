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
    resumenPrecio: "resumen-precio",
    totalPrecio: "reserva-total",
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
  const MENSAJE_EXITO_MS = 15000;
  const RUTAS_PRECIO = [
    {
      origen: "Chachapoyas",
      destinos: [
        { ciudad: "Pedro Ruiz", precio: 10 },
        { ciudad: "Bagua Grande", precio: 25 },
        { ciudad: "Luya", precio: 10 },
        { ciudad: "Pomacochas", precio: 20 },
      ],
    },
    {
      origen: "Pedro Ruiz",
      destinos: [
        { ciudad: "Chachapoyas", precio: 10 },
        { ciudad: "Bagua Grande", precio: 15 },
        { ciudad: "Pomacochas", precio: 15 },
      ],
    },
    {
      origen: "Bagua Grande",
      destinos: [
        { ciudad: "Chachapoyas", precio: 25 },
        { ciudad: "Pedro Ruiz", precio: 15 },
      ],
    },
    {
      origen: "Luya",
      destinos: [
        { ciudad: "Chachapoyas", precio: 10 },
      ],
    },
    {
      origen: "Pomacochas",
      destinos: [
        { ciudad: "Pedro Ruiz", precio: 15 },
        { ciudad: "Chachapoyas", precio: 20 },
      ],
    },
  ];

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

    await storage.inicializar();
    const configuracion = storage.obtenerConfiguracion();

    const estado = {
      reservas: storage.listar(),
      asientoOcupadosBase: storage.obtenerAsientosOcupados(),
      rutas: obtenerRutasDisponibles(configuracion),
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
    actualizarResumen(ui, estado);
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
        precio: byId(SELECTORS.resumenPrecio),
      },
      totalPrecio: byId(SELECTORS.totalPrecio),
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
      actualizarResumen(ui, estado);
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
        actualizarResumen(ui, estado);
        validarCampo(ui, estado, validator, nombreCampo);
      });
    });

    ui.campos.origen.addEventListener("change", function () {
      reconstruirOpcionesDestino(ui, estado);
      sincronizarDisponibilidadAsientos(ui, estado);
      actualizarResumen(ui, estado);
      validarCampo(ui, estado, validator, "origen");
      validarCampo(ui, estado, validator, "destino");
      validarCampo(ui, estado, validator, "asiento");
    });

    ui.campos.destino.addEventListener("change", function () {
      sincronizarDisponibilidadAsientos(ui, estado);
      actualizarResumen(ui, estado);
      validarCampo(ui, estado, validator, "origen");
      validarCampo(ui, estado, validator, "destino");
      validarCampo(ui, estado, validator, "asiento");
    });

    ui.asientoInputs.forEach(function (input) {
      input.addEventListener("change", function () {
        actualizarResumen(ui, estado);
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

  function obtenerRutasDisponibles(configuracion) {
    const rutasConfig = Array.isArray(configuracion?.rutas) ? configuracion.rutas : [];
    const rutas = new Map();

    normalizarRutas(RUTAS_PRECIO).forEach(function (ruta) {
      rutas.set(normalizarClaveRuta(ruta.origen), ruta);
    });

    normalizarRutas(rutasConfig).forEach(function (ruta) {
      const clave = normalizarClaveRuta(ruta.origen);

      if (!rutas.has(clave)) {
        rutas.set(clave, ruta);
      }
    });

    return Array.from(rutas.values());
  }

  function normalizarRutas(rutas) {
    return (Array.isArray(rutas) ? rutas : [])
      .map(function (ruta) {
        return {
          origen: normalizarTextoRuta(ruta?.origen),
          destinos: normalizarDestinosRuta(ruta?.destinos),
        };
      })
      .filter(function (ruta) {
        return ruta.origen && ruta.destinos.length > 0;
      });
  }

  function normalizarDestinosRuta(destinos) {
    if (!Array.isArray(destinos)) {
      return [];
    }

    return destinos
      .map(function (destino) {
        if (typeof destino === "string") {
          return {
            ciudad: normalizarTextoRuta(destino),
            precio: null,
          };
        }

        const precio = Number(destino?.precio);

        return {
          ciudad: normalizarTextoRuta(destino?.ciudad || destino?.destino || destino?.nombre),
          precio: Number.isFinite(precio) ? precio : null,
        };
      })
      .filter(function (destino) {
        return destino.ciudad;
      });
  }

  function reconstruirOpcionesDestino(ui, estado, opciones) {
    const destino = ui.campos.destino;
    const origenSeleccionado = ui.campos.origen.value;
    const destinoActual = opciones?.valorSeleccionado ?? destino.value;
    const destinosDirectos = obtenerDestinosDirectos(estado, origenSeleccionado);
    const fragment = document.createDocumentFragment();
    const placeholder = new Option(DESTINO_PLACEHOLDER, "", true, true);

    placeholder.disabled = true;
    fragment.appendChild(placeholder);

    destinosDirectos
      .forEach(function (destinoDirecto) {
        const option = new Option(destinoDirecto.ciudad, destinoDirecto.ciudad);
        if (Number.isFinite(Number(destinoDirecto.precio))) {
          option.dataset.precio = String(destinoDirecto.precio);
        }
        fragment.appendChild(option);
      });

    destino.replaceChildren(fragment);

    if (destinoActual && destinoActual !== origenSeleccionado && existeOpcion(destino, destinoActual)) {
      destino.value = destinoActual;
      return;
    }

    destino.value = "";
  }

  function obtenerDestinosDirectos(estado, origen) {
    if (!origen) {
      return [];
    }

    const ruta = buscarRuta(estado.rutas, origen);

    if (ruta?.destinos?.length) {
      return ruta.destinos;
    }

    return estado.destinosBase
      .filter(function (option) {
        return option.value !== origen;
      })
      .map(function (option) {
        return {
          ciudad: option.value,
          precio: 0,
        };
      });
  }

  function existeOpcion(select, value) {
    return Array.from(select.options).some(function (option) {
      return option.value === value;
    });
  }

  function buscarRuta(rutas, origen) {
    const origenBuscado = normalizarClaveRuta(origen);

    return (Array.isArray(rutas) ? rutas : []).find(function (ruta) {
      return normalizarClaveRuta(ruta.origen) === origenBuscado;
    }) || null;
  }

  function buscarConexion(rutas, origen, destino) {
    const ruta = buscarRuta(rutas, origen);
    const destinoBuscado = normalizarClaveRuta(destino);

    return ruta?.destinos?.find(function (conexion) {
      return normalizarClaveRuta(conexion.ciudad) === destinoBuscado;
    }) || null;
  }

  function normalizarTextoRuta(valor) {
    return String(valor || "").replace(/\s+/g, " ").trim();
  }

  function normalizarClaveRuta(valor) {
    return normalizarTextoRuta(valor)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
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

  async function registrarOActualizarReserva(ui, estado, storage, validator) {
    normalizarCampoAlPerderFoco(ui, "nombre", validator);
    normalizarCampoAlPerderFoco(ui, "observaciones", validator);
    await refrescarReservasOcupadas(ui, estado, storage);
    sincronizarDisponibilidadAsientos(ui, estado);
    actualizarResumen(ui, estado);

    const datos = obtenerDatosFormulario(ui);
    const resultado = validator.validarReserva(datos, {
      rutas: estado.rutas,
      asientoDisponible: asientoDisponibleParaReserva(datos, estado),
    });

    aplicarResultadoValidacion(ui, validator, resultado);

    if (!resultado.valido || !ui.form.checkValidity()) {
      mostrarMensaje(ui, resultado.primerError || "Revise los campos marcados.", false);
      enfocarPrimerCampoInvalido(ui, resultado.errores);
      return;
    }

    let reserva;

    try {
      reserva = await storage.guardar(datos);
    } catch (error) {
      mostrarMensaje(ui, error.message || "No se pudo registrar la reserva en el servidor.", false);
      return;
    }

    estado.reservas = storage.listar();
    estado.ultimaReserva = reserva;
    sincronizarDisponibilidadAsientos(ui, estado);
    limpiarEstadoCampo(ui, "asiento");
    actualizarResumen(ui, estado);
    mostrarMensaje(ui, `Reserva ${reserva.codigo} registrada correctamente.`, true);
    mostrarConfirmacionReserva(ui, reserva);
    limpiarFormularioRegistrado(ui, estado, validator);
  }

  async function refrescarReservasOcupadas(ui, estado, storage) {
    if (typeof storage.actualizarOcupadas !== "function") {
      return;
    }

    estado.reservas = await storage.actualizarOcupadas();
    sincronizarDisponibilidadAsientos(ui, estado);
    actualizarResumen(ui, estado);
  }

  function obtenerDatosFormulario(ui) {
    return {
      nombre: ui.campos.nombre.value,
      dni: ui.campos.dni.value,
      origen: ui.campos.origen.value,
      destino: ui.campos.destino.value,
      fecha: obtenerFechaVisual(ui),
      asiento: obtenerAsientoSeleccionado(ui),
      precio: obtenerPrecioSeleccionado(ui, { rutas: RUTAS_PRECIO }) ?? 0,
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
      rutas: estado.rutas,
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
    if (!datos.asiento || !datos.fecha) {
      return true;
    }

    if (estado.asientoOcupadosBase.includes(datos.asiento)) {
      return false;
    }

    return !estado.reservas.some(function (reserva) {
      return (
        reserva.asiento === datos.asiento &&
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
    if (!datos.fecha) {
      return [];
    }

    return estado.reservas
      .filter(function (reserva) {
        return reserva.fecha === datos.fecha;
      })
      .map(function (reserva) {
        return reserva.asiento;
      });
  }

  function actualizarResumen(ui, estado) {
    const asiento = obtenerAsientoSeleccionado(ui);
    const precio = obtenerPrecioSeleccionado(ui, estado);
    const precioResumen = precio === null ? "Por seleccionar" : formatearMonto(precio);
    const precioTotal = precio === null ? formatearMonto(0) : formatearMonto(precio);

    ui.asientoSeleccionado.textContent = asiento
      ? `Asiento seleccionado: ${asiento}`
      : "Asiento seleccionado: ninguno";
    ui.resumen.origen.textContent = ui.campos.origen.value || "Por seleccionar";
    ui.resumen.destino.textContent = ui.campos.destino.value || "Por seleccionar";
    ui.resumen.fecha.textContent = obtenerFechaVisual(ui) || "Por seleccionar";
    ui.resumen.asiento.textContent = asiento || "Por seleccionar";
    escribirTexto(ui.resumen.precio, precioResumen);
    escribirTexto(ui.totalPrecio, precioTotal);
  }

  function obtenerPrecioSeleccionado(ui, estado) {
    const origen = ui.campos.origen.value;
    const destino = ui.campos.destino.value;
    const precioOption = Number(ui.campos.destino.selectedOptions[0]?.dataset.precio);

    if (!origen || !destino) {
      return null;
    }

    if (Number.isFinite(precioOption)) {
      return precioOption;
    }

    const conexion = buscarConexion(estado?.rutas, origen, destino);
    const precioConexion = Number(conexion?.precio);

    return Number.isFinite(precioConexion) ? precioConexion : null;
  }

  function limpiarFormulario(ui, estado, validator) {
    limpiarCamposFormulario(ui, estado, validator);
    limpiarMensajeGlobal(ui);
    ui.campos.nombre.focus();
  }

  function limpiarFormularioRegistrado(ui, estado, validator) {
    limpiarCamposFormulario(ui, estado, validator);
  }

  function limpiarCamposFormulario(ui, estado, validator) {
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
    actualizarResumen(ui, estado);
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
    const precio = Number(reserva.precio || 0);

    return formatearMonto(precio);
  }

  function formatearMonto(precio) {
    const monto = Number.isFinite(Number(precio)) ? Number(precio) : 0;

    return `S/ ${monto.toFixed(2)}`;
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
    if (ui.mensaje.dataset.reservaMensajeTimer) {
      window.clearTimeout(Number(ui.mensaje.dataset.reservaMensajeTimer));
      delete ui.mensaje.dataset.reservaMensajeTimer;
    }

    ui.mensaje.setAttribute("role", "alert");
    ui.mensaje.setAttribute("aria-live", ok ? "polite" : "assertive");
    ui.mensaje.className = `reserva-mensaje alert ${ok ? "alert-success reserva-ok" : "alert-danger reserva-error-dom"} d-flex align-items-center justify-content-center gap-2 mb-0`;
    escribirMensajeConIcono(ui.mensaje, texto, ok);
    ui.mensaje.dataset.reservaMensajeTimer = String(window.setTimeout(function () {
      limpiarMensajeGlobal(ui);
    }, MENSAJE_EXITO_MS));
  }

  function limpiarMensajeGlobal(ui) {
    if (ui.mensaje.dataset.reservaMensajeTimer) {
      window.clearTimeout(Number(ui.mensaje.dataset.reservaMensajeTimer));
      delete ui.mensaje.dataset.reservaMensajeTimer;
    }

    ui.mensaje.textContent = "";
    ui.mensaje.className = "reserva-mensaje";
    ui.mensaje.setAttribute("role", "status");
    ui.mensaje.setAttribute("aria-live", "polite");
  }

  function escribirMensajeConIcono(contenedor, mensaje, ok) {
    const icono = document.createElement("i");
    icono.className = ok ? "bi bi-check-circle-fill" : "bi bi-exclamation-triangle-fill";
    icono.setAttribute("aria-hidden", "true");

    const texto = document.createElement("span");
    texto.textContent = mensaje;

    contenedor.textContent = "";
    contenedor.append(icono, texto);
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
