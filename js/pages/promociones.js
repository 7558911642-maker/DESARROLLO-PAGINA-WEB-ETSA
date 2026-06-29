
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
  const contenedor = document.querySelector(".promociones-container");
  const indicadores = document.querySelectorAll(".promocion-indicador");

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

  function mostrarIndicadorActivo(indiceActivo) {
    indicadores.forEach(function (indicador, indice) {
      indicador.classList.remove("activo");

      if (indice === indiceActivo) {
        indicador.classList.add("activo");
      }
    });
  }

  function actualizarIndicador() {
    let activo = 0;

    tarjetas.forEach(function (tarjeta, indice) {
      if (contenedor.scrollLeft >= tarjeta.offsetLeft - 80) {
        activo = indice;
      }
    });

    mostrarIndicadorActivo(activo);
  }

  if (contenedor && indicadores.length > 0) {
    contenedor.addEventListener("scroll", actualizarIndicador);
    actualizarIndicador();
  }
});
