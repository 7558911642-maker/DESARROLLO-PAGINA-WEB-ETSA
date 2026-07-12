
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const formulario = document.getElementById("formulario-pregunta-frecuente");

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
        requerido: false,
        patron: "9\\d{8}",
        maximo: 9,
        modoEntrada: "numeric",
        autocompletar: "tel",
        normalizar: soloDigitosPeruanos,
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
        mensajes: {
          requerido: "Escriba su pregunta.",
          minimo: "La pregunta debe tener al menos 15 caracteres.",
          maximo: "La pregunta no debe superar 700 caracteres."
        }
      }
    }
  });
});

function soloDigitosPeruanos(valor) {
  return valor.replace(/\D/g, "").slice(0, 9);
}
