import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Search, MapPin } from "lucide-react";
import MapPicker from "@/components/MapPicker";
import { geocodeAddress } from "@/lib/geocoding";

const StoreSettings = () => {
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    whatsapp: "",
    logo_url: "",
  });
  
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  useEffect(() => {
    if (user) {
      loadStore();
    }
  }, [user]);

  const loadStore = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStoreId(data.id);
        setFormData({
          name: data.name || "",
          description: data.description || "",
          address: data.address || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          logo_url: data.logo_url || "",
        });
        setLatitude(data.latitude?.toString() || "");
        setLongitude(data.longitude?.toString() || "");
      }
    } catch (error) {
      console.error("Error loading store:", error);
    } finally {
      setLoading(false);
    }
  };

  const geocodeStoreAddress = async () => {
    if (!formData.address.trim()) {
      toast({
        title: "Endereço vazio",
        description: "Preencha o endereço da loja primeiro",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await geocodeAddress(formData.address);
    setLoading(false);
    
    if (result) {
      setLatitude(result.latitude.toString());
      setLongitude(result.longitude.toString());
      toast({
        title: "Coordenadas encontradas!",
        description: "As coordenadas foram atualizadas. Clique em Salvar para confirmar.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível encontrar as coordenadas. Tente inserir manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const storeData = {
        name: formData.name,
        description: formData.description || null,
        address: formData.address || null,
        phone: formData.phone || null,
        whatsapp: formData.whatsapp || null,
        logo_url: formData.logo_url || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        owner_id: user?.id,
      };

      if (storeId) {
        const { error } = await supabase
          .from("stores")
          .update(storeData)
          .eq("id", storeId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("stores")
          .insert([storeData])
          .select()
          .single();

        if (error) throw error;
        if (data) setStoreId(data.id);
      }

      toast({
        title: "Configurações salvas!",
        description: "As informações da loja foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minha Loja</h1>
          <p className="text-muted-foreground mt-1">
            Configure as informações da sua loja
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Nome da Loja *</Label>
              <Input
                id="storeName"
                placeholder="Ex: Restaurante do João"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Conte um pouco sobre seu estabelecimento..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                type="url"
                placeholder="https://exemplo.com/logo.png"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                placeholder="Rua, número, bairro, cidade"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <Button 
              type="button" 
              onClick={geocodeStoreAddress} 
              variant="outline" 
              className="w-full"
              disabled={!formData.address || loading}
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar Coordenadas do Endereço
            </Button>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5" />
                <Label>Localização no Mapa</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Clique no mapa ou arraste o marcador para selecionar a localização exata da sua loja
              </p>
              <MapPicker
                latitude={latitude ? parseFloat(latitude) : undefined}
                longitude={longitude ? parseFloat(longitude) : undefined}
                onLocationSelect={(lat, lng, address) => {
                  setLatitude(lat.toString());
                  setLongitude(lng.toString());
                  setFormData({ ...formData, address });
                }}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-23.5505"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-46.6333"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(00) 0000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StoreSettings;
