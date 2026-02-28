document.addEventListener('DOMContentLoaded', () => {
    const borders = document.querySelectorAll('.electric-border');

    borders.forEach(container => {
        const color = container.dataset.color || '#ec4899'; // Default to accent color
        const speed = parseFloat(container.dataset.speed || 1);
        const chaos = parseFloat(container.dataset.chaos || 0.12);

        let borderRadius = parseFloat(container.dataset.borderRadius);
        if (isNaN(borderRadius)) {
            const computedStyle = window.getComputedStyle(container);
            borderRadius = parseFloat(computedStyle.borderRadius) || 24;
        }

        container.style.setProperty('--electric-border-color', color);

        if (window.getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'eb-canvas-container';
        const canvas = document.createElement('canvas');
        canvas.className = 'eb-canvas';
        canvasContainer.appendChild(canvas);

        const layers = document.createElement('div');
        layers.className = 'eb-layers';
        layers.style.borderRadius = `${borderRadius}px`;
        layers.innerHTML = `
            <div class="eb-glow-1" style="border-radius: ${borderRadius}px;"></div>
            <div class="eb-glow-2" style="border-radius: ${borderRadius}px;"></div>
            <div class="eb-background-glow" style="border-radius: ${borderRadius}px;"></div>
        `;

        Array.from(container.children).forEach(child => {
            const childStyle = window.getComputedStyle(child);
            if (childStyle.position === 'static') {
                child.style.position = 'relative';
            }
            if (childStyle.zIndex === 'auto') {
                child.style.zIndex = '5';
            }
        });

        // Insert underneath children
        container.insertBefore(layers, container.firstChild);
        container.insertBefore(canvasContainer, layers);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let time = 0;
        let lastFrameTime = performance.now();
        let animationFrameId;

        const random = (x) => {
            return (Math.sin(x * 12.9898) * 43758.5453) % 1;
        };

        const noise2D = (x, y) => {
            const i = Math.floor(x);
            const j = Math.floor(y);
            const fx = x - i;
            const fy = y - j;

            const a = random(i + j * 57);
            const b = random(i + 1 + j * 57);
            const c = random(i + (j + 1) * 57);
            const d = random(i + 1 + (j + 1) * 57);

            const ux = fx * fx * (3.0 - 2.0 * fx);
            const uy = fy * fy * (3.0 - 2.0 * fy);

            return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
        };

        const octavedNoise = (x, octaves, lacunarity, gain, baseAmplitude, baseFrequency, time, seed, baseFlatness) => {
            let y = 0;
            let amplitude = baseAmplitude;
            let frequency = baseFrequency;

            for (let i = 0; i < octaves; i++) {
                let octaveAmplitude = amplitude;
                if (i === 0) {
                    octaveAmplitude *= baseFlatness;
                }
                y += octaveAmplitude * noise2D(frequency * x + seed * 100, time * frequency * 0.3);
                frequency *= lacunarity;
                amplitude *= gain;
            }

            return y;
        };

        const getCornerPoint = (centerX, centerY, radius, startAngle, arcLength, progress) => {
            const angle = startAngle + progress * arcLength;
            return {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        };

        const getRoundedRectPoint = (t, left, top, width, height, radius) => {
            const straightWidth = width - 2 * radius;
            const straightHeight = height - 2 * radius;
            const cornerArc = (Math.PI * radius) / 2;
            const totalPerimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArc;
            const distance = t * totalPerimeter;

            let accumulated = 0;

            if (distance <= accumulated + straightWidth) {
                const progress = (distance - accumulated) / straightWidth;
                return { x: left + radius + progress * straightWidth, y: top };
            }
            accumulated += straightWidth;

            if (distance <= accumulated + cornerArc) {
                const progress = (distance - accumulated) / cornerArc;
                return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, progress);
            }
            accumulated += cornerArc;

            if (distance <= accumulated + straightHeight) {
                const progress = (distance - accumulated) / straightHeight;
                return { x: left + width, y: top + radius + progress * straightHeight };
            }
            accumulated += straightHeight;

            if (distance <= accumulated + cornerArc) {
                const progress = (distance - accumulated) / cornerArc;
                return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, progress);
            }
            accumulated += cornerArc;

            if (distance <= accumulated + straightWidth) {
                const progress = (distance - accumulated) / straightWidth;
                return { x: left + width - radius - progress * straightWidth, y: top + height };
            }
            accumulated += straightWidth;

            if (distance <= accumulated + cornerArc) {
                const progress = (distance - accumulated) / cornerArc;
                return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, progress);
            }
            accumulated += cornerArc;

            if (distance <= accumulated + straightHeight) {
                const progress = (distance - accumulated) / straightHeight;
                return { x: left, y: top + height - radius - progress * straightHeight };
            }
            accumulated += straightHeight;

            const progress = (distance - accumulated) / cornerArc;
            return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, progress);
        };

        const displacement = 60;
        const borderOffset = 60;
        let width = 0;
        let height = 0;

        const updateSize = () => {
            const rect = container.getBoundingClientRect();
            width = rect.width + borderOffset * 2;
            height = rect.height + borderOffset * 2;

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.scale(dpr, dpr);
        };

        updateSize();
        // Setup ResizeObserver loop
        const resizeObserver = new ResizeObserver(() => {
            updateSize();
        });
        resizeObserver.observe(container);

        const drawElectricBorder = (currentTime) => {
            const deltaTime = (currentTime - lastFrameTime) / 1000;
            time += deltaTime * speed;
            lastFrameTime = currentTime;

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(dpr, dpr);

            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const scale = displacement;
            const left = borderOffset;
            const top = borderOffset;
            const borderWidth = width - 2 * borderOffset;
            const borderHeight = height - 2 * borderOffset;
            const maxRadius = Math.min(borderWidth, borderHeight) / 2;
            const radius = Math.min(borderRadius, maxRadius);

            const approximatePerimeter = 2 * (borderWidth + borderHeight) + 2 * Math.PI * radius;
            const sampleCount = Math.floor(approximatePerimeter / 2);

            ctx.beginPath();

            const octaves = 10;
            const lacunarity = 1.6;
            const gain = 0.7;
            const amplitude = chaos;
            const frequency = 10;
            const baseFlatness = 0;

            for (let i = 0; i <= sampleCount; i++) {
                const progress = i / sampleCount;

                const point = getRoundedRectPoint(progress, left, top, borderWidth, borderHeight, radius);

                const xNoise = octavedNoise(
                    progress * 8, octaves, lacunarity, gain, amplitude, frequency, time, 0, baseFlatness
                );

                const yNoise = octavedNoise(
                    progress * 8, octaves, lacunarity, gain, amplitude, frequency, time, 1, baseFlatness
                );

                const displacedX = point.x + xNoise * scale;
                const displacedY = point.y + yNoise * scale;

                if (i === 0) {
                    ctx.moveTo(displacedX, displacedY);
                } else {
                    ctx.lineTo(displacedX, displacedY);
                }
            }

            ctx.closePath();
            ctx.stroke();

            animationFrameId = requestAnimationFrame(drawElectricBorder);
        };

        animationFrameId = requestAnimationFrame(drawElectricBorder);
    });
});
