
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
// Importamos el componente Input que nos faltaba
import { Input } from '@/components/ui/input';

interface ReturnDatePickerProps {
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const ReturnDatePicker: React.FC<ReturnDatePickerProps> = ({ onConfirm, onCancel }) => {
  const [selectionType, setSelectionType] = useState<'sameDay' | 'otherDay' | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  // Nuevo estado para guardar la hora
  const [time, setTime] = useState('17:00'); // Hora por defecto: 5 PM

  const handleConfirm = () => {
    // Si es "Mismo día", construimos la fecha de hoy con la hora seleccionada
    if (selectionType === 'sameDay') {
      const finalDate = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      finalDate.setHours(hours, minutes, 0, 0);
      onConfirm(finalDate);
    // Si es "Otro día", usamos la fecha del calendario
    } else if (date) {
      // Para ser consistentes, establecemos una hora por defecto a la fecha seleccionada
      date.setHours(17, 0, 0, 0); // 5 PM por defecto
      onConfirm(date);
    }
  };

  const today = new Date();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 w-full max-w-sm mx-auto shadow-lg">
      {/* --- PASO 1: Elegir el tipo de devolución --- */}
      {!selectionType ? (
        <div className="flex flex-col gap-2">
            <Button onClick={() => setSelectionType('sameDay')} variant="outline">📅 Mismo día</Button>
            <Button onClick={() => setSelectionType('otherDay')} variant="outline">📆 Otro día</Button>
        </div>
      ) : /* --- PASO 2 (Opción A): Si es "Mismo día", pedimos solo la hora --- */
      selectionType === 'sameDay' ? (
        <div>
            <p className="font-bold text-center mb-4">Selecciona la hora de devolución</p>
            <div className="flex flex-col items-center gap-2">
                <label htmlFor="return-time" className="text-sm text-gray-600">Hora de devolución (hoy)</label>
                <Input 
                    id="return-time"
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="text-center text-lg font-semibold w-48"
                />
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <Button onClick={onCancel} variant="ghost">Cancelar</Button>
                <Button onClick={handleConfirm} style={{ backgroundColor: '#e10022' }}>Confirmar</Button>
            </div>
        </div>
      ) : /* --- PASO 2 (Opción B): Si es "Otro día", mostramos el calendario --- */
      ( 
        <div>
          <p className="font-bold text-center mb-4">Selecciona la fecha de devolución</p>
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
                disabled={(day) => day < today || day > new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())} 
              />
            </PopoverContent>
          </Popover>
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
