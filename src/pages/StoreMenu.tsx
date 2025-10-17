import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, Phone, MapPin } from "lucide-react";
import { PaymentForm } from "@/components/PaymentForm";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
}

interface Store {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  accepts_cash: boolean;
  accepts_pix: boolean;
  accepts_credit: boolean;
  accepts_debit: boolean;
  accepts_online_payment: boolean;
  mercado_pago_public_key: string | null;
}

interface CartItem extends Product {
  quantity: number;
}

const StoreMenu = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [orderData, setOrderData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    notes: "",
    payment_method: "",
  });

  useEffect(() => {
    if (storeId) {
      loadStoreAndProducts();
    }
  }, [storeId]);

  const loadStoreAndProducts = async () => {
    setLoading(true);
    try {
      // Load store info
      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select("*")
        .eq("id", storeId)
        .single();

      if (storeError) throw storeError;
      setStore(storeData);

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_available", true)
        .order("display_order", { ascending: true });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error("Error loading store:", error);
      toast.error("Erro ao carregar cardápio");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      const newCart = prevCart.map((item) => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter((item) => item.quantity > 0);
      return newCart;
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (cart.length === 0) {
        toast.error("Adicione produtos ao carrinho");
        return;
      }

      const totalAmount = getTotalPrice();

      // Create order
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          store_id: storeId,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          customer_address: orderData.customer_address,
          notes: orderData.notes,
          payment_method: orderData.payment_method,
          total_amount: totalAmount,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: newOrder.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Check if payment requires online processing
      if (orderData.payment_method === "pix" || orderData.payment_method === "credit") {
        setCreatedOrderId(newOrder.id);
        setShowPaymentForm(true);
        toast.success("Pedido criado! Complete o pagamento.");
      } else {
        toast.success("Pedido realizado com sucesso!");
        navigate(`/order/${newOrder.id}`);
        setCart([]);
        setCheckoutOpen(false);
        setOrderData({
          customer_name: "",
          customer_phone: "",
          customer_address: "",
          notes: "",
          payment_method: "",
        });
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Erro ao criar pedido");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Loja não encontrada</p>
          <Button onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {store.logo_url && (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{store.name}</h1>
                {store.description && (
                  <p className="text-sm text-muted-foreground">{store.description}</p>
                )}
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => setCheckoutOpen(true)}
              disabled={cart.length === 0}
              className="relative"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Carrinho
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Button>
          </div>

          {/* Store Info */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {store.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{store.phone}</span>
              </div>
            )}
            {store.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{store.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum produto disponível no momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">
                        R$ {product.price.toFixed(2)}
                      </span>
                      <Button onClick={() => addToCart(product)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Pedido</DialogTitle>
          </DialogHeader>

          {/* Cart Items */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Itens do Pedido</h3>
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-muted p-3 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      R$ {item.price.toFixed(2)} cada
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="ml-4 font-bold">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>R$ {getTotalPrice().toFixed(2)}</span>
              </div>
            </div>

            {/* Customer Info Form */}
            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Nome Completo *</Label>
                <Input
                  id="customer_name"
                  value={orderData.customer_name}
                  onChange={(e) =>
                    setOrderData({ ...orderData, customer_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_phone">Telefone/WhatsApp *</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={orderData.customer_phone}
                  onChange={(e) =>
                    setOrderData({ ...orderData, customer_phone: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_address">Endereço de Entrega *</Label>
                <Textarea
                  id="customer_address"
                  value={orderData.customer_address}
                  onChange={(e) =>
                    setOrderData({ ...orderData, customer_address: e.target.value })
                  }
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Forma de Pagamento *</Label>
                <select
                  id="payment_method"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={orderData.payment_method}
                  onChange={(e) =>
                    setOrderData({ ...orderData, payment_method: e.target.value })
                  }
                  required
                >
                  <option value="">Selecione uma forma de pagamento</option>
                  {store?.accepts_cash && <option value="cash">Dinheiro</option>}
                  {store?.accepts_pix && <option value="pix">PIX</option>}
                  {store?.accepts_credit && <option value="credit">Pagamento online</option>}
                  {store?.accepts_debit && <option value="debit">Pagamento com cartão na entrega</option>}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={orderData.notes}
                  onChange={(e) =>
                    setOrderData({ ...orderData, notes: e.target.value })
                  }
                  rows={2}
                  placeholder="Alguma observação sobre o pedido?"
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Finalizando..." : "Confirmar Pedido"}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Form Dialog */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pagamento</DialogTitle>
          </DialogHeader>
          {createdOrderId && store?.mercado_pago_public_key && (
            <PaymentForm
              orderId={createdOrderId}
              totalAmount={getTotalPrice()}
              paymentMethod={orderData.payment_method}
              mercadoPagoPublicKey={store.mercado_pago_public_key}
              onPaymentComplete={() => {
                setShowPaymentForm(false);
                navigate(`/order/${createdOrderId}`);
                setCart([]);
                setCheckoutOpen(false);
                setOrderData({
                  customer_name: "",
                  customer_phone: "",
                  customer_address: "",
                  notes: "",
                  payment_method: "",
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoreMenu;
