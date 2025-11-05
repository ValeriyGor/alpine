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