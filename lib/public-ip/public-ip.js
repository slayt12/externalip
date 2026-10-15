/**
 * Decide whether an address is safe to send to the external ISP lookup.
 *
 * Private, loopback, link-local, and non-IP values stay on this server.
 * The lookup talks to ip-api.com over HTTP, so those addresses must not leave.
 *
 * Invariant: returns true only for a net.isIP address outside the ranges below.
 */

'use strict';

const net = require('net');

function isPrivateV4(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return true;

  const numbers = parts.map((part) => Number(part));
  if (numbers.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const a = numbers[0];
  const b = numbers[1];
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a >= 224) return true;
  return false;
}

function mappedV4(ip) {
  const lower = ip.toLowerCase();
  const marker = '::ffff:';
  const at = lower.lastIndexOf(marker);
  if (at === -1) return null;
  const rest = lower.slice(at + marker.length);
  return net.isIP(rest) === 4 ? rest : null;
}

function firstHextet(ip) {
  const head = ip.toLowerCase().split(':')[0];
  if (!/^[0-9a-f]{1,4}$/.test(head)) return null;
  return Number.parseInt(head, 16);
}

function isLinkLocalV6(ip) {
  const value = firstHextet(ip);
  return value != null && value >= 0xfe80 && value <= 0xfebf;
}

function isUniqueLocalV6(ip) {
  const value = firstHextet(ip);
  return value != null && value >= 0xfc00 && value <= 0xfdff;
}

function isPublicIp(ip) {
  if (typeof ip !== 'string') return false;

  const kind = net.isIP(ip);
  if (kind === 4) return !isPrivateV4(ip);
  if (kind !== 6) return false;

  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1' || lower === '0:0:0:0:0:0:0:1') return false;
  if (isUniqueLocalV6(lower) || isLinkLocalV6(lower)) return false;

  const v4 = mappedV4(lower);
  if (v4) return !isPrivateV4(v4);
  return true;
}

module.exports = { isPublicIp };
