document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.count-up');

    const formatValue = (value, decimals, separator) => {
        const options = {
            useGrouping: !!separator,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        };
        const formatted = Intl.NumberFormat('en-US', options).format(value);
        return separator ? formatted.replace(/,/g, separator) : formatted;
    };

    const animateCountUp = (el) => {
        const to = parseFloat(el.dataset.to || 0);
        const from = parseFloat(el.dataset.from || 0);
        const duration = parseFloat(el.dataset.duration || 2) * 1000;
        const separator = el.dataset.separator || '';
        const suffix = el.dataset.suffix || '';

        let decimals = 0;
        if (to.toString().includes('.')) decimals = Math.max(decimals, to.toString().split('.')[1].length);
        if (from.toString().includes('.')) decimals = Math.max(decimals, from.toString().split('.')[1].length);

        let start = null;

        const easeOutExpo = (x) => {
            return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
        };

        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;

            // Calculate percentage of completion
            const rawPercentage = Math.min(progress / duration, 1);

            // Apply easing function
            const easingPercentage = easeOutExpo(rawPercentage);

            // Calculate current value based on easing
            const currentValue = from + (to - from) * easingPercentage;

            el.textContent = formatValue(currentValue, decimals, separator) + suffix;

            if (progress < duration) {
                window.requestAnimationFrame(step);
            } else {
                el.textContent = formatValue(to, decimals, separator) + suffix;
            }
        };

        window.requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCountUp(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
});
