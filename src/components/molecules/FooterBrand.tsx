const FooterBrand = () => {
  return (
    <div className="flex flex-col gap-4 items-center md:flex-row md:justify-between w-full">
      <img 
        src="https://res.cloudinary.com/dkqnjpfn9/image/upload/v1764337089/Adobe_Express_-_file_1_pzvscd.png" 
        alt="Logo La Salle"
        width={50}
        height={50}
        className="object-contain"
      />
      <p className="text-white text-sm text-center">© 2025 Don Flutter Team</p>
      <img 
        src="https://res.cloudinary.com/dkqnjpfn9/image/upload/v1764336601/shared_image-modified_s8ntde.png" 
        alt="Logo Don Flutter"
        width={50}
        height={50}
        className="object-contain"
      />
    </div>
  );
};

export default FooterBrand;