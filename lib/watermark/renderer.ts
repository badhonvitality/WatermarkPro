import { WatermarkConfig } from "@/types/watermark";

/**
 * Calculates responsive font size relative to source image dimensions
 * so the watermark has uniform visual proportions across any resolution.
 */
export function calculateEffectiveFontSize(
  width: number,
  height: number,
  baseSize: number
): number {
  const referenceDimension = Math.max(width, height);
  const scaled = Math.round((baseSize / 1000) * referenceDimension);
  return Math.max(12, Math.min(scaled, Math.round(referenceDimension * 0.3)));
}

/**
 * Helper to draw a single tiled grid pass for text at a given angle
 */
function drawTiledGridPass(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
  rad: number,
  opacity: number,
  effectiveFontSize: number,
  config: WatermarkConfig,
  reverseStagger = false
) {
  const metrics = ctx.measureText(text);
  const textWidth = Math.max(metrics.width, effectiveFontSize * 2);
  const textHeight = effectiveFontSize * 1.2;

  const densityMultipliers: Record<string, number> = {
    sparse: 1.7,
    normal: 1.0,
    dense: 0.65,
    "very-dense": 0.45,
  };
  const densityMultiplier = densityMultipliers[config.density] || 1.0;

  const hSpacingPx = (config.horizontalSpacing / 100) * effectiveFontSize * 3.5 * densityMultiplier;
  const vSpacingPx = (config.verticalSpacing / 100) * effectiveFontSize * 2.4 * densityMultiplier;

  const stepX = textWidth + Math.max(20, hSpacingPx);
  const stepY = textHeight + Math.max(20, vSpacingPx);

  const diagonal = Math.hypot(width, height) * 1.35;
  const numCols = Math.ceil(diagonal / stepX) + 2;
  const numRows = Math.ceil(diagonal / stepY) + 2;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(width / 2, height / 2);
  ctx.rotate(rad);

  for (let r = -numRows; r <= numRows; r++) {
    let stagger = (Math.abs(r) % 2 === 1) ? stepX * 0.5 : 0;
    if (reverseStagger) {
      stagger = (Math.abs(r) % 2 === 0) ? stepX * 0.5 : 0;
    }

    if (config.randomizeOffset) {
      const jitter = Math.sin(r * 12.9898) * 0.25 * stepX;
      stagger += jitter;
    }

    const y = r * stepY;

    for (let c = -numCols; c <= numCols; c++) {
      const x = c * stepX + stagger;
      ctx.fillText(text, x, y);
    }
  }

  ctx.restore();
}

/**
 * Helper to draw a single tiled grid pass for a logo image at a given angle
 */
function drawTiledLogoPass(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  logo: CanvasImageSource,
  targetW: number,
  targetH: number,
  rad: number,
  opacity: number,
  config: WatermarkConfig,
  reverseStagger = false
) {
  const densityMultipliers: Record<string, number> = {
    sparse: 1.7,
    normal: 1.0,
    dense: 0.65,
    "very-dense": 0.45,
  };
  const densityMultiplier = densityMultipliers[config.density] || 1.0;

  const hSpacingPx = (config.horizontalSpacing / 100) * targetW * 0.9 * densityMultiplier;
  const vSpacingPx = (config.verticalSpacing / 100) * targetH * 0.9 * densityMultiplier;

  const stepX = targetW + Math.max(15, hSpacingPx);
  const stepY = targetH + Math.max(15, vSpacingPx);

  const diagonal = Math.hypot(width, height) * 1.35;
  const numCols = Math.ceil(diagonal / stepX) + 2;
  const numRows = Math.ceil(diagonal / stepY) + 2;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(width / 2, height / 2);
  ctx.rotate(rad);

  for (let r = -numRows; r <= numRows; r++) {
    let stagger = (Math.abs(r) % 2 === 1) ? stepX * 0.5 : 0;
    if (reverseStagger) {
      stagger = (Math.abs(r) % 2 === 0) ? stepX * 0.5 : 0;
    }

    if (config.randomizeOffset) {
      const jitter = Math.sin(r * 12.9898) * 0.25 * stepX;
      stagger += jitter;
    }

    const y = r * stepY - targetH / 2;

    for (let c = -numCols; c <= numCols; c++) {
      const x = c * stepX + stagger - targetW / 2;
      ctx.drawImage(logo, x, y, targetW, targetH);
    }
  }

  ctx.restore();
}

/**
 * Draws the text watermark layer
 */
function renderTextWatermarkLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: WatermarkConfig
) {
  const effectiveFontSize = calculateEffectiveFontSize(width, height, config.fontSize);
  const fontString = `${config.fontWeight} ${effectiveFontSize}px "${config.fontFamily}", system-ui, -apple-system, sans-serif`;

  ctx.save();
  ctx.font = fontString;
  ctx.fillStyle = config.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const rad = (config.angle * Math.PI) / 180;

  if (config.mode === "single") {
    let targetX = width / 2;
    let targetY = height / 2;
    const marginX = width * 0.15;
    const marginY = height * 0.15;

    switch (config.position) {
      case "top-left":
        targetX = marginX;
        targetY = marginY;
        break;
      case "top-right":
        targetX = width - marginX;
        targetY = marginY;
        break;
      case "bottom-left":
        targetX = marginX;
        targetY = height - marginY;
        break;
      case "bottom-right":
        targetX = width - marginX;
        targetY = height - marginY;
        break;
      case "center":
      default:
        targetX = width / 2;
        targetY = height / 2;
        break;
    }

    ctx.globalAlpha = config.opacity;
    ctx.translate(targetX, targetY);
    ctx.rotate(rad);
    ctx.fillText(config.text, 0, 0);
  } else if (config.mode === "cross-hatch") {
    const halfOpacity = Math.max(0.04, config.opacity * 0.85);
    drawTiledGridPass(ctx, width, height, config.text, rad, halfOpacity, effectiveFontSize, config, false);
    drawTiledGridPass(ctx, width, height, config.text, -rad, halfOpacity, effectiveFontSize, config, true);
  } else if (config.mode === "ribbon") {
    const densityMultipliers: Record<string, number> = {
      sparse: 1.6,
      normal: 1.0,
      dense: 0.65,
      "very-dense": 0.45,
    };
    const densityMultiplier = densityMultipliers[config.density] || 1.0;

    const ribbonText = `   ${config.text}   •`;
    const ribbonTextWidth = ctx.measureText(ribbonText).width;
    const ribbonHeight = effectiveFontSize * 1.5;
    const ribbonStepY = (ribbonHeight + (config.verticalSpacing / 100) * effectiveFontSize * 2.8) * densityMultiplier;

    const diagonal = Math.hypot(width, height) * 1.35;
    const numBands = Math.ceil(diagonal / ribbonStepY) + 2;
    const numRepeats = Math.ceil(diagonal / ribbonTextWidth) + 3;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rad);

    for (let r = -numBands; r <= numBands; r++) {
      const y = r * ribbonStepY;

      ctx.save();
      ctx.globalAlpha = config.opacity * 0.16;
      ctx.fillRect(-diagonal, y - ribbonHeight / 2, diagonal * 2, ribbonHeight);
      ctx.restore();

      ctx.globalAlpha = config.opacity;
      for (let c = -numRepeats; c <= numRepeats; c++) {
        const x = c * ribbonTextWidth;
        ctx.fillText(ribbonText, x, y);
      }
    }

    ctx.restore();
  } else if (config.mode === "frame") {
    const margin = Math.round(Math.min(width, height) * 0.05) + Math.round(effectiveFontSize * 0.8);
    const borderText = `${config.text}   •   `;
    const textW = ctx.measureText(borderText).width;
    ctx.globalAlpha = config.opacity;

    // Top border
    ctx.save();
    ctx.textAlign = "left";
    for (let x = margin; x < width - margin; x += textW) {
      ctx.fillText(borderText, x, margin);
    }
    // Bottom border
    for (let x = margin; x < width - margin; x += textW) {
      ctx.fillText(borderText, x, height - margin);
    }
    ctx.restore();

    // Left border (vertical)
    ctx.save();
    ctx.translate(margin, margin);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = "left";
    for (let y = 0; y < height - margin * 2; y += textW) {
      ctx.fillText(borderText, y, 0);
    }
    ctx.restore();

    // Right border (vertical)
    ctx.save();
    ctx.translate(width - margin, margin);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = "left";
    for (let y = 0; y < height - margin * 2; y += textW) {
      ctx.fillText(borderText, y, 0);
    }
    ctx.restore();

    // Corner security brackets
    const bracketSize = Math.round(margin * 0.7);
    ctx.save();
    ctx.strokeStyle = config.color;
    ctx.lineWidth = Math.max(2, Math.round(effectiveFontSize * 0.12));
    ctx.globalAlpha = config.opacity * 0.75;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(margin - bracketSize, margin);
    ctx.lineTo(margin, margin);
    ctx.lineTo(margin, margin - bracketSize);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - margin + bracketSize, margin);
    ctx.lineTo(width - margin, margin);
    ctx.lineTo(width - margin, margin - bracketSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(margin - bracketSize, height - margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(margin, height - margin + bracketSize);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - margin + bracketSize, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.lineTo(width - margin, height - margin + bracketSize);
    ctx.stroke();

    ctx.restore();
  } else {
    drawTiledGridPass(ctx, width, height, config.text, rad, config.opacity, effectiveFontSize, config, false);
  }

  ctx.restore();

  // Optional Center Watermark
  if (config.addCenterWatermark && (config.mode === "tiled" || config.mode === "cross-hatch" || config.mode === "frame")) {
    ctx.save();
    const centerFontSize = Math.round(effectiveFontSize * 1.85);
    ctx.font = `${config.fontWeight} ${centerFontSize}px "${config.fontFamily}", system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = config.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = config.centerWatermarkOpacity || 0.40;

    ctx.translate(width / 2, height / 2);
    ctx.rotate(rad);
    ctx.fillText(config.text, 0, 0);
    ctx.restore();
  }
}

/**
 * Draws the logo watermark layer
 */
function renderLogoWatermarkLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: WatermarkConfig
) {
  if (!config.logoImage) return;
  const logo = config.logoImage;

  const logoW = (logo as any).naturalWidth || (logo as any).videoWidth || (logo as any).width || 100;
  const logoH = (logo as any).naturalHeight || (logo as any).videoHeight || (logo as any).height || 100;
  const aspect = logoW / Math.max(1, logoH);

  // Responsive scale relative to shortest canvas dimension
  const baseDim = Math.min(width, height);
  const scalePercent = config.logoScale ?? 20;
  const targetW = Math.max(24, Math.round((baseDim * scalePercent) / 100));
  const targetH = Math.max(24, Math.round(targetW / aspect));

  const opacity = config.logoOpacity ?? 0.35;
  const rad = (config.angle * Math.PI) / 180;

  if (config.mode === "single") {
    let targetX = width / 2;
    let targetY = height / 2;
    const marginX = width * 0.12;
    const marginY = height * 0.12;

    switch (config.position) {
      case "top-left":
        targetX = marginX;
        targetY = marginY;
        break;
      case "top-right":
        targetX = width - marginX;
        targetY = marginY;
        break;
      case "bottom-left":
        targetX = marginX;
        targetY = height - marginY;
        break;
      case "bottom-right":
        targetX = width - marginX;
        targetY = height - marginY;
        break;
      case "center":
      default:
        targetX = width / 2;
        targetY = height / 2;
        break;
    }

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(targetX, targetY);
    ctx.rotate(rad);
    ctx.drawImage(logo as any, -targetW / 2, -targetH / 2, targetW, targetH);
    ctx.restore();
  } else if (config.mode === "cross-hatch") {
    const halfOpacity = Math.max(0.04, opacity * 0.85);
    drawTiledLogoPass(ctx, width, height, logo as any, targetW, targetH, rad, halfOpacity, config, false);
    drawTiledLogoPass(ctx, width, height, logo as any, targetW, targetH, -rad, halfOpacity, config, true);
  } else if (config.mode === "ribbon") {
    const densityMultipliers: Record<string, number> = {
      sparse: 1.6,
      normal: 1.0,
      dense: 0.65,
      "very-dense": 0.45,
    };
    const densityMultiplier = densityMultipliers[config.density] || 1.0;
    const ribbonHeight = targetH * 1.3;
    const ribbonStepY = (ribbonHeight + (config.verticalSpacing / 100) * targetH * 1.5) * densityMultiplier;
    const logoSpacing = targetW * 1.4;

    const diagonal = Math.hypot(width, height) * 1.35;
    const numBands = Math.ceil(diagonal / ribbonStepY) + 2;
    const numRepeats = Math.ceil(diagonal / logoSpacing) + 3;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rad);

    for (let r = -numBands; r <= numBands; r++) {
      const y = r * ribbonStepY;

      ctx.save();
      ctx.globalAlpha = opacity * 0.16;
      ctx.fillStyle = config.color || "#FFFFFF";
      ctx.fillRect(-diagonal, y - ribbonHeight / 2, diagonal * 2, ribbonHeight);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = opacity;
      for (let c = -numRepeats; c <= numRepeats; c++) {
        const x = c * logoSpacing - targetW / 2;
        ctx.drawImage(logo as any, x, y - targetH / 2, targetW, targetH);
      }
      ctx.restore();
    }
    ctx.restore();
  } else if (config.mode === "frame") {
    const margin = Math.round(Math.min(width, height) * 0.06);
    ctx.save();
    ctx.globalAlpha = opacity;

    // Corner logo stamps
    ctx.drawImage(logo as any, margin, margin, targetW, targetH);
    ctx.drawImage(logo as any, width - margin - targetW, margin, targetW, targetH);
    ctx.drawImage(logo as any, margin, height - margin - targetH, targetW, targetH);
    ctx.drawImage(logo as any, width - margin - targetW, height - margin - targetH, targetW, targetH);

    ctx.restore();
  } else {
    drawTiledLogoPass(ctx, width, height, logo as any, targetW, targetH, rad, opacity, config, false);
  }

  // Center logo stamp if enabled
  if (config.addCenterWatermark && (config.mode === "tiled" || config.mode === "cross-hatch" || config.mode === "frame")) {
    ctx.save();
    ctx.globalAlpha = config.centerWatermarkOpacity || 0.40;
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rad);
    const centerW = targetW * 1.4;
    const centerH = targetH * 1.4;
    ctx.drawImage(logo as any, -centerW / 2, -centerH / 2, centerW, centerH);
    ctx.restore();
  }
}

/**
 * Core rendering function used identically for both live preview and batch export.
 * Supports Text Only, Logo Only, or Both concurrently across all 5 pattern styles.
 */
export function renderWatermark(
  source: CanvasImageSource | HTMLImageElement | ImageBitmap | HTMLCanvasElement | OffscreenCanvas | HTMLVideoElement,
  config: WatermarkConfig,
  targetCanvas?: HTMLCanvasElement
): HTMLCanvasElement {
  const width =
    (source as any).naturalWidth ||
    (source as any).videoWidth ||
    (source as any).width ||
    1280;
  const height =
    (source as any).naturalHeight ||
    (source as any).videoHeight ||
    (source as any).height ||
    720;

  const canvas = targetCanvas || document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  if (!ctx) {
    throw new Error("Could not acquire 2D canvas context");
  }

  // 1. Draw source image or video frame
  ctx.drawImage(source as any, 0, 0, width, height);

  const watermarkType = config.watermarkType || "text";
  const isTextEnabled =
    (watermarkType === "text" || watermarkType === "both") &&
    Boolean(config.text && config.text.trim().length > 0);
  const isLogoEnabled =
    (watermarkType === "logo" || watermarkType === "both") &&
    Boolean(config.logoImage);

  // If neither text nor logo is active, return pristine canvas
  if (!isTextEnabled && !isLogoEnabled) {
    return canvas;
  }

  // 2. Render Text Watermark Layer
  if (isTextEnabled) {
    renderTextWatermarkLayer(ctx, width, height, config);
  }

  // 3. Render Logo Watermark Layer
  if (isLogoEnabled) {
    renderLogoWatermarkLayer(ctx, width, height, config);
  }

  return canvas;
}

