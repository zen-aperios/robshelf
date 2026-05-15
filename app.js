const canvas = document.getElementById("scene");
const panel = document.querySelector(".panel");
const loaderEl = document.getElementById("bookshelfLoader");
const loaderLottieEl = document.getElementById("bookshelfLoaderLottie");
const gl = canvas.getContext("webgl", { antialias: true, preserveDrawingBuffer: true });

if (!gl) {
  throw new Error("WebGL is not available in this browser.");
}

function resolveLoadLogoUrl() {
  const scoped = document.querySelector("[data-load-logo]");
  return scoped?.getAttribute("data-load-logo") || "";
}

let loaderAnimation = null;
let loaderAnimationReady = false;

function resolveLoaderAnimationPath() {
  return resolveLoadLogoUrl() || "./logo_lottie_v1.json";
}

function ensureLoaderAnimation() {
  if (loaderAnimation || !loaderLottieEl || !window.lottie) {
    return loaderAnimation;
  }
  loaderAnimation = window.lottie.loadAnimation({
    container: loaderLottieEl,
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: resolveLoaderAnimationPath(),
    rendererSettings: {
      preserveAspectRatio: "xMidYMid meet",
      progressiveLoad: true,
    },
  });
  loaderAnimation.addEventListener("DOMLoaded", () => {
    loaderAnimationReady = true;
  });
  return loaderAnimation;
}

if (document.readyState === "complete") {
  ensureLoaderAnimation();
} else {
  window.addEventListener("load", () => {
    ensureLoaderAnimation();
  }, { once: true });
}

const RAW_STARTUP_SETTINGS = window.BOOKSHELF_STARTUP_SETTINGS ?? {};
const EDGE_BEVEL_MAX = 0.04;
const DEFAULT_EDGE_ROUNDNESS = 0.18;

function clampUnit(value) {
  if (!Number.isFinite(value)) {
    return DEFAULT_EDGE_ROUNDNESS;
  }
  return Math.min(Math.max(value, 0), 1);
}

function normalizeStartupEdgeRoundness(rawValue) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return DEFAULT_EDGE_ROUNDNESS;
  }
  if (value <= EDGE_BEVEL_MAX) {
    // Backward compatibility for exports that stored raw bevel values.
    return clampUnit(value / EDGE_BEVEL_MAX);
  }
  return clampUnit(value);
}

function bevelToRoundness(bevel) {
  const value = Number(bevel);
  if (!Number.isFinite(value)) {
    return DEFAULT_EDGE_ROUNDNESS;
  }
  return clampUnit(value / EDGE_BEVEL_MAX);
}

function deriveEdgeRoundness(source) {
  const direct = Number(source?.edgeRoundness);
  if (Number.isFinite(direct)) {
    return normalizeStartupEdgeRoundness(direct);
  }

  const legacyBevels = [
    Number(source?.bevelFrontTop),
    Number(source?.bevelFrontBottom),
    Number(source?.bevelBackTop),
    Number(source?.bevelBackBottom),
    Number(source?.bevelSpine),
    Number(source?.bevelPage),
  ].filter((value) => Number.isFinite(value));

  if (legacyBevels.length > 0) {
    const average = legacyBevels.reduce((sum, value) => sum + value, 0) / legacyBevels.length;
    return bevelToRoundness(average);
  }

  return DEFAULT_EDGE_ROUNDNESS;
}

const STARTUP_EDGE_ROUNDNESS = deriveEdgeRoundness(RAW_STARTUP_SETTINGS);
const STARTUP_SETTINGS = {
  autoMove: true,
  patternRotate: true,
  staticLean: true,
  rotationPattern: "sine",
  hoverFocus: true,
  hoverResetRotation: true,
  hoverDomino: false,
  useImported: false,
  autoFitCount: false,
  sizePattern: "uniform",
  loadAnimation: "dropFade",
  sceneTone: "darker",
  widthScale: 2.6,
  heightScale: 0.96,
  depthScale: 1.43,
  edgeRoundness: STARTUP_EDGE_ROUNDNESS,
  matteAmount: 0,
  staticLeanAmount: 0.18,
  hoverSpeed: 0.14,
  returnSpeed: 0.1,
  speed: 0.35,
  dragSensitivity: 1,
  spacing: 0.3,
  waveTilt: 0,
  depthSwing: 0,
  leanAngle: 0,
  shelfVerticalOffset: -0.78,
  shelfRotationX: -0.03,
  shelfRotationY: 0,
  shelfRotationZ: 0,
  bookDepthOffset: 0,
  depthAlign: 0,
  bookCount: 19,
  bookRotationOverrides: Array.from({ length: 19 }, () => ({ x: 0, y: 0, z: 0 })),
  colors: {
    cover: "#c7612f",
    pages: "#f4ecdb",
    accent: "#1f2f66",
  },
  offset: 4.0101,
  importedFileName: null,
  ...RAW_STARTUP_SETTINGS,
};

function normalizeBookRotationOverrides(overrides, count) {
  return Array.from({ length: count }, (_, index) => {
    const existing = overrides?.[index];
    return {
      x: Number.isFinite(existing?.x) ? existing.x : 0,
      y: Number.isFinite(existing?.y) ? existing.y : 0,
      z: Number.isFinite(existing?.z) ? existing.z : 0,
    };
  });
}

function applyStartupControls(settings) {
  const startupEdgeRoundness = deriveEdgeRoundness(settings);
  const pairs = [
    ["autoMove", "checked", settings.autoMove],
    ["patternRotate", "checked", settings.patternRotate],
    ["staticLean", "checked", settings.staticLean],
    ["hoverFocus", "checked", settings.hoverFocus],
    ["hoverResetRotation", "checked", settings.hoverResetRotation],
    ["hoverDomino", "checked", settings.hoverDomino],
    ["useImported", "checked", settings.useImported],
    ["autoFitCount", "checked", settings.autoFitCount],
    ["rotationPattern", "value", settings.rotationPattern],
    ["sizePattern", "value", settings.sizePattern],
    ["loadAnimation", "value", settings.loadAnimation],
    ["sceneTone", "value", settings.sceneTone],
    ["speed", "value", settings.speed],
    ["dragSensitivity", "value", settings.dragSensitivity],
    ["spacing", "value", settings.spacing],
    ["widthScale", "value", settings.widthScale],
    ["heightScale", "value", settings.heightScale],
    ["depthScale", "value", settings.depthScale],
    ["edgeRoundness", "value", startupEdgeRoundness],
    ["matteAmount", "value", settings.matteAmount],
    ["staticLeanAmount", "value", settings.staticLeanAmount],
    ["hoverSpeed", "value", settings.hoverSpeed],
    ["returnSpeed", "value", settings.returnSpeed],
    ["waveTilt", "value", settings.waveTilt],
    ["depthSwing", "value", settings.depthSwing],
    ["leanAngle", "value", settings.leanAngle],
    ["shelfVerticalOffset", "value", settings.shelfVerticalOffset],
    ["shelfRotationX", "value", settings.shelfRotationX],
    ["shelfRotationY", "value", settings.shelfRotationY],
    ["shelfRotationZ", "value", settings.shelfRotationZ],
    ["bookDepthOffset", "value", settings.bookDepthOffset],
    ["depthAlign", "value", settings.depthAlign],
    ["bookCount", "value", settings.bookCount],
    ["coverColor", "value", settings.colors.cover],
    ["pageColor", "value", settings.colors.pages],
    ["accentColor", "value", settings.colors.accent],
  ];

  pairs.forEach(([key, prop, value]) => {
    if (controls[key]) {
      controls[key][prop] = typeof value === "number" ? String(value) : value;
    }
  });
}

function normalizeCmsBookEntry(entry) {
  if (!entry) {
    return null;
  }

  if (typeof entry === "string") {
    return {
      coverUrl: entry,
      backUrl: entry,
      spineUrl: entry,
    };
  }

  const coverUrl = entry.coverUrl ?? entry.cover ?? entry.faceUrl ?? entry.face ?? entry.coverImage ?? entry.front ?? "";
  const backUrl = entry.backUrl ?? entry.back ?? entry.rearUrl ?? entry.rear ?? entry.backImage ?? entry.backFace ?? "";
  const spineUrl = entry.spineUrl ?? entry.spine ?? entry.binderUrl ?? entry.binder ?? entry.side ?? entry.spineImage ?? "";
  const hoverSoundUrl = entry.hoverSoundUrl ?? entry.bookHoverSound ?? entry.hoverSound ?? "";
  const clickSoundUrl = entry.clickSoundUrl ?? entry.bookClickSound ?? entry.clickSound ?? "";
  if (!coverUrl && !backUrl && !spineUrl) {
    return null;
  }

  return {
    coverUrl,
    backUrl: backUrl || coverUrl,
    spineUrl: spineUrl || coverUrl,
    hoverSoundUrl,
    clickSoundUrl,
  };
}

function getWebflowCmsBooks() {
  const globalBooks = window.BOOKSHELF_CMS_BOOKS;
  if (Array.isArray(globalBooks) && globalBooks.length > 0) {
    return globalBooks.map(normalizeCmsBookEntry).filter(Boolean);
  }

  const collectionScope = document.querySelector("[data-book-hover-sound], [data-book-click-sound]");
  const collectionHoverSound = collectionScope?.getAttribute("data-book-hover-sound") || "";
  const collectionClickSound = collectionScope?.getAttribute("data-book-click-sound") || "";
  const items = document.querySelectorAll("[data-bookshelf-cms-item]");
  return Array.from(items).map((item) => {
    const coverImage = item.querySelector("[data-bookshelf-cover]");
    const backImage = item.querySelector("[data-bookshelf-back]");
    const spineImage = item.querySelector("[data-bookshelf-spine]");
    const coverUrl = coverImage?.currentSrc || coverImage?.src || "";
    const backUrl = backImage?.currentSrc || backImage?.src || "";
    const spineUrl = spineImage?.currentSrc || spineImage?.src || "";
    const localHoverSound = item.getAttribute("data-book-hover-sound") || "";
    const localClickSound = item.getAttribute("data-book-click-sound") || "";
    const inheritedHoverSound = item.closest("[data-book-hover-sound]")?.getAttribute("data-book-hover-sound") || "";
    const inheritedClickSound = item.closest("[data-book-click-sound]")?.getAttribute("data-book-click-sound") || "";
    const hoverSoundUrl = localHoverSound || inheritedHoverSound || collectionHoverSound;
    const clickSoundUrl = localClickSound || inheritedClickSound || collectionClickSound;
    return normalizeCmsBookEntry({
      coverUrl,
      backUrl,
      spineUrl,
      hoverSoundUrl,
      clickSoundUrl,
    });
  }).filter(Boolean);
}

function shuffleArray(items) {
  const next = items.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function loadImageBitmapFromUrl(url) {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to load image: ${url}`);
      }
      return response.blob();
    })
    .then((blob) => createImageBitmap(blob));
}

function createEmptyTexture() {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([255, 255, 255, 255]),
  );
  return texture;
}

function uploadCanvasToTexture(texture, sourceCanvas) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
}

function drawBitmapIntoAtlasRect(ctx, bitmap, rect, pad = 3) {
  if (!bitmap) {
    return;
  }
  const { x, y, width, height } = rect;
  const safePad = Math.max(0, Math.min(pad, Math.floor(Math.min(width, height) / 4)));
  if (safePad <= 0) {
    ctx.drawImage(bitmap, x, y, width, height);
    return;
  }

  const innerX = x + safePad;
  const innerY = y + safePad;
  const innerW = width - (safePad * 2);
  const innerH = height - (safePad * 2);
  if (innerW <= 0 || innerH <= 0) {
    ctx.drawImage(bitmap, x, y, width, height);
    return;
  }

  ctx.drawImage(bitmap, innerX, innerY, innerW, innerH);

  // Bleed edge pixels into the padding region to prevent linear-filter seams.
  ctx.drawImage(bitmap, 0, 0, bitmap.width, 1, innerX, y, innerW, safePad);
  ctx.drawImage(bitmap, 0, bitmap.height - 1, bitmap.width, 1, innerX, innerY + innerH, innerW, safePad);
  ctx.drawImage(bitmap, 0, 0, 1, bitmap.height, x, innerY, safePad, innerH);
  ctx.drawImage(bitmap, bitmap.width - 1, 0, 1, bitmap.height, innerX + innerW, innerY, safePad, innerH);
  ctx.drawImage(bitmap, 0, 0, 1, 1, x, y, safePad, safePad);
  ctx.drawImage(bitmap, bitmap.width - 1, 0, 1, 1, innerX + innerW, y, safePad, safePad);
  ctx.drawImage(bitmap, 0, bitmap.height - 1, 1, 1, x, innerY + innerH, safePad, safePad);
  ctx.drawImage(bitmap, bitmap.width - 1, bitmap.height - 1, 1, 1, innerX + innerW, innerY + innerH, safePad, safePad);
}

const controls = {
  autoMove: document.getElementById("autoMove"),
  patternRotate: document.getElementById("patternRotate"),
  staticLean: document.getElementById("staticLean"),
  rotationPattern: document.getElementById("rotationPattern"),
  hoverFocus: document.getElementById("hoverFocus"),
  hoverResetRotation: document.getElementById("hoverResetRotation"),
  hoverDomino: document.getElementById("hoverDomino"),
  useImported: document.getElementById("useImported"),
  autoFitCount: document.getElementById("autoFitCount"),
  sizePattern: document.getElementById("sizePattern"),
  loadAnimation: document.getElementById("loadAnimation"),
  sceneTone: document.getElementById("sceneTone"),
  speed: document.getElementById("speed"),
  speedValue: document.getElementById("speedValue"),
  dragSensitivity: document.getElementById("dragSensitivity"),
  dragValue: document.getElementById("dragValue"),
  spacing: document.getElementById("spacing"),
  spacingValue: document.getElementById("spacingValue"),
  widthScale: document.getElementById("widthScale"),
  widthScaleValue: document.getElementById("widthScaleValue"),
  heightScale: document.getElementById("heightScale"),
  heightScaleValue: document.getElementById("heightScaleValue"),
  depthScale: document.getElementById("depthScale"),
  depthScaleValue: document.getElementById("depthScaleValue"),
  edgeRoundness: document.getElementById("edgeRoundness"),
  edgeRoundnessValue: document.getElementById("edgeRoundnessValue"),
  matteAmount: document.getElementById("matteAmount"),
  matteValue: document.getElementById("matteValue"),
  staticLeanAmount: document.getElementById("staticLeanAmount"),
  staticLeanValue: document.getElementById("staticLeanValue"),
  hoverSpeed: document.getElementById("hoverSpeed"),
  hoverSpeedValue: document.getElementById("hoverSpeedValue"),
  returnSpeed: document.getElementById("returnSpeed"),
  returnSpeedValue: document.getElementById("returnSpeedValue"),
  waveTilt: document.getElementById("waveTilt"),
  waveValue: document.getElementById("waveValue"),
  depthSwing: document.getElementById("depthSwing"),
  depthValue: document.getElementById("depthValue"),
  leanAngle: document.getElementById("leanAngle"),
  leanValue: document.getElementById("leanValue"),
  shelfVerticalOffset: document.getElementById("shelfVerticalOffset"),
  shelfVerticalOffsetValue: document.getElementById("shelfVerticalOffsetValue"),
  shelfRotationX: document.getElementById("shelfRotationX"),
  shelfRotationXValue: document.getElementById("shelfRotationXValue"),
  shelfRotationY: document.getElementById("shelfRotationY"),
  shelfRotationYValue: document.getElementById("shelfRotationYValue"),
  shelfRotationZ: document.getElementById("shelfRotationZ"),
  shelfRotationZValue: document.getElementById("shelfRotationZValue"),
  bookDepthOffset: document.getElementById("bookDepthOffset"),
  bookDepthOffsetValue: document.getElementById("bookDepthOffsetValue"),
  depthAlign: document.getElementById("depthAlign"),
  depthAlignValue: document.getElementById("depthAlignValue"),
  bookCount: document.getElementById("bookCount"),
  countValue: document.getElementById("countValue"),
  glbFile: document.getElementById("glbFile"),
  importStatus: document.getElementById("importStatus"),
  faceImage: document.getElementById("faceImage"),
  backImage: document.getElementById("backImage"),
  spineImage: document.getElementById("spineImage"),
  artStatus: document.getElementById("artStatus"),
  coverColor: document.getElementById("coverColor"),
  pageColor: document.getElementById("pageColor"),
  accentColor: document.getElementById("accentColor"),
  bookLeanControls: document.getElementById("bookLeanControls"),
  resetBookLeans: document.getElementById("resetBookLeans"),
  resetView: document.getElementById("resetView"),
  webflowHelp: document.getElementById("webflowHelp"),
  exportSettings: document.getElementById("exportSettings"),
  exportImage: document.getElementById("exportImage"),
  webflowHelpModal: document.getElementById("webflowHelpModal"),
  webflowHelpClose: document.getElementById("webflowHelpClose"),
  webflowHelpBackdrop: document.getElementById("webflowHelpBackdrop"),
};

applyStartupControls(STARTUP_SETTINGS);
const hasControlPanel = Boolean(controls.dragSensitivity);

const state = {
  offset: Number(STARTUP_SETTINGS.offset ?? 0),
  velocity: 0,
  minSpacing: 0,
  dragSensitivity: Number(STARTUP_SETTINGS.dragSensitivity),
  spacing: Number(STARTUP_SETTINGS.spacing),
  autoMove: Boolean(STARTUP_SETTINGS.autoMove),
  patternRotate: Boolean(STARTUP_SETTINGS.patternRotate),
  staticLean: Boolean(STARTUP_SETTINGS.staticLean),
  rotationPattern: STARTUP_SETTINGS.rotationPattern,
  hoverFocus: Boolean(STARTUP_SETTINGS.hoverFocus),
  hoverResetRotation: Boolean(STARTUP_SETTINGS.hoverResetRotation),
  hoverDomino: Boolean(STARTUP_SETTINGS.hoverDomino),
  useImported: Boolean(STARTUP_SETTINGS.useImported),
  autoFitCount: Boolean(STARTUP_SETTINGS.autoFitCount),
  sizePattern: STARTUP_SETTINGS.sizePattern,
  loadAnimation: STARTUP_SETTINGS.loadAnimation || "dropFade",
  sceneTone: STARTUP_SETTINGS.sceneTone || "normal",
  widthScale: Number(STARTUP_SETTINGS.widthScale),
  heightScale: Number(STARTUP_SETTINGS.heightScale),
  depthScale: Number(STARTUP_SETTINGS.depthScale),
  edgeRoundness: Number(STARTUP_SETTINGS.edgeRoundness),
  matteAmount: Number(STARTUP_SETTINGS.matteAmount),
  staticLeanAmount: Number(STARTUP_SETTINGS.staticLeanAmount),
  hoverSpeed: Number(STARTUP_SETTINGS.hoverSpeed),
  returnSpeed: Number(STARTUP_SETTINGS.returnSpeed),
  speed: Number(STARTUP_SETTINGS.speed),
  waveTilt: Number(STARTUP_SETTINGS.waveTilt),
  depthSwing: Number(STARTUP_SETTINGS.depthSwing),
  leanAngle: Number(STARTUP_SETTINGS.leanAngle),
  shelfVerticalOffset: Number(STARTUP_SETTINGS.shelfVerticalOffset),
  shelfRotationX: Number(STARTUP_SETTINGS.shelfRotationX),
  shelfRotationY: Number(STARTUP_SETTINGS.shelfRotationY),
  shelfRotationZ: Number(STARTUP_SETTINGS.shelfRotationZ),
  bookDepthOffset: Number(STARTUP_SETTINGS.bookDepthOffset),
  depthAlign: Number(STARTUP_SETTINGS.depthAlign),
  bookCount: Number(STARTUP_SETTINGS.bookCount),
  colors: {
    cover: STARTUP_SETTINGS.colors.cover,
    pages: STARTUP_SETTINGS.colors.pages,
    accent: STARTUP_SETTINGS.colors.accent,
  },
  pointerDown: false,
  lastPointerX: 0,
  lastPointerY: 0,
  pointerDragDistance: 0,
  hoveredIndex: -1,
  previousHoveredIndex: -1,
  clickedIndex: -1,
  lastHoverSoundIndex: -1,
  lastHoverSoundTime: 0,
  needsBookRefresh: true,
  artBuildSerial: 0,
  importedMesh: null,
  importedFileName: STARTUP_SETTINGS.importedFileName || "",
  bookRotationOverrides: normalizeBookRotationOverrides(STARTUP_SETTINGS.bookRotationOverrides, Number(STARTUP_SETTINGS.bookCount)),
  bookArt: {
    faceBitmap: null,
    backBitmap: null,
    spineBitmap: null,
  },
  cmsBooks: [],
  cmsBookCursor: 0,
  soundsEnabled: true,
  hoverSoundVolume: 0.3,
  clickSoundVolume: 0.5,
  renderTimeSeconds: 0,
  loadAnimationStartTime: 0,
  loadAnimationArmed: true,
  initialLeanSettleUntil: 0,
  loadProgressTotal: 0,
  loadProgressDone: 0,
  loadStartedAtMs: 0,
};

function setLoaderProgress(progress) {
  const animation = ensureLoaderAnimation();
  if (!animation || !loaderAnimationReady) {
    return;
  }
  const p = clamp(progress, 0, 1);
  const totalFrames = Math.max((animation.totalFrames || 1) - 1, 1);
  animation.goToAndStop(totalFrames * p, true);
}

function startLoader(total = 1) {
  state.loadProgressTotal = Math.max(1, total);
  state.loadProgressDone = 0;
  state.loadStartedAtMs = performance.now();
  state.loadAnimationArmed = false;
  if (loaderEl) {
    loaderEl.classList.remove("is-hidden");
  }
  const animation = ensureLoaderAnimation();
  if (animation) {
    loaderAnimationReady = loaderAnimationReady || Boolean(animation.totalFrames);
    animation.stop();
    animation.goToAndStop(0, true);
  }
  const fillDurationMs = 3000;
  const startedAt = state.loadStartedAtMs;
  const tick = () => {
    const elapsed = performance.now() - startedAt;
    const timeT = Math.min(elapsed / fillDurationMs, 1);
    const assetProgress = state.loadProgressTotal > 0
      ? (state.loadProgressDone / state.loadProgressTotal)
      : 0;
    const blendedProgress = assetProgress < timeT ? assetProgress : timeT;
    setLoaderProgress(blendedProgress);
    if (startedAt === state.loadStartedAtMs && (timeT < 1 || assetProgress < 1)) {
      requestAnimationFrame(tick);
    }
  };
  requestAnimationFrame(tick);
}

function stepLoader() {
  if (state.loadProgressTotal <= 0) {
    return;
  }
  state.loadProgressDone = Math.min(state.loadProgressDone + 1, state.loadProgressTotal);
}

function finishLoader() {
  const minVisibleMs = 3000;
  const elapsedMs = performance.now() - state.loadStartedAtMs;
  const remainingMs = Math.max(0, minVisibleMs - elapsedMs);
  setLoaderProgress(1);
  window.setTimeout(() => {
    state.loadAnimationStartTime = performance.now() * 0.001;
    state.loadAnimationArmed = true;
    state.initialLeanSettleUntil = state.loadAnimationStartTime + 1.35;
    if (loaderEl) {
      requestAnimationFrame(() => {
        loaderEl.classList.add("is-hidden");
      });
    }
  }, remainingMs);
}

const ART_ATLAS = {
  size: 1536,
  spine: { x: 40, y: 40, width: 170, height: 1456 },
  face: { x: 250, y: 40, width: 600, height: 1456 },
  back: { x: 890, y: 40, width: 600, height: 1456 },
};

function syncOutputs() {
  if (!hasControlPanel) {
    return;
  }
  controls.spacing.min = "0";
  controls.speedValue.value = Number(state.speed).toFixed(2);
  controls.dragValue.value = Number(state.dragSensitivity).toFixed(2);
  controls.spacingValue.value = Number(state.spacing).toFixed(2);
  controls.widthScaleValue.value = Number(state.widthScale).toFixed(2);
  controls.heightScaleValue.value = Number(state.heightScale).toFixed(2);
  controls.depthScaleValue.value = Number(state.depthScale).toFixed(2);
  controls.edgeRoundness.value = Number(state.edgeRoundness).toFixed(2);
  controls.edgeRoundnessValue.value = Number(state.edgeRoundness).toFixed(2);
  controls.matteValue.value = Number(state.matteAmount).toFixed(2);
  controls.staticLeanValue.value = Number(state.staticLeanAmount).toFixed(2);
  controls.hoverSpeedValue.value = Number(state.hoverSpeed).toFixed(2);
  controls.returnSpeedValue.value = Number(state.returnSpeed).toFixed(2);
  controls.waveValue.value = Number(state.waveTilt).toFixed(2);
  controls.depthValue.value = Number(state.depthSwing).toFixed(2);
  controls.leanValue.value = Number(state.leanAngle).toFixed(2);
  controls.shelfVerticalOffsetValue.value = Number(state.shelfVerticalOffset).toFixed(2);
  controls.shelfRotationXValue.value = Number(state.shelfRotationX).toFixed(2);
  controls.shelfRotationYValue.value = Number(state.shelfRotationY).toFixed(2);
  controls.shelfRotationZValue.value = Number(state.shelfRotationZ).toFixed(2);
  controls.bookDepthOffsetValue.value = Number(state.bookDepthOffset).toFixed(2);
  controls.countValue.value = String(state.bookCount);
  controls.bookCount.disabled = state.autoFitCount;
}

syncOutputs();

const vertexShaderSource = `
attribute vec3 aPosition;
attribute vec3 aColor;
attribute vec2 aTexCoord;
uniform mat4 uMatrix;
varying vec3 vColor;
varying vec2 vTexCoord;
void main() {
  gl_Position = uMatrix * vec4(aPosition, 1.0);
  vColor = aColor;
  vTexCoord = aTexCoord;
}
`;

const fragmentShaderSource = `
precision mediump float;
varying vec3 vColor;
varying vec2 vTexCoord;
uniform sampler2D uTexture;
uniform float uUseTexture;
uniform float uTone;
uniform float uAlpha;
void main() {
  vec4 texel = texture2D(uTexture, vTexCoord);
  float textureMix = uUseTexture * texel.a;
  vec3 color = mix(vColor, vColor * texel.rgb, textureMix);
  color = clamp(color + vec3(uTone), 0.0, 1.0);
  gl_FragColor = vec4(color, uAlpha);
}
`;

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

function createProgram(vertexSource, fragmentSource) {
  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
  return program;
}

function perspective(fovRadians, aspect, near, far) {
  const f = 1 / Math.tan(fovRadians / 2);
  const rangeInv = 1 / (near - far);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0,
  ];
}

function multiply(a, b) {
  const out = new Array(16);
  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a03 = a[3];
  const a10 = a[4];
  const a11 = a[5];
  const a12 = a[6];
  const a13 = a[7];
  const a20 = a[8];
  const a21 = a[9];
  const a22 = a[10];
  const a23 = a[11];
  const a30 = a[12];
  const a31 = a[13];
  const a32 = a[14];
  const a33 = a[15];

  const b00 = b[0];
  const b01 = b[1];
  const b02 = b[2];
  const b03 = b[3];
  const b10 = b[4];
  const b11 = b[5];
  const b12 = b[6];
  const b13 = b[7];
  const b20 = b[8];
  const b21 = b[9];
  const b22 = b[10];
  const b23 = b[11];
  const b30 = b[12];
  const b31 = b[13];
  const b32 = b[14];
  const b33 = b[15];

  out[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
  out[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
  out[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
  out[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
  out[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
  out[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
  out[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
  out[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
  out[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
  out[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
  out[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
  out[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
  out[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
  out[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
  out[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
  out[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
  return out;
}

function translation(tx, ty, tz) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1,
  ];
}

function rotationX(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1,
  ];
}

function rotationY(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1,
  ];
}

function rotationZ(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    c, s, 0, 0,
    -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];
}

function scale(sx, sy, sz) {
  return [
    sx, 0, 0, 0,
    0, sy, 0, 0,
    0, 0, sz, 0,
    0, 0, 0, 1,
  ];
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const int = Number.parseInt(value, 16);
  return [
    ((int >> 16) & 255) / 255,
    ((int >> 8) & 255) / 255,
    (int & 255) / 255,
  ];
}

function lighten(color, amount) {
  return color.map((channel) => Math.min(1, channel + amount));
}

function darken(color, amount) {
  return color.map((channel) => Math.max(0, channel - amount));
}

function mix(a, b, amount) {
  return a.map((channel, index) => channel * (1 - amount) + b[index] * amount);
}

function applyMatte(color, amount) {
  const average = (color[0] + color[1] + color[2]) / 3;
  const neutral = [average, average, average];
  const desaturated = mix(color, neutral, amount * 0.22);
  return mix(desaturated, [0.58, 0.58, 0.58], amount * 0.08);
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function syncBookRotationOverrides() {
  const next = Array.from({ length: state.bookCount }, (_, index) => {
    const existing = state.bookRotationOverrides[index];
    return {
      x: Number.isFinite(existing?.x) ? clamp(existing.x, -1.4, 1.4) : 0,
      y: Number.isFinite(existing?.y) ? clamp(existing.y, -1.4, 1.4) : 0,
      z: Number.isFinite(existing?.z) ? clamp(existing.z, -1.4, 1.4) : 0,
    };
  });
  state.bookRotationOverrides = next;
}

function renderBookLeanControls() {
  if (!controls.bookLeanControls) {
    return;
  }

  syncBookRotationOverrides();
  controls.bookLeanControls.replaceChildren();

  state.bookRotationOverrides.forEach((value, index) => {
    const row = document.createElement("label");
    row.className = "book-lean-row";

    const label = document.createElement("span");
    const title = document.createElement("span");
    title.textContent = `Book ${index + 1}`;
    const summary = document.createElement("output");
    summary.value = `x ${value.x.toFixed(2)} y ${value.y.toFixed(2)} z ${value.z.toFixed(2)}`;
    summary.textContent = summary.value;
    label.append(title, summary);

    const axes = [
      { axis: "x", label: "X rotation" },
      { axis: "y", label: "Y rotation" },
      { axis: "z", label: "Z rotation" },
    ];

    axes.forEach(({ axis, label: axisLabel }) => {
      const axisWrap = document.createElement("label");
      axisWrap.className = "book-axis-row";

      const axisText = document.createElement("span");
      axisText.textContent = axisLabel;
      const axisOutput = document.createElement("output");
      axisOutput.value = Number(value[axis]).toFixed(2);
      axisOutput.textContent = axisOutput.value;
      axisText.append(axisOutput);

      const input = document.createElement("input");
      input.type = "range";
      input.min = "-1.4";
      input.max = "1.4";
      input.step = "0.01";
      input.value = String(value[axis]);
      input.addEventListener("input", (event) => {
        const nextValue = Number(event.currentTarget.value);
        state.bookRotationOverrides[index][axis] = nextValue;
        axisOutput.value = nextValue.toFixed(2);
        axisOutput.textContent = axisOutput.value;
        summary.value = `x ${state.bookRotationOverrides[index].x.toFixed(2)} y ${state.bookRotationOverrides[index].y.toFixed(2)} z ${state.bookRotationOverrides[index].z.toFixed(2)}`;
        summary.textContent = summary.value;
      });

      axisWrap.append(axisText, input);
      row.append(axisWrap);
    });

    row.prepend(label);
    controls.bookLeanControls.append(row);
  });
}

function getBookRotationOverride(index) {
  syncBookRotationOverrides();
  return state.bookRotationOverrides[index] || { x: 0, y: 0, z: 0 };
}

function getHoverDominoPitch(index) {
  if (!state.hoverDomino || !state.hoverFocus || state.hoveredIndex < 0) {
    return 0;
  }

  const distance = Math.abs(index - state.hoveredIndex);
  const maxReach = Math.min(10, Math.max(2, books.length - 1));
  if (distance === 0 || distance > maxReach) {
    return 0;
  }

  const focusedBook = books[state.hoveredIndex];
  const mix = focusedBook ? focusedBook.hoverMix : 0;
  const easedMix = 1 - ((1 - mix) ** 1.45);
  const normalizedDistance = 1 - ((distance - 1) / Math.max(maxReach - 1, 1));
  const falloff = 0.2 + ((normalizedDistance ** 2.1) * 0.8);
  const direction = index < state.hoveredIndex ? -1 : 1;
  const targetAngle = 1.08;
  return direction * targetAngle * falloff * easedMix;
}

function appendFace(positions, colors, texCoords, indices, points, color, uvRect) {
  const base = positions.length / 3;
  points.forEach((point) => {
    positions.push(...point);
    colors.push(...color);
  });
  const [u0, v0, u1, v1] = uvRect;
  texCoords.push(
    u0, v1,
    u1, v1,
    u1, v0,
    u0, v0,
  );
  indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function uvRectFromPixels(rect, atlasSize, insetPixels = 2) {
  const inset = Math.max(0, insetPixels);
  const x0 = (rect.x + inset) / atlasSize;
  const y0 = (rect.y + inset) / atlasSize;
  const x1 = (rect.x + rect.width - inset) / atlasSize;
  const y1 = (rect.y + rect.height - inset) / atlasSize;
  return [x0, y0, x1, y1];
}

function addQuad(positions, colors, texCoords, indices, a, b, c, d, color, uvRect) {
  const base = positions.length / 3;
  [a, b, c, d].forEach((point) => {
    positions.push(point[0], point[1], point[2]);
    colors.push(...color);
  });
  const [u0, v0, u1, v1] = uvRect;
  texCoords.push(
    u0, v1,
    u1, v1,
    u1, v0,
    u0, v0,
  );
  indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function addQuadWithUv(positions, colors, texCoords, indices, a, b, c, d, color, uvA, uvB, uvC, uvD) {
  const base = positions.length / 3;
  [a, b, c, d].forEach((point) => {
    positions.push(point[0], point[1], point[2]);
    colors.push(...color);
  });
  texCoords.push(
    uvA[0], uvA[1],
    uvB[0], uvB[1],
    uvC[0], uvC[1],
    uvD[0], uvD[1],
  );
  indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function createBookMesh(palette, artFlags = {}) {
  const w = 0.5;
  const h = 0.5;
  const d = 0.5;

  const positions = [];
  const colors = [];
  const texCoords = [];
  const indices = [];
  const plainUv = [0.97, 0.97, 0.99, 0.99];
  const faceUv = artFlags.faceBitmap
    ? uvRectFromPixels(ART_ATLAS.face, ART_ATLAS.size, 3)
    : plainUv;
  const backUv = artFlags.backBitmap
    ? uvRectFromPixels(ART_ATLAS.back, ART_ATLAS.size, 3)
    : plainUv;
  const spineUv = artFlags.spineBitmap
    ? uvRectFromPixels(ART_ATLAS.spine, ART_ATLAS.size, 10)
    : plainUv;
  const spineTexel = 1 / ART_ATLAS.size;
  const spineUvSafe = [
    spineUv[0] + (spineTexel * 2),
    spineUv[1] + (spineTexel * 3),
    spineUv[2] - (spineTexel * 2),
    spineUv[3] - (spineTexel * 3),
  ];

  const coverFront = artFlags.faceBitmap ? [1, 1, 1] : lighten(palette.cover, 0.05);
  const coverBack = artFlags.backBitmap ? [1, 1, 1] : darken(palette.cover, 0.12);
  const pageColor = palette.pages;
  const spineColor = artFlags.spineBitmap ? [1, 1, 1] : darken(mix(palette.cover, palette.accent, 0.2), 0.08);
  const topColor = lighten(pageColor, 0.03);
  const bottomColor = darken(pageColor, 0.08);
  // Front cover (upright)
  addQuad(
    positions,
    colors,
    texCoords,
    indices,
    [-w, -h, d],
    [w, -h, d],
    [w, h, d],
    [-w, h, d],
    coverFront,
    faceUv,
  );

  // Back cover
  addQuad(
    positions,
    colors,
    texCoords,
    indices,
    [w, -h, -d],
    [-w, -h, -d],
    [-w, h, -d],
    [w, h, -d],
    coverBack,
    backUv,
  );

  // Top
  addQuad(
    positions,
    colors,
    texCoords,
    indices,
    [-w, h, -d],
    [w, h, -d],
    [w, h, d],
    [-w, h, d],
    topColor,
    plainUv,
  );

  // Bottom
  addQuad(
    positions,
    colors,
    texCoords,
    indices,
    [-w, -h, d],
    [w, -h, d],
    [w, -h, -d],
    [-w, -h, -d],
    bottomColor,
    plainUv,
  );

  // Spine/page faces remain rectangular so image mapping stays stable.
  addQuadWithUv(
    positions,
    colors,
    texCoords,
    indices,
    [-w, -h, -d],
    [-w, -h, d],
    [-w, h, d],
    [-w, h, -d],
    spineColor,
    [spineUvSafe[0], spineUvSafe[3]],
    [spineUvSafe[2], spineUvSafe[3]],
    [spineUvSafe[2], spineUvSafe[1]],
    [spineUvSafe[0], spineUvSafe[1]],
  );
  addQuad(
    positions,
    colors,
    texCoords,
    indices,
    [w, -h, d],
    [w, -h, -d],
    [w, h, -d],
    [w, h, d],
    pageColor,
    plainUv,
  );

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices),
  };
}

function normalizeMesh(mesh) {
  const positions = Array.from(mesh.positions);
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (let index = 0; index < positions.length; index += 3) {
    minX = Math.min(minX, positions[index]);
    minY = Math.min(minY, positions[index + 1]);
    minZ = Math.min(minZ, positions[index + 2]);
    maxX = Math.max(maxX, positions[index]);
    maxY = Math.max(maxY, positions[index + 1]);
    maxZ = Math.max(maxZ, positions[index + 2]);
  }

  const sizeX = maxX - minX || 1;
  const sizeY = maxY - minY || 1;
  const sizeZ = maxZ - minZ || 1;
  const longest = Math.max(sizeX, sizeY, sizeZ);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  for (let index = 0; index < positions.length; index += 3) {
    positions[index] = (positions[index] - centerX) / longest;
    positions[index + 1] = (positions[index + 1] - centerY) / longest;
    positions[index + 2] = (positions[index + 2] - centerZ) / longest;
  }

  return {
    positions: new Float32Array(positions),
    colors: mesh.colors,
    texCoords: mesh.texCoords || new Float32Array((positions.length / 3) * 2),
    indices: mesh.indices,
  };
}

function getAccessorTypeSize(type) {
  if (type === "SCALAR") return 1;
  if (type === "VEC2") return 2;
  if (type === "VEC3") return 3;
  if (type === "VEC4") return 4;
  return 1;
}

function getComponentArray(componentType) {
  if (componentType === 5121) return Uint8Array;
  if (componentType === 5123) return Uint16Array;
  if (componentType === 5125) return Uint32Array;
  if (componentType === 5126) return Float32Array;
  throw new Error(`Unsupported GLB component type: ${componentType}`);
}

function accessorToArray(gltf, accessorIndex, binaryChunk) {
  const accessor = gltf.accessors[accessorIndex];
  const bufferView = gltf.bufferViews[accessor.bufferView];
  const ArrayType = getComponentArray(accessor.componentType);
  const componentCount = getAccessorTypeSize(accessor.type);
  const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
  const byteLength = accessor.count * componentCount;
  const source = new ArrayType(binaryChunk, byteOffset, byteLength);
  return {
    accessor,
    values: source,
    componentCount,
  };
}

function colorAccessorToRgb(values, componentType, componentCount) {
  const out = [];
  const divisor = componentType === 5121 ? 255 : 1;
  for (let index = 0; index < values.length; index += componentCount) {
    out.push(values[index] / divisor, values[index + 1] / divisor, values[index + 2] / divisor);
  }
  return out;
}

function parseGlb(arrayBuffer) {
  const header = new DataView(arrayBuffer, 0, 12);
  const magic = header.getUint32(0, true);
  const version = header.getUint32(4, true);
  if (magic !== 0x46546c67 || version !== 2) {
    throw new Error("Only glTF 2.0 GLB files are supported.");
  }

  let offset = 12;
  let jsonChunk = null;
  let binaryChunk = null;

  while (offset < arrayBuffer.byteLength) {
    const chunkHeader = new DataView(arrayBuffer, offset, 8);
    const chunkLength = chunkHeader.getUint32(0, true);
    const chunkType = chunkHeader.getUint32(4, true);
    offset += 8;
    const chunkData = arrayBuffer.slice(offset, offset + chunkLength);
    offset += chunkLength;
    if (chunkType === 0x4e4f534a) {
      jsonChunk = new TextDecoder().decode(chunkData);
    } else if (chunkType === 0x004e4942) {
      binaryChunk = chunkData;
    }
  }

  if (!jsonChunk || !binaryChunk) {
    throw new Error("GLB file is missing JSON or binary content.");
  }

  const gltf = JSON.parse(jsonChunk);
  const mesh = gltf.meshes?.[0];
  const primitive = mesh?.primitives?.[0];
  if (!primitive || primitive.attributes.POSITION === undefined) {
    throw new Error("GLB must contain a mesh with POSITION data.");
  }

  const positionData = accessorToArray(gltf, primitive.attributes.POSITION, binaryChunk);
  const indexData = primitive.indices !== undefined
    ? accessorToArray(gltf, primitive.indices, binaryChunk)
    : null;
  const colorData = primitive.attributes.COLOR_0 !== undefined
    ? accessorToArray(gltf, primitive.attributes.COLOR_0, binaryChunk)
    : null;

  const positions = new Float32Array(positionData.values);
  const indices = indexData
    ? new Uint16Array(indexData.values)
    : new Uint16Array(Array.from({ length: positions.length / 3 }, (_, index) => index));

  let colors;
  if (colorData) {
    colors = new Float32Array(
      colorAccessorToRgb(colorData.values, colorData.accessor.componentType, colorData.componentCount),
    );
  } else {
    const cover = hexToRgb(state.colors.cover);
    colors = new Float32Array(Array.from({ length: positions.length / 3 }, () => cover).flat());
  }

  return normalizeMesh({
    positions,
    colors,
    texCoords: new Float32Array((positions.length / 3) * 2),
    indices,
  });
}

let books = [];

function getGlobalBookArtFlags() {
  return {
    faceBitmap: state.bookArt.faceBitmap,
    backBitmap: state.bookArt.backBitmap,
    spineBitmap: state.bookArt.spineBitmap,
  };
}

function createBookArtTexture() {
  return createEmptyTexture();
}

async function buildBookArtTexture(book, artSource, buildSerial) {
  if (!artSource || (!artSource.coverUrl && !artSource.spineUrl)) {
    return;
  }

  const [coverBitmap, backBitmap, spineBitmap] = await Promise.all([
    artSource.coverUrl ? loadImageBitmapFromUrl(artSource.coverUrl) : null,
    artSource.backUrl ? loadImageBitmapFromUrl(artSource.backUrl) : null,
    artSource.spineUrl ? loadImageBitmapFromUrl(artSource.spineUrl) : null,
  ]);

  if (state.artBuildSerial !== buildSerial || book.artBuildSerial !== buildSerial) {
    return;
  }

  const atlas = document.createElement("canvas");
  atlas.width = ART_ATLAS.size;
  atlas.height = ART_ATLAS.size;
  const ctx = atlas.getContext("2d");
  ctx.clearRect(0, 0, atlas.width, atlas.height);

  if (spineBitmap) {
    drawBitmapIntoAtlasRect(ctx, spineBitmap, ART_ATLAS.spine, 8);
  }
  if (backBitmap) {
    drawBitmapIntoAtlasRect(ctx, backBitmap, ART_ATLAS.back, 5);
  }
  if (coverBitmap) {
    drawBitmapIntoAtlasRect(ctx, coverBitmap, ART_ATLAS.face, 5);
  }

  uploadCanvasToTexture(book.artTexture, atlas);
  book.hasArt = Boolean(coverBitmap || backBitmap || spineBitmap);
}

function getBookDimensions(index, count) {
  const center = count > 1 ? index / (count - 1) : 0.5;

  if (state.sizePattern === "verticalStack") {
    return { width: 0.62, height: 2.45, depth: 0.26 };
  }

  if (state.sizePattern === "uniform") {
    return { width: 0.62, height: 2.55, depth: 0.25 };
  }

  if (state.sizePattern === "oddEven") {
    return index % 2 === 0
      ? { width: 0.56, height: 2.35, depth: 0.22 }
      : { width: 0.7, height: 2.75, depth: 0.35 };
  }

  if (state.sizePattern === "staggered") {
    const tier = index % 3;
    return [
      { width: 0.52, height: 2.22, depth: 0.18 },
      { width: 0.66, height: 2.55, depth: 0.28 },
      { width: 0.74, height: 2.88, depth: 0.4 },
    ][tier];
  }

  if (state.sizePattern === "wave") {
    const wave = (Math.sin(index * 0.8) + 1) / 2;
    return {
      width: 0.5 + wave * 0.24,
      height: 2.2 + wave * 0.7,
      depth: 0.18 + wave * 0.22,
    };
  }

  if (state.sizePattern === "tapered") {
    const distance = Math.abs(center - 0.5) * 2;
    const factor = 1 - distance * 0.55;
    return {
      width: clamp(0.74 * factor, 0.46, 0.74),
      height: clamp(2.95 * factor, 2.0, 2.95),
      depth: clamp(0.38 * factor, 0.18, 0.38),
    };
  }

  const height = randomRange(2.2, 2.85) * 0.9;
  const tallness = (height - 2.2) / (2.85 - 2.2);
  // Prevent very tall books from becoming unrealistically thin.
  const minWidthForHeight = 0.56 + (tallness * 0.14);
  const maxWidthForHeight = Math.max(minWidthForHeight + 0.08, 0.78);
  return {
    width: randomRange(minWidthForHeight, maxWidthForHeight),
    height,
    depth: randomRange(0.32, 0.4),
  };
}

function applyDimensionScale(dimensions) {
  return {
    width: dimensions.width * state.widthScale,
    height: dimensions.height * state.heightScale,
    depth: dimensions.depth * state.depthScale,
  };
}

function buildBooks() {
  syncBookRotationOverrides();
  const cover = hexToRgb(state.colors.cover);
  const pages = hexToRgb(state.colors.pages);
  const accent = hexToRgb(state.colors.accent);
  const cmsLibrary = getWebflowCmsBooks();
  const shuffledCmsLibrary = cmsLibrary.length > 0 ? shuffleArray(cmsLibrary) : [];
  state.cmsBooks = shuffledCmsLibrary;
  state.cmsBookCursor = 0;
  const useCmsArt = shuffledCmsLibrary.length > 0;
  const buildSerial = state.artBuildSerial + 1;
  state.artBuildSerial = buildSerial;
  startLoader(useCmsArt ? state.bookCount : 1);
  const tiltedCount = clamp(Math.round(state.bookCount * 0.26), 4, 12);
  const tiltedIndices = new Set();
  const maxTilts = Math.min(tiltedCount, Math.ceil(state.bookCount / 2));
  const dimensionsList = Array.from({ length: state.bookCount }, (_, index) => (
    applyDimensionScale(getBookDimensions(index, state.bookCount))
  ));
  const startOffset = Math.floor(Math.random() * Math.max(state.bookCount, 1));
  const stride = Math.max(2, Math.floor(state.bookCount / Math.max(maxTilts, 1)));
  const candidateOrder = [];
  const seenCandidates = new Set();
  for (let pass = 0; pass < stride; pass += 1) {
    for (let step = 0; step < state.bookCount; step += stride) {
      const index = (startOffset + step + pass) % state.bookCount;
      if (seenCandidates.has(index)) {
        continue;
      }
      seenCandidates.add(index);
      candidateOrder.push(index);
    }
  }

  for (const index of candidateOrder) {
    if (tiltedIndices.size >= maxTilts) {
      break;
    }
    const left = (index - 1 + state.bookCount) % state.bookCount;
    const right = (index + 1) % state.bookCount;
    if (tiltedIndices.has(left) || tiltedIndices.has(right)) {
      continue;
    }
    const current = dimensionsList[index];
    const leftBook = dimensionsList[left];
    const rightBook = dimensionsList[right];
    const shorterNeighbor = Math.min(leftBook.height, rightBook.height);
    const averageNeighborDepth = (leftBook.depth + rightBook.depth) / 2;
    // Avoid leaning books that are notably taller than immediate neighbors.
    if (current.height > (shorterNeighbor * 1.04)) {
      continue;
    }
    // Skip very thick books when neighbors are comparatively slim; these seeds tend to shimmy.
    if (current.depth > (averageNeighborDepth * 1.12)) {
      continue;
    }
    tiltedIndices.add(index);
  }

  books = Array.from({ length: state.bookCount }, (_, index) => {
    const dimensions = dimensionsList[index];
    const hueMix = ((index % 6) - 2.5) * 0.045;
    const cmsArt = useCmsArt ? shuffledCmsLibrary[index % shuffledCmsLibrary.length] : null;
    const hasCmsFace = Boolean(cmsArt?.coverUrl);
    const hasCmsBack = Boolean(cmsArt?.backUrl);
    const hasCmsSpine = Boolean(cmsArt?.spineUrl);
    const useSharedArt = !useCmsArt && Boolean(state.bookArt.faceBitmap || state.bookArt.backBitmap || state.bookArt.spineBitmap);
    const palette = {
      cover: applyMatte(
        mix(lighten(cover, Math.max(0, hueMix)), darken(cover, Math.max(0, -hueMix)), 0.45),
        state.matteAmount,
      ),
      pages: applyMatte(
        mix(pages, lighten(pages, 0.06), (index % 3) * 0.15),
        state.matteAmount * 0.35,
      ),
      accent: applyMatte(
        mix(accent, lighten(accent, 0.08), (index % 5) * 0.08),
        state.matteAmount,
      ),
    };
    return {
      width: dimensions.width,
      height: dimensions.height,
      depth: dimensions.depth,
      seed: Math.random() * Math.PI * 2,
      leanBias: randomRange(-0.08, 0.08),
      staticLeanBias: -1,
      staticPitchBias: tiltedIndices.has(index)
        ? (Math.random() < 0.5 ? -1 : 1) * randomRange(0.75, 1.1)
        : 0,
      hoverMix: 0,
      leanShiftSmoothed: 0,
      positionX: 0,
      palette,
      artBuildSerial: buildSerial,
      hasArt: useCmsArt || useSharedArt,
      artTexture: useCmsArt ? createBookArtTexture() : artTexture,
      artSource: cmsArt,
      mesh: createBookMesh(
        palette,
        useCmsArt
          ? { faceBitmap: hasCmsFace, backBitmap: hasCmsBack, spineBitmap: hasCmsSpine }
          : getGlobalBookArtFlags(),
      ),
    };
  });

  if (useCmsArt) {
    const artLoads = books.map((book) => (
      buildBookArtTexture(book, book.artSource, buildSerial).catch((error) => {
        if (state.artBuildSerial === buildSerial) {
          console.warn("Failed to load CMS book art.", error);
        }
      }).finally(() => {
        if (state.artBuildSerial === buildSerial) {
          stepLoader();
        }
      })
    ));
    Promise.allSettled(artLoads).then(() => {
      if (state.artBuildSerial !== buildSerial) {
        return;
      }
      finishLoader();
    });
  }

  const initialPositions = getResolvedBookPositions(0);
  books.forEach((book, index) => {
    book.positionX = initialPositions[index];
    book.drawX = initialPositions[index];
  });
  const { cycle } = getWrapConfig();
  let settledPositions = initialPositions.slice();
  for (let pass = 0; pass < 5; pass += 1) {
    settledPositions = resolveLiveNeighborPositions(settledPositions, pass * 0.016, cycle);
  }
  books.forEach((book, index) => {
    book.positionX = settledPositions[index];
    book.drawX = settledPositions[index];
  });
  if (!useCmsArt) {
    stepLoader();
    finishLoader();
  }
  state.minSpacing = Math.max(...books.map((book) => book.depth));
  state.needsBookRefresh = false;
  updateArtStatus();
  syncOutputs();
  renderBookLeanControls();
}

const program = createProgram(vertexShaderSource, fragmentShaderSource);
const positionBuffer = gl.createBuffer();
const colorBuffer = gl.createBuffer();
const texCoordBuffer = gl.createBuffer();
const indexBuffer = gl.createBuffer();
const aPosition = gl.getAttribLocation(program, "aPosition");
const aColor = gl.getAttribLocation(program, "aColor");
const aTexCoord = gl.getAttribLocation(program, "aTexCoord");
const uMatrix = gl.getUniformLocation(program, "uMatrix");
const uTexture = gl.getUniformLocation(program, "uTexture");
const uUseTexture = gl.getUniformLocation(program, "uUseTexture");
const uTone = gl.getUniformLocation(program, "uTone");
const uAlpha = gl.getUniformLocation(program, "uAlpha");

gl.enable(gl.DEPTH_TEST);
gl.disable(gl.CULL_FACE);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const artTexture = createEmptyTexture();

buildBooks();

function resize() {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.floor(window.innerWidth * ratio);
  const height = Math.floor(window.innerHeight * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

window.addEventListener("resize", resize);
resize();

function bindMesh(mesh) {
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.colors, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(aColor);
  gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.texCoords || new Float32Array((mesh.positions.length / 3) * 2), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(aTexCoord);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
}

function drawMesh(mesh, matrix, texture = artTexture, useTexture = false, alpha = 1) {
  bindMesh(mesh);
  gl.uniformMatrix4fv(uMatrix, false, new Float32Array(matrix));
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(uTexture, 0);
  gl.uniform1f(uUseTexture, useTexture ? 1 : 0);
  const tone = state.sceneTone === "lighter"
    ? 0.07
    : state.sceneTone === "darker"
      ? -0.07
      : state.sceneTone === "dark"
        ? -0.28
      : 0;
  gl.uniform1f(uTone, tone);
  gl.uniform1f(uAlpha, clamp(alpha, 0, 1));
  gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
}

function updateArtStatus() {
  if (!controls.artStatus) {
    return;
  }
  const parts = [];
  if (state.cmsBooks.length > 0) {
    parts.push("Webflow CMS art");
  } else {
    if (state.bookArt.faceBitmap) {
      parts.push("front cover");
    }
    if (state.bookArt.backBitmap) {
      parts.push("back cover");
    }
    if (state.bookArt.spineBitmap) {
      parts.push("binding edge");
    }
  }
  controls.artStatus.textContent = parts.length > 0
    ? state.cmsBooks.length > 0
      ? `Using randomized Webflow CMS front, back, and binding-edge images.`
      : `Using uploaded ${parts.join(" and ")} images.`
    : "Using generated colors only.";
}

function rebuildArtTexture() {
  const atlas = document.createElement("canvas");
  atlas.width = ART_ATLAS.size;
  atlas.height = ART_ATLAS.size;
  const ctx = atlas.getContext("2d");
  ctx.clearRect(0, 0, atlas.width, atlas.height);

  if (state.bookArt.spineBitmap) {
    drawBitmapIntoAtlasRect(ctx, state.bookArt.spineBitmap, ART_ATLAS.spine, 8);
  }
  if (state.bookArt.backBitmap) {
    drawBitmapIntoAtlasRect(ctx, state.bookArt.backBitmap, ART_ATLAS.back, 5);
  }
  if (state.bookArt.faceBitmap) {
    drawBitmapIntoAtlasRect(ctx, state.bookArt.faceBitmap, ART_ATLAS.face, 5);
  }

  uploadCanvasToTexture(artTexture, atlas);
  if (state.cmsBooks.length === 0) {
    state.needsBookRefresh = true;
  }
  updateArtStatus();
}

function wrapCentered(value, span) {
  const half = span / 2;
  return ((value + half) % span + span) % span - half;
}

function getStaticLeanForBook(book) {
  if (!state.staticLean || book.staticLeanBias === 0) {
    return 0;
  }
  return 0;
}

function getStaticPitchForBook(book) {
  if (!state.staticLean || book.staticPitchBias === 0) {
    return 0;
  }
  return clamp(book.staticPitchBias * state.staticLeanAmount * 0.95, -0.95, 0.95);
}

function getBookXTilt(index, book, timeSeconds, hoverMix = book.hoverMix, includeDomino = true) {
  const rotationOverride = getBookRotationOverride(index);
  const hasMotionOffsets = state.depthSwing > 0 || state.leanAngle > 0 || state.waveTilt > 0;
  const animatedXTilt = hasMotionOffsets
    ? Math.sin(index * 0.4 + timeSeconds + book.seed) * 0.02
    : 0;
  const dominoXTilt = includeDomino ? getHoverDominoPitch(index) : 0;
  const xTiltBase = animatedXTilt + getStaticPitchForBook(book) + dominoXTilt + rotationOverride.x;
  return state.hoverResetRotation ? xTiltBase * (1 - hoverMix) : xTiltBase;
}

function getBookHalfSpan(book, hoverMix, leanAngle = 0, pitchAngle = 0, faceTurn = getBookFaceTurn(hoverMix)) {
  const closedSpan = (book.depth / 2) * (1 - hoverMix) + (book.width / 2) * hoverMix;
  const horizontalBase = Math.abs(Math.cos(leanAngle)) * closedSpan;
  const verticalBleed = Math.abs(Math.sin(leanAngle)) * (book.height / 2) * 1.35;
  const pitchBleed = Math.abs(Math.sin(pitchAngle)) * ((book.height / 2) + (book.depth / 2)) * 0.92;
  const faceTurnBleed = Math.abs(Math.sin(faceTurn)) * (book.width / 2);
  return Math.max(horizontalBase + verticalBleed + pitchBleed, faceTurnBleed, book.depth / 2);
}

function getClosedHalfSpan(book) {
  const index = books.indexOf(book);
  return getBookHalfSpan(
    book,
    0,
    getStaticLeanForBook(book) + getBookRotationOverride(index).z,
    getBookXTilt(index, book, 0, 0, false),
  );
}

function getLayoutMetrics() {
  if (books.length === 0) {
    return {
      centers: [],
      cycle: 1,
    };
  }

  const centers = new Array(books.length).fill(0);
  for (let index = 1; index < books.length; index += 1) {
    const previous = books[index - 1];
    const current = books[index];
    centers[index] = centers[index - 1]
      + getClosedHalfSpan(previous)
      + getClosedHalfSpan(current)
      + state.spacing;
  }

  const firstHalf = getClosedHalfSpan(books[0]);
  const lastHalf = getClosedHalfSpan(books[books.length - 1]);
  const minEdge = centers[0] - firstHalf;
  const maxEdge = centers[centers.length - 1] + lastHalf;
  const midpoint = (minEdge + maxEdge) / 2;
  const centered = centers.map((center) => center - midpoint);
  const cycle = Math.max(maxEdge - minEdge, 0.001);

  return {
    centers: centered,
    cycle,
  };
}

function getWrapConfig() {
  const layout = getLayoutMetrics();
  const step = Math.max(state.spacing + state.minSpacing, 0.001);
  const span = layout.cycle;
  const buffer = Math.max(step * 0.35, 0.2);
  return { step, span, buffer, cycle: span + buffer * 2, centers: layout.centers };
}

function getVisibleShelfWidth(distance = 7) {
  const aspect = gl.canvas.width / Math.max(gl.canvas.height, 1);
  return 2 * Math.tan(Math.PI / 8) * distance * aspect;
}

function getAutoFitBookCount() {
  if (books.length === 0) {
    return clamp(state.bookCount, 8, 60);
  }
  const layout = getLayoutMetrics();
  const averageWidth = layout.cycle / Math.max(books.length, 1);
  const visibleWidth = getVisibleShelfWidth();
  const targetWidth = visibleWidth * 0.92;
  const estimated = Math.max(1, Math.floor(targetWidth / Math.max(averageWidth, 0.001)));
  return clamp(estimated, 8, 60);
}

function getBookX(index) {
  const { centers, cycle } = getWrapConfig();
  return wrapCentered(centers[index] - state.offset, cycle);
}

function getBookFaceTurn(hoverMix) {
  return hoverMix * (Math.PI / 2);
}

function getResolvedBookPositions(timeSeconds) {
  const basePositions = books.map((_, index) => getBookX(index));
  const { cycle } = getWrapConfig();
  const focusIndex = state.hoverFocus && state.hoveredIndex >= 0
    ? state.hoveredIndex
    : Math.floor((books.length - 1) / 2);
  const focusBook = books[focusIndex];
  const halfSpans = books.map((book, index) => (
    getBookHalfSpan(
      book,
      book.hoverMix,
      (getBookLean(index, book, timeSeconds) + getBookRotationOverride(index).z) * (1 - book.hoverMix),
      getBookXTilt(index, book, timeSeconds, book.hoverMix, true),
    )
  ));
  const hasExpandedFootprint = books.some((book, index) => (
    halfSpans[index] > (getClosedHalfSpan(book) + 0.0005)
  ));
  const hasActiveCollision = hasExpandedFootprint || (state.hoverFocus && state.hoveredIndex >= 0);
  if (!hasActiveCollision) {
    return basePositions;
  }

  const focusBaseX = basePositions[focusIndex];
  const items = books.map((book, index) => ({
    index,
    relativeX: wrapCentered(basePositions[index] - focusBaseX, cycle),
    halfSpan: halfSpans[index],
  }));
  const resolved = new Array(books.length);
  resolved[focusIndex] = focusBaseX;
  const collisionGap = 0.025;
  const hoverClearance = focusBook
    ? ((focusBook.width * 0.18) + (focusBook.depth * 0.6)) * focusBook.hoverMix
    : 0;
  const rightItems = items
    .filter((item) => item.index !== focusIndex && item.relativeX >= 0)
    .sort((left, right) => left.relativeX - right.relativeX);
  const leftItems = items
    .filter((item) => item.index !== focusIndex && item.relativeX < 0)
    .sort((left, right) => right.relativeX - left.relativeX);
  const hoverPushReach = 12;
  const hoverPushFloor = 0.28;

  let previousIndex = focusIndex;
  for (const current of rightItems) {
    const hoverDistance = Math.abs(current.index - focusIndex);
    const nearHoverBoost = state.hoveredIndex >= 0
      ? Math.max(0, Math.max(hoverPushFloor, 1 - ((hoverDistance - 1) / hoverPushReach)))
      : 0;
    const hoverZoneGap = nearHoverBoost * 0.14;
    const extraGap = (previousIndex === focusIndex ? hoverClearance : 0) + hoverZoneGap;
    const minimum = resolved[previousIndex] + items[previousIndex].halfSpan + current.halfSpan + collisionGap + extraGap;
    const targetX = focusBaseX + current.relativeX;
    resolved[current.index] = Math.max(targetX, minimum);
    previousIndex = current.index;
  }

  let nextIndex = focusIndex;
  for (const current of leftItems) {
    const hoverDistance = Math.abs(current.index - focusIndex);
    const nearHoverBoost = state.hoveredIndex >= 0
      ? Math.max(0, Math.max(hoverPushFloor, 1 - ((hoverDistance - 1) / hoverPushReach)))
      : 0;
    const hoverZoneGap = nearHoverBoost * 0.14;
    const extraGap = (nextIndex === focusIndex ? hoverClearance : 0) + hoverZoneGap;
    const maximum = resolved[nextIndex] - items[nextIndex].halfSpan - current.halfSpan - collisionGap - extraGap;
    const targetX = focusBaseX + current.relativeX;
    resolved[current.index] = Math.min(targetX, maximum);
    nextIndex = current.index;
  }

  return resolved;
}

function getBookDynamicHalfSpan(book, index, timeSeconds) {
  const hoverMix = book.hoverMix;
  const combinedLean = getBookLean(index, book, timeSeconds);
  const leanAngle = getBookRotationOverride(index).z + (state.hoverResetRotation ? combinedLean * (1 - hoverMix) : combinedLean);
  const pitchAngle = getBookXTilt(index, book, timeSeconds, hoverMix, true);
  const faceTurn = getBookFaceTurn(hoverMix) - getBookRotationOverride(index).y;
  const baseHalfSpan = getBookHalfSpan(book, hoverMix, leanAngle, pitchAngle, faceTurn);
  const leanShiftAbs = Math.abs(getLeanCenterShift(book, leanAngle, hoverMix));
  // Include lean-induced center translation in live collision envelope.
  return baseHalfSpan + (leanShiftAbs * 0.92);
}

function resolveLiveNeighborPositions(basePositions, timeSeconds, cycle) {
  if (books.length < 2) {
    return basePositions;
  }

  const focusIndex = state.hoveredIndex >= 0
    ? state.hoveredIndex
    : Math.floor((books.length - 1) / 2);
  const focusBaseX = basePositions[focusIndex];
  const resolved = basePositions.slice();
  const collisionGap = 0.04;
  const iterations = 3;

  for (let pass = 0; pass < iterations; pass += 1) {
    const halfSpans = books.map((book, index) => getBookDynamicHalfSpan(book, index, timeSeconds));
    const items = books.map((book, index) => ({
      index,
      relativeX: wrapCentered(resolved[index] - focusBaseX, cycle),
      halfSpan: halfSpans[index],
    }));

    const rightItems = items
      .filter((item) => item.index !== focusIndex && item.relativeX >= 0)
      .sort((left, right) => left.relativeX - right.relativeX);
    const leftItems = items
      .filter((item) => item.index !== focusIndex && item.relativeX < 0)
      .sort((left, right) => right.relativeX - left.relativeX);

    resolved[focusIndex] = focusBaseX;

    let previousIndex = focusIndex;
    for (const current of rightItems) {
      const minimum = resolved[previousIndex] + items[previousIndex].halfSpan + current.halfSpan + collisionGap;
      const targetX = focusBaseX + current.relativeX;
      resolved[current.index] = Math.max(targetX, minimum);
      previousIndex = current.index;
    }

    let nextIndex = focusIndex;
    for (const current of leftItems) {
      const maximum = resolved[nextIndex] - items[nextIndex].halfSpan - current.halfSpan - collisionGap;
      const targetX = focusBaseX + current.relativeX;
      resolved[current.index] = Math.min(targetX, maximum);
      nextIndex = current.index;
    }
  }

  return resolved;
}

function getLiveNeighborIndices(index, positions, cycle) {
  let leftIndex = -1;
  let rightIndex = -1;
  let leftDistance = Infinity;
  let rightDistance = Infinity;
  const origin = positions[index];

  for (let i = 0; i < positions.length; i += 1) {
    if (i === index) {
      continue;
    }
    const delta = wrapCentered(positions[i] - origin, cycle);
    if (delta < 0) {
      const abs = Math.abs(delta);
      if (abs < leftDistance) {
        leftDistance = abs;
        leftIndex = i;
      }
    } else if (delta > 0 && delta < rightDistance) {
      rightDistance = delta;
      rightIndex = i;
    }
  }

  if (leftIndex < 0) {
    leftIndex = (index - 1 + positions.length) % positions.length;
  }
  if (rightIndex < 0) {
    rightIndex = (index + 1) % positions.length;
  }

  return { leftIndex, rightIndex };
}

function moveTowardsWrapped(current, target, cycle, easing) {
  const delta = wrapCentered(target - current, cycle);
  return wrapCentered(current + delta * easing, cycle);
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function easeOutCubic(t) {
  const p = 1 - clamp01(t);
  return 1 - (p * p * p);
}

function easeOutQuint(t) {
  const p = 1 - clamp01(t);
  return 1 - (p ** 5);
}

function easeOutExpo(t) {
  const p = clamp01(t);
  if (p >= 1) {
    return 1;
  }
  return 1 - (2 ** (-10 * p));
}

function easeOutBack(t) {
  const p = clamp01(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + (c3 * ((p - 1) ** 3)) + (c1 * ((p - 1) ** 2));
}

function getLoadAnimationTransform(index, timeSeconds, drawX = 0) {
  if (state.loadAnimation === "none") {
    return { x: 0, y: 0, alpha: 1 };
  }

  if (!state.loadAnimationArmed) {
    return { x: 0, y: 1.55, alpha: 0 };
  }

  // Stagger from the visual center line of the screen, not from array order.
  const centerDistance = Math.abs(drawX);
  const stagger = state.loadAnimation === "slideRight" || state.loadAnimation === "slideLeft" ? 0.04 : 0.055;
  const duration = state.loadAnimation === "dropHardStop" ? 0.48 : 0.54;
  const elapsed = Math.max(0, timeSeconds - state.loadAnimationStartTime);
  const local = clamp01((elapsed - (centerDistance * stagger)) / duration);
  const eased = easeOutCubic(local);

  if (state.loadAnimation === "dropFade") {
    const hardLand = easeOutExpo(local);
    return {
      x: 0,
      y: (1 - hardLand) * 1.55,
      alpha: 1,
    };
  }

  if (state.loadAnimation === "slideRight") {
    return { x: (1 - eased) * 7.0, y: 0, alpha: 1 };
  }

  if (state.loadAnimation === "slideLeft") {
    return { x: -(1 - eased) * 7.0, y: 0, alpha: 1 };
  }

  if (state.loadAnimation === "dropHardStop") {
    const hardStop = easeOutBack(local);
    return { x: 0, y: (1 - hardStop) * 4.8, alpha: 1 };
  }

  return { x: 0, y: 0, alpha: 1 };
}

function transformPoint(matrix, point) {
  const x = point[0];
  const y = point[1];
  const z = point[2];
  const w = point[3] ?? 1;

  const outX = (matrix[0] * x) + (matrix[4] * y) + (matrix[8] * z) + (matrix[12] * w);
  const outY = (matrix[1] * x) + (matrix[5] * y) + (matrix[9] * z) + (matrix[13] * w);
  const outZ = (matrix[2] * x) + (matrix[6] * y) + (matrix[10] * z) + (matrix[14] * w);
  const outW = (matrix[3] * x) + (matrix[7] * y) + (matrix[11] * z) + (matrix[15] * w);

  return [outX, outY, outZ, outW];
}

function getProjectionWithShelfRotation() {
  const projection = perspective(Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100);
  let projectionWithRotation = projection;
  if (state.sizePattern === "verticalStack") {
    projectionWithRotation = multiply(projectionWithRotation, rotationZ(Math.PI / 2));
  }
  if (state.shelfRotationX !== 0 || state.shelfRotationY !== 0 || state.shelfRotationZ !== 0) {
    projectionWithRotation = multiply(projectionWithRotation, rotationX(state.shelfRotationX));
    projectionWithRotation = multiply(projectionWithRotation, rotationY(state.shelfRotationY));
    projectionWithRotation = multiply(projectionWithRotation, rotationZ(state.shelfRotationZ));
  }
  return projectionWithRotation;
}

function getBookLean(index, book, timeSeconds) {
  const animatedLean = state.leanAngle > 0
    ? (
      state.patternRotate
        ? getRotationPatternValue(index, timeSeconds, book) * state.leanAngle
        : book.leanBias
    )
    : 0;
  const staticLean = getStaticLeanForBook(book);
  return animatedLean + staticLean;
}

function getEffectiveZLean(index, book, timeSeconds, hoverMix = book.hoverMix) {
  const combinedLean = getBookLean(index, book, timeSeconds);
  return getBookRotationOverride(index).z + (state.hoverResetRotation ? combinedLean * (1 - hoverMix) : combinedLean);
}

function getLeanCenterShift(book, leanAngle, hoverMix) {
  return clamp(
    Math.tan(leanAngle) * book.height * 0.42,
    -book.height * 0.78,
    book.height * 0.78,
  ) * (1 - hoverMix);
}

function getRotationPatternValue(index, timeSeconds, book) {
  const centerOffset = index - (state.bookCount - 1) / 2;
  const spread = Math.max(1, state.bookCount / 2);
  const normalized = centerOffset / spread;

  if (state.rotationPattern === "alternating") {
    return index % 2 === 0 ? -1 : 1;
  }

  if (state.rotationPattern === "alternateWide") {
    return index % 2 === 0 ? -1.35 : 1.35;
  }

  if (state.rotationPattern === "cascade") {
    return Math.sin(index * 0.55 - timeSeconds * 1.8 + state.offset * 0.22 + book.seed);
  }

  if (state.rotationPattern === "fan") {
    return normalized;
  }

  if (state.rotationPattern === "blocks") {
    return Math.floor(index / 3) % 2 === 0 ? -0.95 : 0.95;
  }

  if (state.rotationPattern === "leftAll") {
    return -1;
  }

  if (state.rotationPattern === "rightAll") {
    return 1;
  }

  if (state.rotationPattern === "outward") {
    return normalized < 0 ? -1 : 1;
  }

  if (state.rotationPattern === "inward") {
    return normalized < 0 ? 1 : -1;
  }

  if (state.rotationPattern === "zigzag") {
    return Math.sin(index * 1.4) >= 0 ? 1 : -1;
  }

  if (state.rotationPattern === "sawtooth") {
    const cycle = ((index % 6) / 5) * 2 - 1;
    return cycle;
  }

  if (state.rotationPattern === "steps") {
    if (normalized < -0.5) return -1;
    if (normalized < 0) return -0.35;
    if (normalized < 0.5) return 0.35;
    return 1;
  }

  if (state.rotationPattern === "pairs") {
    return Math.floor(index / 2) % 2 === 0 ? -1 : 1;
  }

  if (state.rotationPattern === "triplets") {
    return Math.floor(index / 3) % 2 === 0 ? -1 : 1;
  }

  if (state.rotationPattern === "pulse") {
    return Math.sin(timeSeconds * 2.2 + index * 0.2 + book.seed);
  }

  if (state.rotationPattern === "helix") {
    return Math.sin(index * 0.42 + timeSeconds * 1.25 + normalized * 2.4);
  }

  return Math.sin(index * 0.55 + timeSeconds * 1.2 + state.offset * 0.18 + book.seed);
}

function createMatrixForBook(book, index, x, timeSeconds, projection, resolvedPositions, cycle, loadYOffset = 0) {
  const rotationOverride = getBookRotationOverride(index);
  const hoverMix = book.hoverMix;
  const z = state.depthSwing > 0
    ? Math.sin(x * 0.55 + timeSeconds * 0.65 + book.seed) * state.depthSwing
    : 0;
  const hasMotionOffsets = state.depthSwing > 0 || state.leanAngle > 0 || state.waveTilt > 0;
  const bob = hasMotionOffsets
    ? Math.sin(index * 0.8 + timeSeconds * 1.05 + book.seed) * 0.03
    : 0;
  const baselineY = book.height / 2 - 1.28 + state.shelfVerticalOffset;
  const y = baselineY + bob + hoverMix * 0.02 + loadYOffset;
  const rawDesiredLean = getEffectiveZLean(index, book, timeSeconds, hoverMix);
  const settleLeanMix = timeSeconds < state.initialLeanSettleUntil
    ? clamp(1 - ((state.initialLeanSettleUntil - timeSeconds) / 1.35), 0, 1)
    : 1;
  const desiredLean = rawDesiredLean * settleLeanMix;
  const faceTurn = getBookFaceTurn(hoverMix) - rotationOverride.y;
  const hoverLift = hoverMix * 0.9;
  const rawLeanShift = getLeanCenterShift(book, desiredLean, hoverMix);
  const xTilt = getBookXTilt(index, book, timeSeconds, hoverMix, true);
  const { leftIndex, rightIndex } = getLiveNeighborIndices(index, resolvedPositions, cycle);
  const selfHalf = getBookHalfSpan(book, hoverMix, desiredLean, xTilt, faceTurn);
  const leftBook = books[leftIndex];
  const rightBook = books[rightIndex];
  const leftHoverMix = leftBook.hoverMix;
  const rightHoverMix = rightBook.hoverMix;
  const leftDesiredLean = getEffectiveZLean(leftIndex, leftBook, timeSeconds, leftHoverMix);
  const rightDesiredLean = getEffectiveZLean(rightIndex, rightBook, timeSeconds, rightHoverMix);
  const leftFaceTurn = getBookFaceTurn(leftHoverMix) - getBookRotationOverride(leftIndex).y;
  const rightFaceTurn = getBookFaceTurn(rightHoverMix) - getBookRotationOverride(rightIndex).y;
  const leftHalf = getBookHalfSpan(
    leftBook,
    leftHoverMix,
    leftDesiredLean,
    getBookXTilt(leftIndex, leftBook, timeSeconds, leftHoverMix, true),
    leftFaceTurn,
  );
  const rightHalf = getBookHalfSpan(
    rightBook,
    rightHoverMix,
    rightDesiredLean,
    getBookXTilt(rightIndex, rightBook, timeSeconds, rightHoverMix, true),
    rightFaceTurn,
  );
  const leftDistance = wrapCentered(resolvedPositions[index] - resolvedPositions[leftIndex], cycle);
  const rightDistance = wrapCentered(resolvedPositions[rightIndex] - resolvedPositions[index], cycle);
  const leftNeighborShift = getLeanCenterShift(leftBook, leftDesiredLean, leftHoverMix);
  const rightNeighborShift = getLeanCenterShift(rightBook, rightDesiredLean, rightHoverMix);
  const leftNeighborIntrusion = Math.max(0, leftNeighborShift);
  const rightNeighborIntrusion = Math.max(0, -rightNeighborShift);
  const tiltRisk = Math.abs(Math.sin(desiredLean));
  const thicknessSafety = ((book.depth + leftBook.depth + rightBook.depth) / 3) * 0.2;
  const leanSafetyPad = 0.012 + (tiltRisk * 0.02) + thicknessSafety;
  const leftGap = Math.max(0, Math.abs(leftDistance) - (leftHalf + selfHalf) - leanSafetyPad - leftNeighborIntrusion);
  const rightGap = Math.max(0, Math.abs(rightDistance) - (selfHalf + rightHalf) - leanSafetyPad - rightNeighborIntrusion);
  const sideClampedShift = clamp(rawLeanShift, -leftGap, rightGap);
  const totalClearance = leftGap + rightGap;
  const clearanceDemand = Math.max(selfHalf * 0.7, 0.001);
  const clearanceFactor = clamp(totalClearance / clearanceDemand, 0, 1);
  const startupSettleMix = timeSeconds < state.initialLeanSettleUntil
    ? clamp((state.initialLeanSettleUntil - timeSeconds) / 0.9, 0, 1)
    : 0;
  const startupClearanceFactor = startupSettleMix > 0
    ? clamp((totalClearance / Math.max(selfHalf * 1.15, 0.001)), 0, 1)
    : 1;
  const leaningRight = sideClampedShift > 0;
  const targetNeighbor = leaningRight ? rightBook : leftBook;
  const targetNeighborHalf = leaningRight ? rightHalf : leftHalf;
  const heightRatio = clamp((targetNeighbor.height || 0.001) / Math.max(book.height, 0.001), 0, 1.25);
  const leaningToShorter = book.height > targetNeighbor.height;
  const heightSafetyFactor = leaningToShorter
    ? clamp((heightRatio * 0.55) + ((targetNeighborHalf / Math.max(selfHalf, 0.001)) * 0.12), 0.08, 0.7)
    : 1;
  const strictLeanShift = sideClampedShift * clearanceFactor * startupClearanceFactor * heightSafetyFactor;
  const leanShiftTarget = (leftGap <= 0.0005 && strictLeanShift < 0) || (rightGap <= 0.0005 && strictLeanShift > 0)
    ? 0
    : strictLeanShift;
  const delta = leanShiftTarget - book.leanShiftSmoothed;
  const deadzone = 0.0025;
  const maxStep = 0.018;
  if (Math.abs(delta) <= deadzone) {
    book.leanShiftSmoothed = leanShiftTarget;
  } else {
    const step = Math.max(-maxStep, Math.min(maxStep, delta));
    book.leanShiftSmoothed += step;
  }
  const leanShift = book.leanShiftSmoothed;
  const finalLean = Math.atan2(leanShift, Math.max(book.height * 0.42, 0.0001));
  const theta = Math.PI / 2 - faceTurn;
  const bookFrontExtent = (Math.abs(Math.sin(theta)) * (book.width / 2))
    + (Math.abs(Math.cos(theta)) * (book.depth / 2));
  const referenceWidth = 0.62 * state.widthScale;
  const referenceDepth = 0.25 * state.depthScale;
  const referenceExtent = (Math.abs(Math.sin(theta)) * (referenceWidth / 2))
    + (Math.abs(Math.cos(theta)) * (referenceDepth / 2));
  const randomModeBaseAlign = state.sizePattern === "random" ? 1 : 0;
  const effectiveDepthAlign = randomModeBaseAlign + clamp(state.depthAlign, 0, 1.5);
  const depthCompensation = (bookFrontExtent - referenceExtent) * effectiveDepthAlign;

  let matrix = multiply(
    projection,
    translation(x + leanShift, y, -7 + state.bookDepthOffset - depthCompensation + z + hoverLift),
  );
  matrix = multiply(matrix, rotationY(Math.PI / 2 - faceTurn));
  matrix = multiply(matrix, translation(0, -book.height / 2, 0));
  matrix = multiply(matrix, rotationZ(finalLean));
  matrix = multiply(matrix, translation(0, book.height / 2, 0));
  matrix = multiply(matrix, translation(0, -book.height / 2, 0));
  matrix = multiply(matrix, rotationX(xTilt));
  matrix = multiply(matrix, translation(0, book.height / 2, 0));
  matrix = multiply(matrix, scale(book.width, book.height, book.depth));
  return matrix;
}

function render(now) {
  if (state.needsBookRefresh) {
    buildBooks();
  }

  resize();
  const timeSeconds = now * 0.001;
  state.renderTimeSeconds = timeSeconds;

  if (state.autoFitCount) {
    const fittedCount = getAutoFitBookCount();
    if (fittedCount !== state.bookCount) {
      state.bookCount = fittedCount;
      if (controls.bookCount) {
        controls.bookCount.value = String(fittedCount);
      }
      buildBooks();
    }
  }

  if (state.autoMove) {
    state.velocity += state.speed * 0.00018;
  }

  state.offset += state.velocity;
  state.velocity *= state.pointerDown ? 0.86 : 0.93;
  
  // Store reference to books for use in audio calculations
  state.books = books;
  
  books.forEach((book, index) => {
    const target = state.hoverFocus && index === state.hoveredIndex ? 1 : 0;
    const easing = target > book.hoverMix ? state.hoverSpeed : state.returnSpeed;
    book.hoverMix += (target - book.hoverMix) * easing;
  });

  if (state.sceneTone === "dark") {
    gl.clearColor(0.06, 0.07, 0.09, 1);
  } else {
    gl.clearColor(0.945, 0.902, 0.824, 1);
  }
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);

  const projection = perspective(Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100);
  
  // Apply shelf rotations
  let projectionWithRotation = projection;
  if (state.sizePattern === "verticalStack") {
    projectionWithRotation = multiply(projectionWithRotation, rotationZ(Math.PI / 2));
  }
  if (state.shelfRotationX !== 0 || state.shelfRotationY !== 0 || state.shelfRotationZ !== 0) {
    projectionWithRotation = multiply(projectionWithRotation, rotationX(state.shelfRotationX));
    projectionWithRotation = multiply(projectionWithRotation, rotationY(state.shelfRotationY));
    projectionWithRotation = multiply(projectionWithRotation, rotationZ(state.shelfRotationZ));
  }
  
  const useImported = state.useImported && state.importedMesh;
  const resolvedPositions = getResolvedBookPositions(timeSeconds);
  const { cycle } = getWrapConfig();
  const provisionalDrawPositions = new Array(books.length);

  books.forEach((book, index) => {
    const targetX = resolvedPositions[index];
    if (timeSeconds < state.initialLeanSettleUntil) {
      // During first-load settle, snap to resolved positions to avoid transient overlap crossings.
      book.positionX = targetX;
    } else {
      const easing = book.hoverMix > 0.001 ? state.hoverSpeed * 0.55 : state.returnSpeed * 0.55;
      book.positionX = moveTowardsWrapped(book.positionX, targetX, cycle, easing);
    }
    const drawX = wrapCentered(book.positionX, cycle);
    provisionalDrawPositions[index] = drawX;
  });

  const drawResolvedPositions = resolveLiveNeighborPositions(provisionalDrawPositions, timeSeconds, cycle);

  books.forEach((book, index) => {
    const drawX = wrapCentered(drawResolvedPositions[index], cycle);
    book.drawX = drawX; // Store drawX for pitch calculation
    const loadAnim = getLoadAnimationTransform(index, timeSeconds, drawX);
    const matrix = createMatrixForBook(
      book,
      index,
      drawX + loadAnim.x,
      timeSeconds,
      projectionWithRotation,
      drawResolvedPositions,
      cycle,
      loadAnim.y,
    );
    drawMesh(
      useImported ? state.importedMesh : book.mesh,
      matrix,
      useImported ? artTexture : book.artTexture,
      !useImported && !!book.hasArt,
      loadAnim.alpha,
    );
  });

  requestAnimationFrame(render);
}

requestAnimationFrame(render);

// Watch for dynamic CMS item changes
let lastCmsBookCount = 0;
let lastCmsSignature = "";

function buildCmsSignature(cmsBooks) {
  return cmsBooks
    .map((book) => `${book.coverUrl || ""}|${book.backUrl || ""}|${book.spineUrl || ""}`)
    .join("::");
}

function applyCmsBooksToExistingShelf(cmsBooks) {
  if (!Array.isArray(cmsBooks) || cmsBooks.length === 0 || books.length === 0) {
    return;
  }

  const shuffledCmsLibrary = shuffleArray(cmsBooks);
  state.cmsBooks = shuffledCmsLibrary;
  state.cmsBookCursor = 0;
  const buildSerial = state.artBuildSerial + 1;
  state.artBuildSerial = buildSerial;
  startLoader(books.length);

  const artLoads = books.map((book, index) => {
    const cmsArt = shuffledCmsLibrary[index % shuffledCmsLibrary.length];
    const hasCmsFace = Boolean(cmsArt?.coverUrl);
    const hasCmsBack = Boolean(cmsArt?.backUrl);
    const hasCmsSpine = Boolean(cmsArt?.spineUrl);

    // Keep geometry/position stable, only swap art sources and texture-enabled mesh flags.
    book.artSource = cmsArt;
    book.artBuildSerial = buildSerial;
    book.hasArt = Boolean(hasCmsFace || hasCmsBack || hasCmsSpine);
    if (book.artTexture === artTexture) {
      book.artTexture = createBookArtTexture();
    }
    book.mesh = createBookMesh(book.palette, {
      faceBitmap: hasCmsFace,
      backBitmap: hasCmsBack,
      spineBitmap: hasCmsSpine,
    });

    return buildBookArtTexture(book, cmsArt, buildSerial).catch((error) => {
      if (state.artBuildSerial === buildSerial) {
        console.warn("Failed to load CMS book art.", error);
      }
    }).finally(() => {
      if (state.artBuildSerial === buildSerial) {
        stepLoader();
      }
    });
  });

  Promise.allSettled(artLoads).then(() => {
    if (state.artBuildSerial !== buildSerial) {
      return;
    }
    finishLoader();
  });

  updateArtStatus();
}

function checkForCmsUpdates() {
  const currentCmsBooks = getWebflowCmsBooks();
  const currentCount = currentCmsBooks.length;
  const currentSignature = buildCmsSignature(currentCmsBooks);
  
  // If the number of CMS items changed, avoid full rebuild when we can keep geometry stable.
  if (currentCount !== lastCmsBookCount || (currentCount > 0 && currentSignature !== lastCmsSignature)) {
    lastCmsBookCount = currentCount;
    lastCmsSignature = currentSignature;
    if (currentCount > 0) {
      if (books.length > 0 && !state.needsBookRefresh) {
        applyCmsBooksToExistingShelf(currentCmsBooks);
        console.log(`Bookshelf: Applied ${currentCount} CMS items without rebuilding layout.`);
      } else {
        state.needsBookRefresh = true;
        console.log(`Bookshelf: Detected ${currentCount} CMS items. Rebuilding...`);
      }
    }
  }
}

// Set up mutation observer to detect DOM changes
const cmsObserver = new MutationObserver(() => {
  checkForCmsUpdates();
});

// Start observing for changes to new data-bookshelf-cms-item elements
cmsObserver.observe(document.body, {
  childList: true,        // Watch for added/removed nodes
  subtree: true,          // Watch all descendants
  attributes: false,      // We don't need to watch attribute changes
  characterData: false,   // We don't need to watch text content changes
});

// Also check periodically in case mutation observer misses something
setInterval(checkForCmsUpdates, 1000);

function updateImportStatus() {
  if (!controls.importStatus) {
    return;
  }
  if (state.importedMesh && state.useImported) {
    controls.importStatus.textContent = `Using imported model: ${state.importedFileName}`;
    return;
  }
  if (state.importedMesh) {
    controls.importStatus.textContent = `Imported ${state.importedFileName}. Enable "Use imported GLB" to render it.`;
    return;
  }
  controls.importStatus.textContent = "Using generated shelf books.";
}

function bitmapToDataUrl(bitmap) {
  if (!bitmap) {
    return null;
  }

  const source = document.createElement("canvas");
  source.width = bitmap.width;
  source.height = bitmap.height;
  const ctx = source.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);
  return source.toDataURL("image/png");
}

function buildWebflowExportPayload() {
  const sharedArt = {
    faceDataUrl: bitmapToDataUrl(state.bookArt.faceBitmap),
    backDataUrl: bitmapToDataUrl(state.bookArt.backBitmap),
    spineDataUrl: bitmapToDataUrl(state.bookArt.spineBitmap),
  };

  return {
    exportedAt: new Date().toISOString(),
    source: "infinite-webgl-bookshelf",
    startupSettings: {
      autoMove: state.autoMove,
      patternRotate: state.patternRotate,
      staticLean: state.staticLean,
      rotationPattern: state.rotationPattern,
      hoverFocus: state.hoverFocus,
      hoverResetRotation: state.hoverResetRotation,
      hoverDomino: state.hoverDomino,
      useImported: state.useImported,
      autoFitCount: state.autoFitCount,
      sizePattern: state.sizePattern,
      widthScale: state.widthScale,
      heightScale: state.heightScale,
      depthScale: state.depthScale,
      edgeRoundness: state.edgeRoundness,
      matteAmount: state.matteAmount,
      staticLeanAmount: state.staticLeanAmount,
      hoverSpeed: state.hoverSpeed,
      returnSpeed: state.returnSpeed,
      speed: state.speed,
      dragSensitivity: state.dragSensitivity,
      spacing: state.spacing,
      waveTilt: state.waveTilt,
      depthSwing: state.depthSwing,
      leanAngle: state.leanAngle,
      shelfVerticalOffset: state.shelfVerticalOffset,
      shelfRotationX: state.shelfRotationX,
      shelfRotationY: state.shelfRotationY,
      shelfRotationZ: state.shelfRotationZ,
      bookDepthOffset: state.bookDepthOffset,
      depthAlign: state.depthAlign,
      bookCount: state.bookCount,
      bookRotationOverrides: state.bookRotationOverrides,
      colors: state.colors,
      offset: Number(state.offset.toFixed(4)),
      importedFileName: state.importedFileName || null,
    },
    webflow: {
      artMode: state.cmsBooks.length > 0
        ? "webflow-cms"
        : (state.bookArt.faceBitmap || state.bookArt.backBitmap || state.bookArt.spineBitmap)
          ? "uploaded"
          : "generated",
      cmsBooks: state.cmsBooks,
      currentBookOrder: books.map((book, index) => ({
        index,
        artSource: book.artSource || null,
        artMode: book.artSource ? "webflow-cms" : ((state.bookArt.faceBitmap || state.bookArt.backBitmap || state.bookArt.spineBitmap) ? "uploaded" : "generated"),
        width: book.width,
        height: book.height,
        depth: book.depth,
        palette: book.palette,
        rotationOverride: state.bookRotationOverrides[index] || { x: 0, y: 0, z: 0 },
      })),
      sharedArt,
    },
  };
}

function openWebflowHelp() {
  if (!controls.webflowHelpModal) {
    return;
  }
  controls.webflowHelpModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeWebflowHelp() {
  if (!controls.webflowHelpModal) {
    return;
  }
  controls.webflowHelpModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function updateFromInputs(event) {
  if (!hasControlPanel) {
    return;
  }
  state.autoMove = controls.autoMove.checked;
  state.patternRotate = controls.patternRotate.checked;
  state.staticLean = controls.staticLean.checked;
  state.rotationPattern = controls.rotationPattern.value;
  state.hoverFocus = controls.hoverFocus.checked;
  state.hoverResetRotation = controls.hoverResetRotation.checked;
  state.hoverDomino = controls.hoverDomino.checked;
  state.useImported = controls.useImported.checked;
  state.autoFitCount = controls.autoFitCount.checked;
  const nextSizePattern = controls.sizePattern.value;
  const nextLoadAnimation = controls.loadAnimation.value;
  state.sceneTone = controls.sceneTone.value;
  const nextWidthScale = Number(controls.widthScale.value);
  const nextHeightScale = Number(controls.heightScale.value);
  const nextDepthScale = Number(controls.depthScale.value);
  const nextEdgeRoundness = clampUnit(Number(controls.edgeRoundness.value));
  const nextMatteAmount = Number(controls.matteAmount.value);
  state.staticLeanAmount = Number(controls.staticLeanAmount.value);
  state.hoverSpeed = Number(controls.hoverSpeed.value);
  state.returnSpeed = Number(controls.returnSpeed.value);
  state.speed = Number(controls.speed.value);
  state.dragSensitivity = Number(controls.dragSensitivity.value);
  state.spacing = Number(controls.spacing.value);
  controls.spacing.value = String(state.spacing);
  state.waveTilt = Number(controls.waveTilt.value);
  state.depthSwing = Number(controls.depthSwing.value);
  state.leanAngle = Number(controls.leanAngle.value);
  state.shelfVerticalOffset = Number(controls.shelfVerticalOffset.value);
  state.shelfRotationX = Number(controls.shelfRotationX.value);
  state.shelfRotationY = Number(controls.shelfRotationY.value);
  state.shelfRotationZ = Number(controls.shelfRotationZ.value);
  state.bookDepthOffset = Number(controls.bookDepthOffset.value);
  state.depthAlign = Number(controls.depthAlign.value);
  const nextCount = Number(controls.bookCount.value);
  const nextColors = {
    cover: controls.coverColor.value,
    pages: controls.pageColor.value,
    accent: controls.accentColor.value,
  };

  if (
    nextCount !== state.bookCount ||
    nextSizePattern !== state.sizePattern ||
    nextWidthScale !== state.widthScale ||
    nextHeightScale !== state.heightScale ||
    nextDepthScale !== state.depthScale ||
    nextEdgeRoundness !== state.edgeRoundness ||
    nextMatteAmount !== state.matteAmount ||
    nextColors.cover !== state.colors.cover ||
    nextColors.pages !== state.colors.pages ||
    nextColors.accent !== state.colors.accent
  ) {
    state.bookCount = nextCount;
    syncBookRotationOverrides();
    state.sizePattern = nextSizePattern;
    state.widthScale = nextWidthScale;
    state.heightScale = nextHeightScale;
    state.depthScale = nextDepthScale;
    state.edgeRoundness = nextEdgeRoundness;
    state.matteAmount = nextMatteAmount;
    state.colors = nextColors;
    state.needsBookRefresh = true;
  } else {
    syncBookRotationOverrides();
    state.sizePattern = nextSizePattern;
    state.widthScale = nextWidthScale;
    state.heightScale = nextHeightScale;
    state.depthScale = nextDepthScale;
    state.edgeRoundness = nextEdgeRoundness;
    state.matteAmount = nextMatteAmount;
  }

  if (nextLoadAnimation !== state.loadAnimation) {
    state.loadAnimation = nextLoadAnimation;
    state.loadAnimationStartTime = state.renderTimeSeconds;
  } else {
    state.loadAnimation = nextLoadAnimation;
  }

  if (state.importedMesh && !state.useImported) {
    updateImportStatus();
  } else if (state.importedMesh && state.useImported) {
    updateImportStatus();
  }

  syncOutputs();
}

[
  controls.autoMove,
  controls.patternRotate,
  controls.staticLean,
  controls.rotationPattern,
  controls.hoverFocus,
  controls.hoverResetRotation,
  controls.hoverDomino,
  controls.useImported,
  controls.autoFitCount,
  controls.sizePattern,
  controls.loadAnimation,
  controls.sceneTone,
  controls.widthScale,
  controls.heightScale,
  controls.depthScale,
  controls.edgeRoundness,
  controls.matteAmount,
  controls.staticLeanAmount,
  controls.hoverSpeed,
  controls.returnSpeed,
  controls.speed,
  controls.dragSensitivity,
  controls.spacing,
  controls.waveTilt,
  controls.depthSwing,
  controls.leanAngle,
  controls.shelfVerticalOffset,
  controls.shelfRotationX,
  controls.shelfRotationY,
  controls.shelfRotationZ,
  controls.bookDepthOffset,
  controls.depthAlign,
  controls.bookCount,
  controls.coverColor,
  controls.pageColor,
  controls.accentColor,
].forEach((control) => control?.addEventListener("input", updateFromInputs));

// Audio system for book interactions
let audioContext = null;
let pageAudioBuffer = null;
let pageAudioLoading = false;
let clickAudioBuffer = null;
let clickAudioLoading = false;
const remoteAudioBufferCache = new Map();
const remoteAudioLoadingCache = new Map();

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

// Load and cache the page turn audio
async function loadPageAudio() {
  if (pageAudioBuffer || pageAudioLoading) return pageAudioBuffer;
  
  pageAudioLoading = true;
  try {
    const response = await fetch("./page.mp3");
    const arrayBuffer = await response.arrayBuffer();
    const ctx = getAudioContext();
    pageAudioBuffer = await ctx.decodeAudioData(arrayBuffer);
    console.log("Page audio loaded successfully");
    pageAudioLoading = false;
  } catch (error) {
    console.warn("Failed to load page audio:", error);
    pageAudioLoading = false;
  }
  return pageAudioBuffer;
}

// Load and cache the click audio
async function loadClickAudio() {
  if (clickAudioBuffer || clickAudioLoading) return clickAudioBuffer;
  
  clickAudioLoading = true;
  try {
    const response = await fetch("./click.mp3");
    const arrayBuffer = await response.arrayBuffer();
    const ctx = getAudioContext();
    clickAudioBuffer = await ctx.decodeAudioData(arrayBuffer);
    console.log("Click audio loaded successfully");
    clickAudioLoading = false;
  } catch (error) {
    console.warn("Failed to load click audio:", error);
    clickAudioLoading = false;
  }
  return clickAudioBuffer;
}

async function loadAudioBufferFromUrl(url) {
  if (!url) {
    return null;
  }
  if (remoteAudioBufferCache.has(url)) {
    return remoteAudioBufferCache.get(url);
  }
  if (remoteAudioLoadingCache.has(url)) {
    return remoteAudioLoadingCache.get(url);
  }

  const loading = (async () => {
    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) {
        throw new Error(`Failed to load audio: ${url}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const ctx = getAudioContext();
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      remoteAudioBufferCache.set(url, buffer);
      return buffer;
    } catch (error) {
      console.warn("Failed to load remote audio:", error);
      return null;
    } finally {
      remoteAudioLoadingCache.delete(url);
    }
  })();

  remoteAudioLoadingCache.set(url, loading);
  return loading;
}

// Load page audio on startup
loadPageAudio();
loadClickAudio();

function playAudioBufferForBook(buffer, bookIndex, volume) {
  if (!buffer) {
    return;
  }
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const books = state.books || [];
    const book = books[bookIndex];
    let position = 0.5;
    if (book && book.drawX !== undefined) {
      position = (book.drawX + 8) / 16;
      position = Math.max(0, Math.min(1, position));
    }
    source.playbackRate.value = 0.7 + position * 0.6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  } catch (error) {
    console.warn("Failed to play audio:", error);
  }
}

function playHoverSound(bookIndex) {
  if (!state.soundsEnabled) return;
  
  // Prevent rapid re-triggering on the same book (200ms cooldown)
  const now = Date.now();
  if (bookIndex === state.lastHoverSoundIndex && (now - state.lastHoverSoundTime) < 200) {
    return;
  }
  state.lastHoverSoundIndex = bookIndex;
  state.lastHoverSoundTime = now;
  
  const book = books?.[bookIndex];
  const customUrl = book?.artSource?.hoverSoundUrl;
  if (customUrl) {
    loadAudioBufferFromUrl(customUrl).then((buffer) => {
      if (buffer) {
        playAudioBufferForBook(buffer, bookIndex, state.hoverSoundVolume);
      } else if (pageAudioBuffer) {
        playAudioBufferForBook(pageAudioBuffer, bookIndex, state.hoverSoundVolume);
      }
    });
    return;
  }
  if (pageAudioBuffer) {
    playAudioBufferForBook(pageAudioBuffer, bookIndex, state.hoverSoundVolume);
  }
}

function playClickSound(bookIndex) {
  if (!state.soundsEnabled) return;

  const book = books?.[bookIndex];
  const customUrl = book?.artSource?.clickSoundUrl;
  if (customUrl) {
    loadAudioBufferFromUrl(customUrl).then((buffer) => {
      if (buffer) {
        playAudioBufferForBook(buffer, bookIndex, state.clickSoundVolume);
      } else if (clickAudioBuffer) {
        playAudioBufferForBook(clickAudioBuffer, bookIndex, state.clickSoundVolume);
      }
    });
    return;
  }
  if (clickAudioBuffer) {
    playAudioBufferForBook(clickAudioBuffer, bookIndex, state.clickSoundVolume);
  }
}

canvas.addEventListener("pointerdown", (event) => {
  state.pointerDown = true;
  state.lastPointerX = event.clientX;
  state.lastPointerY = event.clientY;
  state.pointerDragDistance = 0;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointerup", (event) => {
  if (!state.pointerDown) return;
  
  // Check if this was a click on a book (not a drag)
  if (state.pointerDragDistance < 10 && state.hoveredIndex >= 0) {
    // This was a click on a book
    state.clickedIndex = state.hoveredIndex;
    playClickSound(state.hoveredIndex);
    
    // Trigger custom click handler if defined
    if (window.onBookClick && typeof window.onBookClick === "function") {
      window.onBookClick({
        bookIndex: state.hoveredIndex,
        book: books[state.hoveredIndex],
        event: event
      });
    }
  }
  
  releasePointer();
});


canvas.addEventListener("pointermove", (event) => {
  if (!state.pointerDown) {
    const previousHovered = state.hoveredIndex;
    updateHoveredBook(event.clientX, event.clientY);
    
    // Play hover sound when hovering over a new book
    if (state.hoveredIndex !== previousHovered && state.hoveredIndex >= 0) {
      playHoverSound(state.hoveredIndex);
    }
    return;
  }
  const deltaX = event.clientX - state.lastPointerX;
  const deltaY = event.clientY - state.lastPointerY;
  const flowDelta = state.sizePattern === "verticalStack" ? deltaY : deltaX;
  state.pointerDragDistance += Math.hypot(deltaX, deltaY);
  state.lastPointerX = event.clientX;
  state.lastPointerY = event.clientY;
  state.offset -= flowDelta * 0.01 * state.dragSensitivity;
  state.velocity = -flowDelta * 0.0008 * state.dragSensitivity;
});

function releasePointer() {
  state.pointerDown = false;
  state.pointerDragDistance = 0;
}

canvas.addEventListener("pointercancel", releasePointer);
canvas.addEventListener("pointerleave", () => {
  releasePointer();
  state.hoveredIndex = -1;
});

window.addEventListener("wheel", (event) => {
  if (panel && panel.contains(event.target)) {
    return;
  }
  event.preventDefault();
  state.velocity += event.deltaY * 0.00004 * state.dragSensitivity;
}, { passive: false });

controls.resetView?.addEventListener("click", () => {
  state.offset = 0;
  state.velocity = 0;
});

controls.resetBookLeans?.addEventListener("click", () => {
  state.bookRotationOverrides = Array.from({ length: state.bookCount }, () => ({ x: 0, y: 0, z: 0 }));
  renderBookLeanControls();
});

controls.webflowHelp?.addEventListener("click", openWebflowHelp);
controls.webflowHelpClose?.addEventListener("click", closeWebflowHelp);
controls.webflowHelpBackdrop?.addEventListener("click", closeWebflowHelp);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !controls.webflowHelpModal?.hidden) {
    closeWebflowHelp();
  }
});

controls.exportSettings?.addEventListener("click", () => {
  const payload = buildWebflowExportPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "bookshelf-webflow-export.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

controls.exportImage?.addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "bookshelf-scene.png";
  link.click();
});

controls.glbFile?.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    state.importedMesh = parseGlb(buffer);
    state.importedFileName = file.name;
    updateImportStatus();
  } catch (error) {
    state.importedMesh = null;
    state.importedFileName = "";
    if (controls.useImported) {
      controls.useImported.checked = false;
    }
    state.useImported = false;
    if (controls.importStatus) {
      controls.importStatus.textContent = error instanceof Error ? error.message : "Failed to import GLB file.";
    }
  }
});

async function loadBitmapFromFile(file) {
  return createImageBitmap(file);
}

controls.faceImage?.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  state.bookArt.faceBitmap = file ? await loadBitmapFromFile(file) : null;
  rebuildArtTexture();
});

controls.backImage?.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  state.bookArt.backBitmap = file ? await loadBitmapFromFile(file) : null;
  rebuildArtTexture();
});

controls.spineImage?.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  state.bookArt.spineBitmap = file ? await loadBitmapFromFile(file) : null;
  rebuildArtTexture();
});

function updateHoveredBook(clientX, clientY) {
  if (!state.hoverFocus || books.length === 0) {
    state.hoveredIndex = -1;
    return;
  }

  const rect = canvas.getBoundingClientRect();
  let normalizedX = ((clientX - rect.left) / rect.width) * 2 - 1;
  let normalizedY = 1 - (((clientY - rect.top) / rect.height) * 2);
  if (state.sizePattern === "verticalStack") {
    // Inverse-rotate pointer space to match 90deg shelf rotation in projection.
    const rotatedX = normalizedY;
    const rotatedY = -normalizedX;
    normalizedX = rotatedX;
    normalizedY = rotatedY;
  }
  const aspect = gl.canvas.width / Math.max(gl.canvas.height, 1);
  const tanHalfFov = Math.tan(Math.PI / 8);
  const projectionWithRotation = getProjectionWithShelfRotation();
  let bestIndex = -1;
  let bestScore = Infinity;
  let bestDepth = -Infinity;
  const sampleTime = state.renderTimeSeconds || 0;

  books.forEach((book, index) => {
    const worldX = Number.isFinite(book.drawX) ? book.drawX : getBookX(index);
    const hoverMix = book.hoverMix;
    const worldZ = -7 + hoverMix * 0.9;
    const hasMotionOffsets = state.depthSwing > 0 || state.leanAngle > 0 || state.waveTilt > 0;
    const bob = hasMotionOffsets
      ? Math.sin(index * 0.8 + sampleTime * 1.05 + book.seed) * 0.03
      : 0;
    const baselineY = book.height / 2 - 1.28 + state.shelfVerticalOffset;
    const worldY = baselineY + bob + hoverMix * 0.02;
    const clip = transformPoint(projectionWithRotation, [worldX, worldY, worldZ, 1]);
    if (Math.abs(clip[3]) < 0.00001) {
      return;
    }
    const projectedX = clip[0] / clip[3];
    const projectedY = clip[1] / clip[3];
    const combinedLean = getBookLean(index, book, sampleTime);
    const zLean = getBookRotationOverride(index).z + (state.hoverResetRotation ? combinedLean * (1 - hoverMix) : combinedLean);
    const xTilt = getBookXTilt(index, book, sampleTime, hoverMix, true);
    const halfWidth = getBookHalfSpan(
      book,
      hoverMix,
      zLean,
      xTilt,
      getBookFaceTurn(hoverMix) - getBookRotationOverride(index).y,
    ) / (-worldZ * tanHalfFov * aspect);
    const topClip = transformPoint(projectionWithRotation, [worldX, worldY + (book.height / 2), worldZ, 1]);
    const bottomClip = transformPoint(projectionWithRotation, [worldX, worldY - (book.height / 2), worldZ, 1]);
    if (Math.abs(topClip[3]) < 0.00001 || Math.abs(bottomClip[3]) < 0.00001) {
      return;
    }
    const topY = topClip[1] / topClip[3];
    const bottomY = bottomClip[1] / bottomClip[3];
    const halfHeight = Math.max(Math.abs(topY - projectedY), Math.abs(projectedY - bottomY))
      + (Math.abs(Math.sin(xTilt)) * book.depth / Math.max(-worldZ * tanHalfFov, 0.001));
    const hitPaddingX = 0.03;
    const hitPaddingY = 0.04;
    const insideX = Math.abs(normalizedX - projectedX) <= halfWidth + hitPaddingX;
    const insideY = Math.abs(normalizedY - projectedY) <= halfHeight + hitPaddingY;
    if (!insideX || !insideY) {
      return;
    }

    const distance = Math.hypot(
      (normalizedX - projectedX) / Math.max(halfWidth, 0.001),
      (normalizedY - projectedY) / Math.max(halfHeight, 0.001),
    );
    const depthBias = -worldZ;
    const score = distance - (hoverMix * 0.08);
    if (score < bestScore || (Math.abs(score - bestScore) < 0.05 && depthBias > bestDepth)) {
      bestScore = score;
      bestDepth = depthBias;
      bestIndex = index;
    }
  });

  state.hoveredIndex = bestIndex;
}

updateImportStatus();
updateArtStatus();
