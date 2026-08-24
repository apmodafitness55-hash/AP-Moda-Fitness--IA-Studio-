/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  Layers, 
  HelpCircle,
  Eye,
  ShoppingBag,
  UploadCloud
} from 'lucide-react';
import { Product } from '../types';
import ImageUploader from './ImageUploader';
import { pushSystemConfigToSupabase } from '../supabase';

interface CategoryBubblesManagerProps {
  products: Product[];
  themeColor?: string;
  onSaved?: () => void;
}

// Fallback high-res fitness image mapper
export const getFallbackCategoryPhoto = (category: string): string => {
  const cat = (category || '').toLowerCase().trim();
  if (cat === 'todos' || cat === 'todas') {
    return 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=300&h=300&fit=crop&q=80';
  }
  if (cat.includes('blusa') || cat.includes('camiseta') || cat.includes('top') || cat.includes('cropped') || cat.includes('dry-fit') || cat.includes('dryfit') || cat.includes('regata')) {
    return 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=300&h=300&fit=crop&q=80';
  }
  if (cat.includes('legging') || cat.includes('calça') || cat.includes('calca') || cat.includes('calças')) {
    return 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=300&h=300&fit=crop&q=80';
  }
  if (cat.includes('short') || cat.includes('bermuda')) {
    return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&q=80';
  }
  if (cat.includes('conjunto') || cat.includes('conjuntos')) {
    return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&q=80';
  }
  if (cat.includes('slim') || cat.includes('fit')) {
    return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&h=300&fit=crop&q=80';
  }
  if (cat.includes('plus') || cat.includes('size')) {
    return 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=300&h=300&fit=crop&q=80';
  }
  if (cat.includes('macacão') || cat.includes('macacao') || cat.includes('body')) {
    return 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=300&h=300&fit=crop&q=80';
  }
  if (cat.includes('casaco') || cat.includes('jaqueta') || cat.includes('corta-vento')) {
    return 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=300&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=300&h=300&fit=crop&q=80';
};

export const resolveCategoryBubbleImage = (
  category: string,
  categoryThumbnails: Record<string, string>,
  products: Product[]
): { url: string; source: 'custom' | 'product' | 'fallback' } => {
  const normCat = (category || '').trim();
  const lowerCat = normCat.toLowerCase();

  // 1. Direct custom override
  if (categoryThumbnails[normCat] && categoryThumbnails[normCat].trim().length > 0) {
    return { url: categoryThumbnails[normCat], source: 'custom' };
  }
  for (const [key, val] of Object.entries(categoryThumbnails)) {
    if (key.trim().toLowerCase() === lowerCat && val && val.trim().length > 0) {
      return { url: val, source: 'custom' };
    }
  }

  // 2. Special case for 'Todos'
  if (lowerCat === 'todos' || lowerCat === 'todas') {
    const storeLogo = localStorage.getItem('ap_store_logo');
    if (storeLogo && (storeLogo.startsWith('http') || storeLogo.startsWith('data:image'))) {
      return { url: storeLogo, source: 'custom' };
    }
    const firstWithImg = products.find(p => p.image && p.image.trim().length > 0);
    if (firstWithImg?.image) {
      return { url: firstWithImg.image, source: 'product' };
    }
    return { url: getFallbackCategoryPhoto('todos'), source: 'fallback' };
  }

  // 3. Find first product in inventory with this category that has an image
  const productMatch = products.find(p => {
    if (!p.image || p.image.trim().length === 0) return false;
    const pCat = (p.category || '').trim().toLowerCase();
    return pCat === lowerCat || 
           (lowerCat.includes('legging') && pCat.includes('legging')) ||
           (lowerCat.includes('top') && pCat.includes('top')) ||
           (lowerCat.includes('short') && pCat.includes('short')) ||
           (lowerCat.includes('conjunto') && pCat.includes('conjunto')) ||
           (lowerCat.includes('macac') && pCat.includes('macac'));
  });

  if (productMatch?.image) {
    return { url: productMatch.image, source: 'product' };
  }

  // 4. Default fallback
  return { url: getFallbackCategoryPhoto(category), source: 'fallback' };
};

export default function CategoryBubblesManager({
  products,
  themeColor = '#db2777',
  onSaved
}: CategoryBubblesManagerProps) {
  // Custom category thumbnails storage
  const [thumbnails, setThumbnails] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('ap_vitrine_category_thumbnails');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Erro ao carregar miniaturas de categorias:', e);
    }
    return {};
  });

  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Collect all unique categories from products, defaults, and custom thumbnails
  const allCategories = useMemo(() => {
    const defaultCategories = [
      'Todos',
      'Calça Legging',
      'Leggings',
      'Tops',
      'Shorts',
      'Conjuntos',
      'Macacões',
      'Casacos',
      'Regatas'
    ];

    const fromProducts = products.map(p => p.category).filter(Boolean);
    const fromCustomThumbnails = Object.keys(thumbnails);

    const merged = new Set<string>();
    
    // Add default first
    defaultCategories.forEach(c => merged.add(c));
    // Add product categories
    fromProducts.forEach(c => merged.add(c));
    // Add any custom saved keys
    fromCustomThumbnails.forEach(c => merged.add(c));

    return Array.from(merged).filter(cat => cat && cat.trim().length > 0);
  }, [products, thumbnails]);

  // Filtered categories for UI search
  const filteredCategories = useMemo(() => {
    if (!searchFilter.trim()) return allCategories;
    const q = searchFilter.toLowerCase();
    return allCategories.filter(cat => cat.toLowerCase().includes(q));
  }, [allCategories, searchFilter]);

  // Handle single category image update
  const handleSetCategoryImage = (categoryName: string, imageUrl: string) => {
    setThumbnails(prev => {
      const updated = { ...prev, [categoryName]: imageUrl };
      return updated;
    });
    setSaveSuccess(false);
  };

  // Handle remove custom image for category
  const handleRemoveCategoryImage = (categoryName: string) => {
    setThumbnails(prev => {
      const updated = { ...prev };
      delete updated[categoryName];
      // Also try normalized lowercase key
      delete updated[categoryName.toLowerCase()];
      return updated;
    });
    setSaveSuccess(false);
  };

  // Add a new custom category
  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCategoryInput.trim();
    if (!clean) return;

    if (!thumbnails[clean]) {
      setThumbnails(prev => ({
        ...prev,
        [clean]: ''
      }));
    }
    setNewCategoryInput('');
  };

  // Save all category thumbnails to localStorage & Supabase
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('ap_vitrine_category_thumbnails', JSON.stringify(thumbnails));
      await pushSystemConfigToSupabase('ap_vitrine_category_thumbnails', JSON.stringify(thumbnails));
      
      // Dispatch custom event so PublicCatalog & Vitrine immediately reflect without reload
      window.dispatchEvent(new Event('ap_category_thumbnails_updated'));

      setSaveSuccess(true);
      if (onSaved) onSaved();

      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Erro ao salvar imagens das categorias:', err);
      alert('Erro ao salvar alterações no banco de dados. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Count products in each category
  const getProductCount = (category: string) => {
    if (category.toLowerCase() === 'todos') return products.length;
    return products.filter(p => (p.category || '').toLowerCase() === category.toLowerCase()).length;
  };

  // Find products that can be selected for this category
  const getAvailableProductsForCategory = (category: string) => {
    const lower = category.toLowerCase();
    const inCategory = products.filter(p => (p.category || '').toLowerCase() === lower && p.image);
    if (inCategory.length > 0) return inCategory;
    // If none in this specific category, return all products that have images
    return products.filter(p => p.image);
  };

  return (
    <div className="space-y-6 text-left" id="category-bubbles-manager">
      {/* Header Description */}
      <div className="bg-gradient-to-r from-pink-50 via-rose-50/50 to-white p-5 rounded-2xl border border-pink-150/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-pink-600 animate-pulse" />
              <span>Imagens das Bolinhas / Stories das Categorias</span>
              <span className="bg-pink-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Vitrine Online</span>
            </h4>
            <p className="text-[11px] text-slate-650 leading-relaxed font-medium max-w-3xl">
              Defina a imagem de cada bolinha circular (estilo Stories do Instagram) que aparece no topo da sua vitrine. 
              Você pode fazer <strong>upload de uma foto exclusiva</strong>, <strong>selecionar a foto de uma peça do estoque</strong> com 1 clique ou usar a <strong>foto automática</strong> da primeira peça cadastrada na categoria.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="bg-pink-600 hover:bg-pink-700 active:scale-95 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition shadow-sm border-none disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Salvar Imagens das Categorias</span>
                </>
              )}
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-3.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-[11px] font-bold animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <span>Imagens das bolinhas de categorias salvas e sincronizadas com sucesso na Vitrine e no Supabase!</span>
          </div>
        )}
      </div>

      {/* Top Bar: Add custom category + Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
        <form onSubmit={handleAddCustomCategory} className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Nova Categoria (ex: Calça Legging, Top, Macacão...)"
            value={newCategoryInput}
            onChange={(e) => setNewCategoryInput(e.target.value)}
            className="flex-1 bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
          />
          <button
            type="submit"
            disabled={!newCategoryInput.trim()}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition border-none disabled:opacity-40"
          >
            <Plus size={14} />
            <span>Adicionar</span>
          </button>
        </form>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filtrar categorias..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-white border border-slate-250 rounded-xl px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-pink-500"
          />
          <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
            {filteredCategories.length} categorias
          </span>
        </div>
      </div>

      {/* Live Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((category) => {
          const resolved = resolveCategoryBubbleImage(category, thumbnails, products);
          const hasCustom = Boolean(thumbnails[category] && thumbnails[category].trim().length > 0);
          const count = getProductCount(category);
          const availableProducts = getAvailableProductsForCategory(category);

          return (
            <div
              key={`cat-card-${category}`}
              className={`bg-white border rounded-2xl p-4 transition-all duration-200 shadow-2xs flex flex-col justify-between
                ${hasCustom ? 'border-pink-300 ring-1 ring-pink-100 bg-pink-50/10' : 'border-slate-200/90 hover:border-slate-300'}`}
            >
              {/* Category Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                      <span>{category}</span>
                      {category.toLowerCase() === 'todos' && (
                        <span className="bg-slate-100 text-slate-600 text-[8.5px] font-black px-1.5 py-0.5 rounded">Geral</span>
                      )}
                    </h5>
                    <span className="text-[9.5px] font-semibold text-slate-400">
                      {count} {count === 1 ? 'peça cadastrada' : 'peças cadastradas'}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {hasCustom ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-emerald-600" />
                        <span>Personalizada</span>
                      </span>
                    ) : resolved.source === 'product' ? (
                      <span className="bg-sky-100 text-sky-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <ShoppingBag size={10} className="text-sky-600" />
                        <span>Foto do Estoque</span>
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Padrão Sistema
                      </span>
                    )}
                  </div>
                </div>

                {/* Circular Story Bubble Live Visual Preview */}
                <div className="flex items-center gap-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100 mb-3.5">
                  <div className="flex flex-col items-center gap-1">
                    <div 
                      className="w-16 h-16 rounded-full p-[2px] border-2 flex items-center justify-center shadow-xs transition-transform hover:scale-105"
                      style={{ borderColor: themeColor }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-slate-200 border border-white">
                        <img
                          src={resolved.url}
                          alt={category}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-700 tracking-tight text-center max-w-[70px] truncate">
                      {category}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1 text-left">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500 block">Prévia na Vitrine</span>
                    <p className="text-[10px] text-slate-600 font-medium leading-tight">
                      {hasCustom 
                        ? 'Usando imagem exclusiva definida por você.' 
                        : resolved.source === 'product' 
                          ? 'Usando automaticamente a foto de uma peça desta categoria.' 
                          : 'Usando foto fotográfica de alta qualidade do catálogo base.'}
                    </p>
                  </div>
                </div>

                {/* Image Upload Component */}
                <div className="space-y-2">
                  <label className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Upload Nova Imagem (Foto / Arquivo)
                  </label>
                  <ImageUploader
                    currentImageUrl={thumbnails[category] || ''}
                    onUploadSuccess={(url) => handleSetCategoryImage(category, url)}
                  />

                  {/* Manual URL input */}
                  <input
                    type="text"
                    placeholder="Ou cole o link direto da imagem (https://...)"
                    value={thumbnails[category] || ''}
                    onChange={(e) => handleSetCategoryImage(category, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-pink-500"
                  />
                </div>

                {/* Quick select from product photos */}
                {availableProducts.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Ou escolha da foto de uma peça cadastrada:
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSetCategoryImage(category, e.target.value);
                        }
                      }}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg px-2 py-1.5 cursor-pointer focus:outline-hidden transition"
                    >
                      <option value="">-- Selecionar Foto de Peça --</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.image}>
                          {p.name} (SKU: {p.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100 text-[10px]">
                {hasCustom ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveCategoryImage(category)}
                    className="text-pink-600 hover:text-pink-800 font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
                  >
                    <RotateCcw size={12} />
                    <span>Restaurar Automática</span>
                  </button>
                ) : (
                  <span className="text-slate-400 font-medium">Modo automático ativo</span>
                )}

                {/* Delete button if category has 0 products and is not default */}
                {count === 0 && category.toLowerCase() !== 'todos' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCategoryImage(category)}
                    className="text-slate-400 hover:text-red-500 font-medium flex items-center gap-1 bg-transparent border-none cursor-pointer p-0 transition"
                    title="Remover categoria da lista"
                  >
                    <Trash2 size={12} />
                    <span>Remover</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Save Reminder */}
      <div className="flex justify-end pt-3">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="bg-pink-600 hover:bg-pink-700 active:scale-95 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition shadow-xs border-none disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save size={14} />
              <span>Salvar Todas as Bolinhas de Categorias</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
