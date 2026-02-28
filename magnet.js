document.addEventListener('DOMContentLoaded', () => {
    const magnets = document.querySelectorAll('.magnet-wrapper');

    magnets.forEach(magnet => {
        const inner = magnet.querySelector('.magnet-inner');
        if (!inner) return;

        // Read attributes or fallback to defaults
        const padding = parseInt(magnet.getAttribute('data-padding')) || 50;
        const magnetStrength = parseFloat(magnet.getAttribute('data-strength')) || 2;
        const activeTransition = magnet.getAttribute('data-active-transition') || 'transform 0.3s ease-out';
        const inactiveTransition = magnet.getAttribute('data-inactive-transition') || 'transform 0.5s ease-in-out';

        let isActive = false;

        // Apply necessary base styles
        magnet.style.position = 'relative';
        magnet.style.display = 'inline-block';

        inner.style.willChange = 'transform';
        inner.style.transition = inactiveTransition;
        inner.style.display = 'inline-block';

        const handleMouseMove = (e) => {
            const rect = magnet.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const centerX = rect.left + width / 2;
            const centerY = rect.top + height / 2;

            const distX = Math.abs(centerX - e.clientX);
            const distY = Math.abs(centerY - e.clientY);

            // Check if mouse is within padding radius
            if (distX < width / 2 + padding && distY < height / 2 + padding) {
                isActive = true;

                const offsetX = (e.clientX - centerX) / magnetStrength;
                const offsetY = (e.clientY - centerY) / magnetStrength;

                inner.style.transition = activeTransition;
                inner.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
            } else {
                if (isActive) {
                    isActive = false;
                    inner.style.transition = inactiveTransition;
                    inner.style.transform = `translate3d(0px, 0px, 0px)`;
                }
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
    });
});
