"use strict";

(function () {
  const CLASES = {
    valido: "is-valid",
    invalido: "is-invalid",
    feedbackError: "invalid-feedback",
    feedbackExito: "valid-feedback"
  };

  const patrones = {
    nombreSimple: "[\\p{L}\\s]+",
    celularPeru: "9\\d{8}",
    dni: "\\d{8}",
    ruc: "\\d{11}"
  };
  const MENSAJE_EXITO_MS = 15000;

  function crear(formulario, configuracion) {
    if (!formulario || !configuracion?.campos) return null;

    formulario.noValidate = true;

    const campos = Object.entries(configuracion.campos)
      .map(([nombre, opciones]) => prepararCampo(formulario, nombre, opciones))
      .filter(Boolean);

    campos.forEach(function (campo) {
      campo.elemento.addEventListener("input", function () {
        aplicarNormalizador(campo);
        campo.interactuado = true;
        validarCampo(campo, false);
      });

      campo.elemento.addEventListener("change", function () {
        aplicarNormalizador(campo);
        campo.interactuado = true;
        validarCampo(campo, false);
      });

      campo.elemento.addEventListener("blur", function () {
        aplicarNormalizador(campo);
        campo.interactuado = true;
        validarCampo(campo, true);
      });
    });

    formulario.addEventListener("submit", function (evento) {
      const manejarEnvio = typeof configuracion.alEnviarValido === "function";
      if (manejarEnvio) {
        evento.preventDefault();
      }

      const esValido = validarFormulario(campos, true);

      if (!esValido) {
        evento.preventDefault();
        enfocarPrimerCampoInvalido(campos);
        return;
      }

      if (manejarEnvio) {
        configuracion.alEnviarValido(evento, obtenerDatos(formulario));
      }
    });

    return {
      validar: function () {
        return validarFormulario(campos, true);
      },
      limpiar: function () {
        limpiarFormulario(formulario, campos);
      }
    };
  }

  function prepararCampo(formulario, nombre, opciones) {
    const elemento = formulario.elements[nombre] || formulario.querySelector(opciones.selector);
    if (!elemento) return null;

    aplicarAtributos(elemento, opciones);

    const feedbackError = asegurarFeedback(elemento, CLASES.feedbackError, `${elemento.id || nombre}-error`);
    const feedbackExito = asegurarFeedback(elemento, CLASES.feedbackExito, `${elemento.id || nombre}-exito`);

    feedbackExito.textContent = opciones.mensajeExito || "Correcto.";
    elemento.setAttribute("aria-describedby", obtenerDescripciones(elemento, feedbackError, feedbackExito));

    return {
      nombre,
      elemento,
      opciones,
      feedbackError,
      feedbackExito,
      interactuado: false
    };
  }

  function aplicarAtributos(elemento, opciones) {
    const atributos = {
      required: opciones.requerido,
      minlength: opciones.minimo,
      maxlength: opciones.maximo,
      pattern: opciones.patron,
      autocomplete: opciones.autocompletar,
      inputmode: opciones.modoEntrada
    };

    Object.entries(atributos).forEach(function ([atributo, valor]) {
      if (valor === undefined || valor === null || valor === false) return;

      if (valor === true) {
        elemento.setAttribute(atributo, "");
        return;
      }

      elemento.setAttribute(atributo, String(valor));
    });
  }

  function asegurarFeedback(elemento, clase, id) {
    let feedback = elemento.parentElement.querySelector(`.${clase}`);

    if (!feedback) {
      feedback = document.createElement("div");
      feedback.className = clase;
      elemento.insertAdjacentElement("afterend", feedback);
    }

    feedback.id = feedback.id || id;
    return feedback;
  }

  function obtenerDescripciones(elemento, feedbackError, feedbackExito) {
    return Array.from(new Set([
      elemento.getAttribute("aria-describedby"),
      feedbackError.id,
      feedbackExito.id
    ].filter(Boolean))).join(" ");
  }

  function aplicarNormalizador(campo) {
    if (typeof campo.opciones.normalizar !== "function") return;

    const valorNormalizado = campo.opciones.normalizar(campo.elemento.value);
    if (valorNormalizado !== campo.elemento.value) {
      campo.elemento.value = valorNormalizado;
    }
  }

  function validarFormulario(campos, mostrarErrores) {
    let formularioValido = true;

    campos.forEach(function (campo) {
      campo.interactuado = campo.interactuado || mostrarErrores;
      formularioValido = validarCampo(campo, mostrarErrores) && formularioValido;
    });

    return formularioValido;
  }

  function validarCampo(campo, mostrarError) {
    const { elemento, opciones } = campo;
    const valor = elemento.value.trim();
    const mensaje = obtenerMensaje(campo, valor);
    const debeMostrarEstado = campo.interactuado || mostrarError;

    elemento.setCustomValidity(mensaje);

    const esValido = elemento.checkValidity();
    const esOpcionalVacio = !opciones.requerido && valor === "";

    if (!debeMostrarEstado || esOpcionalVacio) {
      limpiarEstado(campo);
      return esValido;
    }

    campo.feedbackError.textContent = mensaje;
    elemento.classList.toggle(CLASES.invalido, !esValido);
    elemento.classList.toggle(CLASES.valido, esValido);
    elemento.setAttribute("aria-invalid", String(!esValido));

    return esValido;
  }

  function obtenerMensaje(campo, valor) {
    const { elemento, opciones } = campo;
    const mensajes = opciones.mensajes || {};

    if (opciones.requerido && valor === "") {
      return mensajes.requerido || "Este campo es obligatorio.";
    }

    if (opciones.minimo && valor.length > 0 && valor.length < opciones.minimo) {
      return mensajes.minimo || `Ingrese al menos ${opciones.minimo} caracteres.`;
    }

    if (opciones.maximo && valor.length > opciones.maximo) {
      return mensajes.maximo || `Ingrese como maximo ${opciones.maximo} caracteres.`;
    }

    if (opciones.patron && valor.length > 0) {
      const patron = new RegExp(`^(?:${opciones.patron})$`, "u");
      if (!patron.test(valor)) {
        return mensajes.patron || "Revise el formato del campo.";
      }
    }

    if (elemento.type === "email" && valor.length > 0 && elemento.validity.typeMismatch) {
      return mensajes.email || "Ingrese un correo electronico valido.";
    }

    if (typeof opciones.validar === "function") {
      return opciones.validar(valor, elemento) || "";
    }

    return "";
  }

  function limpiarEstado(campo) {
    campo.elemento.classList.remove(CLASES.valido, CLASES.invalido);
    campo.elemento.removeAttribute("aria-invalid");
    campo.feedbackError.textContent = "";
  }

  function limpiarFormulario(formulario, campos) {
    formulario.reset();
    campos.forEach(function (campo) {
      campo.interactuado = false;
      campo.elemento.setCustomValidity("");
      limpiarEstado(campo);
    });
  }

  function enfocarPrimerCampoInvalido(campos) {
    const campoInvalido = campos.find(function (campo) {
      return !campo.elemento.checkValidity();
    });

    campoInvalido?.elemento.focus();
  }

  function obtenerDatos(formulario) {
    return Object.fromEntries(new FormData(formulario).entries());
  }

  async function enviarApi(formulario, endpoint, datos, opciones) {
    const configuracion = opciones || {};
    const boton = formulario.querySelector('[type="submit"]');
    const estado = asegurarEstadoEnvio(formulario);

    formulario.setAttribute("aria-busy", "true");
    if (boton) {
      boton.disabled = true;
    }

    try {
      const payload = await enviarJsonConFallback(endpoint, datos);
      const mensajeExito = configuracion.mensajeExito || payload.mensaje || "Registro enviado correctamente.";

      if (typeof configuracion.alExito === "function") {
        configuracion.alExito(payload);
      }

      mostrarEstadoEnvio(estado, mensajeExito, true);

      return payload;
    } catch (error) {
      const mensaje = esErrorDeConexion(error)
        ? "No se pudo confirmar el registro. Verifica que el servidor Express este activo en http://localhost:3000."
        : error.message || "No se pudo conectar con el servidor.";

      mostrarEstadoEnvio(estado, mensaje, false);
      return null;
    } finally {
      formulario.removeAttribute("aria-busy");
      if (boton) {
        boton.disabled = false;
      }
    }
  }

  async function enviarJsonConFallback(endpoint, datos) {
    let ultimoError = null;

    for (const url of obtenerEndpointsApi(endpoint)) {
      try {
        const respuesta = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(datos)
        });

        const payload = await leerRespuestaJson(respuesta);
        const respuestaApi = esPayloadApi(payload);

        if (!respuesta.ok || payload.ok === false) {
          const mensaje = obtenerMensajeApi(payload) || "No se pudo registrar la informacion.";

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

    throw ultimoError || new Error("No se pudo conectar con el servidor.");
  }

  function obtenerEndpointsApi(endpoint) {
    const endpoints = [endpoint];

    if (typeof endpoint === "string" && endpoint.startsWith("/api/")) {
      const hostLocal = obtenerHostApiLocal(window.location.hostname);

      endpoints.push(`http://${hostLocal}:3000${endpoint}`);
      endpoints.push(`http://localhost:3000${endpoint}`);
      endpoints.push(`http://127.0.0.1:3000${endpoint}`);
    }

    return Array.from(new Set(endpoints));
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
      const primerError = Object.values(payload.errores).find(Boolean);
      if (primerError) {
        return primerError;
      }
    }

    return "";
  }

  function asegurarEstadoEnvio(formulario) {
    let estado = formulario.querySelector("[data-form-api-status]");

    if (!estado) {
      estado = document.createElement("div");
      estado.setAttribute("data-form-api-status", "");
      estado.setAttribute("role", "status");
      estado.setAttribute("aria-live", "polite");
      formulario.appendChild(estado);
    }

    return estado;
  }

  function mostrarEstadoEnvio(estado, mensaje, ok) {
    if (estado.dataset.formStatusTimer) {
      window.clearTimeout(Number(estado.dataset.formStatusTimer));
      delete estado.dataset.formStatusTimer;
    }

    estado.setAttribute("role", "alert");
    estado.setAttribute("aria-live", ok ? "polite" : "assertive");
    estado.className = `alert ${ok ? "alert-success" : "alert-danger"} d-flex align-items-center justify-content-center gap-2 mt-3 mb-0`;
    escribirMensajeConIcono(estado, mensaje, ok);
    estado.dataset.formStatusTimer = String(window.setTimeout(function () {
      estado.textContent = "";
      estado.className = "";
      estado.setAttribute("role", "status");
      estado.setAttribute("aria-live", "polite");
      delete estado.dataset.formStatusTimer;
    }, MENSAJE_EXITO_MS));
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

  function normalizarEntradaTexto(valor, maximo) {
    const texto = String(valor || "")
      .replace(/\s{2,}/g, " ")
      .replace(/^\s+/, "");

    return limitarTexto(texto, maximo);
  }

  function limitarTexto(valor, maximo) {
    const texto = String(valor || "");

    if (!maximo) {
      return texto;
    }

    return texto.slice(0, maximo);
  }

  function soloDigitos(valor, maximo) {
    const digitos = String(valor || "").replace(/\D/g, "");

    if (!maximo) {
      return digitos;
    }

    return digitos.slice(0, maximo);
  }

  function soloDigitosPeruanos(valor) {
    return soloDigitos(valor, 9);
  }

  function validarSinHtml(valor, mensaje) {
    return /[<>]/.test(valor)
      ? mensaje || "No use etiquetas HTML en este campo."
      : "";
  }

  window.EtsaValidacionesFormularios = {
    crear,
    patrones,
    utilidades: {
      limitarTexto,
      normalizarEntradaTexto,
      soloDigitos,
      soloDigitosPeruanos,
      validarSinHtml
    }
  };

  window.EtsaApiFormularios = {
    enviar: enviarApi
  };
})();
