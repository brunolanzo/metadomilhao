export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  selected: boolean;
}

/**
 * Parse CSV bank statement.
 * Supports Itaú format: data,lançamento,valor
 * Also supports generic: date,description,amount
 */
export function parseCSV(content: string): ParsedTransaction[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  // Detect separator (comma or semicolon)
  const header = lines[0].toLowerCase();
  const separator = header.includes(';') ? ';' : ',';

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(separator);
    if (parts.length < 3) continue;

    const dateStr = parts[0].trim();
    const description = parts[1].trim();
    const rawValue = parts[2].trim().replace(/"/g, '').replace(',', '.');
    const value = parseFloat(rawValue);

    if (!dateStr || !description || isNaN(value)) continue;

    // Normalize date to YYYY-MM-DD
    const date = normalizeDate(dateStr);
    if (!date) continue;

    // Skip payment entries (large negative values like "PAGAMENTO EFETUADO")
    if (description.toUpperCase().includes('PAGAMENTO EFETUADO')) continue;

    const amount = Math.abs(value);
    // Negative values = income/credit, positive = expense
    const type: 'income' | 'expense' = value < 0 ? 'income' : 'expense';

    transactions.push({
      date,
      description,
      amount,
      type,
      selected: true,
    });
  }

  return transactions;
}

/**
 * Parse OFX/QFX bank statement.
 */
export function parseOFX(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  // Extract transaction blocks
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const block = match[1];

    const dateMatch = block.match(/<DTPOSTED>(\d{8})/);
    const amountMatch = block.match(/<TRNAMT>([-\d.,]+)/);
    const memoMatch = block.match(/<MEMO>([^<\n]+)/) || block.match(/<NAME>([^<\n]+)/);

    if (!dateMatch || !amountMatch) continue;

    const dateRaw = dateMatch[1];
    const date = `${dateRaw.substring(0, 4)}-${dateRaw.substring(4, 6)}-${dateRaw.substring(6, 8)}`;
    const value = parseFloat(amountMatch[1].replace(',', '.'));
    const description = memoMatch ? memoMatch[1].trim() : 'Sem descrição';

    if (isNaN(value)) continue;
    if (description.toUpperCase().includes('PAGAMENTO EFETUADO')) continue;

    const amount = Math.abs(value);
    const type: 'income' | 'expense' = value > 0 ? 'income' : 'expense';

    transactions.push({
      date,
      description,
      amount,
      type,
      selected: true,
    });
  }

  return transactions;
}

function normalizeDate(dateStr: string): string | null {
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  // DD/MM/YYYY
  const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;

  // DD/MM/YY
  const brShort = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (brShort) return `20${brShort[3]}-${brShort[2]}-${brShort[1]}`;

  return null;
}

export function detectFileType(filename: string): 'csv' | 'ofx' | null {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'csv' || ext === 'tsv') return 'csv';
  if (ext === 'ofx' || ext === 'qfx') return 'ofx';
  return null;
}
