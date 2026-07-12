
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const formulario = document.getElementById("formulario-libro-reclamos");

  if (!formulario || !window.EtsaValidacionesFormularios) return;

  window.EtsaValidacionesFormularios.crear(formulario, {
    campos: {
      nombre: {
        requerido: true,
        minimo: 3,
        maximo: 80,
        patron: "[\\p{L}\\s]+",
        autocompletar: "name",
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
        patron: "9\\d{8}",
        maximo: 9,
        modoEntrada: "numeric",
        autocompletar: "tel",
        normalizar: soloDigitosPeruanos,
        mensajes: {
          requerido: "Ingrese su numero de celular.",
          patron: "Ingrese un celular peruano valido de 9 digitos."
        }
      },
      asunto: {
        requerido: true,
        minimo: 5,
        maximo: 100,
        mensajes: {
          requerido: "Ingrese el asunto del reclamo.",
          minimo: "El asunto debe tener al menos 5 caracteres."
        }
      },
      mensaje: {
        requerido: true,
        minimo: 20,
        maximo: 1000,
        mensajes: {
          requerido: "Describa el detalle del reclamo.",
          minimo: "El detalle debe tener al menos 20 caracteres.",
          maximo: "El detalle no debe superar 1000 caracteres."
        }
      }
    }
  });
});

function soloDigitosPeruanos(valor) {
  return valor.replace(/\D/g, "").slice(0, 9);
}
