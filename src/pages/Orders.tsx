import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Orders = () => {
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
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">
                Nenhum pedido pendente no momento.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preparing" className="mt-6">
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">
                Nenhum pedido em preparo no momento.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="ready" className="mt-6">
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">
                Nenhum pedido pronto no momento.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">
                Nenhum pedido concluído ainda.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Orders;
