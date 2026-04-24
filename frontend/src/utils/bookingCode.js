/** Cùng quy tắc với backend/utils/bookingShortCode.js */
export function getBookingShortCodePlain(id) {
  return String(id ?? "")
    .slice(-8)
    .toUpperCase();
}

export function getBookingShortCodeHash(id) {
  return `#${getBookingShortCodePlain(id)}`;
}
