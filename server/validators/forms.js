"use strict";

const crypto = require("crypto");

const NAME_PATTERN = /^[a-zA-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00dc\u00d1\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1\s'.-]+$/;
const SIMPLE_TEXT_PATTERN = /^[\p{L}\d\s.,;:()'"!?/-]+$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^9\d{8}$/;
const DNI_PATTERN = /^\d{8}$/;
const MAX_DAYS_RESERVA = 365;

function validarReserva(body, contexto) {
  const datos = {
    nombre: normalizeText(body.nombre),
    dni: onlyDigits(body.dni).slice(0, 8),
    origen: normalizeText(body.origen),
    destino: normalizeText(body.destino),
    fecha: normalizeDate(body.fecha),
    asiento: normalizeSeat(body.asiento),
    observaciones: normalizeText(body.observaciones || body.mensaje || "", 250)
  };

  const errores = {};
  validarNombreCompleto(datos.nombre, errores, "nombre");

  if (!DNI_PATTERN.test(datos.dni) || /^(\d)\1{7}$/.test(datos.dni)) {
    errores.dni = "Ingrese un DNI valido de 8 digitos.";
  }

  if (!datos.origen) errores.origen = "Seleccione una ciudad de origen.";
  if (!datos.destino) errores.destino = "Seleccione una ciudad de destino.";
  if (datos.origen && datos.destino && datos.origen === datos.destino) {
    errores.destino = "El origen y destino deben ser diferentes.";
  }

  const rutasPermitidas = contexto?.rutas || [];
  const ruta = rutasPermitidas.find((item) => item.origen === datos.origen);
  if (datos.origen && !ruta) errores.origen = "Origen no disponible.";
  if (ruta && datos.destino && !ruta.destinos.includes(datos.destino)) {
    errores.destino = "Destino no disponible para el origen seleccionado.";
  }

  validarFechaReserva(datos.fecha, errores);

  const asientoNumero = Number(datos.asiento);
  const capacidad = Number(contexto?.capacidad || 15);
  if (!Number.isInteger(asientoNumero) || asientoNumero < 1 || asientoNumero > capacidad) {
    errores.asiento = "Seleccione un asiento valido.";
  }

  const ocupadosIniciales = (contexto?.ocupadosIniciales || []).map(String);
  if (ocupadosIniciales.includes(datos.asiento)) {
    errores.asiento = "El asiento seleccionado no esta disponible.";
  }

  const reservas = contexto?.reservas || [];
  const asientoOcupado = reservas.some((reserva) =>
    reserva.origen === datos.origen &&
    reserva.destino === datos.destino &&
    reserva.fecha === datos.fecha &&
    String(reserva.asiento) === datos.asiento
  );
  if (asientoOcupado) {
    errores.asiento = "El asiento seleccionado ya esta reservado para este viaje.";
  }

  if (datos.observaciones && /[<>]/.test(datos.observaciones)) {
    errores.observaciones = "No use etiquetas HTML en las observaciones.";
  }

  return buildResult(datos, errores);
}

function validarReclamo(body) {
  const datos = {
    nombre: normalizeText(body.nombre, 80),
    correo: normalizeText(body.correo, 120).toLowerCase(),
    telefono: onlyDigits(body.telefono).slice(0, 9),
    asunto: normalizeText(body.asunto, 100),
    mensaje: normalizeText(body.mensaje, 1000)
  };

  const errores = {};
  validarNombreCompleto(datos.nombre, errores, "nombre", false);
  validarCorreo(datos.correo, errores);
  validarTelefono(datos.telefono, errores, true);
  validarTexto(datos.asunto, errores, "asunto", 5, 100, "Ingrese el asunto del reclamo.");
  validarTexto(datos.mensaje, errores, "mensaje", 20, 1000, "Describa el detalle del reclamo.");

  return buildResult(datos, errores);
}

function validarPregunta(body) {
  const categorias = ["Reservas", "Encomiendas", "Equipaje", "Pagos", "Otro"];
  const datos = {
    nombre: normalizeText(body.nombre, 80),
    correo: normalizeText(body.correo, 120).toLowerCase(),
    telefono: onlyDigits(body.telefono).slice(0, 9),
    categoria: normalizeText(body.categoria, 40),
    pregunta: normalizeText(body.pregunta, 700)
  };

  const errores = {};
  validarNombreCompleto(datos.nombre, errores, "nombre", false);
  validarCorreo(datos.correo, errores);
  validarTelefono(datos.telefono, errores, false);

  if (!categorias.includes(datos.categoria)) {
    errores.categoria = "Seleccione una categoria valida.";
  }

  validarTexto(datos.pregunta, errores, "pregunta", 15, 700, "Escriba su pregunta.");

  return buildResult(datos, errores);
}

function validarTestimonio(body) {
  const datos = {
    nombre: normalizeText(body.nombre, 80),
    tipo: normalizeText(body.tipo, 60),
    calificacion: normalizeText(body.calificacion, 1),
    mensaje: normalizeText(body.mensaje, 600)
  };

  const errores = {};
  validarNombreCompleto(datos.nombre, errores, "nombre", false);
  validarTexto(datos.tipo, errores, "tipo", 3, 60, "Indique el tipo de usuario.");

  if (!["1", "2", "3", "4", "5"].includes(datos.calificacion)) {
    errores.calificacion = "Seleccione una calificacion valida.";
  }

  validarTexto(datos.mensaje, errores, "mensaje", 20, 600, "Escriba su testimonio.");

  return buildResult(datos, errores);
}

function crearRegistro(tipo, datos, extras) {
  const ahora = new Date().toISOString();

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${tipo}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    codigo: `${tipo.toUpperCase().slice(0, 3)}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    ...datos,
    ...(extras || {}),
    creadoEn: ahora,
    actualizadoEn: ahora
  };
}

function validarNombreCompleto(valor, errores, campo, exigirApellido = true) {
  if (!valor) {
    errores[campo] = "Ingrese sus nombres y apellidos.";
    return;
  }

  if (valor.length < 3 || valor.length > 80 || !NAME_PATTERN.test(valor)) {
    errores[campo] = "Use un nombre valido, solo con letras y espacios.";
    return;
  }

  if (exigirApellido && valor.split(" ").filter(Boolean).length < 2) {
    errores[campo] = "Ingrese nombres y apellidos completos.";
  }
}

function validarCorreo(valor, errores) {
  if (!EMAIL_PATTERN.test(valor)) {
    errores.correo = "Ingrese un correo electronico valido.";
  }
}

function validarTelefono(valor, errores, requerido) {
  if (!valor && !requerido) return;

  if (!PHONE_PATTERN.test(valor)) {
    errores.telefono = "Ingrese un celular peruano valido de 9 digitos.";
  }
}

function validarTexto(valor, errores, campo, minimo, maximo, requerido) {
  if (!valor) {
    errores[campo] = requerido;
    return;
  }

  if (valor.length < minimo || valor.length > maximo || /[<>]/.test(valor)) {
    errores[campo] = `Ingrese entre ${minimo} y ${maximo} caracteres sin etiquetas HTML.`;
    return;
  }

  if (!SIMPLE_TEXT_PATTERN.test(valor)) {
    errores[campo] = "Revise los caracteres ingresados.";
  }
}

function validarFechaReserva(fecha, errores) {
  if (!fecha) {
    errores.fecha = "Ingrese una fecha de viaje valida.";
    return;
  }

  const hoy = startOfDay(new Date());
  const seleccion = startOfDay(new Date(`${fecha}T00:00:00`));
  const maxima = new Date(hoy);
  maxima.setDate(maxima.getDate() + MAX_DAYS_RESERVA);

  if (Number.isNaN(seleccion.getTime())) {
    errores.fecha = "Ingrese una fecha de viaje valida.";
    return;
  }

  if (seleccion < hoy) {
    errores.fecha = "La fecha de viaje no puede ser anterior a hoy.";
    return;
  }

  if (seleccion > maxima) {
    errores.fecha = `La reserva no puede superar ${MAX_DAYS_RESERVA} dias de anticipacion.`;
  }
}

function normalizeDate(valor) {
  const texto = String(valor || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return texto;
  }

  const partes = texto.split("/");
  if (partes.length !== 3) return "";

  const [dia, mes, anio] = partes;
  if (!/^\d{1,2}$/.test(dia) || !/^\d{1,2}$/.test(mes) || !/^\d{4}$/.test(anio)) {
    return "";
  }

  return [
    anio.padStart(4, "0"),
    mes.padStart(2, "0"),
    dia.padStart(2, "0")
  ].join("-");
}

function normalizeSeat(valor) {
  return onlyDigits(valor).slice(0, 2);
}

function normalizeText(valor, maximo) {
  const texto = String(valor || "")
    .replace(/\s+/g, " ")
    .trim();

  return maximo ? texto.slice(0, maximo) : texto;
}

function onlyDigits(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function startOfDay(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function buildResult(datos, errores) {
  return {
    valido: Object.keys(errores).length === 0,
    datos,
    errores
  };
}

module.exports = {
  crearRegistro,
  validarPregunta,
  validarReclamo,
  validarReserva,
  validarTestimonio
};
