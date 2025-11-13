
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface ReturnDatePickerProps {
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const ReturnDatePicker: React.FC<ReturnDatePickerProps> = ({ onConfirm, onCancel }) => {
  const [selectionType, setSelectionType] = useState<'sameDay' | 'otherDay' | null>(null);
  const [date, setDate] = useState<Date | undefined>();

  const handleConfirm = () => {
    if (date) {
      onConfirm(date);
    }
  };

  const today = new Date();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 w-full max-w-sm mx-auto shadow-lg">
      {!selectionType ? (
        <div className="flex flex-col gap-2">
            <Button onClick={() => setSelectionType('sameDay')} variant="outline">📅 Mismo día</Button>
            <Button onClick={() => setSelectionType('otherDay')} variant="outline">📆 Otro día</Button>
        </div>
      ) : (
        <div>
          <p className="font-bold text-center mb-4">Selecciona la fecha y hora de devolución</p>
           <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full justify-start text-left font-normal mb-4"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Elige una fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                disabled={(day) => day < today || day > new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())} // Limita a 1 mes en el futuro
              />
            </PopoverContent>
          </Popover>
          {/* Aquí se podría añadir un selector de hora si es necesario */}
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={onCancel} variant="ghost">Cancelar</Button>
            <Button onClick={handleConfirm} disabled={!date} style={{ backgroundColor: '#e10022' }}>Confirmar</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnDatePicker;
