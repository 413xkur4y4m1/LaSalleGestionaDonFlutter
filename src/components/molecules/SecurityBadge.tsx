import { Lock } from "lucide-react";

const SecurityBadge = () => {
  return (
    <div className="flex items-center gap-2 justify-center">
      <Lock className="size-5 text-[#0a1c65]" />
      <span className="text-[#0a1c65] text-sm font-medium">
        Acceso seguro con Microsoft Outlook
      </span>
    </div>
  );
};

export default SecurityBadge;
