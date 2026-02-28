import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

const vertexShader = `
precision highp float;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3  iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;

uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform bool parallax;
uniform float parallaxStrength;
uniform vec2 parallaxOffset;

uniform vec3 lineGradient[8];
uniform int lineGradientCount;

const vec3 BLACK = vec3(0.0);
const vec3 PINK  = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE  = vec3(47.0,  75.0, 162.0) / 255.0;

mat2 rotate(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

vec3 background_color(vec2 uv) {
  vec3 col = vec3(0.0);

  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;

  col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
  col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
  return col * 0.5;
}

vec3 getLineColor(float t, vec3 baseColor) {
  if (lineGradientCount <= 0) {
    return baseColor;
  }

  vec3 gradientColor;
  
  if (lineGradientCount == 1) {
    gradientColor = lineGradient[0];
  } else {
    float clampedT = clamp(t, 0.0, 0.9999);
    float scaled = clampedT * float(lineGradientCount - 1);
    int idx = int(floor(scaled));
    float f = fract(scaled);
    int idx2 = min(idx + 1, lineGradientCount - 1);

    vec3 c1 = lineGradient[idx];
    vec3 c2 = lineGradient[idx2];
    
    gradientColor = mix(c1, c2, f);
  }
  
  return gradientColor * 0.5;
}

float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;

  float x_offset   = offset;
  float x_movement = time * 0.1;
  float amp        = sin(offset + time * 0.2) * 0.3;
  float y          = sin(uv.x + x_offset + x_movement) * amp;

  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius); // radial falloff around cursor
    float bendOffset = (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
    y += bendOffset;
  }

  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;
  
  if (parallax) {
    baseUv += parallaxOffset;
  }

  vec3 col = vec3(0.0);

  vec3 b = lineGradientCount > 0 ? vec3(0.0) : background_color(baseUv);

  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }
  
  if (enableBottom) {
    for (int i = 0; i < bottomLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(bottomLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y),
        1.5 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.2;
    }
  }

  if (enableMiddle) {
    for (int i = 0; i < middleLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(middleLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y),
        2.0 + 0.15 * fi,
        baseUv,
        mouseUv,
        interactive
      );
    }
  }

  if (enableTop) {
    for (int i = 0; i < topLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(topLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      ruv.x *= -1.0;
      col += lineCol * wave(
        ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y),
        1.0 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.1;
    }
  }

  fragColor = vec4(col, 1.0);
}

void main() {
  vec4 color = vec4(0.0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`;

const MAX_GRADIENT_STOPS = 8;

export function initFloatingLines(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const {
    linesGradient = [],
    enabledWaves = ['top', 'middle', 'bottom'],
    lineCount = [5],
    lineDistance = [5],
    topWavePosition = { x: 10.0, y: 0.5, rotate: -0.4 },
    middleWavePosition = { x: 5.0, y: 0.0, rotate: 0.2 },
    bottomWavePosition = { x: 2.0, y: -0.7, rotate: 0.4 },
    animationSpeed = 1,
    interactive = true,
    bendRadius = 5.0,
    bendStrength = -0.5,
    mouseDamping = 0.05,
    parallax = true,
    parallaxStrength = 0.2,
    mixBlendMode = 'screen'
  } = options;

  container.style.mixBlendMode = mixBlendMode;

  const getLineCountValue = (waveType) => {
    if (typeof lineCount === 'number') return lineCount;
    if (!enabledWaves.includes(waveType)) return 0;
    const index = enabledWaves.indexOf(waveType);
    return lineCount[index] ?? 5;
  };

  const getLineDistanceValue = (waveType) => {
    if (typeof lineDistance === 'number') return lineDistance;
    if (!enabledWaves.includes(waveType)) return 0.1;
    const index = enabledWaves.indexOf(waveType);
    return lineDistance[index] ?? 0.1;
  };

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  camera.position.z = 1;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3(1, 1, 1) },
    animationSpeed: { value: animationSpeed },
    enableTop: { value: enabledWaves.includes('top') },
    enableMiddle: { value: enabledWaves.includes('middle') },
    enableBottom: { value: enabledWaves.includes('bottom') },
    topLineCount: { value: getLineCountValue('top') },
    middleLineCount: { value: getLineCountValue('middle') },
    bottomLineCount: { value: getLineCountValue('bottom') },
    topLineDistance: { value: getLineDistanceValue('top') * 0.01 },
    middleLineDistance: { value: getLineDistanceValue('middle') * 0.01 },
    bottomLineDistance: { value: getLineDistanceValue('bottom') * 0.01 },
    topWavePosition: { value: new THREE.Vector3(topWavePosition.x, topWavePosition.y, topWavePosition.rotate) },
    middleWavePosition: { value: new THREE.Vector3(middleWavePosition.x, middleWavePosition.y, middleWavePosition.rotate) },
    bottomWavePosition: { value: new THREE.Vector3(bottomWavePosition.x, bottomWavePosition.y, bottomWavePosition.rotate) },
    iMouse: { value: new THREE.Vector2(-1000, -1000) },
    interactive: { value: interactive },
    bendRadius: { value: bendRadius },
    bendStrength: { value: bendStrength },
    bendInfluence: { value: 0 },
    parallax: { value: parallax },
    parallaxStrength: { value: parallaxStrength },
    parallaxOffset: { value: new THREE.Vector2(0, 0) },
    lineGradient: { value: Array.from({ length: MAX_GRADIENT_STOPS }, () => new THREE.Vector3(1, 1, 1)) },
    lineGradientCount: { value: 0 }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const clock = new THREE.Clock();

  const currentMouse = new THREE.Vector2(-1000, -1000);
  const targetMouse = new THREE.Vector2(-1000, -1000);
  let currentInfluence = 0;
  let targetInfluence = 0;
  const currentParallax = new THREE.Vector2(0, 0);
  const targetParallax = new THREE.Vector2(0, 0);

  const setSize = () => {
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    renderer.setSize(width, height, false);
    uniforms.iResolution.value.set(width, height, 1);
  };

  setSize();
  window.addEventListener('resize', setSize);

  const handlePointerMove = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dpr = renderer.getPixelRatio();

    targetMouse.set(x * dpr, (rect.height - y) * dpr);
    targetInfluence = 1.0;

    if (parallax) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const offsetX = (x - centerX) / rect.width;
      const offsetY = -(y - centerY) / rect.height;
      targetParallax.set(offsetX * parallaxStrength, offsetY * parallaxStrength);
    }
  };

  const handlePointerLeave = () => {
    targetInfluence = 0.0;
  };

  if (interactive) {
    document.addEventListener('mousemove', handlePointerMove); // Listen to document for wider interaction
    document.addEventListener('mouseleave', handlePointerLeave);
  }

  let raf = 0;
  const renderLoop = () => {
    uniforms.iTime.value = clock.getElapsedTime();

    if (interactive) {
      currentMouse.lerp(targetMouse, mouseDamping);
      uniforms.iMouse.value.copy(currentMouse);
      currentInfluence += (targetInfluence - currentInfluence) * mouseDamping;
      uniforms.bendInfluence.value = currentInfluence;
    }

    if (parallax) {
      currentParallax.lerp(targetParallax, mouseDamping);
      uniforms.parallaxOffset.value.copy(currentParallax);
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(renderLoop);
  };
  renderLoop();
}
