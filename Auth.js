/***************************************************************
 * NJK Real Estate — Client Manager (v2.0)
 * File: Auth.gs
 * Section: 10.x — Authentication & Session Management
 ***************************************************************/

// ============================================================
// 10.1 — LOGIN
// Public function — no token needed
// Returns { token, username, displayName, role }
// ============================================================
function login(username, password) {
  return safeCall_('10.1', function () {
    username = String(username || '').trim().toLowerCase();
    password = String(password || '');

    if (!username || !password) {
      return returnError_('10.1', 'E_MISSING', 'Username aur password zaroori hain.');
    }

    // 10.1.1 — Lockout check
    if (isAccountLocked_(username)) {
      const mins = getSettingNum_('lockoutMinutes', 15);
      return returnError_('10.1', 'E_LOCKED',
        'Account temporarily locked. ' + mins + ' minutes baad try karein.');
    }

    // 10.1.2 — User fetch
    const user = getUserByUsername_(username);
    if (!user || user.isDeleted || !user.isActive) {
      recordFailedAttempt_(username);
      return returnError_('10.1', 'E_INVALID', 'Username ya password ghalat hai.');
    }

    // 10.1.3 — Password verify
    const hash = hashPassword_(password, user.salt);
    if (hash !== user.passwordHash) {
      recordFailedAttempt_(username);
      const remaining = getSettingNum_('maxLoginAttempts', 5) - getFailedAttempts_(username);
      const extra = remaining > 0 ? ' (' + remaining + ' attempts baaki)' : '';
      return returnError_('10.1', 'E_INVALID', 'Username ya password ghalat hai.' + extra);
    }

    // 10.1.4 — Success: clear failures, generate token
    clearFailedAttempts_(username);
    const token = generateToken_();
    const hours = getSettingNum_('sessionHours', 24);

    const sessionData = {
      username:    user.username,
      displayName: user.displayName,
      role:        user.role,
      loginTime:   new Date().toISOString()
    };

    CacheService.getScriptCache().put(
      CACHE_PREFIX_TOKEN + token,
      JSON.stringify(sessionData),
      hours * 3600
    );

    // 10.1.5 — Update LastLogin
    try { updateUserLastLogin_(username); } catch (e) { /* silent */ }

    return returnSuccess_({
      token:       token,
      username:    user.username,
      displayName: user.displayName,
      role:        user.role,
      expiresIn:   hours * 3600
    }, '10.1');
  });
}

// ============================================================
// 10.2 — LOGOUT
// ============================================================
function logout(token) {
  return safeCall_('10.2', function () {
    if (token) {
      CacheService.getScriptCache().remove(CACHE_PREFIX_TOKEN + token);
    }
    return returnSuccess_({ loggedOut: true }, '10.2');
  });
}

// ============================================================
// 10.3 — Get current user (validate token)
// Returns { username, displayName, role } or null
// ============================================================
function getCurrentUser(token) {
  return safeCall_('10.3', function () {
    const session = validateToken_(token);
    if (!session) {
      return returnError_('10.3', 'E_AUTH', 'Session expire ho gayi. Dobara login karein.');
    }
    return returnSuccess_(session, '10.3');
  });
}

// ============================================================
// 10.4 — Validate token (internal)
// Returns session object or null
// ============================================================
function validateToken_(token) {
  if (!token) return null;
  try {
    const raw = CacheService.getScriptCache().get(CACHE_PREFIX_TOKEN + token);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// ============================================================
// 10.5 — RBAC check (internal)
// Throws nothing; returns session object or throws error
// Usage inside a data function:
//   const session = requireAuth_(token, 'update');
//   if (!session.ok) return session;
// ============================================================
function requireAuth_(token, permission) {
  const session = validateToken_(token);
  if (!session) {
    return returnAuthError_('RBAC', 'Session expire ho gayi. Dobara login karein.');
  }

  if (permission) {
    const perms = PERMISSIONS[session.role] || [];
    if (perms.indexOf(permission) === -1) {
      return returnPermissionError_('RBAC',
        'Aap ke role (' + session.role + ') ko yeh kaam karne ki ijazat nahi.');
    }
  }

  // Return a special "success envelope" that data functions understand
  return { ok: true, session: session };
}

// ============================================================
// 10.6 — Get user by username (internal)
// Returns user object or null
// ============================================================
function getUserByUsername_(username) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_USERS);
    if (!sheet) return null;

    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return null;

    const u = String(username).toLowerCase();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).toLowerCase() === u) {
        return rowToUser_(rows[i]);
      }
    }
    return null;
  } catch (e) {
    logError_('10.6', e);
    return null;
  }
}

// ============================================================
// 10.7 — Row → user object
// ============================================================
function rowToUser_(r) {
  if (!r || !r[0]) return null;
  return {
    username:     String(r[0]),
    passwordHash: String(r[1] || ''),
    salt:         String(r[2] || ''),
    displayName:  String(r[3] || r[0]),
    role:         String(r[4] || ROLE_NORMAL),
    isActive:     r[5] !== false,
    lastLogin:    r[6] ? String(r[6]) : '',
    createdAt:    r[7] ? String(r[7]) : '',
    createdBy:    String(r[8] || 'system'),
    isDeleted:    r[9] === true
  };
}

// ============================================================
// 10.8 — Update last login timestamp (internal)
// ============================================================
function updateUserLastLogin_(username) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return;
  const rows = sheet.getDataRange().getValues();
  const u = String(username).toLowerCase();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toLowerCase() === u) {
      sheet.getRange(i + 1, 7).setValue(nowTimestamp_());
      return;
    }
  }
}

// ============================================================
// 10.9 — Failed attempts tracking (per username)
// ============================================================
function getFailedAttempts_(username) {
  const v = CacheService.getScriptCache().get(CACHE_PREFIX_FAIL + username);
  return v ? parseInt(v, 10) : 0;
}

function recordFailedAttempt_(username) {
  const max = getSettingNum_('maxLoginAttempts', 5);
  const lockMin = getSettingNum_('lockoutMinutes', 15);
  const attempts = getFailedAttempts_(username) + 1;

  CacheService.getScriptCache().put(
    CACHE_PREFIX_FAIL + username,
    String(attempts),
    lockMin * 60
  );

  if (attempts >= max) {
    CacheService.getScriptCache().put(
      CACHE_PREFIX_LOCK + username,
      'locked',
      lockMin * 60
    );
  }
}

function clearFailedAttempts_(username) {
  CacheService.getScriptCache().remove(CACHE_PREFIX_FAIL + username);
  CacheService.getScriptCache().remove(CACHE_PREFIX_LOCK + username);
}

function isAccountLocked_(username) {
  return CacheService.getScriptCache().get(CACHE_PREFIX_LOCK + username) !== null;
}

// ============================================================
// 10.10 — Seed default users (called from Setup)
// ============================================================
function seedDefaultUsers_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_USERS);
    sheet.getRange(1, 1, 1, USER_HEADERS.length).setValues([USER_HEADERS]);
  }

  const existing = sheet.getDataRange().getValues();
  const existingNames = existing.slice(1).map(function (r) {
    return String(r[0]).toLowerCase();
  });

  const now = nowTimestamp_();
  let added = 0;

  DEFAULT_USERS.forEach(function (u) {
    if (existingNames.indexOf(u.username.toLowerCase()) !== -1) return;

    const salt = generateSalt_();
    const hash = hashPassword_(u.password, salt);

    sheet.appendRow([
      u.username,
      hash,
      salt,
      u.displayName,
      u.role,
      true,
      '',
      now,
      'system',
      false
    ]);
    added++;
  });

  Logger.log('👤 Seeded ' + added + ' default users.');
  return added;
}