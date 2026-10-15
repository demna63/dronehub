import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream, existsSync } from 'fs';
import { resolve } from 'path';

const BASE_URL = 'https://dronehub.ge';
const OUTPUT = resolve('./public/sitemap.xml');

// 1. სტატიკური გვერდები
const staticPages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/market', changefreq: 'daily', priority: 0.9 },
  { url: '/vlogs', changefreq: 'daily', priority: 0.8 },
  { url: '/tools', changefreq: 'weekly', priority: 0.8 },
  { url: '/tools/fpv-range', changefreq: 'monthly', priority: 0.8 },
  { url: '/tools/stl', changefreq: 'weekly', priority: 0.8 },
  { url: '/tools/battery-calc', changefreq: 'monthly', priority: 0.7 },
  { url: '/tools/channel-tuner', changefreq: 'monthly', priority: 0.7 },
  { url: '/tools/antenna-tuner', changefreq: 'monthly', priority: 0.7 },
  { url: '/tools/fresnel', changefreq: 'monthly', priority: 0.7 },
  { url: '/tools/unlocker', changefreq: 'monthly', priority: 0.7 },
  { url: '/tools/harmonics', changefreq: 'monthly', priority: 0.7 },
  { url: '/tools/zone-check', changefreq: 'monthly', priority: 0.7 },
  { url: '/tools/converter', changefreq: 'monthly', priority: 0.7 },
  { url: '/map', changefreq: 'weekly', priority: 0.8 },
  { url: '/regulations', changefreq: 'monthly', priority: 0.7 },
];

async function generateSitemap() {
  const dynamicPages = [];

  // დინამიკური პოსტების წამოღება (თუ ქსელი ხელმისაწვდომია)
  // ყველა გვერდი nextPageToken-ით — ადრე მხოლოდ პირველი 100 პოსტი ხვდებოდა.
  try {
    const endpoint = 'https://firestore.googleapis.com/v1/projects/dronehubgeorgia-a7bd5/databases/(default)/documents/posts';
    let pageToken = '';
    do {
      const url = `${endpoint}?pageSize=300&mask.fieldPaths=title&mask.fieldPaths=content&mask.fieldPaths=image${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Firestore ${res.status}`);
      const data = await res.json();
      for (const doc of data.documents ?? []) {
        const id = doc.name.split('/').pop();
        // A document with neither title nor content is not a post (e.g. the
        // rating fields left behind by a deleted one); the app 404s on it.
        const hasText = Boolean(doc.fields?.title?.stringValue?.trim() || doc.fields?.content?.stringValue?.trim());
        if (id && hasText) {
          // <image:image> lets Google Images attribute the post's picture to its page.
          const image = doc.fields?.image?.stringValue ?? '';
          dynamicPages.push({
            url: `/post/${id}`,
            changefreq: 'weekly',
            priority: 0.6,
            lastmod: doc.updateTime,
            ...(image.startsWith('https://') ? { img: [{ url: image }] } : {}),
          });
        }
      }
      pageToken = data.nextPageToken ?? '';
    } while (pageToken);
  } catch (err) {
    // ოფლაინ ბილდისას არსებულ sitemap-ს არ ვეხებით: პოსტების გარეშე
    // გადაწერა Google-ს ყველა პოსტის URL-ს დაუკარგავდა.
    if (existsSync(OUTPUT)) {
      console.warn(`⚠️ პოსტები ვერ წამოვიღე (${err.message}) — public/sitemap.xml უცვლელი დარჩა.`);
      return;
    }
  }

  const allPages = [...staticPages, ...dynamicPages];

  const sitemapStream = new SitemapStream({ hostname: BASE_URL });
  const writeStream = createWriteStream(OUTPUT);

  sitemapStream.pipe(writeStream);

  allPages.forEach(page => sitemapStream.write(page));
  sitemapStream.end();

  await streamToPromise(sitemapStream);
  console.log(`✅ sitemap.xml წარმატებით შეიქმნა public/ საქაღალდეში (${allPages.length} გვერდი)!`);
}

generateSitemap().catch(console.error);
