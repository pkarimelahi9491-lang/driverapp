export const FLEET_CSV_RAW = '';

export function parseCsvTiers(data?: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [];
}

export function guessCityForLocation(locationName?: string): string {
  if (!locationName) return 'تهران';
  if (locationName.includes('کرج')) return 'کرج';
  if (locationName.includes('اصفهان')) return 'اصفهان';
  if (locationName.includes('مشهد')) return 'مشهد';
  if (locationName.includes('شیراز')) return 'شیراز';
  if (locationName.includes('تبریز')) return 'تبریز';
  return 'تهران';
}

export function parseCSV(csvContent: string): any[] {
  if (!csvContent) return [];
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const results: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].split(',').map(item => item.trim());
    if (currentLine.length === headers.length) {
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = currentLine[index];
      });
      results.push(obj);
    }
  }
  return results;
}

export default {
  FLEET_CSV_RAW,
  parseCsvTiers,
  guessCityForLocation,
  parseCSV,
};
