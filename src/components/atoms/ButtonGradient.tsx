import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ButtonGradientProps = {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void; // ✅ agregado para manejar eventos de clic
};

const ButtonGradient = ({ children, icon, className, onClick }: ButtonGradientProps) => {
  return (
    <button
      onClick={onClick} // ✅ agregado para que funcione el clic
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[linear-gradient(to_right,#e10022,#0a1c65)] px-8 py-4 font-semibold text-white ring-offset-background transition-all duration-300 hover:scale-105 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};

export default ButtonGradient;
