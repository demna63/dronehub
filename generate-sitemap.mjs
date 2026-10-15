import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import { resolve } from 'path';

const BASE_URL = 'https://dronehub.ge';

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
  // Paged: a single pageSize=100 request silently dropped every post past the
  // 100th. `mask.fieldPaths=__name__` returns ids only.
  const POSTS_URL = 'https://firestore.googleapis.com/v1/projects/dronehubgeorgia-a7bd5/databases/(default)/documents/posts?pageSize=300&mask.fieldPaths=__name__';
  try {
    let pageToken = '';
    do {
      const res = await fetch(pageToken ? `${POSTS_URL}&pageToken=${encodeURIComponent(pageToken)}` : POSTS_URL);
      if (!res.ok) break;
      const data = await res.json();
      for (const doc of data.documents ?? []) {
        const id = doc.name.split('/').pop();
        if (id) {
          dynamicPages.push({ url: `/post/${id}`, changefreq: 'weekly', priority: 0.6 });
        }
      }
      pageToken = data.nextPageToken ?? '';
    } while (pageToken);
  } catch (_err) {
    // მშვიდი fallback ოფლაინ ბილდის დროს
  }

  const allPages = [...staticPages, ...dynamicPages];

  const sitemapStream = new SitemapStream({ hostname: BASE_URL });
  const writeStream = createWriteStream(resolve('./public/sitemap.xml'));

  sitemapStream.pipe(writeStream);

  allPages.forEach(page => sitemapStream.write(page));
  sitemapStream.end();

  await streamToPromise(sitemapStream);
  console.log(`✅ sitemap.xml წარმატებით შეიქმნა public/ საქაღალდეში (${allPages.length} გვერდი)!`);
}

generateSitemap().catch(console.error);
