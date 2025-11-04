(function () {
    const DESKTOP_QUERY = '(pointer: fine) and (hover: hover)';
    gsap.registerPlugin(ScrollTrigger);

    // хранит созданные триггеры по секции, чтобы корректно их убивать/пересоздавать
    const instances = new Map();

    function killSection(section) {
        const list = instances.get(section);
        if (list) {
            list.forEach(st => st.kill());
            instances.delete(section);
        }
        const track = section.querySelector('.hscroll__track');
        if (track) gsap.set(track, { clearProps: 'transform' });
    }

    function setupSection(section) {
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

        // если картинки грузятся после инициализации — освежим расчёты
        track.querySelectorAll('img').forEach(img => {
            if (!img.complete) img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
        });

        instances.set(section, stList);
    }

    function initAll() {
        const isDesktop = window.innerWidth >= 768;
        const sections = document.querySelectorAll('[data-hscroll]');
        if (!isDesktop) {
            sections.forEach(killSection);
            ScrollTrigger.refresh();
            return;
        }
        sections.forEach(setupSection);
        ScrollTrigger.refresh();
    }

    // Инициализация
    window.addEventListener('load', initAll);
    // Пересчёт при ресайзе/смене макета
    window.addEventListener('resize', () => ScrollTrigger.refresh());
    // Автопереключение при смене типа указателя (например, эмуляторы)
    const mql = matchMedia(DESKTOP_QUERY);
    mql.addEventListener('change', initAll);
})();

const swiper = new Swiper(".marquee", {
    loop: true,
    loopAdditionalSlides: 10,
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
            loopAdditionalSlides: 10,
        },

        768: {
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

const swiper2 = new Swiper(".reviews__slider", {
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


document.addEventListener("DOMContentLoaded", () => {
    const items = document.querySelectorAll(".accordion__item");

    // 👉 Открываем первый пункт по умолчанию
    if (items.length > 0) {
        const first = items[0];
        first.classList.add("active");
        const firstContent = first.querySelector("p");
        firstContent.style.maxHeight = firstContent.scrollHeight + "px";
    }

    items.forEach((item) => {
        const header = item.querySelector("h4");

        header.addEventListener("click", () => {
            const content = item.querySelector("p");
            const isOpen = item.classList.contains("active");

            // Закрываем все, кроме текущего
            items.forEach((i) => {
                if (i !== item) {
                    i.classList.remove("active");
                    const p = i.querySelector("p");
                    p.style.maxHeight = null;
                }
            });

            // Переключаем текущий
            if (!isOpen) {
                item.classList.add("active");
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                item.classList.remove("active");
                content.style.maxHeight = null;
            }
        });
    });
});

document.addEventListener("scroll", () => {
    const header = document.querySelector(".top-menu");
    if (window.scrollY > 50) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});


/// Mobile menu

const burger = document.querySelector('.mobile-burger');
const mobileMenu = document.querySelector('.mobile-menu');
const closeBtn = document.querySelector('.close-menu');

burger.addEventListener('click', () => {
    mobileMenu.classList.add('is-open');
    document.body.classList.add('body-lock');
});

closeBtn.addEventListener('click', () => {
    mobileMenu.classList.remove('is-open');
    document.body.classList.remove('body-lock');
});

mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('is-open');
        document.body.classList.remove('body-lock');
    });
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');

        // если href просто "#", ничего не делаем
        if (targetId.length < 2) return;

        e.preventDefault();
        const targetEl = document.querySelector(targetId);
        if (!targetEl) return;

        // Плавный скролл
        targetEl.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        // Закрываем меню, если оно открыто
        const mobileMenu = document.querySelector('.mobile-menu');
        if (mobileMenu.classList.contains('is-open')) {
            mobileMenu.classList.remove('is-open');
            document.body.classList.remove('body-lock');
        }
    });
});

// modal

(() => {
    const OPEN_ATTR = 'data-cf-open';
    const CLOSE_ATTR = 'data-cf-close';

    let lockScrollTop = 0;
    let lastFocused = null;

    // helpers
    const lockBody = () => {
        lockScrollTop = window.scrollY || document.documentElement.scrollTop;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${lockScrollTop}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
    };
    const unlockBody = () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, lockScrollTop);
    };

    const byId = (id) => document.getElementById(`cf-modal-${id}`);

    const openModal = (id) => {
        const modal = byId(id);
        if (!modal) return;
        if (modal.getAttribute('aria-hidden') === 'false') return;

        lastFocused = document.activeElement;
        modal.setAttribute('aria-hidden', 'false');
        // lockBody();

        // автофокус на первом инпуте
        const firstInput = modal.querySelector('input,button,select,textarea,[tabindex]:not([tabindex="-1"])');
        firstInput?.focus();

        document.addEventListener('keydown', escClose);
    };

    const closeModal = (modal) => {
        if (!modal) return;
        modal.setAttribute('aria-hidden', 'true');
        // unlockBody();
        document.removeEventListener('keydown', escClose);
        lastFocused?.focus?.();
    };

    const escClose = (e) => {
        if (e.key === 'Escape') {
            const opened = document.querySelector('.cf-modal[aria-hidden="false"]');
            if (opened) closeModal(opened);
        }
    };

    // делегирование кликов
    document.addEventListener('click', (e) => {
        const openBtn = e.target.closest(`[${OPEN_ATTR}]`);
        if (openBtn) {
            e.preventDefault();
            const id = openBtn.getAttribute(OPEN_ATTR);
            openModal(id);
            return;
        }

        const closeBtn = e.target.closest(`[${CLOSE_ATTR}]`);
        if (closeBtn) {
            const modal = closeBtn.closest('.cf-modal');
            closeModal(modal);
            return;
        }

        // клик по «фону»
        const overlay = e.target.classList?.contains('cf-modal__overlay') ? e.target : null;
        if (overlay) {
            const modal = overlay.closest('.cf-modal');
            closeModal(modal);
        }
    });

    // закрытие по сабмиту (по желанию)
    document.addEventListener('submit', (e) => {
        const form = e.target.closest('[data-cf-form]');
        if (!form) return;

        // здесь оставь реальный submit/ajax.
        // пока — просто не перезагружаем и закрываем.
        e.preventDefault();

        const modal = form.closest('.cf-modal');
        // TODO: сюда можно вставить AJAX отправку и по успеху закрывать:
        // fetch(...).then(() => closeModal(modal))
        closeModal(modal);
    });
})();