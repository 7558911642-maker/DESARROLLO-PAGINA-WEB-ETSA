"use strict";

(function () {
  const MENSAJE_ALERTA_MS = 15000;
  const ADMIN_REFRESH_MS = 800;
  let adminRefreshTimer = null;

  const columns = {
    reservas: [
      ["codigo", "Codigo"],
      ["nombre", "Pasajero"],
      ["dni", "DNI"],
      ["origen", "Origen"],
      ["destino", "Destino"],
      ["fecha", "Fecha"],
      ["asiento", "Asiento"],
      ["estado", "Estado"],
      ["creadoEn", "Creado"]
    ],
    reclamos: [
      ["codigo", "Codigo"],
      ["nombre", "Nombre"],
      ["correo", "Correo"],
      ["telefono", "Telefono"],
      ["asunto", "Asunto"],
      ["mensaje", "Detalle"],
      ["estado", "Estado"],
      ["creadoEn", "Creado"]
    ],
    preguntas: [
      ["codigo", "Codigo"],
      ["nombre", "Nombre"],
      ["correo", "Correo"],
      ["telefono", "Telefono"],
      ["categoria", "Categoria"],
      ["pregunta", "Pregunta"],
      ["estado", "Estado"],
      ["creadoEn", "Creado"]
    ],
    testimonios: [
      ["codigo", "Codigo"],
      ["nombre", "Nombre"],
      ["tipo", "Tipo"],
      ["calificacion", "Calificacion"],
      ["mensaje", "Testimonio"],
      ["estado", "Estado"],
      ["creadoEn", "Creado"]
    ]
  };

  document.addEventListener("DOMContentLoaded", function () {
    initLogin();
    initPanel();
    initLogout();
  });

  function initLogin() {
    const form = document.getElementById("admin-login-form");
    if (!form) return;

    const message = document.querySelector("[data-admin-message]");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      setMessage(message, "");

      const button = form.querySelector("button");
      button.disabled = true;

      try {
        const payload = await requestJson("/api/admin/login", {
          method: "POST",
          body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
        });

        if (!payload.ok) {
          throw new Error(payload.mensaje || "No se pudo iniciar sesion.");
        }

        window.location.href = "/admin/reservas.html";
      } catch (error) {
        setMessage(message, error.message || "Credenciales invalidas.");
      } finally {
        button.disabled = false;
      }
    });
  }

  async function initPanel() {
    const collection = document.body.dataset.adminPage;
    if (!collection) return;

    try {
      await requestJson("/api/admin/session");
      await cargarColeccion(collection);
      iniciarActualizacionAdmin(collection);
    } catch (error) {
      window.location.href = "/admin/login.html";
    }
  }

  async function cargarColeccion(collection) {
    const payload = await requestJson(`/api/admin/${collection}`);
    renderTable(collection, payload.data || []);
  }

  function iniciarActualizacionAdmin(collection) {
    if (adminRefreshTimer) {
      window.clearInterval(adminRefreshTimer);
    }

    adminRefreshTimer = window.setInterval(async function () {
      try {
        await cargarColeccion(collection);
      } catch (error) {
        window.clearInterval(adminRefreshTimer);
        window.location.href = "/admin/login.html";
      }
    }, ADMIN_REFRESH_MS);
  }

  function initLogout() {
    const button = document.querySelector("[data-admin-logout]");
    if (!button) return;

    button.addEventListener("click", async function () {
      try {
        await requestJson("/api/admin/logout", { method: "POST" });
      } finally {
        window.location.href = "/admin/login.html";
      }
    });
  }

  function renderTable(collection, rows) {
    const head = document.querySelector("[data-admin-head]");
    const body = document.querySelector("[data-admin-body]");
    const count = document.querySelector("[data-admin-count]");
    const config = columns[collection] || [];

    if (count) {
      count.textContent = `${rows.length} registro${rows.length === 1 ? "" : "s"}`;
    }

    if (!head || !body) return;

    head.innerHTML = "";
    body.innerHTML = "";

    const headerRow = document.createElement("tr");
    config.forEach(function ([, label]) {
      const th = document.createElement("th");
      th.textContent = label;
      headerRow.appendChild(th);
    });
    head.appendChild(headerRow);

    if (!rows.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = config.length || 1;
      td.textContent = "No hay registros guardados.";
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }

    rows.forEach(function (row) {
      const tr = document.createElement("tr");
      config.forEach(function ([key]) {
        const td = document.createElement("td");
        td.textContent = formatValue(key, row[key]);
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  }

  async function requestJson(url, options) {
    const response = await fetch(url, {
      method: options?.method || "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: options?.body
    });

    const payload = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      throw new Error(payload.mensaje || "Solicitud no autorizada.");
    }

    return payload;
  }

  function formatValue(key, value) {
    if (!value) return "-";

    if (key === "creadoEn" || key === "actualizadoEn") {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("es-PE");
    }

    return String(value);
  }

  function setMessage(element, message) {
    if (!element) {
      return;
    }

    if (element.dataset.adminMessageTimer) {
      window.clearTimeout(Number(element.dataset.adminMessageTimer));
      delete element.dataset.adminMessageTimer;
    }

    element.textContent = message;
    element.classList.toggle("admin-message--alert", Boolean(message));
    element.setAttribute("role", message ? "alert" : "status");
    element.setAttribute("aria-live", message ? "assertive" : "polite");

    if (message) {
      element.dataset.adminMessageTimer = String(window.setTimeout(function () {
        element.textContent = "";
        element.classList.remove("admin-message--alert");
        element.setAttribute("role", "status");
        element.setAttribute("aria-live", "polite");
        delete element.dataset.adminMessageTimer;
      }, MENSAJE_ALERTA_MS));
    }
  }
})();
