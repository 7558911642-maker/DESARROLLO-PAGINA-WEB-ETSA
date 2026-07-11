"use strict";

(function () {
  const FORM_SELECTOR = "#formTestimonio";
  const TEXTO_REGEX = /^[\p{L}\s'.-]+$/u;
  const MENSAJE_REGEX = /^[\p{L}\p{N}\s.,;:¿?¡!()'"%-]+$/u;

  const MENSAJES = {
    nombre: {
      requerido: "Ingresa tu nombre completo.",
      minimo: "El nombre debe tener al menos 3 caracteres.",
      maximo: "El nombre no debe superar los 60 caracteres.",
      patron: "Usa solo letras, espacios y caracteres basicos como apostrofe o guion.",
      valido: "Nombre valido."
    },
    tipo: {
      requerido: "Indica el tipo de usuario, por ejemplo: pasajero frecuente.",
      minimo: "El tipo de usuario debe tener al menos 3 caracteres.",
      maximo: "El tipo de usuario no debe superar los 50 caracteres.",
      patron: "Usa solo letras, espacios y caracteres basicos como apostrofe o guion.",
      valido: "Tipo de usuario valido."
    },
    calificacion: {
      requerido: "Selecciona una calificacion del servicio.",
      valido: "Calificacion seleccionada."
    },
    mensaje: {
      requerido: "Escribe tu testimonio.",
      minimo: "El testimonio debe tener al menos 20 caracteres.",
      maximo: "El testimonio no debe superar los 500 caracteres.",
      patron: "Evita caracteres especiales no necesarios en el testimonio.",
      valido: "Testimonio valido."
    }
  };

  document.addEventListener("DOMContentLoaded", inicializarFormularioTestimonio);

  function inicializarFormularioTestimonio() {
    const formulario = document.querySelector(FORM_SELECTOR);
    if (!formulario) return;

    const campos = crearCampos(formulario);

    campos.forEach(function (campo) {
      configurarRestricciones(campo);
      campo.elemento.addEventListener("input", function () {
        campo.tocado = true;
        validarCampo(campo);
      });

      campo.elemento.addEventListener("blur", function () {
        campo.elemento.value = normalizarValor(campo.elemento.value);
        campo.tocado = true;
        validarCampo(campo);
      });

      campo.elemento.addEventListener("change", function () {
        campo.tocado = true;
        validarCampo(campo);
      });
    });

    formulario.addEventListener("submit", function (evento) {
      const primerCampoInvalido = validarFormulario(campos);

      if (!primerCampoInvalido) return;

      evento.preventDefault();
      primerCampoInvalido.focus();
      primerCampoInvalido.reportValidity();
    });
  }

  function crearCampos(formulario) {
    return [
      {
        nombre: "nombre",
        elemento: formulario.elements.nombre,
        mensaje: document.getElementById("nombreMensaje"),
        validar: validarNombreOTipo
      },
      {
        nombre: "tipo",
        elemento: formulario.elements.tipo,
        mensaje: document.getElementById("tipoMensaje"),
        validar: validarNombreOTipo
      },
      {
        nombre: "calificacion",
        elemento: formulario.elements.calificacion,
        mensaje: document.getElementById("calificacionMensaje"),
        validar: validarCalificacion
      },
      {
        nombre: "mensaje",
        elemento: formulario.elements.mensaje,
        mensaje: document.getElementById("mensajeMensaje"),
        validar: validarMensaje
      }
    ].filter(function (campo) {
      return campo.elemento && campo.mensaje;
    });
  }

  function configurarRestricciones(campo) {
    const restricciones = {
      nombre: { required: true, minLength: 3, maxLength: 60 },
      tipo: { required: true, minLength: 3, maxLength: 50 },
      calificacion: { required: true },
      mensaje: { required: true, minLength: 20, maxLength: 500 }
    }[campo.nombre];

    if (!restricciones) return;

    campo.elemento.required = Boolean(restricciones.required);

    if (restricciones.minLength) {
      campo.elemento.minLength = restricciones.minLength;
    }

    if (restricciones.maxLength) {
      campo.elemento.maxLength = restricciones.maxLength;
    }
  }

  function validarFormulario(campos) {
    let primerCampoInvalido = null;

    campos.forEach(function (campo) {
      campo.tocado = true;
      const esValido = validarCampo(campo);

      if (!esValido && !primerCampoInvalido) {
        primerCampoInvalido = campo.elemento;
      }
    });

    return primerCampoInvalido;
  }

  function validarCampo(campo) {
    const valor = campo.elemento.value.trim();
    const mensaje = campo.validar(campo.nombre, valor);
    const esValido = mensaje === "";

    campo.elemento.setCustomValidity(mensaje);
    campo.elemento.classList.toggle("is-valid", campo.tocado && esValido);
    campo.elemento.classList.toggle("is-invalid", campo.tocado && !esValido);
    campo.elemento.setAttribute("aria-invalid", String(!esValido));

    actualizarMensaje(campo, esValido ? MENSAJES[campo.nombre].valido : mensaje, esValido);

    return esValido;
  }

  function validarNombreOTipo(nombreCampo, valor) {
    const mensajes = MENSAJES[nombreCampo];

    if (!valor) return mensajes.requerido;
    if (valor.length < 3) return mensajes.minimo;
    if (valor.length > (nombreCampo === "nombre" ? 60 : 50)) return mensajes.maximo;
    if (!TEXTO_REGEX.test(valor)) return mensajes.patron;

    return "";
  }

  function validarCalificacion(nombreCampo, valor) {
    if (!valor) return MENSAJES[nombreCampo].requerido;
    return "";
  }

  function validarMensaje(nombreCampo, valor) {
    const mensajes = MENSAJES[nombreCampo];

    if (!valor) return mensajes.requerido;
    if (valor.length < 20) return mensajes.minimo;
    if (valor.length > 500) return mensajes.maximo;
    if (!MENSAJE_REGEX.test(valor)) return mensajes.patron;

    return "";
  }

  function actualizarMensaje(campo, texto, esValido) {
    campo.mensaje.textContent = campo.tocado ? texto : "";
    campo.mensaje.classList.toggle("testimonio-form__mensaje--success", campo.tocado && esValido);
    campo.mensaje.classList.toggle("testimonio-form__mensaje--error", campo.tocado && !esValido);
  }

  function normalizarValor(valor) {
    return valor.replace(/\s+/g, " ").trim();
  }
})();
