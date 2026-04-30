import { useContext, useEffect } from 'react';
import { PinContext } from '../store';

const LOCALE_MAP = {
  en: 'en',
  fr: 'fr',
  sl: 'sl'
};

const OG_LOCALE_MAP = {
  en: 'en_GB',
  fr: 'fr_FR',
  sl: 'sl_SI'
};

const CANONICAL_BASE_URL = 'https://drevesa.200.work';
const SHARE_IMAGE_URL = `${CANONICAL_BASE_URL}/preview.png`;
const SHARE_IMAGE_WIDTH = '1200';
const SHARE_IMAGE_HEIGHT = '630';

function getLocalizedUrl(language) {
  return `${CANONICAL_BASE_URL}/${language}`;
}

function upsertMeta(selector, attributes, content) {
  if (!content) return;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let link = document.head.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function upsertAlternateLink(hreflang, href) {
  let link = document.head.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function upsertJsonLd(content) {
  let script = document.head.querySelector('script[data-drevesa-schema="website"]');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-drevesa-schema', 'website');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(content);
}

const Seo = () => {
  const { dictionary = {}, userLanguage = 'en' } = useContext(PinContext);

  useEffect(() => {
    const lang = LOCALE_MAP[userLanguage] || 'en';
    const ogLocale = OG_LOCALE_MAP[userLanguage] || 'en_GB';
    const localizedUrl = getLocalizedUrl(userLanguage);
    const is404Page = window.location.pathname.includes('404');

    document.documentElement.setAttribute('lang', lang);

    const title = is404Page
      ? '404 | Drevesa'
      : (dictionary.seoTitle || 'Drevesa - Ljubljana Tree of the Year Map');
    const description = dictionary.seoDescription || "Interactive map of Ljubljana's citizen-elected Tree and Avenue of the Year since 2019, with stories, sources, and trilingual context.";
    const ogTitle = dictionary.seoOgTitle || title;
    const ogDescription = dictionary.seoOgDescription || description;
    const keywords = dictionary.seoKeywords || 'Ljubljana tree of the year, Drevesa, Ljubljana trees map';
    const imageAlt = dictionary.seoImageAlt || "Illustration of Ljubljana's Tree of the Year badge";
    const websiteName = 'Drevesa';
    const noscriptContent = userLanguage === 'fr'
      ? 'Vous devez activer JavaScript pour utiliser cette application.'
      : userLanguage === 'sl'
        ? 'Za uporabo te aplikacije morate omogočiti JavaScript.'
        : 'You need to enable JavaScript to run this app.';

    document.title = title;

    const noscriptElement = document.body.querySelector('noscript');
    if (noscriptElement) {
      noscriptElement.textContent = noscriptContent;
    }

    upsertMeta('meta[name="description"]', { name: 'description' }, description);
    upsertMeta('meta[name="keywords"]', { name: 'keywords' }, keywords);
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, ogTitle);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, ogDescription);
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, ogLocale);
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, localizedUrl);
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, websiteName);
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, SHARE_IMAGE_URL);
    upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width' }, SHARE_IMAGE_WIDTH);
    upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height' }, SHARE_IMAGE_HEIGHT);
    upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, imageAlt);

    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, ogTitle);
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, ogDescription);
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, SHARE_IMAGE_URL);
    upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, imageAlt);
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');

    upsertLink('canonical', localizedUrl);
    upsertAlternateLink('fr', getLocalizedUrl('fr'));
    upsertAlternateLink('en', getLocalizedUrl('en'));
    upsertAlternateLink('sl', getLocalizedUrl('sl'));
    upsertAlternateLink('x-default', getLocalizedUrl('fr'));

    upsertJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: websiteName,
      url: localizedUrl,
      description,
      inLanguage: [lang],
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://www.google.com/search?q=Drevesa+{search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    });
  }, [dictionary, userLanguage]);

  return null;
};

export default Seo;
