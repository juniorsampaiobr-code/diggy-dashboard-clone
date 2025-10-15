import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";

const CashRegister = () => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    sales: 0,
    deposits: 0,
    withdrawals: 0
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("id")
        .single();

      if (!storeData) return;

      const { data, error } = await supabase
        .from("cash_transactions")
        .select("*")
        .eq("store_id", storeData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
      
      // Calculate summary
      const totals = (data || []).reduce((acc, t) => {
        if (t.type === 'sale') acc.sales += Number(t.amount);
        if (t.type === 'deposit') acc.deposits += Number(t.amount);
        if (t.type === 'withdrawal') acc.withdrawals += Number(t.amount);
        return acc;
      }, { sales: 0, deposits: 0, withdrawals: 0 });

      setSummary({
        ...totals,
        total: totals.sales + totals.deposits - totals.withdrawals
      });
    } catch (error: any) {
      toast.error("Erro ao carregar transações");
    }
  };

  const handleTransaction = async (type: string) => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Insira um valor válido");
      return;
    }

    setLoading(true);
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("id")
        .single();

      if (!storeData) throw new Error("Loja não encontrada");

      const { error } = await supabase
        .from("cash_transactions")
        .insert({
          store_id: storeData.id,
          type,
          amount: Number(amount),
          payment_method: paymentMethod,
          description: description || null
        });

      if (error) throw error;

      toast.success("Transação registrada com sucesso!");
      setAmount("");
      setDescription("");
      loadTransactions();
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar transação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Controle de Caixa</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie entradas e saídas do caixa
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total em Caixa</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {summary.total.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ {summary.sales.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Depósitos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">R$ {summary.deposits.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retiradas</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">R$ {summary.withdrawals.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="new" className="w-full">
          <TabsList>
            <TabsTrigger value="new">Nova Transação</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Transação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-method">Método de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit">Crédito</SelectItem>
                      <SelectItem value="debit">Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="mercado_pago">Mercado Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Input
                    id="description"
                    placeholder="Ex: Venda de produto, Retirada para banco..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleTransaction("deposit")}
                    disabled={loading}
                    className="flex-1"
                    variant="default"
                  >
                    Depósito
                  </Button>
                  <Button
                    onClick={() => handleTransaction("withdrawal")}
                    disabled={loading}
                    className="flex-1"
                    variant="destructive"
                  >
                    Retirada
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma transação registrada ainda.
                    </p>
                  ) : (
                    transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {transaction.type === "sale" && "Venda"}
                            {transaction.type === "deposit" && "Depósito"}
                            {transaction.type === "withdrawal" && "Retirada"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.description || "Sem descrição"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <div className={`text-lg font-bold ${
                          transaction.type === "withdrawal" ? "text-red-600" : "text-green-600"
                        }`}>
                          {transaction.type === "withdrawal" ? "-" : "+"}R$ {Number(transaction.amount).toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CashRegister;
