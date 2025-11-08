import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GrupoModalProps {
  isOpen: boolean;
  onSubmit: (grupo: string) => Promise<void>;
}

const GrupoModal: React.FC<GrupoModalProps> = ({ isOpen, onSubmit }) => {
  const [grupo, setGrupo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidGrupo = /^[0-9]{2,3}[A-Z]$/.test(grupo);

  const handleSubmit = async () => {
    if (!isValidGrupo) return;
    setIsSubmitting(true);
    try {
      await onSubmit(grupo);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Evita cerrar el modal sin enviar
  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      // No permite cerrar manualmente
      return;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-6 text-center">
          <div>
            <h2 className="text-2xl font-bold text-[#0a1c65] mb-2">
              ¡Bienvenido a LaSalleGestiona!
            </h2>
            <p className="text-gray-600">
              Para comenzar, ingresa tu grupo académico
            </p>
          </div>

          <div className="space-y-2">
            <Input
              placeholder="Ejemplo: 103M"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value.toUpperCase())}
              className="text-center text-lg font-semibold"
              maxLength={5}
            />
            <p className="text-xs text-gray-400">
              Formato: Número + Letra (ej: 103M, 204T)
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isValidGrupo || isSubmitting}
            className="w-full bg-gradient-to-r from-[#e10022] to-[#0a1c65]"
          >
            {isSubmitting ? 'Guardando...' : 'Continuar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GrupoModal;
