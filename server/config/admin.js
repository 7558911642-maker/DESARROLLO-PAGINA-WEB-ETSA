"use strict";

const fs = require("fs");
const path = require("path");

loadDotEnv(path.resolve(__dirname, "..", "..", ".env"));

const isProduction = process.env.NODE_ENV === "production";

const defaults = {
  user: "empresa",
  password: "Etsa2026!",
  sessionSecret: "etsa-admin-local-secret"
};

const config = {
  user: getEnv("ADMIN_USER", defaults.user),
  password: getEnv("ADMIN_PASSWORD", defaults.password),
  sessionSecret: getEnv("SESSION_SECRET", defaults.sessionSecret),
  cookieName: "etsa_admin_session"
};

if (isProduction) {
  validateProductionConfig(config);
}

module.exports = {
  ...config
};

function getEnv(name, fallback) {
  const value = process.env[name];

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (isProduction) {
    throw new Error(`Variable de entorno requerida en produccion: ${name}`);
  }

  return fallback;
}

function validateProductionConfig({ password, sessionSecret }) {
  if (password === defaults.password) {
    throw new Error("ADMIN_PASSWORD no debe usar la clave por defecto en produccion.");
  }

  if (sessionSecret === defaults.sessionSecret || sessionSecret.length < 24) {
    throw new Error("SESSION_SECRET debe ser unico y tener al menos 24 caracteres en produccion.");
  }
}

function loadDotEnv(filePath) {
  let content = "";

  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    return;
  }

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      return;
    }

    const name = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (!process.env[name]) {
      process.env[name] = value;
    }
  });
}
