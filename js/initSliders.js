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
            autoplay: false,
            slidesPerView: 'auto',
            centeredSlides: true,
            centeredSlidesBounds: true, // чтобы не “липло” к краям
            slideToClickedSlide: true,
            speed: 500,
            loop: false,
        },

        // Планшет и выше
        640: {
            slidesPerView: 2,
            autoplay: false,
        },

        1024: {
            loop: true,
            slidesPerView: 'auto',
            allowTouchMove: false,
            centeredSlides: false,
            centeredSlidesBounds: false, // чтобы не “липло” к краям
            slideToClickedSlide: false,
            speed: 4000,
            autoplay: {
                delay: 0,
                disableOnInteraction: false,
            },


        }
    }
});

(function () {
    // ==== утилиты
    const qs  = (s, r = document) => r.querySelector(s);
    const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
    const debounce = (fn, ms = 200) => { let t; return (...a)=>{ clearTimeout(t); t = setTimeout(()=>fn(...a), ms); }; };

    // ==== GSAP guard
    const hasGSAP = !!(window.gsap && window.ScrollTrigger);
    if (!hasGSAP) {
    console.warn('[hscroll] GSAP/ScrollTrigger не найдены');
    return;
}
    gsap.registerPlugin(ScrollTrigger);

    // храним созданные триггеры на секцию
    const instances = new Map(); // section -> ScrollTrigger[]

    const killSection = (section) => {
    const list = instances.get(section);
    if (list) {
    list.forEach(st => { try { st.kill(); } catch(_) {} });
    instances.delete(section);
}
    const track = qs('.hscroll__track', section);
    if (track) gsap.set(track, { clearProps: 'transform' });
};

    function setupSection(section) {
    const track = qs('.hscroll__track', section);
    if (!track) return;

    // убьём предыдущие инстансы перед пересозданием
    killSection(section);

    const headerOffset = parseInt(section.dataset.hscrollOffset || '0', 10);
    const start = headerOffset ? `top top+=${headerOffset}` : 'top top';

    const getGap = () => {
    const cs = getComputedStyle(track);
    return parseFloat(cs.columnGap || cs.gap || '0') || 0;
};

    const calcDistance = () => Math.max(0, track.scrollWidth - section.clientWidth);

    // если горизонтального прогона нет — инициализацию не делаем
    if (calcDistance() <= 0) return;

    const created = [];

    // основной горизонтальный прогон: вертикальный скролл → translateX
    const tween = gsap.to(track, {
    x: () => -calcDistance(),
    ease: 'none',
    overwrite: true,
    scrollTrigger: {
    trigger: section,
    start,
    end: () => `+=${calcDistance()}`,   // длина «дорожки» = ширина прогона
    pin: true,
    scrub: 0.6,
    anticipatePin: 0.5,
    invalidateOnRefresh: true
}
});
    created.push(tween.scrollTrigger);

    // опциональный SNAP к карточкам (включается data-hscroll-snap)
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
    // гарантируем, что финальная позиция = 1
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
    created.push(snapTrigger);
}

    // изображения могут менять ширину дорожки — обновляемся по их загрузке
    qsa('img', track).forEach(img => {
    if (!img.complete) img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
});

    instances.set(section, created);
}

    const initAll = () => {
    qsa('[data-hscroll]').forEach(setupSection);
    ScrollTrigger.refresh();
};

    const destroyAll = () => {
    qsa('[data-hscroll]').forEach(killSection);
    ScrollTrigger.refresh();
};

    // ==== boot + обновления
    const boot = () => initAll();
    document.addEventListener('DOMContentLoaded', boot);
    window.addEventListener('load', () => ScrollTrigger.refresh());

    // дебаунсим refresh на ресайзе; calcDistance() пересчитается,
    // потому что он — функция в invalidateOnRefresh/tween.x
    window.addEventListener('resize', debounce(() => {
    // ничего не пересоздаём, просто даём GSAP всё переоценить
    ScrollTrigger.refresh();
}, 200), { passive: true });

    // экспорт — вдруг пригодится вручную пересобрать
    window.HScroll = { initAll, destroyAll, setupSection, killSection };
})();
