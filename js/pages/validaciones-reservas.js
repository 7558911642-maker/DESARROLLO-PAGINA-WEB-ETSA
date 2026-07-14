"use strict";

(function (global) {
  const LIMITES = {
    nombreMin: 3,
    nombreMax: 80,
    dni: 8,
    observacionesMax: 250,
    diasMaximosReserva: 365,
  };

  const MENSAJES_OK = {
    nombre: "Nombre validado.",
    dni: "DNI validado.",
    origen: "Origen seleccionado.",
    destino: "Destino seleccionado.",
    fecha: "Fecha disponible para validar.",
    asiento: "Asiento disponible.",
    observaciones: "Observaciones dentro del limite permitido.",
  };
  const RUTAS_RESERVA_OFICIALES = [
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

  function aplicarRestriccionesNativas(campos) {
    configurarCampo(campos.nombre, {
      required: true,
      minLength: LIMITES.nombreMin,
      maxLength: LIMITES.nombreMax,
      autoComplete: "name",
    });

    configurarCampo(campos.dni, {
      required: true,
      minLength: LIMITES.dni,
      maxLength: LIMITES.dni,
      pattern: "\\d{8}",
      inputMode: "numeric",
      autoComplete: "off",
    });

    configurarCampo(campos.origen, { required: true });
    configurarCampo(campos.destino, { required: true });

    configurarCampo(campos.fecha, {
      required: true,
      min: obtenerHoyISO(),
      max: obtenerFechaMaximaISO(),
      autoComplete: "off",
    });

    configurarCampo(campos.observaciones, {
      maxLength: LIMITES.observacionesMax,
    });
  }

  function configurarCampo(campo, atributos) {
    if (!campo) {
      return;
    }

    Object.keys(atributos).forEach(function (nombre) {
      const valor = atributos[nombre];

      if (valor === true) {
        campo.setAttribute(nombre.toLowerCase(), "");
        return;
      }

      campo.setAttribute(nombre.toLowerCase(), String(valor));
    });
  }

  function validarReserva(datos, opciones) {
    const campos = {};
    const errores = {};

    Object.keys(validadores).forEach(function (nombreCampo) {
      campos[nombreCampo] = validarCampo(nombreCampo, datos, opciones);

      if (!campos[nombreCampo].valido) {
        errores[nombreCampo] = campos[nombreCampo].mensaje;
      }
    });

    const primerError = Object.keys(errores)[0] ? errores[Object.keys(errores)[0]] : "";

    return {
      valido: Object.keys(errores).length === 0,
      campos,
      errores,
      primerError,
    };
  }

  function validarCampo(nombreCampo, datos, opciones) {
    if (!validadores[nombreCampo]) {
      return crearResultado(true, "");
    }

    return validadores[nombreCampo](datos, opciones || {});
  }

  const validadores = {
    nombre: function (datos) {
      const nombre = normalizarNombre(datos.nombre);

      if (!nombre) {
        return crearResultado(false, "Ingrese los nombres y apellidos del pasajero.");
      }

      if (nombre.length < LIMITES.nombreMin) {
        return crearResultado(false, `El nombre debe tener al menos ${LIMITES.nombreMin} caracteres.`);
      }

      if (nombre.length > LIMITES.nombreMax) {
        return crearResultado(false, `El nombre no puede superar ${LIMITES.nombreMax} caracteres.`);
      }

      if (!/^[a-zA-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00dc\u00d1\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1\s'.-]+$/.test(nombre)) {
        return crearResultado(false, "El nombre solo puede contener letras, espacios y signos basicos.");
      }

      if (nombre.split(" ").filter(Boolean).length < 2) {
        return crearResultado(false, "Ingrese nombres y apellidos completos.");
      }

      return crearResultado(true, "", MENSAJES_OK.nombre);
    },

    dni: function (datos) {
      const dni = normalizarDni(datos.dni);

      if (!dni) {
        return crearResultado(false, "Ingrese el numero de DNI.");
      }

      if (!/^\d+$/.test(dni)) {
        return crearResultado(false, "El DNI solo debe contener numeros.");
      }

      if (dni.length !== LIMITES.dni) {
        return crearResultado(false, `El DNI debe contener exactamente ${LIMITES.dni} digitos.`);
      }

      if (/^(\d)\1{7}$/.test(dni)) {
        return crearResultado(false, "Ingrese un DNI valido.");
      }

      return crearResultado(true, "", MENSAJES_OK.dni);
    },

    origen: function (datos, opciones) {
      if (!datos.origen) {
        return crearResultado(false, "Seleccione una ciudad de origen.");
      }

      if (!buscarRutaReserva(obtenerRutasReserva(opciones), datos.origen)) {
        return crearResultado(false, "Origen no disponible.");
      }

      if (datos.destino && datos.origen === datos.destino) {
        return crearResultado(false, "El origen y el destino deben ser diferentes.");
      }

      return crearResultado(true, "", MENSAJES_OK.origen);
    },

    destino: function (datos, opciones) {
      if (!datos.destino) {
        return crearResultado(false, "Seleccione una ciudad de destino.");
      }

      if (datos.origen && datos.origen === datos.destino) {
        return crearResultado(false, "El destino debe ser diferente al origen.");
      }

      if (
        datos.origen &&
        !buscarDestinoReserva(obtenerRutasReserva(opciones), datos.origen, datos.destino) &&
        !precioReservaValido(datos.precio)
      ) {
        return crearResultado(false, "Destino no disponible para el origen seleccionado.");
      }

      return crearResultado(true, "", MENSAJES_OK.destino);
    },

    fecha: function (datos) {
      const fechaIso = convertirFechaAISO(datos.fecha);

      if (!normalizarEspacios(datos.fecha)) {
        return crearResultado(false, "Ingrese la fecha de viaje.");
      }

      if (!fechaIso) {
        return crearResultado(false, "Use una fecha valida con formato dd/mm/aaaa.");
      }

      if (fechaIso < obtenerHoyISO()) {
        return crearResultado(false, "La fecha de viaje no puede ser anterior a hoy.");
      }

      if (fechaIso > obtenerFechaMaximaISO()) {
        return crearResultado(false, `La reserva no puede superar ${LIMITES.diasMaximosReserva} dias de anticipacion.`);
      }

      return crearResultado(true, "", MENSAJES_OK.fecha);
    },

    asiento: function (datos, opciones) {
      if (!datos.asiento) {
        return crearResultado(false, "Seleccione un asiento disponible.");
      }

      if (opciones.asientoDisponible === false) {
        return crearResultado(false, "El asiento seleccionado ya esta ocupado para esta fecha.");
      }

      return crearResultado(true, "", MENSAJES_OK.asiento);
    },

    observaciones: function (datos) {
      const observaciones = datos.observaciones || "";

      if (observaciones.length > LIMITES.observacionesMax) {
        return crearResultado(false, `Las observaciones no pueden superar ${LIMITES.observacionesMax} caracteres.`);
      }

      if (/[<>]/.test(observaciones)) {
        return crearResultado(false, "No use etiquetas HTML en las observaciones.");
      }

      return crearResultado(true, observaciones ? "" : "", observaciones ? MENSAJES_OK.observaciones : "");
    },
  };

  function crearResultado(valido, mensaje, mensajeExito) {
    return {
      valido,
      mensaje,
      mensajeExito: mensajeExito || "",
    };
  }

  function obtenerRutasReserva(opciones) {
    const rutas = new Map();

    normalizarRutasReserva(RUTAS_RESERVA_OFICIALES).forEach(function (ruta) {
      rutas.set(normalizarClaveRuta(ruta.origen), ruta);
    });

    normalizarRutasReserva(opciones?.rutas).forEach(function (ruta) {
      const clave = normalizarClaveRuta(ruta.origen);

      if (!rutas.has(clave)) {
        rutas.set(clave, ruta);
      }
    });

    return Array.from(rutas.values());
  }

  function normalizarRutasReserva(rutas) {
    if (!Array.isArray(rutas)) {
      return [];
    }

    return rutas
      .map(function (ruta) {
        return {
          origen: normalizarEspacios(ruta?.origen),
          destinos: normalizarDestinosReserva(ruta?.destinos),
        };
      })
      .filter(function (ruta) {
        return ruta.origen && ruta.destinos.length > 0;
      });
  }

  function normalizarDestinosReserva(destinos) {
    if (!Array.isArray(destinos)) {
      return [];
    }

    return destinos
      .map(function (destino) {
        if (typeof destino === "string") {
          return { ciudad: normalizarEspacios(destino), precio: null };
        }

        const precio = Number(destino?.precio);

        return {
          ciudad: normalizarEspacios(destino?.ciudad || destino?.destino || destino?.nombre),
          precio: Number.isFinite(precio) ? precio : null,
        };
      })
      .filter(function (destino) {
        return destino.ciudad;
      });
  }

  function buscarRutaReserva(rutas, origen) {
    const origenBuscado = normalizarClaveRuta(origen);

    return rutas.find(function (ruta) {
      return normalizarClaveRuta(ruta.origen) === origenBuscado;
    }) || null;
  }

  function buscarDestinoReserva(rutas, origen, destino) {
    const ruta = buscarRutaReserva(rutas, origen);
    const destinoBuscado = normalizarClaveRuta(destino);

    return ruta?.destinos.find(function (item) {
      return normalizarClaveRuta(item.ciudad) === destinoBuscado;
    }) || null;
  }

  function precioReservaValido(valor) {
    const precio = Number(valor);

    return Number.isFinite(precio) && precio > 0;
  }

  function normalizarNombre(valor) {
    return normalizarEspacios(valor).replace(/\s{2,}/g, " ");
  }

  function normalizarDni(valor) {
    return String(valor || "").replace(/\D/g, "").slice(0, LIMITES.dni);
  }

  function normalizarEspacios(valor) {
    return String(valor || "").trim();
  }

  function normalizarClaveRuta(valor) {
    return normalizarEspacios(valor)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function limitarTexto(valor, limite) {
    return String(valor || "").slice(0, limite);
  }

  function formatearFechaMientrasEscribe(valor) {
    const digitos = String(valor || "").replace(/\D/g, "").slice(0, 8);
    const partes = [];

    if (digitos.length > 0) {
      partes.push(digitos.slice(0, 2));
    }

    if (digitos.length > 2) {
      partes.push(digitos.slice(2, 4));
    }

    if (digitos.length > 4) {
      partes.push(digitos.slice(4, 8));
    }

    return partes.join("/");
  }

  function convertirFechaAISO(valor) {
    const texto = normalizarEspacios(valor);

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      const partesIso = texto.split("-");
      const anioIso = Number(partesIso[0]);
      const mesIso = Number(partesIso[1]);
      const diaIso = Number(partesIso[2]);

      return fechaValida(anioIso, mesIso, diaIso) ? texto : "";
    }

    const partes = texto.split("/");

    if (partes.length !== 3) {
      return "";
    }

    const dia = Number(partes[0]);
    const mes = Number(partes[1]);
    const anio = Number(partes[2]);
    if (!dia || !mes || !anio) {
      return "";
    }

    if (!fechaValida(anio, mes, dia)) {
      return "";
    }

    return [
      String(anio).padStart(4, "0"),
      String(mes).padStart(2, "0"),
      String(dia).padStart(2, "0"),
    ].join("-");
  }

  function convertirISOAFecha(valor) {
    const fechaIso = convertirFechaAISO(valor);

    if (!fechaIso) {
      return "";
    }

    const partes = fechaIso.split("-");

    return [partes[2], partes[1], partes[0]].join("/");
  }

  function fechaValida(anio, mes, dia) {
    const fecha = new Date(anio, mes - 1, dia);

    return (
      fecha.getDate() === dia &&
      fecha.getMonth() === mes - 1 &&
      fecha.getFullYear() === anio
    );
  }

  function obtenerHoyISO() {
    const hoy = new Date();
    const local = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000);

    return local.toISOString().slice(0, 10);
  }

  function obtenerFechaMaximaISO() {
    const maxima = new Date();
    maxima.setDate(maxima.getDate() + LIMITES.diasMaximosReserva);
    const local = new Date(maxima.getTime() - maxima.getTimezoneOffset() * 60000);

    return local.toISOString().slice(0, 10);
  }

  global.ReservasValidaciones = {
    LIMITES,
    aplicarRestriccionesNativas,
    validarCampo,
    validarReserva,
    normalizarNombre,
    normalizarDni,
    normalizarEspacios,
    limitarTexto,
    formatearFechaMientrasEscribe,
    convertirFechaAISO,
    convertirISOAFecha,
    obtenerHoyISO,
  };
})(window);
