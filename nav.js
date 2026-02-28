document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap === 'undefined') {
        console.error("GSAP not found");
        return;
    }

    const ease = 'power3.easeOut';

    const pills = document.querySelectorAll('.pill');
    const tlRefs = [];
    const activeTweenRefs = [];

    const layout = () => {
        pills.forEach((pill, index) => {
            const circle = pill.querySelector('.hover-circle');
            if (!circle) return;

            const rect = pill.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            const R = ((w * w) / 4 + h * h) / (2 * h);
            const D = Math.ceil(2 * R) + 2;
            const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
            const originY = D - delta;

            circle.style.width = `${D}px`;
            circle.style.height = `${D}px`;
            circle.style.bottom = `-${delta}px`;

            gsap.set(circle, {
                xPercent: -50,
                scale: 0,
                transformOrigin: `50% ${originY}px`
            });

            const label = pill.querySelector('.pill-label');
            const white = pill.querySelector('.pill-label-hover');

            if (label) gsap.set(label, { y: 0 });
            if (white) gsap.set(white, { y: h + 12, opacity: 0 });

            if (tlRefs[index]) tlRefs[index].kill();

            const tl = gsap.timeline({ paused: true });

            tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0);

            if (label) {
                tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0);
            }

            if (white) {
                gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
                tl.to(white, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0);
            }

            tlRefs[index] = tl;
        });
    };

    layout();

    window.addEventListener('resize', layout);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(layout).catch(() => { });
    }

    // Hover Events
    pills.forEach((pill, index) => {
        pill.addEventListener('mouseenter', () => {
            const tl = tlRefs[index];
            if (!tl) return;
            if (activeTweenRefs[index]) activeTweenRefs[index].kill();
            activeTweenRefs[index] = tl.tweenTo(tl.duration(), {
                duration: 0.3,
                ease,
                overwrite: 'auto'
            });
        });

        pill.addEventListener('mouseleave', () => {
            const tl = tlRefs[index];
            if (!tl) return;
            if (activeTweenRefs[index]) activeTweenRefs[index].kill();
            activeTweenRefs[index] = tl.tweenTo(0, {
                duration: 0.2,
                ease,
                overwrite: 'auto'
            });
        });
    });

    // Logo Animation
    const logo = document.getElementById('pill-logo');
    if (logo) {
        logo.addEventListener('mouseenter', () => {
            gsap.set(logo, { rotate: 0 });
            gsap.to(logo, {
                rotate: 360,
                duration: 0.2,
                ease,
                overwrite: 'auto'
            });
        });
    }

    // Initial load animation
    const navItemsContainer = document.getElementById('pill-nav-items');
    if (logo) {
        gsap.set(logo, { scale: 0 });
        // Slight delay for visibility
        setTimeout(() => gsap.to(logo, { scale: 1, duration: 0.6, ease }), 100);
    }
    if (navItemsContainer) {
        gsap.set(navItemsContainer, { width: 0, overflow: 'hidden' });
        setTimeout(() => gsap.to(navItemsContainer, { width: 'auto', duration: 0.6, ease }), 100);
    }

    // Mobile Menu
    let isMobileMenuOpen = false;
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenu) {
        gsap.set(mobileMenu, { visibility: 'hidden', opacity: 0, scaleY: 1 });
    }

    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            isMobileMenuOpen = !isMobileMenuOpen;
            const lines = hamburgerBtn.querySelectorAll('.hamburger-line');

            if (isMobileMenuOpen) {
                gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
                gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });

                gsap.set(mobileMenu, { visibility: 'visible' });
                gsap.fromTo(mobileMenu,
                    { opacity: 0, y: 10, scaleY: 1 },
                    { opacity: 1, y: 0, scaleY: 1, duration: 0.3, ease, transformOrigin: 'top center' }
                );
            } else {
                gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
                gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });

                gsap.to(mobileMenu, {
                    opacity: 0, y: 10, scaleY: 1, duration: 0.2, ease, transformOrigin: 'top center',
                    onComplete: () => {
                        gsap.set(mobileMenu, { visibility: 'hidden' });
                    }
                });
            }
        });
    }

    // Close mobile menu on link click
    const mobileLinks = document.querySelectorAll('.mobile-menu-link');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (isMobileMenuOpen) {
                hamburgerBtn.click();
            }
        });
    });
});
