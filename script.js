let radar1, radar2;
let radar2Ready = false;
let chartColor = '#92dfec';
let isMulticolor = false;

const CHART1_CENTER = { x: 247, y: 250 };
const CHART_SIZE_MULTIPLIER = 1.0;

/* === UTILITIES === */
function hexToRGBA(hex, alpha) {
  if (hex.startsWith('rgb')) return hex.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function mixColors(c1, c2, weight = 0.5) {
  const toRGB = hex => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
  const [r1, g1, b1] = toRGB(c1);
  const [r2, g2, b2] = toRGB(c2);
  const r = Math.round(r1 * (1 - weight) + r2 * weight);
  const g = Math.round(g1 * (1 - weight) + g2 * weight);
  const b = Math.round(b1 * (1 - weight) + b2 * weight);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getAxisColors() {
  return [
    axisColors.power.value,
    axisColors.speed.value,
    axisColors.trick.value,
    axisColors.recovery.value,
    axisColors.defense.value
  ];
}

/* === PLUGINS === */
const fixedCenterPlugin = {
  id: 'fixedCenter',
  beforeLayout(chart) {
    const opt = chart.config.options.fixedCenter;
    if (!opt?.enabled) return;
    const r = chart.scales.r;
    if (opt.centerX && opt.centerY) {
      r.xCenter = opt.centerX;
      r.yCenter = opt.centerY;
    }
  }
};

const radarBackgroundPlugin = {
  id: 'customPentagonBackground',
  beforeDatasetsDraw(chart) {
    const opts = chart.config.options.customBackground;
    if (!opts?.enabled) return;
    const r = chart.scales.r, ctx = chart.ctx;
    const cx = r.xCenter, cy = r.yCenter, radius = r.drawingArea;
    const N = chart.data.labels.length, start = -Math.PI / 2;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, '#f8fcff');
    gradient.addColorStop(0.33, '#92dfec');
    gradient.addColorStop(1, '#92dfec');

    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = start + (i * 2 * Math.PI / N);
      const x = cx + radius * Math.cos(a);
      const y = cy + radius * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  },
  afterDatasetsDraw(chart) {
    const opts = chart.config.options.customBackground;
    if (!opts?.enabled) return;
    const r = chart.scales.r, ctx = chart.ctx;
    const cx = r.xCenter, cy = r.yCenter, radius = r.drawingArea;
    const N = chart.data.labels.length, start = -Math.PI / 2;

    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = start + (i * 2 * Math.PI / N);
      const x = cx + radius * Math.cos(a);
      const y = cy + radius * Math.sin(a);
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#35727d';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = start + (i * 2 * Math.PI / N);
      const x = cx + radius * Math.cos(a);
      const y = cy + radius * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#184046';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
};

/* === OUTLINED LABELS (MATCH ABILITY COLOR) - UPDATED === */
const outlinedLabelsPlugin = {
  id: 'outlinedLabels',
  afterDraw(chart) {
    const ctx = chart.ctx;
    const r = chart.scales.r;
    const labels = chart.data.labels;
    const dataValues = chart.data.datasets[0].data;
    const isChart1 = chart.canvas.id === 'radarChart1';
    
    const cx = r.xCenter, cy = r.yCenter;
    const base = -Math.PI / 2;
    const labelColor = chart.config.options.abilityColor || chartColor;
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // --- 1. Draw Main Labels ---
    ctx.font = 'italic 18px Candara';
    ctx.strokeStyle = labelColor;
    ctx.fillStyle = 'white';
    ctx.lineWidth = 4;
    
    labels.forEach((label, i) => {
      let currentRadius = r.drawingArea * 1.1; // Default
      
      if (isChart1) {
        currentRadius = r.drawingArea * 1.05; // Slightly closer for chart 1 to make room for value
      } else {
        // Chart 2: Apply the increased spacing for Speed and Defense
        if (label === 'Speed' || label === 'Defense') {
          currentRadius = r.drawingArea * 1.15;
        }
      }

      const angle = base + (i * 2 * Math.PI / labels.length);
      const x = cx + currentRadius * Math.cos(angle);
      const y = cy + currentRadius * Math.sin(angle);
      
      // Draw Label (Power, Speed, etc.)
      ctx.strokeText(label, x, y);
      ctx.fillText(label, x, y);
      
      // --- 2. Draw Input Values (Chart 1 only) ---
      if (isChart1) {
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'transparent';
        ctx.font = 'italic 14px Candara';
        
        let valueY = y + 20; 
        
        if (label === 'Speed' || label === 'Defense') {
          valueY = y + 25; // Push down slightly more due to angle
        }
        
        const valueX = cx + (currentRadius + 8) * Math.cos(angle); 
        const valueText = `(${dataValues[i].toFixed(1)})`;
        
        ctx.fillText(valueText, valueX, valueY);
      }
    });
    ctx.restore();
  }
};

/* === CHART CREATION & OPTIONS === */
function makeRadar(ctx, showPoints = true, withBackground = false, fixedCenter = null) {
  return new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Power', 'Speed', 'Trick', 'Recovery', 'Defense'],
      datasets: [{
        data: [0, 0, 0, 0, 0],
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        backgroundColor: hexToRGBA(chartColor, 0.65), // Placeholder
        borderColor: chartColor, // Placeholder
        pointBorderColor: chartColor, // Placeholder
        pointRadius: showPoints ? 5 : 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      layout: { padding: { top: 25, bottom: 25, left: 10, right: 10 } },
      scales: {
        r: {
          grid: { display: false },
          angleLines: { color: '#6db5c0', lineWidth: 1 },
          suggestedMin: 0,
          suggestedMax: 10,
          ticks: { display: false },
          pointLabels: { color: 'transparent' }
        }
      },
      customBackground: { enabled: withBackground },
      fixedCenter: { enabled: !!fixedCenter, centerX: fixedCenter?.x, centerY: fixedCenter?.y },
      abilityColor: chartColor,
      plugins: { legend: { display: false } }
    },
    plugins: [fixedCenterPlugin, radarBackgroundPlugin, outlinedLabelsPlugin]
  });
}

/* === DOM ELEMENTS === */
const viewBtn = document.getElementById('viewBtn');
const imgInput = document.getElementById('imgInput');
const uploadedImg = document.getElementById('uploadedImg');
const overlay = document.getElementById('overlay');
const overlayImg = document.getElementById('overlayImg');
const overlayName = document.getElementById('overlayName');
const overlayAbility = document.getElementById('overlayAbility');
const overlayLevel = document.getElementById('overlayLevel');
const closeBtn = document.getElementById('closeBtn');
const downloadBtn = document.getElementById('downloadBtn');

const powerInput = document.getElementById('powerInput');
const speedInput = document.getElementById('speedInput');
const trickInput = document.getElementById('trickInput');
const recoveryInput = document.getElementById('recoveryInput');
const defenseInput = document.getElementById('defenseInput');

const colorPicker = document.getElementById('colorPicker');
const multiBtn = document.getElementById('multiBtn');
const nameInput = document.getElementById('nameInput');
const abilityInput = document.getElementById('abilityInput');
const levelInput = document.getElementById('levelInput');

const axisColors = {
  power: document.getElementById('powerColor'),
  speed: document.getElementById('speedColor'),
  trick: document.getElementById('trickColor'),
  recovery: document.getElementById('recoveryColor'),
  defense: document.getElementById('defenseColor')
};

const inputElements = [
  powerInput, speedInput, trickInput, recoveryInput, defenseInput,
  colorPicker, ...Object.values(axisColors)
];


/* === INIT === */
window.addEventListener('load', () => {
  chartColor = colorPicker.value || chartColor;
  const ctx1 = document.getElementById('radarChart1').getContext('2d');
  radar1 = makeRadar(ctx1, true, false, CHART1_CENTER);
  updateCharts();
});

/* === UPDATE CHARTS - INCLUDES COLOR SYNC LOGIC === */
function updateCharts() {
  const vals = [
    +powerInput.value || 0,
    +speedInput.value || 0,
    +trickInput.value || 0,
    +recoveryInput.value || 0,
    +defenseInput.value || 0
  ];
  
  const newChartColor = colorPicker.value || '#92dfec';
  
  // 1. Update main chart color state and sync axis colors if in Multicolor mode
  if (chartColor !== newChartColor) {
    chartColor = newChartColor;
    
    // ONLY update axis colors when in Multicolor mode
    if (isMulticolor) {
      Object.values(axisColors).forEach(el => el.value = chartColor);
    }
  }

  const maxVal = Math.max(...vals, 10);
  const cappedVals = vals.map(v => Math.min(v, 10));

  let datasetColors;
  let fillColor;

  if (isMulticolor) {
    datasetColors = getAxisColors();
    // Simple average mix for background fill
    fillColor = datasetColors.reduce((acc, curr, i) => i === 0 ? curr : mixColors(acc, curr, 1 / (i + 1)), datasetColors[0]);
  } else {
    // Monocolor: use the single chartColor for all aspects
    datasetColors = [chartColor, chartColor, chartColor, chartColor, chartColor];
    fillColor = chartColor;
  }
  
  // sync ability color to charts options (for outlined labels)
  if (radar1) radar1.options.abilityColor = chartColor;
  if (radar2) radar2.options.abilityColor = chartColor;

  // Apply updates to radar1 (Preview Chart)
  if (radar1) {
    radar1.options.scales.r.suggestedMax = maxVal;
    radar1.data.datasets[0].data = vals;
    radar1.data.datasets[0].borderColor = datasetColors;
    radar1.data.datasets[0].pointBorderColor = datasetColors;
    radar1.data.datasets[0].backgroundColor = hexToRGBA(fillColor, 0.65);
    radar1.update();
  }
  
  // Apply updates to radar2 (Overlay Chart)
  if (radar2Ready && radar2) {
    radar2.data.datasets[0].data = cappedVals;
    radar2.data.datasets[0].borderColor = datasetColors;
    radar2.data.datasets[0].pointBorderColor = datasetColors;
    radar2.data.datasets[0].backgroundColor = hexToRGBA(fillColor, 0.65);
    radar2.update();
  }
  
  // Note: Button text color is now controlled purely by CSS (always black)
}

/* === MULTICOLOR TOGGLE === */
multiBtn.addEventListener('click', () => {
  isMulticolor = !isMulticolor;
  multiBtn.textContent = isMulticolor ? 'Single Color' : 'Multicolor';
  Object.values(axisColors).forEach(el => el.classList.toggle('hidden', !isMulticolor));
  
  // When switching to multicolor, default axis colors to the current ability color
  if (isMulticolor) {
    Object.values(axisColors).forEach(el => el.value = chartColor);
  }
  updateCharts();
});

/* === INPUTS === */
inputElements.forEach(el => {
  el.addEventListener('input', updateCharts);
  el.addEventListener('change', updateCharts);
});

/* === IMAGE UPLOAD === */
imgInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => (uploadedImg.src = ev.target.result);
  reader.readAsDataURL(file);
});

/* === OVERLAY === */
viewBtn.addEventListener('click', () => {
  overlay.classList.remove('hidden');
  overlayImg.src = uploadedImg.src;
  overlayName.textContent = nameInput.value || '-';
  overlayAbility.textContent = abilityInput.value || '-';
  overlayLevel.textContent = levelInput.value || '-';

  setTimeout(() => {
    const img = document.getElementById('overlayImg');
    const textBox = document.querySelector('.text-box');
    const overlayChart = document.querySelector('.overlay-chart');
    const imgHeight = img.offsetHeight;
    const textHeight = textBox.offsetHeight;
    const targetSize = (imgHeight + textHeight) * CHART_SIZE_MULTIPLIER;

    // Adjust chart size dynamically
    if (overlayChart.style.height !== `${targetSize}px`) {
      overlayChart.style.height = `${targetSize}px`;
      overlayChart.style.width = `${targetSize}px`;
    }

    // Ensure radar2 is initialized/resized on opening
    const ctx2 = document.getElementById('radarChart2').getContext('2d');
    if (!radar2Ready) {
      radar2 = makeRadar(ctx2, false, true, { x: targetSize / 2, y: targetSize / 2 });
      radar2.options.scales.r.suggestedMax = 10;
      radar2Ready = true;
    } else radar2.resize();
    
    updateCharts(); // Final sync before view
  }, 200);
});

closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));

/* === DOWNLOAD === */
downloadBtn.addEventListener('click', () => {
  downloadBtn.style.visibility = 'hidden';
  closeBtn.style.visibility = 'hidden';
  const box = document.getElementById('characterBox');
  html2canvas(box, { scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    const cleanName = (nameInput.value || 'Unnamed').replace(/\s+/g, '_');
    link.download = `${cleanName}_CharacterChart.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    downloadBtn.style.visibility = 'visible';
    closeBtn.style.visibility = 'visible';
  });
});
