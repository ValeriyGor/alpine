// modal + Swiper(data-images)
(() => {
    const OPEN_ATTR = 'data-cf-open';
    const CLOSE_ATTR = 'data-cf-close';
    const SUCCESS_TEXT = 'Заявка відправлена'; // ★

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
    const qs = (s, r = document) => r.querySelector(s);
    const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

    // ---------- Swiper-in-modal ----------
    function buildSwiperMarkup(container, images) {
    container.innerHTML = `
      <div class="swiper modal-swiper">
        <div class="swiper-wrapper">
          ${images.map(src => `
            <div class="swiper-slide">
              <img src="${src}" alt="" loading="lazy">
            </div>
          `).join('')}
        </div>
        <div class="swiper-pagination"></div>
        <div class="swiper-button-prev" aria-label="Prev"></div>
        <div class="swiper-button-next" aria-label="Next"></div>
      </div>
    `;
}

    function initModalSwiper(modal) {
    const host = qs('.cf-modal__slider', modal);
    if (!host) return;
    if (!window.Swiper) {
    console.warn('[modal] Swiper не найден — инициализация пропущена');
    return;
}
    // уже инициализирован?
    if (host._swiperInstance && !host._swiperInstance.destroyed) {
    host._swiperInstance.update();
    return;
}

    // берём список картинок из data-images
    let images = [];
    const raw = host.getAttribute('data-images');
    if (raw) {
    try { images = JSON.parse(raw); } catch (_e) {}
}

    // если разметки .swiper ещё нет — построим её
    let container = qs('.swiper', host);
    if (!container) {
    if (!images.length) {
    // нечего инициализировать (оставим пусто, чтобы модалка могла использоваться под другой контент)
    return;
}
    buildSwiperMarkup(host, images);
    container = qs('.swiper', host);
}

    // инициализируем ПОСЛЕ того как модалка стала видима (двойной rAF)
    requestAnimationFrame(() => {
    requestAnimationFrame(() => {
    const inst = new Swiper(container, {
    slidesPerView: 1,
    loop: true,
    spaceBetween: 16,
    lazy: true,
    watchSlidesProgress: true,

    // ВНИМАНИЕ — Заменяем элементы навигации на внешние
    pagination: {
    el: qs('.modal-slider-pagination', modal),
    clickable: true,
},
    navigation: {
    nextEl: qs('.modal-slider-next', modal),
    prevEl: qs('.modal-slider-prev', modal),
},

    observer: true,
    observeParents: true,
    updateOnWindowResize: true,
});

    host._swiperInstance = inst;
});
});
}

    function destroyModalSwiper(modal) {
    const host = qs('.cf-modal__slider', modal);
    if (!host) return;
    const inst = host._swiperInstance || qs('.swiper', host)?.swiper;
    if (inst && !inst.destroyed) inst.destroy(true, true);
    // при желании можно очищать разметку:
    // host.innerHTML = '';
}
    // -------------------------------------

    // ★ UI-helpers для формы
    function resetFormUI(form) {
    // убрать сообщение успеха, если было
    const msg = qs('.cf-form__success', form);
    if (msg) msg.remove();
    // показать кнопку отправки обратно
    const submit = form.querySelector('[type="submit"], button:not([type]), [data-submit]');
    if (submit) {
    submit.disabled = false;
    submit.style.display = submit._origDisplay || '';
}
}

    function showSuccess(form, text = SUCCESS_TEXT) {
    const submit = form.querySelector('[type="submit"], button:not([type]), [data-submit]');
    if (submit) {
    if (!submit._origDisplay) submit._origDisplay = getComputedStyle(submit).display || '';
    submit.style.display = 'none';
}
    let msg = document.createElement('div');
    msg.className = 'cf-form__success btn success-btn btn--small';
    msg.setAttribute('role', 'status');
    msg.textContent = text;
    if (submit && submit.parentNode) {
    submit.parentNode.insertBefore(msg, submit.nextSibling);
} else {
    form.appendChild(msg);
}
}

    const openModal = (id) => {
    const modal = byId(id);
    if (!modal) return;
    if (modal.getAttribute('aria-hidden') === 'false') return;

    lastFocused = document.activeElement;
    modal.setAttribute('aria-hidden', 'false');
    // lockBody();

    // ИНИЦИАЛИЗАЦИЯ СЛАЙДЕРА ПОСЛЕ ОТКРЫТИЯ
    initModalSwiper(modal);

    // ★ На открытие — сбрасываем UI всех форм в модалке
    qsa('[data-cf-form]', modal).forEach(resetFormUI); // ★

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

    // При закрытии можно освобождать ресурсы (по желанию)
    // destroyModalSwiper(modal);

    // ★ При закрытии — вернуть формы в исходный вид
    qsa('[data-cf-form]', modal).forEach(resetFormUI); // ★
};

    const escClose = (e) => {
    if (e.key === 'Escape') {
    const opened = document.querySelector('.cf-modal[aria-hidden="false"]');
    if (opened) closeModal(opened);
}
};

    // делегирование кликов
    document.addEventListener('click', (e) => {
    const openBtn = e.target.closest?.(`[${OPEN_ATTR}]`);
    if (openBtn) {
    e.preventDefault();
    const id = openBtn.getAttribute(OPEN_ATTR);
    openModal(id);
    return;
}

    const closeBtn = e.target.closest?.(`[${CLOSE_ATTR}]`);
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

    // закрытие/обработка по сабмиту
    document.addEventListener('submit', async (e) => {
    const form = e.target.closest?.('[data-cf-form]');
    if (!form) return;

    e.preventDefault();

    // здесь можно отправить данные на бэк
    // const formData = new FormData(form);
    // await fetch('/api/lead', { method: 'POST', body: formData });

    // ★ Очищаем поля формы
    form.reset(); // ★

    // ★ Показываем сообщение успеха вместо кнопки
    showSuccess(form); // ★

    const modal = form.closest('.cf-modal');
    setTimeout(() => closeModal(modal), 1200);
});
})();
