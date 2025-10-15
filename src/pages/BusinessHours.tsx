import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2 } from "lucide-react";

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

interface ScheduledPause {
  id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  is_active: boolean;
}

const BusinessHours = () => {
  const [hours, setHours] = useState<any>({});
  const [pauses, setPauses] = useState<ScheduledPause[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();

  const [pauseForm, setPauseForm] = useState({
    start_time: "",
    end_time: "",
    reason: "",
  });

  useEffect(() => {
    if (user) {
      loadStoreData();
    }
  }, [user]);

  const loadStoreData = async () => {
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user?.id)
        .single();

      if (!storeData) return;
      setStoreId(storeData.id);
      
      loadHours(storeData.id);
      loadPauses(storeData.id);
    } catch (error: any) {
      console.error("Error loading store:", error);
    }
  };

  const loadHours = async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .eq("store_id", storeId);

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

  const loadPauses = async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from("scheduled_pauses")
        .select("*")
        .eq("store_id", storeId)
        .order("start_time", { ascending: true });

      if (error) throw error;
      setPauses(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar pausas");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!storeId) throw new Error("Loja não encontrada");

      for (const day of DAYS) {
        const dayData = hours[day.value];
        if (!dayData) continue;

        const payload = {
          store_id: storeId,
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
      loadHours(storeId);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar horários");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePause = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("scheduled_pauses")
        .insert([{
          store_id: storeId,
          start_time: pauseForm.start_time,
          end_time: pauseForm.end_time,
          reason: pauseForm.reason || null,
          is_active: true,
        }]);

      if (error) throw error;

      toast.success("Pausa programada criada!");
      setDialogOpen(false);
      setPauseForm({ start_time: "", end_time: "", reason: "" });
      loadPauses(storeId);
    } catch (error: any) {
      toast.error("Erro ao criar pausa");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePause = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta pausa?")) return;

    try {
      const { error } = await supabase
        .from("scheduled_pauses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Pausa excluída!");
      loadPauses(storeId);
    } catch (error: any) {
      toast.error("Erro ao excluir pausa");
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pausas Programadas</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Pausa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Programar Pausa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePause} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Data/Hora Início *</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={pauseForm.start_time}
                      onChange={(e) => setPauseForm({ ...pauseForm, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Data/Hora Fim *</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={pauseForm.end_time}
                      onChange={(e) => setPauseForm({ ...pauseForm, end_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Motivo</Label>
                    <Textarea
                      id="reason"
                      placeholder="Ex: Férias, Feriado, Manutenção..."
                      value={pauseForm.reason}
                      onChange={(e) => setPauseForm({ ...pauseForm, reason: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    Criar Pausa
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {pauses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma pausa programada
              </p>
            ) : (
              <div className="space-y-4">
                {pauses.map((pause) => (
                  <div key={pause.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {new Date(pause.start_time).toLocaleString("pt-BR")} até{" "}
                        {new Date(pause.end_time).toLocaleString("pt-BR")}
                      </p>
                      {pause.reason && (
                        <p className="text-sm text-muted-foreground">{pause.reason}</p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeletePause(pause.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BusinessHours;
