// Validaciones del formulario de reserva
document.addEventListener("DOMContentLoaded", function () {
  const $ = function (id) { return document.getElementById(id); };
  const form = $("formulario-reserva");
  if (!form) return;

  const nombre = $("reserva-nombre"), dni = $("reserva-dni"), origen = $("reserva-origen"), destino = $("reserva-destino");
  const fecha = $("reserva-fecha"), obs = $("mensaje-adicional"), contador = $("contador-mensaje"), aviso = $("mensaje-reserva");
  const salidaAsiento = $("asiento-seleccionado"), resumenOrigen = $("resumen-origen"), resumenDestino = $("resumen-destino");
  const resumenFecha = $("resumen-fecha"), resumenAsiento = $("resumen-asiento");
  form.noValidate = true;

  function asiento() {
    const elegido = form.querySelector(".reserva-seat-input:checked");
    return elegido ? elegido.value : "";
  }

  function isoFecha(valor) {
    const partes = valor.trim().split("/");
    if (partes.length !== 3) return "";

    const dia = Number(partes[0]);
    const mes = Number(partes[1]);
    const anio = Number(partes[2]);
    const fecha = new Date(anio, mes - 1, dia);

    if (!dia || !mes || !anio) return "";
    if (fecha.getDate() !== dia || fecha.getMonth() !== mes - 1 || fecha.getFullYear() !== anio) return "";
    if (dia < 10) partes[0] = "0" + dia;
    if (mes < 10) partes[1] = "0" + mes;

    return anio + "-" + partes[1] + "-" + partes[0];
  }

  function hoy() {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function mostrar(texto, ok) {
    aviso.className = "reserva-mensaje " + (ok ? "reserva-ok" : "reserva-error-dom");
    aviso.textContent = texto;
  }

  function actualizar() {
    const a = asiento();
    contador.textContent = obs.value.length + "/250 caracteres";
    salidaAsiento.textContent = a ? "Asiento seleccionado: " + a : "Asiento seleccionado: ninguno";
    resumenOrigen.textContent = origen.value || "Por seleccionar";
    resumenDestino.textContent = destino.value || "Por seleccionar";
    resumenFecha.textContent = fecha.value || "Por seleccionar";
    resumenAsiento.textContent = a || "Por seleccionar";
    aviso.textContent = "";
  }

  function soloLetras(texto) {
    const permitidas = "abcdefghijklmnñopqrstuvwxyzáéíóúü ";
    for (let i = 0; i < texto.length; i++) {
      if (!permitidas.includes(texto[i].toLowerCase())) return false;
    }
    return true;
  }

  function soloNumeros(texto) {
    for (let i = 0; i < texto.length; i++) {
      if (texto[i] < "0" || texto[i] > "9") return false;
    }
    return true;
  }

  function validar() {
    const n = nombre.value.trim();
    const d = dni.value.trim();
    const f = fecha.value.trim();
    const iso = isoFecha(f);

    if (n === "") return "Ingrese su nombre completo.";
    if (!soloLetras(n)) return "El nombre solo debe contener letras y espacios.";
    if (n.length < 3) return "Ingrese un nombre válido (mínimo 3 caracteres).";
    if (d === "") return "Ingrese su número de DNI.";
    if (!soloNumeros(d)) return "El DNI solo debe contener números.";
    if (d.length !== 8) return "El DNI debe contener exactamente 8 dígitos.";
    if (origen.value === "") return "Seleccione una ciudad de origen.";
    if (destino.value === "") return "Seleccione una ciudad de destino.";
    if (origen.value === destino.value) return "El origen y el destino deben ser diferentes.";
    if (f === "") return "Seleccione una fecha de viaje.";
    if (iso === "" || iso < hoy()) return "Seleccione una fecha válida desde el día de hoy.";
    if (asiento() === "") return "Seleccione un asiento disponible.";
    if (obs.value.length > 250) return "Las observaciones no pueden superar los 250 caracteres. (Opcional)";

    return "";
  }

  form.addEventListener("input", actualizar);
  form.addEventListener("change", actualizar);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    actualizar();
    const error = validar();
    if (error) return mostrar(error, false);
    mostrar("\u2705 Solicitud validada correctamente. Se muestra el resumen de la reserva", true);
  });

  actualizar();
});
