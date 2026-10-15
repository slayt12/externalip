/**
 * Escape text before it is placed in HTML.
 *
 * Client IP, browser fields, and the ISP name are all influenced by the
 * caller or by the cleartext ip-api response. They are inserted into the
 * page as text, so this encoding is what keeps them from becoming markup.
 *
 * Invariant: the result contains no raw &, <, >, ", or '.
 */

'use strict';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { escapeHtml };
