if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}

window.onbeforeunload = function () {
    window.scrollTo(0, 0);
};

async function loadComponent(id, file) {
    const container = document.getElementById(id);
    if (!container) return;
    try {
        const resp = await fetch(file);
        if (resp.ok) {
            const html = await resp.text();
            container.innerHTML = html;
        }
    } catch (e) {
        console.error(`Failed to load ${file}`, e);
    }
}

function initStickyHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('header--scrolled', window.scrollY > 50);
    }, { passive: true });
}

function initProjects() {
    const ROWS = 2;
    let currentFilter = 'all';
    let currentPage = 0;
    let lockedHeight = 0;

    const grid = document.getElementById('work-grid');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const pageInfo = document.getElementById('work-page-info');
    const filters = document.querySelectorAll('.work-filter');

    if (!grid || !prevBtn || !nextBtn) return;

    const allItems = Array.from(grid.querySelectorAll('.work-grid__item'));

    function getCols() {
        const w = window.innerWidth;
        if (w >= 1024) return 3;
        if (w >= 600) return 2;
        return 1;
    }

    function getPerPage() {
        return getCols() * ROWS;
    }

    function getFiltered() {
        if (currentFilter === 'all') return allItems;
        return allItems.filter(item => item.dataset.category === currentFilter);
    }

    function getTotalPages() {
        return Math.max(1, Math.ceil(getFiltered().length / getPerPage()));
    }

    function clearPlaceholders() {
        grid.querySelectorAll('.work-grid__empty').forEach(el => el.remove());
    }

    function addPlaceholders(count) {
        for (let i = 0; i < count; i++) {
            const empty = document.createElement('div');
            empty.className = 'work-grid__item work-grid__empty';
            empty.innerHTML = '<div class="work-card work-card--empty"><div class="empty-visual"></div><div class="empty-content"></div></div>';
            grid.appendChild(empty);
        }
    }

    function measureAndLock() {
        grid.style.minHeight = '';
        clearPlaceholders();
        const perPage = getPerPage();
        allItems.forEach(item => {
            item.classList.add('work-grid__item--hidden');
            item.classList.remove('work-grid__item--fade');
        });
        allItems.slice(0, perPage).forEach(item => {
            item.classList.remove('work-grid__item--hidden');
        });
        lockedHeight = grid.offsetHeight;
        grid.style.minHeight = lockedHeight + 'px';
    }

    function render() {
        const perPage = getPerPage();
        const filtered = getFiltered();
        const totalPages = getTotalPages();

        if (currentPage >= totalPages) currentPage = totalPages - 1;
        if (currentPage < 0) currentPage = 0;

        clearPlaceholders();
        allItems.forEach(item => {
            item.classList.add('work-grid__item--hidden');
            item.classList.remove('work-grid__item--fade');
        });

        const start = currentPage * perPage;
        const toShow = filtered.slice(start, start + perPage);
        toShow.forEach((item, i) => {
            item.classList.remove('work-grid__item--hidden');
            item.classList.add('work-grid__item--fade');
            setTimeout(() => item.classList.remove('work-grid__item--fade'), i * 50);
        });

        const emptySlots = perPage - toShow.length;
        if (emptySlots > 0) addPlaceholders(emptySlots);

        pageInfo.textContent = (currentPage + 1) + ' / ' + totalPages;
        prevBtn.classList.toggle('work-pagination__btn--disabled', currentPage === 0);
        nextBtn.classList.toggle('work-pagination__btn--disabled', currentPage >= totalPages - 1);
    }

    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(b => b.classList.remove('work-filter--active'));
            btn.classList.add('work-filter--active');
            currentFilter = btn.dataset.filter;
            currentPage = 0;
            render();
        });
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 0) { currentPage--; render(); }
    });
    nextBtn.addEventListener('click', () => {
        if (currentPage < getTotalPages() - 1) { currentPage++; render(); }
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            measureAndLock();
            render();
        }, 150);
    });

    measureAndLock();
    render();
}

document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([
        loadComponent('header-container', './header.html'),
        loadComponent('projects-container', './projects.html'),
        loadComponent('acerca-container', './acerca.html'),
        loadComponent('footer-container', './footer.html')
    ]);
    initStickyHeader();
    initProjects();

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetStr = link.getAttribute('href');
            if (targetStr === '#') return;
            const effectiveTarget = targetStr === '#about' ? '#acerca' : targetStr;
            const target = document.querySelector(effectiveTarget);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});
