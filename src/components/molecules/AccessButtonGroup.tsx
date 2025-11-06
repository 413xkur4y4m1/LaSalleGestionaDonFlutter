import ButtonGradient from "@/components/atoms/ButtonGradient";
import ButtonOutline from "@/components/atoms/ButtonOutline";
import { GraduationCap, Settings } from "lucide-react";

const AccessButtonGroup = () => {
  return (
    <div className="flex flex-col gap-4 items-center md:flex-row md:justify-center md:gap-6 xl:gap-8">
      <ButtonGradient icon={<GraduationCap className="h-5 w-5" />} className="w-full max-w-sm md:w-auto justify-center">
        Entrar como Estudiante
      </ButtonGradient>
      <ButtonOutline icon={<Settings className="h-5 w-5" />} className="w-full max-w-sm md:w-auto justify-center">
        Entrar como Administrador
      </ButtonOutline>
    </div>
  );
};

export default AccessButtonGroup;
