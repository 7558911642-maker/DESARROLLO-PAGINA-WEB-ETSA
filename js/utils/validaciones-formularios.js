"use strict";

(function () {
  const CLASES = {
    valido: "is-valid",
    invalido: "is-invalid",
    feedbackError: "invalid-feedback",
    feedbackExito: "valid-feedback"
  };

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
      const esValido = validarFormulario(campos, true);

      if (!esValido) {
        evento.preventDefault();
        enfocarPrimerCampoInvalido(campos);
        return;
      }

      if (typeof configuracion.alEnviarValido === "function") {
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

  window.EtsaValidacionesFormularios = {
    crear
  };
})();
