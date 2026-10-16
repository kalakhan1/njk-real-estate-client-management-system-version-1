/***************************************************************
 * NJK Real Estate — Client Manager (v2.0)
 * File: Services.gs
 * Section: 5.x — Services Module
 * Version: 2.0.0
 ***************************************************************/

// ============================================================
// 5.1 — Services of a client
// ============================================================
function getServicesByClient(token, clientId) {
  return safeCall_('5.1', function () {
    const auth = requireAuth_(token, 'read');
    if (!auth.ok) return auth;

    if (!clientId) return returnSuccess_([], '5.1');

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SERVICES);
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return returnSuccess_([], '5.1');

    const list = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === clientId && rows[i][8] !== true) {
        list.push(rowToService_(rows[i]));
      }
    }
    return returnSuccess_(list, '5.1');
  });
}

// ============================================================
// 5.2 — Add service (service_add permission)
// ============================================================
function addService(token, clientId, payload) {
  return safeCall_('5.2', function () {
    const auth = requireAuth_(token, 'service_add');
    if (!auth.ok) return auth;
    const session = auth.session;

    if (!clientId || !payload || !payload.serviceDetail) {
      return returnError_('5.2', 'E_MISSING', 'ClientID aur ServiceDetail zaroori hain.');
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SERVICES);
    const id = generateServiceId_();
    const now = nowTimestamp_();
    const svcDate = payload.serviceDate || now;

    sheet.appendRow([
      id,
      clientId,
      sanitizeInput(payload.serviceDetail),
      sanitizeInput(payload.location || ''),
      svcDate,
      sanitizeInput(payload.notes || ''),
      now,
      session.username,
      false
    ]);
    return returnSuccess_({ serviceId: id }, '5.2');
  });
}

// ============================================================
// 5.3 — Update service (update permission)
// ============================================================
function updateService(token, serviceId, payload) {
  return safeCall_('5.3', function () {
    const auth = requireAuth_(token, 'update');
    if (!auth.ok) return auth;

    if (!serviceId || !payload) {
      return returnError_('5.3', 'E_MISSING', 'Data adhura.');
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SERVICES);
    const rows = sheet.getDataRange().getValues();
    let rowIdx = -1;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === serviceId) { rowIdx = i + 1; break; }
    }
    if (rowIdx === -1) return returnError_('5.3', 'E_NOT_FOUND', 'Service nahi mili.');

    const map = { serviceDetail: 3, location: 4, serviceDate: 5, notes: 6 };
    Object.keys(payload).forEach(function (k) {
      if (map[k]) sheet.getRange(rowIdx, map[k]).setValue(sanitizeInput(payload[k]));
    });
    return returnSuccess_({ serviceId: serviceId, updated: true }, '5.3');
  });
}

// ============================================================
// 5.4 — Delete service (soft, service_delete permission)
// ============================================================
function deleteService(token, serviceId) {
  return safeCall_('5.4', function () {
    const auth = requireAuth_(token, 'service_delete');
    if (!auth.ok) return auth;

    if (!serviceId) return returnError_('5.4', 'E_MISSING_ID', 'ServiceID zaroori hai.');

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SERVICES);
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === serviceId) {
        sheet.getRange(i + 1, 9).setValue(true);
        return returnSuccess_({ serviceId: serviceId, deleted: true }, '5.4');
      }
    }
    return returnError_('5.4', 'E_NOT_FOUND', 'Service nahi mili.');
  });
}

// ============================================================
// 5.5 — Last service of a client (for reminder)
// ============================================================
function getLastService(token, clientId) {
  return safeCall_('5.5', function () {
    const auth = requireAuth_(token, 'read');
    if (!auth.ok) return auth;

    const all = getServicesByClient(token, clientId);
    if (!all.ok || all.data.length === 0) return returnSuccess_(null, '5.5');

    const sorted = all.data.slice().sort(function (a, b) {
      return new Date(b.serviceDate) - new Date(a.serviceDate);
    });
    return returnSuccess_(sorted[0], '5.5');
  });
}

// ============================================================
// 5.6 — Generate ServiceID
// ============================================================
function generateServiceId_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SERVICES);
  const lastRow = sheet.getLastRow();
  let maxNum = 0;

  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    ids.forEach(function (r) {
      const m = String(r[0]).match(/(\d+)$/);
      if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
    });
  }
  return PREFIX_SERVICE + String(maxNum + 1).padStart(ID_PAD, '0');
}

// ============================================================
// 5.7 — Row → service object
// ============================================================
function rowToService_(r) {
  return {
    serviceId:     String(r[0]),
    clientId:      String(r[1]),
    serviceDetail: String(r[2] || ''),
    location:      String(r[3] || ''),
    serviceDate:   r[4] ? String(r[4]) : '',
    notes:         String(r[5] || ''),
    createdAt:     r[6] ? String(r[6]) : '',
    createdBy:     String(r[7] || ''),
    isDeleted:     r[8] === true
  };
}