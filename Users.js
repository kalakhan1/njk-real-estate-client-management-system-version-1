/***************************************************************
 * NJK Real Estate — Client Manager (v2.0)
 * File: Users.gs
 * Section: 3.x — Users Module (admin only)
 * Version: 2.0.0
 ***************************************************************/

// ============================================================
// 3.1 — All users (admin only)
// ============================================================
function getAllUsers(token) {
  return safeCall_('3.1', function () {
    const auth = requireAuth_(token, 'users');
    if (!auth.ok) return auth;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    const rows = sheet.getDataRange().getValues();
    const list = [];

    for (let i = 1; i < rows.length; i++) {
      const u = rowToUser_(rows[i]);
      if (u && !u.isDeleted) {
        list.push({
          username:    u.username,
          displayName: u.displayName,
          role:        u.role,
          isActive:    u.isActive,
          lastLogin:   u.lastLogin,
          createdAt:   u.createdAt,
          createdBy:   u.createdBy
        });
      }
    }
    return returnSuccess_(list, '3.1');
  });
}

// ============================================================
// 3.2 — Add user (admin only)
// payload: { username, password, displayName, role }
// Role must be Normal or Custom (Admin can't be created)
// ============================================================
function addUser(token, payload) {
  return safeCall_('3.2', function () {
    const auth = requireAuth_(token, 'users');
    if (!auth.ok) return auth;
    const session = auth.session;

    if (!payload || !payload.username || !payload.password) {
      return returnError_('3.2', 'E_MISSING', 'Username aur password zaroori hain.');
    }

    const username = String(payload.username).trim().toLowerCase();
    if (!/^[a-z0-9_.-]{3,30}$/.test(username)) {
      return returnError_('3.2', 'E_INVALID_USERNAME',
        'Username 3-30 chars, sirf letters/numbers/_/./-');
    }
    if (String(payload.password).length < 4) {
      return returnError_('3.2', 'E_WEAK_PASSWORD', 'Password 4+ chars ka hona chahiye.');
    }

    const role = payload.role === ROLE_CUSTOM ? ROLE_CUSTOM : ROLE_NORMAL;

    // Duplicate check
    if (getUserByUsername_(username)) {
      return returnError_('3.2', 'E_DUPLICATE', 'Yeh username pehle se maujood hai.');
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    const salt = generateSalt_();
    const hash = hashPassword_(payload.password, salt);
    const now  = nowTimestamp_();

    sheet.appendRow([
      username,
      hash,
      salt,
      sanitizeInput(payload.displayName || username),
      role,
      true,
      '',
      now,
      session.username,
      false
    ]);

    return returnSuccess_({ username: username, role: role }, '3.2');
  });
}

// ============================================================
// 3.3 — Update user (admin only)
// payload: { displayName, role, isActive }
// Username change allowed nahi
// ============================================================
function updateUser(token, username, payload) {
  return safeCall_('3.3', function () {
    const auth = requireAuth_(token, 'users');
    if (!auth.ok) return auth;

    if (!username || !payload) {
      return returnError_('3.3', 'E_MISSING', 'Username aur payload zaroori hain.');
    }

    const target = String(username).toLowerCase();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    const rows = sheet.getDataRange().getValues();
    let rowIdx = -1;
    let isSelf = false;
    let targetRole = '';

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).toLowerCase() === target) {
        rowIdx = i + 1;
        targetRole = String(rows[i][4]);
        isSelf = (target === String(auth.session.username).toLowerCase());
        break;
      }
    }
    if (rowIdx === -1) return returnError_('3.3', 'E_NOT_FOUND', 'User nahi mila.');

    // Safety: admin apna role change nahi kar sakta
    if (isSelf && payload.role && payload.role !== ROLE_ADMIN) {
      return returnError_('3.3', 'E_SELF_ROLE', 'Apna role change nahi kar sakte.');
    }
    // Safety: agar target Admin hai to role change allowed nahi
    if (targetRole === ROLE_ADMIN && payload.role && payload.role !== ROLE_ADMIN) {
      return returnError_('3.3', 'E_ADMIN_PROTECT', 'Admin ka role change nahi ho sakta.');
    }

    if (payload.displayName !== undefined) {
      sheet.getRange(rowIdx, 4).setValue(sanitizeInput(payload.displayName));
    }
    if (payload.role && (payload.role === ROLE_NORMAL || payload.role === ROLE_CUSTOM)) {
      sheet.getRange(rowIdx, 5).setValue(payload.role);
    }
    if (payload.isActive !== undefined) {
      if (isSelf && !payload.isActive) {
        return returnError_('3.3', 'E_SELF_DEACT', 'Apne aap ko deactivate nahi kar sakte.');
      }
      sheet.getRange(rowIdx, 6).setValue(payload.isActive === true);
    }

    return returnSuccess_({ username: target, updated: true }, '3.3');
  });
}

// ============================================================
// 3.4 — Reset user password (admin only)
// ============================================================
function resetUserPassword(token, username, newPassword) {
  return safeCall_('3.4', function () {
    const auth = requireAuth_(token, 'users');
    if (!auth.ok) return auth;

    if (!username || !newPassword) {
      return returnError_('3.4', 'E_MISSING', 'Username aur naya password zaroori hai.');
    }
    if (String(newPassword).length < 4) {
      return returnError_('3.4', 'E_WEAK_PASSWORD', 'Password 4+ chars ka hona chahiye.');
    }

    const target = String(username).toLowerCase();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    const rows = sheet.getDataRange().getValues();
    let rowIdx = -1;

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).toLowerCase() === target) { rowIdx = i + 1; break; }
    }
    if (rowIdx === -1) return returnError_('3.4', 'E_NOT_FOUND', 'User nahi mila.');

    const salt = generateSalt_();
    const hash = hashPassword_(newPassword, salt);
    sheet.getRange(rowIdx, 2).setValue(hash);
    sheet.getRange(rowIdx, 3).setValue(salt);

    return returnSuccess_({ username: target, passwordReset: true }, '3.4');
  });
}

// ============================================================
// 3.5 — Toggle user active/inactive (admin only)
// ============================================================
function toggleUserActive(token, username) {
  return safeCall_('3.5', function () {
    const auth = requireAuth_(token, 'users');
    if (!auth.ok) return auth;

    const target = String(username || '').toLowerCase();
    if (!target) return returnError_('3.5', 'E_MISSING', 'Username zaroori hai.');

    // Self protect
    if (target === String(auth.session.username).toLowerCase()) {
      return returnError_('3.5', 'E_SELF_DEACT', 'Apne aap ko deactivate nahi kar sakte.');
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).toLowerCase() === target) {
        if (String(rows[i][4]) === ROLE_ADMIN) {
          return returnError_('3.5', 'E_ADMIN_PROTECT', 'Admin ko deactivate nahi kar sakte.');
        }
        const next = rows[i][5] === true ? false : true;
        sheet.getRange(i + 1, 6).setValue(next);
        return returnSuccess_({ username: target, isActive: next }, '3.5');
      }
    }
    return returnError_('3.5', 'E_NOT_FOUND', 'User nahi mila.');
  });
}

// ============================================================
// 3.6 — Delete user (soft delete, admin only)
// ============================================================
function deleteUser(token, username) {
  return safeCall_('3.6', function () {
    const auth = requireAuth_(token, 'users');
    if (!auth.ok) return auth;

    const target = String(username || '').toLowerCase();
    if (!target) return returnError_('3.6', 'E_MISSING', 'Username zaroori hai.');

    if (target === String(auth.session.username).toLowerCase()) {
      return returnError_('3.6', 'E_SELF_DELETE', 'Apne aap ko delete nahi kar sakte.');
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).toLowerCase() === target) {
        if (String(rows[i][4]) === ROLE_ADMIN) {
          return returnError_('3.6', 'E_ADMIN_PROTECT', 'Admin ko delete nahi kar sakte.');
        }
        sheet.getRange(i + 1, 10).setValue(true);
        return returnSuccess_({ username: target, deleted: true }, '3.6');
      }
    }
    return returnError_('3.6', 'E_NOT_FOUND', 'User nahi mila.');
  });
}