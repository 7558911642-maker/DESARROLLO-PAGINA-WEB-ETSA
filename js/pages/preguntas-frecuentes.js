
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const formulario = document.getElementById("formulario-pregunta-frecuente");

  if (!formulario || !window.EtsaValidacionesFormularios) return;

  const { patrones, utilidades } = window.EtsaValidacionesFormularios;

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
        requerido: false,
        patron: patrones.celularPeru,
        maximo: 9,
        modoEntrada: "numeric",
        autocompletar: "tel",
        normalizar: utilidades.soloDigitosPeruanos,
        mensajes: {
          patron: "Ingrese un celular peruano valido de 9 digitos."
        }
      },
      categoria: {
        requerido: true,
        mensajes: {
          requerido: "Seleccione el tema de su consulta."
        }
      },
      pregunta: {
        requerido: true,
        minimo: 15,
        maximo: 700,
        normalizar: function (valor) {
          return utilidades.normalizarEntradaTexto(valor, 700);
        },
        validar: function (valor) {
          return utilidades.validarSinHtml(valor, "No use etiquetas HTML en la pregunta.");
        },
        mensajes: {
          requerido: "Escriba su pregunta.",
          minimo: "La pregunta debe tener al menos 15 caracteres.",
          maximo: "La pregunta no debe superar 700 caracteres."
        }
      }
    }
  });
});
