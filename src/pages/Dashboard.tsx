import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, TrendingUp, Users } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Pedidos Hoje",
      value: "0",
      icon: ShoppingCart,
      description: "Nenhum pedido hoje",
    },
    {
      title: "Produtos",
      value: "0",
      icon: Package,
      description: "Total de produtos",
    },
    {
      title: "Vendas do Mês",
      value: "R$ 0,00",
      icon: TrendingUp,
      description: "Receita mensal",
    },
    {
      title: "Clientes",
      value: "0",
      icon: Users,
      description: "Total de clientes",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo ao painel de controle do Pedido 123
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Primeiros Passos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Configure sua loja</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione informações sobre seu restaurante ou estabelecimento
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Cadastre seus produtos</h3>
                <p className="text-sm text-muted-foreground">
                  Crie categorias e adicione os produtos do seu cardápio
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Compartilhe seu link</h3>
                <p className="text-sm text-muted-foreground">
                  Envie o link da sua loja para seus clientes começarem a fazer pedidos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
