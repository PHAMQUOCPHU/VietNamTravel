/**
 * Mã đơn rút gọn thống nhất với FE (My Booking): 8 ký tự cuối của ObjectId.
 * Hiển thị có dạng #XXXXXXXX
 */
export function getBookingShortCodePlain(bookingOrId) {
  const id =
    bookingOrId != null && typeof bookingOrId === "object"
      ? bookingOrId._id ?? bookingOrId
      : bookingOrId;
  return String(id ?? "")
    .slice(-8)
    .toUpperCase();
}

export function getBookingShortCodeHash(bookingOrId) {
  return `#${getBookingShortCodePlain(bookingOrId)}`;
}
