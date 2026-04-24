/** Cùng quy tắc với frontend/src/utils/bookingCode.js */
export function getBookingShortCodePlain(id) {
  return String(id ?? "")
    .slice(-8)
    .toUpperCase();
}

export function getBookingShortCodeHash(id) {
  return `#${getBookingShortCodePlain(id)}`;
}
