/***************************************************************
 * NJK Real Estate — Client Manager (v2.0)
 * File: ErrorHandler.gs
 * Section: 9.x — Error Handling & Response Wrapper
 ***************************************************************/

// ============================================================
// 9.1 — safeCall wrapper
// htmlMode = true → returns HtmlOutput (for doGet)
// htmlMode = false → returns standard response object
// ============================================================
function safeCall_(section, fn, htmlMode) {
  try {
    return fn();
  } catch (err) {
    logError_(section, err);
    if (htmlMode) {
      return HtmlService.createHtmlOutput(
        '<div style="font-family:sans-serif;padding:24px;color:#b71c1c;">' +
        '<h3>⚠️ Error [' + section + ']</h3>' +
        '<p>' + (err && err.message ? err.message : 'Unknown error') + '</p>' +
        '</div>'
      );
    }
    return returnError_(
      section,
      'E_EXCEPTION',
      err && err.message ? err.message : 'Unknown error'
    );
  }
}

// ============================================================
// 9.2 — Standard success response
// ============================================================
function returnSuccess_(data, section) {
  return {
    ok: true,
    data: data === undefined ? null : data,
    section: section || '',
    timestamp: new Date().toISOString()
  };
}

// ============================================================
// 9.3 — Standard error response
// ============================================================
function returnError_(section, code, message) {
  return {
    ok: false,
    error: {
      code: code || 'E_UNKNOWN',
      message: message || 'Kuch ghalat ho gaya.',
      section: section || ''
    },
    timestamp: new Date().toISOString()
  };
}

// ============================================================
// 9.4 — Auth error helper (shortcut)
// ============================================================
function returnAuthError_(section, message) {
  return returnError_(section, 'E_AUTH', message || 'Login zaroori hai.');
}

// ============================================================
// 9.5 — Permission error helper
// ============================================================
function returnPermissionError_(section, message) {
  return returnError_(
    section,
    'E_PERMISSION',
    message || 'Aap ko is kaam ki ijazat nahi hai.'
  );
}