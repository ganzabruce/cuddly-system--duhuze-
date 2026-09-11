export type RowGuest = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  error?: { name?: string; email?: string; phoneNumber?: string };
};

export function parseCsvRow(row: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i += 1) {
    const char = row[i];
    if (char === '"') {
      const nextChar = row[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function looksLikePhone(value: string): boolean {
  const cleaned = value.trim().replace(/[\s\-().+]/g, "");
  return cleaned.length >= 7 && /^\d+$/.test(cleaned);
}

function detectColumnType(values: string[]): "email" | "phone" | "name" {
  const sample = values.filter((v) => v.trim()).slice(0, 20);
  if (sample.length === 0) return "name";
  const emailCount = sample.filter(looksLikeEmail).length;
  if (emailCount > sample.length * 0.5) return "email";
  const phoneCount = sample.filter(looksLikePhone).length;
  if (phoneCount > sample.length * 0.5) return "phone";
  return "name";
}

export function validateRow(row: RowGuest, options?: { phoneAllowed?: boolean }): { name?: string; email?: string; phoneNumber?: string } | undefined {
  const errors: { name?: string; email?: string; phoneNumber?: string } = {};
  if (!row.name.trim()) errors.name = "Name is required";
  if (options?.phoneAllowed) {
    if (!row.email.trim() && !row.phoneNumber.trim()) errors.email = "Email or phone is required";
    else if (row.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.email = "Invalid email address";
  } else {
    if (!row.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.email = "Invalid email address";
  }
  return Object.keys(errors).length > 0 ? errors : undefined;
}

export async function parseGuestsFromFile(file: File): Promise<Array<{ name: string; email: string; phoneNumber: string }>> {
  const isExcel = file.name.endsWith(".xlsx") || file.type.includes("spreadsheet");
  if (isExcel) {
    return parseGuestsFromExcelFile(file);
  }
  const text = await file.text();
  return parseGuestsFromCsv(text);
}

async function parseGuestsFromExcelFile(file: File): Promise<Array<{ name: string; email: string; phoneNumber: string }>> {
  const ExcelJS = (await import("exceljs")).default;
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount === 0) return [];

  const headerRow = sheet.getRow(1);
  const headerMap = new Map<string, number>();
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headerMap.set(normalizeHeader(String(cell.value ?? "")), colNumber);
  });

  const phoneAliases = ["phone", "phone number", "phonenumber", "phone_number", "mobile", "cell", "whatsapp", "tel"];
  let nameCol = headerMap.get("name");
  let emailCol = headerMap.get("email");
  let phoneCol = phoneAliases.reduce<number | undefined>((found, alias) => found ?? headerMap.get(alias), undefined);
  const hasHeaders = nameCol !== undefined || emailCol !== undefined;
  const startRow = hasHeaders ? 2 : 1;

  const colCount = sheet.columnCount;
  if (!hasHeaders && colCount >= 2) {
    const colSamples: string[][] = Array.from({ length: colCount }, () => []);
    for (let r = startRow; r <= Math.min(startRow + 19, sheet.rowCount); r++) {
      const row = sheet.getRow(r);
      for (let c = 1; c <= colCount; c++) {
        colSamples[c - 1].push(String(row.getCell(c).value ?? ""));
      }
    }
    const colTypes = colSamples.map(detectColumnType);
    nameCol = colTypes.indexOf("name") + 1 || 1;
    const emailIdx = colTypes.indexOf("email");
    emailCol = emailIdx !== -1 ? emailIdx + 1 : undefined;
    const phoneIdx = colTypes.indexOf("phone");
    phoneCol = phoneIdx !== -1 ? phoneIdx + 1 : undefined;
  }

  const results: Array<{ name: string; email: string; phoneNumber: string }> = [];
  for (let r = startRow; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const name = String(row.getCell(nameCol ?? 1).value ?? "").trim();
    const email = emailCol ? String(row.getCell(emailCol).value ?? "").trim() : "";
    const phoneNumber = phoneCol ? String(row.getCell(phoneCol).value ?? "").trim() : "";
    if (name || email) {
      results.push({ name, email, phoneNumber });
    }
  }
  return results;
}

export function parseGuestsFromCsv(raw: string): Array<{ name: string; email: string; phoneNumber: string }> {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const headerRow = parseCsvRow(lines[0] ?? "").map(normalizeHeader);
  let nameIndex = headerRow.findIndex((h) => h === "name");
  let emailIndex = headerRow.findIndex((h) => h === "email");
  const phoneAliasSet = new Set(["phone", "phone number", "phonenumber", "phone_number", "mobile", "cell", "whatsapp", "tel"]);
  let phoneIndex = headerRow.findIndex((h) => phoneAliasSet.has(h));
  const hasHeaderRow = nameIndex !== -1 || emailIndex !== -1;
  const startIndex = hasHeaderRow ? 1 : 0;

  if (!hasHeaderRow) {
    const dataLines = lines.slice(startIndex, startIndex + 20);
    const parsed = dataLines.map(parseCsvRow);
    const colCount = Math.max(...parsed.map((r) => r.length));
    if (colCount >= 2) {
      const colSamples: string[][] = Array.from({ length: colCount }, () => []);
      for (const row of parsed) {
        for (let c = 0; c < colCount; c++) {
          colSamples[c].push(row[c] ?? "");
        }
      }
      const colTypes = colSamples.map(detectColumnType);
      nameIndex = colTypes.indexOf("name");
      if (nameIndex === -1) nameIndex = 0;
      emailIndex = colTypes.indexOf("email");
      phoneIndex = colTypes.indexOf("phone");
    }
  }

  return lines.slice(startIndex).map((line) => {
    const fields = parseCsvRow(line);
    const name = (fields[nameIndex !== -1 ? nameIndex : 0] ?? "").trim();
    const email = emailIndex !== -1 ? (fields[emailIndex] ?? "").trim() : "";
    const phoneNumber = phoneIndex !== -1 ? (fields[phoneIndex] ?? "").trim() : "";
    return { name, email, phoneNumber };
  });
}
