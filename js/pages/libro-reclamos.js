
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const formulario = document.getElementById("formulario-libro-reclamos");

  if (!formulario || !window.EtsaValidacionesFormularios) return;

  const { patrones, utilidades } = window.EtsaValidacionesFormularios;

  let validador;

  validador = window.EtsaValidacionesFormularios.crear(formulario, {
    campos: {
      nombre: {
        requerido: true,
        minimo: 3,
        maximo: 80,
        patron: patrones.nombreSimple,
        autocompletar: "name",
        normalizar: function (valor) {
          return utilidades.normalizarEntradaTexto(valor, 80);
        },
        mensajes: {
          requerido: "Ingrese sus nombres y apellidos.",
          minimo: "El nombre debe tener al menos 3 caracteres.",
          patron: "Use solo letras y espacios."
        }
      },
      correo: {
        requerido: true,
        maximo: 120,
        autocompletar: "email",
        mensajes: {
          requerido: "Ingrese un correo electronico.",
          email: "Ingrese un correo electronico valido."
        }
      },
      telefono: {
        requerido: true,
        patron: patrones.celularPeru,
        maximo: 9,
        modoEntrada: "numeric",
        autocompletar: "tel",
        normalizar: utilidades.soloDigitosPeruanos,
        mensajes: {
          requerido: "Ingrese su numero de celular.",
          patron: "Ingrese un celular peruano valido de 9 digitos."
        }
      },
      asunto: {
        requerido: true,
        minimo: 5,
        maximo: 100,
        normalizar: function (valor) {
          return utilidades.normalizarEntradaTexto(valor, 100);
        },
        validar: function (valor) {
          return utilidades.validarSinHtml(valor, "No use etiquetas HTML en el asunto.");
        },
        mensajes: {
          requerido: "Ingrese el asunto del reclamo.",
          minimo: "El asunto debe tener al menos 5 caracteres."
        }
      },
      mensaje: {
        requerido: true,
        minimo: 20,
        maximo: 1000,
        normalizar: function (valor) {
          return utilidades.normalizarEntradaTexto(valor, 1000);
        },
        validar: function (valor) {
          return utilidades.validarSinHtml(valor, "No use etiquetas HTML en el detalle.");
        },
        mensajes: {
          requerido: "Describa el detalle del reclamo.",
          minimo: "El detalle debe tener al menos 20 caracteres.",
          maximo: "El detalle no debe superar 1000 caracteres."
        }
      }
    },
    alEnviarValido: function (evento, datos) {
      evento.preventDefault();

      if (!window.EtsaApiFormularios) return;

      window.EtsaApiFormularios.enviar(formulario, "/api/reclamos", datos, {
        mensajeExito: "Reclamo registrado correctamente. Nuestro equipo lo revisara.",
        alExito: function () {
          validador?.limpiar();
        }
      });
    }
  });
});
