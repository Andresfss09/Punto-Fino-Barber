import React from 'react';
import { Scissors, User, Calendar, Clock, Check, Edit2, Mail, ShoppingBag } from 'lucide-react';
import { formatTime, formatPrice } from '../../utils/formatters';

export default function BookingConfirmation({ 
  bookingData, 
  onConfirm, 
  onBack, 
  isSubmitting 
}) {
  const { 
    selectedServices, 
    selectedBarber, 
    selectedDate, 
    selectedSlot, 
    totalPrice, 
    totalDuration, 
    paymentMethod, 
    setPaymentMethod, 
    notes, 
    setNotes, 
    clientData, 
    setClientData,
    selectedBeverage,
  } = bookingData;

  const paymentMethods = [
    { id: 'efectivo', label: 'Efectivo presencial' },
    { id: 'transferencia', label: 'Transacción presencial (tras el corte)' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Formulario de Datos del Cliente (Comunicación exclusiva por correo) */}
      <div className="bg-[#181A17] border border-[#2C2E29] rounded-[8px] p-6">
        <div className="flex items-center justify-between border-b border-[#2C2E29] pb-4 mb-5">
          <div>
            <h3 className="font-display font-bold text-lg text-[#F4F1EA]">Tus datos para la cita</h3>
            <p className="text-xs text-[#A3A096] font-sans mt-0.5">
              Recibirás el código de confirmación y los enlaces de gestión en tu correo electrónico.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-sans font-medium text-[#A3A096] mb-1.5">
              Nombre completo <span className="text-[#C8A97E]">*</span>
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
              <input
                type="text"
                name="name"
                value={clientData?.name || ''}
                onChange={handleInputChange}
                placeholder="Ej: Nicolás Gómez"
                required
                className="w-full bg-[#111210] border border-[#2C2E29] focus:border-[#C8A97E] rounded-[6px] text-[#F4F1EA] pl-10 pr-4 py-2.5 text-xs font-sans focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-medium text-[#A3A096] mb-1.5">
              Correo electrónico <span className="text-[#C8A97E]">*</span>
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
              <input
                type="email"
                name="email"
                value={clientData?.email || ''}
                onChange={handleInputChange}
                placeholder="Ej: nicolas@correo.com"
                required
                className="w-full bg-[#111210] border border-[#2C2E29] focus:border-[#C8A97E] rounded-[6px] text-[#F4F1EA] pl-10 pr-4 py-2.5 text-xs font-sans focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de la Cita */}
      <div className="bg-[#181A17] border border-[#2C2E29] rounded-[8px] p-6">
        <h3 className="font-display font-bold text-lg text-[#F4F1EA] mb-4 border-b border-[#2C2E29] pb-3">
          Resumen de tu cita
        </h3>
        
        <div className="space-y-3 font-sans text-xs">
          <div className="p-3.5 bg-[#111210] border border-[#2C2E29] rounded-[6px] flex justify-between items-center">
            <span className="text-[#A3A096] flex items-center gap-2">
              <Scissors size={14} /> Servicio:
            </span>
            <span className="font-semibold text-[#F4F1EA]">
              {selectedServices.map(s => s.name).join('')}
            </span>
          </div>

          <div className="p-3.5 bg-[#111210] border border-[#2C2E29] rounded-[6px] flex justify-between items-center">
            <span className="text-[#A3A096] flex items-center gap-2">
              <User size={14} /> Barbero:
            </span>
            <span className="font-semibold text-[#F4F1EA]">
              {selectedBarber?.user?.name || 'El primero disponible'}
            </span>
          </div>

          <div className="p-3.5 bg-[#111210] border border-[#2C2E29] rounded-[6px] flex justify-between items-center">
            <span className="text-[#A3A096] flex items-center gap-2">
              <Calendar size={14} /> Fecha y hora:
            </span>
            <span className="tabular-nums text-[#F4F1EA] font-semibold">
              {selectedDate} · {formatTime(selectedSlot)}
            </span>
          </div>

          <div className="p-3.5 bg-[#111210] border border-[#2C2E29] rounded-[6px] flex justify-between items-center">
            <span className="text-[#A3A096] flex items-center gap-2">
              <Clock size={14} /> Duración:
            </span>
            <span className="tabular-nums text-[#F4F1EA] font-semibold">{totalDuration} min</span>
          </div>

          {selectedBeverage && selectedBeverage !== 'Sin bebida' && (
            <div className="p-3.5 bg-[#111210] border border-[#2C2E29] rounded-[6px] flex justify-between items-center">
              <span className="text-[#A3A096] flex items-center gap-2">
                <ShoppingBag size={14} /> Producto:
              </span>
              <span className="font-semibold text-[#F4F1EA]">
                {selectedBeverage}
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-5 border-t border-[#2C2E29] flex items-center justify-between">
          <span className="text-xs font-sans text-[#A3A096] font-medium">
            Total estimado:
          </span>
          <span className="font-sans tabular-nums text-lg font-bold text-[#C8A97E]">
            {formatPrice(totalPrice)} COP
          </span>
        </div>
      </div>

      {/* Forma de Pago */}
      <div className="bg-[#181A17] border border-[#2C2E29] rounded-[8px] p-6">
        <h4 className="font-sans font-semibold text-sm text-[#F4F1EA] mb-4">Forma de pago en sede</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {paymentMethods.map(method => (
            <label 
              key={method.id}
              className={`cursor-pointer flex items-center justify-center py-3 px-3 rounded-[6px] text-xs font-sans transition-colors border text-center ${
                paymentMethod === method.id
                  ? 'bg-[#C8A97E] text-[#111210] border-[#C8A97E] font-semibold'
                  : 'bg-[#111210] text-[#A3A096] border-[#2C2E29]'
              }`}
            >
              <input 
                type="radio" 
                name="paymentMethod" 
                value={method.id}
                checked={paymentMethod === method.id}
                onChange={() => setPaymentMethod(method.id)}
                className="hidden" 
              />
              {method.label}
            </label>
          ))}
        </div>
      </div>

      {/* Notas Adicionales */}
      <div className="bg-[#181A17] border border-[#2C2E29] rounded-[8px] p-6">
        <h4 className="font-sans font-semibold text-sm text-[#F4F1EA] mb-3 flex items-center gap-2">
          <Edit2 size={14} className="text-[#A3A096]" /> Notas opcionales
        </h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Degradado medio, tijera en la parte superior..."
          className="w-full bg-[#111210] border border-[#2C2E29] focus:border-[#C8A97E] rounded-[6px] text-[#F4F1EA] p-3 text-xs font-sans h-20 resize-none focus:outline-none transition-colors"
          maxLength={300}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button 
          onClick={onBack}
          className="btn-ferrari-outline text-xs py-3.5 px-6 w-full sm:w-auto text-center cursor-pointer"
          disabled={isSubmitting}
        >
          Volver
        </button>
        <button 
          onClick={onConfirm}
          className="btn-ferrari-primary text-xs py-3.5 px-8 w-full flex-1 flex items-center justify-center gap-2 cursor-pointer"
          disabled={isSubmitting}
        >
          <Check size={16} strokeWidth={2.5} />
          Confirmar Cita en Punto Fino
        </button>
      </div>
    </div>
  );
}
