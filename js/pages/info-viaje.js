
document.addEventListener("DOMContentLoaded", function () {
  const grupos = [
    {
      nombre: "Politicas de viaje",
      selector: ".politica-card"
    },
    {
      nombre: "Informacion adicional",
      selector: ".info-card"
    },
    {
      nombre: "Equipaje permitido",
      selector: ".equipaje-card"
    }
  ];

  function activarCards(nombreGrupo, selector) {
    const cards = document.querySelectorAll(selector);

    cards.forEach((card) => {
      card.addEventListener("click", function () {
        const titulo = card.querySelector("h3");

        if (titulo) {
          console.log(nombreGrupo + ": " + titulo.textContent);
        }
      });
    });
  }

  grupos.forEach(function (grupo) {
    activarCards(grupo.nombre, grupo.selector);
  });
});
