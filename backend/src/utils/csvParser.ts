/**
 * CSV Parser for Arman Entekhab Fleet Route Data
 * Parses the holding's Excel/CSV format into structured route data
 */

export interface CsvTier {
  code: number;
  distanceKm: number;
  ratePerKmToman: number;
  totalPriceToman: number;
  destinations: string[];
}

export const FLEET_CSV_RAW = `کد,مسافت,نرخ,جمع,تعداد پته,جمع کل,مقصد,مقصد2,مقصد3,مقصد4,مقصد5,مقصد6,مقصد7,مقصد8,مقصد9,مقصد10,مقصد11,مقصد12,مقصد13,مقصد14,مقصد15,مقصد16,مقصد17,مقصد18,مقصد19,مقصد20,مقصد21,مقصد22,مقصد23,مقصد24,مقصد25,مقصد26,مقصد27,مقصد28,مقصد29,مقصد30,مقصد31,مقصد32,مقصد33,مقصد34,مقصد35,مقصد36,مقصد37,مقصد38,مقصد39,مقصد40,مقصد41,مقصد42,مقصد43,مقصد44,مقصد45,مقصد46,مقصد47,مقصد48,مقصد49,مقصد50,مقصد51,مقصد52,مقصد53,مقصد54,مقصد55,مقصد56,مقصد57,مقصد58,مقصد59,مقصد60,مقصد61,مقصد62,مقصد63,مقصد64,مقصد65
1,30,"90,000","2,700,000",1,"2,700,000",انبار سادات,اقامتگاه مادر شاه,بتن تعادل,پلیس راه شاهین شهر,شاهین شهر,شهرک صنعتی بزرگ
2,35,"90,000","3,150,000",,0,حاجی آباد شاهین شهر,گلدیس
3,40,"90,000","3,600,000",,0,آزادگان,خورزوق,شهرک سیمرغ,علویجه,گرگاب,گز
4,45,"90,000","4,050,000",4,"16,200,000",17شهریور,ابوریحان,آفرینش,آل محمد,آل یاسین,امام خمینی,امیرکبیر,پل چمران,پنج آذر,ترمینال کاوه,خانه اصفهان,خردمند,دستگرد,دولت آباد,رزمندگان,شاهپور جدید,شریف,غرضی,فدک,کاوه,گلستان,شهرک صنعتی محمود اباد,مارچین,مشیرالدوله,ملک شهر,صفائیه,نیروگاه
5,50,"90,000","4,500,000",,0,ابن سینا,اشراق,باهنر,برازنده,بعثت,بید ابادی,پارک لاله,پنج رمضان,جابر انصاری,چمران,حکیم شفائی اول,خرازی,دانش,دروازه تهران,رباط,رهنان,زاهد,سروش,شاهپور قدیم,شاهد,شهدا,شهرک صنعتی خمینی شهر,شهرک صنعتی دولت آباد,شهرک نگین,طالقانی,عسگریه,فردوسی,فروغی,فلاطوری,قدس,کاوه,مسجد سید,مولوی,میدان امام علی,نگارستان,هسا,وفایی
6,55,"90,000","4,950,000",7,"34,650,000",22بهمن,ابشار,آپادانا,آذر بهرام,احمد اباد,ارباب,استانداری,بزرگمهر,بوستان سعدی,بهشتی,پروین,پل تمدن,پل غدیر,پل فلزی,پل مارنون,پل میر,جهاد,چهارباغ پایین,چهارباغ عباسی,چهارراه تختی,چهارراه قصر,حبیب آباد,حکیم,حکیم شفایی دوم,خزانه,خمینی شهر,خواجه عمید,خواجو,دانشگاه صنعتی,دشتستان,دروازه دولت,رکن الدوله,زینبیه,سجاد,شریف واقفی,شمس ابادی,شهرک سلامت,شهرک ولی عصر,شیخ بهایی,شیخ صدوق,شیخ طوسی,شیخ مفید,صمدیه,علامه امینی,میدان احمد اباد,فیض,کاشانی,گلزار,لاله,لاهور,لنبان,محتشم کاشانی,مدرس,مشتاق,معراج,مهراباد,میدان امام,میدان امام حسین,میر,میرداماد,میمه,نشاط,هاتف,ولی عصر,هشت بهشت
7,60,"90,000","5,400,000",3,"16,200,000",آتشگاه,ارتش,اطشاران,امیر حمزه,انقلاب,باغ دریاچه,بلوار آیینه خانه,بلوار ملت,بیمارستان میلاد,پل وحید,تالار,ترمینال جی,ترمینال صفه,توحید,جی,جی شیر,چهارباغ بالا,حسین آباد,حکیم نظامی,حمزه,خاقانی,دانشگاه اصفهان,دانشگاه هنر,دروازه شیراز,رودکی,سروستان,سیمین,سهروردی,شریعتی,فرایبورگ,فرح اباد,قائمیه,کشاورز,کوی امیریه,لباف,مرداویج,مهاجر,ناژوان,نظر,هزار جریب,وحید
8,65,"90,000","5,850,000",,0,ارغوانیه,اریسون,خوراسگان,دکتر حسابی,شفق,دهق,کشوری,کوی امام,کهندژ,صفه,میرزا طاهر,نبوی منش,کهریزسنگ
9,70,"90,000","6,300,000",,0,شهرک صنعتی جی,شهرک صنعتی کمشچه,فرودگاه,کمشچه,گمرک
10,75,"90,000","6,750,000",,0,باغ رضوان,درچه,سپاهان شهر,فلاورجان,کلیشاد
11,80,"90,000","7,200,000",2,"14,400,000",اشکاوند,بهاران,جوزدان,قهجاورستان,شهرک صنعتی نجف‌آباد,ویلا شهر
12,85,"90,000","7,650,000",,0,بهارستان,تیران,شهر ابریشم,شهرک صنعتی سروش بادران,نجف آباد
13,90,"90,000","8,100,000",,0,نطنز
14,95,"90,000","8,550,000",,0,شهرک صنعتی مبارکه,فولاد شهر
15,100,"90,000","9,000,000",,0,چادگان,زاینده رود,زرین شهر,سجزی,شهرضا,شهرک صنعتی سجزی,شهرک صنعتی کوهپایه,مبارکه`;

function cleanNumber(str: string): string {
  return str.replace(/[,،"']/g, '').trim();
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if ((ch === ',' || ch === '\t' || ch === ';') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsvTiers(rawText: string): CsvTier[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const result: CsvTier[] = [];

  for (const line of lines) {
    if (line.startsWith('کد') || line.startsWith('Code')) continue;

    const tokens = splitCsvLine(line);
    if (tokens.length < 7) continue;

    const code = parseInt(tokens[0], 10);
    if (isNaN(code)) continue;

    const distanceKm = parseInt(tokens[1], 10) || (code * 5 + 25);
    const rateRaw = cleanNumber(tokens[2] || '90000');
    const rateToman = parseInt(rateRaw, 10) || 90000;
    const totalRaw = cleanNumber(tokens[3] || '');
    const totalPriceRial = parseInt(totalRaw, 10) || (distanceKm * rateToman);
    // CSV stores rial, convert to toman
    const totalPriceToman = totalPriceRial >= 100000 ? Math.round(totalPriceRial / 10) : totalPriceRial;

    // Destinations start from index 6
    const destinations: string[] = [];
    for (let i = 6; i < tokens.length; i++) {
      const dest = tokens[i].trim().replace(/["'،]/g, '');
      if (dest && dest !== '0' && dest !== '-' && dest !== 'null') {
        destinations.push(dest);
      }
    }

    if (destinations.length > 0) {
      result.push({
        code,
        distanceKm,
        ratePerKmToman: rateToman,
        totalPriceToman,
        destinations: [...new Set(destinations)], // deduplicate
      });
    }
  }
  return result;
}

export function guessCityForLocation(name: string): string {
  if (name.includes('شاهین شهر') || name.includes('گلدیس') || name.includes('مادر شاه')) return 'شاهین شهر';
  if (name.includes('خورزوق')) return 'خورزوق';
  if (name.includes('گرگاب')) return 'گرگاب';
  if (name.includes('گز')) return 'گز برخوار';
  if (name.includes('علویجه')) return 'علویجه';
  if (name.includes('خمینی شهر')) return 'خمینی شهر';
  if (name.includes('نجف آباد') || name.includes('ویلا شهر')) return 'نجف‌آباد';
  if (name.includes('فلاورجان')) return 'فلاورجان';
  if (name.includes('کلیشاد')) return 'کلیشاد';
  if (name.includes('درچه')) return 'درچه';
  if (name.includes('بهارستان')) return 'بهارستان';
  if (name.includes('مبارکه') || name.includes('فولاد شهر')) return 'مبارکه';
  if (name.includes('زرین شهر')) return 'زرین‌شهر';
  if (name.includes('نطنز')) return 'نطنز';
  if (name.includes('میمه')) return 'میمه';
  if (name.includes('چادگان')) return 'چادگان';
  if (name.includes('شهرضا')) return 'شهرضا';
  if (name.includes('سجزی')) return 'سجزی';
  if (name.includes('کوهپایه')) return 'کوهپایه';
  if (name.includes('تیران')) return 'تیران و کرون';
  if (name.includes('کمشچه')) return 'کمشچه';
  if (name.includes('قهجاورستان')) return 'قهجاورستان';
  if (name.includes('ارغانیه') || name.includes('خوراسگان') || name.includes('صفه')) return 'خوراسگان';
  if (name.includes('نجف') || name.includes('اشکاوند')) return 'نجف‌آباد';
  return 'اصفهان';
}
