/***************************************************************
 * NJK Real Estate — Client Manager (v2.1)
 * File: Config.gs
 * Section: 0.x — Global Configuration
 * Version: 2.1.0
 * Change Log:
 *   2.0.0 — Initial release
 *   2.0.1 — Bilingual templates
 *   2.1.0 — AreaSize + AreaUnit, uiLanguage setting
 ***************************************************************/

const APP_VERSION    = '2.1.0';
const APP_NAME       = 'NJK Real Estate — Client Manager';
const BUILD_DATE     = '2026-10-16';

// ============================================================
// 0.2 — SHEET NAMES
// ============================================================
const SHEET_CLIENTS   = 'Clients';
const SHEET_SERVICES  = 'Services';
const SHEET_MESSAGES  = 'Messages';
const SHEET_SETTINGS  = 'Settings';
const SHEET_USERS     = 'Users';

// ============================================================
// 0.3 — CLIENT HEADERS (v2.1 — AreaSize + AreaUnit appended)
// ============================================================
const CLIENT_HEADERS = [
  'ClientID', 'Name', 'Phone', 'Email', 'Area', 'Requirement',
  'DealType', 'Status', 'IsCurrentWorking', 'CreatedAt', 'UpdatedAt', 'IsDeleted',
  'AreaSize', 'AreaUnit'
];

// ============================================================
// 0.4 — AREA UNITS (v2.1)
// ============================================================
const AREA_UNITS = ['sqft', 'sqyds', 'sqmtr', 'acres'];
const DEFAULT_AREA_UNIT = 'sqft';

// ============================================================
// 0.5 — SERVICE HEADERS
// ============================================================
const SERVICE_HEADERS = [
  'ServiceID', 'ClientID', 'ServiceDetail', 'Location', 'ServiceDate',
  'Notes', 'CreatedAt', 'CreatedBy', 'IsDeleted'
];

const MESSAGE_HEADERS = [
  'LogID', 'ClientID', 'MessageType', 'MessageText', 'SentBy', 'SentAt'
];

const SETTINGS_HEADERS = ['Key', 'Value', 'UpdatedAt'];

const USER_HEADERS = [
  'Username', 'PasswordHash', 'Salt', 'DisplayName', 'Role',
  'IsActive', 'LastLogin', 'CreatedAt', 'CreatedBy', 'IsDeleted'
];

// ============================================================
// 0.6 — DEFAULT SETTINGS
// ============================================================
const DEFAULT_SETTINGS = {
  companyName:        'NJK Real Estate',
  tagline:            'Your Trusted Property Partner',
  logoUrl:            '',
  primaryPhone:       '+92-XXX-XXXXXXX',
  secondaryPhone:     '',
  email:              'info@njkrealestate.com',
  website:            '',
  officeAddress:      'Karachi, Pakistan',
  countryCode:        '+92',
  dateFormat:         'dd-MMM-yyyy',
  theme:              'light',

  // ✅ v2.1 — Global UI Language
  uiLanguage:         'roman',   // 'roman' | 'english'

  welcomeTemplate:
    'Assalam-o-Alaikum {name},\n\n' +
    '{company} — aapne humein call kiya tha aur apni requirements batayi thi. ' +
    'Hum aapke shukrguzar hain.\n\n' +
    'Shukriya,\n{company}',

  reminderTemplate:
    'Assalam-o-Alaikum {name},\n\n' +
    '{company} ki taraf se yaad dehani:\n\n' +
    'Aapne {lastDate} ko {lastLocation} par hum se rabta kiya tha — {lastService}.\n\n' +
    'Kya aap aage koi aur property dekhna chahenge?\n\n' +
    'Shukriya,\n{company}',

  welcomeTemplateRoman:
    'Assalam-o-Alaikum {name},\n\n' +
    '{company} — aapne humein call kiya tha aur apni requirements batayi thi. ' +
    'Hum aapke shukrguzar hain. Aap kabhi bhi humein call kar sakte hain.\n\n' +
    'Shukriya,\n{company}',

  welcomeTemplateEnglish:
    'Dear {name},\n\n' +
    'Thank you for contacting {company}. We appreciate that you called us and ' +
    'shared your requirements. Please feel free to reach out anytime.\n\n' +
    'Best regards,\n{company}',

  reminderTemplateRoman:
    'Assalam-o-Alaikum {name},\n\n' +
    '{company} ki taraf se yaad dehani:\n\n' +
    'Aapne {lastDate} ko {lastLocation} par hum se rabta kiya tha — {lastService}.\n\n' +
    'Kya aap aage koi aur property dekhna chahenge?\n\n' +
    'Shukriya,\n{company}',

  reminderTemplateEnglish:
    'Dear {name},\n\n' +
    'A friendly reminder from {company}:\n\n' +
    'You visited {lastLocation} on {lastDate} — {lastService}.\n\n' +
    'Would you like to explore more options?\n\n' +
    'Best regards,\n{company}',

  blankMessageLabel:  'Blank Message',
  sessionHours:       24,
  maxLoginAttempts:   5,
  lockoutMinutes:     15
};

// ============================================================
// 0.7 — ROLES
// ============================================================
const ROLE_ADMIN  = 'Admin';
const ROLE_NORMAL = 'Normal';
const ROLE_CUSTOM = 'Custom';
const ALL_ROLES = [ROLE_ADMIN, ROLE_NORMAL, ROLE_CUSTOM];

// ============================================================
// 0.8 — PERMISSIONS
// ============================================================
const PERMISSIONS = {
  [ROLE_ADMIN]: [
    'read', 'create', 'update', 'delete',
    'toggle_status', 'toggle_working',
    'service_add', 'service_delete',
    'whatsapp', 'search', 'settings', 'users'
  ],
  [ROLE_NORMAL]: [
    'read', 'create', 'service_add', 'whatsapp', 'search'
  ],
  [ROLE_CUSTOM]: [
    'read', 'create', 'update', 'delete',
    'toggle_status', 'toggle_working',
    'service_add', 'service_delete',
    'whatsapp', 'search'
  ]
};

const DEFAULT_USERS = [
  { username: 'admin', password: 'admin', displayName: 'Administrator', role: ROLE_ADMIN },
  { username: 'user',  password: 'user',  displayName: 'Normal User',   role: ROLE_NORMAL }
];

const STATUS_ACTIVE   = 'Active';
const STATUS_INACTIVE = 'Inactive';

const MSG_WELCOME  = 'Welcome';
const MSG_REMINDER = 'Reminder';
const MSG_BLANK    = 'Blank';
const MSG_WELCOME_ROMAN     = 'WelcomeRoman';
const MSG_WELCOME_ENGLISH   = 'WelcomeEnglish';
const MSG_REMINDER_ROMAN    = 'ReminderRoman';
const MSG_REMINDER_ENGLISH  = 'ReminderEnglish';

const DEAL_RENT     = 'Rent';
const DEAL_SALE     = 'Sale';
const DEAL_BOTH     = 'Both';
const DEAL_NOT_SET  = 'Not Set';
const ALL_DEAL_TYPES = [DEAL_RENT, DEAL_SALE, DEAL_BOTH, DEAL_NOT_SET];

const PREFIX_CLIENT  = 'NJK-';
const PREFIX_SERVICE = 'SRV-';
const PREFIX_LOG     = 'LOG-';
const ID_PAD         = 3;

const CACHE_PREFIX_TOKEN = 'session_';
const CACHE_PREFIX_LOCK  = 'lock_';
const CACHE_PREFIX_FAIL  = 'fail_';