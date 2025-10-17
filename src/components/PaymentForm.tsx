import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, QrCode, Copy } from "lucide-react";

interface PaymentFormProps {
  orderId: string;
  totalAmount: number;
  paymentMethod: string;
  mercadoPagoPublicKey: string;
  onPaymentComplete: () => void;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export const PaymentForm = ({
  orderId,
  totalAmount,
  paymentMethod,
  mercadoPagoPublicKey,
  onPaymentComplete,
}: PaymentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ code: string; qrCodeBase64: string } | null>(null);
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardholderName: "",
    expirationDate: "",
    securityCode: "",
    identificationType: "CPF",
    identificationNumber: "",
    email: "",
    installments: 1,
  });

  useEffect(() => {
    // Load Mercado Pago SDK
    if (paymentMethod === "credit" && mercadoPagoPublicKey) {
      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [paymentMethod, mercadoPagoPublicKey]);

  const handlePixPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            orderId,
            paymentMethod: "pix",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setPixData({
          code: data.pixCode,
          qrCodeBase64: data.pixQrCodeBase64,
        });
        toast.success("Pagamento PIX gerado com sucesso!");
      } else {
        throw new Error(data.error || "Erro ao gerar pagamento PIX");
      }
    } catch (error: any) {
      console.error("PIX Payment Error:", error);
      toast.error(error.message || "Erro ao gerar pagamento PIX");
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const mp = new window.MercadoPago(mercadoPagoPublicKey);
      
      const cardToken = await mp.createCardToken({
        cardNumber: cardData.cardNumber.replace(/\s/g, ""),
        cardholderName: cardData.cardholderName,
        cardExpirationMonth: cardData.expirationDate.split("/")[0],
        cardExpirationYear: "20" + cardData.expirationDate.split("/")[1],
        securityCode: cardData.securityCode,
        identificationType: cardData.identificationType,
        identificationNumber: cardData.identificationNumber,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            orderId,
            paymentMethod: "credit",
            cardData: {
              token: cardToken.id,
              payment_method_id: cardToken.payment_method_id,
              installments: cardData.installments,
              email: cardData.email,
              identification: {
                type: cardData.identificationType,
                number: cardData.identificationNumber,
              },
            },
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Pagamento aprovado!");
        onPaymentComplete();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.code) {
      navigator.clipboard.writeText(pixData.code);
      toast.success("Código PIX copiado!");
    }
  };

  if (paymentMethod === "pix") {
    return (
      <div className="space-y-4">
        {!pixData ? (
          <Button onClick={handlePixPayment} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando PIX...
              </>
            ) : (
              <>
                <QrCode className="mr-2 h-4 w-4" />
                Gerar Código PIX
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="bg-card p-4 rounded-lg border text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Escaneie o QR Code ou copie o código PIX
              </p>
              <img
                src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                alt="QR Code PIX"
                className="mx-auto w-64 h-64"
              />
              <div className="mt-4 space-y-2">
                <div className="p-2 bg-muted rounded text-xs break-all font-mono">
                  {pixData.code}
                </div>
                <Button
                  onClick={copyPixCode}
                  variant="outline"
                  className="w-full"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Código PIX
                </Button>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Após realizar o pagamento, seu pedido será confirmado automaticamente
            </p>
          </div>
        )}
      </div>
    );
  }

  if (paymentMethod === "credit") {
    return (
      <form onSubmit={handleCardPayment} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cardNumber">Número do Cartão</Label>
          <Input
            id="cardNumber"
            placeholder="0000 0000 0000 0000"
            value={cardData.cardNumber}
            onChange={(e) => {
              let value = e.target.value.replace(/\s/g, "");
              value = value.replace(/(\d{4})/g, "$1 ").trim();
              setCardData({ ...cardData, cardNumber: value });
            }}
            maxLength={19}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardholderName">Nome no Cartão</Label>
          <Input
            id="cardholderName"
            placeholder="Nome como está no cartão"
            value={cardData.cardholderName}
            onChange={(e) =>
              setCardData({ ...cardData, cardholderName: e.target.value.toUpperCase() })
            }
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expirationDate">Validade</Label>
            <Input
              id="expirationDate"
              placeholder="MM/AA"
              value={cardData.expirationDate}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, "");
                if (value.length >= 2) {
                  value = value.slice(0, 2) + "/" + value.slice(2, 4);
                }
                setCardData({ ...cardData, expirationDate: value });
              }}
              maxLength={5}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="securityCode">CVV</Label>
            <Input
              id="securityCode"
              placeholder="123"
              value={cardData.securityCode}
              onChange={(e) =>
                setCardData({
                  ...cardData,
                  securityCode: e.target.value.replace(/\D/g, ""),
                })
              }
              maxLength={4}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tipo de Documento</Label>
          <RadioGroup
            value={cardData.identificationType}
            onValueChange={(value) =>
              setCardData({ ...cardData, identificationType: value })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="CPF" id="cpf" />
              <Label htmlFor="cpf">CPF</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="CNPJ" id="cnpj" />
              <Label htmlFor="cnpj">CNPJ</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="identificationNumber">
            {cardData.identificationType === "CPF" ? "CPF" : "CNPJ"}
          </Label>
          <Input
            id="identificationNumber"
            placeholder={cardData.identificationType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
            value={cardData.identificationNumber}
            onChange={(e) =>
              setCardData({
                ...cardData,
                identificationNumber: e.target.value.replace(/\D/g, ""),
              })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={cardData.email}
            onChange={(e) => setCardData({ ...cardData, email: e.target.value })}
            required
          />
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between text-lg font-bold mb-4">
            <span>Total a pagar:</span>
            <span>R$ {totalAmount.toFixed(2)}</span>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Pagar com Cartão"
            )}
          </Button>
        </div>
      </form>
    );
  }

  return null;
};
