"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface GrupoModalProps {
  isOpen: boolean;
  onSubmit: (grupo: string) => Promise<void>;
}

const GrupoModal: React.FC<GrupoModalProps> = ({ isOpen, onSubmit }) => {
  const [grupo, setGrupo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isValidGrupo = /^[0-9]{2,3}[A-Z]$/.test(grupo);

  const handleSubmit = async () => {
    if (!isValidGrupo) return;

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(grupo);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el grupo. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
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
              autoFocus
            />
            <p className="text-xs text-gray-400">
              Formato: Número + Letra (ej: 103M, 204T)
            </p>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!isValidGrupo || isSubmitting}
            className="w-full bg-gradient-to-r from-[#e10022] to-[#0a1c65] hover:from-[#c0001d] hover:to-[#08144b]"
          >
            {isSubmitting ? 'Guardando...' : 'Continuar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GrupoModal;