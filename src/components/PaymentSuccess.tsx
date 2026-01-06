import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, Gift } from "lucide-react";

interface PaymentSuccessProps {
  onClose: () => void;
  orderTotal: number;
}

const PaymentSuccess = ({ onClose, orderTotal }: PaymentSuccessProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Play success sound
    const audio = new Audio();
    audio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYXBSOP1/3LdSwEJXfF8+CEQAkUXbnq66dWEgl+mtv5wzgmBSl/ze3A";
    audio.play().catch(() => {}); // Ignore errors if sound can't play

    // Show confetti animation
    setShowConfetti(true);
    
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 animate-pulse" />
        
        {/* Confetti animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>
        )}

        <div className="relative z-10">
          {/* Success icon with animation */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle className="w-10 h-10 text-primary animate-bounce" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-accent animate-spin" />
            <Gift className="absolute -bottom-2 -left-2 w-5 h-5 text-primary animate-bounce" />
          </div>

          {/* Success message */}
          <h2 className="text-3xl font-bold text-primary mb-4 animate-pulse">
            Payment Successful! 🎉
          </h2>
          
          <div className="bg-primary/10 rounded-lg p-4 mb-6">
            <p className="text-lg font-semibold text-primary">
              Order Total: ${orderTotal.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Thank you for choosing Men's Hunt!
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Order confirmation sent to your email</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Estimated delivery: 3-5 business days</span>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <Button onClick={onClose} className="flex-1">
              Continue Shopping
            </Button>
            <Button variant="outline" className="flex-1">
              Track Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;