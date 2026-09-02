export function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const results = [];

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

export default { parseCSV };
