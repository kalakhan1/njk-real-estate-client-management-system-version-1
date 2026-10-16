/***************************************************************
 * NJK Real Estate — Client Manager (v2.0)
 * File: Messages.gs
 * Section: 6.x — Messages / WhatsApp Module
 * Version: 2.0.1
 * Change Log:
 *   2.0.0 — Initial release
 *   2.0.1 — Bilingual message types (Roman + English)
 ***************************************************************/

// ============================================================
// 6.1 — Build WhatsApp message
// type: 'WelcomeRoman' | 'WelcomeEnglish' | 'ReminderRoman'
//       | 'ReminderEnglish' | 'Blank'
// Backward compat: 'Welcome' → WelcomeRoman, 'Reminder' → ReminderRoman
// ============================================================
function buildWhatsAppMessage(token, clientId, type) {
  return safeCall_('6.1', function () {
    const auth = requireAuth_(token, 'whatsapp');
    if (!auth.ok) return auth;
    const session = auth.session;

    if (!clientId) return returnError_('6.1', 'E_MISSING_ID', 'ClientID zaroori hai.');

    const cResult = getClientById(token, clientId);
    if (!cResult.ok) return cResult;
    const client = cResult.data;

    const company = getSetting_('companyName');

    // Normalize legacy types
    if (type === MSG_WELCOME)  type = MSG_WELCOME_ROMAN;
    if (type === MSG_REMINDER) type = MSG_REMINDER_ROMAN;

    // --- Blank ---
    if (type === MSG_BLANK) {
      logMessageSent_(clientId, MSG_BLANK, '', session.username);
      return returnSuccess_({ phone: formatPhone(client.phone), text: '' }, '6.1');
    }

    // --- Reminder (Roman / English) ---
    if (type === MSG_REMINDER_ROMAN || type === MSG_REMINDER_ENGLISH) {
      const tplKey = (type === MSG_REMINDER_ENGLISH)
        ? 'reminderTemplateEnglish'
        : 'reminderTemplateRoman';
      const fallbackKey = (type === MSG_REMINDER_ENGLISH)
        ? 'reminderTemplate' : 'reminderTemplate';

      const lastSvc = (client.services && client.services.length > 0)
        ? client.services.slice().sort(function (a, b) {
            return new Date(b.serviceDate) - new Date(a.serviceDate);
          })[0]
        : null;

      // No service → fallback to welcome (same language)
      if (!lastSvc) {
        const wType = (type === MSG_REMINDER_ENGLISH)
          ? MSG_WELCOME_ENGLISH : MSG_WELCOME_ROMAN;
        const wTplKey = (wType === MSG_WELCOME_ENGLISH)
          ? 'welcomeTemplateEnglish' : 'welcomeTemplateRoman';
        const wText = applyTemplate(
          getSetting_(wTplKey) || getSetting_('welcomeTemplate'),
          { name: client.name, company: company }
        );
        logMessageSent_(clientId, wType, wText, session.username);
        return returnSuccess_({
          phone: formatPhone(client.phone), text: wText, fallback: 'welcome'
        }, '6.1');
      }

      const template = getSetting_(tplKey) || getSetting_(fallbackKey);
      const rText = applyTemplate(template, {
        name:         client.name,
        company:      company,
        lastService:  lastSvc.serviceDetail,
        lastLocation: lastSvc.location,
        lastDate:     formatDate(lastSvc.serviceDate)
      });
      logMessageSent_(clientId, type, rText, session.username);
      return returnSuccess_({ phone: formatPhone(client.phone), text: rText }, '6.1');
    }

    // --- Welcome (Roman / English) — default ---
    const tplKey = (type === MSG_WELCOME_ENGLISH)
      ? 'welcomeTemplateEnglish' : 'welcomeTemplateRoman';
    const template = getSetting_(tplKey) || getSetting_('welcomeTemplate');
    const wText = applyTemplate(template, {
      name: client.name, company: company
    });
    logMessageSent_(clientId, type || MSG_WELCOME_ROMAN, wText, session.username);
    return returnSuccess_({ phone: formatPhone(client.phone), text: wText }, '6.1');
  });
}

// ============================================================
// 6.2 — Log message (internal)
// ============================================================
function logMessageSent_(clientId, type, text, username) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MESSAGES);
    const logId = generateLogId_();
    sheet.appendRow([
      logId, clientId, type,
      String(text || '').substring(0, 500),
      username || 'system',
      nowTimestamp_()
    ]);
    return true;
  } catch (e) {
    logError_('6.2', e);
    return false;
  }
}

// ============================================================
// 6.3 — Message history of client
// ============================================================
function getMessageHistory(token, clientId) {
  return safeCall_('6.3', function () {
    const auth = requireAuth_(token, 'read');
    if (!auth.ok) return auth;
    if (!clientId) return returnSuccess_([], '6.3');

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MESSAGES);
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return returnSuccess_([], '6.3');

    const list = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === clientId) {
        list.push({
          logId:       String(rows[i][0]),
          clientId:    String(rows[i][1]),
          messageType: String(rows[i][2]),
          messageText: String(rows[i][3]),
          sentBy:      String(rows[i][4]),
          sentAt:      String(rows[i][5])
        });
      }
    }
    return returnSuccess_(list, '6.3');
  });
}

// ============================================================
// 6.4 — Generate LogID
// ============================================================
function generateLogId_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MESSAGES);
  const lastRow = sheet.getLastRow();
  let maxNum = 0;
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    ids.forEach(function (r) {
      const m = String(r[0]).match(/(\d+)$/);
      if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
    });
  }
  return PREFIX_LOG + String(maxNum + 1).padStart(ID_PAD, '0');
}