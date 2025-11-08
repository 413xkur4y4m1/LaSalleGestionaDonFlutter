// Combines: Avatar + Dropdown (Shadcn)
// Shows:
//   - Avatar image
//   - Dropdown on click:
//     * Nombre estudiante
//     * Correo
//     * Divider
//     * "Cerrar sesión" → signOut()
//
// Props: user: { nombre, correo, fotoPerfil }

import React from 'react';
import { signOut } from 'next-auth/react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import CustomAvatar from '../atoms/Avatar';

interface UserMenuProps {
  user: { nombre: string; correo: string; fotoPerfil?: string };
}

const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full">
          <CustomAvatar src={user.fotoPerfil} alt={user.nombre} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 origin-top-right">
        <DropdownMenuItem disabled>{user.nombre}</DropdownMenuItem>
        <DropdownMenuItem disabled>{user.correo}</DropdownMenuItem>
        <DropdownMenuItem>
          <button onClick={() => signOut()}>Cerrar sesión</button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;