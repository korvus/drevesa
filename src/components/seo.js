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

const CANONICAL_URL = 'https://drevesa.200.org/';
const SHARE_IMAGE_URL = `${CANONICAL_URL}logo512.png`;

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

const Seo = () => {
  const { dictionary = {}, userLanguage = 'en' } = useContext(PinContext);

  useEffect(() => {
    const lang = LOCALE_MAP[userLanguage] || 'en';
    const ogLocale = OG_LOCALE_MAP[userLanguage] || 'en_GB';

    document.documentElement.setAttribute('lang', lang);

    const title = dictionary.seoTitle || 'Drevesa – Ljubljana Tree of the Year Map';
    const description = dictionary.seoDescription || "Interactive map of Ljubljana’s citizen-elected Tree (and Avenue) of the Year since 2019, with stories, sources, and trilingual context.";
    const ogTitle = dictionary.seoOgTitle || title;
    const ogDescription = dictionary.seoOgDescription || description;
    const keywords = dictionary.seoKeywords || 'Ljubljana tree of the year, Drevesa, Ljubljana trees map';
    const imageAlt = dictionary.seoImageAlt || 'Illustration of Ljubljana’s Tree of the Year badge';

    document.title = title;

    upsertMeta('meta[name="description"]', { name: 'description' }, description);
    upsertMeta('meta[name="keywords"]', { name: 'keywords' }, keywords);
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, ogTitle);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, ogDescription);
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, ogLocale);
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, CANONICAL_URL);
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, SHARE_IMAGE_URL);
    upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, imageAlt);

    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, ogTitle);
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, ogDescription);
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, SHARE_IMAGE_URL);
    upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, imageAlt);
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');

    upsertLink('canonical', CANONICAL_URL);
  }, [dictionary, userLanguage]);

  return null;
};

export default Seo;
