document.addEventListener("DOMContentLoaded", function () {
  const formulario = document.getElementById("formulario-reserva");
  if (!formulario) return;

  const origen = document.getElementById("reserva-origen");
  const destino = document.getElementById("reserva-destino");
  const fecha = document.getElementById("reserva-fecha");
  const mensaje = document.getElementById("mensaje-adicional");
  const contador = document.getElementById("contador-mensaje");
  const salidaAsiento = document.getElementById("asiento-seleccionado");
  const resumenOrigen = document.getElementById("resumen-origen");
  const resumenDestino = document.getElementById("resumen-destino");
  const resumenFecha = document.getElementById("resumen-fecha");
  const resumenAsiento = document.getElementById("resumen-asiento");
  const salidaMensaje = document.getElementById("mensaje-reserva");
  const asientos = formulario.querySelectorAll(".reserva-seat-input");

  function asientoActual() {
    const elegido = formulario.querySelector(".reserva-seat-input:checked");
    return elegido ? elegido.value : "";
  }

  function limpiarMensaje() {
    if (!salidaMensaje) return;
    salidaMensaje.classList.remove("reserva-ok", "reserva-error-dom");
    salidaMensaje.textContent = "";
  }

  function mostrarMensaje(texto, correcto) {
    if (!salidaMensaje) return;
    salidaMensaje.textContent = texto;
    salidaMensaje.classList.add(correcto ? "reserva-ok" : "reserva-error-dom");
  }

  function actualizarResumen() {
    const asiento = asientoActual();
    if (resumenOrigen) resumenOrigen.textContent = origen.value || "Por seleccionar";
    if (resumenDestino) resumenDestino.textContent = destino.value || "Por seleccionar";
    if (resumenFecha) resumenFecha.textContent = fecha.value || "Por seleccionar";
    if (resumenAsiento) resumenAsiento.textContent = asiento || "Por seleccionar";
    if (salidaAsiento) {
      salidaAsiento.textContent = asiento
        ? "Asiento seleccionado: " + asiento
        : "Asiento seleccionado: ninguno";
    }
  }

  function actualizarContador() {
    if (!mensaje || !contador) return;
    contador.textContent = mensaje.value.length + "/200 caracteres";
  }

  [origen, destino, fecha].forEach(function (campo) {
    if (!campo) return;
    campo.addEventListener("change", function () {
      limpiarMensaje();
      actualizarResumen();
    });
    campo.addEventListener("input", function () {
      limpiarMensaje();
      actualizarResumen();
    });
  });

  asientos.forEach(function (asiento) {
    asiento.addEventListener("change", function () {
      limpiarMensaje();
      actualizarResumen();
    });
  });

  if (mensaje) {
    mensaje.addEventListener("input", actualizarContador);
  }

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limpiarMensaje();

    const errores = [
      [!origen.value, "Seleccione una ciudad de origen."],
      [!destino.value, "Seleccione una ciudad de destino."],
      [origen.value === destino.value, "El origen y el destino deben ser diferentes."],
      [!fecha.value, "Ingrese la fecha de viaje."],
      [!asientoActual(), "Seleccione un asiento disponible."]
    ];
    const error = errores.find(function (item) {
      return item[0];
    });

    if (error) {
      mostrarMensaje(error[1], false);
      return;
    }

    mostrarMensaje("Solicitud validada correctamente. Tu reserva esta lista para ser enviada.", true);
  });

  actualizarContador();
  actualizarResumen();
});
