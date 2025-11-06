import LogoSALLE from "@/components/atoms/LogoSALLE";
import LogoDonFlutter from "@/components/atoms/LogoDonFlutter";

const HeaderBrand = () => {
  return (
    <div className="flex justify-between items-center w-full">
      <LogoSALLE />
      <LogoDonFlutter />
    </div>
  );
};

export default HeaderBrand;
