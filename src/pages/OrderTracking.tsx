import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Package, 
  Truck,
  Phone,
  MapPin,
  DollarSign
} from "lucide-react";

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  payment_method: string | null;
  total_amount: number;
  notes: string | null;
  store_id: string;
}

interface Store {
  name: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "Pendente", icon: Clock, color: "bg-yellow-500" },
  confirmed: { label: "Confirmado", icon: CheckCircle, color: "bg-blue-500" },
  preparing: { label: "Em Preparo", icon: Package, color: "bg-purple-500" },
  ready: { label: "Pronto", icon: CheckCircle, color: "bg-green-500" },
  delivering: { label: "Saiu para Entrega", icon: Truck, color: "bg-indigo-500" },
  completed: { label: "Concluído", icon: CheckCircle, color: "bg-green-600" },
  cancelled: { label: "Cancelado", icon: XCircle, color: "bg-red-500" },
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  credit: "Cartão de Crédito",
  debit: "Cartão de Débito",
  online: "Pagamento Online",
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel(`order-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            setOrder(payload.new as Order);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      // Load order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Load order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;
      setOrderItems(itemsData || []);

      // Load store info (public view)
      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select("name, phone, address, logo_url")
        .eq("id", orderData.store_id)
        .single();

      if (storeError) throw storeError;
      setStore(storeData);
    } catch (error) {
      console.error("Error loading order:", error);
      toast.error("Erro ao carregar pedido");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Pedido não encontrado</p>
          <Button onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const statusInfo = statusConfig[order.status] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {store?.logo_url && (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {store?.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Pedido #{order.id.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${statusInfo.color}`}>
                <StatusIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl">{statusInfo.label}</div>
                <div className="text-sm text-muted-foreground font-normal">
                  Pedido realizado em{" "}
                  {new Date(order.created_at).toLocaleString("pt-BR")}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Order Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Itens do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderItems.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center pb-3 border-b last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity}x R$ {item.unit_price.toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold">R$ {item.subtotal.toFixed(2)}</p>
              </div>
            ))}
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span>R$ {order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-sm text-muted-foreground">
                  {order.customer_phone}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <p className="text-sm">{order.customer_address}</p>
            </div>
            {order.payment_method && (
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Forma de Pagamento</p>
                  <p className="text-sm text-muted-foreground">
                    {paymentMethodLabels[order.payment_method] || order.payment_method}
                  </p>
                </div>
              </div>
            )}
            {order.notes && (
              <div className="pt-3 border-t">
                <p className="font-medium mb-1">Observações</p>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Store Contact */}
        {store && (store.phone || store.address) && (
          <Card>
            <CardHeader>
              <CardTitle>Contato da Loja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {store.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{store.phone}</span>
                </div>
              )}
              {store.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{store.address}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
