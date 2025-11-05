
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
      <Image src="/icon.svg" width={120} height={120} alt="logo" />
    </div>
  );
};

export default AppLogo;
