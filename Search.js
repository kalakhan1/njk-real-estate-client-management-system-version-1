/***************************************************************
 * NJK Real Estate — Client Manager (v2.1)
 * File: Search.gs
 * Section: 11.x — Global Search
 * Version: 2.1.0
 * Change Log:
 *   2.1.0 — Area size range (min/max) + unit filter
 ***************************************************************/

function searchClients(token, filters) {
  return safeCall_('11.1', function () {
    const auth = requireAuth_(token, 'search');
    if (!auth.ok) return auth;

    filters = filters || {};
    const fName    = String(filters.name || '').toLowerCase().trim();
    const fArea    = String(filters.area || '').toLowerCase().trim();
    const fReq     = String(filters.requirement || '').toLowerCase().trim();
    const fPhone   = String(filters.phone || '').toLowerCase().trim();
    const fDeal    = String(filters.dealType || 'All').trim();
    const fStatus  = String(filters.status || 'All').trim();

    // v2.1 — Range + unit
    const fAreaUnit = String(filters.areaUnit || 'All').trim();
    const fMinRaw = filters.areaMin;
    const fMaxRaw = filters.areaMax;
    const fMin = (fMinRaw === '' || fMinRaw === null || fMinRaw === undefined)
                 ? null : parseFloat(fMinRaw);
    const fMax = (fMaxRaw === '' || fMaxRaw === null || fMaxRaw === undefined)
                 ? null : parseFloat(fMaxRaw);
    const minOk = (fMin === null || isNaN(fMin)) ? null : fMin;
    const maxOk = (fMax === null || isNaN(fMax)) ? null : fMax;

    const all = getAllClients(token);
    if (!all.ok) return all;

    const results = all.data.filter(function (c) {
      if (fName && c.name.toLowerCase().indexOf(fName) === -1) return false;
      if (fArea && (c.area || '').toLowerCase().indexOf(fArea) === -1) return false;
      if (fReq  && (c.requirement || '').toLowerCase().indexOf(fReq) === -1) return false;
      if (fPhone && String(c.phone).toLowerCase().indexOf(fPhone) === -1) return false;
      if (fDeal && fDeal !== 'All' && c.dealType !== fDeal) return false;
      if (fStatus && fStatus !== 'All' && c.status !== fStatus) return false;

      // Unit filter
      if (fAreaUnit && fAreaUnit !== 'All' && c.areaUnit !== fAreaUnit) return false;

      // Range filter (only when a range is provided)
      if (minOk !== null || maxOk !== null) {
        const sz = parseFloat(c.areaSize) || 0;
        if (minOk !== null && sz < minOk) return false;
        if (maxOk !== null && sz > maxOk) return false;
      }
      return true;
    });

    return returnSuccess_({
      count:   results.length,
      results: results,
      filters: filters
    }, '11.1');
  });
}

function quickSearch(token, query) {
  return safeCall_('11.2', function () {
    const auth = requireAuth_(token, 'search');
    if (!auth.ok) return auth;
    const q = String(query || '').toLowerCase().trim();
    if (!q) return returnSuccess_({ count: 0, results: [] }, '11.2');
    const all = getAllClients(token);
    if (!all.ok) return all;
    const results = all.data.filter(function (c) {
      return c.name.toLowerCase().indexOf(q) !== -1 ||
             c.phone.toLowerCase().indexOf(q) !== -1 ||
             (c.area || '').toLowerCase().indexOf(q) !== -1;
    });
    return returnSuccess_({ count: results.length, results: results }, '11.2');
  });
}