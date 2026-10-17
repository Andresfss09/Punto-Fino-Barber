import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  Scissors,
  ShoppingBag,
  Package,
  ShieldAlert,
  Image,
  Upload,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import PageTransition from '../../components/ui/PageTransition';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { OFFICIAL_SERVICES, OFFICIAL_PRODUCTS } from '../../config/businessConfig';

export default function AdminServices() {
  const [activeTab, setActiveTab] = useState('SERVICES'); // 'SERVICES' | 'PRODUCTS'
  const [services, setServices] = useState(OFFICIAL_SERVICES);
  const [products, setProducts] = useState(OFFICIAL_PRODUCTS);
  const [loading, setLoading] = useState(true);

  // Modal de Servicio
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    slug: '',
    description: '',
    durationMinutes: 35,
    priceCOP: 24000,
    category: 'Experiencias',
    imageUrl: '',
  });

  // Modal de Producto ("Lo que usamos contigo")
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    brand: 'Rolda',
    category: 'ROLDAN_CARE',
    sizeLabel: '250 g',
    description: '',
    priceCOP: 34000,
    stock: 20,
    containsAlcohol: false,
    imageUrl: '',
  });

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [srvRes, prdRes] = await Promise.allSettled([
        api.get('/services'),
        api.get('/admin/inventory?includeInactive=true'),
      ]);

      if (srvRes.status === 'fulfilled') {
        const val = srvRes.value;
        const list = val?.services || val?.data?.services || val?.data?.data?.services;
        if (Array.isArray(list) && list.length > 0) setServices(list);
      }

      if (prdRes.status === 'fulfilled') {
        const val = prdRes.value;
        const list = val?.products || val?.data?.products || val?.data?.data?.products;
        if (Array.isArray(list) && list.length > 0) setProducts(list);
      }
    } catch (e) {
      // Mantiene datos oficiales en caso de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleImageUpload = (e, isProduct = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isProduct) {
          setProductForm((prev) => ({ ...prev, imageUrl: reader.result }));
        } else {
          setServiceForm((prev) => ({ ...prev, imageUrl: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handlers de Servicios
  const openServiceModal = (srv = null) => {
    setEditingService(srv);
    if (srv) {
      setServiceForm({
        name: srv.name,
        slug: srv.slug || srv.id,
        description: srv.description || srv.desc || '',
        durationMinutes: srv.durationMinutes ?? srv.duration ?? 35,
        priceCOP: srv.priceCOP ?? srv.price ?? 24000,
        category: srv.category || 'Experiencias',
        imageUrl: srv.imageUrl || '',
      });
    } else {
      setServiceForm({
        name: '',
        slug: '',
        description: '',
        durationMinutes: 35,
        priceCOP: 24000,
        category: 'Experiencias',
        imageUrl: '',
      });
    }
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      const slug =
        serviceForm.slug ||
        serviceForm.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-');

      const payload = {
        name: serviceForm.name.trim(),
        slug,
        description: serviceForm.description.trim(),
        durationMinutes: Number(serviceForm.durationMinutes),
        priceCOP: Number(serviceForm.priceCOP),
        category: serviceForm.category,
        imageUrl: serviceForm.imageUrl || null,
      };

      if (editingService) {
        await api.put(`/services/${editingService.id}`, payload);
        toast.success('Servicio actualizado en el catálogo.');
      } else {
        await api.post('/services', payload);
        toast.success('Nuevo servicio creado exitosamente.');
      }
      setServiceModalOpen(false);
      fetchCatalog();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar el servicio.');
    }
  };

  const handleDeleteService = async (id) => {
    try {
      await api.delete(`/services/${id}`);
      toast.success('Servicio desactivado del catálogo público.');
      fetchCatalog();
    } catch (err) {
      toast.error('No se pudo desactivar el servicio.');
    }
  };

  // Handlers de Productos
  const openProductModal = (prod = null) => {
    setEditingProduct(prod);
    if (prod) {
      setProductForm({
        name: prod.name,
        sku: prod.sku || '',
        brand: prod.brand || 'Rolda',
        category: prod.category || 'ROLDAN_CARE',
        sizeLabel: prod.sizeLabel || '',
        description: prod.description || '',
        priceCOP: prod.priceCOP ?? prod.price ?? 34000,
        stock: prod.stock ?? 20,
        containsAlcohol: Boolean(prod.containsAlcohol),
        imageUrl: prod.imageUrl || '',
      });
    } else {
      setProductForm({
        name: '',
        sku: '',
        brand: 'Rolda',
        category: 'ROLDAN_CARE',
        sizeLabel: '',
        description: '',
        priceCOP: 34000,
        stock: 20,
        containsAlcohol: false,
        imageUrl: '',
      });
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/inventory', {
        id: editingProduct?.id,
        ...productForm,
        priceCOP: Number(productForm.priceCOP),
        stock: Number(productForm.stock),
        imageUrl: productForm.imageUrl || null,
      });
      toast.success('Producto guardado en "Lo que usamos contigo".');
      setProductModalOpen(false);
      fetchCatalog();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar el producto.');
    }
  };

  const handleQuickStockAdjust = async (prod, delta) => {
    try {
      await api.post('/admin/inventory/movement', {
        productId: prod.id,
        type: delta > 0 ? 'ENTRADA_COMPRA' : 'SALIDA_VENTA',
        quantity: Math.abs(delta),
        notes: delta > 0 ? 'Reposición rápida desde consola' : 'Salida / Venta en sede',
      });
      toast.success(`Stock de ${prod.name} actualizado.`);
      fetchCatalog();
    } catch (err) {
      toast.error('Error al registrar movimiento de inventario.');
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8 pb-16">
        {/* Encabezado y Selector de Pestaña */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <span className="text-xs font-sans font-semibold text-[#B89758] block mb-1">
              Catálogo oficial · Tarifas en COP
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Servicios y productos (&ldquo;Lo que usamos contigo&rdquo;)
            </h2>
            <p className="text-[#9B988F] text-xs sm:text-sm font-sans mt-1">
              Gestiona los 5 servicios oficiales de barbería (un servicio por reserva) y los 8 productos del catálogo Rolda y Nevera.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-[#111215] p-1 rounded-md border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('SERVICES')}
                className={`px-4 py-2 rounded text-xs font-sans font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'SERVICES'
                    ? 'bg-[#E15233] text-white'
                    : 'text-[#9B988F] hover:text-white'
                }`}
              >
                <Scissors size={13} />
                <span>Servicios ({services.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PRODUCTS')}
                className={`px-4 py-2 rounded text-xs font-sans font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'PRODUCTS'
                    ? 'bg-[#B89758] text-black'
                    : 'text-[#9B988F] hover:text-white'
                }`}
              >
                <ShoppingBag size={13} />
                <span>Productos Rolda & Nevera ({products.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                activeTab === 'SERVICES' ? openServiceModal() : openProductModal()
              }
              className="bg-white hover:bg-[#EFECE4] text-black font-sans font-semibold text-xs px-4 py-2.5 rounded-md inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>
                {activeTab === 'SERVICES' ? 'Nuevo servicio' : 'Nuevo producto'}
              </span>
            </button>
          </div>
        </div>

        {/* PESTAÑA 1: SERVICIOS DE BARBERÍA */}
        {activeTab === 'SERVICES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((srv) => {
              const price = srv.priceCOP ?? srv.price ?? 0;
              const duration = srv.durationMinutes ?? srv.duration ?? 35;
              const desc = srv.description || srv.desc;

              return (
                <div
                  key={srv.id}
                  className="bg-[#111215] border border-white/10 rounded-md p-6 flex flex-col justify-between space-y-5 shadow-xl"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-sans font-medium bg-[#18191E] text-[#B89758] border border-white/10">
                        {srv.category || 'Servicio Oficial'}
                      </span>
                      <span className="text-xs font-sans text-[#9B988F] flex items-center gap-1 tabular-nums">
                        <Clock size={12} className="text-[#B89758]" />
                        {duration} min
                      </span>
                    </div>

                    {srv.imageUrl && (
                      <div className="w-full h-36 bg-[#0e1014] border border-white/10 rounded-md overflow-hidden relative">
                        <img
                          src={srv.imageUrl}
                          alt={srv.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <h3 className="font-display text-lg font-bold text-white leading-snug">
                      {srv.name}
                    </h3>

                    <p className="text-xs font-sans text-[#9B988F] leading-relaxed">
                      {desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-sans text-[#9B988F]">Tarifa unificada</span>
                      <span className="text-lg font-sans font-bold text-white tabular-nums">
                        ${Number(price).toLocaleString('es-CO')} COP
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openServiceModal(srv)}
                        className="flex-1 bg-[#18191E] hover:bg-[#22242B] text-white border border-white/15 font-sans font-medium text-xs py-2 rounded-md inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 size={13} />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(srv.id)}
                        className="px-3 py-2 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer"
                        title="Desactivar servicio"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PESTAÑA 2: CATÁLOGO DE PRODUCTOS ("LO QUE USAMOS CONTIGO") */}
        {activeTab === 'PRODUCTS' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((prod) => {
              const price = prod.priceCOP ?? prod.price ?? 0;
              const imgUrl = prod.imageUrl || prod.image;
              const isRolda = prod.category === 'ROLDAN_CARE';

              return (
                <div
                  key={prod.id || prod.sku}
                  className="bg-[#111215] border border-white/10 rounded-md p-5 flex flex-col justify-between space-y-4 shadow-xl"
                >
                  <div>
                    <div className="w-full aspect-[4/3] bg-[#0e1014] border border-white/10 rounded-md flex items-center justify-center mb-4 overflow-hidden relative">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={prod.name}
                          className="w-full h-full object-contain p-3"
                        />
                      ) : (
                        <Package size={28} className="text-[#B89758]" />
                      )}
                      {prod.sizeLabel && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#111215]/90 border border-white/10 text-[10px] font-sans text-[#cccccc] tabular-nums">
                          {prod.sizeLabel}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-sans font-medium text-[#B89758] block">
                        {isRolda ? 'Cuidado Capilar Rolda' : 'Nevera & Bebidas'}
                      </span>
                      <h3 className="font-display text-base font-bold text-white">
                        {prod.name}
                      </h3>
                      <p className="text-xs font-sans text-[#9B988F] line-clamp-2">
                        {prod.description}
                      </p>
                      {prod.containsAlcohol && (
                        <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/25 text-[10px] font-sans text-amber-200 flex items-start gap-1.5">
                          <ShieldAlert size={12} className="shrink-0 mt-0.5 text-amber-400" />
                          <span>
                            Mayoría de edad (+18). [REVISAR CON ABOGADO]
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="font-bold text-base text-white tabular-nums">
                        ${Number(price).toLocaleString('es-CO')} COP
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums ${
                          (prod.stock ?? 20) <= (prod.minStock ?? 5)
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        Stock: {prod.stock ?? 20} u.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openProductModal(prod)}
                        className="flex-1 bg-[#18191E] hover:bg-[#22242B] text-white border border-white/15 font-sans font-medium text-xs py-2 rounded-md inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Edit2 size={12} />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStockAdjust(prod, 5)}
                        className="px-2.5 py-2 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 text-xs font-sans font-semibold tabular-nums cursor-pointer"
                        title="Sumar 5 unidades al stock"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStockAdjust(prod, -1)}
                        className="px-2.5 py-2 rounded-md bg-white/5 hover:bg-white/10 text-[#cccccc] border border-white/10 text-xs font-sans font-semibold tabular-nums cursor-pointer"
                        title="Descontar 1 unidad por venta"
                      >
                        -1
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Servicio */}
        <Modal
          isOpen={serviceModalOpen}
          onClose={() => setServiceModalOpen(false)}
          title={editingService ? 'Editar servicio' : 'Nuevo servicio'}
        >
          <form onSubmit={handleSaveService} className="space-y-4 font-sans">
            <div>
              <label className="block text-xs font-medium text-[#cccccc] mb-1">
                Nombre del servicio
              </label>
              <input
                type="text"
                required
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#cccccc] mb-1">
                Descripción
              </label>
              <textarea
                rows={3}
                required
                value={serviceForm.description}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, description: e.target.value })
                }
                className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#cccccc] mb-1">
                  Precio en COP
                </label>
                <input
                  type="number"
                  required
                  value={serviceForm.priceCOP}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, priceCOP: Number(e.target.value) })
                  }
                  className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white tabular-nums outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#cccccc] mb-1">
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  required
                  value={serviceForm.durationMinutes}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white tabular-nums outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#cccccc] mb-1">
                Imagen del servicio (opcional)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="URL de imagen o presiona Subir"
                  value={serviceForm.imageUrl}
                  onChange={(e) => setServiceForm({ ...serviceForm, imageUrl: e.target.value })}
                  className="flex-1 bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2 text-xs text-white outline-none"
                />
                <label className="px-3 py-2 bg-[#18191E] hover:bg-[#22242B] border border-white/15 rounded-md cursor-pointer text-xs text-[#cccccc] hover:text-white flex items-center gap-1.5 transition-colors shrink-0">
                  <Upload size={14} className="text-[#B89758]" />
                  <span>Subir</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    className="hidden"
                  />
                </label>
              </div>
              {serviceForm.imageUrl && (
                <div className="mt-2 relative w-full h-28 bg-[#0e1014] border border-white/10 rounded-md overflow-hidden flex items-center justify-center">
                  <img
                    src={serviceForm.imageUrl}
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setServiceForm((prev) => ({ ...prev, imageUrl: '' }))}
                    className="absolute top-1 right-1 bg-black/75 hover:bg-black text-rose-400 p-1 rounded text-xs cursor-pointer"
                    title="Quitar imagen"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="px-4 py-2 rounded-md bg-[#18191E] text-[#cccccc] text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-md bg-[#E15233] text-white text-xs font-semibold cursor-pointer"
              >
                Guardar servicio
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal de Producto */}
        <Modal
          isOpen={productModalOpen}
          onClose={() => setProductModalOpen(false)}
          title={editingProduct ? 'Editar producto' : 'Nuevo producto'}
        >
          <form onSubmit={handleSaveProduct} className="space-y-4 font-sans">
            <div>
              <label className="block text-xs font-medium text-[#cccccc] mb-1">
                Nombre del producto
              </label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#cccccc] mb-1">
                  Categoría
                </label>
                <select
                  value={productForm.category}
                  onChange={(e) =>
                    setProductForm({ ...productForm, category: e.target.value })
                  }
                  className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white outline-none"
                >
                  <option value="ROLDAN_CARE">Cuidado Capilar Rolda</option>
                  <option value="NEVERA_BAR">Nevera & Bebidas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#cccccc] mb-1">
                  Presentación / Tamaño
                </label>
                <input
                  type="text"
                  value={productForm.sizeLabel}
                  onChange={(e) =>
                    setProductForm({ ...productForm, sizeLabel: e.target.value })
                  }
                  placeholder="Ej. 250 g o 473 ml"
                  className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#cccccc] mb-1">
                  Precio de venta (COP)
                </label>
                <input
                  type="number"
                  required
                  value={productForm.priceCOP}
                  onChange={(e) =>
                    setProductForm({ ...productForm, priceCOP: Number(e.target.value) })
                  }
                  className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white tabular-nums outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#cccccc] mb-1">
                  Stock disponible
                </label>
                <input
                  type="number"
                  required
                  value={productForm.stock}
                  onChange={(e) =>
                    setProductForm({ ...productForm, stock: Number(e.target.value) })
                  }
                  className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white tabular-nums outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#cccccc] mb-1">
                Descripción
              </label>
              <textarea
                rows={2}
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({ ...productForm, description: e.target.value })
                }
                className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#cccccc] mb-1">
                Imagen del producto (opcional)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="URL de imagen o presiona Subir"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  className="flex-1 bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2 text-xs text-white outline-none"
                />
                <label className="px-3 py-2 bg-[#18191E] hover:bg-[#22242B] border border-white/15 rounded-md cursor-pointer text-xs text-[#cccccc] hover:text-white flex items-center gap-1.5 transition-colors shrink-0">
                  <Upload size={14} className="text-[#B89758]" />
                  <span>Subir</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                    className="hidden"
                  />
                </label>
              </div>
              {productForm.imageUrl && (
                <div className="mt-2 relative w-full h-28 bg-[#0e1014] border border-white/10 rounded-md overflow-hidden flex items-center justify-center">
                  <img
                    src={productForm.imageUrl}
                    alt="Vista previa"
                    className="h-full w-auto object-contain max-h-28"
                  />
                  <button
                    type="button"
                    onClick={() => setProductForm((prev) => ({ ...prev, imageUrl: '' }))}
                    className="absolute top-1 right-1 bg-black/75 hover:bg-black text-rose-400 p-1 rounded text-xs cursor-pointer"
                    title="Quitar imagen"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs text-[#cccccc] cursor-pointer">
              <input
                type="checkbox"
                checked={productForm.containsAlcohol}
                onChange={(e) =>
                  setProductForm({ ...productForm, containsAlcohol: e.target.checked })
                }
              />
              <span>Contiene alcohol (Venta exclusiva a mayores de 18 años)</span>
            </label>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="px-4 py-2 rounded-md bg-[#18191E] text-[#cccccc] text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-md bg-[#E15233] text-white text-xs font-semibold cursor-pointer"
              >
                Guardar producto
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}
