/**
 * CAJA DE DATOS E INICIALIZACIÓN
 * Reemplaza esta sección cuando tengas las tablas de Riesgo Relativo reales
 */
const MATRIZ_RIESGO_SIMULADA = {
  tabaco:  [1.0, 1.3, 2.0, 4.0, 7.5],
  alcohol: [1.0, 1.2, 1.6, 2.8, 5.0],
  vapeo:   [1.0, 1.2, 1.4, 1.9, 3.2]
};

const TEXTOS_NIVEL = ["Nunca", "Ocasional", "Semanal", "Diario", "Intenso"];

// Estado Global de la App
const state = {
  tabaco: 0,
  alcohol: 0,
  vapeo: 0,
  anos: 10
};

// Referencias DOM
const dom = {
  tabaco: document.getElementById('tabaco'),
  alcohol: document.getElementById('alcohol'),
  vapeo: document.getElementById('vapeo'),
  lblTabaco: document.getElementById('lbl-tabaco'),
  lblAlcohol: document.getElementById('lbl-alcohol'),
  lblVapeo: document.getElementById('lbl-vapeo'),
  yearBtns: document.querySelectorAll('.btn-year'),
  globalRiskBar: document.getElementById('global-risk-bar'),
  globalRiskValue: document.getElementById('global-risk-value'),
  fillAdn: document.getElementById('fill-adn'),
  fillEstres: document.getElementById('fill-estres'),
  fillAntiox: document.getElementById('fill-antiox'),
  valAdn: document.getElementById('val-adn'),
  valEstres: document.getElementById('val-estres'),
  valAntiox: document.getElementById('val-antiox'),
  impactText: document.getElementById('impact-text'),
  impactCard: document.getElementById('impact-card'),
  rosLayer: document.getElementById('ros-layer'),
  humanSvg: document.querySelector('.human-svg'),
  btnQuit: document.getElementById('btn-quit')
};

/**
 * MOTOR DE CÁLCULO
 * Aquí se procesan las variables. Se reemplazará por la llamada API en Render.
 */
function calcularResultados() {
  const rrTabaco = MATRIZ_RIESGO_SIMULADA.tabaco[state.tabaco];
  const rrAlcohol = MATRIZ_RIESGO_SIMULADA.alcohol[state.alcohol];
  const rrVapeo = MATRIZ_RIESGO_SIMULADA.vapeo[state.vapeo];

  // Sinergia multiplicativa de factores de riesgo + peso temporal
  const multiplicadorTotal = rrTabaco * rrAlcohol * rrVapeo;
  const factorTiempo = 1 + (state.anos * 0.04);
  const riesgoAcumulado = multiplicadorTotal * factorTiempo;

  // Porcentaje normalizado para la UI (Capado a 99%)
  const riesgoPorcentaje = Math.min(Math.round((riesgoAcumulado / 25) * 100), 99);

  // Marcadores moleculares derivados
  const danoAdn = Math.min(Math.round(riesgoAcumulado * 7.5), 100);
  const estresOx = Math.min(Math.round(riesgoAcumulado * 9.0), 100);
  const antiox = Math.max(100 - Math.round(riesgoAcumulado * 8.0), 5);

  return {
    multiplicador: riesgoAcumulado.toFixed(1),
    porcentaje: riesgoPorcentaje,
    adn: danoAdn,
    estres: estresOx,
    antiox: antiox
  };
}

/**
 * RENDERIZADO VISUAL & TRANSICIÓN DE COLORES
 */
function actualizarUI() {
  const data = calcularResultados();

  // Actualización de Textos de badge
  dom.lblTabaco.textContent = TEXTOS_NIVEL[state.tabaco];
  dom.lblAlcohol.textContent = TEXTOS_NIVEL[state.alcohol];
  dom.lblVapeo.textContent = TEXTOS_NIVEL[state.vapeo];

  // Actualización de barras de progreso
  dom.globalRiskBar.style.width = `${data.porcentaje}%`;
  dom.globalRiskValue.textContent = `${data.porcentaje}%`;

  dom.fillAdn.style.height = `${data.adn}%`;
  dom.valAdn.textContent = `${data.adn}%`;

  dom.fillEstres.style.height = `${data.estres}%`;
  dom.valEstres.textContent = `${data.estres}%`;

  dom.fillAntiox.style.height = `${data.antiox}%`;
  dom.valAntiox.textContent = `${data.antiox}%`;

  dom.impactText.innerHTML = `Tu riesgo acumulado es <strong>${data.multiplicador}x</strong> mayor respecto a la línea base.`;

  // Transición dinámica de color según severidad (Azul/Morado -> Rojo/Negro)
  aplicarPaletaDinamica(data.porcentaje);
  generarParticulasROS(data.estres);
}

function aplicarPaletaDinamica(porcentaje) {
  // Factor de 0 a 1
  const t = porcentaje / 100;

  if (t > 0.4) {
    // Cambio hacia tonos de advertencia y crítico (Rojizos a Negros)
    const colorRojo = `rgb(${Math.round(139 + t * 116)}, ${Math.round(92 - t * 70)}, ${Math.round(246 - t * 200)})`;
    dom.globalRiskValue.style.color = colorRojo;
    dom.globalRiskBar.style.background = `linear-gradient(90deg, #ef4444, #7f1d1d)`;
    dom.humanSvg.style.color = colorRojo;
    dom.impactCard.style.borderColor = '#ef4444';
  } else {
    // Tonos saludables (Morado/Azul)
    dom.globalRiskValue.style.color = 'var(--color-safe-primary)';
    dom.globalRiskBar.style.background = `linear-gradient(90deg, var(--color-safe-secondary), var(--color-safe-primary))`;
    dom.humanSvg.style.color = 'var(--border-color)';
    dom.impactCard.style.borderColor = 'transparent';
  }
}

function generarParticulasROS(nivelEstres) {
  dom.rosLayer.innerHTML = '';
  const cantidad = Math.floor(nivelEstres / 4);

  for (let i = 0; i < cantidad; i++) {
    const dot = document.createElement('div');
    dot.className = 'ros-particle';
    const size = Math.random() * 12 + 6;
    
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.top = `${Math.random() * 80 + 10}%`;
    dot.style.left = `${Math.random() * 60 + 20}%`;

    // Cambiar el color de las partículas ROS según intensidad
    dot.style.background = nivelEstres > 50 ? 'var(--color-danger-primary)' : 'var(--color-safe-primary)';
    
    dom.rosLayer.appendChild(dot);
  }
}

/**
 * MANEJO DE EVENTOS (Optimizado para Safari & Mobile)
 */
function bindEvents() {
  const debouncedUpdate = debounce(actualizarUI, 16);

  ['tabaco', 'alcohol', 'vapeo'].forEach(key => {
    dom[key].addEventListener('input', (e) => {
      state[key] = parseInt(e.target.value, 10);
      debouncedUpdate();
    });
  });

  dom.yearBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      dom.yearBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.anos = parseInt(e.target.dataset.years, 10);
      actualizarUI();
    });
  });

  dom.btnQuit.addEventListener('click', () => {
    state.tabaco = 0;
    state.alcohol = 0;
    state.vapeo = 0;
    dom.tabaco.value = 0;
    dom.alcohol.value = 0;
    dom.vapeo.value = 0;
    actualizarUI();
  });
}

// Auxiliar Debounce para suavizar en Safari
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  actualizarUI();
});