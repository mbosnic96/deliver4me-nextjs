import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Trash2, Shield } from "lucide-react";

interface CardItemProps {
  card: {
    last4: string;
    holderName: string;
    expiry: string;
    brand: string;

  };
  onDelete: () => void;
  loading?: boolean;
}

export function CardItem({ card, onDelete, loading }: CardItemProps) {
  const getBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'american express': return '💳';
      case 'discover': return '💳';
      default: return '💳';
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getBrandIcon(card.brand)}</span>
            <span className="font-semibold text-sm">{card.brand}</span>
          </div>
          <Shield className="h-5 w-5 text-green-500" />
        </div>

        <div className="mb-4">
          <div className="text-lg font-mono tracking-wider text-slate-800 dark:text-slate-200">
            •••• •••• •••• {card.last4}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Card Holder</div>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {card.holderName}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Expires</div>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {card.expiry}
            </div>
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onDelete}
          disabled={loading}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}