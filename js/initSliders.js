const swiperMarquee = new Swiper(".marquee", {
    loop: true,
    slidesPerView: 'auto',
    allowTouchMove: false,
    speed: 2000,
    autoplay: {
        delay: 0,
        disableOnInteraction: false,
        pauseOnMouseEnter: false
    },
    breakpoints: {
        0: {
            spaceBetween: 25,
        },

        768: {
            allowTouchMove: false,
            autoplay: {
                delay: 0,
                disableOnInteraction: false,
            },
            loop: true,
            slidesPerView: 'auto',
            spaceBetween: 40,
        }
    }
});

const swiperReviews = new Swiper(".reviews__slider", {
    loop: true,
    slidesPerView: 'auto',
    spaceBetween: 40,
    allowTouchMove: false,
    speed: 4000,
    autoplay: {
        delay: 0,
        disableOnInteraction: false,
    },

    // Pagination (точки) — скрыта по умолчанию, покажется на мобилке
    pagination: {
        el: ".reviews__pagination",
        clickable: true,
    },
    breakpoints: {
        // Мобильные
        0: {
            allowTouchMove: true,     // разрешаем свайп
            autoplay: false,          // отключаем автоплей
            loop: false,              // можно отключить loop чтобы не путал точки
            slidesPerView: 1,      // по вкусу
            spaceBetween: 0,
            speed: 500,
        },

        // Планшет и выше
        768: {
            slidesPerView: 2,
        },

        1024: {
            allowTouchMove: false,
            autoplay: {
                delay: 0,
                disableOnInteraction: false,
            },
            loop: true,
            loopAdditionalSlides: 10,
            slidesPerView: 'auto',
            spaceBetween: 40,
        }
    }
});

(function () {
    // ==== настройки
    const MOBILE_BP = 1024; // <768 → мобайл

    // ==== утилиты
    const qs  = (s, r = document) => r.querySelector(s);
    const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
    const debounce = (fn, ms = 200) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };

    // ==== состояние
    let currentMode = null; // 'desktop' | 'mobile'

    // ==== GSAP
    const instances = new Map(); // section -> [ScrollTrigger]
    const hasGSAP = !!(window.gsap && window.ScrollTrigger);

    const killSection = (section) => {
        const list = instances.get(section);
        if (list) {
            list.forEach(st => st.kill());
            instances.delete(section);
        }
        const track = section.querySelector('.hscroll__track');
        if (track && hasGSAP) gsap.set(track, { clearProps: 'transform' });
    };

    function setupSection(section) {
        if (!hasGSAP) return;
        const track = section.querySelector('.hscroll__track');
        if (!track) return;

        // убьём предыдущую инициализацию этой секции (при refresh/resize)
        killSection(section);

        const headerOffset = parseInt(section.dataset.hscrollOffset || '0', 10);
        const start = headerOffset ? `top top+=${headerOffset}` : 'top top';

        const getGap = () => {
            const cs = getComputedStyle(track);
            return parseFloat(cs.columnGap || cs.gap || '0') || 0;
        };
        const calcDistance = () => Math.max(0, track.scrollWidth - section.clientWidth);

        // если нет горизонта — ничего не делаем
        if (calcDistance() <= 0) return;

        const stList = [];

        // основной tween: вертикальный скролл → transform: translateX
        const tween = gsap.to(track, {
            x: () => -calcDistance(),
            ease: 'none',
            overwrite: true,
            scrollTrigger: {
                trigger: section,
                start,
                end: () => `+=${calcDistance()}`,
                pin: true,
                scrub: 0.6,
                anticipatePin: 0.5,
                invalidateOnRefresh: true
            }
        });
        stList.push(tween.scrollTrigger);

        // опциональный SNAP к карточкам
        if ('hscrollSnap' in section.dataset) {
            const items = track.querySelectorAll('.services__slider-item, [data-hslide]');
            const snapTrigger = ScrollTrigger.create({
                trigger: section,
                start,
                end: () => `+=${calcDistance()}`,
                scrub: true,
                snap: {
                    snapTo: () => {
                        const gap = getGap();
                        const widths = Array.from(items).map(el => el.getBoundingClientRect().width);
                        const totalTrack = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, items.length - 1);
                        const maxShift = Math.max(1, totalTrack - section.clientWidth);
                        let acc = 0;
                        const positions = widths.map(w => {
                            const pos = Math.min(1, Math.max(0, acc / maxShift));
                            acc += w + gap;
                            return pos;
                        });
                        if (positions[positions.length - 1] !== 1) positions.push(1);
                        return positions;
                    },
                    duration: { min: 0.25, max: 0.9 },
                    ease: 'power3.out',
                    delay: 0.05,
                    directional: true,
                    inertia: false
                }
            });
            stList.push(snapTrigger);
        }

        // картинки → refresh
        track.querySelectorAll('img').forEach(img => {
            if (!img.complete) img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
        });

        instances.set(section, stList);
    }

    const initDesktop = () => {
        if (!hasGSAP) {
            console.warn('[hscroll] GSAP/ScrollTrigger не найдены – desktop режим пропущен');
            return;
        }
        gsap.registerPlugin(ScrollTrigger);
        const sections = qsa('[data-hscroll]');
        sections.forEach((s) => {
            // на всякий случай сносим мобильный свайпер, если был
            destroySwiperForSection(s);
            setupSection(s);
        });
        ScrollTrigger.refresh();
    };

    const destroyDesktop = () => {
        qsa('[data-hscroll]').forEach(killSection);
        if (hasGSAP) ScrollTrigger.refresh();
    };

    // ==== Swiper (мобайл)
    const hasSwiper = () => !!window.Swiper;

    const initSwiperForSection = (section) => {
        if (!hasSwiper()) {
            console.warn('[hscroll] Swiper не найден – mobile режим пропущен');
            return;
        }
        const track = qs('.hscroll__track', section);
        if (!track) return;

        // уже инициализирован?
        if (track.swiper && !track.swiper.destroyed) return;

        // подготовим DOM: section — контейнер, track — wrapper, дети — slides
        section.classList.add('swiper');
        track.classList.add('swiper-wrapper');
        qsa(':scope > *', track).forEach((el) => el.classList.add('swiper-slide'));

        const swiper = new Swiper(section, {
            slidesPerView: 'auto',
            spaceBetween: 0,
            breakpoints: {
                768: {
                    slidesPerView: 2,
                },
            },
            pagination: {
                el: ".pagination",
                clickable: true,
            },
        });

        track._swiperRef = swiper;
    };

    const destroySwiperForSection = (section) => {
        const track = qs('.hscroll__track', section);
        if (!track) return;

        // если есть инстанс — снести
        const inst = track._swiperRef || track.swiper;
        if (inst && !inst.destroyed) inst.destroy(true, true);

        // вернуть DOM в исходное состояние
        section.classList.remove('swiper');
        track.classList.remove('swiper-wrapper');
        qsa(':scope > *', track).forEach((el) => el.classList.remove('swiper-slide'));
    };

    const initMobile = () => {
        const sections = qsa('[data-hscroll]');
        sections.forEach((s) => {
            // на всякий — убьём gsap
            killSection(s);
            initSwiperForSection(s);
        });
    };

    const destroyMobile = () => {
        qsa('[data-hscroll]').forEach(destroySwiperForSection);
    };

    // ==== переключатель режима
    const computeMode = () => (window.innerWidth >= MOBILE_BP ? 'desktop' : 'mobile');

    const applyMode = (mode) => {
        if (mode === currentMode) return;
        // сносим предыдущий режим
        if (currentMode === 'desktop') destroyDesktop();
        if (currentMode === 'mobile') destroyMobile();

        // включаем новый
        if (mode === 'desktop') initDesktop();
        if (mode === 'mobile') initMobile();

        currentMode = mode;
    };

    // ==== boot
    const boot = () => applyMode(computeMode());
    document.addEventListener('DOMContentLoaded', boot);
    window.addEventListener('load', () => applyMode(computeMode()));

    // дебаунс, чтобы не дёргать инит слишком часто
    window.addEventListener('resize', debounce(() => applyMode(computeMode()), 200), { passive: true });
})();
