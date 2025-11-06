import LogoSALLE from "@/components/atoms/LogoSALLE";
import LogoDonFlutter from "@/components/atoms/LogoDonFlutter";

const FooterBrand = () => {
  return (
    <div className="flex flex-col gap-4 items-center md:flex-row md:justify-between w-full">
      <LogoSALLE />
      <p className="text-white text-sm text-center">© 2025 Don Flutter Team</p>
      <LogoDonFlutter />
    </div>
  );
};

export default FooterBrand;
