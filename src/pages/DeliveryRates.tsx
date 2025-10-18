import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, MapPin } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface DeliveryRate {
  id: string;
  max_distance_km: number;
  fee: number;
}

const DeliveryRates = () => {
  const [rates, setRates] = useState<DeliveryRate[]>([]);
  const [storeId, setStoreId] = useState<string>("");
  const [storeAddress, setStoreAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(true);
  const [newRate, setNewRate] = useState({ max_distance_km: "", fee: "" });

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (store) {
        setStoreId(store.id);
        setStoreAddress(store.address || "");
        setLatitude(store.latitude?.toString() || "");
        setLongitude(store.longitude?.toString() || "");
        fetchRates(store.id);
      }
    } catch (error) {
      console.error("Error fetching store:", error);
      toast.error("Erro ao carregar dados da loja");
    } finally {
      setLoading(false);
    }
  };

  const fetchRates = async (storeId: string) => {
    const { data, error } = await supabase
      .from("delivery_rates")
      .select("*")
      .eq("store_id", storeId)
      .order("max_distance_km", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar taxas de entrega");
      return;
    }

    setRates(data || []);
  };

  const updateStoreCoordinates = async () => {
    if (!latitude || !longitude) {
      toast.error("Preencha latitude e longitude");
      return;
    }

    const { error } = await supabase
      .from("stores")
      .update({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      })
      .eq("id", storeId);

    if (error) {
      toast.error("Erro ao atualizar coordenadas");
      return;
    }

    toast.success("Coordenadas atualizadas com sucesso");
  };

  const addRate = async () => {
    if (!newRate.max_distance_km || !newRate.fee) {
      toast.error("Preencha todos os campos");
      return;
    }

    const { error } = await supabase.from("delivery_rates").insert({
      store_id: storeId,
      max_distance_km: parseFloat(newRate.max_distance_km),
      fee: parseFloat(newRate.fee),
    });

    if (error) {
      toast.error("Erro ao adicionar taxa");
      return;
    }

    toast.success("Taxa adicionada com sucesso");
    setNewRate({ max_distance_km: "", fee: "" });
    fetchRates(storeId);
  };

  const deleteRate = async (id: string) => {
    const { error } = await supabase
      .from("delivery_rates")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao remover taxa");
      return;
    }

    toast.success("Taxa removida com sucesso");
    fetchRates(storeId);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Taxas de Entrega</h1>
          <p className="text-muted-foreground">
            Configure as taxas de entrega baseadas na distância
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localização da Loja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Endereço</Label>
              <Input value={storeAddress} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-23.5505"
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-46.6333"
                />
              </div>
            </div>
            <Button onClick={updateStoreCoordinates}>
              Atualizar Coordenadas
            </Button>
            <p className="text-sm text-muted-foreground">
              Use{" "}
              <a
                href="https://www.google.com/maps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Maps
              </a>{" "}
              para obter as coordenadas do seu endereço
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faixas de Distância</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {rates.map((rate) => (
                <div
                  key={rate.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      Até {rate.max_distance_km} km
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Taxa: R$ {rate.fee.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => deleteRate(rate.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">Adicionar Nova Faixa</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Distância Máxima (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newRate.max_distance_km}
                    onChange={(e) =>
                      setNewRate({ ...newRate, max_distance_km: e.target.value })
                    }
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label>Taxa (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newRate.fee}
                    onChange={(e) =>
                      setNewRate({ ...newRate, fee: e.target.value })
                    }
                    placeholder="4.00"
                  />
                </div>
              </div>
              <Button onClick={addRate} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Faixa
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DeliveryRates;
