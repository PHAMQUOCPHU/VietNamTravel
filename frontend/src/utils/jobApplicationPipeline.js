/** Trạng thái DB → bước stepper (1–4). rejected → 0 (xử lý riêng). */
export function statusToCurrentStep(status) {
  if (!status || status === "rejected") return 0;
  switch (status) {
    case "submitted":
      return 1;
    case "confirmed":
    case "reviewed":
      return 2;
    case "interview":
      return 3;
    case "hired":
      return 4;
    default:
      return 1;
  }
}

export function isRejectedStatus(status) {
  return status === "rejected";
}

