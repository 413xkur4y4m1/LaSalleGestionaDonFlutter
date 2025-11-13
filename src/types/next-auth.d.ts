
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Se extiende la interfaz Session para que incluya nuestras propiedades personalizadas.
   */
  interface Session {
    user: {
      id: string;
      rol?: string; // <-- AÑADIDO: El rol del usuario
      grupo?: string;
    } & DefaultSession["user"];
  }

  /**
   * Se extiende la interfaz User para que incluya nuestras propiedades personalizadas.
   */
  interface User extends DefaultUser {
      rol?: string; // <-- AÑADIDO: El rol del usuario
      grupo?: string;
  }
}


declare module "next-auth/jwt" {
  /**
   * Se extiende la interfaz JWT para que pueda contener nuestras propiedades.
   */
  interface JWT {
    id: string;
    rol?: string; // <-- AÑADIDO: El rol del usuario
    grupo?: string;
  }
}
