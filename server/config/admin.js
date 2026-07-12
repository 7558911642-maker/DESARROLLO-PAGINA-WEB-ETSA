"use strict";

module.exports = {
  user: process.env.ADMIN_USER || "empresa",
  password: process.env.ADMIN_PASSWORD || "Etsa2026!",
  sessionSecret: process.env.SESSION_SECRET || "etsa-admin-local-secret",
  cookieName: "etsa_admin_session"
};
