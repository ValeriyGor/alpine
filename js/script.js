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
    if (window.scrollY > 150) {
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