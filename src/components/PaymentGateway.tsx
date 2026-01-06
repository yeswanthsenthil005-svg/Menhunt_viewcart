import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal?: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: { error: { description: string } }) => void) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface PaymentGatewayProps {
  total: number;
  items: CartItem[];
  onPaymentSuccess: (orderData: { orderId: string; paymentId: string; amount: number }) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PaymentGateway = ({ total, items, onPaymentSuccess }: PaymentGatewayProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [billingAddress, setBillingAddress] = useState({
    country: "in",
    state: "",
    city: "",
    zipCode: "",
    address: "",
  });

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all customer details (Name, Email, Phone).",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay SDK. Please check your internet connection.");
      }

      // Create order on backend
      const orderResponse = await fetch(`${API_URL}/api/orders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          currency: "INR",
          items: items.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          customer: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: billingAddress,
          },
        }),
      });

      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error(orderData.error || orderData.details || "Failed to create order");
      }

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: orderData.key, // Key from server response
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Glam Essentials",
        description: "Payment for your order",
        order_id: orderData.order.id,
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch(`${API_URL}/api/orders/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
              toast({
                title: "Payment Successful! 🎉",
                description: `Payment ID: ${response.razorpay_payment_id}`,
              });
              onPaymentSuccess({
                orderId: orderData.orderId,
                paymentId: response.razorpay_payment_id,
                amount: total,
              });
            } else {
              throw new Error(verifyData.error || "Payment verification failed");
            }
          } catch (error) {
            console.error("Verification error:", error);
            toast({
              title: "Verification Issue",
              description: "Payment received but verification pending. Contact support if needed.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.phone,
        },
        theme: {
          color: "#8B5CF6",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "You closed the payment window.",
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on("payment.failed", (response: { error: { description: string } }) => {
        toast({
          title: "Payment Failed",
          description: response.error.description || "Your payment could not be processed.",
          variant: "destructive",
        });
        setIsProcessing(false);
      });
      
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Secure Payment with Razorpay
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Information */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Customer Information</Label>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                placeholder="9876543210"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Billing Address */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Billing Address (Optional)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select 
                value={billingAddress.country} 
                onValueChange={(value) => setBillingAddress({ ...billingAddress, country: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">India</SelectItem>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="State"
                value={billingAddress.state}
                onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="City"
                value={billingAddress.city}
                onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                placeholder="123456"
                value={billingAddress.zipCode}
                onChange={(e) => setBillingAddress({ ...billingAddress, zipCode: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="123 Main Street"
              value={billingAddress.address}
              onChange={(e) => setBillingAddress({ ...billingAddress, address: e.target.value })}
            />
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Amount:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Pay Button */}
        <Button 
          onClick={handlePayment} 
          disabled={isProcessing}
          size="lg"
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ₹${total.toFixed(2)} with Razorpay`
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Secured by Razorpay. Supports UPI, Cards, NetBanking & Wallets.
        </p>
      </CardContent>
    </Card>
  );
};

export default PaymentGateway;
