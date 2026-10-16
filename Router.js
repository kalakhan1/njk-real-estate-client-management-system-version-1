/***************************************************************
 * NJK Real Estate — Client Manager (v2.0)
 * File: Router.gs
 * Section: 1.x — Core / Router
 * Version: 2.0.1
 * Change Log:
 *   2.0.0 — Initial release
 *   2.0.1 — Added fallback error handling for doGet
 ***************************************************************/

// ============================================================
// 1.1 — Web App entry point
// ============================================================
function doGet(e) {
  try {
    const template = HtmlService.createTemplateFromFile('Index');
    return template
      .evaluate()
      .setTitle(APP_NAME)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    // Fallback: agar Index.html me koi error ho to simple HTML dikhao
    const msg = (err && err.message) ? err.message : 'Unknown error';
    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif;padding:24px;">' +
      '<h2 style="color:#b71c1c;">⚠️ doGet Error</h2>' +
      '<p><b>Message:</b> ' + msg + '</p>' +
      '<p style="color:#666;font-size:12px;">' +
      'Possible: Index.html missing or has syntax error.' +
      '</p>' +
      '</div>'
    );
  }
}

// ============================================================
// 1.2 — Include partial HTML files
// ============================================================
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================================
// 1.3 — Script version
// ============================================================
function getScriptVersion() {
  return { version: APP_VERSION, buildDate: BUILD_DATE };
}

// ============================================================
// 1.4 — Check if setup is done
// ============================================================
function checkSetupStatus() {
  return safeCall_('1.4', function () {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const required = [SHEET_CLIENTS, SHEET_SERVICES,
                        SHEET_MESSAGES, SHEET_SETTINGS, SHEET_USERS];
      const missing = required.filter(function (name) {
        return !ss.getSheetByName(name);
      });
      return returnSuccess_({
        setupDone: missing.length === 0,
        missing:   missing
      }, '1.4');
    } catch (err) {
      return returnError_('1.4', 'E_SETUP_CHECK', err.message);
    }
  });
}