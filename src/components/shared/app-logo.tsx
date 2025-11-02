import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

const AppLogo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-2 text-lg font-bold tracking-tight", className)}>
        <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <Building2 className="h-5 w-5" />
        </div>
      <span className="font-headline">Magang By BERAN</span>
    </div>
  );
};

export default AppLogo;
