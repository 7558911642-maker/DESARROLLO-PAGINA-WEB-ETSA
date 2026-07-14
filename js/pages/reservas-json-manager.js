"use strict";

(function (global) {
  const CONFIG_DEFAULT = {
    version: "1.0.0",
    moneda: "PEN",
    precioBase: 0,
    estadoInicial: "pendiente",
    rutas: [],
    asientosOcupados: [],
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

  async function actualizarOcupadas() {
    const datosOcupados = await obtenerJson("/api/reservas/ocupadas");

    if (!Array.isArray(datosOcupados?.data)) {
      return listar();
    }

    reservasOcupadas = normalizarReservasOcupadas(datosOcupados.data);
    return listar();
  }

  function listar() {
    return [...reservasOcupadas];
  }

  async function guardar(datos) {
    const payload = await enviarJsonConFallback("/api/reservas", datos);

    const reserva = normalizarReservaRespuesta(payload.data);
    reservasOcupadas = [extraerReservaOcupada(reserva), ...reservasOcupadas];

    return reserva;
  }

  function obtenerAsientosOcupados() {
    return [...(configuracion.asientosOcupados || CONFIG_DEFAULT.asientosOcupados)].map(String);
  }

  function obtenerConfiguracion() {
    return {
      ...configuracion,
      rutas: copiarRutas(configuracion.rutas),
      asientosOcupados: obtenerAsientosOcupados(),
    };
  }

  async function obtenerJson(endpoint) {
    let ultimoError = null;

    for (const url of obtenerEndpointsApi(endpoint)) {
      try {
        const respuesta = await fetch(url, {
          headers: { "Accept": "application/json" },
          cache: "no-store",
        });

        const payload = await leerRespuestaJson(respuesta);

        if (respuesta.ok) {
          return payload;
        }

        if (esPayloadApi(payload)) {
          return null;
        }
      } catch (error) {
        ultimoError = error;
      }
    }

    if (ultimoError) {
      console.info("No se pudo conectar con la API de reservas.", ultimoError);
    }

    return null;
  }

  async function enviarJsonConFallback(endpoint, datos) {
    let ultimoError = null;

    for (const url of obtenerEndpointsApi(endpoint)) {
      try {
        const respuesta = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(datos),
        });

        const payload = await leerRespuestaJson(respuesta);
        const respuestaApi = esPayloadApi(payload);

        if (!respuesta.ok || payload.ok === false) {
          const mensaje = obtenerMensajeApi(payload) || "No se pudo registrar la reserva.";

          if (respuestaApi) {
            throw new Error(mensaje);
          }

          ultimoError = new Error(mensaje);
          continue;
        }

        return payload;
      } catch (error) {
        ultimoError = error;

        if (error?.message && !esErrorDeConexion(error)) {
          throw error;
        }
      }
    }

    if (esErrorDeConexion(ultimoError)) {
      throw new Error(obtenerMensajeConexionApi());
    }

    throw ultimoError || new Error("No se pudo conectar con el servidor de reservas.");
  }

  function obtenerEndpointsApi(endpoint) {
    const endpoints = [endpoint];

    if (typeof endpoint === "string" && endpoint.startsWith("/api/") && esEntornoLocal()) {
      const hostLocal = obtenerHostApiLocal(window.location.hostname);

      endpoints.push(`http://${hostLocal}:3000${endpoint}`);
      endpoints.push(`http://localhost:3000${endpoint}`);
      endpoints.push(`http://127.0.0.1:3000${endpoint}`);
    }

    return Array.from(new Set(endpoints));
  }

  function esEntornoLocal() {
    const host = String(window.location.hostname || "").replace(/^\[|\]$/g, "");

    return (
      window.location.protocol === "file:" ||
      /^(localhost|127\.0\.0\.1|::1)$/i.test(host)
    );
  }

  function obtenerMensajeConexionApi() {
    if (esEntornoLocal()) {
      return "No se pudo confirmar la reserva. Verifica que el servidor Express este activo en http://localhost:3000.";
    }

    return "No se pudo confirmar la reserva porque la API de reservas no esta activa en este despliegue. Vuelve a desplegar el proyecto con la carpeta api incluida.";
  }

  function obtenerHostApiLocal(hostname) {
    const host = String(hostname || "localhost").replace(/^\[|\]$/g, "");

    if (host === "::1") {
      return "[::1]";
    }

    if (/^(localhost|127\.0\.0\.1)$/i.test(host)) {
      return host;
    }

    return "localhost";
  }

  function esPayloadApi(payload) {
    return Boolean(payload && (
      Object.prototype.hasOwnProperty.call(payload, "ok") ||
      Object.prototype.hasOwnProperty.call(payload, "mensaje") ||
      Object.prototype.hasOwnProperty.call(payload, "errores")
    ));
  }

  function esErrorDeConexion(error) {
    return error instanceof TypeError || /fetch|network|failed|conectar|Load failed/i.test(error?.message || "");
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
      rutas: normalizarRutas(datos?.rutas),
      asientosOcupados: Array.isArray(asientos.ocupadosIniciales)
        ? asientos.ocupadosIniciales.map(String)
        : CONFIG_DEFAULT.asientosOcupados,
    };
  }

  function normalizarRutas(rutas) {
    if (!Array.isArray(rutas)) {
      return copiarRutas(CONFIG_DEFAULT.rutas);
    }

    return rutas
      .map(function (ruta) {
        return {
          origen: String(ruta?.origen || "").trim(),
          destinos: normalizarDestinos(ruta?.destinos),
        };
      })
      .filter(function (ruta) {
        return ruta.origen && ruta.destinos.length > 0;
      });
  }

  function normalizarDestinos(destinos) {
    if (!Array.isArray(destinos)) {
      return [];
    }

    return destinos
      .map(function (destino) {
        if (typeof destino === "string") {
          return {
            ciudad: destino.trim(),
            precio: Number(configuracion.precioBase || CONFIG_DEFAULT.precioBase),
          };
        }

        return {
          ciudad: String(destino?.ciudad || destino?.destino || destino?.nombre || "").trim(),
          precio: Number(destino?.precio),
        };
      })
      .filter(function (destino) {
        return destino.ciudad && Number.isFinite(destino.precio);
      });
  }

  function copiarRutas(rutas) {
    return (Array.isArray(rutas) ? rutas : []).map(function (ruta) {
      return {
        origen: ruta.origen,
        destinos: ruta.destinos.map(function (destino) {
          return { ...destino };
        }),
      };
    });
  }

  function obtenerPrecioRuta(origen, destino) {
    const ruta = configuracion.rutas.find(function (item) {
      return item.origen === origen;
    });
    const conexion = ruta?.destinos.find(function (item) {
      return item.ciudad === destino;
    });

    if (conexion && Number.isFinite(conexion.precio)) {
      return conexion.precio;
    }

    return Number(configuracion.precioBase || CONFIG_DEFAULT.precioBase);
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
    actualizarOcupadas,
    listar,
    guardar,
    obtenerAsientosOcupados,
    obtenerConfiguracion,
    obtenerPrecioRuta,
    obtenerPersistencia: function () {
      return persistencia;
    },
  };
})(window);
