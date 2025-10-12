import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/LoginForm";
import { FeatureCard } from "@/components/FeatureCard";
import { StatCard } from "@/components/StatCard";
import { QrCode, Bike, Link as LinkIcon, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <Logo />
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
          {/* Login Section */}
          <div className="bg-card p-8 rounded-2xl shadow-sm border">
            <LoginForm />
          </div>

          {/* Features Section */}
          <div className="space-y-6">
            <div className="grid gap-4">
              <FeatureCard
                icon={QrCode}
                title="QR Code"
                description="Tenha seu cardápio na mesa ou em panfletos para acesso rápido dos seus clientes"
              />
              <FeatureCard
                icon={Bike}
                title="Delivery"
                description="Sem limite de pedidos e taxas de entrega por distância e bairro"
              />
              <FeatureCard
                icon={LinkIcon}
                title="Link da loja"
                description="Seu cliente acessa seu link e faz o pedido sem complicações de cadastro ou instalação de apps"
              />
              <FeatureCard
                icon={Printer}
                title="Impressão"
                description="Impressão automática dos seus pedidos para agilizar ainda mais sua operação"
              />
            </div>

            {/* Stats Section */}
            <div className="bg-card p-8 rounded-2xl shadow-sm border">
              <div className="grid grid-cols-3 gap-6">
                <StatCard value="+30 mil" label="cardápios criados" />
                <StatCard value="+18 milhões" label="em pedidos" />
                <StatCard value="+260 mil" label="pessoas por mês" />
              </div>
            </div>

            <Link to="/auth" className="block">
              <Button className="w-full h-12 text-base" size="lg">
                Entrar no Pedido 123
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
