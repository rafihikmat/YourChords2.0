import { useState, useEffect } from 'react';

export const useAutoScroll = () => {
    const [isAutoScrolling, setIsAutoScrolling] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(1.0);

    useEffect(() => {
        if (!isAutoScrolling) return;
        let lastTime = 0;
        let rafId: number;

        const loop = (time: number) => {
            if (!lastTime) lastTime = time;
            const delta = time - lastTime;
            if (delta > 0) {
                window.scrollBy(0, (20 * scrollSpeed * delta) / 1000);
                lastTime = time;
            }
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) setIsAutoScrolling(false);
            else rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, [isAutoScrolling, scrollSpeed]);

    return { isAutoScrolling, setIsAutoScrolling, scrollSpeed, setScrollSpeed };
};
