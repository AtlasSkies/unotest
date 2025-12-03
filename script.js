function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

let uploadedImage = null;

window.addEventListener("DOMContentLoaded", () => {

  const previewCanvas = document.getElementById("fullChartCanvas");
  const previewCtx = previewCanvas.getContext("2d");

  const modalCanvas = document.getElementById("modalChartCanvas");
  const modalCtx = modalCanvas.getContext("2d");

  const imageUpload = document.getElementById("imageUpload");
  const imagePreview = document.getElementById("imagePreview");

  const charName = document.getElementById("charName");
  const charIdLetters = document.getElementById("charIdLetters");
  const charIdNumbers = document.getElementById("charIdNumbers");

  const charSpecies = document.getElementById("charSpecies");
  const charAbility = document.getElementById("charAbility");
  const charGod = document.getElementById("charGod");
  const charDanger = document.getElementById("charDanger");
  const charLevel = document.getElementById("charLevel");

  const overall = document.getElementById("redacted");

  const statInputs = {
    energy: document.getElementById("statEnergy"),
    speed: document.getElementById("statSpeed"),
    support: document.getElementById("statSupport"),
    power: document.getElementById("statPower"),
    intelligence: document.getElementById("statIntelligence"),
    concentration: document.getElementById("statConcentration"),
    perception: document.getElementById("statPerception")
  };

  const viewBtn = document.getElementById("viewChartBtn");
  const modal = document.getElementById("chartModal");
  const closeBtn = document.getElementById("closeModalBtn");
  const modalImage = document.getElementById("modalImage");
  const modalInfo = document.getElementById("modalInfo");
  const fileTypeGod = document.getElementById("fileTypeGod");
  const downloadBtn = document.getElementById("modalDownloadBtn");

  /* --------------------------------------------- */
  /* IMAGE UPLOAD + AUTO-FIT PREVIEW               */
  /* --------------------------------------------- */
  imageUpload.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        uploadedImage = img;
        imagePreview.src = img.src;
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  /* --------------------------------------------- */
  /* CHARACTER ID INPUTS                           */
  /* --------------------------------------------- */
  charIdLetters.addEventListener("input", () => {
    charIdLetters.value = charIdLetters.value.replace(/[^A-Za-z]/g, "").toUpperCase();
  });

  charIdNumbers.addEventListener("input", () => {
    charIdNumbers.value = charIdNumbers.value.replace(/[^0-9]/g, "");
  });

  function getCharacterID() {
    const letters = charIdLetters.value;
    const numbers = charIdNumbers.value;
    if (letters.length === 3 && numbers.length === 9) {
      return `${letters}-${numbers}`;
    }
    return "Unknown";
  }

  /* --------------------------------------------- */
  /* STATS                                         */
  /* --------------------------------------------- */
  function getStats() {
    return [
      clamp(parseFloat(statInputs.energy.value), 1, 10),
      clamp(parseFloat(statInputs.speed.value), 1, 10),
      clamp(parseFloat(statInputs.support.value), 1, 10),
      clamp(parseFloat(statInputs.power.value), 1, 10),
      clamp(parseFloat(statInputs.intelligence.value), 1, 10),
      clamp(parseFloat(statInputs.concentration.value), 1, 10),
      clamp(parseFloat(statInputs.perception.value), 1, 10)
    ];
  }

  function getOverall() {
    return clamp(parseFloat(overall.value), 1, 10);
  }

  function computeLevel(stats, ov) {
    return stats.reduce((a, b) => a + b, 0) + ov * 3;
  }

  /* --------------------------------------------- */
  /* DRAW CHART (sunburst + ring hugging it)       */
  /* --------------------------------------------- */
  function drawChart(ctx, canvas, stats, overallVal) {

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    const secCount = 7;
    const rings = 10;

    /* Sunburst bigger */
    const sunburstScale = 1.08;

    /* Base scale for ring thickness */
    const ringScale = 0.85;

    const maxRadius = (w / 2) * sunburstScale;

    const inner = 0;                // start sunburst at center
    const outer = maxRadius * 0.78; // outer radius of sunburst
    const ringT = (outer - inner) / rings;

    const secA = (2 * Math.PI) / secCount;
    const hues = [0, 30, 55, 130, 210, 255, 280];

    /* --------- SUNBURST --------- */
    for (let i = 0; i < secCount; i++) {

      const a0 = -Math.PI / 2 + i * secA;
      const a1 = a0 + secA;

      const val = stats[i];
      const hue = hues[i];

      for (let r = 0; r < val; r++) {
        const rIn = inner + r * ringT;
        const rOut = rIn + ringT;

        ctx.beginPath();
        ctx.arc(cx, cy, rOut, a0, a1);
        ctx.arc(cx, cy, rIn, a1, a0, true);
        ctx.closePath();

        ctx.fillStyle = `hsl(${hue}, ${45 + r * 4}%, ${72 - r * 4}%)`;
        ctx.fill();
      }
    }

    /* Center circle */
    ctx.beginPath();
    ctx.arc(cx, cy, outer * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    /* --------- OUTER RING (hugging the sunburst) --------- */

    const ringGap = 0; // no space between sunburst and ring
    const baseRingThickness = 30 * ringScale; // thickness of ring

    const ringIn = outer + ringGap;              // starts right at sunburst edge
    const ringOut = ringIn + baseRingThickness;  // extends outward by thickness

    const wedgeA = (2 * Math.PI) / 10;

    /* Background ring */
    ctx.beginPath();
    ctx.arc(cx, cy, ringOut, 0, Math.PI * 2);
    ctx.arc(cx, cy, ringIn, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    const full = Math.floor(overallVal);
    const frac = overallVal - full;

    function wedgeColor(i) {
      return `hsl(220, 30%, ${70 - i * 4}%)`;
    }

    /* Full wedges */
    for (let i = 0; i < full; i++) {
      const a0 = -Math.PI / 2 + i * wedgeA;
      const a1 = a0 + wedgeA;

      ctx.beginPath();
      ctx.arc(cx, cy, ringOut, a0, a1);
      ctx.arc(cx, cy, ringIn, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = wedgeColor(i);
      ctx.fill();
    }

    /* Fractional wedge */
    if (frac > 0) {
      const i = full;
      const a0 = -Math.PI / 2 + i * wedgeA;
      const a1 = a0 + wedgeA * frac;

      ctx.beginPath();
      ctx.arc(cx, cy, ringOut, a0, a1);
      ctx.arc(cx, cy, ringIn, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = wedgeColor(i);
      ctx.fill();
    }
  }

  /* --------------------------------------------- */
  /* LIVE PREVIEW                                  */
  /* --------------------------------------------- */
  function updatePreview() {
    const stats = getStats();
    const ov = getOverall();
    charLevel.value = computeLevel(stats, ov).toFixed(1);
    drawChart(previewCtx, previewCanvas, stats, ov);
  }

  Object.values(statInputs).forEach(i => i.addEventListener("input", updatePreview));
  overall.addEventListener("input", updatePreview);

  updatePreview();

  /* --------------------------------------------- */
  /* OPEN POPUP                                    */
  /* --------------------------------------------- */
  viewBtn.addEventListener("click", () => {
    const stats = getStats();
    const ov = getOverall();
    const lvl = computeLevel(stats, ov);

    charLevel.value = lvl.toFixed(1);
    fileTypeGod.textContent = charGod.value;

    modalImage.src = uploadedImage ? uploadedImage.src : "";

    modalInfo.innerHTML =
      `<div><span class="label">Name:</span> ${charName.value || "Unknown"}</div>
       <div><span class="label">Character ID:</span> ${getCharacterID()}</div>
       <div><span class="label">Species:</span> ${charSpecies.value || "Unknown"}</div>
       <div><span class="label">Ability:</span> ${charAbility.value || "Unknown"}</div>
       <div><span class="label">Patron God:</span> ${charGod.value}</div>
       <div><span class="label">Danger Level:</span> ${charDanger.value}</div>
       <div><span class="label">Level Index:</span> ${lvl.toFixed(1)}</div>`;

    drawChart(modalCtx, modalCanvas, stats, ov);

    modal.classList.remove("hidden");
  });

  /* --------------------------------------------- */
  /* CLOSE POPUP                                   */
  /* --------------------------------------------- */
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  /* --------------------------------------------- */
  /* DOWNLOAD CHART                                */
  /* --------------------------------------------- */
  downloadBtn.addEventListener("click", () => {

    const wrap = document.getElementById("modalWrapper");
    const rect = wrap.getBoundingClientRect();

    const tmp = document.createElement("canvas");
    tmp.width = rect.width * 2;
    tmp.height = rect.height * 2;

    const tctx = tmp.getContext("2d");
    tctx.scale(2, 2);

    tctx.fillStyle = "#ffffff";
    tctx.fillRect(0, 0, rect.width, rect.height);

    /* Render image */
    if (uploadedImage) {
      tctx.drawImage(modalImage, 10, 10, 240, 300);
    }

    /* Render text */
    tctx.fillStyle = "#000";
    tctx.font = "18px Georgia";
    let y = 330;
    modalInfo.innerText.split("\n").forEach(line => {
      tctx.fillText(line, 10, y);
      y += 26;
    });

    /* Render chart */
    tctx.drawImage(modalCanvas, 350, 10);

    /* Download */
    const name = (charName.value || "character").replace(/\s+/g, "");
    const link = document.createElement("a");
    link.download = `${name}_mr_characterchart.png`;
    link.href = tmp.toDataURL();
    link.click();
  });

});
