/**
 * Copy for the regulations guide.
 *
 * Georgian items repeat only what https://gcaa.ge/faq/uavs/ publishes.
 * Class cards follow the EASA Open category in force since 1 January 2024
 * (EU 2019/947 and 2019/945). Georgia is not an EASA member state, so a
 * European registration or certificate does not replace the Georgian one.
 * Checked against those public pages on 2026-10-01. Not legal advice.
 */
import type { Language } from '../utils/translations';

export interface Copy {
  ka: string;
  en: string;
}

export const regText = (copy: Copy, language: Language): string => copy[language];

export interface RegLink {
  href: string;
  label: string;
}

export interface RegFact {
  id: string;
  title: Copy;
  body: Copy;
  links?: RegLink[];
}

export interface ClassRow {
  id: string;
  label: Copy;
  value: Copy;
}

export interface ClassCard {
  id: string;
  chip: Copy;
  title: Copy;
  rows: ClassRow[];
}

const row = (
  id: string,
  label: Copy,
  ka: string,
  en: string,
): ClassRow => ({ id, label, value: { ka, en } });

const sub = { ka: 'ქვეკატეგორია', en: 'Subcategory' };
const people = { ka: 'ხალხი', en: 'People' };
const height = { ka: 'სიმაღლე', en: 'Height' };
const registration = { ka: 'რეგისტრაცია EASA-ში', en: 'EASA registration' };
const training = { ka: 'მომზადება EASA-ში', en: 'EASA training' };
const age = { ka: 'მინიმალური ასაკი EASA-ში', en: 'EASA minimum age' };
const remote = { ka: 'Remote ID (EASA)', en: 'Remote ID (EASA)' };
const georgia = { ka: 'საქართველოში', en: 'In Georgia' };

const noRemote =
  {
    ka: 'C1, C2 და C3-ის სიაში არ შედის. პირდაპირ Remote ID-ს EASA ამ ნიშანს არ უწერს.',
    en: 'Not in the C1, C2 and C3 list. EASA does not state direct Remote ID as a requirement for this class.',
  };

const georgiaLight =
  {
    ka: 'მასა 250 გრამზე ნაკლებია, ამიტომ კომპეტენციის ტესტი არ გჭირდებათ. კამერა ან პერსონალური მონაცემის სენსორი თუ აქვს, რეგისტრაცია მაინც გჭირდებათ — GCAA სათამაშოს გამონაკლისს რეგისტრაციაზე არ წერს. ასაკი საქართველოში 16 წელია, ან ნაკლები, თუ დრონი სათამაშოა ან უფროსი გადევნებთ თვალს.',
    en: 'The mass is under 250 g, so the competency test is not required. A camera or a sensor that can capture personal data still requires registration — the GCAA FAQ states no toy exception for registration. In Georgia the minimum age is 16, or younger if the drone is a toy or an adult supervises.',
  };

export const REG_INTRO: Copy = {
  ka: 'ეს გზამკვლევია და იურიდიული დასკვნა არ არის. საქართველო EASA-ს წევრი არ არის. პირველი სია სამოქალაქო ავიაციის სააგენტოს კითხვა-პასუხს მიჰყვება და სწორედ ის მოქმედებს აქ ფრენისას. კლასების ცხრილი ევროპის ღია კატეგორიაა 2024 წლის 1 იანვრიდან. ევროპული რეგისტრაცია და სერტიფიკატი საქართველოში არ მოქმედებს, ქართული კი ევროპაში.',
  en: 'This is a guide, not a legal opinion. Georgia is not an EASA member state. The first list follows the Civil Aviation Agency FAQ and is the one that applies when you fly here. The class table is the European Open category as in force since 1 January 2024. A European registration or certificate does not work in Georgia, and a Georgian one does not work in Europe.',
};

export const REG_STEPS_TITLE: Copy = {
  ka: 'ფრენამდე, ხუთი რამ',
  en: 'Five things before you fly',
};

export const REG_STEPS: { id: string; body: Copy }[] = [
  {
    id: 'register',
    body: {
      ka: 'აწონეთ დრონი. თუ მაქსიმალური ასაფრენი მასა 250 გრამია ან მეტი, ან აქვს კამერა თუ სხვა სენსორი, რომელიც პერსონალურ მონაცემს იწერს — დარეგისტრირდით uas.gov.ge-ზე და ნომერი კორპუსზე ან ელემენტის ნაკვეთურში წარუშლელად დაიტანეთ. 250 გრამზე ნაკლებს, ასეთი სენსორის გარეშე, რეგისტრაცია არ სჭირდება.',
      en: 'Weigh the drone. Register at uas.gov.ge if the maximum take-off mass is 250 g or more, or if it has a camera or another sensor that can capture personal data, and mark the operator number on the body or in the battery bay so it stays readable. Under 250 g with no such sensor, registration is not required.',
    },
  },
  {
    id: 'exam',
    body: {
      ka: 'კომპეტენციის ტესტი საჭიროა მხოლოდ მაშინ, როცა მასა 250 გრამზე მეტია. ზუსტად 250 გრამს ტესტი არ სჭირდება, რეგისტრაცია კი სჭირდება. ქართული სერტიფიკატი მხოლოდ საქართველოში მოქმედებს.',
      en: 'The competency test is required only when the mass is over 250 g. A drone of exactly 250 g needs registration and does not need the test. A Georgian certificate is valid only in Georgia.',
    },
  },
  {
    id: 'height',
    body: {
      ka: 'ღია კატეგორიაში ჭერი 120 მეტრია მიწის ზედაპირიდან. რეკრეაციული ფრენა ამ პირობებში ცალკე ნებართვის გარეშე შეიძლება. 120 მეტრზე მაღლა, აგროსამუშაო (დამტვერვა, შეწამვლა, დაკიდებული ტვირთი) და შენობის ფასადის წმენდა-რეცხვა სააგენტოს ნებართვას მოითხოვს.',
      en: 'In the Open category the ceiling is 120 m above the surface. Recreational flying is allowed without a separate permit when the Open conditions are met. Above 120 m, agricultural work (dusting, spraying, a suspended load) and washing a building facade need an Agency permit.',
    },
  },
  {
    id: 'zones',
    body: {
      ka: 'აეროპორტთან ახლოს ჯერ აეროდრომის ოპერატორს შეუთანხმდით. სააგენტოს მაგალითით, 249 გრამიანი დაბალი ფრენაც კი ამ შეთანხმებას მოითხოვს, თუ აეროპორტის ზონაა. აკრძალული და შეზღუდული ზონები მთავრობის 2018 წლის 28 დეკემბრის №660 დადგენილებაშია. ფრენამდე ნახეთ მოქმედი NOTAM-იც.',
      en: 'Near an airport, agree the flight with the aerodrome operator first. The Agency’s own example: a 249 g drone flown low still needs that agreement inside an airport area. Restricted and prohibited zones are set by Government Decree No. 660 of 28 December 2018. Check the current NOTAM before you fly.',
    },
  },
  {
    id: 'people',
    body: {
      ka: 'კერძო ტერიტორიის გადაღებას და იქ ფრენას მესაკუთრის წინასწარი თანხმობა სჭირდება, ღია კატეგორიის წესებთან და პერსონალური მონაცემების დაცვასთან ერთად. პილოტი სულ ცოტა 16 წლის უნდა იყოს, თუ დრონი სათამაშო არ არის ან უფროსი არ ადევნებს თვალს. ღამით დრონს წითელი და მწვანე ციმციმა მაშუქი სჭირდება.',
      en: 'Filming or flying over private land needs the owner’s consent in advance, together with the Open-category rules and the privacy rules. The pilot must be at least 16, unless the drone is a toy or an adult supervises. At night the drone needs a red and a green flashing light.',
    },
  },
];

export const REG_GEORGIA_TITLE: Copy = {
  ka: 'საქართველოში რა მოქმედებს',
  en: 'What applies in Georgia',
};

export const REG_GEORGIA_LEAD: Copy = {
  ka: 'ყველა პუნქტი ქვემოთ სამოქალაქო ავიაციის სააგენტოს საჯარო კითხვა-პასუხიდანაა. სადაც FAQ დუმს, ეს გვერდიც დუმს.',
  en: 'Every point below is from the Civil Aviation Agency’s public FAQ. Where that FAQ is silent, this page is silent too.',
};

export const REG_GEORGIA: RegFact[] = [
  {
    id: 'registration',
    title: { ka: 'რეგისტრაცია', en: 'Registration' },
    body: {
      ka: 'ოპერატორის რეგისტრაცია სავალდებულოა, თუ მაქსიმალური ასაფრენი მასა 250 გრამია ან მეტი, ან თუ დრონს აქვს კამერა თუ სხვა სენსორი, რომელსაც პერსონალური მონაცემის დაფიქსირება შეუძლია — წონის მიუხედავად. ორივე პირობა ერთად არ არის საჭირო: ერთიც კმარა. ნომერი მკაფიოდ, წასაკითხად და წარუშლელად უნდა ეწეროს კორპუსზე ან ელემენტის ნაკვეთურში. რეგისტრაცია უფასოა. ხელნაკეთს, ან ქარხნულ სიაში არმყოფ მოდელს, uas.gov.ge-ზე ანგარიშში ამატებთ როგორც ხელნაკეთს და ავსებთ მოთხოვნილ ველებს.',
      en: 'Operator registration is mandatory if the maximum take-off mass is 250 g or more, or if the drone has a camera or another sensor that can capture personal data, whatever it weighs. Either condition is enough on its own. The number must be clear, readable and permanent on the body or in the battery bay. Registration is free. A home-built drone, or a factory model missing from the list, is added in your uas.gov.ge account as home-built, filling in the fields the site asks for.',
    },
    links: [{ href: 'https://uas.gov.ge/', label: 'uas.gov.ge' }],
  },
  {
    id: 'borders',
    title: { ka: 'სერტიფიკატი საზღვარს არ კვეთს', en: 'Certificates do not cross the border' },
    body: {
      ka: 'EASA-ს წევრ ქვეყანაში მიღებული ოპერატორის რეგისტრაცია საქართველოში არ მოქმედებს. საქართველოში მიღებული რეგისტრაციაც და კომპეტენციის სერტიფიკატიც მხოლოდ საქართველოში მოქმედებს. ევროკავშირში ფრენისთვის სააგენტო თავად ასახელებს ლუქსემბურგის სამოქალაქო ავიაციის სააგენტოს (DAC) უფასო ონლაინ კურსს: გავლის შემდეგ გაიცემა ევროპული A1/A3 სერტიფიკატი, რომელიც EASA-ს წევრ ქვეყნებში მოქმედებს. გამგზავრებამდე მაინც შეამოწმეთ იმ ქვეყნის წესი.',
      en: 'An operator registration issued in an EASA member state does not apply in Georgia. A registration or competency certificate issued in Georgia is valid only in Georgia. For a flight in the European Union the Agency itself points to the free online course of the Luxembourg civil aviation authority (DAC): passing it issues a European A1/A3 certificate valid in EASA member states. Still check that country’s own rules before you travel.',
    },
  },
  {
    id: 'exam',
    title: { ka: 'გამოცდა', en: 'The exam' },
    body: {
      ka: 'დისტანციური პილოტის კომპეტენციის ტესტი საჭიროა მხოლოდ მაშინ, როცა მაქსიმალური ასაფრენი მასა 250 გრამზე მეტია. 250 გრამს და ნაკლებს ეს ტესტი არ სჭირდება, კამერა რომც ჰქონდეს.',
      en: 'The remote-pilot competency test is required only when the maximum take-off mass is over 250 g. At 250 g and below the test is not required, even when the drone has a camera.',
    },
  },
  {
    id: 'airport',
    title: { ka: 'აეროპორტი', en: 'Airports' },
    body: {
      ka: 'აეროპორტის სიახლოვეს ღია კატეგორიით ფრენა შეიძლება აეროდრომის ოპერატორთან წინასწარი შეთანხმების შემდეგ. სააგენტოს მაგალითი: 249 გრამიანი დრონით დაბალი ფრენა თბილისის აეროპორტთან ახლოს მდგარ სოფელშიც ამ შეთანხმებას მოითხოვს. სპეციფიკურ კატეგორიას აეროპორტთან, ამის გარდა, სააგენტოს ნებართვაც სჭირდება. მათი მეორე მაგალითია 200 მეტრზე გადაღება ან 30 კილოგრამიანი დრონი — ორივე ღია კატეგორიას სცდება.',
      en: 'Near an airport, an Open-category flight is allowed after you agree it in advance with the aerodrome operator. The Agency’s example: a 249 g drone flown low in a village near Tbilisi airport still needs that agreement. A Specific-category operation near an airport also needs an Agency permit. Their second example is filming at 200 m, or a 30 kg drone — both are outside the Open category.',
    },
  },
  {
    id: 'zones',
    title: { ka: 'აკრძალული ზონები', en: 'Restricted zones' },
    body: {
      ka: 'უპილოტო სისტემებისთვის შეზღუდული და აკრძალული საჰაერო სივრცე დადგენილია საქართველოს მთავრობის 2018 წლის 28 დეკემბრის №660 დადგენილებით. ფრენამდე ეს რუკა და მოქმედი NOTAM ორივე უნდა ნახოთ. ქვემოთ მოცემული AI-შეკითხვა ამ დადგენილებას არ კითხულობს.',
      en: 'Restricted and prohibited airspace for unmanned aircraft is set by Government Decree No. 660 of 28 December 2018. Check that map and the current NOTAM before you fly. The AI question further down does not read the decree.',
    },
  },
  {
    id: 'private',
    title: { ka: 'კერძო საკუთრება', en: 'Private property' },
    body: {
      ka: 'კერძო საკუთრების თავზე ფრენა ღია კატეგორიაში შეიძლება, თუ დაცულია ღია კატეგორიის პირობები და კონფიდენციალურობისა და პერსონალური მონაცემების მოთხოვნები. ოპერატორმა მესამე პირის უფლება არ უნდა დაარღვიოს. კერძო ტერიტორიის გადაღებას და იქ ფრენას მესაკუთრის წინასწარი თანხმობა სჭირდება.',
      en: 'Flying over private property is allowed in the Open category when the Open conditions and the privacy and personal-data rules are met. The operator must not infringe another person’s rights. Filming or flying over private land needs the owner’s consent in advance.',
    },
  },
  {
    id: 'night-age',
    title: { ka: 'ასაკი და ღამე', en: 'Age and night' },
    body: {
      ka: 'ღია კატეგორიის პილოტი სულ ცოტა 16 წლის უნდა იყოს. ნაკლები ასაკი შეიძლება, თუ დრონი სათამაშოა, ან თუ პილოტი უფროსის მეთვალყურეობით დაფრინავს. ღამის ფრენა ღია კატეგორიაში შეიძლება, თუ დრონს აქვს მწვანე და წითელი ციმციმა მაშუქი, რომ პილოტმაც დაინახოს და სხვა საჰაერო ხომალდმაც.',
      en: 'An Open-category pilot must be at least 16. A younger pilot may fly if the drone is a toy, or if an adult supervises. Night flying is allowed in the Open category when the drone has a green and a red flashing light, so the pilot and other aircraft can see it.',
    },
  },
  {
    id: 'repair',
    title: { ka: 'შეკეთება და გადაკეთება', en: 'Repair and modification' },
    body: {
      ka: 'შეკეთება შეიძლება მხოლოდ მწარმოებლის ავტორიზებული ან ორიგინალი ნაწილით და ქარხნული ინსტრუქციით. კონსტრუქციის თვითნებური შეცვლა აკრძალულია, რადგან იცვლება მასა, მართვა და უსაფრთხოების მახასიათებლები. დრონი ქარხნულ კლასსა და წონას უნდა შეესაბამებოდეს.',
      en: 'Repairs may use only parts the manufacturer authorises, or original parts, and must follow the factory instructions. Changing the airframe on your own is prohibited, because the mass, the handling and the safety characteristics change. The drone has to keep the class and the weight the factory declared.',
    },
  },
  {
    id: 'foreign',
    title: { ka: 'უცხოელი ოპერატორი', en: 'Foreign operators' },
    body: {
      ka: 'უცხოელზეც იგივე წესებია: რეგისტრაცია და საქართველოს მოთხოვნები. ონლაინ პორტალი მათთვისაა, ვინც სახელმწიფო სერვისების განვითარების სააგენტოს ბაზაშია — საქართველოს პირადობის მოწმობით ან ბინადრობის ელექტრონული ბარათით. სხვა შემთხვევაში პირადად უნდა გამოცხადდეთ სააგენტოში, თბილისში, ორთაჭალაში, I ხეივნის ქუჩის დასაწყისში. თან გქონდეთ პასპორტი, ქართული ოპერატორის აქტიური ნომერი სმს-ის მისაღებად და წვდომა იმ ელფოსტაზე, რომელსაც რეგისტრაციაში წერთ. რეგისტრაცია უფასოა და რამდენიმე წუთი სჭირდება. ტელეფონი (+995 32) 2 94 80 14, ელფოსტა office@gcaa.ge.',
      en: 'A foreign operator follows the same rules: register, and meet the Georgian requirements. The online portal is for people already in the Public Service Development Agency database, with a Georgian identity card or a residence e-card. Otherwise you come in person to the Agency in Tbilisi, Ortachala, at the start of I Kheivani Street, with your passport, an active Georgian number that can receive SMS, and access to the email you will register with. Registration is free and takes a few minutes. Phone (+995 32) 2 94 80 14, email office@gcaa.ge.',
    },
    links: [{ href: 'https://gcaa.ge/faq/uavs/', label: 'gcaa.ge/faq/uavs' }],
  },
];

export const REG_OPEN_TITLE: Copy = {
  ka: 'ევროპის ღია კატეგორია',
  en: 'The European Open category',
};

export const REG_OPEN_LEAD: Copy = {
  ka: 'ქვემოთ EASA-ს წესია, არა GCAA-ს ცალკე გამოქვეყნებული ცხრილი. გამოიყენეთ ის დრონის ქარხნული ნიშნის წასაკითხად და იმის სანახავად, სად დაიშვება ასეთი დრონი ევროპაში. საქართველოში რეგისტრაციას, გამოცდას, ასაკს, ღამეს, აეროპორტსა და კერძო საკუთრებას ზემოთ მოცემული სია განსაზღვრავს. სტრიქონი „საქართველოში“ სწორედ ამ სხვაობას წერს.',
  en: 'What follows is EASA’s rule, not a separate table published by the GCAA. Use it to read the factory class mark and to see where that drone may fly in Europe. In Georgia, registration, the exam, age, night flying, airports and private land follow the list above. The row “In Georgia” is there for the points that differ.',
};

export const REG_OPEN_RULES: Copy[] = [
  {
    ka: 'ღია კატეგორიაში რჩებით, თუ დრონს აქვს ნიშანი C0, C1, C2, C3 ან C4, ან ხელნაკეთია და 25 კგ-ზე ნაკლებია, ან 2023 წლის 31 დეკემბრამდეა ბაზარზე გატანილი და ნიშანი არ აქვს.',
    en: 'You stay in the Open category if the drone carries a C0, C1, C2, C3 or C4 mark, or it is privately built and under 25 kg, or it was placed on the market before 31 December 2023 and has no class mark.',
  },
  {
    ka: 'დაფრინავთ მხედველობის ხაზში (VLOS), ან დისტანციურ პილოტს დამკვირვებელი ეხმარება.',
    en: 'You fly in visual line of sight (VLOS), or a UA observer assists the remote pilot.',
  },
  {
    ka: 'სიმაღლე არ აღემატება 120 მეტრს მიწიდან.',
    en: 'The height stays at or below 120 m above the ground.',
  },
  {
    ka: 'საშიშ ტვირთს არ გადაიტანთ და არაფერს ყრით.',
    en: 'You carry no dangerous goods and you drop nothing.',
  },
  {
    ka: 'ხალხის თავზე პირდაპირ არ დაფრინავთ, გარდა იმ შემთხვევისა, როცა დრონს კლასის ნიშანი აქვს ან 250 გრამზე მსუბუქია. ზუსტი მანძილი ნიშანზეა დამოკიდებული — ის ბარათზე წერია.',
    en: 'You do not fly directly over people, unless the drone has a class mark or it is lighter than 250 g. The exact distance depends on the mark, and the card states it.',
  },
  {
    ka: 'ამ პირობებში ევროპული ღია კატეგორია წინასწარ ოპერაციულ ნებართვას არ ითხოვს. 25 კგ და მეტი, ან ამ ზღვრებიდან გასვლა, ღია კატეგორიას სცდება.',
    en: 'Inside these conditions the European Open category does not ask for an operational authorisation in advance. At 25 kg and above, or once you leave these limits, you are outside the Open category.',
  },
];

const georgiaHeavy: Copy = {
  ka: '250 გრამზე მეტ მასას საქართველოში რეგისტრაციაც სჭირდება და კომპეტენციის ტესტიც. ზუსტად 250 გრამს ტესტი არ სჭირდება, რეგისტრაცია კი სჭირდება. 150 მეტრი დასახლებული ზონიდან ევროპული A3-ის წესია. GCAA-ს კითხვა-პასუხი ამ მანძილს არ იმეორებს: აქ ზონებს №660 დადგენილება და NOTAM ადგენს, აეროპორტთან კი აეროდრომის ოპერატორთან შეთანხმება გჭირდებათ.',
  en: 'Over 250 g, Georgia requires both registration and the competency test. At exactly 250 g the test is not required, but registration is. The 150 m gap from built-up areas is the European A3 rule. The GCAA FAQ does not repeat that distance: here, zones come from Decree No. 660 and from NOTAMs, and near an airport you need the aerodrome operator’s agreement.',
};

export const REG_DEFAULT_CLASS_ID = 'unlabeled-heavy';

export const REG_CLASSES: ClassCard[] = [
  {
    id: 'c0',
    chip: { ka: 'C0 · 250 გ-მდე', en: 'C0 · under 250 g' },
    title: { ka: 'C0, 250 გრამამდე', en: 'C0, under 250 g' },
    rows: [
      row('sub', sub, 'A1. A3-შიც შეგიძლიათ.', 'A1. You may also fly in A3.'),
      row('people', people, 'შეკრებილი ხალხის თავზე არა. A1 დანარჩენ ადგილას თითქმის ყველგან შეიძლება, სახელმწიფოს აკრძალული ზონების გარდა.', 'Not over an assembly of people. A1 is otherwise allowed almost everywhere, except zones the state has closed.'),
      row('height', height, '120 მეტრზე დაბლა მიწიდან.', 'Below 120 m above the ground.'),
      row('registration', registration, 'არა, თუ კამერა ან სენსორი არ აქვს. კამერიან დრონს რეგისტრაცია სჭირდება, გარდა იმ შემთხვევისა, როცა სათამაშოა.', 'No, unless it has a camera or a sensor. A camera drone must be registered, unless it is a toy.'),
      row('training', training, 'ყურადღებით წაიკითხეთ ინსტრუქცია. ცალკე გამოცდა არ წერია.', 'Read the user manual carefully. No separate exam is stated.'),
      row('age', age, '16 წელი. სათამაშოს შემთხვევაში ასაკის ზღვარი არ არის.', '16. No minimum age if the drone is a toy.'),
      row('remote', remote, noRemote.ka, noRemote.en),
      row('georgia', georgia, georgiaLight.ka, georgiaLight.en),
    ],
  },
  {
    id: 'c1',
    chip: { ka: 'C1 · 900 გ-მდე', en: 'C1 · under 900 g' },
    title: { ka: 'C1, 900 გრამამდე', en: 'C1, under 900 g' },
    rows: [
      row('sub', sub, 'A1. A3-შიც შეგიძლიათ.', 'A1. You may also fly in A3.'),
      row('people', people, 'ჩართული ადამიანების თავზე ფრენა მოსალოდნელი არ უნდა იყოს. თუ მაინც მოხდა, მაქსიმალურად შეამცირეთ. შეკრებილი ხალხის თავზე არა.', 'Overflight of uninvolved people is not expected. If it happens, minimise it. Not over an assembly of people.'),
      row('height', height, '120 მეტრზე დაბლა მიწიდან.', 'Below 120 m above the ground.'),
      row('registration', registration, 'დიახ.', 'Yes.'),
      row('training', training, 'წაიკითხეთ ინსტრუქცია. გაიარეთ A1/A3 ონლაინ სწავლება და ჩააბარეთ ონლაინ თეორიული გამოცდა. სწორედ ამას ეწოდება ონლაინ სწავლების გავლის დამადასტურებელი.', 'Read the manual. Complete the A1/A3 online training and pass the online theoretical exam. That is the proof of completion for online training.'),
      row('age', age, '16 წელი.', '16.'),
      row('remote', remote, 'დიახ. 2024 წლის 1 იანვრიდან C1 პირდაპირ Remote ID-ს ჩართულს და განახლებულს მოითხოვს. ქარხანა ამ სისტემას თავად დებს და ის ავრცელებს დრონის პოზიციას და ოპერატორის ნომერს.', 'Yes. From 1 January 2024 a C1 must run direct Remote ID, active and up to date. The factory fits the system, and it broadcasts the drone’s position and the operator’s number.'),
      row('georgia', georgia, 'თუ რეალური მასა 250 გრამზე მეტია, საქართველოში ტესტიც გჭირდებათ და რეგისტრაციაც. ევროპული A1/A3 მოწმობა ქართულ ტესტს არ ცვლის. კამერა რეგისტრაციას მასის მიუხედავად მოითხოვს.', 'If the real mass is over 250 g, Georgia requires both the test and registration. A European A1/A3 proof does not replace the Georgian test. A camera requires registration whatever the mass.'),
    ],
  },
  {
    id: 'c2',
    chip: { ka: 'C2 · 4 კგ-მდე', en: 'C2 · under 4 kg' },
    title: { ka: 'C2, 4 კილოგრამამდე', en: 'C2, under 4 kg' },
    rows: [
      row('sub', sub, 'A2. A3-შიც შეგიძლიათ.', 'A2. You may also fly in A3.'),
      row('people', people, 'ჩართული ადამიანების თავზე არა. ჰორიზონტალური მანძილი სულ ცოტა 30 მეტრია. დაბალი სიჩქარის რეჟიმით, მას შემდეგ რაც ამინდს, დრონის მახასიათებლებს და ადგილს შეაფასებთ, მანძილი 5 მეტრამდე შეიძლება დავიდეს, მაგრამ 5-ზე ახლოს არა. EASA იმასაც წერს, რომ მანძილი ფრენის სიმაღლის ტოლი უნდა იყოს: 30 მეტრზე ფრენისას გვერდითაც სულ ცოტა 30 მეტრი დატოვეთ.', 'Do not overfly uninvolved people. Keep at least 30 m horizontally. With the low-speed mode on, and after you judge the weather, the aircraft and the site, the gap may come down to 5 m, and no closer. EASA also says the gap should match the height: at 30 m high, keep at least 30 m to the side.'),
      row('height', height, '120 მეტრზე დაბლა მიწიდან.', 'Below 120 m above the ground.'),
      row('registration', registration, 'დიახ.', 'Yes.'),
      row('training', training, 'წაიკითხეთ ინსტრუქცია. გქონდეთ A1/A3 ონლაინ სწავლების დამადასტურებელი, გაიარეთ და განაცხადეთ პრაქტიკული თვითვარჯიში, და ჩააბარეთ დამატებითი თეორიული გამოცდა A2-ის კომპეტენციის სერტიფიკატისთვის.', 'Read the manual. Hold the A1/A3 proof of online training, complete and declare the practical self-training, and pass an additional theoretical exam for the A2 certificate of competency.'),
      row('age', age, '16 წელი.', '16.'),
      row('remote', remote, 'დიახ. C2-საც იგივე პირდაპირი Remote ID სჭირდება, რაც C1-ს: ჩართული და განახლებული.', 'Yes. C2 needs the same direct Remote ID as C1: active and up to date.'),
      row('georgia', georgia, '250 გრამზე მეტ მასას რეგისტრაციაც სჭირდება და კომპეტენციის ტესტიც. ევროპული A2 სერტიფიკატი საქართველოს მოთხოვნა არ არის. GCAA ამ მასაზე ტესტს სთხოვს, A2-ს კი არა.', 'Over 250 g, Georgia requires registration and the competency test. A European A2 certificate is not a Georgian requirement. The GCAA asks for the test at this mass, not for an A2 certificate.'),
    ],
  },
  {
    id: 'c3',
    chip: { ka: 'C3 · 25 კგ-მდე', en: 'C3 · under 25 kg' },
    title: { ka: 'C3, 25 კილოგრამამდე', en: 'C3, under 25 kg' },
    rows: [
      row('sub', sub, 'მხოლოდ A3.', 'A3 only.'),
      row('people', people, 'ჩართული ადამიანების თავზე არა, და მხოლოდ იქ, სადაც ოპერაციის ზონაში ჩართული ადამიანი არ დგას. EU 2019/947 სულ ცოტა 150 მეტრს ითხოვს საცხოვრებელ, კომერციულ, სამრეწველო და რეკრეაციულ ზონამდე. EASA-ს მოკლე ცხრილი იმავეს ასე ამბობს: 150 მეტრი ჩართული ადამიანებისგან და ურბანული ზონიდან. ქალაქში A3 არ დაფრინავს.', 'Do not overfly uninvolved people, and fly only where no uninvolved person is present in the area of the operation. EU 2019/947 requires at least 150 m from residential, commercial, industrial and recreational areas. EASA’s short table says the same thing as 150 m from uninvolved people and from urban areas. A3 does not fly in town.'),
      row('height', height, '120 მეტრზე დაბლა მიწიდან.', 'Below 120 m above the ground.'),
      row('registration', registration, 'დიახ.', 'Yes.'),
      row('training', training, 'წაიკითხეთ ინსტრუქცია და გქონდეთ A1/A3 ონლაინ სწავლების გავლის დამადასტურებელი.', 'Read the manual and hold the A1/A3 proof of completion for online training.'),
      row('age', age, '16 წელი.', '16.'),
      row('remote', remote, 'დიახ. C3-საც პირდაპირი Remote ID სჭირდება, ჩართული და განახლებული.', 'Yes. C3 also needs direct Remote ID, active and up to date.'),
      row('georgia', georgia, georgiaHeavy.ka, georgiaHeavy.en),
    ],
  },
  {
    id: 'c4',
    chip: { ka: 'C4 · 25 კგ-მდე', en: 'C4 · under 25 kg' },
    title: { ka: 'C4, 25 კილოგრამამდე', en: 'C4, under 25 kg' },
    rows: [
      row('sub', sub, 'მხოლოდ A3.', 'A3 only.'),
      row('people', people, 'იგივე, რაც C3-ზე: ჩართული ადამიანების თავზე არა, ოპერაციის ზონაში ჩართული ადამიანის გარეშე, და სულ ცოტა 150 მეტრი საცხოვრებელ, კომერციულ, სამრეწველო და რეკრეაციულ ზონამდე.', 'The same as C3: not over uninvolved people, nobody uninvolved in the area of the operation, and at least 150 m from residential, commercial, industrial and recreational areas.'),
      row('height', height, '120 მეტრზე დაბლა მიწიდან.', 'Below 120 m above the ground.'),
      row('registration', registration, 'დიახ.', 'Yes.'),
      row('training', training, 'წაიკითხეთ ინსტრუქცია და გქონდეთ A1/A3 ონლაინ სწავლების გავლის დამადასტურებელი.', 'Read the manual and hold the A1/A3 proof of completion for online training.'),
      row('age', age, '16 წელი.', '16.'),
      row('remote', remote, noRemote.ka, noRemote.en),
      row('georgia', georgia, georgiaHeavy.ka, georgiaHeavy.en),
    ],
  },
  {
    id: 'unlabeled-light',
    chip: { ka: 'ნიშნის გარეშე · 250 გ-მდე', en: 'No class mark · under 250 g' },
    title: {
      ka: 'ნიშნის გარეშე ან ხელნაკეთი, 250 გრამამდე',
      en: 'No class mark, or privately built, under 250 g',
    },
    rows: [
      row('sub', sub, 'A1. A3-შიც შეგიძლიათ. ეს ეხება ხელნაკეთს და იმ დრონს, რომელიც ბაზარზე 2024 წლის 1 იანვრამდე გავიდა და კლასის ნიშანი არ აქვს.', 'A1. You may also fly in A3. This covers a privately built drone and a drone placed on the market before 1 January 2024 with no class mark.'),
      row('people', people, 'ჩართული ადამიანების თავზე ფრენა შეიძლება, მაგრამ შეძლებისდაგვარად მოერიდეთ. შეკრებილი ხალხის თავზე არა.', 'You may fly over uninvolved people, but avoid it when you can. Not over an assembly of people.'),
      row('height', height, '120 მეტრზე დაბლა მიწიდან, როგორც მთელ ღია კატეგორიაში.', 'Below 120 m above the ground, as in the whole Open category.'),
      row('registration', registration, 'არა, თუ კამერა ან სენსორი არ აქვს. კამერიანს რეგისტრაცია სჭირდება, გარდა სათამაშოსი.', 'No, unless it has a camera or a sensor. A camera drone must be registered, unless it is a toy.'),
      row('training', training, 'ცალკე მომზადება არ არის მოთხოვნილი.', 'No training is required.'),
      row('age', age, 'ასაკის ზღვარი EASA-ს ამ სტრიქონზე არ წერია.', 'EASA states no minimum age on this row.'),
      row('remote', remote, noRemote.ka, noRemote.en),
      row('georgia', georgia, `${georgiaLight.ka} EASA-ს „ასაკის ზღვარი არ არის“ საქართველოში არ მოქმედებს.`, `${georgiaLight.en} EASA’s “no minimum age” does not apply in Georgia.`),
    ],
  },
  {
    id: 'unlabeled-heavy',
    chip: { ka: 'ნიშნის გარეშე · 25 კგ-მდე', en: 'No class mark · under 25 kg' },
    title: {
      ka: 'ნიშნის გარეშე ან ხელნაკეთი, 250 გრამიდან 25 კილოგრამამდე',
      en: 'No class mark, or privately built, from 250 g up to 25 kg',
    },
    rows: [
      row('sub', sub, '2024 წლის 1 იანვრიდან მხოლოდ A3. ძველი ზოლები — 500 გრამამდე ხალხის თავზე აკრძალვა, 2 კგ-მდე 50 მეტრი და A2-ის ტოლფასი მომზადება — იმ თარიღამდე მოქმედებდა. ნიშანს თავს ნუ დააწებებთ: EASA პირდაპირ წერს, რომ A1-სა და A3-ში რეტროფიტის სტიკერი არ გჭირდებათ.', 'From 1 January 2024, A3 only. The old bands — no overflight under 500 g, 50 m and A2-equivalent training under 2 kg — applied until that date. Do not stick a class mark on it yourself: EASA states you need no retrofit sticker for A1 or A3.'),
      row('people', people, 'A3: ჩართული ადამიანების თავზე არა, ოპერაციის ზონაში ჩართული ადამიანის გარეშე, სულ ცოტა 150 მეტრი საცხოვრებელ, კომერციულ, სამრეწველო და რეკრეაციულ ზონამდე.', 'A3: not over uninvolved people, nobody uninvolved in the area of the operation, and at least 150 m from residential, commercial, industrial and recreational areas.'),
      row('height', height, '120 მეტრზე დაბლა მიწიდან. ნიშნის გარეშე დრონს ქარხანა მაქსიმალურ მასას არ უდასტურებს, ამიტომ აწონეთ ტვირთთან ერთად. 25 კგ-ის ზღვარი საწვავსაც და ტვირთსაც მოიცავს.', 'Below 120 m above the ground. Without a class mark the factory does not declare the maximum mass, so weigh it with the payload. The 25 kg limit includes fuel and payload.'),
      row('registration', registration, 'დიახ, როცა მასა 250 გრამია ან მეტი, ან კამერა აქვს.', 'Yes, when the mass is 250 g or more, or it has a camera.'),
      row('training', training, 'A3-ში გჭირდებათ A1/A3 ონლაინ სწავლების გავლის დამადასტურებელი.', 'A3 needs the A1/A3 proof of completion for online training.'),
      row('age', age, '16 წელი, როგორც A3-ის დანარჩენ კლასებზე.', '16, as for the other A3 classes.'),
      row('remote', remote, 'ნიშნის გარეშე დრონი C1–C3-ის Remote ID-ის სიაში არ შედის. სპეციფიკურ კატეგორიაში, 120 მეტრზე დაბლა, EASA Remote ID-ს ცალკე ითხოვს.', 'A drone with no class mark is not in the C1–C3 Remote ID list. In the Specific category, below 120 m, EASA requires Remote ID separately.'),
      row('georgia', georgia, `${georgiaHeavy.ka} ხელნაკეთი კვადკოპტერი, რომელსაც C0–C4 არ აქვს და 250 გრამზე მძიმეა, ევროპაში სწორედ ამ ბარათს ეკუთვნის, არა ძველ 50-მეტრიან ზოლს.`, `${georgiaHeavy.en} A home-built quad with no C0–C4 mark and a mass over 250 g belongs on this card in Europe, not in the old 50 m band.`),
    ],
  },
];

export const REG_REMOTE_TITLE: Copy = {
  ka: 'Remote ID მხოლოდ იქ, სადაც EASA წერს',
  en: 'Remote ID only where EASA states it',
};

export const REG_REMOTE_BODY: Copy = {
  ka: '2024 წლის 1 იანვრიდან პირდაპირი დისტანციური იდენტიფიკაცია ჩართული და განახლებული უნდა იყოს C1, C2 და C3 ნიშანზე, ასევე სპეციფიკურ კატეგორიაში 120 მეტრზე დაბლა. C1–C3 ამ სისტემით იყიდება. GCAA-ს კითხვა-პასუხი Remote ID-ს არ ახსენებს. ნუ ჩათვლით ამას საქართველოს მოთხოვნად, სანამ სააგენტო ცალკე არ დაწერს.',
  en: 'From 1 January 2024, direct remote identification must be active and up to date on C1, C2 and C3 marks, and on Specific-category flights below 120 m. C1–C3 are sold with that system. The GCAA FAQ does not mention Remote ID. Do not treat it as a Georgian requirement unless the Agency says so in its own text.',
};

export const REG_SPECIFIC_TITLE: Copy = {
  ka: 'სპეციფიკური კატეგორია',
  en: 'Specific category',
};

export const REG_SPECIFIC_LEAD: Copy = {
  ka: 'ევროპაში ღია კატეგორიიდან გასული ოპერაცია სპეციფიკურია. ოპერატორი აკეთებს რისკის შეფასებას, ხშირად SORA-ს, და ნებართვას იღებს ეროვნული სააგენტოსგან. ზოგი სტანდარტული სცენარი ნებართვის ნაცვლად დეკლარაციით სრულდება — ეს ევროპული მექანიზმია. საქართველოს სააგენტომ საჯაროდ დაასახელა სამუშაოები, რომლებსაც მისი ნებართვა სჭირდება:',
  en: 'In Europe, an operation that no longer fits the Open category is Specific. The operator does a risk assessment, often SORA, and gets an authorisation from the national authority. Some standard scenarios are flown on a declaration instead of an authorisation — that is a European mechanism. The Georgian Agency has publicly named work that needs its permit:',
};

export const REG_SPECIFIC_ITEMS: Copy[] = [
  {
    ka: 'აგროსამუშაო: ნაკვეთის დამტვერვა, შეწამვლა, დაკიდებული სასოფლო-სამეურნეო ტვირთი. სააგენტო ამას გაზრდილ რისკად ასახელებს.',
    en: 'Agricultural work: dusting a field, spraying, a suspended agricultural load. The Agency calls this higher risk.',
  },
  {
    ka: 'შენობის ფასადის დრონით წმენდა და რეცხვა. ესეც გაზრდილი რისკია და ნებართვა სჭირდება.',
    en: 'Washing or cleaning a building facade with a drone. This is also higher risk and needs a permit.',
  },
  {
    ka: 'ღია კატეგორიის ზღვარს მიღმა ფრენა. სააგენტოს მაგალითია 200 მეტრზე გადაღება და 30 კილოგრამიანი დრონი.',
    en: 'A flight outside the Open limits. The Agency’s examples are filming at 200 m and a 30 kg drone.',
  },
  {
    ka: 'აეროპორტთან სპეციფიკური ოპერაცია. აეროდრომის ოპერატორთან შეთანხმებას ემატება სააგენტოს ნებართვა.',
    en: 'A Specific operation near an airport. The aerodrome operator’s agreement is not enough; the Agency permit is added.',
  },
];

export const REG_CERTIFIED_TITLE: Copy = {
  ka: 'სერტიფიცირებული კატეგორია',
  en: 'Certified category',
};

export const REG_CERTIFIED_BODY: Copy = {
  ka: 'ევროპაში ეს ყველაზე მაღალი რისკის კატეგორიაა: ადამიანების გადაყვანა ან საშიში ტვირთი. საჰაერო ხომალდიც და ოპერატორიც სერტიფიცირებული უნდა იყოს, დისტანციურ პილოტს კი ლიცენზია სჭირდება. GCAA-ს საჯარო კითხვა-პასუხი ამ კატეგორიის ცალკე ჩამონათვალს არ იძლევა. ასეთი სამუშაო ღია კატეგორიას სცდება, ამიტომ სააგენტოსთან უნდა შეთანხმდეთ, სანამ დაიწყებთ.',
  en: 'In Europe this is the highest-risk category: carrying people, or dangerous goods. The aircraft and the operator both need certification, and the remote pilot needs a licence. The GCAA public FAQ does not give a separate checklist for it. Work of that kind is outside the Open category, so agree it with the Agency before you start.',
};

export const REG_SOURCES_TITLE: Copy = {
  ka: 'წყაროები',
  en: 'Sources',
};

export const REG_SOURCES: { href: string; label: string; note: Copy }[] = [
  {
    href: 'https://gcaa.ge/faq/uavs/',
    label: 'gcaa.ge/faq/uavs',
    note: { ka: 'საქართველოს პუნქტები', en: 'The Georgian points' },
  },
  {
    href: 'https://uas.gov.ge/',
    label: 'uas.gov.ge',
    note: { ka: 'ოპერატორის რეგისტრაცია', en: 'Operator registration' },
  },
  {
    href: 'https://www.easa.europa.eu/en/domains/drones-air-mobility/operating-drone/open-category-low-risk-civil-drones',
    label: 'EASA Open category',
    note: { ka: 'კლასების ცხრილი 2024 წლის 1 იანვრიდან', en: 'Class table from 1 January 2024' },
  },
  {
    href: 'https://www.easa.europa.eu/en/document-library/general-publications/drone-open-category-applicable-requirements-fly-1st-january',
    label: 'EASA, 1 January 2024',
    note: { ka: 'ნიშნის გარეშე დრონი და Remote ID', en: 'Unlabeled drones and Remote ID' },
  },
];
