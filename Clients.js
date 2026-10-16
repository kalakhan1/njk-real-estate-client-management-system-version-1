/***************************************************************
 * NJK Real Estate — Client Manager (v2.1)
 * File: Clients.gs
 * Section: 4.x — Clients Module
 * Version: 2.1.0
 * Change Log:
 *   2.1.0 — AreaSize + AreaUnit support
 ***************************************************************/

function getAllClients(token) {
  return safeCall_('4.1', function () {
    const auth = requireAuth_(token, 'read');
    if (!auth.ok) return auth;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CLIENTS);
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return returnSuccess_([], '4.1');
    const list = [];
    for (let i = 1; i < rows.length; i++) {
      const c = rowToClient_(rows[i]);
      if (c && !c.isDeleted) list.push(c);
    }
    return returnSuccess_(list, '4.1');
  });
}

function getClientsByStatus(token, status) {
  return safeCall_('4.2', function () {
    const auth = requireAuth_(token, 'read');
    if (!auth.ok) return auth;
    if (status !== STATUS_ACTIVE && status !== STATUS_INACTIVE) {
      return returnError_('4.2', 'E_INVALID_STATUS', 'Status must be Active or Inactive.');
    }
    const all = getAllClients(token);
    if (!all.ok) return all;
    return returnSuccess_(all.data.filter(function (c) { return c.status === status; }), '4.2');
  });
}

function getClientsCurrentWorking(token) {
  return safeCall_('4.3', function () {
    const auth = requireAuth_(token, 'read');
    if (!auth.ok) return auth;
    const all = getAllClients(token);
    if (!all.ok) return all;
    return returnSuccess_(all.data.filter(function (c) {
      return c.status === STATUS_ACTIVE && c.isCurrentWorking === true;
    }), '4.3');
  });
}

function getClientById(token, clientId) {
  return safeCall_('4.4', function () {
    const auth = requireAuth_(token, 'read');
    if (!auth.ok) return auth;
    if (!clientId) return returnError_('4.4', 'E_MISSING_ID', 'ClientID zaroori hai.');
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CLIENTS);
    const rows = sheet.getDataRange().getValues();
    let client = null;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === clientId && rows[i][11] !== true) {
        client = rowToClient_(rows[i]);
        break;
      }
    }
    if (!client) return returnError_('4.4', 'E_NOT_FOUND', 'Client nahi mila.');
    const svc = getServicesByClient(token, clientId);
    client.services = svc.ok ? svc.data : [];
    return returnSuccess_(client, '4.4');
  });
}

function addClient(token, payload) {
  return safeCall_('4.5', function () {
    const auth = requireAuth_(token, 'create');
    if (!auth.ok) return auth;
    const session = auth.session;
    if (!payload || !payload.name || !payload.phone) {
      return returnError_('4.5', 'E_MISSING_FIELDS', 'Name aur Phone zaroori hain.');
    }
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CLIENTS);
    const id = generateClientId_();
    const now = nowTimestamp_();
    const dealType = ALL_DEAL_TYPES.indexOf(payload.dealType) !== -1
      ? payload.dealType : DEAL_NOT_SET;

    // v2.1 — Area size/unit
    const areaSize = parseFloat(payload.areaSize);
    const areaSizeVal = isNaN(areaSize) ? 0 : areaSize;
    const areaUnit = AREA_UNITS.indexOf(payload.areaUnit) !== -1
      ? payload.areaUnit : DEFAULT_AREA_UNIT;

    sheet.appendRow([
      id,
      sanitizeInput(payload.name),
      sanitizeInput(payload.phone),
      sanitizeInput(payload.email || ''),
      sanitizeInput(payload.area || ''),
      sanitizeInput(payload.requirement || ''),
      dealType,
      payload.status === STATUS_INACTIVE ? STATUS_INACTIVE : STATUS_ACTIVE,
      false,
      now, now, false,
      areaSizeVal,
      areaUnit
    ]);
    return returnSuccess_({ clientId: id, createdBy: session.username }, '4.5');
  });
}

function updateClient(token, clientId, payload) {
  return safeCall_('4.6', function () {
    const auth = requireAuth_(token, 'update');
    if (!auth.ok) return auth;
    if (!clientId || !payload) {
      return returnError_('4.6', 'E_MISSING', 'ClientID aur payload zaroori hain.');
    }
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CLIENTS);
    const rows = sheet.getDataRange().getValues();
    let rowIdx = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === clientId) { rowIdx = i + 1; break; }
    }
    if (rowIdx === -1) return returnError_('4.6', 'E_NOT_FOUND', 'Client nahi mila.');

    const map = {
      name: 2, phone: 3, email: 4, area: 5, requirement: 6, dealType: 7, status: 8,
      areaSize: 13, areaUnit: 14
    };
    Object.keys(payload).forEach(function (k) {
      if (!map[k]) return;
      if (k === 'dealType' && ALL_DEAL_TYPES.indexOf(payload[k]) === -1) return;
      if (k === 'areaUnit' && AREA_UNITS.indexOf(payload[k]) === -1) return;
      if (k === 'areaSize') {
        const v = parseFloat(payload[k]);
        sheet.getRange(rowIdx, map[k]).setValue(isNaN(v) ? 0 : v);
        return;
      }
      sheet.getRange(rowIdx, map[k]).setValue(sanitizeInput(payload[k]));
    });
    sheet.getRange(rowIdx, 11).setValue(nowTimestamp_());
    return returnSuccess_({ clientId: clientId, updated: true }, '4.6');
  });
}

function toggleClientStatus(token, clientId) {
  return safeCall_('4.7', function () {
    const auth = requireAuth_(token, 'toggle_status');
    if (!auth.ok) return auth;
    if (!clientId) return returnError_('4.7', 'E_MISSING_ID', 'ClientID zaroori hai.');
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CLIENTS);
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === clientId) {
        const current = rows[i][7];
        const next = current === STATUS_ACTIVE ? STATUS_INACTIVE : STATUS_ACTIVE;
        if (next === STATUS_INACTIVE) sheet.getRange(i + 1, 9).setValue(false);
        sheet.getRange(i + 1, 8).setValue(next);
        sheet.getRange(i + 1, 11).setValue(nowTimestamp_());
        return returnSuccess_({ clientId: clientId, status: next }, '4.7');
      }
    }
    return returnError_('4.7', 'E_NOT_FOUND', 'Client nahi mila.');
  });
}

function toggleCurrentWorking(token, clientId) {
  return safeCall_('4.8', function () {
    const auth = requireAuth_(token, 'toggle_working');
    if (!auth.ok) return auth;
    if (!clientId) return returnError_('4.8', 'E_MISSING_ID', 'ClientID zaroori hai.');
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CLIENTS);
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === clientId) {
        if (rows[i][7] !== STATUS_ACTIVE) {
          return returnError_('4.8', 'E_INACTIVE',
            'Current Working sirf Active clients par laga sakte hain.');
        }
        const next = rows[i][8] !== true;
        sheet.getRange(i + 1, 9).setValue(next);
        sheet.getRange(i + 1, 11).setValue(nowTimestamp_());
        return returnSuccess_({ clientId: clientId, isCurrentWorking: next }, '4.8');
      }
    }
    return returnError_('4.8', 'E_NOT_FOUND', 'Client nahi mila.');
  });
}

function deleteClient(token, clientId) {
  return safeCall_('4.9', function () {
    const auth = requireAuth_(token, 'delete');
    if (!auth.ok) return auth;
    if (!clientId) return returnError_('4.9', 'E_MISSING_ID', 'ClientID zaroori hai.');
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CLIENTS);
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === clientId) {
        sheet.getRange(i + 1, 12).setValue(true);
        sheet.getRange(i + 1, 11).setValue(nowTimestamp_());
        return returnSuccess_({ clientId: clientId, deleted: true }, '4.9');
      }
    }
    return returnError_('4.9', 'E_NOT_FOUND', 'Client nahi mila.');
  });
}

function generateClientId_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CLIENTS);
  const lastRow = sheet.getLastRow();
  let maxNum = 0;
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    ids.forEach(function (r) {
      const m = String(r[0]).match(/(\d+)$/);
      if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
    });
  }
  return PREFIX_CLIENT + String(maxNum + 1).padStart(ID_PAD, '0');
}

// Row → client object (v2.1 — includes AreaSize, AreaUnit)
function rowToClient_(r) {
  if (!r || !r[0]) return null;
  const sizeNum = parseFloat(r[12]);
  return {
    clientId:         String(r[0]),
    name:             String(r[1] || ''),
    phone:            String(r[2] || ''),
    email:            String(r[3] || ''),
    area:             String(r[4] || ''),
    requirement:      String(r[5] || ''),
    dealType:         String(r[6] || DEAL_NOT_SET),
    status:           String(r[7] || STATUS_ACTIVE),
    isCurrentWorking: r[8] === true,
    createdAt:        r[9]  ? String(r[9])  : '',
    updatedAt:        r[10] ? String(r[10]) : '',
    isDeleted:        r[11] === true,
    areaSize:         isNaN(sizeNum) ? 0 : sizeNum,
    areaUnit:         String(r[13] || DEFAULT_AREA_UNIT)
  };
}