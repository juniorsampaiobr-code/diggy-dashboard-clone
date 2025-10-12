import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Products = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os produtos do seu cardápio
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            Você ainda não tem produtos cadastrados.
          </p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Primeiro Produto
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Products;
