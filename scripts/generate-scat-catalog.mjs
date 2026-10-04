import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawDataPath = path.join(__dirname, '../src/constants/scat_raw.json');
const rawItems = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

// Helper for type translation
function translateType(t) {
  switch (t) {
    case 'Тримач VTX': return 'VTX დამჭერი';
    case 'Тримач антени VTX': return 'VTX ანტენის სამაგრი';
    case 'Ноги': return 'სადესანტო ფეხები';
    case 'Тримач GPS': return 'GPS სამაგრი';
    case 'Тримач антени RX': return 'RX ანტენის სამაგრი';
    case 'Кріплення камери': return 'კამერის სამაგრი';
    case 'Поворотне кріплення камери': return 'კამერის მბრუნავი სამაგრი';
    case 'Тримач FPV детектора': return 'FPV დეტექტორის სამაგრი';
    case 'Інше':
    default: return 'სხვა აქსესუარი';
  }
}

// Helper for frame translation
function translateFrame(f) {
  if (!f || f === 'Неважливо' || f === 'Інша' || f === 'Other / Universal') return 'უნივერსალური';
  if (f === 'Судний день (VT40)' || f === 'Судний день (VT40), Інша') return 'VT40';
  if (f === 'Mark4, Mark4 V2') return 'Mark4 / Mark4 V2';
  return f;
}

// Clean author name
function cleanAuthor(_a) {
  return 'DronehubGe';
}

// Build Georgian title
function buildGeorgianTitle(item) {
  const geoType = translateType(item.type);
  const geoFrame = translateFrame(item.frame);
  const desc = item.desc.replace(/^–\s*/, '').trim();

  // Custom overrides for clean Georgian naming
  if (item.type === 'Тримач VTX') {
    if (desc.includes('W25 H35 D6')) return `VTX დამჭერი უნივერსალური (25x35x6 მმ)`;
    if (desc.includes('W19 H35 D6') && item.vtxMount.includes('41.5')) return `VTX დამჭერი Mark4 V2 / Thor T67 (19x35x6 მმ)`;
    if (desc.includes('W19 H35 D6')) return `VTX დამჭერი Mark4 V2 (19x35x6 მმ)`;
    if (desc.includes('W19 H25 D6')) return `VTX დამჭერი Mark4 (19x25x6 მმ)`;
    if (desc.includes('W32 H20 D6')) return `VTX დამჭერი Apex HD (32x20x6 მმ)`;
    if (desc.includes('W25 H29 D5')) return `VTX დამჭერი XL10 v6 (25x29x5 მმ)`;
    if (desc.includes('W22 H30 D5')) return `VTX დამჭერი VT40 (22x30x5 მმ)`;
    if (desc.includes('W24.5 H24.5 D5')) return `VTX დამჭერი VT40 (24.5x24.5x5 მმ)`;
    if (desc.includes('30.5x30.5 + SMA')) return `VTX დამჭერი 30.5x30.5 + SMA (VT40)`;
    if (desc.includes('Rush Max Solo + SMA')) return `VTX დამჭერი Rush Max Solo + SMA (VT40)`;
    if (desc.includes('Peak/KaraFPV')) return `VTX დამჭერი Peak / KaraFPV კუდზე (F10)`;
    if (desc.includes('tailVTX MAXSOLO')) return `VTX დამჭერი tailVTX MAXSOLO (Mark4)`;
  }

  if (item.type === 'Тримач антени VTX') {
    if (desc.includes('Rush Max Solo')) return `VTX ანტენის სამაგრი Rush Max Solo (VT40)`;
    if (desc.includes('Rush Tank Solo')) return `VTX ანტენის სამაგრი Rush Tank Solo (VT40)`;
    if (desc.includes('SMA W19 H25 D6')) return `VTX ანტენის სამაგრი SMA (Mark4)`;
    if (desc.includes('Caddx Vista')) return `VTX ანტენის სამაგრი Caddx Vista (Apex HD)`;
    if (desc.includes('F10')) return `VTX ანტენის სამაგრი (F10)`;
    if (desc.includes('універсальний на задні стійки')) return `VTX ანტენის უნივერსალური სამაგრი უკანა სვეტებზე (19-32 მმ)`;
    if (desc.includes('і RX')) return `VTX და RX ანტენის კომბინირებული სამაგრი (HGLRC Nblade)`;
    if (desc.includes('назад (long)')) return `VTX ანტენის გრძელი სამაგრი უკანა (Mark4 V2)`;
  }

  if (item.type === 'Ноги') {
    if (desc === '5см') return `სადესანტო ფეხები 5 სმ (Mark4 / V2)`;
    if (desc === '10см') return `სადესანტო ფეხები 10 სმ (Mark4 / V2)`;
    if (desc === '12см') return `სადესანტო ფეხები 12 სმ (Mark4 / V2)`;
    if (desc === '15см') return `სადესანტო ფეხები 15 სმ (Mark4 / V2)`;
    if (desc.includes('короткі демпфери')) return `სადესანტო დემპფერ-ფეხები 5 სმ`;
    if (desc.includes('Mavic 3')) return `სადესანტო ფეხები Mavic 3`;
    if (desc.includes('Autel EVO Max 4T')) return `სადესანტო ფეხები Autel EVO Max 4T`;
    if (item.frame === 'Судний день (VT40)') return `სადესანტო ფეხები VT40`;
    if (desc.includes('DJI Matrice 4T/4E')) return `სადესანტო ფეხები DJI Matrice 4T / 4E`;
  }

  if (item.type === 'Тримач GPS') {
    return `GPS სამაგრი 18x18 მმ (${geoFrame})`;
  }

  if (item.type === 'Тримач антени RX') {
    if (desc.includes('під двигун')) return `RX ანტენის სამაგრი ძრავის ქვეშ (19x19 მმ)`;
    if (desc.includes('універсальний під задні стійки')) return `RX ანტენის უნივერსალური სამაგრი უკანა სვეტებზე (19-32 მმ)`;
    if (desc.includes('на промінь')) return `RX ანტენის სამაგრი სხივზე`;
    if (desc.includes('вертикальної поляриზації')) return `RX ანტენის ვერტიკალური სამაგრი (ELRS)`;
    if (desc.includes('на корпус v1')) return `RX ანტენის სამაგრი კორპუსზე v1`;
    if (desc.includes('на корпус v2')) return `RX ანტენის სამაგრი კორპუსზე v2`;
    if (desc.includes('Вертикальний')) return `RX ანტენის ვერტიკალური ანძა`;
  }

  if (item.type === 'Кріплення камери' || item.type === 'Поворотне кріплення камери') {
    const rot = item.type === 'Поворотне кріплення камери' ? 'მბრუნავი ' : '';
    if (desc.includes('CADDX 384')) return `Caddx 384 თერმოკამერის სამაგრი სხივზე (${geoFrame})`;
    if (desc.includes('на промінь')) return `კამერის სამაგრი სხივზე (${geoFrame})`;
    if (desc.includes('подовжене') || desc.includes('long')) return `კამერის ${rot}სამაგრი დაგრძელებული ${desc.replace(/[^\d]/g, '')} მმ (${geoFrame})`;
    if (desc.includes('мм')) {
      const mm = desc.match(/\d+мм/)?.[0] || desc;
      return `კამერის ${rot}სამაგრი ${mm} (${geoFrame})`;
    }
    return `კამერის ${rot}სამაგრი (${geoFrame})`;
  }

  if (item.type === 'Тримач FPV детектора') {
    return `FPV დეტექტორის სამაგრი — ${desc}`;
  }

  // General fallback
  if (desc) return `${geoType} — ${desc} (${geoFrame})`;
  return `${geoType} (${geoFrame})`;
}

// Build Georgian full description
function buildGeorgianDescription(item) {
  const parts = [];

  // Description / usage context
  if (item.details) {
    let d = item.details;
    if (d.includes('Dec1 (Spot) SMA')) {
      parts.push('შექმნილია Dec1 (Spot) SMA ვერსიისთვის, თუმცა იდეალურად ერგება ყველა VTX-ს 30.5x30.5 ან 20x20 მმ სამაგრებით. RX მიმღების დამჭერი მოყვება ცალკე ფაილად + გადამყვანები მის გარეშე მონტაჟისთვის.');
    } else if (d.includes('Thor T67')) {
      parts.push('მოდელირებულია Thor T67-ისთვის, თუმცა თავსებადია ნებისმიერ VTX-თან 41.5x30.5 ან 20x20 მმ სამაგრის სტანდარტით. RX დამჭერი მოყვება ცალკე ფაილად.');
    } else if (d.includes('AKK TX3000AC')) {
      parts.push('მოდელირებულია AKK TX3000AC ვიდეოგადამცემისთვის, თუმცა ერგება მსგავსი გაბარიტებისა და 30.5x30.5 სამაგრის მქონე VTX-ებს.');
    } else if (d.includes('Rush Max Solo')) {
      parts.push('შექმნილია Rush Max Solo-სთვის, მაგრამ ერგება სხვა მსგავსი ზომის მძლავრ VTX-ებს. ანტენის სამაგრი უნივერსალურია და გათვლილია Aeronetix 1700-2700 ანტენაზე.');
    } else if (d.includes('F10 (відстань між стійками 14 мм)')) {
      parts.push('მოდელი შედგება 2 ნაწილისგან: VTX-ის დამჭერი და ანტენის დამჭერი, რათა ვიბრაციების დროს ანტენამ კონექტორი არ დააზიანოს. ანტენა ფიქსირდება პლასტმასის მომჭერებით (стяжка). შემუშავებულია F10 ჩარჩოსთვის (სვეტებს შორის მანძილი 14 მმ).');
    } else if (d.includes('save a significant amount of space')) {
      parts.push('ზოგავს დიდ ადგილს ჩარჩოს შიგნით და ანტენას მაღლა სწევს უკეთესი რადიოკავშირისა და დაფარვის მისაღწევად.');
    } else if (d.includes('Злив з ворожих ресурсів')) {
      parts.push('პრაქტიკაში გამოცდილი, გამძლე 3D მოდელი.');
    } else if (d.includes('18х18мм')) {
      parts.push('გათვლილია 18x18 მმ ზომის GPS მოდულის (მაგ. BN-180 / BN-220) საიმედო მონტაჟისთვის ჩარჩოს ზედა ფირფიტაზე ხრახნებით.');
    } else if (d.includes('19х19')) {
      parts.push('მაგრდება ძრავის 19x19 მმ სამაგრ ხვრელებზე. მონტაჟდება გამამაგრებელი წიბოებით ქვემოთ.');
    } else if (d.includes('XL101v7')) {
      parts.push('დაპროექტებულია XL10 v6 / v7 ჩარჩოსთვის, თუმცა ერგება სხვა ჩარჩოებსაც სხივის მსგავსი სიგანით. არქივში მოცემულია რამდენიმე ცალკეული დეტალი.');
    } else if (d.includes('Позначка "M" в бік мотору')) {
      parts.push('მონიშვნა "M" მიმართულია ძრავისკენ, "S" — სტეკისკენ. კამერის ფიქსაციისთვის დამატებით საჭიროა სამაგრი რკალი და ორი ხრახნი.');
    } else if (d.includes('два даних елемента, вони повністю симетричні')) {
      parts.push('კამერის დასამაგრებლად საჭიროა დაბეჭდოთ ორი ცალი (მარცხენა და მარჯვენა იდენტური და სიმეტრიულია).');
    } else if (d.includes('TPU 95A') || d.includes('Elastan')) {
      parts.push('ბეჭდვა შესაძლებელია ნებისმიერი პლასტიკით, თუმცა საუკეთესო შედეგს იძლევა მოქნილი TPU 95A ან Elastan.');
    } else if (d.includes('Комерційне використання')) {
      parts.push('ავტორის მიერ შექმნილი ღია მოდელი FPV პილოტების საზოგადოებისთვის.');
    } else if (d.includes('Зверху-знизу суцільних шарів')) {
      parts.push('ზედა და ქვედა მთლიანი ფენები 1 მმ სისქით. რეკომენდებულია ბეჭდვა ჰორიზონტალურ მდგომარეობაში (მწოლიარე).');
    } else if (d.includes('The eye of Bosch')) {
      parts.push('სამეთვალყურეო პუნქტის გატანა ორ ანალოგურ კამერაზე (ან თერმოვიზორზე) 100+ მეტრზე სტანდარტული CAT5 ქსელის კაბელით.');
    } else if (d.includes('прокладка на стек')) {
      parts.push('თხელი საიზოლაციო შუასადები სტეკისთვის (0.8 მმ). იცავს ელექტრონიკას მექანიკური შეხებისგან და ვიბრაციისგან.');
    } else if (d.includes('ПНБ')) {
      parts.push('მარტივი და ეფექტური გზა FPV მუზარადისგან/სათვალიდან და თერმოკამერისგან ღამის ხედვის სისტემის ასაწყობად.');
    } else if (d.includes('підставка для FPV монітора Eachine 7')) {
      parts.push('მოსახერხებელი დასადგამი Eachine 7" და მსგავსი FPV მონიტორებისთვის.');
    } else if (d.includes('кришка для захисту лінзи')) {
      parts.push('კომპლექტში დამატებით შედის ობიექტივის დამცავი ხუფი.');
    } else if (d.includes('адаптер 20х20 -> 25х25')) {
      parts.push('გადამყვანი ფირფიტა 20x20 მმ-დან 25x25 მმ სამონტაჟო ბაზაზე.');
    } else if (d.includes('заглушка порта Type-c')) {
      parts.push('დამცავი ხუფი Type-C პორტისთვის ჭუჭყისა და ტენიანობისგან დასაცავად (რეკომენდებულია TPU).');
    } else if (d.includes('шаблон для пайки')) {
      parts.push('შაბლონი XT90-დან 2x XT60 გადამყვანის ზუსტი და მოხერხებული შედუღებისთვის.');
    } else if (d.includes('корпус для перехідника')) {
      parts.push('დამცავი კორპუსი XT90 - 2x XT60 დენის გადამყვანისთვის.');
    } else if (d.includes('захист пропелерів')) {
      parts.push('პროპელერების დამცავი რგოლები დარტყმებისგან და დაბრკოლებებისგან დასაცავად.');
    } else if (d.includes('Yagi')) {
      parts.push('Yagi ანტენის (12x12 მმ პროფილი) სამაგრი ანძაზე, თავსებადია "კრაბის" ტიპის დამჭერებთან.');
    } else if (d.includes('захист променів F10')) {
      parts.push('F10 ჩარჩოს სხივების დარტყმაგამძლე დამცავი ბამპერები (TPU).');
    } else if (d.includes('фіксатор на щоглу')) {
      parts.push('სამაგრი ანძაზე Air3f T-Bone ანტენის საიმედო ფიქსაციისთვის.');
    } else if (d.trim() && d !== '-') {
      parts.push(d.replace(/<[^>]*>/g, '').trim());
    }
  }

  // 3D Print specification line
  const specs = [];
  if (item.material) specs.push(`მასალა: ${item.material}`);
  if (item.infill) specs.push(`შევსება: ${item.infill}`);
  if (item.walls) specs.push(`კედლები: ${item.walls}`);
  if (item.supports) specs.push(`საყრდენები (Supports): ${item.supports === 'Ні' ? 'არა' : 'კი'}`);
  if (item.vtxMount) specs.push(`სამაგრი ხვრელები: ${item.vtxMount}`);

  if (specs.length > 0) {
    parts.push(`⚙️ რეკომენდებული პარამეტრები: ${specs.join(', ')}.`);
  }

  return parts.join('\n\n') || 'FPV დრონის 3D ბეჭდვის მოდელი.';
}

const catalog = rawItems.map((item, index) => {
  const geoTitle = buildGeorgianTitle(item);
  const geoType = translateType(item.type);
  const geoFrame = translateFrame(item.frame);
  const author = cleanAuthor(item.author);
  const description = buildGeorgianDescription(item);

  return {
    id: `scat-${index + 1}`,
    title: geoTitle,
    type: geoType,
    frame: geoFrame,
    author: author,
    image: item.image || '',
    downloadUrl: item.downloadUrl || item.stlUrl,
    date: '2026-03-15',
    description: description,
    material: item.material || 'PETG',
    walls: item.walls ? Number(item.walls) : undefined,
    infill: item.infill || undefined,
    supports: item.supports === 'Ні' ? 'არა' : (item.supports === 'Так' ? 'კი' : undefined),
    vtxMount: item.vtxMount || undefined
  };
});

console.log(`Generated ${catalog.length} items`);

// Format TS file
const tsContent = `// src/constants/stlCatalogData.ts
// Auto-generated full STL catalog imported from SCAT (vtx.in.ua/scat) with full Georgian descriptions.

export interface ScatStlItem {
  id: string;
  title: string;
  type: string;
  frame: string;
  author: string;
  image: string;
  downloadUrl: string;
  date: string;
  description: string;
  material?: string;
  walls?: number;
  infill?: string;
  supports?: string;
  vtxMount?: string;
}

export const SCAT_STL_CATALOG: ScatStlItem[] = ${JSON.stringify(catalog, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/constants/stlCatalogData.ts'), tsContent);
console.log('Successfully written src/constants/stlCatalogData.ts');
