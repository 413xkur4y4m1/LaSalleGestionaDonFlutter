import HeaderBrand from "@/components/molecules/HeaderBrand";

const PortalHeader = () => {
  return (
    <header className="h-16 bg-white shadow-md px-6 sticky top-0 z-50 flex items-center">
      <div className="container mx-auto">
        <HeaderBrand />
      </div>
    </header>
  );
};

export default PortalHeader;
