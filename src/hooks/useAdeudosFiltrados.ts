import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase-config"; // ❌ Quita el .ts

export interface Adeudo {
  id: string;
  codigo: string;
  nombreMaterial: string;
  cantidad: number;
  precio_unitario: number;
  precio_ajustado: number;
  moneda: string;
  estado: string;
  tipo: string;
  fechaVencimiento: Timestamp | null;
  grupo: string;
  prestamoOriginal: string | null;
}

export function useAdeudosFiltrados(studentUid: string | null) {
  const [adeudos, setAdeudos] = useState<Adeudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentUid) {
      setLoading(false);
      return;
    }

    const fetchAdeudos = async () => {
      try {
        setLoading(true);
        const adeudosRef = collection(db, `Estudiantes/${studentUid}/Adeudos`);
        const q = query(adeudosRef, orderBy("fechaVencimiento", "desc"));
        
        const snapshot = await getDocs(q);
        const adeudosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Adeudo[];
        
        setAdeudos(adeudosData);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching adeudos:", err);
        setError(err.message || "Error al cargar adeudos");
      } finally {
        setLoading(false);
      }
    };

    fetchAdeudos();
  }, [studentUid]);

  return { adeudos, loading, error };
}