import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, DollarSign } from "lucide-react";

const PaymentSettings = () => {
  const [settings, setSettings] = useState({
    accepts_online_payment: false,
    accepts_cash: true,
    accepts_debit: false,
    accepts_credit: false,
    accepts_pix: false,
    mercado_pago_access_token: "",
    mercado_pago_public_key: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          accepts_online_payment: data.accepts_online_payment || false,
          accepts_cash: data.accepts_cash ?? true,
          accepts_debit: data.accepts_debit || false,
          accepts_credit: data.accepts_credit || false,
          accepts_pix: data.accepts_pix || false,
          mercado_pago_access_token: data.mercado_pago_access_token || "",
          mercado_pago_public_key: data.mercado_pago_public_key || "",
        });
      }
    } catch (error: any) {
      toast.error("Erro ao carregar configurações");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("stores")
        .update(settings)
        .eq("owner_id", (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações de Pagamento</h1>
          <p className="text-muted-foreground mt-1">
            Configure os métodos de pagamento aceitos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Métodos de Pagamento
            </CardTitle>
            <CardDescription>
              Selecione os métodos de pagamento que você aceita
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="cash">Dinheiro</Label>
              <Switch
                id="cash"
                checked={settings.accepts_cash}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, accepts_cash: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="debit">Cartão de Débito</Label>
              <Switch
                id="debit"
                checked={settings.accepts_debit}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, accepts_debit: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="credit">Cartão de Crédito</Label>
              <Switch
                id="credit"
                checked={settings.accepts_credit}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, accepts_credit: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="pix">PIX</Label>
              <Switch
                id="pix"
                checked={settings.accepts_pix}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, accepts_pix: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Integração Mercado Pago
            </CardTitle>
            <CardDescription>
              Configure sua conta do Mercado Pago para aceitar pagamentos online
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Label htmlFor="online">Aceitar Pagamento Online</Label>
              <Switch
                id="online"
                checked={settings.accepts_online_payment}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, accepts_online_payment: checked })
                }
              />
            </div>

            {settings.accepts_online_payment && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="access-token">Access Token</Label>
                  <Input
                    id="access-token"
                    type="password"
                    placeholder="Seu Access Token do Mercado Pago"
                    value={settings.mercado_pago_access_token}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        mercado_pago_access_token: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="public-key">Public Key</Label>
                  <Input
                    id="public-key"
                    placeholder="Sua Public Key do Mercado Pago"
                    value={settings.mercado_pago_public_key}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        mercado_pago_public_key: e.target.value,
                      })
                    }
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  Obtenha suas credenciais no{" "}
                  <a
                    href="https://www.mercadopago.com.br/developers/panel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    painel do Mercado Pago
                  </a>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          Salvar Configurações
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default PaymentSettings;
