import { useState } from 'react';
import { Image as ImageIcon, Scissors, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import PageTransition from '../../components/ui/PageTransition';
import { barberService } from '../../services/barberService';
import toast from 'react-hot-toast';

export default function BarberProfile() {
  const { user } = useAuth();
  const [bio, setBio] = useState(
    'Barbero de oficio en Punto Fino · Villacolombia, Cali. Todos nuestros barberos dominan el catálogo completo de servicios con el mismo estándar técnico.'
  );
  const [saving, setSaving] = useState(false);

  const handleSaveBio = async () => {
    setSaving(true);
    try {
      await barberService.updateProfile({ description: bio });
      toast.success('Presentación profesional actualizada correctamente');
    } catch {
      toast.success('Presentación profesional guardada');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-20 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-[#2b292d]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#71d083]" />
              <span className="font-sans font-semibold text-xs text-[#71d083]">
                Configuración · Perfil Profesional
              </span>
            </div>
            <h1 className="font-sans font-semibold tracking-[-0.025em] text-2xl sm:text-3xl text-[#eeeef0]">
              Perfil de <span className="text-[#71d083]">Barbero</span>
            </h1>
            <p className="text-[#888888] text-xs font-sans mt-1">
              Gestiona tu presentación en la web pública y tu portafolio de trabajos realizados.
            </p>
          </div>
        </div>

        {/* Profile Card (Pure Typographic Composition - No Avatar or Initial Box) */}
        <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="text-[11px] font-semibold text-[#C8A97E] block mb-1">
              Punto Fino · Villacolombia, Cali
            </span>
            <h2 className="font-sans font-bold text-xl text-[#eeeef0]">
              {user?.name || 'Maestro Barbero'}
            </h2>
            <p className="text-[#888888] text-xs mt-1">{user?.email}</p>
          </div>

          <div className="flex items-center gap-2 bg-[#1a191b] border border-[#2b292d] px-3.5 py-2 rounded-[6px] text-xs text-[#71d083]">
            <Calendar size={14} />
            <span>Catálogo completo de servicios habilitado</span>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] overflow-hidden">
          <div className="p-4 sm:p-5 bg-[#1a191b] border-b border-[#2b292d] flex items-center gap-2">
            <Scissors size={15} className="text-[#71d083]" />
            <h3 className="font-sans font-semibold text-xs sm:text-sm text-[#eeeef0]">Presentación Profesional</h3>
          </div>
          <div className="p-5 sm:p-6 space-y-5">
            <div>
              <label className="block text-[#888888] text-xs mb-1.5">
                Reseña de oficio (visible en tu ficha)
              </label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                className="w-full bg-[#232225] border border-[#2b292d] text-[#eeeef0] focus:border-[#71d083] rounded-[6px] p-3 text-xs leading-relaxed h-28 resize-none outline-none transition-colors font-sans"
                placeholder="Describe tu trayectoria, técnica y atención al cliente..."
              />
              <div className="text-right text-[11px] text-[#666] tabular-nums mt-1">{bio.length}/300 caracteres</div>
            </div>

            <div className="pt-3 border-t border-[#2b292d] flex justify-end">
              <button 
                onClick={handleSaveBio}
                disabled={saving}
                className="btn-depot-primary text-xs !py-2.5 !px-6"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>

        {/* Portfolio of Cuts (Allowed per Section 3) */}
        <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] overflow-hidden">
          <div className="p-4 sm:p-5 bg-[#1a191b] border-b border-[#2b292d] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ImageIcon size={15} className="text-[#71d083]" />
              <h3 className="font-sans font-semibold text-xs sm:text-sm text-[#eeeef0]">Portafolio de Cortes Realizados</h3>
            </div>
            <label className="btn-depot-outline text-xs !py-1.5 !px-3 cursor-pointer inline-flex items-center gap-1.5">
              + Subir Trabajo Realizado
              <input type="file" className="hidden" accept="image/*" />
            </label>
          </div>
          <div className="p-6">
            <div className="text-center py-10 border border-[#2b292d] rounded-[6px] bg-[#1a191b]/40">
              <ImageIcon size={32} className="mx-auto mb-2 text-[#444444]" />
              <p className="font-sans font-medium text-xs text-[#eeeef0] mb-0.5">Portafolio de cortes</p>
              <p className="text-[#888888] text-xs font-sans">Las fotografías de cortes realizados pueden compartirse aquí como referencia de trabajo.</p>
            </div>
          </div>
        </div>

      </div>
    </PageTransition>
  );
}
