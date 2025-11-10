let radar1, radar2;
let radar2Ready = false;
let chartColor = 'rgb(135, 71, 230)';
let isMultiColor = false;

const CHART1_CENTER = { x: 247, y: 250 };
const CHART_SIZE_MULTIPLIER = 1.0;

/* === COLOR HELPERS === */
function hexToRGBA(hex, alpha) {
  if (hex.startsWith('rgb')) return hex.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function createGradient(ctx, color1, color2, alpha) {
  const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
  gradient.addColorStop(0, hexToRGBA(color1, alpha));
  gradient.addColorStop(1, hexToRGBA(color2, alpha));
  return gradient;
}

function getDatasetColors(chart) {
  if (!isMultiColor) {
    const baseColor = document.getElementById("colorPicker").value;
    return hexToRGBA(baseColor, 0.65);
  } else {
    const colors = [
      document.getElementById("powerColor").value,
      document.getElementById("speedColor").value,
      document.getElementById("trickColor").value,
      document.getElementById("recoveryColor").value,
      document.getElementById("defenseColor").value
    ];
    return colors.map((c, i) => {
      const next = colors[(i + 1) % colors.length];
      return createGradient(chart.ctx, c, next, 0.65);
    });
  }
}

/* === CHART CREATOR === */
function makeRadar(ctx, showPoints = true, withBackground = false, fixedCenter = null) {
  return new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Power', 'Speed', 'Trick', 'Recovery', 'Defense'],
      datasets: [{
        data: [0, 0, 0, 0, 0],
        backgroundColor: hexToRGBA(chartColor, 0.65),
        borderColor: chartColor,
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: chartColor,
        pointRadius: showPoints ? 5 : 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
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
      plugins: { legend: { display: false } }
    }
  });
}

/* === UPDATE CHARTS === */
function updateCharts() {
  const vals = [
    +document.getElementById('powerInput').value || 0,
    +document.getElementById('speedInput').value || 0,
    +document.getElementById('trickInput').value || 0,
    +document.getElementById('recoveryInput').value || 0,
    +document.getElementById('defenseInput').value || 0
  ];
  const maxVal = Math.max(...vals, 10);
  chartColor = document.getElementById('colorPicker').value || chartColor;

  if (radar1) {
    radar1.options.scales.r.suggestedMax = maxVal;
    radar1.data.datasets[0].data = vals;
    radar1.data.datasets[0].backgroundColor = getDatasetColors(radar1);
    radar1.data.datasets[0].borderColor = chartColor;
    radar1.update();
  }

  if (radar2Ready && radar2) {
    radar2.options.scales.r.suggestedMax = 10;
    radar2.data.datasets[0].data = vals.map(v => Math.min(v, 10));
    radar2.data.datasets[0].backgroundColor = getDatasetColors(radar2);
    radar2.data.datasets[0].borderColor = chartColor;
    radar2.update();
  }
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
const nameInput = document.getElementById('nameInput');
const abilityInput = document.getElementById('abilityInput');
const levelInput = document.getElementById('levelInput');

/* === MAIN CHART === */
window.addEventListener('load', () => {
  const ctx1 = document.getElementById('radarChart1').getContext('2d');
  radar1 = makeRadar(ctx1, true, false, CHART1_CENTER);
  document.getElementById('colorPicker').value = chartColor;
  chartColor = document.getElementById('colorPicker').value || chartColor;
  updateCharts();
});

/* === INPUT LISTENERS === */
['powerInput','speedInput','trickInput','recoveryInput','defenseInput','colorPicker']
  .forEach(id => {
    document.getElementById(id).addEventListener('input', updateCharts);
    document.getElementById(id).addEventListener('change', updateCharts);
  });

// Axis color pickers
['powerColor','speedColor','trickColor','recoveryColor','defenseColor']
  .forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      if (isMultiColor) updateCharts();
    });
  });

// Toggle button
const multiBtn = document.getElementById("multiColorBtn");
multiBtn.addEventListener("click", () => {
  isMultiColor = !isMultiColor;
  multiBtn.textContent = isMultiColor ? "Single-color" : "Multi-color";
  document.getElementById("axisColors").classList.toggle("hidden", !isMultiColor);
  updateCharts();
});

/* === IMAGE UPLOAD === */
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

/* === DOWNLOAD === */
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

    downloadBtn.style
          downloadBtn.style.visibility = 'visible';
    closeBtn.style.visibility = 'visible';
  });
});
