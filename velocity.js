document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('.scroll-velocity');

    const wrap = (min, max, v) => {
        const range = max - min;
        const mod = (((v - min) % range) + range) % range;
        return mod + min;
    };

    containers.forEach(container => {
        const texts = JSON.parse(container.dataset.texts || '[]');
        const baseVelocityValue = parseFloat(container.dataset.velocity || 100);

        texts.forEach((text, index) => {
            const isReverse = index % 2 !== 0;
            const baseVelocity = isReverse ? -baseVelocityValue : baseVelocityValue;

            const parallax = document.createElement('div');
            parallax.className = 'parallax';

            const scroller = document.createElement('div');
            scroller.className = 'scroller';

            const numCopies = 6;
            for (let i = 0; i < numCopies; i++) {
                const span = document.createElement('span');
                // Use innerHTML so we can use • dots easily
                span.innerHTML = text + '&nbsp;&nbsp;';
                scroller.appendChild(span);
            }

            parallax.appendChild(scroller);
            container.appendChild(parallax);

            let baseX = 0;
            let targetScrollVelocity = 0;
            let smoothVelocity = 0;
            let directionFactor = 1;
            let copyWidth = 0;

            const updateWidth = () => {
                if (scroller.children.length > 0) {
                    copyWidth = scroller.children[0].getBoundingClientRect().width;
                }
            };

            updateWidth();
            window.addEventListener('resize', updateWidth);
            // also trigger once on load just in case fonts load
            window.addEventListener('load', updateWidth);

            let lastScrollY = window.scrollY;
            let lastTime = performance.now();

            const tick = (time) => {
                const delta = time - lastTime;
                lastTime = time;

                const currentScrollY = window.scrollY;
                const scrollDelta = currentScrollY - lastScrollY;
                lastScrollY = currentScrollY;

                // pixels per sec
                // cap delta to avoid massive jumps on lag
                const safeDelta = Math.min(Math.max(delta, 1), 60);
                targetScrollVelocity = (scrollDelta / safeDelta) * 1000;

                smoothVelocity += (targetScrollVelocity - smoothVelocity) * 0.1;
                const velocityFactor = smoothVelocity * 0.005;

                let moveBy = directionFactor * baseVelocity * (safeDelta / 1000);

                if (velocityFactor < -0.01) {
                    directionFactor = -1;
                } else if (velocityFactor > 0.01) {
                    directionFactor = 1;
                }

                moveBy += directionFactor * moveBy * Math.abs(velocityFactor);
                baseX += moveBy;

                if (copyWidth > 0) {
                    baseX = wrap(-copyWidth, 0, baseX);
                }

                scroller.style.transform = `translate3d(${baseX}px, 0, 0)`;
                requestAnimationFrame(tick);
            };

            requestAnimationFrame(tick);
        });
    });
});
