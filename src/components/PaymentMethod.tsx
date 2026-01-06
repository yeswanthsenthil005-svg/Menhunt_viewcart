import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const PaymentMethod = () => {
  const [selectedMethod, setSelectedMethod] = useState("cash-on-delivery");

  const paymentMethods = [
    { id: "cash-on-delivery", label: "Cash On Delivery" },
    { id: "stripe", label: "Stripe" },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Payment Method</h3>
      <div className="flex gap-3">
        {paymentMethods.map((method) => (
          <Button
            key={method.id}
            variant={selectedMethod === method.id ? "default" : "outline"}
            onClick={() => setSelectedMethod(method.id)}
            className={`relative ${
              selectedMethod === method.id
                ? "bg-payment-selected text-payment-selected-foreground hover:bg-payment-selected/90"
                : "bg-payment-default text-payment-default-foreground hover:bg-payment-default/80"
            }`}
          >
            <span className="flex items-center gap-2">
              {method.label}
              {selectedMethod === method.id && (
                <Check className="w-4 h-4 text-success font-bold drop-shadow-sm" />
              )}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethod;