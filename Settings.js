/***************************************************************
 * NJK Real Estate — Client Manager (v2.0)
 * File: Settings.gs
 * Section: 7.x — Settings Module
 * Version: 2.0.0
 ***************************************************************/

// ============================================================
// 7.1 — PUBLIC settings (no auth) — for login page branding
// Returns only companyName, tagline, logoUrl
// ============================================================
function getPublicSettings() {
  return safeCall_('7.1', function () {
    return returnSuccess_({
      companyName: getSetting_('companyName'),
      tagline:     getSetting_('tagline'),
      logoUrl:     getSetting_('logoUrl')
    }, '7.1');
  });
}

// ============================================================
// 7.2 — Full settings (admin only — 'settings' permission)
// ============================================================
function getSettings(token) {
  return safeCall_('7.2', function () {
    const auth = requireAuth_(token, 'settings');
    if (!auth.ok) return auth;

    const props = PropertiesService.getScriptProperties();
    const all = props.getProperties();
    const settings = {};

    Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
      settings[key] = (all[key] !== undefined)
        ? all[key] : String(DEFAULT_SETTINGS[key]);
    });

    // Type casts
    settings.sessionHours     = parseInt(settings.sessionHours, 10) || 24;
    settings.maxLoginAttempts = parseInt(settings.maxLoginAttempts, 10) || 5;
    settings.lockoutMinutes   = parseInt(settings.lockoutMinutes, 10) || 15;

    return returnSuccess_(settings, '7.2');
  });
}

// ============================================================
// 7.3 — Update settings (admin only)
// ============================================================
function updateSettings(token, payload) {
  return safeCall_('7.3', function () {
    const auth = requireAuth_(token, 'settings');
    if (!auth.ok) return auth;

    if (!payload || typeof payload !== 'object') {
      return returnError_('7.3', 'E_INVALID', 'Settings payload zaroori hai.');
    }

    const props = PropertiesService.getScriptProperties();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SETTINGS);
    const now = new Date();
    const updated = [];
    const sheetData = sheet.getDataRange().getValues();

    Object.keys(payload).forEach(function (key) {
      if (!(key in DEFAULT_SETTINGS)) return;
      const value = String(payload[key]);
      props.setProperty(key, value);

      let found = false;
      for (let i = 1; i < sheetData.length; i++) {
        if (sheetData[i][0] === key) {
          sheet.getRange(i + 1, 2, 1, 2).setValues([[value, now]]);
          found = true; break;
        }
      }
      if (!found) sheet.appendRow([key, value, now]);
      updated.push(key);
    });

    return returnSuccess_({ updated: updated, count: updated.length }, '7.3');
  });
}

// ============================================================
// 7.4 — Reset settings to defaults (admin only)
// ============================================================
function resetSettings(token) {
  return safeCall_('7.4', function () {
    const auth = requireAuth_(token, 'settings');
    if (!auth.ok) return auth;

    const props = PropertiesService.getScriptProperties();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SETTINGS);
    const now = new Date();

    Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
      props.setProperty(key, String(DEFAULT_SETTINGS[key]));
    });

    const rows = Object.keys(DEFAULT_SETTINGS).map(function (key) {
      return [key, String(DEFAULT_SETTINGS[key]), now];
    });
    sheet.clear();
    sheet.getRange(1, 1, 1, SETTINGS_HEADERS.length).setValues([SETTINGS_HEADERS]);
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);

    return returnSuccess_({ reset: true }, '7.4');
  });
}

// ============================================================
// 7.5 — Stats (dashboard)
// ============================================================
function getDashboardStats(token) {
  return safeCall_('7.5', function () {
    const auth = requireAuth_(token, 'read');
    if (!auth.ok) return auth;

    const all = getAllClients(token);
    if (!all.ok) return all;
    const clients = all.data;

    const active   = clients.filter(function (c) { return c.status === STATUS_ACTIVE; }).length;
    const inactive = clients.filter(function (c) { return c.status === STATUS_INACTIVE; }).length;
    const working  = clients.filter(function (c) {
      return c.status === STATUS_ACTIVE && c.isCurrentWorking === true;
    }).length;

    return returnSuccess_({
      total: clients.length,
      active: active,
      inactive: inactive,
      currentWorking: working
    }, '7.5');
  });
}