/**
 * MATRIZ DE RIESGO CALIBRADA CON EXCEL (Bagnardi 2015 / CDC)
 */
const MATRIZ_RIESGO = {
  // Alcohol: Promedio de los 6 cánceres con "Calibrar simulador: SÍ" (Bagnardi 2015)
  // RRs: 5.13, 4.95, 2.65, 2.07, 1.61, 1.44 -> Escalado a 5 niveles
  alcohol: [1.0, 1.4, 2.1, 3.0, 4.5],
  
  // Tabaco: CDC indica un rango de 15 a 30 para cáncer de pulmón (Fumador vs No fumador).
  // Usamos 20 como base para "Intenso" y escalamos hacia abajo.
  tabaco:  [1.0, 2.5, 5.0, 10.0, 20.0],
  
  // Vapeo: No hay datos en la tabla, curva de riesgo simulada conservadora.
  vapeo:   [1.0, 1.2, 1.8, 2.5, 3.5]
};

const TEXTOS_NIVEL = ["Nunca", "Ocasional", "Semanal", "Diario", "Intenso"];

const state = { tabaco: 0, alcohol: 0, vapeo: 0, anos: 10 };

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
  impactText: document.getElementById('impact-text'),
  fillAdn: document.getElementById('fill-adn'),
  fillEstres: document.getElementById('fill-estres'),
  fillAntiox: document.getElementById('fill-antiox'),
  valAdn: document.getElementById('val-adn'),
  valEstres: document.getElementById('val-estres'),
  valAntiox: document.getElementById('val-antiox'),
  rosLayer: document.getElementById('ros-layer'),
  btnQuit: document.getElementById('btn-quit'),
  organs: {
    pulmones: document.querySelectorAll('#organ-pulmones'),
    higado: document.querySelectorAll('#organ-higado'),
    estomago: document.querySelectorAll('#organ-estomago')
  }
};

function calcularResultados() {
  const rrTabaco = MATRIZ_RIESGO.tabaco[state.tabaco];
  const rrAlcohol = MATRIZ_RIESGO.alcohol[state.alcohol];
  const rrVapeo = MATRIZ_RIESGO.vapeo[state.vapeo];

  // Sinergia multiplicativa + factor tiempo
  const multiplicadorTotal = rrTabaco * rrAlcohol * rrVapeo;
  const factorTiempo = 1 + (state.anos * 0.04);
  const riesgoAcumulado = multiplicadorTotal * factorTiempo;
  
  // Normalización para la UI (Máximo teórico ~567)
  const maxRiesgo = 567; 
  const riesgoPorcentaje = Math.min(Math.round((riesgoAcumulado / maxRiesgo) * 100), 99);

  // Marcadores biológicos derivados
  const danoAdn = Math.min(Math.round(riesgoAcumulado * 1.5), 100);
  const estresOx = Math.min(Math.round(riesgoAcumulado * 2.0), 100);
  const antiox = Math.max(100 - Math.round(riesgoAcumulado * 1.2), 5);

  // Niveles para el SVG (Pulmones: tabaco/vapeo, Hígado: alcohol)
  const nivelPulmones = Math.max(rrTabaco, rrVapeo) - 1; 
  const nivelHigado = rrAlcohol - 1;

  return {
    multiplicador: riesgoAcumulado.toFixed(1),
    porcentaje: riesgoPorcentaje,
    adn: danoAdn,
    estres: estresOx,
    antiox: antiox,
    nivelPulmones: nivelPulmones,
    nivelHigado: nivelHigado
  };
}

function actualizarUI() {
  const data = calcularResultados();

  dom.lblTabaco.textContent = TEXTOS_NIVEL[state.tabaco];
  dom.lblAlcohol.textContent = TEXTOS_NIVEL[state.alcohol];
  dom.lblVapeo.textContent = TEXTOS_NIVEL[state.vapeo];

  dom.globalRiskBar.style.width = `${data.porcentaje}%`;
  dom.globalRiskValue.textContent = `${data.porcentaje}%`;
  dom.impactText.textContent = `${data.multiplicador}x riesgo basal`;

  dom.fillAdn.style.height = `${data.adn}%`;
  dom.valAdn.textContent = `${data.adn}%`;
  dom.fillEstres.style.height = `${data.estres}%`;
  dom.valEstres.textContent = `${data.estres}%`;
  dom.fillAntiox.style.height = `${data.antiox}%`;
  dom.valAntiox.textContent = `${data.antiox}%`;

  aplicarPaletaDinamica(data.porcentaje);
  actualizarOrganos(data.nivelPulmones, data.nivelHigado);
  actualizarParticulasROS(data.estres, data.nivelPulmones, data.nivelHigado);
}

function aplicarPaletaDinamica(porcentaje) {
  const t = porcentaje / 100;
  
  if (t > 0.3) {
    const r = Math.round(59 + t * 196);
    const g = Math.round(130 - t * 90);
    const b = Math.round(246 - t * 200);
    const color = `rgb(${r}, ${g}, ${b})`;
    
    dom.globalRiskValue.style.color = color;
    dom.globalRiskBar.style.background = `linear-gradient(90deg, ${color}, #ef4444)`;
    dom.fillAdn.style.background = t > 0.5 ? 'var(--danger)' : 'var(--warning)';
    dom.fillEstres.style.background = t > 0.5 ? 'var(--danger)' : 'var(--warning)';
  } else {
    dom.globalRiskValue.style.color = 'var(--safe)';
    dom.globalRiskBar.style.background = 'linear-gradient(90deg, var(--safe), var(--warning))';
    dom.fillAdn.style.background = 'var(--safe)';
    dom.fillEstres.style.background = 'var(--safe)';
  }
}

function actualizarOrganos(nivelPulmones, nivelHigado) {
  const setOrganColor = (elements, level, maxLevel) => {
    const intensity = Math.min(level / maxLevel, 1); 
    const r = Math.round(51 + intensity * 188);
    const g = Math.round(65 - intensity * 50);
    const b = Math.round(85 - intensity * 70);
    
    elements.forEach(el => {
      el.style.fill = `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.7})`;
      if (intensity > 0.3) {
        el.style.filter = `drop-shadow(0 0 ${intensity * 15}px rgba(239,68,68,0.8))`;
      } else {
        el.style.filter = 'none';
      }
    });
  };

  setOrganColor(dom.organs.pulmones, nivelPulmones, 19); // Max Tabaco RR 20
  setOrganColor(dom.organs.higado, nivelHigado, 2.0);   // Max Alcohol RR 3.0
}

function actualizarParticulasROS(nivelEstres, nivelPulmones, nivelHigado) {
  const cantidad = Math.floor(nivelEstres / 5); 
  const layer = dom.rosLayer;
  
  if (layer.children.length !== cantidad) {
    layer.innerHTML = '';
    
    for (let i = 0; i < cantidad; i++) {
      const dot = document.createElement('div');
      dot.className = 'ros-particle';
      
      const isPulmon = Math.random() < 0.6 && nivelPulmones > 0.5;
      const isHigado = !isPulmon && nivelHigado > 0.5;
      
      let top = 35;
      let left = 50;
      
      if (isPulmon) {
        top = 28 + Math.random() * 15; 
        left = 35 + Math.random() * 30; 
      } else if (isHigado) {
        top = 42 + Math.random() * 10; 
        left = 30 + Math.random() * 25; 
      } else {
        top = 25 + Math.random() * 40;
        left = 25 + Math.random() * 50;
      }

      dot.style.top = `${top}%`;
      dot.style.left = `${left}%`;
      
      const size = 4 + Math.random() * 10;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.animationDelay = `${Math.random() * 2}s`;
      
      layer.appendChild(dot);
      setTimeout(() => dot.classList.add('active'), 50);
    }
  }
}

function bindEvents() {
  ['tabaco', 'alcohol', 'vapeo'].forEach(key => {
    dom[key].addEventListener('input', (e) => {
      state[key] = parseInt(e.target.value, 10);
      actualizarUI();
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

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  actualizarUI();
});
