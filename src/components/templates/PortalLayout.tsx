import type { ReactNode } from "react";
import PortalHeader from "@/components/organisms/PortalHeader";
import PortalFooter from "@/components/organisms/PortalFooter";

type PortalLayoutProps = {
  children: ReactNode;
};

const PortalLayout = ({ children }: PortalLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <PortalHeader />
      <main className="flex-1">
        {children}
      </main>
      <PortalFooter />
    </div>
  );
};

export default PortalLayout;
