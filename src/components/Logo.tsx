import { Package } from "lucide-react";

export const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-primary p-3 rounded-xl">
        <Package className="h-6 w-6 text-primary-foreground" />
      </div>
      <span className="text-2xl font-bold text-foreground">Pedido 123</span>
    </div>
  );
};
