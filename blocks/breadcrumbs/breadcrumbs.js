/*
 * Breadcrumbs: the AEM Block Collection lists Breadcrumbs as a block add-on but
 * no longer ships its code, so this is a small BNTS Commerce Starter build of the
 * same pattern. It builds the trail from the URL path and page titles.
 * Authoring options:
 *   - Empty block: trail is built automatically (Home / folder / page).
 *   - Block with links: those links are used as the trail, in order.
 */
import { getMetadata } from '../../scripts/aem.js';

const titleCase = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

async function titleFor(path) {
  try {
    const resp = await fetch(`${path}.plain.html`);
    if (!resp.ok) throw new Error(resp.status);
    const html = await resp.text();
    const h1 = new DOMParser().parseFromString(html, 'text/html').querySelector('h1');
    if (h1 && h1.textContent.trim()) return h1.textContent.trim();
  } catch { /* fall back to the path segment */ }
  return titleCase(path.split('/').pop());
}

export default async function decorate(block) {
  const authored = [...block.querySelectorAll('a[href]')].map((a) => ({ href: a.getAttribute('href'), label: a.textContent.trim() }));
  let crumbs = authored;
  if (!crumbs.length) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    crumbs = [{ href: '/', label: 'Home' }];
    let path = '';
    for (let i = 0; i < parts.length - 1; i += 1) {
      path += `/${parts[i]}`;
      // eslint-disable-next-line no-await-in-loop
      crumbs.push({ href: path, label: await titleFor(path) });
    }
    const pageTitle = (document.querySelector('main h1')?.textContent || getMetadata('og:title') || document.title).split('|')[0].trim();
    crumbs.push({ href: window.location.pathname, label: pageTitle });
  }
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');
  crumbs.forEach((c, i) => {
    const li = document.createElement('li');
    if (i === crumbs.length - 1) {
      const span = document.createElement('span');
      span.textContent = c.label;
      span.setAttribute('aria-current', 'page');
      li.append(span);
    } else {
      const a = document.createElement('a');
      a.href = c.href;
      a.textContent = c.label;
      li.append(a);
    }
    ol.append(li);
  });
  nav.append(ol);
  block.replaceChildren(nav);
}
