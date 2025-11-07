// Full-page centered layout with background
//
// Structure:
// <div className="min-h-screen flex items-center justify-center
//   bg-gradient-to-br from-gray-50 via-white to-gray-100
//   px-4 py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
//
//   {/* Background decorative elements */}
//   <div className="absolute top-0 left-0 w-64 h-64 bg-[#e10022]/5 rounded-full blur-3xl" />
//   <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#0a1c65]/5 rounded-full blur-3xl" />
//
//   <div className="relative z-10">
//     {children}
//   </div>
// </div>
//
// Props: children (LoginCard organism)

import React from 'react';

interface LoginTemplateProps {
  children: React.ReactNode;
}

const LoginTemplate: React.FC<LoginTemplateProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#e10022]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#0a1c65]/5 rounded-full blur-3xl" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default LoginTemplate;