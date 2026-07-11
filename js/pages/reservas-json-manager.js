"use strict";

(function (global) {
  const STORAGE_KEY = "etsa.reservas.registros";
  const CONFIG_KEY = "etsa.reservas.configuracion";

  const CONFIG_DEFAULT = {
    version: "1.0.0",
    moneda: "PEN",
    precioBase: 85,
    estadoInicial: "pendiente",
    asientosOcupados: ["2", "4", "6", "8", "10", "13"],
  };

  const memoria = {
    reservas: [],
    configuracion: { ...CONFIG_DEFAULT },
  };

  let configuracion = { ...CONFIG_DEFAULT };
  let persistencia = "localStorage";

  async function inicializar(opciones) {
    persistencia = puedeUsarLocalStorage() ? "localStorage" : "memoria";
    const datosJson = await leerJsonInicial(opciones?.fuenteJson);

    configuracion = normalizarConfiguracion(datosJson);
    guardarConfiguracion(configuracion);

    if (!existeColeccion()) {
      guardarColeccion(normalizarReservas(datosJson?.reservas || []));
    }

    return {
      persistencia,
      configuracion,
    };
  }

  async function leerJsonInicial(fuenteJson) {
    if (!fuenteJson || typeof fetch !== "function") {
      return null;
    }

    try {
      const respuesta = await fetch(fuenteJson, { cache: "no-store" });

      if (!respuesta.ok) {
        return null;
      }

      return await respuesta.json();
    } catch (error) {
      console.info(
        "No se pudo leer data/reservas.json. Se usara localStorage como almacenamiento del navegador.",
        error
      );
      return null;
    }
  }

  function listar() {
    return leerColeccion().sort(function (a, b) {
      return new Date(b.actualizadoEn || b.creadoEn) - new Date(a.actualizadoEn || a.creadoEn);
    });
  }

  function guardar(datos) {
    const reservas = leerColeccion();
    const ahora = new Date().toISOString();

    const reserva = {
      ...normalizarReserva(datos),
      id: crearId(),
      codigo: crearCodigo(),
      estado: configuracion.estadoInicial || CONFIG_DEFAULT.estadoInicial,
      moneda: configuracion.moneda || CONFIG_DEFAULT.moneda,
      precio: configuracion.precioBase || CONFIG_DEFAULT.precioBase,
      creadoEn: ahora,
      actualizadoEn: ahora,
    };

    reservas.push(reserva);
    guardarColeccion(reservas);

    return reserva;
  }

  function obtenerAsientosOcupados() {
    return [...(configuracion.asientosOcupados || CONFIG_DEFAULT.asientosOcupados)].map(String);
  }

  function obtenerConfiguracion() {
    return { ...configuracion };
  }

  function normalizarConfiguracion(datosJson) {
    const defaults = datosJson?.defaults || {};
    const asientos = datosJson?.asientos || {};

    return {
      ...CONFIG_DEFAULT,
      version: datosJson?.version || CONFIG_DEFAULT.version,
      moneda: defaults.moneda || CONFIG_DEFAULT.moneda,
      precioBase: Number(defaults.precioBase || CONFIG_DEFAULT.precioBase),
      estadoInicial: defaults.estadoInicial || CONFIG_DEFAULT.estadoInicial,
      asientosOcupados: Array.isArray(asientos.ocupadosIniciales)
        ? asientos.ocupadosIniciales.map(String)
        : CONFIG_DEFAULT.asientosOcupados,
    };
  }

  function normalizarReservas(reservas) {
    if (!Array.isArray(reservas)) {
      return [];
    }

    return reservas.map(function (reserva) {
      return {
        ...normalizarReserva(reserva),
        id: reserva.id || crearId(),
        codigo: reserva.codigo || crearCodigo(),
        estado: reserva.estado || configuracion.estadoInicial,
        moneda: reserva.moneda || configuracion.moneda,
        precio: Number(reserva.precio || configuracion.precioBase),
        creadoEn: reserva.creadoEn || new Date().toISOString(),
        actualizadoEn: reserva.actualizadoEn || reserva.creadoEn || new Date().toISOString(),
      };
    });
  }

  function normalizarReserva(datos) {
    return {
      nombre: String(datos.nombre || "").trim(),
      dni: String(datos.dni || "").trim(),
      origen: String(datos.origen || "").trim(),
      destino: String(datos.destino || "").trim(),
      fecha: String(datos.fecha || "").trim(),
      asiento: String(datos.asiento || "").trim(),
      observaciones: String(datos.observaciones || "").trim(),
    };
  }

  function existeColeccion() {
    if (persistencia === "memoria") {
      return memoria.reservas.length > 0;
    }

    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  function leerColeccion() {
    if (persistencia === "memoria") {
      return [...memoria.reservas];
    }

    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (error) {
      console.warn("No se pudo leer la coleccion de reservas.", error);
      return [];
    }
  }

  function guardarColeccion(reservas) {
    if (persistencia === "memoria") {
      memoria.reservas = [...reservas];
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservas));
  }

  function guardarConfiguracion(datos) {
    if (persistencia === "memoria") {
      memoria.configuracion = { ...datos };
      return;
    }

    localStorage.setItem(CONFIG_KEY, JSON.stringify(datos));
  }

  function puedeUsarLocalStorage() {
    try {
      const prueba = "__etsa_reservas_test__";
      localStorage.setItem(prueba, prueba);
      localStorage.removeItem(prueba);
      return true;
    } catch (error) {
      return false;
    }
  }

  function crearId() {
    if (global.crypto?.randomUUID) {
      return global.crypto.randomUUID();
    }

    return `reserva-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function crearCodigo() {
    const fecha = new Date();
    const parteFecha = fecha.toISOString().slice(0, 10).replace(/-/g, "");
    const aleatorio = Math.random().toString(36).slice(2, 6).toUpperCase();

    return `RSV-${parteFecha}-${aleatorio}`;
  }

  global.ReservasJsonManager = {
    inicializar,
    listar,
    guardar,
    obtenerAsientosOcupados,
    obtenerConfiguracion,
    obtenerPersistencia: function () {
      return persistencia;
    },
  };
})(window);
