
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const formulario = document.querySelector(".testimonio-form");

  if (!formulario || !window.EtsaValidacionesFormularios) return;

  const { patrones, utilidades } = window.EtsaValidacionesFormularios;
  const calificacionesPermitidas = ["1", "2", "3", "4", "5"];

  window.EtsaValidacionesFormularios.crear(formulario, {
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
          requerido: "Ingrese su nombre completo.",
          minimo: "El nombre debe tener al menos 3 caracteres.",
          patron: "Use solo letras y espacios."
        }
      },
      tipo: {
        requerido: true,
        minimo: 3,
        maximo: 60,
        patron: patrones.nombreSimple,
        normalizar: function (valor) {
          return utilidades.normalizarEntradaTexto(valor, 60);
        },
        mensajes: {
          requerido: "Indique el tipo de usuario.",
          minimo: "Ingrese al menos 3 caracteres.",
          patron: "Use solo letras y espacios."
        }
      },
      calificacion: {
        requerido: true,
        validar: function (valor) {
          return valor && !calificacionesPermitidas.includes(valor)
            ? "Seleccione una calificacion valida."
            : "";
        },
        mensajes: {
          requerido: "Seleccione una calificacion."
        }
      },
      mensaje: {
        requerido: true,
        minimo: 20,
        maximo: 600,
        normalizar: function (valor) {
          return utilidades.normalizarEntradaTexto(valor, 600);
        },
        validar: function (valor) {
          return utilidades.validarSinHtml(valor, "No use etiquetas HTML en el testimonio.");
        },
        mensajes: {
          requerido: "Escriba su testimonio.",
          minimo: "El testimonio debe tener al menos 20 caracteres.",
          maximo: "El testimonio no debe superar 600 caracteres."
        }
      }
    }
  });
});
