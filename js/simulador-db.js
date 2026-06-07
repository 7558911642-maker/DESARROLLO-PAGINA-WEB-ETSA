"use strict";

(function () {
  const FIELD_SELECTOR = "input[id], select[id], textarea[id]";
  const BUTTON_SELECTOR = [
    "button",
    "input[type='button']",
    "input[type='submit']",
    "input[type='image']",
    "a[role='button']",
    ".btn",
    "[data-action]",
    "[data-accion]",
  ].join(", ");

  document.addEventListener("DOMContentLoaded", function () {
    const pageName = getCurrentPageName();
    const storageKey = `datos_${pageName}`;

    loadData(storageKey);
    bindSaveEvents(storageKey, pageName);

    window.SimuladorDB = {
      clave: storageKey,
      cargar: function () {
        loadData(storageKey);
      },
      guardar: function () {
        saveData(storageKey, pageName, true);
      },
      obtenerDatos: collectData,
    };
  });

  function getCurrentPageName() {
    const fileName = window.location.pathname.split("/").pop() || "index";
    const cleanName = decodeURIComponent(fileName).split("?")[0].split("#")[0];
    const withoutExtension = cleanName.replace(/\.[^/.]+$/, "");

    return sanitizeKeyPart(withoutExtension || "index");
  }

  function sanitizeKeyPart(value) {
    return value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function loadData(storageKey) {
    const savedText = localStorage.getItem(storageKey);

    if (!savedText) {
      return;
    }

    try {
      const savedData = JSON.parse(savedText);

      Object.keys(savedData).forEach(function (fieldId) {
        const field = document.getElementById(fieldId);

        if (!isEditableField(field)) {
          return;
        }

        fillField(field, savedData[fieldId]);
      });
    } catch (error) {
      console.warn(
        `No se pudo leer la informacion guardada en ${storageKey}.`,
        error
      );
    }
  }

  function bindSaveEvents(storageKey, pageName) {
    const forms = document.querySelectorAll("form");
    const buttons = document.querySelectorAll(BUTTON_SELECTOR);

    forms.forEach(function (form) {
      form.addEventListener("submit", function () {
        saveData(storageKey, pageName, true);
      });
    });

    buttons.forEach(function (button) {
      if (!isSaveButton(button)) {
        return;
      }

      const isSubmitInsideForm =
        button.closest("form") && getButtonType(button) === "submit";

      if (isSubmitInsideForm) {
        return;
      }

      button.addEventListener("click", function () {
        saveData(storageKey, pageName, true);
      });
    });
  }

  function collectData() {
    const data = {};

    document.querySelectorAll(FIELD_SELECTOR).forEach(function (field) {
      if (!isEditableField(field)) {
        return;
      }

      data[field.id] = getFieldValue(field);
    });

    return data;
  }

  function saveData(storageKey, pageName, showMessage) {
    const data = collectData();

    localStorage.setItem(storageKey, JSON.stringify(data));

    if (showMessage) {
      alert(
        `Datos de ${formatPageName(pageName)} guardados correctamente en el simulador.`
      );
    }
  }

  function isEditableField(field) {
    if (!field || !field.id) {
      return false;
    }

    const tagName = field.tagName.toLowerCase();
    const type = (field.type || "").toLowerCase();
    const ignoredInputTypes = [
      "button",
      "submit",
      "reset",
      "image",
      "file",
      "password",
    ];

    if (!["input", "select", "textarea"].includes(tagName)) {
      return false;
    }

    return !(tagName === "input" && ignoredInputTypes.includes(type));
  }

  function getFieldValue(field) {
    const type = (field.type || "").toLowerCase();

    if (type === "checkbox" || type === "radio") {
      return field.checked;
    }

    if (field.tagName.toLowerCase() === "select" && field.multiple) {
      return Array.from(field.selectedOptions).map(function (option) {
        return option.value;
      });
    }

    return field.value;
  }

  function fillField(field, value) {
    const type = (field.type || "").toLowerCase();

    if (type === "checkbox" || type === "radio") {
      field.checked = Boolean(value);
      return;
    }

    if (field.tagName.toLowerCase() === "select" && field.multiple) {
      const selectedValues = Array.isArray(value) ? value : [value];

      Array.from(field.options).forEach(function (option) {
        option.selected = selectedValues.includes(option.value);
      });

      return;
    }

    field.value = value ?? "";
  }

  function isSaveButton(button) {
    const text = [
      button.id,
      button.name,
      button.className,
      button.value,
      button.textContent,
      button.getAttribute("aria-label"),
      button.getAttribute("title"),
      button.getAttribute("data-action"),
      button.getAttribute("data-accion"),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return /\b(guardar|grabar|save|enviar|registrar|confirmar|submit)\b/.test(
      text
    );
  }

  function getButtonType(button) {
    const tagName = button.tagName.toLowerCase();

    if (tagName === "button") {
      return (button.getAttribute("type") || "submit").toLowerCase();
    }

    if (tagName === "input") {
      return (button.getAttribute("type") || "text").toLowerCase();
    }

    return "";
  }

  function formatPageName(pageName) {
    return pageName.replace(/[_-]+/g, " ");
  }
})();
