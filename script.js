let radar1, radar2;
let radar2Ready = false;
let chartColor = '#92dfec'; // Updated initial value to hex for consistency
let isMultiColor = false; // NEW STATE VARIABLE

const CHART1_CENTER = { x: 247, y: 250 };
const CHART_SCALE_FACTOR = 1.0;
const CHART_SIZE_MULTIPLIER = 1.0;
const WEDGE_ALPHA = 0.65; // Consistent transparency level

// Default colors for the axes
let axisColors = {
  'Power': '#ff6384', 
  'Speed': '#36a2eb', 
  'Trick': '#ffcd56', 
  'Recovery': '#4bc0c0', 
  'Defense': '#9966ff' 
};

function hexToRGBA(hex, alpha) {
  if (hex.startsWith('rgb')) return hex.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Function to convert hex to RGB array [r, g, b]
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
}

/* === MULTICOLOR GRADIENT FILL PLUGIN (NEW) === */
const multiColorGradientPlugin = {
  id: 'multiColorGradient',
  beforeDatasetDraw(chart, args, options) {
    const dataset = chart.data.datasets[0];
    if (!dataset.multiColorEnabled) return;

    const N = chart.data.labels.length;
    const r = chart.scales.r;
    const ctx = chart.ctx;
    const cx = r.xCenter, cy = r.yCenter;
    const data = dataset.data;
    const colors = dataset.axisColors;
    const startAngle = -Math.PI / 2;
    const angleSlice = (2 * Math.PI) / N;

    ctx.save();
    
    for (let i = 0; i < N; i++) {
      const valueA = data[i] / r.max * r.drawingArea;
      const valueB = data[(i + 1) % N] / r.max * r.drawingArea;
      const angleA = startAngle + i * angleSlice;
      const angleB = startAngle + (i + 1) * angleSlice;

      // Get the colors for the current (A) and next (B) axis
      const colorA = hexToRgb(colors[i]);
      const colorB = hexToRgb(colors[(i + 1) % N]);

      // Create a radial gradient from center to the max chart radius
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r.drawingArea);
      
      // Calculate blended colors for smooth transition between axis A and B
      // Stop 0 (Center): Near white/light blend
      gradient.addColorStop(0, `rgba(${colorA[0] * 0.5 + colorB[0] * 0.5}, ${colorA[1] * 0.5 + colorB[1] * 0.5}, ${colorA[2] * 0.5 + colorB[2] * 0.5}, 0.2)`);

      // Stop 1 (Edge): Blend of A and B with target transparency (0.65)
      const r_blend = Math.round(colorA[0] * 0.7 + colorB[0] * 0.3);
      const g_blend = Math.round(colorA[1] * 0.7 + colorB[1] * 0.3);
      const b_blend = Math.round(colorA[2] * 0.7 + colorB[2] * 0.3);
      gradient.addColorStop(1, `rgba(${r_blend}, ${g_blend}, ${b_blend}, ${WEDGE_ALPHA})`);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      
      // Draw a line to the point on axis A
      const xA = cx + valueA * Math.cos(angleA);
      const yA = cy + valueA * Math.sin(angleA);
      ctx.lineTo(xA, yA);

      // Draw a line to the point on axis B
      const xB = cx + valueB * Math.cos(angleB);
      const yB = cy + valueB * Math.sin(angleB);
      ctx.lineTo(xB, yB);
      
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.restore();

    // Ensure default fill and border are transparent
    dataset.backgroundColor = 'transparent';
    dataset.borderColor = 'transparent'; 
  }
};

/* === FIXED CENTER === */
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

/* === BACKGROUND + SPOKES === */
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

/* === OUTLINED LABELS (Speed & Defense slightly lowered) === */
const outlinedLabelsPlugin = {
  id: 'outlinedLabels',
  afterDraw(chart) {
    const ctx = chart.ctx;
    const r = chart.scales.r;
    const labels = chart.data.labels;
    const cx = r.xCenter, cy = r.yCenter;
    const isOverlayChart = chart.canvas.id === 'radarChart2';
    const baseRadius = r.drawingArea * 1.1;
    const extendedRadius = r.drawingArea * 1.15;
    const base = -Math.PI / 2;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'italic 18px Candara';
    ctx.strokeStyle = chartColor; // Uses chartColor for the outline
    ctx.fillStyle = 'white';
    ctx.lineWidth = 4;

    labels.forEach((label, i) => {
      let angle = base + (i * 2 * Math.PI / labels.length);
      let radiusToUse = baseRadius;
      if (isOverlayChart && (i === 1 || i === 4)) radiusToUse = extendedRadius;
      const x = cx + radiusToUse * Math.cos(angle);
      let y = cy + radiusToUse * Math.sin(angle);

      if (i === 0) y -= 5;
      if (isOverlayChart && (i === 1 || i === 4)) y -= 42; 

      ctx.strokeText(label, x, y);
      ctx.fillText(label, x, y);
    });
    ctx.restore();
  }
};

/* === NUMERIC LABELS (Speed & Defense slightly lowered) === */
const inputValuePlugin = {
  id: 'inputValuePlugin',
  afterDraw(chart) {
    if (chart.config.options.customBackground.enabled) return;
    const ctx = chart.ctx;
    const r = chart.scales.r;
    const data = chart.data.datasets[0].data;
    const labels = chart.data.labels;
    const cx = r.xCenter, cy = r.yCenter;
    const baseRadius = r.drawingArea * 1.1;
    const base = -Math.PI / 2;
    const offset = 20;
    ctx.save();
    ctx.font = '15px Candara';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    labels.forEach((label, i) => {
      const angle = base + (i * 2 * Math.PI / labels.length);
      let radiusToUse = baseRadius;
      if (chart.canvas.id === 'radarChart2' && (i === 1 || i === 4)) radiusToUse = r.drawingArea * 1.15;
      const x = cx + (radiusToUse + offset) * Math.cos(angle);
      let y = cy + (radiusToUse + offset) * Math.sin(angle);

      if (i === 0) y -= 20;
      if (chart.canvas.id === 'radarChart2') {
        if (i === 1 || i === 4) y -= 22; 
      } else {
        if (i === 1) y += 20;
        if (i === 4) y += 20;
      }
      ctx.fillText(`(${data[i] || 0})`, x, y);
    });
    ctx.restore();
  }
};


/* === CHART CREATOR === */
function makeRadar(ctx, showPoints = true, withBackground = false, fixedCenter = null) {
  return new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Power', 'Speed', 'Trick', 'Recovery', 'Defense'],
      datasets: [{
        data: [0, 0, 0, 0, 0],
        backgroundColor: hexToRGBA(chartColor, WEDGE_ALPHA),
        borderColor: chartColor,
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: chartColor,
        pointRadius: showPoints ? 5 : 0,
        // NEW PROPERTIES FOR MULTICOLOR MODE
        multiColorEnabled: false, 
        axisColors: Object.values(axisColors) 
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
      plugins: { legend: { display: false } }
    },
    plugins: [fixedCenterPlugin, radarBackgroundPlugin, outlinedLabelsPlugin, inputValuePlugin, multiColorGradientPlugin]
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
const nameInput = document.getElementById('nameInput');
const abilityInput = document.getElementById('abilityInput');
const levelInput = document.getElementById('levelInput');

// NEW DOM ELEMENTS
const multiColorBtn = document.getElementById('multiColorBtn');
const powerColor = document.getElementById('powerColor');
const speedColor = document.getElementById('speedColor');
const trickColor = document.getElementById('trickColor');
const recoveryColor = document.getElementById('recoveryColor');
const defenseColor = document.getElementById('defenseColor');
const multiColorInputs = document.querySelectorAll('.multi-color-input');


/* === INITIALIZATION === */
window.addEventListener('load', () => {
  const ctx1 = document.getElementById('radarChart1').getContext('2d');
  radar1 = makeRadar(ctx1, true, false, CHART1_CENTER);
  colorPicker.value = chartColor;
  
  // Initialize axis colors from the map
  powerColor.value = axisColors['Power'];
  speedColor.value = axisColors['Speed'];
  trickColor.value = axisColors['Trick'];
  recoveryColor.value = axisColors['Recovery'];
  defenseColor.value = axisColors['Defense'];
  
  updateCharts();
});


/* === MULTICOLOR TOGGLE FUNCTIONALITY (NEW) === */
function toggleMultiColorMode() {
  isMultiColor = !isMultiColor;
  multiColorBtn.textContent = isMultiColor ? 'Single Color' : 'Multi-color';
  multiColorBtn.style.backgroundColor = isMultiColor ? '#ff7f7f' : '#92dfec';
  
  // Toggle visibility of color pickers
  multiColorInputs.forEach(input => {
    input.classList.toggle('hidden', !isMultiColor);
  });
  
  // If switching *to* single-color mode, force sync axis colors to the main color
  if (!isMultiColor) {
    const singleColor = colorPicker.value;
    powerColor.value = singleColor;
    speedColor.value = singleColor;
    trickColor.value = singleColor;
    recoveryColor.value = singleColor;
    defenseColor.value = singleColor;
  }
  
  updateCharts();
}


/* === UPDATE CHARTS (MODIFIED) === */
function updateCharts() {
  const vals = [
    +powerInput.value || 0,
    +speedInput.value || 0,
    +trickInput.value || 0,
    +recoveryInput.value || 0,
    +defenseInput.value || 0
  ];
  const maxVal = Math.max(...vals, 10);
  
  // Global chart color for points and labels
  chartColor = colorPicker.value || chartColor;

  // Update axisColors from inputs if in multicolor mode
  if (isMultiColor) {
    axisColors['Power'] = powerColor.value;
    axisColors['Speed'] = speedColor.value;
    axisColors['Trick'] = trickColor.value;
    axisColors['Recovery'] = recoveryColor.value;
    axisColors['Defense'] = defenseColor.value;
  } else {
    // If in single color mode, sync axisColors to main color
    const singleColor = chartColor;
    axisColors['Power'] = singleColor;
    axisColors['Speed'] = singleColor;
    axisColors['Trick'] = singleColor;
    axisColors['Recovery'] = singleColor;
    axisColors['Defense'] = singleColor;
  }

  const axisColorsArray = Object.values(axisColors);

  // --- RADAR 1 (Preview Chart) ---
  if (radar1) {
    radar1.options.scales.r.suggestedMax = maxVal;
    radar1.data.datasets[0].data = vals;
    radar1.data.datasets[0].multiColorEnabled = isMultiColor;
    radar1.data.datasets[0].axisColors = axisColorsArray;

    if (isMultiColor) {
      // Multi-color mode: Set default fill/border to transparent (plugin handles fill)
      radar1.data.datasets[0].borderColor = 'transparent';
      radar1.data.datasets[0].backgroundColor = 'transparent';
    } else {
      // Single-color mode: Use solid color fill
      const fill = hexToRGBA(chartColor, WEDGE_ALPHA);
      radar1.data.datasets[0].borderColor = chartColor;
      radar1.data.datasets[0].backgroundColor = fill;
    }
    // Update point colors (always based on chartColor)
    radar1.data.datasets[0].pointBorderColor = chartColor;
    radar1.update();
  }

  // --- RADAR 2 (Overlay Chart) ---
  if (radar2Ready && radar2) {
    radar2.options.scales.r.suggestedMax = 10;
    const capped = vals.map(v => Math.min(v, 10));
    radar2.data.datasets[0].data = capped;
    radar2.data.datasets[0].multiColorEnabled = isMultiColor;
    radar2.data.datasets[0].axisColors = axisColorsArray;

    if (isMultiColor) {
      // Multi-color mode: Set default fill/border to transparent (plugin handles fill)
      radar2.data.datasets[0].borderColor = 'transparent';
      radar2.data.datasets[0].backgroundColor = 'transparent';
    } else {
      // Single-color mode: Use solid color fill
      const fill = hexToRGBA(chartColor, WEDGE_ALPHA);
      radar2.data.datasets[0].borderColor = chartColor;
      radar2.data.datasets[0].backgroundColor = fill;
    }
    radar2.data.datasets[0].pointBorderColor = chartColor;
    radar2.update();
  }
}

/* === INPUT LISTENERS === */
// Combine all numerical and color inputs
const allInputs = [
  powerInput, speedInput, trickInput, recoveryInput, defenseInput, 
  colorPicker, multiColorBtn, powerColor, speedColor, trickColor, 
  recoveryColor, defenseColor
];

allInputs.forEach(el => {
  if (el.id === 'multiColorBtn') {
    el.addEventListener('click', toggleMultiColorMode);
  } else if (el.id === 'colorPicker' && !isMultiColor) {
    // Handle sync when main color changes in single-color mode
    el.addEventListener('input', () => {
      if (!isMultiColor) {
        powerColor.value = el.value;
        speedColor.value = el.value;
        trickColor.value = el.value;
        recoveryColor.value = el.value;
        defenseColor.value = el.value;
      }
      updateCharts();
    });
  } else {
    el.addEventListener('input', updateCharts);
    el.addEventListener('change', updateCharts);
  }
});

imgInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { uploadedImg.src = ev.target.result; };
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

    overlayChart.style.height = `${targetSize}px`;
    overlayChart.style.width = `${targetSize}px`;

    const existingWatermark = document.querySelector('.image-section .watermark-image');
    if (!existingWatermark) {
      const wm = document.createElement('div');
      wm.textContent = 'AS';
      wm.className = 'watermark-image';
      Object.assign(wm.style, {
        position: 'absolute',
        bottom: '8px',
        left: '10px',
        fontFamily: 'Candara',
        fontWeight: 'bold',
        fontSize: '6px',
        color: 'rgba(0,0,0,0.15)',
        pointerEvents: 'none',
        zIndex: '2'
      });
      document.querySelector('.image-section').appendChild(wm);
    }

    const ctx2 = document.getElementById('radarChart2').getContext('2d');
    if (!radar2Ready) {
      radar2 = makeRadar(ctx2, false, true, { x: targetSize / 2, y: targetSize / 2 });
      radar2.options.scales.r.suggestedMax = 10;
      radar2Ready = true;
    } else {
      radar2.resize();
    }
    updateCharts();
  }, 200);
});

closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));

/* === ALWAYS DOWNLOAD HORIZONTAL LAYOUT === */
downloadBtn.addEventListener('click', () => {
  downloadBtn.style.visibility = 'hidden';
  closeBtn.style.visibility = 'hidden';

  const box = document.getElementById('characterBox');
  const originalFlex = box.style.flexDirection;
  const originalWidth = box.style.width;
  const originalHeight = box.style.height;

  box.style.flexDirection = 'row';
  box.style.width = '52vw';
  box.style.height = '64vh';
  box.style.maxHeight = 'none';
  box.style.overflow = 'visible';

  html2canvas(box, { scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    const cleanName = (nameInput.value || 'Unnamed').replace(/\s+/g, '_');
    link.download = `${cleanName}_CharacterChart.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    box.style.flexDirection = originalFlex;
    box.style.width = originalWidth;
    box.style.height = originalHeight;

    downloadBtn.style.visibility = 'visible';
    closeBtn.style.visibility = 'visible';
  });
});
