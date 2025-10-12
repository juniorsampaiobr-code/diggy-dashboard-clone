import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <div className="flex gap-4 p-4 rounded-lg hover:bg-secondary/50 transition-colors">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className="h-6 w-6 text-foreground" />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-primary">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
};
