/**
 * So khớp user trong usedBy khi JWT trả string, DB lưu ObjectId (Array.includes bị sai).
 */
export function voucherWasUsedBy(usedBy, userId) {
  if (!userId || !Array.isArray(usedBy) || usedBy.length === 0) return false;
  const uid = String(userId);
  return usedBy.some((id) => String(id) === uid);
}

/**
 * đồng bộ enum status với expiry / lượt dùng (không nhìn isActive — apply sẽ chặn khi !isActive).
 */
export function deriveVoucherStatus({ usedCount = 0, usageLimit = 1, expiryDate }) {
  const safeLimit = Math.max(1, Number(usageLimit) || 1);
  const used = Number(usedCount) || 0;
  if (expiryDate && new Date(expiryDate) < new Date()) return "expired";
  if (used >= safeLimit) return "exhausted";
  return "active";
}
