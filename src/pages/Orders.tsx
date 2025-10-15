import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Clock, User, Phone, MapPin, CreditCard } from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled" | "confirmed";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  total_amount: number;
  status: OrderStatus;
  payment_method: string | null;
  payment_status: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadStoreAndOrders();
    }
  }, [user]);

  const loadStoreAndOrders = async () => {
    try {
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user?.id)
        .single();

      if (store) {
        setStoreId(store.id);
        loadOrders(store.id);
      }
    } catch (error) {
      console.error("Error loading store:", error);
    }
  };

  const loadOrders = async (storeId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast({ title: "Status atualizado com sucesso!" });
      loadOrders(storeId);
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-700",
      preparing: "bg-blue-100 text-blue-700",
      ready: "bg-green-100 text-green-700",
      completed: "bg-gray-100 text-gray-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || colors.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "Pendente",
      preparing: "Em Preparo",
      ready: "Pronto",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const flow: { [key in OrderStatus]?: OrderStatus } = {
      pending: "preparing",
      preparing: "ready",
      ready: "completed",
    };
    return flow[currentStatus] || null;
  };

  const getNextStatusLabel = (currentStatus: OrderStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    return nextStatus ? getStatusLabel(nextStatus) : null;
  };

  const renderOrders = (status: OrderStatus) => {
    const filteredOrders = orders.filter((order) => order.status === status);

    if (loading) {
      return <div className="text-center py-12">Carregando...</div>;
    }

    if (filteredOrders.length === 0) {
      return (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            Nenhum pedido {getStatusLabel(status).toLowerCase()} no momento.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer_phone}</span>
                </div>
                {order.customer_address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">{order.customer_address}</span>
                  </div>
                )}
                {order.payment_method && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>{order.payment_method}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(order.created_at).toLocaleString("pt-BR")}</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="font-semibold text-sm mb-2">Itens:</p>
                <div className="space-y-1">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span>R$ {item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                  <span>Total:</span>
                  <span>R$ {order.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {getNextStatus(order.status) && (
                <Button
                  className="w-full"
                  onClick={() => {
                    const nextStatus = getNextStatus(order.status);
                    if (nextStatus) updateOrderStatus(order.id, nextStatus);
                  }}
                >
                  Marcar como {getNextStatusLabel(order.status)}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe e gerencie seus pedidos
          </p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="preparing">Em Preparo</TabsTrigger>
            <TabsTrigger value="ready">Prontos</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {renderOrders("pending")}
          </TabsContent>

          <TabsContent value="preparing" className="mt-6">
            {renderOrders("preparing")}
          </TabsContent>

          <TabsContent value="ready" className="mt-6">
            {renderOrders("ready")}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {renderOrders("completed")}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Orders;
