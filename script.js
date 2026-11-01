const data = {
    solar: [
        { name: "水星", page: "planet_merc.html" },
        { name: "金星", page: "planet_venus.html" },
        { name: "地球", page: "planet_earth.html" },
        { name: "火星", page: "planet_mars.html" },
        { name: "木星", page: "planet_jupiter.html" },
        { name: "土星", page: "planet_saturn.html" },
        { name: "天王星", page: "planet_uranus.html" },
        { name: "海王星", page: "planet_neptune.html" }
    ],

    andromeda: [
        { name: "M110", page: "planet_m110.html" }, 
        { name: "M32", page: "planet_m32.html" } 
    ],

    milkyway: [
        { name: "半人馬座α星", page: "planet_Alpha Centauri.html" },
        { name: "天狼星", page: "planet_Sirius.html" }
    ]
};

const galaxySelect = document.getElementById("galaxySelect");
const planetSelect = document.getElementById("planetSelect");

galaxySelect.addEventListener("change", () => {
    const galaxy = galaxySelect.value;

    planetSelect.innerHTML = "";
    
    if (galaxy === "") {
        planetSelect.disabled = true;
        planetSelect.innerHTML = `<option value="">請先選星系</option>`;
        return;
    }

    const planets = data[galaxy];

    planetSelect.disabled = false;

    planetSelect.innerHTML = `<option value="">選擇星球</option>`;

    planets.forEach(p => {
        planetSelect.innerHTML += `<option value="${p.page}">${p.name}</option>`;
    });
});

planetSelect.addEventListener("change", () => {
    const page = planetSelect.value;
    
    if (page && page !== "#") {
        window.location.href = page;
    }
});