/**
 * Parse zones SQL dump and generate Arabic data dictionary HTML (Google Docs friendly).
 * Usage: node build-database-dictionary.mjs [path-to.sql]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TABLE_AR, FIELD_AR, TABLE_ORDER, ID_AR } from "./dictionary-descriptions-ar.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SQL = "C:/Users/aya24/Downloads/zones (2).sql";
const sqlPath = process.argv[2] || DEFAULT_SQL;

const PURPLE = "#6B5478";
const PURPLE_LIGHT = "#F0EAF4";

const THEMES = {
  default: {
    file: "database-tables-dictionary.html",
    titleAccent: PURPLE,
    headerBg: PURPLE,
    headerColor: "#ffffff",
    headerBorder: PURPLE,
    cellBorder: "1px solid #ccc",
    tableBorder: "1px solid #ccc",
    infoBg: PURPLE_LIGHT,
    infoBorder: PURPLE,
    h1Border: PURPLE,
  },
  gdocs: {
    file: "database-tables-dictionary-gdocs.html",
    titleAccent: "#000000",
    headerBg: "#f3f3f3",
    headerColor: "#000000",
    headerBorder: "#000000",
    cellBorder: "2px solid #000000",
    tableBorder: "2px solid #000000",
    infoBg: "#ffffff",
    infoBorder: "#000000",
    h1Border: "#000000",
  },
};

function readSql() {
  if (!fs.existsSync(sqlPath)) {
    console.error(`SQL file not found: ${sqlPath}`);
    process.exit(1);
  }
  return fs.readFileSync(sqlPath, "utf8");
}

function parseCreateTables(sql) {
  const tables = {};
  const re = /CREATE TABLE `([^`]+)` \(([\s\S]*?)\) ENGINE=/g;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const name = m[1];
    const body = m[2];
    const columns = [];
    for (const line of body.split("\n")) {
      const trimmed = line.trim().replace(/,$/, "");
      if (!trimmed.startsWith("`")) continue;
      const colMatch = trimmed.match(/^`([^`]+)`\s+(.+)$/);
      if (!colMatch) continue;
      const colName = colMatch[1];
      let rest = colMatch[2];
      const isAuto = /AUTO_INCREMENT/i.test(rest);
      const isUnsigned = /unsigned/i.test(rest);
      const notNull = /NOT NULL/i.test(rest);
      const nullable = !notNull;
      let defaultVal = null;
      const defMatch = rest.match(/DEFAULT\s+('([^']*)'|CURRENT_TIMESTAMP|NULL|\d+(?:\.\d+)?)/i);
      if (defMatch) defaultVal = defMatch[1].replace(/^'|'$/g, "");

      let dataType = rest;
      dataType = dataType.replace(/\s+NOT NULL.*$/i, "");
      dataType = dataType.replace(/\s+NULL.*$/i, "");
      dataType = dataType.replace(/\s+DEFAULT.*$/i, "");
      dataType = dataType.replace(/\s+AUTO_INCREMENT.*$/i, "");
      dataType = dataType.replace(/\s+ON UPDATE.*$/i, "");
      dataType = dataType.trim();

      const { typeName, size } = parseDataType(dataType);
      columns.push({
        name: colName,
        rawType: dataType,
        typeName,
        size,
        notNull,
        nullable,
        unsigned: isUnsigned,
        autoIncrement: isAuto,
        default: defaultVal,
      });
    }
    tables[name] = { name, columns };
  }
  return tables;
}

function parseDataType(raw) {
  const enumMatch = raw.match(/^enum\((.+)\)$/i);
  if (enumMatch) return { typeName: "Enum", size: "" };

  const decimalMatch = raw.match(/^decimal\(([^)]+)\)/i);
  if (decimalMatch) return { typeName: "Decimal", size: `(${decimalMatch[1]})` };

  const varcharMatch = raw.match(/^varchar\((\d+)\)/i);
  if (varcharMatch) return { typeName: "Varchar", size: varcharMatch[1] };

  const intMatch = raw.match(/^(tinyint|smallint|mediumint|int|bigint)(\(\d+\))?(\s+unsigned)?/i);
  if (intMatch) {
    const base = intMatch[1].toLowerCase();
    const map = { tinyint: "Tinyint", smallint: "Smallint", mediumint: "Mediumint", int: "Int", bigint: "Bigint" };
    const sizePart = raw.match(/\((\d+)\)/);
    return { typeName: map[base] || "Int", size: sizePart ? sizePart[1] : "" };
  }

  const simple = raw.match(/^([a-z]+)/i);
  const t = simple ? simple[1].toLowerCase() : raw;
  const map = {
    timestamp: "Timestamp",
    datetime: "Datetime",
    date: "Date",
    time: "Time",
    text: "Text",
    longtext: "Longtext",
    json: "Json",
    boolean: "Boolean",
    char: "Char",
  };
  const charMatch = raw.match(/^char\((\d+)\)/i);
  if (charMatch) return { typeName: "Char", size: charMatch[1] };
  return { typeName: map[t] || t, size: "" };
}

function parseAutoIncrement(sql) {
  const auto = {};
  for (const m of sql.matchAll(/ALTER TABLE `([^`]+)`\s+MODIFY `([^`]+)`[^;]*AUTO_INCREMENT/gi)) {
    if (!auto[m[1]]) auto[m[1]] = new Set();
    auto[m[1]].add(m[2]);
  }
  return auto;
}

function parseIndexes(sql) {
  const pk = {};
  const unique = {};
  const fk = {};

  const indexBlocks = sql.matchAll(/ALTER TABLE `([^`]+)`\s+([\s\S]*?);(?=\s*\n\s*\n|\s*\n\s*--|\s*$)/g);
  for (const block of indexBlocks) {
    const table = block[1];
    const body = block[2];
    if (!pk[table]) pk[table] = new Set();
    if (!unique[table]) unique[table] = [];
    if (!fk[table]) fk[table] = new Set();

    const pkMatch = body.match(/ADD PRIMARY KEY \(`([^`]+)`\)/);
    if (pkMatch) pk[table].add(pkMatch[1]);

    const compositePk = body.match(/ADD PRIMARY KEY \(([^)]+)\)/);
    if (compositePk && !pkMatch) {
      compositePk[1].split(",").forEach((c) => pk[table].add(c.trim().replace(/`/g, "")));
    }

    for (const uq of body.matchAll(/ADD UNIQUE KEY[^`]*`([^`]+)` \(([^)]+)\)/g)) {
      const cols = uq[2].split(",").map((c) => c.trim().replace(/`/g, ""));
      unique[table].push(cols);
    }

    for (const fkMatch of body.matchAll(/ADD CONSTRAINT `[^`]+` FOREIGN KEY \(`([^`]+)`\) REFERENCES `([^`]+)`/g)) {
      fk[table].add(fkMatch[1]);
    }
  }
  return { pk, unique, fk };
}

function isUniqueCol(table, col, unique) {
  const list = unique[table] || [];
  return list.some((cols) => cols.length === 1 && cols[0] === col);
}

function isCompositeUnique(table, col, unique) {
  const list = unique[table] || [];
  return list.some((cols) => cols.length > 1 && cols.includes(col));
}

function buildAttributes(table, col, meta) {
  const attrs = [];
  const { pk, unique, fk, autoIncrement } = meta;
  if (pk[table]?.has(col.name)) attrs.push("PK");
  if (fk[table]?.has(col.name)) attrs.push("FK");
  if (isUniqueCol(table, col.name, unique)) attrs.push("Unique");
  if (isCompositeUnique(table, col.name, unique)) attrs.push("Composite Unique");
  if (col.notNull) attrs.push("Not Null");
  else attrs.push("Null");
  if (col.unsigned) attrs.push("Unsigned");
  if (col.autoIncrement || autoIncrement[table]?.has(col.name)) attrs.push("Auto_Increment");
  if (col.default !== null && col.default !== undefined && col.default !== "" && col.default.toUpperCase() !== "NULL") {
    attrs.push(`Default '${col.default}'`);
  }
  return attrs.join(", ");
}

function describeField(table, col) {
  if (col.name === "id") {
    return ID_AR[table] || "الرقم التسلسلي للسجل";
  }
  if (FIELD_AR[col.name]) return FIELD_AR[col.name];
  if (col.name.endsWith("_id")) {
    const ref = col.name.replace(/_id$/, "").replace(/_/g, " ");
    return `المفتاح الأجنبي للربط بـ ${ref}`;
  }
  return `حقل ${col.name.replace(/_/g, " ")} في جدول ${TABLE_AR[table] || table}`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildTableHtml(tableName, tableData, index, meta, theme) {
  const arTitle = TABLE_AR[tableName] || tableName;
  const thStyle = `border:${theme.cellBorder};padding:10px;text-align:center;background-color:${theme.headerBg};color:${theme.headerColor};font-weight:bold;`;
  const tdStyle = `border:${theme.cellBorder};padding:8px;text-align:right;`;
  const tdCenter = `border:${theme.cellBorder};padding:8px;text-align:center;`;

  const rows = tableData.columns
    .map((col) => {
      const attrs = buildAttributes(tableName, col, meta);
      const desc = describeField(tableName, col);
      return `<tr>
  <td style="${tdStyle}">${escapeHtml(col.name)}</td>
  <td style="${tdStyle}">${escapeHtml(desc)}</td>
  <td style="${tdCenter}">${escapeHtml(col.typeName)}</td>
  <td style="${tdCenter}">${escapeHtml(col.size || "—")}</td>
  <td style="${tdStyle}">${escapeHtml(attrs)}</td>
</tr>`;
    })
    .join("\n");

  return `
<h2 style="color:${theme.titleAccent};font-size:16pt;margin-top:28px;margin-bottom:8px;font-weight:bold;">الجدول (${index}.4) — قاموس البيانات لجدول ${escapeHtml(arTitle)}</h2>
<p style="text-align:right;line-height:1.8;margin-bottom:12px;">يوضّح الجدول (${index}.4) الهيكل التفصيلي لجدول <strong>${escapeHtml(arTitle)}</strong> (<code>${escapeHtml(tableName)}</code>) في قاعدة بيانات منصة ZONES.</p>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;border:${theme.tableBorder};margin-bottom:24px;direction:rtl;font-family:Arial,sans-serif;font-size:11pt;">
  <thead>
    <tr>
      <th style="${thStyle}">اسم الحقل</th>
      <th style="${thStyle}">الوصف</th>
      <th style="${thStyle}">نوع البيانات</th>
      <th style="${thStyle}">حجم الحقل</th>
      <th style="${thStyle}">خصائص الحقل</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>`;
}

function buildHtml(tables, meta, theme) {
  const ordered = TABLE_ORDER.filter((t) => tables[t]);
  const sections = ordered.map((name, i) => buildTableHtml(name, tables[name], i + 1, meta, theme)).join("\n");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>قاموس بيانات جداول قاعدة بيانات ZONES</title>
</head>
<body style="font-family:Arial,Tahoma,sans-serif;direction:rtl;text-align:right;max-width:900px;margin:24px auto;padding:16px;color:#000;line-height:1.7;">

<h1 style="color:${theme.titleAccent};font-size:22pt;border-bottom:3px solid ${theme.h1Border};padding-bottom:12px;font-weight:bold;">جداول قاعدة البيانات — منصة ZONES</h1>

<p style="font-size:12pt;line-height:1.9;margin:16px 0;">
في هذا الجزء، يتم استعراض الهيكل التفصيلي والمنطقي لكل جدول من جداول قاعدة البيانات الخاصة بمنصة ZONES لإدارة صالات الألعاب والحجوزات. يمثل كل جدول ترجمة عملية لأحد الكيانات التي تم تحديدها في مخطط علاقات الكيانات (ERD)، ويضم مجموعة من الحقول التي تمثل خصائص ذلك الكيان. تم استخراج الهيكل من ملف SQL الفعلي وترحيلات Laravel.
</p>

<p style="background:${theme.infoBg};padding:12px 16px;border:2px solid ${theme.infoBorder};margin:20px 0;">
<strong>مصدر البيانات:</strong> ${escapeHtml(path.basename(sqlPath))}<br>
<strong>عدد الجداول الموثّقة:</strong> ${ordered.length} جدول<br>
<strong>تاريخ التوليد:</strong> ${new Date().toLocaleDateString("ar-SA")}
</p>

${sections}

<hr style="margin-top:40px;border:none;border-top:2px solid #000;">
<p style="color:#333;font-size:10pt;text-align:center;">ZONES Platform — Data Dictionary — Generated automatically from SQL schema</p>

</body>
</html>`;
}

const sql = readSql();
const tables = parseCreateTables(sql);
const meta = { ...parseIndexes(sql), autoIncrement: parseAutoIncrement(sql) };

for (const theme of Object.values(THEMES)) {
  const html = buildHtml(tables, meta, theme);
  const outPath = path.join(__dirname, theme.file);
  fs.writeFileSync(outPath, html, "utf8");
  console.log(`Generated: ${outPath}`);
}
console.log(`Tables: ${TABLE_ORDER.filter((t) => tables[t]).length}`);
