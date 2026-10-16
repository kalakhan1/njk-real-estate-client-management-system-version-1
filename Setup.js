/***************************************************************
 * NJK Real Estate — Client Manager (v2.1)
 * File: Setup.gs
 * Section: 2.x — Setup & Initialization
 * Version: 2.1.0
 * Change Log:
 *   2.0.0 — Initial release
 *   2.1.0 — Migration for AreaSize/AreaUnit + uiLanguage
 ***************************************************************/

// ============================================================
// 2.1 — MAIN SETUP
// ============================================================
function setupProject() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('Koi active Spreadsheet nahi mila.');

    // Order matters: migrate first, then ensure/format
    migrateClientsSheet_();

    ensureSheet_(SHEET_CLIENTS,   CLIENT_HEADERS);
    ensureSheet_(SHEET_SERVICES,  SERVICE_HEADERS);
    ensureSheet_(SHEET_MESSAGES,  MESSAGE_HEADERS);
    ensureSheet_(SHEET_SETTINGS,  SETTINGS_HEADERS);
    ensureSheet_(SHEET_USERS,     USER_HEADERS);

    setupSettingsDefaults_();
    seedDefaultUsers_();
    formatSheetHeaders_();

    Logger.log('✅ Setup mukammal. Version: ' + APP_VERSION);
    return { ok: true, message: 'Setup mukammal.' };
  } catch (err) {
    Logger.log('❌ Setup error: ' + err.message);
    return { ok: false, error: err.message };
  }
}

// ============================================================
// 2.2 — MIGRATION: Clients sheet me naye columns add karo
// Purana data preserve rehta hai
// ============================================================
function migrateClientsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CLIENTS);
  if (!sheet) return; // fresh install

  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return;

  const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (currentHeaders.indexOf('AreaSize') !== -1 &&
      currentHeaders.indexOf('AreaUnit') !== -1) {
    Logger.log('✅ Clients sheet already migrated (v2.1).');
    return;
  }

  // Add new headers if missing
  const newCols = [];
  if (currentHeaders.indexOf('AreaSize') === -1) newCols.push('AreaSize');
  if (currentHeaders.indexOf('AreaUnit') === -1) newCols.push('AreaUnit');

  if (newCols.length === 0) return;

  const startCol = lastCol + 1;
  sheet.getRange(1, startCol, 1, newCols.length).setValues([newCols]);

  // Fill existing rows with defaults
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const defaults = [];
    for (let i = 0; i < lastRow - 1; i++) {
      const row = [];
      if (newCols.indexOf('AreaSize') !== -1) row.push(0);
      if (newCols.indexOf('AreaUnit') !== -1) row.push(DEFAULT_AREA_UNIT);
      defaults.push(row);
    }
    sheet.getRange(2, startCol, defaults.length, newCols.length).setValues(defaults);
  }

  Logger.log('📦 Clients sheet migrated — ' + newCols.join(', ') + ' added.');
}

// ============================================================
// 2.3 — Ensure sheet + headers
// ============================================================
function ensureSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    Logger.log('➕ Nayi sheet: ' + name);
  }
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const match = headers.every(function (h, i) { return firstRow[i] === h; });
  if (!match) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    Logger.log('🔤 Headers set: ' + name);
  }
  return sheet;
}

// ============================================================
// 2.4 — Default settings
// ============================================================
function setupSettingsDefaults_() {
  const props = PropertiesService.getScriptProperties();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SETTINGS);
  const existing = sheet.getDataRange().getValues();
  const existingKeys = existing.slice(1).map(function (r) { return r[0]; });
  const now = new Date();
  const rowsToAdd = [];
  Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
    if (props.getProperty(key) === null) {
      props.setProperty(key, String(DEFAULT_SETTINGS[key]));
    }
    if (existingKeys.indexOf(key) === -1) {
      rowsToAdd.push([key, String(DEFAULT_SETTINGS[key]), now]);
    }
  });
  if (rowsToAdd.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, 3).setValues(rowsToAdd);
    Logger.log('⚙️ ' + rowsToAdd.length + ' default settings add hui.');
  }
}

// ============================================================
// 2.5 — Format headers
// ============================================================
function formatSheetHeaders_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = [SHEET_CLIENTS, SHEET_SERVICES, SHEET_MESSAGES,
                  SHEET_SETTINGS, SHEET_USERS];
  sheets.forEach(function (name) {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;
    const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    headerRange.setFontWeight('bold').setBackground('#1a237e')
      .setFontColor('#ffffff').setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 32);
  });
  Logger.log('🎨 Headers formatted.');
}

// ============================================================
// 2.6 — Verify setup
// ============================================================
function verifySetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const required = [SHEET_CLIENTS, SHEET_SERVICES, SHEET_MESSAGES,
                    SHEET_SETTINGS, SHEET_USERS];
  const report = required.map(function (name) {
    const sheet = ss.getSheetByName(name);
    return {
      sheet: name,
      exists: !!sheet,
      rows: sheet ? sheet.getLastRow() : 0,
      cols: sheet ? sheet.getLastColumn() : 0
    };
  });
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}