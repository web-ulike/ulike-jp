(() => {
  const mobileQuery = window.matchMedia('(max-width: 767px)');
  const initialized = new WeakSet();

  function init(section) {
    if (initialized.has(section)) return;
    const grid = section.querySelector('.blog-2026__grid');
    const mobileNav = section.querySelector('[data-mobile-pagination]');
    if (!grid || !mobileNav) return;
    initialized.add(section);

    const sectionId = section.dataset.blogSection;
    const serverPage = Number(grid.dataset.serverPage) || 1;
    const articleCount = Number(section.dataset.articleCount) || 0;
    const featuredCount = Number(section.dataset.featuredCount) || 0;
    const pageCount = Math.ceil((articleCount + featuredCount) / 4);
    const initialMarkup = grid.innerHTML;
    const initialFeatured = section.querySelector('[data-blog-featured]');
    const cache = new Map([[serverPage, Array.from(grid.children).map(card => card.cloneNode(true))]]);
    let currentPage = 1;
    let requestNumber = 0;

    function mobileUrl(page) {
      const url = new URL(window.location.href);
      url.searchParams.delete('page');
      if (page === 1) url.searchParams.delete('mobile_page');
      else url.searchParams.set('mobile_page', String(page));
      return url;
    }

    function requestedPage() {
      const value = Number(new URL(window.location.href).searchParams.get('mobile_page'));
      return Number.isInteger(value) && value >= 1 ? Math.min(value, pageCount) : 1;
    }

    async function getServerPage(page) {
      if (cache.has(page)) return cache.get(page);
      const url = new URL(window.location.href);
      url.searchParams.delete('mobile_page');
      url.searchParams.set('page', String(page));
      url.searchParams.set('section_id', sectionId);
      const response = await fetch(url, { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Blog articles could not be loaded');
      const html = new DOMParser().parseFromString(await response.text(), 'text/html');
      const remoteSection = html.querySelector('[data-blog-section]');
      const remoteGrid = remoteSection?.querySelector('.blog-2026__grid');
      if (!remoteGrid) throw new Error('Blog article section was missing');
      const cards = Array.from(remoteGrid.children).map(card => card.cloneNode(true));
      cache.set(page, cards);
      if (page === 1 && !initialFeatured) {
        const remoteFeatured = remoteSection.querySelector('[data-blog-featured]');
        if (remoteFeatured) grid.before(remoteFeatured.cloneNode(true));
      }
      return cards;
    }

    function numberLink(page, active) {
      if (active) return `<span aria-current="page">${page}</span>`;
      return `<a href="${mobileUrl(page).pathname + mobileUrl(page).search}" data-mobile-page="${page}" aria-label="${page} ページへ">${page}</a>`;
    }

    function renderNavigation(page) {
      if (pageCount <= 1) {
        mobileNav.hidden = true;
        return;
      }
      const numbers = new Set([1, pageCount, page - 1, page, page + 1]);
      const visible = Array.from(numbers).filter(value => value >= 1 && value <= pageCount).sort((a, b) => a - b);
      let numberMarkup = '';
      let previous = 0;
      for (const number of visible) {
        if (number - previous > 1) numberMarkup += '<span aria-hidden="true">…</span>';
        numberMarkup += numberLink(number, number === page);
        previous = number;
      }
      const prev = page > 1
        ? `<a class="blog-2026__page-direction blog-2026__page-direction--prev" href="${mobileUrl(page - 1).pathname + mobileUrl(page - 1).search}" data-mobile-page="${page - 1}" rel="prev"><img src="${section.dataset.paginationArrow}" alt="" width="5" height="9">前のページ</a>`
        : '';
      const next = page < pageCount
        ? `<a class="blog-2026__page-direction" href="${mobileUrl(page + 1).pathname + mobileUrl(page + 1).search}" data-mobile-page="${page + 1}" rel="next">次のページ<img src="${section.dataset.paginationArrow}" alt="" width="5" height="9"></a>`
        : '';
      mobileNav.innerHTML = `${prev}<div class="blog-2026__page-numbers">${numberMarkup}</div>${next}`;
      mobileNav.hidden = false;
    }

    async function showMobilePage(page, pushHistory = false) {
      if (!mobileQuery.matches || page < 1 || page > pageCount) return;
      const request = ++requestNumber;
      grid.setAttribute('aria-busy', 'true');
      try {
        const firstFeedIndex = page === 1 ? 0 : (page - 1) * 4 - featuredCount;
        const feedCount = page === 1 ? 4 - featuredCount : 4;
        const cards = [];
        for (let index = firstFeedIndex; index < Math.min(firstFeedIndex + feedCount, articleCount); index += 1) {
          const batch = await getServerPage(Math.floor(index / 9) + 1);
          const card = batch[index % 9];
          if (card) cards.push(card.cloneNode(true));
        }
        if (request !== requestNumber) return;
        const featured = section.querySelector('[data-blog-featured]');
        if (featured) featured.hidden = page !== 1;
        grid.replaceChildren(...cards);
        currentPage = page;
        renderNavigation(page);
        if (pushHistory) {
          window.history.pushState({ mobileBlogPage: page }, '', mobileUrl(page));
          section.scrollIntoView({ block: 'start' });
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (request === requestNumber) grid.removeAttribute('aria-busy');
      }
    }

    function restoreDesktop() {
      requestNumber += 1;
      grid.innerHTML = initialMarkup;
      const featured = section.querySelector('[data-blog-featured]');
      if (featured && featured !== initialFeatured) featured.remove();
      if (initialFeatured) initialFeatured.hidden = false;
      mobileNav.hidden = true;
    }

    mobileNav.addEventListener('click', event => {
      const link = event.target.closest('[data-mobile-page]');
      if (!link) return;
      event.preventDefault();
      showMobilePage(Number(link.dataset.mobilePage), true);
    });
    window.addEventListener('popstate', () => {
      if (mobileQuery.matches) showMobilePage(requestedPage());
    });
    mobileQuery.addEventListener('change', () => {
      if (mobileQuery.matches) showMobilePage(requestedPage());
      else restoreDesktop();
    });
    if (mobileQuery.matches) showMobilePage(requestedPage());
  }

  function initAll() {
    document.querySelectorAll('.blog-2026[data-blog-section]').forEach(init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();
  document.addEventListener('shopify:section:load', initAll);
})();
