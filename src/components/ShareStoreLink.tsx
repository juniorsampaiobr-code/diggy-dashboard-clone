import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const ShareStoreLink = () => {
  const [storeId, setStoreId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadStore();
    }
  }, [user]);

  const loadStore = async () => {
    try {
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user?.id)
        .single();

      if (store) {
        setStoreId(store.id);
      }
    } catch (error) {
      console.error("Error loading store:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStoreUrl = () => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${window.location.origin}${cleanBase}/menu/${storeId}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getStoreUrl());
    toast.success("Link copiado para a área de transferência!");
  };

  const openInNewTab = () => {
    window.open(getStoreUrl(), "_blank");
  };

  if (loading) {
    return null;
  }

  if (!storeId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link da Loja</CardTitle>
          <CardDescription>
            Configure sua loja primeiro para gerar o link
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compartilhe seu Link</CardTitle>
        <CardDescription>
          Envie este link para seus clientes fazerem pedidos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input value={getStoreUrl()} readOnly className="font-mono text-sm" />
          <Button size="icon" variant="outline" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" onClick={openInNewTab}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Os clientes podem acessar este link para ver seu cardápio e fazer pedidos diretamente.
          </p>
          <Button variant="secondary" className="w-full" onClick={copyToClipboard}>
            <QrCode className="mr-2 h-4 w-4" />
            Copiar Link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
