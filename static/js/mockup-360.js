/**
 * AM DEVELOPERS - Interactive 360° Mobile & Desktop Synced 3D Showcase
 * Built with Three.js (WebGL) + Procedural Synced Screen Engine
 */

(function () {
  'use strict';

  // Ensure Three.js is loaded
  if (typeof THREE === 'undefined') {
    console.warn('[AM 360] Three.js not loaded. Falling back to photo view.');
    return;
  }

  let scene, camera, renderer, controls;
  let laptopGroup, mobileGroup, syncParticleGroup;
  let laptopCanvas, laptopCtx, laptopTexture;
  let mobileCanvas, mobileCtx, mobileTexture;
  let floorMesh, screenPointLight, mobilePointLight;
  let animFrameId = null;
  let isAutoRotating = true;
  let isUserInteracting = false;
  let resumeTimer = null;
  let is3DMode = true;
  let isInitialized = false;
  let lastScreenUpdate = 0;

  const container = document.getElementById('mockup3DContainer');
  const canvas = document.getElementById('mockup3DCanvas');
  const photoContainer = document.getElementById('mockupPhotoContainer');
  const dragHintPill = document.getElementById('dragHintPill');
  const btnToggleSpin = document.getElementById('btnToggleSpin');
  const spinBtnIcon = document.getElementById('spinBtnIcon');
  const btnPresetIso = document.getElementById('btnPresetIso');
  const btnPresetFront = document.getElementById('btnPresetFront');
  const btnToggleMode = document.getElementById('btnToggleMode');
  const modeBtnText = document.getElementById('modeBtnText');
  const badgeSpinIcon = document.getElementById('badgeSpinIcon');

  if (!container || !canvas) return;

  // Initialize
  init();

  function init() {
    initScreenCanvases();
    initThreeScene();
    buildStudioEnvironment();
    buildLaptop();
    buildMobile();
    buildSyncDataStream();
    setupControls();
    setupEventListeners();
    setupTiltPhotoView();
    animate(0);
    isInitialized = true;
  }

  /* -------------------------------------------------------------
     1. Offscreen High-Res Canvas Textures for Live Synced Displays
     ------------------------------------------------------------- */
  function initScreenCanvases() {
    // Laptop screen: 1200 x 750 (16:10 approx)
    laptopCanvas = document.createElement('canvas');
    laptopCanvas.width = 1200;
    laptopCanvas.height = 750;
    laptopCtx = laptopCanvas.getContext('2d');
    laptopTexture = new THREE.CanvasTexture(laptopCanvas);
    laptopTexture.minFilter = THREE.LinearFilter;
    laptopTexture.magFilter = THREE.LinearFilter;
    laptopTexture.generateMipmaps = false;

    // Mobile screen: 600 x 1250 (~19.5:9)
    mobileCanvas = document.createElement('canvas');
    mobileCanvas.width = 600;
    mobileCanvas.height = 1250;
    mobileCtx = mobileCanvas.getContext('2d');
    mobileTexture = new THREE.CanvasTexture(mobileCanvas);
    mobileTexture.minFilter = THREE.LinearFilter;
    mobileTexture.magFilter = THREE.LinearFilter;
    mobileTexture.generateMipmaps = false;

    // Initial render of both screens
    drawLaptopScreen(0);
    drawMobileScreen(0);
    laptopTexture.needsUpdate = true;
    mobileTexture.needsUpdate = true;
  }

  function drawLaptopScreen(time) {
    const ctx = laptopCtx;
    const w = laptopCanvas.width;
    const h = laptopCanvas.height;

    // Background gradient - dark cyber slate
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#070b14');
    bgGrad.addColorStop(0.5, '#0b1120');
    bgGrad.addColorStop(1, '#05070d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle Top Navigation Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, w, 58);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 58);
    ctx.lineTo(w, 58);
    ctx.stroke();

    // Browser dots (macOS style)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(28, 29, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(48, 29, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(68, 29, 6, 0, Math.PI * 2);
    ctx.fill();

    // Brand logo
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('AM', 100, 36);
    ctx.fillStyle = '#00f2fe';
    ctx.fillText('Developers', 138, 36);

    // Nav items
    ctx.font = '500 15px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Services', 660, 35);
    ctx.fillText('Work', 750, 35);
    ctx.fillText('Pricing', 820, 35);
    ctx.fillText('About', 900, 35);

    // Nav CTA
    const ctaGrad = ctx.createLinearGradient(980, 0, 1140, 0);
    ctaGrad.addColorStop(0, '#00f2fe');
    ctaGrad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = ctaGrad;
    roundRect(ctx, 980, 14, 150, 32, 16);
    ctx.fill();
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Contact Us →', 1015, 35);

    // Hero headline section
    ctx.font = '900 52px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('AM Developers', 80, 145);

    ctx.font = '600 24px Inter, sans-serif';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText('Digital Innovation Agency', 80, 185);

    ctx.font = '400 16px Inter, sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.fillText('Elevating Your Digital Experience with High-Speed Websites & Apps', 80, 218);

    // Interactive animated Cyber Wave Grid (SYNCED with mobile!)
    drawCyberGrid(ctx, 70, 260, 600, 300, time, '#00f2fe', '#8b5cf6');

    // Hero Call-to-action button inside screen
    const heroBtnGrad = ctx.createLinearGradient(80, 590, 240, 590);
    heroBtnGrad.addColorStop(0, '#00f2fe');
    heroBtnGrad.addColorStop(1, '#3b82f6');
    ctx.fillStyle = heroBtnGrad;
    roundRect(ctx, 80, 580, 180, 48, 12);
    ctx.fill();
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillStyle = '#090d16';
    ctx.fillText('Get Started →', 115, 610);

    // Floating UI Card Right 1: Live Speed & Performance
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 740, 120, 380, 180, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText('● SYSTEM STATUS: ONLINE', 770, 155);

    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('99.9% Speed', 770, 205);

    ctx.font = '500 15px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Ultra-fast delivery within 3-5 days', 770, 240);

    // Floating UI Card Right 2: Synced Code Stream
    ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
    roundRect(ctx, 740, 330, 380, 290, 16);
    ctx.fill();
    ctx.stroke();

    // Code editor dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(770, 360, 4, 0, Math.PI * 2);
    ctx.arc(785, 360, 4, 0, Math.PI * 2);
    ctx.arc(800, 360, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillStyle = '#8b5cf6';
    ctx.fillText('sync-engine.ts', 820, 364);

    // Simulated animated code lines
    const pulseAlpha = 0.6 + 0.4 * Math.sin(time * 3);
    ctx.font = '13px monospace';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText('const agency = new AMDevelopers({', 765, 400);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('  stack: ["Flask", "Three.js", "AI"],', 765, 430);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('  syncDevices: true,', 765, 460);
    ctx.fillStyle = `rgba(16, 185, 129, ${pulseAlpha})`;
    ctx.fillText('  liveStream: "ACTIVE_REALTIME",', 765, 490);
    ctx.fillStyle = '#a855f7';
    ctx.fillText('  performanceScore: 99.4,', 765, 520);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('});', 765, 550);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('// Synchronized with Mobile Client', 765, 585);
  }

  function drawMobileScreen(time) {
    const ctx = mobileCtx;
    const w = mobileCanvas.width;
    const h = mobileCanvas.height;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#080c18');
    bgGrad.addColorStop(0.4, '#0f172a');
    bgGrad.addColorStop(1, '#060810');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Dynamic Island / Top Notch
    ctx.fillStyle = '#000000';
    roundRect(ctx, w / 2 - 80, 16, 160, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.arc(w / 2 + 50, 33, 4, 0, Math.PI * 2);
    ctx.fill();

    // Status bar indicators
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('9:41', 40, 38);
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('5G  ● 99%', w - 105, 38);

    // App Header Bar
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('AM', 36, 105);
    ctx.fillStyle = '#00f2fe';
    ctx.fillText('Developers', 76, 105);

    // Mobile menu burger icon
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(w - 65, 96);
    ctx.lineTo(w - 35, 96);
    ctx.moveTo(w - 65, 104);
    ctx.lineTo(w - 42, 104);
    ctx.stroke();

    // Section title
    ctx.font = '900 38px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Mobile App', 36, 175);
    ctx.fillText('Development', 36, 220);

    // Synced Live Beacon Pill
    const beaconPulse = 0.6 + 0.4 * Math.sin(time * 3);
    ctx.fillStyle = `rgba(16, 185, 129, 0.15)`;
    ctx.strokeStyle = `rgba(16, 185, 129, ${beaconPulse})`;
    ctx.lineWidth = 1.5;
    roundRect(ctx, 36, 245, 230, 38, 19);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(58, 264, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SYNCED WITH DESKTOP', 74, 269);

    // Central 3D Glowing Hologram Widget
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
    ctx.lineWidth = 2;
    roundRect(ctx, 36, 310, w - 72, 340, 24);
    ctx.fill();
    ctx.stroke();

    // Glowing Neon Hologram Icon inside card
    const holoSize = 90 + 10 * Math.sin(time * 2.5);
    const holoGrad = ctx.createRadialGradient(w / 2, 430, 10, w / 2, 430, holoSize);
    holoGrad.addColorStop(0, 'rgba(0, 242, 254, 0.8)');
    holoGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.4)');
    holoGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = holoGrad;
    ctx.beginPath();
    ctx.arc(w / 2, 430, holoSize, 0, Math.PI * 2);
    ctx.fill();

    // Central Robot/Device vector icon
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 4;
    roundRect(ctx, w / 2 - 36, 394, 72, 72, 16);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(w / 2 - 14, 424, 5, 0, Math.PI * 2);
    ctx.arc(w / 2 + 14, 424, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w / 2 - 12, 444);
    ctx.lineTo(w / 2 + 12, 444);
    ctx.stroke();

    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('100% Responsive Sync', w / 2, 545);

    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Same high speed across all screens', w / 2, 580);
    ctx.textAlign = 'left';

    // Live Metrics Strip
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
    roundRect(ctx, 36, 680, (w - 92) / 2, 100, 18);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText('99+', 60, 725);
    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Score', 60, 755);

    roundRect(ctx, 36 + (w - 92) / 2 + 20, 680, (w - 92) / 2, 100, 18);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillStyle = '#8b5cf6';
    ctx.fillText('30+', 36 + (w - 92) / 2 + 44, 725);
    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Projects', 36 + (w - 92) / 2 + 44, 755);

    // Animated Cyber Wave Grid on Mobile (EXACT SYNC with Laptop!)
    drawCyberGrid(ctx, 36, 810, w - 72, 280, time, '#8b5cf6', '#00f2fe');

    // Bottom Action CTA
    const mobileBtnGrad = ctx.createLinearGradient(36, 1120, w - 36, 1120);
    mobileBtnGrad.addColorStop(0, '#00f2fe');
    mobileBtnGrad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = mobileBtnGrad;
    roundRect(ctx, 36, 1120, w - 72, 60, 18);
    ctx.fill();
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillStyle = '#0a0e17';
    ctx.textAlign = 'center';
    ctx.fillText('Get Free Estimate →', w / 2, 1157);
    ctx.textAlign = 'left';
  }

  // Helper: Draw animated cyber sine mesh
  function drawCyberGrid(ctx, x, y, width, height, time, colorA, colorB) {
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, x, y, width, height, 16);
    ctx.clip();

    ctx.fillStyle = 'rgba(10, 15, 30, 0.7)';
    ctx.fillRect(x, y, width, height);

    const rows = 10;
    const cols = 14;
    const cellW = width / cols;
    const cellH = height / rows;

    ctx.lineWidth = 1.2;

    // Horizontal waving lines
    for (let i = 0; i <= rows; i++) {
      const grad = ctx.createLinearGradient(x, 0, x + width, 0);
      grad.addColorStop(0, 'rgba(0, 242, 254, 0.15)');
      grad.addColorStop(0.5, i % 2 === 0 ? colorA : colorB);
      grad.addColorStop(1, 'rgba(139, 92, 246, 0.15)');
      ctx.strokeStyle = grad;
      ctx.beginPath();

      for (let j = 0; j <= cols; j++) {
        const px = x + j * cellW;
        // Synced sinusoidal wave height
        const wave = Math.sin(time * 2.5 + (j * 0.4) + (i * 0.3)) * 10;
        const py = y + i * cellH + wave;

        if (j === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }

    // Vertical lines
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
    for (let j = 0; j <= cols; j++) {
      ctx.beginPath();
      for (let i = 0; i <= rows; i++) {
        const px = x + j * cellW;
        const wave = Math.sin(time * 2.5 + (j * 0.4) + (i * 0.3)) * 10;
        const py = y + i * cellH + wave;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /* -------------------------------------------------------------
     2. Three.js Scene Setup & Camera Orbit
     ------------------------------------------------------------- */
  function initThreeScene() {
    scene = new THREE.Scene();

    const aspect = container.clientWidth / container.clientHeight || 1.77;
    camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);

    // Set classic isometric hero angle with elevated vantage point
    camera.position.set(5.2, 4.2, 6.8);

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // OrbitControls for 360 rotation
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0.5, 0.35, 0);
    controls.minDistance = 4.5;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI / 2 + 0.08; // Allow slight floor view, prevent underfloor flip
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    controls.addEventListener('start', function () {
      isUserInteracting = true;
      if (dragHintPill) {
        dragHintPill.style.transition = 'opacity 0.5s ease';
        dragHintPill.style.opacity = '0';
        setTimeout(() => { dragHintPill.style.display = 'none'; }, 500);
      }
      if (resumeTimer) clearTimeout(resumeTimer);
    });

    controls.addEventListener('end', function () {
      // Resume gentle auto-rotate after 3 seconds of inactivity
      resumeTimer = setTimeout(() => {
        isUserInteracting = false;
        controls.autoRotate = isAutoRotating;
      }, 3000);
    });
  }

  /* -------------------------------------------------------------
     3. Studio Environment & Ambient Neon Lighting
     ------------------------------------------------------------- */
  function buildStudioEnvironment() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    // Left Rim / Cyan light
    const cyanLight = new THREE.DirectionalLight(0x00f2fe, 1.8);
    cyanLight.position.set(-6, 5, 4);
    scene.add(cyanLight);

    // Right Rim / Purple light
    const purpleLight = new THREE.DirectionalLight(0x8b5cf6, 2.0);
    purpleLight.position.set(6, 6, -3);
    scene.add(purpleLight);

    // Front soft fill light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(0, 4, 8);
    scene.add(fillLight);

    // Dynamic point lights from the screens (ambient screen illumination)
    screenPointLight = new THREE.PointLight(0x00f2fe, 1.4, 7);
    screenPointLight.position.set(-0.8, 1.5, 0.4);
    scene.add(screenPointLight);

    mobilePointLight = new THREE.PointLight(0x8b5cf6, 1.3, 5);
    mobilePointLight.position.set(2.4, 1.2, 0.8);
    scene.add(mobilePointLight);

    // Reflective circular studio floor disc
    const floorGeo = new THREE.CircleGeometry(8, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      roughness: 0.35,
      metalness: 0.8,
      transparent: true,
      opacity: 0.95
    });
    floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.55;
    scene.add(floorMesh);

    // Floor grid lines
    const gridHelper = new THREE.GridHelper(14, 28, 0x00f2fe, 0x1e293b);
    gridHelper.position.y = -0.54;
    gridHelper.material.opacity = 0.35;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Background floating cyber particles
    const particleCount = 70;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 16;
      particlePos[i + 1] = Math.random() * 6 - 0.5;
      particlePos[i + 2] = (Math.random() - 0.5) * 16;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f2fe,
      size: 0.06,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
  }

  /* -------------------------------------------------------------
     4. Procedural 3D MacBook Pro (Laptop)
     ------------------------------------------------------------- */
  function buildLaptop() {
    laptopGroup = new THREE.Group();
    laptopGroup.position.set(-0.8, -0.4, 0);

    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x222733,
      roughness: 0.28,
      metalness: 0.88
    });

    const darkMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x111622,
      roughness: 0.3,
      metalness: 0.9
    });

    // 1. Base bottom chassis
    const baseGeo = new THREE.BoxGeometry(3.6, 0.12, 2.4);
    const baseMesh = new THREE.Mesh(baseGeo, metalMaterial);
    baseMesh.position.set(0, 0.06, 0);
    laptopGroup.add(baseMesh);

    // 2. Keyboard recess area
    const kbTrayGeo = new THREE.BoxGeometry(3.1, 0.01, 1.3);
    const kbTrayMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.6,
      metalness: 0.4
    });
    const kbTrayMesh = new THREE.Mesh(kbTrayGeo, kbTrayMat);
    kbTrayMesh.position.set(0, 0.125, -0.2);
    laptopGroup.add(kbTrayMesh);

    // 3. Trackpad
    const trackpadGeo = new THREE.BoxGeometry(1.2, 0.008, 0.8);
    const trackpadMat = new THREE.MeshStandardMaterial({
      color: 0x272d3b,
      roughness: 0.22,
      metalness: 0.85
    });
    const trackpadMesh = new THREE.Mesh(trackpadGeo, trackpadMat);
    trackpadMesh.position.set(0, 0.126, 0.65);
    laptopGroup.add(trackpadMesh);

    // Trackpad subtle border glow
    const trackpadBorderGeo = new THREE.EdgesGeometry(trackpadGeo);
    const trackpadBorderMat = new THREE.LineBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.35
    });
    const trackpadBorder = new THREE.LineSegments(trackpadBorderGeo, trackpadBorderMat);
    trackpadBorder.position.copy(trackpadMesh.position);
    laptopGroup.add(trackpadBorder);

    // 4. Keyboard keys grid
    const keyRows = 5;
    const keyCols = 14;
    const keyW = 0.18;
    const keyH = 0.16;
    const keyGap = 0.035;
    const keyGeo = new THREE.BoxGeometry(keyW, 0.02, keyH);
    const keyMat = new THREE.MeshStandardMaterial({
      color: 0x151b28,
      roughness: 0.5,
      metalness: 0.3
    });

    const keysGroup = new THREE.Group();
    const startX = -((keyCols - 1) * (keyW + keyGap)) / 2;
    const startZ = -0.2 - ((keyRows - 1) * (keyH + keyGap)) / 2;

    for (let r = 0; r < keyRows; r++) {
      for (let c = 0; c < keyCols; c++) {
        // Skip spacebar slot
        if (r === keyRows - 1 && c >= 4 && c <= 9) continue;
        const keyMesh = new THREE.Mesh(keyGeo, keyMat);
        keyMesh.position.set(startX + c * (keyW + keyGap), 0.135, startZ + r * (keyH + keyGap));
        keysGroup.add(keyMesh);
      }
    }

    // Spacebar
    const spaceGeo = new THREE.BoxGeometry((keyW + keyGap) * 6, 0.02, keyH);
    const spaceMesh = new THREE.Mesh(spaceGeo, keyMat);
    spaceMesh.position.set(0, 0.135, startZ + (keyRows - 1) * (keyH + keyGap));
    keysGroup.add(spaceMesh);
    laptopGroup.add(keysGroup);

    // Keyboard cyan backlighting plane
    const kbLightGeo = new THREE.PlaneGeometry(3.1, 1.3);
    const kbLightMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.12
    });
    const kbLightMesh = new THREE.Mesh(kbLightGeo, kbLightMat);
    kbLightMesh.rotation.x = -Math.PI / 2;
    kbLightMesh.position.set(0, 0.126, -0.2);
    laptopGroup.add(kbLightMesh);

    // 5. Display Lid Hinge & Screen
    const hingeGeo = new THREE.CylinderGeometry(0.045, 0.045, 3.2, 16);
    const hingeMesh = new THREE.Mesh(hingeGeo, darkMetalMaterial);
    hingeMesh.rotation.z = Math.PI / 2;
    hingeMesh.position.set(0, 0.11, -1.18);
    laptopGroup.add(hingeMesh);

    // Screen Pivot Group
    const screenPivot = new THREE.Group();
    screenPivot.position.set(0, 0.11, -1.18);
    // Angle screen back at ~115 degrees
    screenPivot.rotation.x = -Math.PI * 0.14;

    // Display Outer Lid (Space gray back)
    const lidGeo = new THREE.BoxGeometry(3.6, 2.38, 0.07);
    const lidMesh = new THREE.Mesh(lidGeo, metalMaterial);
    lidMesh.position.set(0, 1.19, 0);
    screenPivot.add(lidMesh);

    // AM Developers illuminated logo on the BACK of laptop lid
    const logoBackGeo = new THREE.PlaneGeometry(0.55, 0.55);
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = 128;
    logoCanvas.height = 128;
    const lctx = logoCanvas.getContext('2d');
    lctx.fillStyle = '#00f2fe';
    lctx.font = 'bold 50px Inter, sans-serif';
    lctx.textAlign = 'center';
    lctx.fillText('AM', 64, 76);
    const logoTexture = new THREE.CanvasTexture(logoCanvas);
    const logoBackMat = new THREE.MeshBasicMaterial({
      map: logoTexture,
      transparent: true,
      opacity: 0.85
    });
    const logoBackMesh = new THREE.Mesh(logoBackGeo, logoBackMat);
    logoBackMesh.position.set(0, 1.25, -0.038);
    logoBackMesh.rotation.y = Math.PI; // Face outwards to the back
    screenPivot.add(logoBackMesh);

    // Display Front Bezel (Thin black border)
    const bezelGeo = new THREE.BoxGeometry(3.54, 2.32, 0.01);
    const bezelMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
    bezelMesh.position.set(0, 1.19, 0.036);
    screenPivot.add(bezelMesh);

    // Web camera aperture dot
    const camGeo = new THREE.CircleGeometry(0.015, 12);
    const camMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const camMesh = new THREE.Mesh(camGeo, camMat);
    camMesh.position.set(0, 2.31, 0.042);
    screenPivot.add(camMesh);

    // Live Synced Laptop Screen Surface
    const screenGeo = new THREE.PlaneGeometry(3.42, 2.14);
    const screenMat = new THREE.MeshBasicMaterial({
      map: laptopTexture,
      toneMapped: false
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 1.17, 0.042);
    screenPivot.add(screenMesh);

    laptopGroup.add(screenPivot);
    scene.add(laptopGroup);
  }

  /* -------------------------------------------------------------
     5. Procedural 3D Smartphone (Mobile)
     ------------------------------------------------------------- */
  function buildMobile() {
    mobileGroup = new THREE.Group();
    // Position floating to the right of the laptop
    mobileGroup.position.set(2.4, -0.05, 0.6);
    mobileGroup.rotation.y = -0.32; // Angled toward user
    mobileGroup.rotation.z = 0.06;  // Slight dynamic tilt

    const phoneMetalMat = new THREE.MeshStandardMaterial({
      color: 0x16152a,
      roughness: 0.2,
      metalness: 0.92
    });

    const phoneRimMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      emissive: 0x3b1875,
      roughness: 0.25,
      metalness: 0.85
    });

    // Phone body chassis
    const phoneGeo = new THREE.BoxGeometry(1.18, 2.34, 0.08);
    const phoneMesh = new THREE.Mesh(phoneGeo, phoneMetalMat);
    mobileGroup.add(phoneMesh);

    // Purple metallic outer bevel rim
    const rimGeo = new THREE.BoxGeometry(1.22, 2.38, 0.07);
    const rimMesh = new THREE.Mesh(rimGeo, phoneRimMat);
    mobileGroup.add(rimMesh);

    // Back Camera Bump
    const camBumpGeo = new THREE.BoxGeometry(0.48, 0.48, 0.04);
    const camBumpMesh = new THREE.Mesh(camBumpGeo, phoneMetalMat);
    camBumpMesh.position.set(-0.25, 0.8, -0.05);
    mobileGroup.add(camBumpMesh);

    // Camera lenses
    const lensGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      roughness: 0.1,
      metalness: 0.95
    });
    const lens1 = new THREE.Mesh(lensGeo, lensMat);
    lens1.rotation.x = Math.PI / 2;
    lens1.position.set(-0.32, 0.9, -0.07);
    mobileGroup.add(lens1);

    const lens2 = new THREE.Mesh(lensGeo, lensMat);
    lens2.rotation.x = Math.PI / 2;
    lens2.position.set(-0.32, 0.7, -0.07);
    mobileGroup.add(lens2);

    // Live Synced Mobile Screen Surface
    const mobileScreenGeo = new THREE.PlaneGeometry(1.12, 2.26);
    const mobileScreenMat = new THREE.MeshBasicMaterial({
      map: mobileTexture,
      toneMapped: false
    });
    const mobileScreenMesh = new THREE.Mesh(mobileScreenGeo, mobileScreenMat);
    mobileScreenMesh.position.set(0, 0, 0.042);
    mobileGroup.add(mobileScreenMesh);

    // Phone shadow receiver on floor
    const shadowGeo = new THREE.CircleGeometry(0.65, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(2.4, -0.53, 0.6);
    scene.add(shadowMesh);

    scene.add(mobileGroup);
  }

  /* -------------------------------------------------------------
     6. Live Synchronized Data Stream (Glowing Particles)
     ------------------------------------------------------------- */
  function buildSyncDataStream() {
    syncParticleGroup = new THREE.Group();

    // Curved sync pathway between laptop screen and phone
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.5, 0.8, -0.2),
      new THREE.Vector3(1.3, 1.2, 0.2),
      new THREE.Vector3(1.8, 0.9, 0.4),
      new THREE.Vector3(2.3, 0.5, 0.6)
    ]);

    // Glowing path line
    const points = curve.getPoints(50);
    const pathGeo = new THREE.BufferGeometry().setFromPoints(points);
    const pathMat = new THREE.LineBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.35
    });
    const pathLine = new THREE.Line(pathGeo, pathMat);
    syncParticleGroup.add(pathLine);

    // 10 traveling energy nodes
    const nodeCount = 8;
    const nodeGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const nodeMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.9
    });

    syncParticleGroup.nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.curveOffset = i / nodeCount;
      syncParticleGroup.nodes.push(node);
      syncParticleGroup.add(node);
    }

    syncParticleGroup.curve = curve;
    scene.add(syncParticleGroup);
  }

  /* -------------------------------------------------------------
     7. Main Animation Loop
     ------------------------------------------------------------- */
  function animate(now) {
    animFrameId = requestAnimationFrame(animate);

    const time = now * 0.001;

    // Controls update (handles smooth damping and 360 auto-rotate)
    if (controls) controls.update();

    // Subtle floating levitation on the phone
    if (mobileGroup) {
      mobileGroup.position.y = -0.05 + Math.sin(time * 2.2) * 0.04;
      mobileGroup.rotation.z = 0.06 + Math.sin(time * 1.8) * 0.02;
    }

    // Update synchronized traveling data stream nodes
    if (syncParticleGroup && syncParticleGroup.nodes && syncParticleGroup.curve) {
      const curve = syncParticleGroup.curve;
      syncParticleGroup.nodes.forEach((node) => {
        let t = (node.curveOffset + time * 0.35) % 1;
        const pos = curve.getPointAt(t);
        node.position.copy(pos);
        // Pulse color between cyan and purple
        node.scale.setScalar(0.8 + 0.4 * Math.sin(time * 6 + t * 10));
      });
    }

    // Ambient screen glow pulses
    if (screenPointLight) {
      screenPointLight.intensity = 1.3 + 0.3 * Math.sin(time * 2.5);
    }
    if (mobilePointLight) {
      mobilePointLight.intensity = 1.2 + 0.3 * Math.cos(time * 2.5);
    }

    // Redraw screen canvases at ~30-40fps for high performance and buttery smooth sync
    if (now - lastScreenUpdate > 28) {
      drawLaptopScreen(time);
      drawMobileScreen(time);
      if (laptopTexture) laptopTexture.needsUpdate = true;
      if (mobileTexture) mobileTexture.needsUpdate = true;
      lastScreenUpdate = now;
    }

    // Render 3D Scene
    if (renderer && scene && camera && is3DMode) {
      renderer.render(scene, camera);
    }
  }

  /* -------------------------------------------------------------
     8. Controls & UI Presets
     ------------------------------------------------------------- */
  function setupControls() {
    // 1. Toggle 360 Auto-Spin
    if (btnToggleSpin) {
      btnToggleSpin.addEventListener('click', function () {
        isAutoRotating = !isAutoRotating;
        controls.autoRotate = isAutoRotating;
        if (spinBtnIcon) {
          if (isAutoRotating) {
            spinBtnIcon.className = 'bi bi-pause-circle-fill fs-6 text-cyan';
            if (badgeSpinIcon) badgeSpinIcon.classList.add('spin-slow');
          } else {
            spinBtnIcon.className = 'bi bi-play-circle-fill fs-6 text-muted';
            if (badgeSpinIcon) badgeSpinIcon.classList.remove('spin-slow');
          }
        }
      });
    }

    // 2. Preset: 3D Isometric View
    if (btnPresetIso) {
      btnPresetIso.addEventListener('click', function () {
        smoothFlyCamera(5.2, 4.2, 6.8, 0.5, 0.35, 0);
      });
    }

    // 3. Preset: Front Comparison View
    if (btnPresetFront) {
      btnPresetFront.addEventListener('click', function () {
        smoothFlyCamera(0.8, 2.2, 6.4, 0.8, 0.5, 0);
      });
    }

    // 4. Toggle Mode: 3D WebGL vs HD Photo View
    if (btnToggleMode) {
      btnToggleMode.addEventListener('click', function () {
        is3DMode = !is3DMode;
        if (is3DMode) {
          container.classList.remove('d-none');
          if (photoContainer) photoContainer.classList.add('d-none');
          if (modeBtnText) modeBtnText.innerHTML = '<i class="bi bi-image me-1 text-secondary"></i>Photo';
          if (btnToggleSpin) btnToggleSpin.classList.remove('d-none');
          if (btnPresetIso) btnPresetIso.classList.remove('d-none');
          if (btnPresetFront) btnPresetFront.classList.remove('d-none');
        } else {
          container.classList.add('d-none');
          if (photoContainer) photoContainer.classList.remove('d-none');
          if (modeBtnText) modeBtnText.innerHTML = '<i class="bi bi-box me-1 text-cyan"></i>3D 360°';
          if (btnToggleSpin) btnToggleSpin.classList.add('d-none');
          if (btnPresetIso) btnPresetIso.classList.add('d-none');
          if (btnPresetFront) btnPresetFront.classList.add('d-none');
        }
      });
    }
  }

  // Smooth camera flight transition
  function smoothFlyCamera(targetX, targetY, targetZ, lookX, lookY, lookZ, duration = 800) {
    if (!camera || !controls) return;

    controls.autoRotate = false;
    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(targetX, targetY, targetZ);
    const startTarget = controls.target.clone();
    const endTarget = new THREE.Vector3(lookX, lookY, lookZ);
    const startTime = performance.now();

    function flyStep(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // EaseInOutCubic
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      camera.position.lerpVectors(startPos, endPos, ease);
      controls.target.lerpVectors(startTarget, endTarget, ease);
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(flyStep);
      } else {
        controls.autoRotate = isAutoRotating;
      }
    }

    requestAnimationFrame(flyStep);
  }

  /* -------------------------------------------------------------
     9. Responsive Window & Resize Handling
     ------------------------------------------------------------- */
  function setupEventListeners() {
    function onWindowResize() {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;

      // Adjust camera distance for mobile screens so both devices fit perfectly
      if (width < 576) {
        camera.fov = 48;
      } else if (width < 992) {
        camera.fov = 42;
      } else {
        camera.fov = 38;
      }

      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    window.addEventListener('resize', onWindowResize);

    // Initial check on mobile
    if (container.clientWidth < 576) {
      camera.fov = 48;
      camera.updateProjectionMatrix();
    }
  }

  /* -------------------------------------------------------------
     10. Interactive 3D Parallax Tilt for Photo View
     ------------------------------------------------------------- */
  function setupTiltPhotoView() {
    const card = document.getElementById('mockupCard');
    const tiltWrapper = document.querySelector('.mockup-tilt-wrapper');
    const sheen = document.querySelector('.mockup-sheen-highlight');

    if (!card || !tiltWrapper) return;

    card.addEventListener('mousemove', function (e) {
      if (is3DMode) return; // Only active in photo mode
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const rotateY = x * 20; // -10 to +10 deg
      const rotateX = -y * 20;

      tiltWrapper.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      if (sheen) {
        sheen.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(0, 242, 254, 0.22) 0%, transparent 60%)`;
      }
    });

    card.addEventListener('mouseleave', function () {
      if (is3DMode) return;
      tiltWrapper.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      if (sheen) {
        sheen.style.background = 'transparent';
      }
    });
  }

})();
