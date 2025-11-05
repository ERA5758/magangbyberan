
import { cn } from "@/lib/utils";
import Image from "next/image";

const AppLogo = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-lg font-bold tracking-tight",
        className
      )}
    >
      <Image src="/icon.svg" width={32} height={32} alt="logo" />
      <span className="font-headline">Magang By BERAN</span>
    </div>
  );
};

export default AppLogo;
