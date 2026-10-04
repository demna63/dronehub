import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import { resolve } from 'path';

const BASE_URL = 'https://dronehub.ge';

// 1. სტატიკური გვერდები
const staticPages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/market', changefreq: 'daily', priority: 0.9 },
  { url: '/blogs', changefreq: 'daily', priority: 0.8 },
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
  try {
    const res = await fetch('https://firestore.googleapis.com/v1/projects/dronehubgeorgia-a7bd5/databases/(default)/documents/posts?pageSize=100');
    if (res.ok) {
      const data = await res.json();
      if (data.documents) {
        for (const doc of data.documents) {
          const id = doc.name.split('/').pop();
          if (id) {
            dynamicPages.push({ url: `/post/${id}`, changefreq: 'weekly', priority: 0.6 });
          }
        }
      }
    }
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
