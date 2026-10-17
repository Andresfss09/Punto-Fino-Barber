import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Sparkles, Coffee, ShieldAlert } from 'lucide-react';
import { OFFICIAL_PRODUCTS } from '../../config/businessConfig';
import api from '../../services/api';

export default function BeveragesSection({ onSelectBeverage }) {
  const [products, setProducts] = useState(OFFICIAL_PRODUCTS);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    let mounted = true;
    api
      .get('/products')
      .then((res) => {
        const prodList = res?.products || res?.data?.products;
        if (mounted && prodList?.length > 0) {
          setProducts(prodList);
        }
      })
      .catch(() => {
        // Mantiene el catálogo oficial centralizado como respaldo inmediato
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleAdd = (prod) => {
    if (onSelectBeverage) {
      onSelectBeverage(prod);
    }
    const el = document.getElementById('reservar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isRoldaCategory = (cat) => cat === 'ROLDA' || cat === 'ROLDAN_CARE';
  const isNeveraCategory = (cat) => cat === 'NEVERA' || cat === 'NEVERA_BAR';

  const filteredProducts = products.filter((p) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'ROLDA') return isRoldaCategory(p.category);
    if (activeFilter === 'NEVERA') return isNeveraCategory(p.category);
    return p.category === activeFilter;
  });

  const roldaCount = products.filter((p) => isRoldaCategory(p.category)).length;
  const neveraCount = products.filter((p) => isNeveraCategory(p.category)).length;

  return (
    <section id="bebidas" className="py-20 sm:py-28 bg-[#0b0c0e] border-b border-white/10 scroll-mt-24">
      <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        <div className="bg-[#111215] border border-white/10 rounded-md p-6 sm:p-10 lg:p-12 shadow-xl">
          {/* Encabezado y Pestañas de Filtro */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 border-b border-white/10 pb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-md bg-[#18191E] border border-white/10 flex items-center justify-center shrink-0 text-[#B89758] shadow-inner">
                <ShoppingBag size={22} />
              </div>
              <div>
                <span className="font-sans text-xs text-[#B89758] font-semibold block mb-1">
                  Cuidado masculino & Nevera en sede
                </span>
                <h2 className="font-display text-3xl sm:text-4xl text-white font-bold tracking-tight leading-tight">
                  Lo que usamos contigo
                </h2>
                <p className="font-sans text-sm sm:text-base text-[#9B988F] mt-2 max-w-2xl">
                  Productos profesionales Rolda para el cuidado de tu cabello y barba, más bebidas frías de nuestra nevera para acompañar tu cita en Punto Fino.
                </p>
              </div>
            </div>

            {/* Pestañas de Categoría */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`px-4 py-2 rounded-md text-xs font-sans font-semibold transition-all cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-white text-black shadow-sm'
                    : 'bg-[#18191E] text-[#9B988F] hover:text-white border border-white/10'
                }`}
              >
                Todos ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('ROLDA')}
                className={`px-4 py-2 rounded-md text-xs font-sans font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeFilter === 'ROLDA'
                    ? 'bg-[#B89758] text-black shadow-sm'
                    : 'bg-[#18191E] text-[#9B988F] hover:text-white border border-white/10'
                }`}
              >
                <Sparkles size={13} />
                <span>Cuidado Capilar Rolda ({roldaCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('NEVERA')}
                className={`px-4 py-2 rounded-md text-xs font-sans font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeFilter === 'NEVERA'
                    ? 'bg-[#E15233] text-white shadow-sm'
                    : 'bg-[#18191E] text-[#9B988F] hover:text-white border border-white/10'
                }`}
              >
                <Coffee size={13} />
                <span>Nevera & Bebidas ({neveraCount})</span>
              </button>
            </div>
          </div>

          {/* Grid de los 8 Productos Oficiales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => {
              const price = prod.priceCOP ?? prod.price ?? 0;
              const imgUrl = prod.imageUrl || prod.image;
              const isAlcohol = Boolean(prod.containsAlcohol);
              const isRolda = isRoldaCategory(prod.category);

              return (
                <div
                  key={prod.id || prod.sku}
                  className="bg-[#16181D] border border-white/10 hover:border-[#B89758]/50 rounded-md p-5 flex flex-col justify-between transition-all duration-200 group shadow-lg"
                >
                  <div>
                    {/* Imagen Real del Producto */}
                    <div className="w-full aspect-[4/3] bg-[#0e1014] border border-white/10 rounded-md flex items-center justify-center mb-4 group-hover:border-white/25 transition-colors overflow-hidden relative">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={prod.name}
                          className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <span className="font-display text-2xl font-bold text-[#F7F5F0]">
                          {prod.name}
                        </span>
                      )}
                      {prod.sizeLabel && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-[#111215]/90 border border-white/10 text-[11px] font-sans text-[#cccccc] tabular-nums">
                          {prod.sizeLabel}
                        </span>
                      )}
                    </div>

                    {/* Categoría y Nombre */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-sans text-[11px] font-medium text-[#B89758]">
                          {isRolda ? 'Cuidado Capilar · Rolda' : 'Nevera · Bebidas Frías'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Disponible
                        </span>
                      </div>

                      <h3 className="font-display text-lg text-white font-bold leading-snug">
                        {prod.name}
                      </h3>

                      {prod.description && (
                        <p className="font-sans text-xs text-[#9B988F] leading-relaxed line-clamp-2">
                          {prod.description}
                        </p>
                      )}

                      {isAlcohol && (
                        <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/25 text-[11px] font-sans text-amber-200 flex items-start gap-1.5">
                          <ShieldAlert size={13} className="shrink-0 mt-0.5 text-amber-400" />
                          <span>
                            Venta exclusiva a mayores de 18 años. [REVISAR CON ABOGADO: aviso legal de expendio de bebidas alcohólicas]
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Precio con números tabulares y Botón de Agregar */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-sans text-[#9B988F]">Precio en sede</span>
                      <span className="font-sans font-bold text-lg text-white tabular-nums">
                        ${Number(price).toLocaleString('es-CO')} COP
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAdd(prod)}
                      className="w-full bg-[#111215] hover:bg-white text-white hover:text-black border border-white/15 hover:border-white font-sans font-semibold text-xs py-2.5 px-4 rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      <span>Agregar a mi cita</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
