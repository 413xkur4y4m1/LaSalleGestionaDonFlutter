'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Download, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  Package,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  QrCode
} from 'lucide-react';

// --- TIPOS ---
interface QRItem {
  id: string;
  codigo: string;
  tipo: 'activacion' | 'devolucion' | 'devolucion_adeudo' | 'pago';
  nombreMaterial: string;
  cantidad?: number;
  estado: string;
  fechaCreacion: string;
  fechaLimite?: string;
  monto?: number;
  qrToken?: string;
  grupo?: string;
}

interface QRCenterData {
  activacion: QRItem[];
  devolucion: QRItem[];
  devolucionAdeudo: QRItem[];
  pago: QRItem[];
  totales: {
    activacion: number;
    devolucion: number;
    devolucionAdeudo: number;
    pago: number;
    total: number;
  };
}

interface QRCenterViewProps {
  studentEmail: string;
}

// --- COMPONENTE DE TARJETA DE QR ---
interface QRCardProps {
  item: QRItem;
  isExpanded: boolean;
  onToggle: () => void;
}

const QRCard: React.FC<QRCardProps> = ({ item, isExpanded, onToggle }) => {
  const qrRef = useRef<SVGSVGElement>(null);

  const handleDownload = () => {
    if (!qrRef.current || !item.qrToken) return;

    const svgString = new XMLSerializer().serializeToString(qrRef.current);
    const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${item.codigo}-${item.nombreMaterial.replace(/ /g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Configuración de estilo según tipo
  const tipoConfig = {
    activacion: {
      icon: <Clock className="h-5 w-5" />,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-800',
      badgeColor: 'bg-blue-100 text-blue-700',
      label: '🔵 Por Activar'
    },
    devolucion: {
      icon: <Package className="h-5 w-5" />,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      textColor: 'text-green-800',
      badgeColor: 'bg-green-100 text-green-700',
      label: '🟢 Para Devolver'
    },
    devolucion_adeudo: {
      icon: <AlertCircle className="h-5 w-5" />,
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
      textColor: 'text-orange-800',
      badgeColor: 'bg-orange-100 text-orange-700',
      label: '🟠 Devolver Material'
    },
    pago: {
      icon: <DollarSign className="h-5 w-5" />,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      textColor: 'text-red-800',
      badgeColor: 'bg-red-100 text-red-700',
      label: '🔴 Pagar Adeudo'
    }
  }[item.tipo];

  const fechaLimiteDate = item.fechaLimite ? new Date(item.fechaLimite) : null;

  return (
    <div className={`border-2 ${tipoConfig.borderColor} rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
      {/* Header clickeable */}
      <button
        onClick={onToggle}
        className={`w-full ${tipoConfig.bgColor} p-4 flex items-center justify-between hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`${tipoConfig.textColor}`}>
            {tipoConfig.icon}
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-800">{item.nombreMaterial}</h3>
            <p className="text-xs text-gray-600 font-mono">{item.codigo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${tipoConfig.badgeColor}`}>
            {tipoConfig.label}
          </span>
          {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
        </div>
      </button>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="bg-white p-4 space-y-4">
          {/* Detalles */}
          <div className="space-y-2 text-sm">
            {item.cantidad && (
              <div className="flex items-center gap-2 text-gray-700">
                <Package className="h-4 w-4 text-gray-500" />
                <span>Cantidad: <strong>{item.cantidad}</strong></span>
              </div>
            )}
            {item.monto !== undefined && (
              <div className="flex items-center gap-2 text-gray-700">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span>Monto: <strong className="text-red-600">${item.monto.toFixed(2)} MXN</strong></span>
              </div>
            )}
            {fechaLimiteDate && (
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Fecha límite: <strong>{fechaLimiteDate.toLocaleDateString('es-MX')}</strong></span>
              </div>
            )}
            {item.grupo && (
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-gray-500">👥</span>
                <span>Grupo: <strong>{item.grupo}</strong></span>
              </div>
            )}
          </div>

          {/* QR Code */}
          {item.qrToken && (
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center gap-3 border border-gray-200">
              <QRCodeSVG value={item.qrToken} size={200} ref={qrRef} />
              <div className="text-center">
                <p className="font-mono text-sm text-gray-600 break-all max-w-xs">
                  {item.qrToken.substring(0, 30)}...
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                <Download className="h-4 w-4" />
                Descargar QR
              </button>
            </div>
          )}

          {/* Instrucciones según tipo */}
          <div className={`${tipoConfig.bgColor} p-3 rounded-lg border ${tipoConfig.borderColor}`}>
            <p className="text-xs text-gray-700">
              {item.tipo === 'activacion' && '📱 Muestra este código al administrador para activar tu préstamo.'}
              {item.tipo === 'devolucion' && '📦 Presenta este código al entregar el material en el laboratorio.'}
              {item.tipo === 'devolucion_adeudo' && '⚠️ Devuelve el material con este código para resolver tu adeudo.'}
              {item.tipo === 'pago' && '💵 Muestra este código al realizar el pago presencial de tu adeudo.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE DE SECCIÓN ---
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  items: QRItem[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}

const Section: React.FC<SectionProps> = ({ title, icon, items, expandedId, onToggle }) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-lg font-bold text-gray-800">
          {title} <span className="text-sm text-gray-500">({items.length})</span>
        </h2>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <QRCard
            key={item.id}
            item={item}
            isExpanded={expandedId === item.id}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const QRCenterView: React.FC<QRCenterViewProps> = ({ studentEmail }) => {
  const [data, setData] = useState<QRCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchQRs = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/qr-center`);
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.message || 'Error al cargar códigos QR');
        }

        setData(result);
      } catch (err: any) {
        console.error('Error fetching QR codes:', err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (studentEmail) {
      fetchQRs();
    }
  }, [studentEmail]);

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-red-600" />
        <p className="text-gray-600">Cargando tus códigos QR...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
        <h3 className="font-bold text-red-800 mb-2">Error al cargar</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!data || data.totales.total === 0) {
    return (
      <div className="text-center p-12 bg-green-50 rounded-lg border border-green-200">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="font-bold text-green-800 text-xl mb-2">¡Todo al día!</h3>
        <p className="text-green-700">No tienes códigos QR pendientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {/* Header con resumen */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <QrCode className="h-8 w-8 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-800">Mis Códigos QR</h1>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-red-600">{data.totales.total}</p>
            <p className="text-xs text-gray-600">códigos activos</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{data.totales.activacion}</p>
            <p className="text-xs text-blue-700">Por Activar</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{data.totales.devolucion}</p>
            <p className="text-xs text-green-700">Para Devolver</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-orange-600">{data.totales.devolucionAdeudo}</p>
            <p className="text-xs text-orange-700">Adeudo Material</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{data.totales.pago}</p>
            <p className="text-xs text-red-700">Por Pagar</p>
          </div>
        </div>
      </div>

      {/* Secciones de QR */}
      <Section
        title="🔵 Por Activar"
        icon={<Clock className="h-6 w-6 text-blue-600" />}
        items={data.activacion}
        expandedId={expandedId}
        onToggle={handleToggle}
      />

      <Section
        title="🟢 Para Devolver"
        icon={<Package className="h-6 w-6 text-green-600" />}
        items={data.devolucion}
        expandedId={expandedId}
        onToggle={handleToggle}
      />

      <Section
        title="🟠 Devolver Material (Adeudo)"
        icon={<AlertCircle className="h-6 w-6 text-orange-600" />}
        items={data.devolucionAdeudo}
        expandedId={expandedId}
        onToggle={handleToggle}
      />

      <Section
        title="🔴 Pagos Pendientes"
        icon={<DollarSign className="h-6 w-6 text-red-600" />}
        items={data.pago}
        expandedId={expandedId}
        onToggle={handleToggle}
      />

      {/* Nota informativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Nota:</strong> Presenta estos códigos QR al administrador del laboratorio
          para completar las operaciones correspondientes. Los códigos se pueden descargar
          tocando el botón de descarga.
        </p>
      </div>
    </div>
  );
};

export default QRCenterView;