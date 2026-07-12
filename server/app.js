"use strict";

const crypto = require("crypto");
const express = require("express");
const path = require("path");

const adminConfig = require("./config/admin");
const store = require("./storage/json-store");
const {
  crearRegistro,
  validarPregunta,
  validarReclamo,
  validarReserva,
  validarTestimonio
} = require("./validators/forms");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = path.resolve(__dirname, "..");
const ADMIN_DIR = path.join(ROOT, "admin");

const adminSessions = new Map();

const PUBLIC_HTML = new Set([
  "index.html",
  "servicios.html",
  "rutas.html",
  "promociones.html",
  "reserva.html",
  "contacto.html",
  "libro_reclamos.html",
  "preguntas-frecuentes.html",
  "nosotros.html",
  "info-viaje.html",
  "encomiendas.html",
  "testimonios.html",
  "terminos-viaje.html",
  "terminos-encomiendas.html"
]);

const ADMIN_PAGES = new Set([
  "reservas.html",
  "reclamos.html",
  "preguntas.html",
  "testimonios.html"
]);

app.disable("x-powered-by");
app.use(express.json({ limit: "30kb" }));
app.use(express.urlencoded({ extended: false, limit: "30kb" }));
app.use(applySecurityHeaders);

app.use("/data", denyPrivateAccess);
app.use("/server", denyPrivateAccess);

app.get("/api/reservas/config", asyncHandler(async (_req, res) => {
  const { json } = await store.readCollection("reservas");
  res.json({
    ok: true,
    data: {
      version: json.version,
      defaults: json.defaults,
      rutas: json.rutas,
      asientos: json.asientos
    }
  });
}));

app.get("/api/reservas/ocupadas", asyncHandler(async (_req, res) => {
  const { items } = await store.readCollection("reservas");
  res.json({
    ok: true,
    data: items.map((reserva) => ({
      origen: reserva.origen,
      destino: reserva.destino,
      fecha: reserva.fecha,
      asiento: String(reserva.asiento)
    }))
  });
}));

app.post("/api/reservas", asyncHandler(async (req, res) => {
  const { json, items } = await store.readCollection("reservas");
  const resultado = validarReserva(req.body, {
    rutas: json.rutas,
    capacidad: json.asientos?.capacidad,
    ocupadosIniciales: json.asientos?.ocupadosIniciales,
    reservas: items
  });

  if (!resultado.valido) {
    return res.status(422).json({ ok: false, errores: resultado.errores });
  }

  const registro = crearRegistro("reserva", resultado.datos, {
    estado: json.defaults?.estadoInicial || "pendiente",
    moneda: json.defaults?.moneda || "PEN",
    precio: Number(json.defaults?.precioBase || 85)
  });

  await store.appendToCollection("reservas", registro);
  res.status(201).json({ ok: true, mensaje: "Reserva registrada correctamente.", data: registro });
}));

app.post("/api/reclamos", asyncHandler(async (req, res) => {
  const resultado = validarReclamo(req.body);

  if (!resultado.valido) {
    return res.status(422).json({ ok: false, errores: resultado.errores });
  }

  const registro = crearRegistro("reclamo", resultado.datos, { estado: "pendiente" });
  await store.appendToCollection("reclamos", registro);
  res.status(201).json({ ok: true, mensaje: "Reclamo registrado correctamente.", data: registro });
}));

app.post("/api/preguntas", asyncHandler(async (req, res) => {
  const resultado = validarPregunta(req.body);

  if (!resultado.valido) {
    return res.status(422).json({ ok: false, errores: resultado.errores });
  }

  const registro = crearRegistro("pregunta", resultado.datos, { estado: "pendiente" });
  await store.appendToCollection("preguntas", registro);
  res.status(201).json({ ok: true, mensaje: "Pregunta registrada correctamente.", data: registro });
}));

app.post("/api/testimonios", asyncHandler(async (req, res) => {
  const resultado = validarTestimonio(req.body);

  if (!resultado.valido) {
    return res.status(422).json({ ok: false, errores: resultado.errores });
  }

  const registro = crearRegistro("testimonio", resultado.datos, { estado: "pendiente" });
  await store.appendToCollection("testimonios", registro);
  res.status(201).json({ ok: true, mensaje: "Testimonio registrado correctamente.", data: registro });
}));

app.post("/api/admin/login", (req, res) => {
  const usuario = String(req.body.usuario || "").trim();
  const password = String(req.body.password || "");

  if (usuario !== adminConfig.user || password !== adminConfig.password) {
    return res.status(401).json({ ok: false, mensaje: "Credenciales invalidas." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  adminSessions.set(token, { usuario, creadoEn: Date.now() });

  res.cookie(adminConfig.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 8
  });

  res.json({ ok: true });
});

app.post("/api/admin/logout", requireAdminApi, (req, res) => {
  adminSessions.delete(req.adminToken);
  res.clearCookie(adminConfig.cookieName);
  res.json({ ok: true });
});

app.get("/api/admin/session", requireAdminApi, (req, res) => {
  res.json({ ok: true, usuario: req.adminSession.usuario });
});

app.get("/api/admin/:collection", requireAdminApi, asyncHandler(async (req, res) => {
  const collection = req.params.collection;

  if (!store.COLLECTIONS[collection]) {
    return res.status(404).json({ ok: false, mensaje: "Coleccion no encontrada." });
  }

  const { items } = await store.readCollection(collection);
  res.json({ ok: true, data: items });
}));

app.get("/admin", (_req, res) => res.redirect("/admin/login.html"));
app.get("/admin/login.html", (_req, res) => res.sendFile(path.join(ADMIN_DIR, "login.html")));
app.get("/admin/admin.css", (_req, res) => res.sendFile(path.join(ADMIN_DIR, "admin.css")));
app.get("/admin/admin.js", (_req, res) => res.sendFile(path.join(ADMIN_DIR, "admin.js")));
app.get("/admin/:page", requireAdminPage, (req, res, next) => {
  const page = req.params.page;

  if (!ADMIN_PAGES.has(page)) {
    return next();
  }

  res.sendFile(path.join(ADMIN_DIR, page));
});

app.use("/css", express.static(path.join(ROOT, "css")));
app.use("/js", express.static(path.join(ROOT, "js")));
app.use("/img", express.static(path.join(ROOT, "img")));
app.use("/templates", express.static(path.join(ROOT, "templates")));
app.use("/bootstrap-5.3.8-dist", express.static(path.join(ROOT, "bootstrap-5.3.8-dist")));
app.use("/detalles-rutas", express.static(path.join(ROOT, "detalles-rutas")));

app.get("/", (_req, res) => res.sendFile(path.join(ROOT, "index.html")));
app.get("/:page", (req, res, next) => {
  const page = req.params.page;

  if (!PUBLIC_HTML.has(page)) {
    return next();
  }

  res.sendFile(path.join(ROOT, page));
});

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ ok: false, mensaje: "Ruta API no encontrada." });
  }

  res.status(404).send("Pagina no encontrada.");
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
});

function applySecurityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
}

function denyPrivateAccess(_req, res) {
  res.status(403).send("Acceso no permitido.");
}

function requireAdminApi(req, res, next) {
  const token = getCookie(req, adminConfig.cookieName);
  const session = token ? adminSessions.get(token) : null;

  if (!session) {
    return res.status(401).json({ ok: false, mensaje: "Autenticacion requerida." });
  }

  req.adminToken = token;
  req.adminSession = session;
  next();
}

function requireAdminPage(req, res, next) {
  const token = getCookie(req, adminConfig.cookieName);

  if (!token || !adminSessions.has(token)) {
    return res.redirect("/admin/login.html");
  }

  next();
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const found = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  return found ? decodeURIComponent(found.slice(name.length + 1)) : "";
}

function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor ETSA disponible en http://localhost:${PORT}`);
  });
}

module.exports = app;
