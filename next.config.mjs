/** @type {import('next').NextConfig} */
const nextConfig = {
    // Genkit y algunas de sus dependencias son ESM (ECMAScript Modules).
    // Next.js necesita transpilar estos módulos para que funcionen correctamente,
    // especialmente en el entorno del servidor.
    transpilePackages: [
        '@genkit-ai/ai',
        '@genkit-ai/core',
        '@genkit-ai/flow',
        '@genkit-ai/google-genai',
        '@genkit-ai/googleai',
        'firebase-admin', // También es importante para el SDK de Admin
    ],
};

export default nextConfig;
