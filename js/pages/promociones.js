
document.addEventListener("DOMContentLoaded", function () {
  const promociones = [
    {
      nombre: "Promo Encomienda Express",
      tipo: "Encomiendas"
    },
    {
      nombre: "Tarifa Ahorro para Carga",
      tipo: "Carga comercial"
    },
    {
      nombre: "Promo Pasajero Mundialista",
      tipo: "Viajes"
    },
    {
      nombre: "Vive la Fiesta de Chachapoyas",
      tipo: "Viajes"
    }
  ];

  const tarjetas = document.querySelectorAll(".promocion-card");

  tarjetas.forEach(function (tarjeta, indice) {
    const promocion = promociones[indice];
    const botones = tarjeta.querySelectorAll(".btn-mas-info, .promocion-card__link");

    botones.forEach((boton) => {
      boton.addEventListener("click", function () {
        if (promocion) {
          console.log("Promocion seleccionada: " + promocion.nombre);
          console.log("Tipo: " + promocion.tipo);
        }
      });
    });
  });
});
