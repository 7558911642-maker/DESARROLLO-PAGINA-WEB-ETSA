"use strict";

const fs = require("fs/promises");
const path = require("path");

const DATA_DIR = path.resolve(__dirname, "..", "..", "data");

const COLLECTIONS = {
  reservas: { file: "reservas.json", key: "reservas" },
  reclamos: { file: "reclamos.json", key: "reclamos" },
  preguntas: { file: "preguntas.json", key: "preguntas" },
  testimonios: { file: "testimonios.json", key: "testimonios" }
};

const collectionQueues = new Map();

async function readCollection(nombre) {
  const config = getCollectionConfig(nombre);
  const json = await readJson(config.file);
  const items = Array.isArray(json[config.key]) ? json[config.key] : [];

  return { json, items, key: config.key };
}

async function appendToCollection(nombre, item) {
  return updateCollection(nombre, ({ json, items, key }) => {
    json[key] = [item, ...items];
    return item;
  });
}

async function updateCollection(nombre, updater) {
  return enqueueCollection(nombre, async () => {
    const config = getCollectionConfig(nombre);
    const json = await readJson(config.file);
    const items = Array.isArray(json[config.key]) ? json[config.key] : [];
    const resultado = await updater({ json, items, key: config.key });

    await writeJson(config.file, json);
    return resultado;
  });
}

function enqueueCollection(nombre, task) {
  const previous = collectionQueues.get(nombre) || Promise.resolve();
  const next = previous.catch(() => undefined).then(task);

  collectionQueues.set(nombre, next);
  next.finally(() => {
    if (collectionQueues.get(nombre) === next) {
      collectionQueues.delete(nombre);
    }
  }).catch(() => undefined);

  return next;
}

async function readJson(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function writeJson(fileName, data) {
  const filePath = path.join(DATA_DIR, fileName);
  const tempPath = `${filePath}.tmp`;
  const content = `${JSON.stringify(data, null, 2)}\n`;

  await fs.writeFile(tempPath, content, "utf8");
  await fs.rename(tempPath, filePath);
}

function getCollectionConfig(nombre) {
  const config = COLLECTIONS[nombre];

  if (!config) {
    throw new Error(`Coleccion no soportada: ${nombre}`);
  }

  return config;
}

module.exports = {
  DATA_DIR,
  COLLECTIONS,
  appendToCollection,
  readCollection,
  readJson,
  updateCollection
};
