"use strict";

(function (global) {
  const CONFIG_DEFAULT = {
    version: "1.0.0",
    moneda: "PEN",
    precioBase: 85,
    estadoInicial: "pendiente",
    asientosOcupados: ["2", "4", "6", "8", "10", "13"],
  };

  let configuracion = { ...CONFIG_DEFAULT };
  let reservasOcupadas = [];
  let persistencia = "api-json";

  async function inicializar() {
    persistencia = "api-json";

    const datosConfig = await obtenerJson("/api/reservas/config");
    const datosOcupados = await obtenerJson("/api/reservas/ocupadas");

    configuracion = normalizarConfiguracion(datosConfig?.data);
    reservasOcupadas = normalizarReservasOcupadas(datosOcupados?.data || []);

    return {
      persistencia,
      configuracion,
    };
  }

  function listar() {
    return [...reservasOcupadas];
  }

  async function guardar(datos) {
    const respuesta = await fetch("/api/reservas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(datos),
    });

    const payload = await leerRespuestaJson(respuesta);

    if (!respuesta.ok || payload.ok === false) {
      throw new Error(obtenerMensajeApi(payload) || "No se pudo registrar la reserva.");
    }

    const reserva = normalizarReservaRespuesta(payload.data);
    reservasOcupadas = [extraerReservaOcupada(reserva), ...reservasOcupadas];

    return reserva;
  }

  function obtenerAsientosOcupados() {
    return [...(configuracion.asientosOcupados || CONFIG_DEFAULT.asientosOcupados)].map(String);
  }

  function obtenerConfiguracion() {
    return { ...configuracion };
  }

  async function obtenerJson(endpoint) {
    try {
      const respuesta = await fetch(endpoint, {
        headers: { "Accept": "application/json" },
        cache: "no-store",
      });

      if (!respuesta.ok) {
        return null;
      }

      return await respuesta.json();
    } catch (error) {
      console.info("No se pudo conectar con la API de reservas.", error);
      return null;
    }
  }

  async function leerRespuestaJson(respuesta) {
    try {
      return await respuesta.json();
    } catch (error) {
      return {};
    }
  }

  function obtenerMensajeApi(payload) {
    if (payload?.mensaje) {
      return payload.mensaje;
    }

    if (payload?.errores && typeof payload.errores === "object") {
      return Object.values(payload.errores).find(Boolean) || "";
    }

    return "";
  }

  function normalizarConfiguracion(datos) {
    const defaults = datos?.defaults || {};
    const asientos = datos?.asientos || {};

    return {
      ...CONFIG_DEFAULT,
      version: datos?.version || CONFIG_DEFAULT.version,
      moneda: defaults.moneda || CONFIG_DEFAULT.moneda,
      precioBase: Number(defaults.precioBase || CONFIG_DEFAULT.precioBase),
      estadoInicial: defaults.estadoInicial || CONFIG_DEFAULT.estadoInicial,
      asientosOcupados: Array.isArray(asientos.ocupadosIniciales)
        ? asientos.ocupadosIniciales.map(String)
        : CONFIG_DEFAULT.asientosOcupados,
    };
  }

  function normalizarReservasOcupadas(reservas) {
    if (!Array.isArray(reservas)) {
      return [];
    }

    return reservas.map(function (reserva) {
      return {
        origen: String(reserva.origen || "").trim(),
        destino: String(reserva.destino || "").trim(),
        fecha: convertirISOAFecha(reserva.fecha),
        asiento: String(reserva.asiento || "").trim(),
      };
    });
  }

  function normalizarReservaRespuesta(reserva) {
    return {
      ...reserva,
      fecha: convertirISOAFecha(reserva?.fecha),
      asiento: String(reserva?.asiento || ""),
    };
  }

  function extraerReservaOcupada(reserva) {
    return {
      origen: reserva.origen,
      destino: reserva.destino,
      fecha: reserva.fecha,
      asiento: String(reserva.asiento),
    };
  }

  function convertirISOAFecha(valor) {
    const texto = String(valor || "").trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      const partes = texto.split("-");
      return [partes[2], partes[1], partes[0]].join("/");
    }

    return texto;
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
