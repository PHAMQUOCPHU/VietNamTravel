import React from "react";

const PaymentMethod = ({ selected, onChange }) => {
  const handlePaymentChange = (method) => {
    onChange(method);
  };

  return (
    <div className="flex flex-col gap-3 mt-4">
      <p className="font-semibold text-gray-700">
        Chọn phương thức thanh toán:
      </p>
      <div className="flex gap-4">
        <label
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePaymentChange("COD");
          }}
          className={`flex-1 p-3 border rounded-lg cursor-pointer flex items-center gap-2 ${selected === "COD" ? "border-blue-600 bg-blue-50" : ""}`}
        >
          <input
            type="radio"
            name="payment"
            value="COD"
            checked={selected === "COD"}
            onChange={() => {}}
            onMouseDown={(e) => e.preventDefault()}
            className="hidden"
          />
          <span>💵 Tiền mặt (Tại quầy)</span>
        </label>
        <label
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePaymentChange("Online");
          }}
          className={`flex-1 p-3 border rounded-lg cursor-pointer flex items-center gap-2 ${selected === "Online" ? "border-blue-600 bg-blue-50" : ""}`}
        >
          <input
            type="radio"
            name="payment"
            value="Online"
            checked={selected === "Online"}
            onChange={() => {}}
            onMouseDown={(e) => e.preventDefault()}
            className="hidden"
          />
          <span>💳 Chuyển khoản (Mã QR)</span>
        </label>
      </div>
    </div>
  );
};
export default PaymentMethod;
