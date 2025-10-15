import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const BusinessHours = () => {
  const [hours, setHours] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHours();
  }, []);

  const loadHours = async () => {
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("id")
        .single();

      if (!storeData) return;

      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .eq("store_id", storeData.id);

      if (error) throw error;

      const hoursMap = (data || []).reduce((acc: any, h: any) => {
        acc[h.day_of_week] = h;
        return acc;
      }, {});

      setHours(hoursMap);
    } catch (error: any) {
      toast.error("Erro ao carregar horários");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("id")
        .single();

      if (!storeData) throw new Error("Loja não encontrada");

      for (const day of DAYS) {
        const dayData = hours[day.value];
        if (!dayData) continue;

        const payload = {
          store_id: storeData.id,
          day_of_week: day.value,
          open_time: dayData.open_time || "09:00",
          close_time: dayData.close_time || "18:00",
          is_open: dayData.is_open ?? true,
        };

        if (dayData.id) {
          await supabase
            .from("business_hours")
            .update(payload)
            .eq("id", dayData.id);
        } else {
          await supabase
            .from("business_hours")
            .insert(payload);
        }
      }

      toast.success("Horários salvos com sucesso!");
      loadHours();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar horários");
    } finally {
      setLoading(false);
    }
  };

  const updateDay = (dayValue: number, field: string, value: any) => {
    setHours((prev: any) => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        [field]: value,
      },
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Horário de Funcionamento</h1>
          <p className="text-muted-foreground mt-1">
            Configure os horários de abertura e fechamento
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Horários Semanais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {DAYS.map((day) => {
              const dayData = hours[day.value] || {};
              return (
                <div key={day.value} className="flex items-center gap-4 pb-4 border-b last:border-0">
                  <div className="flex items-center gap-2 w-40">
                    <Switch
                      checked={dayData.is_open ?? true}
                      onCheckedChange={(checked) => updateDay(day.value, "is_open", checked)}
                    />
                    <Label className="font-medium">{day.label}</Label>
                  </div>

                  {(dayData.is_open ?? true) && (
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Abertura</Label>
                        <Input
                          type="time"
                          value={dayData.open_time || "09:00"}
                          onChange={(e) => updateDay(day.value, "open_time", e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Fechamento</Label>
                        <Input
                          type="time"
                          value={dayData.close_time || "18:00"}
                          onChange={(e) => updateDay(day.value, "close_time", e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {!(dayData.is_open ?? true) && (
                    <p className="text-muted-foreground flex-1">Fechado</p>
                  )}
                </div>
              );
            })}

            <Button onClick={handleSave} disabled={loading} className="w-full">
              Salvar Horários
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BusinessHours;
