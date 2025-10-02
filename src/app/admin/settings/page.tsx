'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Settings,
  DollarSign,
  Save,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/services/api';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [marginPercent, setMarginPercent] = useState(5);
  const [minMargin, setMinMargin] = useState(5000);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('http://localhost:3001/api/admin/commission/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getToken()}`,
        },
        body: JSON.stringify({
          marginPercent,
          minMargin,
        }),
      });

      if (!response.ok) throw new Error('Error saving config');

      showSuccess('Configuración Guardada', 'Los cambios se han aplicado correctamente');
    } catch (error) {
      console.error('Error saving config:', error);
      showError('Error', 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
            <p className="text-gray-600">Ajusta los parámetros de la plataforma</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Información Importante</h3>
              <p className="text-sm text-blue-800">
                Los cambios en la configuración de comisiones solo aplicarán para nuevos pedidos. 
                Los pedidos existentes mantendrán su configuración original.
              </p>
            </div>
          </div>
        </div>

        {/* Comisiones */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Configuración de Comisiones</h2>
              <p className="text-sm text-gray-600">Define el margen de ganancia de la plataforma</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Porcentaje de Comisión */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Porcentaje de Comisión
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.5"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <span className="text-gray-600 font-medium">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Porcentaje del precio del servicio que la plataforma retiene como comisión
              </p>
            </div>

            {/* Comisión Mínima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comisión Mínima (COP)
              </label>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">$</span>
                <input
                  type="number"
                  value={minMargin}
                  onChange={(e) => setMinMargin(Number(e.target.value))}
                  min="0"
                  step="1000"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Valor mínimo de comisión que la plataforma cobrará por servicio
              </p>
            </div>

            {/* Ejemplo de Cálculo */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Ejemplo de Cálculo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Precio del servicio:</span>
                  <span className="font-medium text-gray-900">$100.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Comisión ({marginPercent}%):</span>
                  <span className="font-medium text-green-600">
                    ${Math.max((100000 * marginPercent / 100), minMargin).toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between">
                  <span className="text-gray-900 font-semibold">Ganancia de la plataforma:</span>
                  <span className="font-bold text-green-600">
                    ${Math.max((100000 * marginPercent / 100), minMargin).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Sistema */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Información del Sistema</h2>
              <p className="text-sm text-gray-600">Detalles técnicos de la plataforma</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Versión</p>
              <p className="text-lg font-semibold text-gray-900">1.0.0</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Ambiente</p>
              <p className="text-lg font-semibold text-gray-900">Desarrollo</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Backend</p>
              <p className="text-lg font-semibold text-green-600">Conectado</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Base de Datos</p>
              <p className="text-lg font-semibold text-green-600">PostgreSQL</p>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/admin')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
