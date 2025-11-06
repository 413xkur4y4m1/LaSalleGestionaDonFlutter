import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ButtonOutlineProps = {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
};

const ButtonOutline = ({ children, icon, className }: ButtonOutlineProps) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border-2 border-[#e10022] bg-transparent px-8 py-4 font-semibold text-[#e10022] ring-offset-background transition-all duration-300 hover:bg-[#e10022] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};

export default ButtonOutline;
