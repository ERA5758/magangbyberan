
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
      <Image
        src="/icon.svg"
        width={36}
        height={36}
        alt="logo"
        className="h-auto w-auto"
      />
    </div>
  );
};

export default AppLogo;
