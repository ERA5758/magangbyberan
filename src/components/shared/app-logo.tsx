import { cn } from "@/lib/utils";
import Image from "next/image";

const AppLogo = ({ className, size=63 }: { className?: string, size?: number }) => {
  return (
    (<div
      className={cn(
        "flex items-center gap-2 text-lg font-bold tracking-tight",
        className
      )}>
      <Image src="/icon.svg" width={size} height={size} alt="logo" />
    </div>)
  );
};

export default AppLogo;
