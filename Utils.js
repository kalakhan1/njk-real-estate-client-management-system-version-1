/***************************************************************
 * NJK Real Estate — Client Manager (v2.0)
 * File: Utils.gs
 * Section: 8.x — Utilities / Helpers
 ***************************************************************/

// ============================================================
// 8.1 — Phone format (wa.me friendly)
// ============================================================
function formatPhone(phone) {
  try {
    if (!phone) return '';
    let p = String(phone).replace(/[^\d]/g, '');
    if (p.startsWith('0')) {
      const cc = getSetting_('countryCode') || '+92';
      p = cc.replace(/[^\d]/g, '') + p.substring(1);
    }
    return p;
  } catch (err) {
    logError_('8.1', err);
    return String(phone || '');
  }
}

// ============================================================
// 8.2 — Date format (display)
// ============================================================
function formatDate(date, format) {
  try {
    if (!date) return '';
    const d = (date instanceof Date) ? date : new Date(date);
    if (isNaN(d.getTime())) return String(date);

    const fmt = format || getSetting_('dateFormat') || 'dd-MMM-yyyy';
    const months = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'];

    const dd   = String(d.getDate()).padStart(2, '0');
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const mmm  = months[d.getMonth()];
    const yyyy = d.getFullYear();

    return fmt
      .replace('dd', dd)
      .replace('MMM', mmm)
      .replace('MM', mm)
      .replace('yyyy', yyyy);
  } catch (err) {
    logError_('8.2', err);
    return String(date || '');
  }
}

// ============================================================
// 8.3 — Sanitize input
// ============================================================
function sanitizeInput(str) {
  try {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[<>]/g, '').trim();
  } catch (err) {
    logError_('8.3', err);
    return '';
  }
}

// ============================================================
// 8.4 — Timestamp
// ============================================================
function nowTimestamp_() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd HH:mm:ss'
  );
}

// ============================================================
// 8.5 — Generate random salt (16 chars)
// ============================================================
function generateSalt_() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let salt = '';
  for (let i = 0; i < 16; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

// ============================================================
// 8.6 — SHA-256 hash of (password + salt)
// Returns hex string
// ============================================================
function hashPassword_(password, salt) {
  try {
    const raw = String(password || '') + String(salt || '');
    const digest = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      raw,
      Utilities.Charset.UTF_8
    );
    return digest.map(function (b) {
      const v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? '0' + v : v;
    }).join('');
  } catch (err) {
    logError_('8.6', err);
    return '';
  }
}

// ============================================================
// 8.7 — Generate random session token
// ============================================================
function generateToken_() {
  return Utilities.getUuid().replace(/-/g, '') +
         Utilities.getUuid().replace(/-/g, '');
}

// ============================================================
// 8.8 — Get setting (ScriptProperties first, then default)
// ============================================================
function getSetting_(key) {
  const props = PropertiesService.getScriptProperties();
  const val = props.getProperty(key);
  return (val !== null) ? val : (DEFAULT_SETTINGS[key] || '');
}

// ============================================================
// 8.9 — Number setting (int)
// ============================================================
function getSettingNum_(key, fallback) {
  const v = parseInt(getSetting_(key), 10);
  return isNaN(v) ? fallback : v;
}

// ============================================================
// 8.10 — Central error logger
// ============================================================
function logError_(section, err) {
  const msg = '[' + section + '] ' +
              (err && err.message ? err.message : String(err));
  Logger.log('❌ ' + msg);
  try {
    console.error(msg + '\n' + (err && err.stack ? err.stack : ''));
  } catch (e) { /* ignore */ }
  return msg;
}

// ============================================================
// 8.11 — Apply template variables
// {name}, {company}, {lastService}, {lastLocation}, {lastDate}
// ============================================================
function applyTemplate(template, data) {
  try {
    let out = String(template || '');
    Object.keys(data || {}).forEach(function (key) {
      const re = new RegExp('\\{' + key + '\\}', 'g');
      out = out.replace(re, String(data[key] == null ? '' : data[key]));
    });
    return out;
  } catch (err) {
    logError_('8.11', err);
    return String(template || '');
  }
}

// ============================================================
// 8.12 — Capitalize first letter
// ============================================================
function capitalize_(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}