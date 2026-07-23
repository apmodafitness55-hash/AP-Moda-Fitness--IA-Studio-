/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronDown,
  X,
  Sparkles,
  Ruler,
  Maximize,
  Loader2
} from 'lucide-react';
import { Product } from '../types';
import ImageUploader from './ImageUploader';

interface CatalogInventoryProps {
  products: Product[];
  onAddProduct: (prod: Product) => Promise<void> | void;
  onUpdateProduct: (prod: Product) => Promise<void> | void;
  onDeleteProduct: (id: string) => void;
  activeSubTab?: 'inventario' | 'restoque' | 'cadastro';
  setActiveSubTab?: (subTab: 'inventario' | 'restoque' | 'cadastro') => void;
}

const colorToHex = (colorName: string | undefined | null): string => {
  if (!colorName || typeof colorName !== 'string') return '#cccccc';
  const norm = colorName.toLowerCase().trim();
  
  // 1. Look up in dynamic custom color map first
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('ap_custom_color_map');
      if (saved) {
        const map = JSON.parse(saved);
        if (map[norm]) return map[norm];
      }
    }
  } catch (e) {
    // ignore
  }

  // 2. Simple fallbacks for common names
  const fallbacks: Record<string, string> = {
    'preto': '#0f172a',
    'black': '#0f172a',
    'branco': '#ffffff',
    'white': '#ffffff',
    'vermelho': '#ef4444',
    'red': '#ef4444',
    'azul': '#3b82f6',
    'blue': '#3b82f6',
    'verde': '#10b981',
    'green': '#10b981',
    'amarelo': '#eab308',
    'yellow': '#eab308',
    'cinza': '#64748b',
    'gray': '#64748b',
    'grey': '#64748b',
    'laranja': '#f97316',
    'orange': '#f97316',
    'rosa': '#db2777',
    'pink': '#db2777',
    'lilas': '#c084fc',
    'lilás': '#c084fc',
    'lilais': '#c084fc',
    'roxo': '#7c3aed',
    'purple': '#7c3aed',
    'violeta': '#7c3aed',
    'bege': '#e4d5be',
    'beige': '#e4d5be',
    'creme': '#e4d5be',
    'marrom': '#78350f',
    'brown': '#78350f',
    'fucsia': '#d946ef',
    'fúcsia': '#d946ef',
    'magenta': '#d946ef',
    'marinho': '#1e3a8a',
    'navy': '#1e3a8a'
  };

  if (fallbacks[norm]) return fallbacks[norm];

  // Try sub-matches for simple compound terms
  for (const [key, value] of Object.entries(fallbacks)) {
    if (norm.includes(key)) return value;
  }

  // 3. Dynamic HSL fallback (elegant HSL tone based on name hash)
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = norm.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 55%)`;
};

export const DEFAULT_MEASUREMENT_SPECS: Record<string, { bustoMin: number; bustoMax: number; cinturaMin: number; cinturaMax: number; quadrilMin: number; quadrilMax: number }> = {
  P: { bustoMin: 80, bustoMax: 88, cinturaMin: 60, cinturaMax: 68, quadrilMin: 88, quadrilMax: 96 },
  M: { bustoMin: 89, bustoMax: 96, cinturaMin: 69, cinturaMax: 76, quadrilMin: 97, quadrilMax: 104 },
  G: { bustoMin: 97, bustoMax: 104, cinturaMin: 77, cinturaMax: 84, quadrilMin: 105, quadrilMax: 112 },
  GG: { bustoMin: 105, bustoMax: 112, cinturaMin: 85, cinturaMax: 92, quadrilMin: 113, quadrilMax: 120 }
};

export const getFallbackSpecsForSize = (sz: string) => {
  const norm = sz.toUpperCase().trim();
  if (DEFAULT_MEASUREMENT_SPECS[norm]) {
    return { ...DEFAULT_MEASUREMENT_SPECS[norm] };
  }
  if (norm === 'PP' || norm === '34' || norm === '36') {
    return { bustoMin: 74, bustoMax: 79, cinturaMin: 54, cinturaMax: 59, quadrilMin: 80, quadrilMax: 87 };
  }
  if (norm === 'XG' || norm === 'EG' || norm === 'EXG' || norm === 'G1' || norm === '46') {
    return { bustoMin: 113, bustoMax: 120, cinturaMin: 93, cinturaMax: 100, quadrilMin: 121, quadrilMax: 128 };
  }
  return { bustoMin: 90, bustoMax: 98, cinturaMin: 70, cinturaMax: 78, quadrilMin: 98, quadrilMax: 106 };
};

export default function CatalogInventory({ 
  products: rawProducts, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  activeSubTab,
  setActiveSubTab
}: CatalogInventoryProps) {
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic custom color map state
  const [customColorMap, setCustomColorMap] = useState<Record<string, string>>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('ap_custom_color_map');
        return saved ? JSON.parse(saved) : {};
      }
    } catch {
      // fallback
    }
    return {};
  });

  const handleColorHexChange = async (colorName: string, hex: string) => {
    const norm = colorName.toLowerCase().trim();
    if (!norm) return;
    
    const updatedMap = {
      ...customColorMap,
      [norm]: hex
    };
    setCustomColorMap(updatedMap);
    localStorage.setItem('ap_custom_color_map', JSON.stringify(updatedMap));
  };

  // States for size-specific colors
  const [newSizeColors, setNewSizeColors] = useState<Record<string, string>>({});
  const [editSizeColors, setEditSizeColors] = useState<Record<string, string>>({});

  // States for color-specific stocks
  const [newColorStocks, setNewColorStocks] = useState<Record<string, number>>({});
  const [editColorStocks, setEditColorStocks] = useState<Record<string, number>>({});

  // States for size-color specific stocks
  const [newSizeColorStocks, setNewSizeColorStocks] = useState<Record<string, Record<string, number>>>({});
  const [editSizeColorStocks, setEditSizeColorStocks] = useState<Record<string, Record<string, number>>>({});

  // States for measurement specifications (Provador Virtual)
  const [newMeasurementSpecs, setNewMeasurementSpecs] = useState<Record<string, { bustoMin: number; bustoMax: number; cinturaMin: number; cinturaMax: number; quadrilMin: number; quadrilMax: number }>>({});
  const [editMeasurementSpecs, setEditMeasurementSpecs] = useState<Record<string, { bustoMin: number; bustoMax: number; cinturaMin: number; cinturaMax: number; quadrilMin: number; quadrilMax: number }>>({});

  // Product Sub-Tab Switcher (Inventário, Combos, Markup, Curva ABC, Grade)
  const [internalSubTab, setInternalSubTab] = useState<'inventario' | 'combos' | 'markup' | 'abc' | 'grade'>('inventario');

  const [isReplenishmentModalOpen, setIsReplenishmentModalOpen] = useState(false);

  const criticalVariations = useMemo(() => {
    const list: Array<{
      productId: string;
      productName: string;
      sku: string;
      size: string;
      color: string;
      stock: number;
    }> = [];

    products.forEach(p => {
      if (p.sizeColorStocks && Object.keys(p.sizeColorStocks).length > 0) {
        Object.entries(p.sizeColorStocks).forEach(([sz, colorsObj]) => {
          if (colorsObj && typeof colorsObj === 'object') {
            Object.entries(colorsObj).forEach(([col, qty]) => {
              const qtyNum = Number(qty);
              if (!isNaN(qtyNum) && qtyNum <= 3) {
                list.push({
                  productId: p.id,
                  productName: p.name,
                  sku: p.sku,
                  size: sz,
                  color: col,
                  stock: qtyNum
                });
              }
            });
          }
        });
      } else if (p.colorStocks && Object.keys(p.colorStocks).length > 0) {
        const sizes = p.sizes && p.sizes.length > 0 ? p.sizes : ['Único'];
        Object.entries(p.colorStocks).forEach(([col, qty]) => {
          const qtyNum = Number(qty);
          if (!isNaN(qtyNum) && qtyNum <= 3) {
            sizes.forEach(sz => {
              list.push({
                productId: p.id,
                productName: p.name,
                sku: p.sku,
                size: sz,
                color: col,
                stock: qtyNum
              });
            });
          }
        });
      } else {
        const qtyNum = Number(p.stock);
        if (!isNaN(qtyNum) && qtyNum <= 3) {
          const sizes = p.sizes && p.sizes.length > 0 ? p.sizes : ['Único'];
          const colors = p.colors && p.colors.length > 0 ? p.colors : ['Única'];
          sizes.forEach(sz => {
            colors.forEach(col => {
              list.push({
                productId: p.id,
                productName: p.name,
                sku: p.sku,
                size: sz,
                color: col,
                stock: qtyNum
              });
            });
          });
        }
      }
    });

    return list;
  }, [products]);

  // Combos State with LocalStorage Persistence
  const [combos, setCombos] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('ap_moda_combos');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'combo-1',
        name: 'Combo Legging Glow + Top Cross',
        price: 199.90,
        items: [
          { name: 'Legging Glow Cós Anatômico', quantity: 1, productId: 'prod-1' },
          { name: 'Top Cross Alta Sustentação', quantity: 1, productId: 'prod-2' }
        ],
        salesCount: 18,
        active: true
      },
      {
        id: 'combo-2',
        name: 'Conjunto Tri-Blend Sem Costura (3 peças)',
        price: 289.90,
        items: [
          { name: 'Shorts Seamless Sculpt', quantity: 1, productId: 'prod-3' },
          { name: 'Top Seamless Confort', quantity: 1, productId: 'prod-4' }
        ],
        salesCount: 12,
        active: true
      }
    ];
  });

  // Sync combos
  React.useEffect(() => {
    localStorage.setItem('ap_moda_combos', JSON.stringify(combos));
  }, [combos]);

  // Form states for creating custom combo
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [comboName, setComboName] = useState('');
  const [comboPrice, setComboPrice] = useState(199.90);
  const [selectedComboProducts, setSelectedComboProducts] = useState<string[]>([]);

  // Form states for Pricing / Markup tool
  const [markupCost, setMarkupCost] = useState<number>(50.00);
  const [markupTax, setMarkupTax] = useState<number>(6.00); // 6% simples nacional
  const [markupCommission, setMarkupCommission] = useState<number>(5.00); // 5% comissão
  const [markupGateway, setMarkupGateway] = useState<number>(3.00); // 3%gateway maquininha
  const [markupDiscount, setMarkupDiscount] = useState<number>(10.00); // 10% desconto programado
  const [markupDesiredProfit, setMarkupDesiredProfit] = useState<number>(30.00); // 30% lucro líquido desejado

  React.useEffect(() => {
    if (activeSubTab === 'cadastro') {
      setIsAddModalOpen(true);
      if (setActiveSubTab) {
        // Reset so it doesn't keep opening on back and forth clicks
        setActiveSubTab('inventario');
      }
    } else if (activeSubTab === 'restoque') {
      // Filter by items that need restock
      setSearchQuery('');
      setSelectedCategory('Todos');
      if (setActiveSubTab) {
        setActiveSubTab('inventario');
      }
    }
  }, [activeSubTab, setActiveSubTab]);

  // Form states for new product
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategory, setNewCategory] = useState('Leggings');
  const [newPrice, setNewPrice] = useState(139.90);
  const [newCompareAtPrice, setNewCompareAtPrice] = useState<number | undefined>(undefined);
  const [newCost, setNewCost] = useState(55.00);
  const [newStock, setNewStock] = useState(15);
  const [newMinStock, setNewMinStock] = useState(5);
  const [newImage, setNewImage] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]);
  const [newDescription, setNewDescription] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newColors, setNewColors] = useState('Preto, Pink Glow, Branco, Azul Celeste');
  const [newSizes, setNewSizes] = useState('P, M, G, GG');

  // Adding customizable / dynamic category entry states
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCustomCategoryInput, setNewCustomCategoryInput] = useState('');

  // Editing product modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isEditingNewCategory, setIsEditingNewCategory] = useState(false);
  const [editCustomCategoryInput, setEditCustomCategoryInput] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editCompareAtPrice, setEditCompareAtPrice] = useState<number | undefined>(undefined);
  const [editCost, setEditCost] = useState(0);
  const [editStock, setEditStock] = useState(0);
  const [editMinStock, setEditMinStock] = useState(0);
  const [editImage, setEditImage] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editDescription, setEditDescription] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editColors, setEditColors] = useState('');
  const [editSizes, setEditSizes] = useState('');

  const [isResolvingNew, setIsResolvingNew] = useState(false);
  const [isResolvingEdit, setIsResolvingEdit] = useState(false);

  const resolveImageAndAdd = async (url: string, type: 'new' | 'edit') => {
    const trimmed = url.trim();
    if (!trimmed) return;

    if (type === 'new') {
      setIsResolvingNew(true);
    } else {
      setIsResolvingEdit(true);
    }

    try {
      const response = await fetch(`/api/proxy/resolve-image-url?url=${encodeURIComponent(trimmed)}`);
      if (response.ok) {
        const result = await response.json();
        if (result && result.resolved) {
          if (type === 'new') {
            setNewImages(prev => {
              if (prev.includes(result.resolved)) return prev;
              return [...prev, result.resolved];
            });
          } else {
            setEditImages(prev => {
              if (prev.includes(result.resolved)) return prev;
              return [...prev, result.resolved];
            });
          }
          return;
        }
      }
      
      // Fallback to original trimmed link if resolution endpoint fails
      if (type === 'new') {
        setNewImages(prev => {
          if (prev.includes(trimmed)) return prev;
          return [...prev, trimmed];
        });
      } else {
        setEditImages(prev => {
          if (prev.includes(trimmed)) return prev;
          return [...prev, trimmed];
        });
      }
    } catch (err) {
      console.error('[Client Resolve Image URL Error]:', err);
      if (type === 'new') {
        setNewImages(prev => {
          if (prev.includes(trimmed)) return prev;
          return [...prev, trimmed];
        });
      } else {
        setEditImages(prev => {
          if (prev.includes(trimmed)) return prev;
          return [...prev, trimmed];
        });
      }
    } finally {
      if (type === 'new') {
        setIsResolvingNew(false);
      } else {
        setIsResolvingEdit(false);
      }
    }
  };

  // Sync total stock based on color-specific stocks and size-color specific stocks
  React.useEffect(() => {
    const sizes = newSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const colors = newColors.split(',').map(c => c.trim()).filter(Boolean);

    if (sizes.length > 0) {
      let total = 0;
      sizes.forEach(sz => {
        const availableCols = newSizeColors[sz]
          ? newSizeColors[sz].split(',').map(c => c.trim()).filter(Boolean)
          : colors;
          
        availableCols.forEach(col => {
          total += (newSizeColorStocks[sz]?.[col] || 0);
        });
      });
      setNewStock(total);
    } else {
      if (colors.length > 0) {
        const total = colors.reduce((sum, color) => sum + (newColorStocks[color] || 0), 0);
        setNewStock(total);
      }
    }
  }, [newColors, newSizes, newSizeColors, newColorStocks, newSizeColorStocks]);

  React.useEffect(() => {
    const sizes = editSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const colors = editColors.split(',').map(c => c.trim()).filter(Boolean);

    if (sizes.length > 0) {
      let total = 0;
      sizes.forEach(sz => {
        const availableCols = editSizeColors[sz]
          ? editSizeColors[sz].split(',').map(c => c.trim()).filter(Boolean)
          : colors;
          
        availableCols.forEach(col => {
          total += (editSizeColorStocks[sz]?.[col] || 0);
        });
      });
      setEditStock(total);
    } else {
      if (colors.length > 0) {
        const total = colors.reduce((sum, color) => sum + (editColorStocks[color] || 0), 0);
        setEditStock(total);
      }
    }
  }, [editColors, editSizes, editSizeColors, editColorStocks, editSizeColorStocks]);

  // Dynamic categories compile
  const productCategoriesOnly = useMemo(() => {
    const list = new Set(products.map(p => p.category).filter(Boolean));
    const defaultCats = ['Leggings', 'Tops', 'Conjuntos', 'Shorts', 'Casacos', 'Macacões', 'Regatas'];
    return Array.from(new Set([...defaultCats, ...Array.from(list)]));
  }, [products]);

  // Filter lists
  const categories = useMemo(() => {
    return ['Todos', ...productCategoriesOnly];
  }, [productCategoriesOnly]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleRestock = (productId: string, quantity: number) => {
    const p = products.find(prod => prod.id === productId);
    if (p) {
      onUpdateProduct({
        ...p,
        stock: Math.max(0, p.stock + quantity)
      });
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSku.trim()) {
      alert('Por favor, preencha o Nome e o SKU do produto.');
      return;
    }

    const categoryToUse = isCreatingNewCategory 
      ? newCustomCategoryInput.trim() 
      : newCategory;

    if (isCreatingNewCategory && !newCustomCategoryInput.trim()) {
      alert('Por favor, informe a nova categoria personalizada.');
      return;
    }

    setIsSaving(true);
    try {
      const generalColors = newColors.split(',').map(s => s.trim()).filter(Boolean);
      const sizesArray = newSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

      // Build sizeColors list and aggregate colors
      const finalSizeColors: Record<string, string[]> = {};
      Object.entries(newSizeColors).forEach(([sz, val]) => {
        if (sizesArray.includes(sz)) {
          const arr = (typeof val === 'string' ? val : '')
            .split(',')
            .map(s => s.trim())
            .filter(c => generalColors.includes(c));
          if (arr.length > 0) {
            finalSizeColors[sz] = arr;
          }
        }
      });

      const colorsArray = generalColors;

      const finalColorStocks: Record<string, number> = {};
      const finalSizeColorStocks: Record<string, Record<string, number>> = {};

      if (sizesArray.length > 0) {
        sizesArray.forEach(sz => {
          finalSizeColorStocks[sz] = {};
          const availableCols = finalSizeColors[sz] || colorsArray;
          availableCols.forEach(col => {
            const qty = newSizeColorStocks[sz]?.[col] || 0;
            finalSizeColorStocks[sz][col] = qty;
            finalColorStocks[col] = (finalColorStocks[col] || 0) + qty;
          });
        });
      } else {
        colorsArray.forEach(color => {
          finalColorStocks[color] = newColorStocks[color] !== undefined ? newColorStocks[color] : 0;
        });
      }

      const finalMeasurementSpecs: Record<string, { bustoMin: number; bustoMax: number; cinturaMin: number; cinturaMax: number; quadrilMin: number; quadrilMax: number }> = {};
      sizesArray.forEach(sz => {
        const normSz = sz.toUpperCase().trim();
        finalMeasurementSpecs[sz] = newMeasurementSpecs[normSz] || newMeasurementSpecs[sz] || getFallbackSpecsForSize(sz);
      });

      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: newName.trim(),
        sku: newSku.trim().toUpperCase(),
        category: categoryToUse,
        price: newPrice,
        compare_at_price: newCompareAtPrice,
        cost: newCost,
        stock: newStock,
        minStock: newMinStock,
        image: newImages[0] || newImage,
        images: newImages.length > 0 ? newImages : [newImage],
        salesCount: 0,
        description: newDescription.trim(),
        videoUrl: newVideoUrl.trim(),
        colors: colorsArray,
        sizes: sizesArray,
        sizeColors: finalSizeColors,
        colorStocks: finalColorStocks,
        sizeColorStocks: finalSizeColorStocks,
        measurementSpecs: finalMeasurementSpecs
      };

      await onAddProduct(newProd);
      setIsAddModalOpen(false);

      // Reset forms
      setNewName('');
      setNewSku('');
      setNewCategory('Leggings');
      setNewCustomCategoryInput('');
      setIsCreatingNewCategory(false);
      setNewPrice(139.90);
      setNewCompareAtPrice(undefined);
      setNewCost(55.00);
      setNewStock(15);
      setNewMinStock(5);
      setNewImage('');
      setNewImages([]);
      setNewDescription('');
      setNewVideoUrl('');
      setNewColors('Preto, Pink Glow, Branco, Azul Celeste');
      setNewSizes('P, M, G, GG');
      setNewSizeColors({});
      setNewColorStocks({});
      setNewSizeColorStocks({});
      setNewMeasurementSpecs({});
    } catch (error: any) {
      console.error('Erro ao cadastrar produto:', error);
      alert('Erro ao cadastrar produto: ' + (error.message || error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditSku(p.sku);
    setEditCategory(p.category);
    setIsEditingNewCategory(false);
    setEditCustomCategoryInput('');
    setEditPrice(p.price);
    setEditCompareAtPrice(p.compare_at_price);
    setEditCost(p.cost);
    setEditStock(p.stock);
    setEditMinStock(p.minStock);
    setEditImage(p.image);
    setEditImages(p.images || [p.image]);
    setEditDescription(p.description || '');
    setEditVideoUrl(p.videoUrl || '');
    setEditColors(p.colors ? p.colors.join(', ') : 'Preto');
    setEditSizes(p.sizes ? p.sizes.join(', ') : 'P, M, G');
    
    // Map record string[] to record string for local input editing
    const scObj: Record<string, string> = {};
    if (p.sizeColors) {
      Object.entries(p.sizeColors).forEach(([sz, arr]) => {
        if (Array.isArray(arr)) {
          scObj[sz] = arr.join(', ');
        }
      });
    }
    setEditSizeColors(scObj);
    setEditColorStocks(p.colorStocks || {});
    setEditSizeColorStocks(p.sizeColorStocks || {});
    setEditMeasurementSpecs(p.measurementSpecs || {});
    setIsEditModalOpen(true);
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editName.trim() || !editSku.trim()) {
      alert('Por favor, preencha o Nome e o SKU do produto.');
      return;
    }

    const categoryToUse = isEditingNewCategory 
      ? editCustomCategoryInput.trim() 
      : editCategory;

    if (isEditingNewCategory && !editCustomCategoryInput.trim()) {
      alert('Por favor, informe a nova categoria personalizada.');
      return;
    }

    setIsSaving(true);
    try {
      const generalColors = editColors.split(',').map(s => s.trim()).filter(Boolean);
      const sizesArray = editSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

      // Build sizeColors list and aggregate colors
      const finalSizeColors: Record<string, string[]> = {};
      Object.entries(editSizeColors).forEach(([sz, val]) => {
        if (sizesArray.includes(sz)) {
          const arr = (typeof val === 'string' ? val : '')
            .split(',')
            .map(s => s.trim())
            .filter(c => generalColors.includes(c));
          if (arr.length > 0) {
            finalSizeColors[sz] = arr;
          }
        }
      });

      const colorsArray = generalColors;

      const finalColorStocks: Record<string, number> = {};
      const finalSizeColorStocks: Record<string, Record<string, number>> = {};

      if (sizesArray.length > 0) {
        sizesArray.forEach(sz => {
          finalSizeColorStocks[sz] = {};
          const availableCols = finalSizeColors[sz] || colorsArray;
          availableCols.forEach(col => {
            const qty = editSizeColorStocks[sz]?.[col] || 0;
            finalSizeColorStocks[sz][col] = qty;
            finalColorStocks[col] = (finalColorStocks[col] || 0) + qty;
          });
        });
      } else {
        colorsArray.forEach(color => {
          finalColorStocks[color] = editColorStocks[color] !== undefined ? editColorStocks[color] : 0;
        });
      }

      const finalMeasurementSpecs: Record<string, { bustoMin: number; bustoMax: number; cinturaMin: number; cinturaMax: number; quadrilMin: number; quadrilMax: number }> = {};
      sizesArray.forEach(sz => {
        const normSz = sz.toUpperCase().trim();
        finalMeasurementSpecs[sz] = editMeasurementSpecs[normSz] || editMeasurementSpecs[sz] || getFallbackSpecsForSize(sz);
      });

      await onUpdateProduct({
        ...editingProduct,
        name: editName.trim(),
        sku: editSku.trim().toUpperCase(),
        category: categoryToUse,
        price: editPrice,
        compare_at_price: editCompareAtPrice,
        cost: editCost,
        stock: editStock,
        minStock: editMinStock,
        image: editImages[0] || editImage,
        images: editImages.length > 0 ? editImages : [editImage],
        description: editDescription.trim(),
        videoUrl: editVideoUrl.trim(),
        colors: colorsArray,
        sizes: sizesArray,
        sizeColors: finalSizeColors,
        colorStocks: finalColorStocks,
        sizeColorStocks: finalSizeColorStocks,
        measurementSpecs: finalMeasurementSpecs
      });

      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto: ' + (error.message || error));
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight">Produtos e Estoque</h2>
          <p className="text-slate-400 text-sm font-sans">Cadastre peças de moda fitness, monitore níveis críticos e reabasteça o estoque</p>
        </div>
        <button 
          id="add-product-modal-btn"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 font-sans font-medium text-white px-4 py-2 rounded-xl text-xs shadow-md shadow-pink-500/10 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* Alertas de Reposição Crítica */}
      {criticalVariations.length > 0 && (
        <div className="bg-red-50/60 border border-red-100 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-350">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-red-900 font-sans tracking-tight flex items-center gap-2">
                Aviso de Estoque Crítico
                <span className="inline-flex items-center bg-red-600 text-white font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {criticalVariations.length}
                </span>
              </h4>
              <p className="text-xs text-red-700 leading-relaxed font-medium">
                Atenção: {criticalVariations[0].productName} <span className="bg-red-100/80 border border-red-200/50 px-1 py-0.2 rounded font-semibold text-red-800">[{criticalVariations[0].color} - {criticalVariations[0].size}]</span> está com apenas <span className="font-extrabold font-mono text-red-900 bg-red-100 px-1 py-0.2 rounded">{criticalVariations[0].stock}</span> {criticalVariations[0].stock === 1 ? 'unidade restante' : 'unidades restantes'}!
                {criticalVariations.length > 1 && (
                  <span className="ml-1 text-red-600 font-normal">
                    e outras {criticalVariations.length - 1} variações estão abaixo do limite crítico (≤ 3 un).
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="generate-replenishment-list-btn"
            onClick={() => setIsReplenishmentModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 font-sans font-bold text-white px-4 py-2.5 rounded-xl text-xs shadow-md shadow-red-500/10 transition-all cursor-pointer whitespace-nowrap md:self-center"
          >
            📋 Gerar Lista de Reposição
          </button>
        </div>
      )}

      {/* Product sub-tabs */}
      <div className="flex border-b border-slate-100 pb-px gap-6 overflow-x-auto text-xs font-sans">
        <button
          onClick={() => setInternalSubTab('inventario')}
          className={`pb-2.5 font-bold tracking-wide transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            internalSubTab === 'inventario'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📦 Inventário Geral
        </button>
        <button
          onClick={() => setInternalSubTab('grade')}
          className={`pb-2.5 font-bold tracking-wide transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            internalSubTab === 'grade'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🎯 Estoque por Grade
        </button>
        <button
          onClick={() => setInternalSubTab('combos')}
          className={`pb-2.5 font-bold tracking-wide transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            internalSubTab === 'combos'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🏷️ Combos & Looks
        </button>
        <button
          onClick={() => setInternalSubTab('markup')}
          className={`pb-2.5 font-bold tracking-wide transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            internalSubTab === 'markup'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🧮 Simulador de Markup
        </button>
        <button
          onClick={() => setInternalSubTab('abc')}
          className={`pb-2.5 font-bold tracking-wide transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            internalSubTab === 'abc'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📊 Giro & Curva ABC
        </button>
      </div>

      {internalSubTab === 'inventario' && (
        <>
          {/* Filter and Category Pills */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input 
            id="catalog-search-input"
            type="text"
            placeholder="Procurar peça ou modelo pelo nome ou SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-sans text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-pink-500 transitions-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              id={`pill-cat-${cat}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer
                ${selectedCategory === cat 
                  ? 'bg-pink-600 text-white shadow-xs shadow-pink-500/10' 
                  : 'bg-slate-50 text-slate-550 hover:bg-slate-100 border border-slate-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Stock Table / Grid */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Catálogo de Roupas ({filteredProducts.length})</h3>
          <span className="text-[10px] text-slate-400 font-medium font-sans">Dica: clique em (+10) ou (-1) para ajustar estoques</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-4">Item</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Categoria</th>
                <th className="p-4 text-right">Custo</th>
                <th className="p-4 text-right">Preço Venda</th>
                <th className="p-4 text-center">Nível de Estoque</th>
                <th className="p-4 text-center">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
              {filteredProducts.map((p) => {
                const isLowStock = p.stock < p.minStock;
                const isOutOfStock = p.stock === 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Item Image and Name */}
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 text-xs block leading-tight">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal mt-1 block">Vendidos: {p.salesCount} un</span>
                        
                        {/* Alertas de Variações Críticas */}
                        {criticalVariations.filter(v => v.productId === p.id).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5 max-w-[280px]">
                            {criticalVariations.filter(v => v.productId === p.id).map((cv, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-100 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide select-none">
                                ⚠️ {cv.color} - {cv.size}: {cv.stock} un
                              </span>
                            ))}
                          </div>
                        )}

                        {p.colorStocks && Object.keys(p.colorStocks).length > 0 && (!criticalVariations.some(v => v.productId === p.id)) && (
                          <div className="flex flex-wrap gap-1 mt-1.5 max-w-[260px]">
                            {Object.entries(p.colorStocks).map(([color, qty]) => (
                              <span key={color} className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-md px-1.5 py-0.5 text-[9px] font-medium font-mono leading-none">
                                <span className="w-1.5 h-1.5 rounded-full border border-slate-200" style={{ backgroundColor: colorToHex(color) }} />
                                {color}: <strong className="text-slate-700 font-bold">{qty}</strong>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Sku */}
                    <td className="p-4 font-mono text-[10px] font-bold text-slate-500">{p.sku}</td>

                    {/* Category Label */}
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 font-semibold px-2 py-0.5 rounded text-[10px]">
                        {p.category}
                      </span>
                    </td>

                    {/* Price & Cost */}
                    <td className="p-4 text-right font-mono text-slate-500">{formatCurrency(p.cost)}</td>
                    <td className="p-4 text-right font-mono font-bold text-slate-850">{formatCurrency(p.price)}</td>

                    {/* Stock level bar */}
                    <td className="p-4 text-center min-w-[140px]">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-xs ${isOutOfStock ? 'text-rose-500 animate-pulse' : isLowStock ? 'text-amber-500' : 'text-slate-700'}`}>
                            {p.stock} peças
                          </span>
                          {isLowStock && (
                            <AlertTriangle size={12} className="text-amber-500 animate-bounce" />
                          )}
                        </div>
                        <div className="w-24 bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isOutOfStock ? 'w-0' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, (p.stock / (p.minStock * 4)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Restock action elements */}
                    <td className="p-4 text-center">
                      <div className="inline-flex gap-1 bg-slate-50 p-1 border border-slate-150 rounded-lg">
                        <button 
                          onClick={() => handleOpenEditModal(p)}
                          title="Editar peça"
                          className="px-2 py-1 text-[10px] font-bold font-sans text-slate-500 hover:text-pink-600 hover:bg-white rounded transition-all cursor-pointer"
                        >
                          Editar
                        </button>
                        <span className="w-px bg-slate-150 self-stretch my-1" />
                        <button 
                          onClick={() => handleRestock(p.id, -1)}
                          title="Remover 1 unidade"
                          className="px-2 py-1 text-[10px] font-bold font-sans text-slate-500 hover:text-rose-600 hover:bg-white rounded transition-all cursor-pointer"
                        >
                          -1
                        </button>
                        <span className="w-px bg-slate-150 self-stretch my-1" />
                        <button 
                          onClick={() => handleRestock(p.id, 10)}
                          title="Restock de 10 unidades"
                          className="px-2 py-1 text-[10px] font-bold font-sans text-slate-500 hover:text-emerald-600 hover:bg-white rounded transition-all cursor-pointer"
                        >
                          +10
                        </button>
                        <span className="w-px bg-slate-150 self-stretch my-1" />
                        <button 
                          onClick={() => {
                            if (confirm(`Deseja mesmo arquivar a peça "${p.name}"?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="px-2 py-1 text-[10px] font-bold font-sans text-slate-400 hover:text-rose-500 hover:bg-white rounded transition-all cursor-pointer"
                        >
                          Deletar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* VIEW 2: Combos & Looks */}
      {internalSubTab === 'combos' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Looks & Kits Promocionais Ativos</h3>
                <p className="text-slate-400 text-xs mt-0.5">Monte conjuntos combinando em uma única oferta para alavancar o ticket médio</p>
              </div>
              <button
                onClick={() => {
                  setComboName('');
                  setComboPrice(199.90);
                  setSelectedComboProducts([]);
                  setIsComboModalOpen(true);
                }}
                className="bg-pink-600 hover:bg-pink-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Criar Combo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {combos.map((combo) => {
                const areProductsAvailable = combo.items.every((item: any) => {
                  const p = products.find(prod => prod.id === item.productId || prod.name === item.name);
                  return p ? p.stock >= item.quantity : true;
                });

                return (
                  <div key={combo.id} className="border border-slate-150 bg-slate-50/40 rounded-xl p-4 flex flex-col justify-between hover:border-pink-200 hover:shadow-md hover:shadow-pink-500/5 transition-all">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800 text-xs font-sans block">{combo.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${areProductsAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                          {areProductsAvailable ? 'Pronto para Entrega' : 'Estoque Parcial'}
                        </span>
                      </div>
                      
                      <div className="mt-3 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">Itens do Combo</span>
                        <div className="space-y-1">
                          {combo.items.map((it: any, i: number) => {
                            const linkedProd = products.find(p => p.id === it.productId || p.name === it.name);
                            return (
                              <div key={i} className="flex justify-between items-center text-[11px] bg-white p-1.5 px-2.5 rounded-lg border border-slate-100">
                                <span className="text-slate-650 font-medium font-sans">{it.quantity}x {it.name}</span>
                                <span className="font-mono text-[10px] text-slate-455">
                                  Estoque: {linkedProd ? `${linkedProd.stock} uni` : 'Não vinculado'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider font-mono font-sans">Preço Combo</span>
                        <span className="font-mono font-bold text-sm text-pink-600">{formatCurrency(combo.price)}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            let stockMissing = false;
                            combo.items.forEach((item: any) => {
                              const p = products.find(prod => prod.id === item.productId || prod.name === item.name);
                              if (!p || p.stock < item.quantity) {
                                stockMissing = true;
                              }
                            });

                            if (stockMissing) {
                              const confirmSell = window.confirm('Algumas peças deste combo estão esgotadas ou abaixo do estoque necessário. Deseja efetuar a venda assim mesmo?');
                              if (!confirmSell) return;
                            }

                            combo.items.forEach((item: any) => {
                              const p = products.find(prod => prod.id === item.productId || prod.name === item.name);
                              if (p) {
                                onUpdateProduct({
                                  ...p,
                                  stock: Math.max(0, p.stock - item.quantity),
                                  salesCount: p.salesCount + item.quantity
                                });
                              }
                            });

                            setCombos(prev => prev.map(c => c.id === combo.id ? { ...c, salesCount: c.salesCount + 1 } : c));
                            alert(`Venda registrada! Os estoques das peças individuais do "${combo.name}" foram atualizados com sucesso.`);
                          }}
                          className="bg-slate-900 border border-slate-800 hover:bg-slate-950 text-white font-sans font-semibold px-2.5 py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer"
                        >
                          Vender Combo
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Tem certeza que deseja remover este combo?')) {
                              setCombos(prev => prev.filter(c => c.id !== combo.id));
                            }
                          }}
                          className="p-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-lg text-rose-600 transition-all cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dashboard de Desempenho "Mix & Match" */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6 mt-6 font-sans">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-pink-500/20 text-pink-400 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md">Desempenho</span>
                    <h3 className="text-sm font-bold text-white">Dashboard "Mix & Match" e Provadores Virtuais</h3>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">Métricas de cliques, engajamento e conversão de looks gerados de forma avulsa por clientes</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Período de Análise</span>
                  <span className="text-xs font-semibold text-pink-400 font-mono">Últimos 30 dias (Tempo Real)</span>
                </div>
              </div>

              {/* Metrics cards row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block font-sans">Total de Cliques nos Looks</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black font-mono text-white">1.842</span>
                    <span className="text-emerald-400 text-[11px] font-bold font-mono">↑ 18.4%</span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">Visualizações de combinações na vitrine</span>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block font-sans">Looks Adicionados ao Carrinho</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black font-mono text-white">412</span>
                    <span className="text-pink-400 text-[11px] font-bold font-mono">↓ 3.1%</span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">Adições via botão "Adicionar Look Completo"</span>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block font-sans">Conversão Final e Vendas</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black font-mono text-white">128 <span className="text-xs text-slate-400 font-normal">vendas</span></span>
                    <span className="text-emerald-400 text-[11px] font-bold font-mono font-sans">↑ 12.5%</span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">Pedidos concluídos com looks integrados</span>
                </div>
              </div>

              {/* Top performing combinations list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">🔥 Combinações de Looks Líderes de Vendas</h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-12 bg-slate-950/80 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider p-3">
                    <div className="col-span-5">Combinação Customizada (Top + Bottom)</div>
                    <div className="col-span-2 text-center">Cliques</div>
                    <div className="col-span-2 text-center">Vendas</div>
                    <div className="col-span-2 text-center">Conversão</div>
                    <div className="col-span-1 text-right">Receita</div>
                  </div>
                  <div className="divide-y divide-slate-800 bg-slate-900/50">
                    <div className="grid grid-cols-12 p-3 items-center font-medium hover:bg-slate-800/40">
                      <div className="col-span-5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                        <span className="text-slate-205 truncate font-sans">Cropped Dry-Fit + Calça Legging</span>
                      </div>
                      <div className="col-span-2 text-center font-mono font-bold text-slate-400">842</div>
                      <div className="col-span-2 text-center font-mono font-bold text-emerald-400">58 un</div>
                      <div className="col-span-2 text-center font-mono text-slate-350">6.9%</div>
                      <div className="col-span-1 text-right font-mono text-slate-205 font-bold">R$ 11.230</div>
                    </div>

                    <div className="grid grid-cols-12 p-3 items-center font-medium hover:bg-slate-800/40">
                      <div className="col-span-5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                        <span className="text-slate-205 truncate font-sans">Regata Light + Shorts Ativo</span>
                      </div>
                      <div className="col-span-2 text-center font-mono font-bold text-slate-400">620</div>
                      <div className="col-span-2 text-center font-mono font-bold text-emerald-400">42 un</div>
                      <div className="col-span-2 text-center font-mono text-slate-350">6.7%</div>
                      <div className="col-span-1 text-right font-mono text-slate-205 font-bold">R$ 7.980</div>
                    </div>

                    <div className="grid grid-cols-12 p-3 items-center font-medium hover:bg-slate-800/40">
                      <div className="col-span-5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                        <span className="text-slate-205 truncate font-sans">Top Ativo + Bermuda Compressão</span>
                      </div>
                      <div className="col-span-2 text-center font-mono font-bold text-slate-400">380</div>
                      <div className="col-span-2 text-center font-mono font-bold text-emerald-400">28 un</div>
                      <div className="col-span-2 text-center font-mono text-slate-350">7.3%</div>
                      <div className="col-span-1 text-right font-mono text-slate-205 font-bold">R$ 5.430</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights banner */}
              <div className="p-4.5 bg-slate-950/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-sans">
                💡 <strong>Análise Inteligente AP Moda Fitness:</strong> A combinação <strong>Cropped Dry-Fit + Calça Legging</strong> possui o maior volume de vendas e cliques. Recomendamos manter banners dessa combinação na página inicial e destacar o desconto exclusivo de 5% para alavancar ainda mais a conversão destas peças avulsas.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Pricing Simulator / Markup */}
      {internalSubTab === 'markup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
          {/* Calculator controls */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Formação de Preço de Venda</h3>
            <p className="text-slate-400 text-xs">Planeje as despesas e taxas para descobrir o preço ideal e fator Markup</p>
            
            <div className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-slate-500 font-bold block uppercase text-[9px] tracking-wide">Custo Unitário da Fábrica (R$)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    value={markupCost}
                    onChange={(e) => setMarkupCost(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-705 font-mono font-bold focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold block uppercase text-[9px] tracking-wide font-sans">Impostos s/ Venda (%)</label>
                <input
                  type="number"
                  value={markupTax}
                  onChange={(e) => setMarkupTax(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-705 font-mono font-medium focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold block uppercase text-[9px] tracking-wide font-sans">Comissão de Venda (%)</label>
                <input
                  type="number"
                  value={markupCommission}
                  onChange={(e) => setMarkupCommission(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-705 font-mono font-medium focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold block uppercase text-[9px] tracking-wide font-sans">Taxa Maquininha / Meio (%)</label>
                <input
                  type="number"
                  value={markupGateway}
                  onChange={(e) => setMarkupGateway(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-705 font-mono font-medium focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold block uppercase text-[9px] tracking-wide font-sans">Provisão Desconto Máximo (%)</label>
                <input
                  type="number"
                  value={markupDiscount}
                  onChange={(e) => setMarkupDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-705 font-mono font-medium focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-1 text-pink-650 font-bold bg-pink-50/15 p-3 rounded-xl border border-pink-100/50">
                <label className="text-pink-650 font-bold block uppercase text-[9px] tracking-wide font-sans">Lucro Líquido Desejado (%)</label>
                <input
                  type="number"
                  value={markupDesiredProfit}
                  onChange={(e) => setMarkupDesiredProfit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-pink-250 rounded-xl text-pink-700 font-mono font-bold focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Calculator results */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col justify-between">
            <div className="space-y-5">
              <span className="font-bold text-[10px] tracking-wider uppercase font-mono text-slate-400 block border-b border-slate-800 pb-2">Resultado da Formação</span>

              {(() => {
                const totalDeductions = markupTax + markupCommission + markupGateway + markupDiscount + markupDesiredProfit;
                const markupFactor = totalDeductions < 100 ? (100 / (100 - totalDeductions)) : 0;
                const sellingPrice = markupCost * (markupFactor || 1);
                
                const taxValue = sellingPrice * (markupTax / 100);
                const commissionValue = sellingPrice * (markupCommission / 100);
                const gatewayValue = sellingPrice * (markupGateway / 100);
                const discountValue = sellingPrice * (markupDiscount / 100);
                const rawProfitValue = sellingPrice * (markupDesiredProfit / 100);
                const breakevenPrice = markupCost + taxValue + commissionValue + gatewayValue + discountValue;

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-950 text-center rounded-xl border border-slate-850">
                        <span className="block text-[8px] text-slate-455 uppercase font-mono font-bold tracking-wider mb-1">Fator de Markup</span>
                        <span className="text-xl font-mono font-semibold font-bold text-amber-500">{markupFactor ? `${markupFactor.toFixed(2)}x` : 'N/A'}</span>
                      </div>
                      <div className="p-4 bg-slate-950 text-center rounded-xl border border-slate-855">
                        <span className="block text-[8px] text-slate-455 uppercase font-mono font-bold tracking-wider mb-1">Preço de Custo Total</span>
                        <span className="text-xl font-mono font-semibold font-bold text-slate-300">{formatCurrency(breakevenPrice)}</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-1">
                      <span className="block text-[10px] text-pink-400 uppercase font-bold tracking-widest font-mono">Preço Venda Sugerido</span>
                      <span className="text-3xl font-mono font-extrabold text-white block">{formatCurrency(sellingPrice)}</span>
                      <span className="text-[10px] text-slate-450 italic font-sans block mt-1">Multiplicador do Custo de Aquisição</span>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-[9px] text-slate-455 uppercase font-mono font-bold tracking-wider">Abertura do Valor de Venda</span>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-805">
                          <span className="block text-[8px] text-slate-500 font-bold uppercase font-sans">Custo Fábrica</span>
                          <span className="font-mono text-slate-300 font-semibold">{formatCurrency(markupCost)}</span>
                        </div>
                        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-805">
                          <span className="block text-[8px] text-slate-500 font-bold uppercase font-sans">Impostos</span>
                          <span className="font-mono text-rose-400 font-semibold">{formatCurrency(taxValue)}</span>
                        </div>
                        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-805">
                          <span className="block text-[8px] text-slate-500 font-bold uppercase font-sans">Comissões</span>
                          <span className="font-mono text-rose-400 font-semibold">{formatCurrency(commissionValue)}</span>
                        </div>
                        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-805">
                          <span className="block text-[8px] text-slate-500 font-bold uppercase font-sans">Maquininha</span>
                          <span className="font-mono text-rose-400 font-semibold">{formatCurrency(gatewayValue)}</span>
                        </div>
                        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-805">
                          <span className="block text-[8px] text-slate-500 font-bold uppercase font-sans">Fração Desc.</span>
                          <span className="font-mono text-rose-400 font-semibold">{formatCurrency(discountValue)}</span>
                        </div>
                        <div className="bg-pink-955/20 p-2.5 rounded-lg border border-pink-900/40 bg-pink-950/30">
                          <span className="block text-[8px] text-pink-400 font-bold uppercase font-sans">Lucro Líquido</span>
                          <span className="font-mono text-emerald-400 font-bold">{formatCurrency(rawProfitValue)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="mt-6 p-4 bg-slate-950 rounded-xl border border-slate-805 text-[10px] text-slate-400 font-sans leading-relaxed">
              💡 <strong>Dica AP Moda Fitness:</strong> Em produtos de fabricação própria ou importação de alta tecnologia (ex: costura inteligente, tecidos Seamless), margens saudáveis permitem markups acima de <strong className="text-white">2.2x</strong>.
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: Curva ABC */}
      {internalSubTab === 'abc' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5 flex flex-col font-sans">
            <div>
              <h3 className="text-sm font-bold text-slate-800">📊 Giro de Estoque - Relatório Curva ABC</h3>
              <p className="text-slate-400 text-xs mt-0.5">Visão analítica de giro das peças trazendo inteligência para reposições rápidas de estoque</p>
            </div>

            {(() => {
              const sortedProducts = [...products].sort((a, b) => b.salesCount - a.salesCount);
              const totalUnitsSold = sortedProducts.reduce((sum, p) => sum + p.salesCount, 0);

              let cumulativeCount = 0;
              const annotated = sortedProducts.map((p) => {
                cumulativeCount += p.salesCount;
                const cumulativePercentage = totalUnitsSold > 0 ? (cumulativeCount / totalUnitsSold) * 100 : 0;
                
                let classification: 'A' | 'B' | 'C' = 'C';
                if (cumulativePercentage <= 70) {
                  classification = 'A';
                } else if (cumulativePercentage <= 90) {
                  classification = 'B';
                } else {
                  classification = 'C';
                }

                if (totalUnitsSold === 0) classification = 'C';

                return {
                  ...p,
                  classification,
                  cumulativePercentage
                };
              });

              // Break down stats
              const aCount = annotated.filter(p => p.classification === 'A').length;
              const bCount = annotated.filter(p => p.classification === 'B').length;
              const cCount = annotated.filter(p => p.classification === 'C').length;

              const aSales = annotated.filter(p => p.classification === 'A').reduce((s, p) => s + p.salesCount, 0);
              const bSales = annotated.filter(p => p.classification === 'B').reduce((s, p) => s + p.salesCount, 0);
              const cSales = annotated.filter(p => p.classification === 'C').reduce((s, p) => s + p.salesCount, 0);

              return (
                <div className="space-y-6">
                  {/* Cards boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                    <div className="bg-pink-50/40 border border-pink-100 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">Classe A (Líquido Total)</span>
                        <span className="bg-pink-600 text-white font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono">Top Giro</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Produtos de rápido escoamento. Representam cerca de 70% das peças consumidas.</p>
                      <div className="pt-2 border-t border-pink-100/60 flex justify-between font-mono font-bold text-slate-705">
                        <span>{aCount} Modelos</span>
                        <span className="text-pink-650">{aSales} vendas</span>
                      </div>
                    </div>

                    <div className="bg-amber-50/20 border border-amber-100 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">Classe B (Frequente)</span>
                        <span className="bg-amber-500 text-white font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono">Médio</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Artigos de consumo intermediário. Garantem liquidez constante na vitrine física/online.</p>
                      <div className="pt-2 border-t border-amber-100/60 flex justify-between font-mono font-bold text-slate-705">
                        <span>{bCount} Modelos</span>
                        <span className="text-amber-600">{bSales} vendas</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">Classe C (Estoque Parado)</span>
                        <span className="bg-slate-550 text-white font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono">Frio</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Baixo giro. Ideais para cupons de desconto, liquidações ou combos promocionais.</p>
                      <div className="pt-2 border-t border-slate-150 flex justify-between font-mono font-bold text-slate-705">
                        <span>{cCount} Modelos</span>
                        <span className="text-slate-505">{cSales} vendas</span>
                      </div>
                    </div>
                  </div>

                  {/* Table mapping */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                    <div className="bg-slate-50 p-3 font-semibold text-slate-650 border-b border-slate-100 font-sans">Análise Individual por Peça</div>
                    
                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                      {annotated.map((p, idx) => (
                        <div key={p.id} className="p-3 bg-white flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-350 font-bold">#{idx + 1}</span>
                            <div className="w-8 h-8 rounded bg-slate-50 overflow-hidden flex-shrink-0">
                              {p.image ? (
                                <img src={p.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">🧥</div>
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 text-[11px] block">{p.name}</span>
                              <span className="font-mono text-[9px] text-slate-400 block mt-0.5">SKU: {p.sku} | Estoque: {p.stock} uni</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-right">
                            <div className="font-mono">
                              <span className="font-bold text-slate-700 block text-[11px]">{p.salesCount} vendas</span>
                              {totalUnitsSold > 0 && (
                                <span className="text-[9px] text-slate-400 block mt-0.5">Acumulado {p.cumulativePercentage.toFixed(0)}%</span>
                              )}
                            </div>

                            <span className={`flex items-center justify-center font-bold text-[10px] font-mono rounded-full w-6 h-6 ${
                              p.classification === 'A' 
                                ? 'bg-pink-100 text-pink-700' 
                                : p.classification === 'B' 
                                  ? 'bg-amber-100 text-amber-700' 
                                  : 'bg-slate-100 text-slate-550'
                            }`}>
                              {p.classification}
                            </span>
                          </div>
                        </div>
                      ))}

                      {annotated.length === 0 && (
                        <div className="py-8 text-center text-slate-400 italic">Nenhum produto cadastrado para análise.</div>
                      )}
                    </div>
                  </div>

                  {/* Recommendations panel */}
                  <div className="bg-slate-900 text-slate-105 rounded-2xl p-4.5 space-y-2 text-xs border border-slate-800">
                    <span className="font-bold font-mono text-[10px] uppercase text-amber-500 block">💡 Diretrizes Estratégicas de Estoque AP Moda Fitness</span>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-350 leading-relaxed text-[11px]">
                      <li>Utilize os itens <strong className="text-white">Classe C</strong> como brinde ou desconto na compra de combos inteiros de <strong className="text-white">Classe A</strong>.</li>
                      <li>Projete o estoque de segurança sempre multiplicando por 1.5 a média de vendas mensal das peças de <strong className="text-pink-400">Classe A</strong>.</li>
                      <li>Para os produtos <strong className="text-amber-500">Classe B</strong>, planeje ações de impulsionamento e marketing para transformá-los em Classe A.</li>
                    </ul>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {internalSubTab === 'grade' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filters for Grade Subtab */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs space-y-4 font-sans">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={16} />
              </span>
              <input 
                id="grade-search-input"
                type="text"
                placeholder="Filtrar produtos por nome ou SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-sans text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-pink-500 transition-all"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer
                    ${selectedCategory === cat 
                      ? 'bg-pink-600 text-white shadow-xs shadow-pink-500/10' 
                      : 'bg-slate-50 text-slate-550 hover:bg-slate-100 border border-slate-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Product Variation Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProducts.map((p) => (
              <ProductGradeCard 
                key={p.id} 
                product={p} 
                onUpdateProduct={onUpdateProduct} 
              />
            ))}
            {filteredProducts.length === 0 && (
              <div className="lg:col-span-2 py-12 text-center text-slate-400 italic font-sans">
                Nenhum produto encontrado com os filtros selecionados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Critical Replenishment Report Modal */}
      {isReplenishmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-250" id="replenishment-report-modal">
            <style>{`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 15mm 10mm 15mm 10mm;
                }
                html, body, #root, #main-app-container {
                  visibility: visible !important;
                  height: auto !important;
                  min-height: 100% !important;
                  overflow: visible !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                }
                body * {
                  visibility: hidden !important;
                }
                .no-print, .print-hidden, header, aside, nav, footer, button {
                  display: none !important;
                  visibility: hidden !important;
                }
                #replenishment-report-modal, #replenishment-report-modal * {
                  visibility: visible !important;
                }
                #replenishment-report-modal {
                  display: block !important;
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-height: none !important;
                  overflow: visible !important;
                  border: none !important;
                  box-shadow: none !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  z-index: 99999999 !important;
                }
                #replenishment-report-modal * {
                  color: #000000 !important;
                  background: transparent !important;
                }
                #replenishment-report-modal button,
                #replenishment-report-modal .p-4.bg-slate-50 {
                  display: none !important;
                }
              }
            `}</style>
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="bg-red-500 text-white p-1 rounded">
                  <AlertTriangle size={16} />
                </span>
                <span className="font-bold text-sm tracking-wide font-sans">Lista de Reposição de Estoque Crítico</span>
              </div>
              <button 
                onClick={() => setIsReplenishmentModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-sm font-bold bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-800">Peças para Compra / Fabricação</h3>
                <p className="text-slate-500 text-xs">
                  Abaixo estão consolidadas todas as variações de roupas fitness que possuem atualmente <strong>3 ou menos unidades</strong> em estoque.
                </p>
              </div>

              <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50/50">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-wider select-none">
                      <th className="p-3">Produto</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3 text-center">Tamanho</th>
                      <th className="p-3 text-center">Cor</th>
                      <th className="p-3 text-center">Estoque Atual</th>
                      <th className="p-3 text-center">Sugestão Compra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 bg-white font-medium text-slate-650">
                    {criticalVariations.map((cv, index) => {
                      const suggestQty = Math.max(10 - cv.stock, 7);
                      return (
                        <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 font-semibold text-slate-800">{cv.productName}</td>
                          <td className="p-3 font-mono text-[10px] text-slate-500">{cv.sku}</td>
                          <td className="p-3 text-center">
                            <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                              {cv.size}
                            </span>
                          </td>
                          <td className="p-3 text-center flex items-center justify-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full border border-slate-200 block" style={{ backgroundColor: colorToHex(cv.color) }} />
                            <span>{cv.color}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-red-600 font-extrabold font-mono bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">
                              {cv.stock} un
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-emerald-650 font-mono">
                            +{suggestQty} un
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action shortcuts */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 block">Dica para Fornecedores:</span>
                  <span className="text-[10.5px] text-slate-400">Copie o resumo em formato de texto limpo para enviar no WhatsApp ou gerar orçamentos rápidos.</span>
                </div>
                <button
                  onClick={() => {
                    const text = criticalVariations.map(cv => {
                      const suggestQty = Math.max(10 - cv.stock, 7);
                      return `- ${cv.productName} (SKU: ${cv.sku}) | Cor: ${cv.color} | Tam: ${cv.size} | Estoque Atual: ${cv.stock} un | Sugestão de Compra: +${suggestQty} un`;
                    }).join('\n');
                    navigator.clipboard.writeText(`LISTA DE REPOSIÇÃO - AP MODA FITNESS\nData: ${new Date().toLocaleDateString('pt-BR')}\n\n${text}`);
                    alert('Lista de reposição copiada para a área de transferência! 📋✨');
                  }}
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer transition-all shrink-0 self-start md:self-center shadow-xs border-none"
                >
                  📋 Copiar Resumo de Texto
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsReplenishmentModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
              >
                Fechar Relatório
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-700 transition-all cursor-pointer flex items-center gap-1.5 border-none"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal Sheet */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-50 overflow-hidden" id="add-product-modal">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs tracking-wider uppercase font-sans">Cadastrar Nova Peça Fitness</span>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            {/* Form list fields */}
            <form onSubmit={handleAddProductSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1 text-xs">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Nome Completo do Produto</label>
                <input 
                  id="new-product-name"
                  type="text"
                  required
                  placeholder="Ex: Legging Sculpt Seamless Pink Glow"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-450 focus:outline-hidden focus:border-pink-500 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Cód SKU único</label>
                  <input 
                    id="new-product-sku"
                    type="text"
                    required
                    placeholder="Ex: LEG-SCUL-P"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-450 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Categoria</label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewCategory(!isCreatingNewCategory)}
                      className="text-[10px] text-pink-600 hover:text-pink-700 font-semibold cursor-pointer"
                    >
                      {isCreatingNewCategory ? "Selecionar" : "+ Criar"}
                    </button>
                  </div>
                  {isCreatingNewCategory ? (
                    <input
                      type="text"
                      placeholder="Nova categoria..."
                      value={newCustomCategoryInput}
                      onChange={(e) => setNewCustomCategoryInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-450 focus:outline-hidden focus:border-pink-500 transition-all font-medium text-xs"
                      required
                    />
                  ) : (
                    <select 
                      id="new-product-category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium text-xs"
                    >
                      {productCategoriesOnly.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Preço de Venda (R$)</label>
                  <input 
                    id="new-product-price"
                    type="number"
                    step="0.01"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Preço Regular (Opcional)</label>
                  <input 
                    id="new-product-compare-at"
                    type="number"
                    step="0.01"
                    value={newCompareAtPrice ?? ''}
                    onChange={(e) => setNewCompareAtPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono"
                    placeholder="Sem desconto"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Custo de Fabr./Aq. (R$)</label>
                  <input 
                    id="new-product-cost"
                    type="number"
                    step="0.01"
                    required
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Estoque Inicial (Peças)</label>
                  <input 
                    id="new-product-stock"
                    type="number"
                    required
                    value={newStock}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 focus:outline-hidden transition-all font-medium font-mono cursor-not-allowed"
                    title="Calculado automaticamente como a soma das quantidades por cor abaixo"
                  />
                  <p className="text-[8px] text-pink-600 font-semibold leading-none">Soma das quantidades por cor abaixo</p>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Alerta Estoque Baixo (Peças)</label>
                  <input 
                    id="new-product-min-stock"
                    type="number"
                    required
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Descrição Detalhada (Aparece no Site)</label>
                <textarea 
                  placeholder="Descreva detalhes premium da peça: tecido, toque gelado, compressão, se fica transparente..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-pink-500 transition-all font-medium h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Cores Disponíveis (Gerais)</label>
                  <input 
                    type="text"
                    placeholder="Preto, Pink Glow, Azul Celeste"
                    value={newColors}
                    onChange={(e) => setNewColors(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Tamanhos Disponíveis</label>
                  <input 
                    type="text"
                    placeholder="P, M, G, GG"
                    value={newSizes}
                    onChange={(e) => setNewSizes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono"
                  />
                </div>
              </div>

              {/* Seletor Dinâmico de Cores */}
              {newColors.split(',').map(c => c.trim()).filter(Boolean).length > 0 && (
                <div className="mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 animate-in fade-in duration-200">
                  <div className="font-extrabold text-[8px] text-slate-500 uppercase tracking-wider">Ajustar Tons de Cores (Seletor Dinâmico):</div>
                  <div className="flex flex-wrap gap-2">
                    {newColors.split(',').map(c => c.trim()).filter(Boolean).map(color => {
                      const normColor = color.toLowerCase().trim();
                      const hex = customColorMap[normColor] || colorToHex(color);
                      const displayHex = hex.startsWith('#') ? hex : '#cccccc';
                      return (
                        <div key={color} className="flex items-center gap-1.5 bg-white border border-slate-150 px-2 py-0.5 rounded-lg shadow-3xs hover:border-pink-200 transition-all">
                          <input
                            type="color"
                            value={displayHex}
                            onChange={(e) => handleColorHexChange(color, e.target.value)}
                            className="w-5 h-5 rounded-md cursor-pointer border-none bg-transparent shrink-0 p-0"
                            title={`Escolher tom para ${color}`}
                          />
                          <span className="text-[9px] font-bold text-slate-700 capitalize truncate max-w-[80px]">{color}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tabela de Medidas de Referência (Provador Virtual) */}
              {newSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).length > 0 && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-[9px] text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Ruler size={11} className="text-pink-600" />
                      Tabela de Medidas de Referência (cm)
                    </div>
                    <span className="text-[8px] text-slate-400 font-bold">Provador Virtual</span>
                  </div>
                  <p className="text-[8.5px] text-slate-400">Insira as faixas de medida recomendadas para cada tamanho.</p>
                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                    {newSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).map(sz => {
                      const normSz = sz.toUpperCase().trim();
                      const currentSpec = newMeasurementSpecs[normSz] || newMeasurementSpecs[sz] || getFallbackSpecsForSize(sz);
                      
                      const updateSpec = (field: 'bustoMin' | 'bustoMax' | 'cinturaMin' | 'cinturaMax' | 'quadrilMin' | 'quadrilMax', value: number) => {
                        setNewMeasurementSpecs(prev => ({
                          ...prev,
                          [sz]: {
                            ...(prev[sz] || getFallbackSpecsForSize(sz)),
                            [field]: value
                          }
                        }));
                      };

                      return (
                        <div key={sz} className="p-2 bg-white rounded-lg border border-slate-150 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-700 bg-slate-100/60 px-1.5 py-0.5 rounded">
                            <span>Tamanho {sz}</span>
                            <span className="text-[8px] text-pink-600">Recomendado padrão ativo</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[9px]">
                            <div>
                              <span className="block text-slate-400 uppercase font-bold text-[7.5px] mb-0.5">Busto (cm)</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={currentSpec.bustoMin}
                                  onChange={(e) => updateSpec('bustoMin', Number(e.target.value))}
                                  className="w-full px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] text-center font-semibold text-slate-700 focus:outline-hidden"
                                  placeholder="Mín"
                                />
                                <span className="text-slate-350">-</span>
                                <input
                                  type="number"
                                  value={currentSpec.bustoMax}
                                  onChange={(e) => updateSpec('bustoMax', Number(e.target.value))}
                                  className="w-full px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] text-center font-semibold text-slate-700 focus:outline-hidden"
                                  placeholder="Máx"
                                />
                              </div>
                            </div>

                            <div>
                              <span className="block text-slate-400 uppercase font-bold text-[7.5px] mb-0.5">Cintura (cm)</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={currentSpec.cinturaMin}
                                  onChange={(e) => updateSpec('cinturaMin', Number(e.target.value))}
                                  className="w-full px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] text-center font-semibold text-slate-700 focus:outline-hidden"
                                  placeholder="Mín"
                                />
                                <span className="text-slate-350">-</span>
                                <input
                                  type="number"
                                  value={currentSpec.cinturaMax}
                                  onChange={(e) => updateSpec('cinturaMax', Number(e.target.value))}
                                  className="w-full px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] text-center font-semibold text-slate-700 focus:outline-hidden"
                                  placeholder="Máx"
                                />
                              </div>
                            </div>

                            <div>
                              <span className="block text-slate-400 uppercase font-bold text-[7.5px] mb-0.5">Quadril (cm)</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={currentSpec.quadrilMin}
                                  onChange={(e) => updateSpec('quadrilMin', Number(e.target.value))}
                                  className="w-full px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] text-center font-semibold text-slate-700 focus:outline-hidden"
                                  placeholder="Mín"
                                />
                                <span className="text-slate-350">-</span>
                                <input
                                  type="number"
                                  value={currentSpec.quadrilMax}
                                  onChange={(e) => updateSpec('quadrilMax', Number(e.target.value))}
                                  className="w-full px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] text-center font-semibold text-slate-700 focus:outline-hidden"
                                  placeholder="Máx"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {newSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).length > 0 ? (
                <div className="space-y-3 mt-1 border border-pink-100 bg-pink-50/10 p-3 rounded-xl text-xs animate-fadeIn">
                  <div className="flex items-center gap-1.5 text-pink-700 font-bold uppercase text-[9px] tracking-widest">
                    <Sparkles size={11} className="text-pink-600 animate-pulse" />
                    <span>Estoque por Tamanho e Cor</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Informe a quantidade de peças para cada combinação de tamanho e cor. O estoque total será calculado automaticamente.
                  </p>
                  
                  <div className="space-y-3 pt-1">
                    {newSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).map(sz => {
                      const generalColors = newColors.split(',').map(c => c.trim()).filter(Boolean);
                      const sizeColorsArr = newSizeColors[sz]
                        ? newSizeColors[sz].split(',').map(c => c.trim()).filter(c => generalColors.includes(c))
                        : generalColors;

                      if (sizeColorsArr.length === 0) return null;

                      return (
                        <div key={sz} className="border border-slate-100 bg-white p-2.5 rounded-lg shadow-2xs">
                          <div className="font-extrabold text-[10px] text-slate-800 bg-slate-150 px-2 py-0.5 rounded-md inline-block mb-2">
                            TAMANHO {sz}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {sizeColorsArr.map(color => (
                              <div key={color} className="flex items-center justify-between gap-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="w-2.5 h-2.5 rounded-full border border-slate-200 shrink-0" style={{ backgroundColor: colorToHex(color) }} />
                                  <span className="font-semibold text-[10px] text-slate-700 truncate">{color}</span>
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={newSizeColorStocks[sz]?.[color] !== undefined ? newSizeColorStocks[sz][color] : 0}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setNewSizeColorStocks(prev => ({
                                      ...prev,
                                      [sz]: {
                                        ...(prev[sz] || {}),
                                        [color]: val
                                      }
                                    }));
                                  }}
                                  className="w-16 px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-705 text-[10px] font-medium font-mono focus:outline-hidden focus:border-pink-500 text-center"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                newColors.split(',').map(c => c.trim()).filter(Boolean).length > 0 && (
                  <div className="space-y-2 mt-1 border border-pink-100 bg-pink-50/10 p-3 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 text-pink-700 font-bold uppercase text-[9px] tracking-widest">
                      <Sparkles size={11} className="text-pink-600 animate-pulse" />
                      <span>Estoque por Cor</span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-normal">
                      Informe a quantidade de peças para cada cor informada acima. A soma total irá definir o estoque inicial do produto automaticamente.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {newColors.split(',').map(c => c.trim()).filter(Boolean).map(color => (
                        <div key={color} className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-150 shadow-2xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2.5 h-2.5 rounded-full border border-slate-200 shrink-0 animate-pulse" style={{ backgroundColor: colorToHex(color) }} />
                            <span className="font-semibold text-[10px] text-slate-700 truncate">{color}</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={newColorStocks[color] !== undefined ? newColorStocks[color] : 0}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setNewColorStocks(prev => ({
                                ...prev,
                                [color]: val
                              }));
                            }}
                            className="w-16 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-slate-705 text-[10px] font-medium font-mono focus:outline-hidden focus:border-pink-500 text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {newSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).length > 0 && (
                <div className="space-y-2 mt-1 border border-slate-100 bg-slate-50/50 p-3 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold uppercase text-[9px] tracking-widest">
                    <Sparkles size={11} className="text-pink-600 animate-pulse" />
                    <span>CORES ESPECÍFICAS POR TAMANHO (OPCIONAL)</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Associe cores a cada tamanho. Se configurado, o cliente verá apenas as cores vinculadas ao selecionar o respectivo tamanho. Digite as cores separadas por vírgula.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {newSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).map(sz => (
                      <div key={sz} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-150 shadow-2xs">
                        <span className="font-extrabold text-[10px] text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md min-w-[28px] text-center">{sz}</span>
                        <input
                          type="text"
                          placeholder="Ex: Azul Marinho, Preto, Vermelho"
                          value={newSizeColors[sz] || ''}
                          onChange={(e) => {
                            setNewSizeColors(prev => ({
                              ...prev,
                              [sz]: e.target.value
                            }));
                          }}
                          className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-705 focus:outline-hidden focus:border-pink-500 transition-all text-[10px] font-medium font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1 text-xs">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Link de Vídeo MP4 ou YouTube (Showcase)</label>
                <input 
                  type="text"
                  placeholder="Ex: https://www.w3schools.com/html/movie.mp4"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono text-xs"
                />
              </div>

              <div className="space-y-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="text-slate-600 font-extrabold uppercase text-[10px] tracking-wide block">Galeria de Fotos do Produto (Múltiplas Fotos)</label>
                
                {/* Previews grid */}
                <div className="grid grid-cols-5 gap-2">
                  {newImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-100 group shadow-xs">
                      <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = newImages.filter((_, i) => i !== idx);
                          setNewImages(updated);
                        }}
                        className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full cursor-pointer transition-all shadow-md flex items-center justify-center border-none"
                        title="Remover esta foto"
                      >
                        <X size={10} />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-pink-600/90 text-white font-extrabold text-[8px] text-center tracking-wider py-0.5 uppercase">CAPA</span>
                      )}
                    </div>
                  ))}
                  {newImages.length === 0 && (
                    <div className="col-span-5 py-4 text-center text-slate-400 font-medium text-xs">
                      Nenhuma foto adicionada. Adicione pelo menos uma foto abaixo.
                    </div>
                  )}
                </div>

                {/* Direct File Picker / Uploader */}
                <div className="bg-pink-50/50 border border-pink-100 p-2.5 rounded-lg text-[9.5px] leading-snug text-slate-700 flex items-start gap-1.5 font-sans my-1 select-none">
                  <span className="text-pink-600">💡</span>
                  <p><strong>Dimensões Recomendadas para Moda/Fitness:</strong> Prefira fotos na proporção <strong>4:5 Vertical</strong> (ex: 800×1000 px) ou <strong>1:1 Quadrada</strong> (ex: 800×800 px) para valorizar as peças no caimento corporal e na vitrine.</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">1. Enviar nova foto direto do aparelho:</span>
                  <ImageUploader 
                    onUploadSuccess={(url) => {
                      if (url) {
                        setNewImages(prev => [...prev, url]);
                      }
                    }} 
                    currentImageUrl=""
                  />
                </div>
                
                {/* Manual Link Input */}
                <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60 font-sans">
                  <span className="text-[10px] text-slate-500 font-bold block">2. Ou cole o link de uma foto da internet:</span>
                  <div className="flex gap-2">
                    <input 
                      id="new-product-image-add-input"
                      type="text"
                      disabled={isResolvingNew}
                      placeholder={isResolvingNew ? "Convertendo link do ImgBB..." : "Cole o link da foto de um produto..."}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-600 focus:outline-hidden focus:border-pink-500 transition-all font-mono text-[10px] disabled:bg-slate-100 disabled:text-slate-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            resolveImageAndAdd(val, 'new');
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      disabled={isResolvingNew}
                      onClick={(e) => {
                        const input = document.getElementById('new-product-image-add-input') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          resolveImageAndAdd(input.value.trim(), 'new');
                          input.value = '';
                        }
                      }}
                      className="px-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-md transition-all cursor-pointer text-xs border-none flex items-center gap-1 disabled:bg-pink-400/80 disabled:cursor-not-allowed"
                    >
                      {isResolvingNew ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Aguarde...</span>
                        </>
                      ) : (
                        <span>Adicionar</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button 
                  type="button" 
                  disabled={isSaving}
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold font-sans transition-all cursor-pointer text-center shadow-md shadow-pink-500/10 disabled:bg-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isSaving ? "Salvando..." : "Gravar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal Sheet */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all font-sans text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-50 overflow-hidden animate-in fade-in zoom-in duration-200" id="edit-product-modal">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs tracking-wider uppercase">Editar Peça Fitness</span>
              <button 
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-white transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            {/* Form list fields */}
            <form onSubmit={handleEditProductSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Nome Completo do Produto</label>
                <input 
                  id="edit-product-name"
                  type="text"
                  required
                  placeholder="Ex: Legging Sculpt Seamless Pink Glow"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-450 focus:outline-hidden focus:border-pink-500 transition-all font-medium text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Cód SKU único</label>
                  <input 
                    id="edit-product-sku"
                    type="text"
                    required
                    placeholder="Ex: LEG-SCUL-P"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-450 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Categoria</label>
                    <button
                      type="button"
                      onClick={() => setIsEditingNewCategory(!isEditingNewCategory)}
                      className="text-[10px] text-pink-600 hover:text-pink-700 font-semibold cursor-pointer"
                    >
                      {isEditingNewCategory ? "Selecionar" : "+ Criar"}
                    </button>
                  </div>
                  {isEditingNewCategory ? (
                    <input
                      type="text"
                      placeholder="Nova categoria..."
                      value={editCustomCategoryInput}
                      onChange={(e) => setEditCustomCategoryInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-450 focus:outline-hidden focus:border-pink-500 transition-all font-medium text-xs"
                      required
                    />
                  ) : (
                    <select 
                      id="edit-product-category"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium text-xs"
                    >
                      {productCategoriesOnly.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Preço de Venda (R$)</label>
                  <input 
                    id="edit-product-price"
                    type="number"
                    step="0.01"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Preço Regular (Opcional)</label>
                  <input 
                    id="edit-product-compare-at"
                    type="number"
                    step="0.01"
                    value={editCompareAtPrice ?? ''}
                    onChange={(e) => setEditCompareAtPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono text-xs"
                    placeholder="Sem desconto"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Custo de Fabr./Aq. (R$)</label>
                  <input 
                    id="edit-product-cost"
                    type="number"
                    step="0.01"
                    required
                    value={editCost}
                    onChange={(e) => setEditCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Estoque (Peças)</label>
                  <input 
                    id="edit-product-stock"
                    type="number"
                    required
                    value={editStock}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 focus:outline-hidden transition-all font-medium font-mono text-xs cursor-not-allowed"
                    title="Calculado automaticamente como a soma das quantidades por cor abaixo"
                  />
                  <p className="text-[8px] text-pink-600 font-semibold leading-none">Soma das quantidades por cor abaixo</p>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Alerta Estoque Baixo (Peças)</label>
                  <input 
                    id="edit-product-min-stock"
                    type="number"
                    required
                    value={editMinStock}
                    onChange={(e) => setEditMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Descrição Detalhada (Aparece no Site)</label>
                <textarea 
                  placeholder="Descreva detalhes premium da peça: tecido, toque gelado, compressão, se fica transparente..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-450 focus:outline-hidden focus:border-pink-500 transition-all font-medium h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Cores Disponíveis (Gerais)</label>
                  <input 
                    type="text"
                    placeholder="Preto, Pink Glow, Azul Celeste"
                    value={editColors}
                    onChange={(e) => setEditColors(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Tamanhos Disponíveis</label>
                  <input 
                    type="text"
                    placeholder="P, M, G, GG"
                    value={editSizes}
                    onChange={(e) => setEditSizes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono"
                  />
                </div>
              </div>

              {/* Seletor Dinâmico de Cores (Edição) */}
              {editColors.split(',').map(c => c.trim()).filter(Boolean).length > 0 && (
                <div className="mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 animate-in fade-in duration-200">
                  <div className="font-extrabold text-[8px] text-slate-500 uppercase tracking-wider">Ajustar Tons de Cores (Seletor Dinâmico):</div>
                  <div className="flex flex-wrap gap-2">
                    {editColors.split(',').map(c => c.trim()).filter(Boolean).map(color => {
                      const normColor = color.toLowerCase().trim();
                      const hex = customColorMap[normColor] || colorToHex(color);
                      const displayHex = hex.startsWith('#') ? hex : '#cccccc';
                      return (
                        <div key={color} className="flex items-center gap-1.5 bg-white border border-slate-150 px-2 py-0.5 rounded-lg shadow-3xs hover:border-pink-200 transition-all">
                          <input
                            type="color"
                            value={displayHex}
                            onChange={(e) => handleColorHexChange(color, e.target.value)}
                            className="w-5 h-5 rounded-md cursor-pointer border-none bg-transparent shrink-0 p-0"
                            title={`Escolher tom para ${color}`}
                          />
                          <span className="text-[9px] font-bold text-slate-700 capitalize truncate max-w-[80px]">{color}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tabela de Medidas de Referência (Provador Virtual - Edição) */}
              {editSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).length > 0 && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-[9px] text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Ruler size={11} className="text-pink-600" />
                      Tabela de Medidas de Referência (cm)
                    </div>
                    <span className="text-[8px] text-slate-400 font-bold">Provador Virtual</span>
                  </div>
                  <p className="text-[8.5px] text-slate-400">Insira as faixas de medida recomendadas para cada tamanho.</p>
                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                    {editSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).map(sz => {
                      const normSz = sz.toUpperCase().trim();
                      const currentSpec = editMeasurementSpecs[normSz] || editMeasurementSpecs[sz] || getFallbackSpecsForSize(sz);
                      
                      const updateSpec = (field: 'bustoMin' | 'bustoMax' | 'cinturaMin' | 'cinturaMax' | 'quadrilMin' | 'quadrilMax', value: number) => {
                        setEditMeasurementSpecs(prev => ({
                          ...prev,
                          [sz]: {
                            ...(prev[sz] || getFallbackSpecsForSize(sz)),
                            [field]: value
                          }
                        }));
                      };

                      return (
                        <div key={sz} className="p-2 bg-white rounded-lg border border-slate-150 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-700 bg-slate-100/60 px-1.5 py-0.5 rounded">
                            <span>Tamanho {sz}</span>
                            <span className="text-[8px] text-pink-600">Recomendado padrão ativo</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[9px]">
                            <div>
                              <span className="block text-slate-400 uppercase font-bold text-[7.5px] mb-0.5">Busto (cm)</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={currentSpec.bustoMin}
                                  onChange={(e) => updateSpec('bustoMin', Number(e.target.value))}
                                  className="w-full px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] text-center font-semibold text-slate-700 focus:outline-hidden"
                                  placeholder="Mín"
                                />
                                <span className="text-slate-350">-</span>
                                <input
                                  type="number"
                                  value={currentSpec.bustoMax}
                                  onChange={(e) => updateSpec('bustoMax', Number(e.target.value))}
                                  className="w-full px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] text-center font-semibold text-slate-700 focus:outline-hidden"
                                  placeholder="Máx"
                                />
                              </div>
                            </div>

                            <div>
                              <span className="block text-slate-400 uppercase font-bold text-[7.5px] mb-0.5">Cintura (cm)</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={currentSpec.cinturaMin}
                                  onChange={(e) => updateSpec('cinturaMin', Number(e.target.value))}
                                  className="w-full px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] text-center font-semibold text-slate-700 focus:outline-hidden"
                                  placeholder="Mín"
                                />
                                <span className="text-slate-350">-</span>
                                <input
                                  type="number"
                                  value={currentSpec.cinturaMax}
                                  onChange={(e) => updateSpec('cinturaMax', Number(e.target.value))}
                                  className="w-full px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] text-center font-semibold text-slate-700 focus:outline-hidden"
                                  placeholder="Máx"
                                />
                              </div>
                            </div>

                            <div>
                              <span className="block text-slate-400 uppercase font-bold text-[7.5px] mb-0.5">Quadril (cm)</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={currentSpec.quadrilMin}
                                  onChange={(e) => updateSpec('quadrilMin', Number(e.target.value))}
                                  className="w-full px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] text-center font-semibold text-slate-700 focus:outline-hidden"
                                  placeholder="Mín"
                                />
                                <span className="text-slate-350">-</span>
                                <input
                                  type="number"
                                  value={currentSpec.quadrilMax}
                                  onChange={(e) => updateSpec('quadrilMax', Number(e.target.value))}
                                  className="w-full px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] text-center font-semibold text-slate-700 focus:outline-hidden"
                                  placeholder="Máx"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {editSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).length > 0 ? (
                <div className="space-y-3 mt-1 border border-pink-100 bg-pink-50/10 p-3 rounded-xl text-xs animate-fadeIn">
                  <div className="flex items-center gap-1.5 text-pink-700 font-bold uppercase text-[9px] tracking-widest">
                    <Sparkles size={11} className="text-pink-600 animate-pulse" />
                    <span>Estoque por Tamanho e Cor</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Informe a quantidade de peças para cada combinação de tamanho e cor. O estoque total será calculado automaticamente.
                  </p>
                  
                  <div className="space-y-3 pt-1">
                    {editSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).map(sz => {
                      const generalColors = editColors.split(',').map(c => c.trim()).filter(Boolean);
                      const sizeColorsArr = editSizeColors[sz]
                        ? editSizeColors[sz].split(',').map(c => c.trim()).filter(c => generalColors.includes(c))
                        : generalColors;

                      if (sizeColorsArr.length === 0) return null;

                      return (
                        <div key={sz} className="border border-slate-100 bg-white p-2.5 rounded-lg shadow-2xs">
                          <div className="font-extrabold text-[10px] text-slate-800 bg-slate-150 px-2 py-0.5 rounded-md inline-block mb-2">
                            TAMANHO {sz}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {sizeColorsArr.map(color => (
                              <div key={color} className="flex items-center justify-between gap-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="w-2.5 h-2.5 rounded-full border border-slate-200 shrink-0" style={{ backgroundColor: colorToHex(color) }} />
                                  <span className="font-semibold text-[10px] text-slate-700 truncate">{color}</span>
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={editSizeColorStocks[sz]?.[color] !== undefined ? editSizeColorStocks[sz][color] : 0}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setEditSizeColorStocks(prev => ({
                                      ...prev,
                                      [sz]: {
                                        ...(prev[sz] || {}),
                                        [color]: val
                                      }
                                    }));
                                  }}
                                  className="w-16 px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-705 text-[10px] font-medium font-mono focus:outline-hidden focus:border-pink-500 text-center"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                editColors.split(',').map(c => c.trim()).filter(Boolean).length > 0 && (
                  <div className="space-y-2 mt-1 border border-pink-100 bg-pink-50/10 p-3 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 text-pink-700 font-bold uppercase text-[9px] tracking-widest">
                      <Sparkles size={11} className="text-pink-600 animate-pulse" />
                      <span>Estoque por Cor</span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-normal">
                      Informe a quantidade de peças para cada cor informada acima. A soma total irá definir o estoque do produto automaticamente.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {editColors.split(',').map(c => c.trim()).filter(Boolean).map(color => (
                        <div key={color} className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-150 shadow-2xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2.5 h-2.5 rounded-full border border-slate-200 shrink-0 animate-pulse" style={{ backgroundColor: colorToHex(color) }} />
                            <span className="font-semibold text-[10px] text-slate-700 truncate">{color}</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={editColorStocks[color] !== undefined ? editColorStocks[color] : 0}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setEditColorStocks(prev => ({
                                ...prev,
                                [color]: val
                              }));
                            }}
                            className="w-16 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-slate-705 text-[10px] font-medium font-mono focus:outline-hidden focus:border-pink-500 text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {editSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).length > 0 && (
                <div className="space-y-2 mt-1 border border-slate-100 bg-slate-50/50 p-3 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold uppercase text-[9px] tracking-widest">
                    <Sparkles size={11} className="text-pink-600 animate-pulse" />
                    <span>CORES ESPECÍFICAS POR TAMANHO (OPCIONAL)</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Associe cores a cada tamanho. Se configurado, o cliente verá apenas as cores vinculadas ao selecionar o respectivo tamanho. Digite as cores separadas por vírgula.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {editSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).map(sz => (
                      <div key={sz} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-150 shadow-2xs">
                        <span className="font-extrabold text-[10px] text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md min-w-[28px] text-center">{sz}</span>
                        <input
                          type="text"
                          placeholder="Ex: Azul Marinho, Preto, Vermelho"
                          value={editSizeColors[sz] || ''}
                          onChange={(e) => {
                            setEditSizeColors(prev => ({
                              ...prev,
                              [sz]: e.target.value
                            }));
                          }}
                          className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-705 focus:outline-hidden focus:border-pink-500 transition-all text-[10px] font-medium font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1 text-xs">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Link de Vídeo MP4 ou YouTube (Showcase)</label>
                <input 
                  type="text"
                  placeholder="Ex: https://www.w3schools.com/html/movie.mp4"
                  value={editVideoUrl}
                  onChange={(e) => setEditVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-pink-500 transition-all font-medium font-mono text-xs"
                />
              </div>

              <div className="space-y-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="text-slate-600 font-extrabold uppercase text-[10px] tracking-wide block">Galeria de Fotos do Produto (Múltiplas Fotos)</label>
                
                {/* Previews grid */}
                <div className="grid grid-cols-5 gap-2">
                  {editImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-100 group shadow-xs">
                      <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editImages.filter((_, i) => i !== idx);
                          setEditImages(updated);
                        }}
                        className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full cursor-pointer transition-all shadow-md flex items-center justify-center border-none"
                        title="Remover esta foto"
                      >
                        <X size={10} />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-pink-600/90 text-white font-extrabold text-[8px] text-center tracking-wider py-0.5 uppercase">CAPA</span>
                      )}
                    </div>
                  ))}
                  {editImages.length === 0 && (
                    <div className="col-span-5 py-4 text-center text-slate-400 font-medium text-xs">
                      Nenhuma foto adicionada. Adicione pelo menos uma foto abaixo.
                    </div>
                  )}
                </div>

                {/* Direct File Picker / Uploader */}
                <div className="bg-pink-50/50 border border-pink-100 p-2.5 rounded-lg text-[9.5px] leading-snug text-slate-700 flex items-start gap-1.5 font-sans my-1 select-none">
                  <span className="text-pink-600">💡</span>
                  <p><strong>Dimensões Recomendadas para Moda/Fitness:</strong> Prefira fotos na proporção <strong>4:5 Vertical</strong> (ex: 800×1000 px) ou <strong>1:1 Quadrada</strong> (ex: 800×800 px) para valorizar as peças no caimento corporal e na vitrine.</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">1. Enviar nova foto direto do aparelho:</span>
                  <ImageUploader 
                    onUploadSuccess={(url) => {
                      if (url) {
                        setEditImages(prev => [...prev, url]);
                      }
                    }} 
                    currentImageUrl=""
                  />
                </div>
                
                {/* Manual Link Input */}
                <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60 font-sans">
                  <span className="text-[10px] text-slate-500 font-bold block">2. Ou cole o link de uma foto da internet:</span>
                  <div className="flex gap-2">
                    <input 
                      id="edit-product-image-add-input"
                      type="text"
                      disabled={isResolvingEdit}
                      placeholder={isResolvingEdit ? "Convertendo link do ImgBB..." : "Cole o link da foto de um produto..."}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-600 focus:outline-hidden focus:border-pink-500 transition-all font-mono text-[10px] disabled:bg-slate-100 disabled:text-slate-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            resolveImageAndAdd(val, 'edit');
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      disabled={isResolvingEdit}
                      onClick={(e) => {
                        const input = document.getElementById('edit-product-image-add-input') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          resolveImageAndAdd(input.value.trim(), 'edit');
                          input.value = '';
                        }
                      }}
                      className="px-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-md transition-all cursor-pointer text-xs border-none flex items-center gap-1 disabled:bg-pink-400/80 disabled:cursor-not-allowed"
                    >
                      {isResolvingEdit ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Aguarde...</span>
                        </>
                      ) : (
                        <span>Adicionar</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button 
                  type="button" 
                  disabled={isSaving}
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl text-xs font-bold transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center shadow-md shadow-pink-500/10 disabled:bg-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isSaving ? "Salvando..." : "Gravar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Custom Combo Modal Popup */}
      {isComboModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-50 overflow-hidden font-sans">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs tracking-wider uppercase">Criador de Combo Promocional</span>
              <button 
                onClick={() => setIsComboModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!comboName.trim()) {
                  alert('Insira o nome do combo!');
                  return;
                }
                if (selectedComboProducts.length === 0) {
                  alert('Selecione pelo menos uma peça de roupa para o combo!');
                  return;
                }

                const comboItems = selectedComboProducts.map(prodId => {
                  const p = products.find(prod => prod.id === prodId);
                  return {
                    productId: prodId,
                    name: p ? p.name : 'Peça desconhecida',
                    quantity: 1
                  };
                });

                const newCombo = {
                  id: `combo-${Date.now()}`,
                  name: comboName.trim(),
                  price: comboPrice,
                  items: comboItems,
                  salesCount: 0,
                  active: true
                };

                setCombos(prev => [newCombo, ...prev]);
                setIsComboModalOpen(false);
                alert('Combo promocional cadastrado com sucesso!');
              }}
              className="p-6 space-y-4 text-xs text-slate-700"
            >
              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Nome do Combo</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Conjunto Top + Legging"
                  value={comboName}
                  onChange={(e) => setComboName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-pink-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wide block">Preço Promocional Combo (R$)</label>
                <input 
                  type="number"
                  required
                  value={comboPrice}
                  onChange={(e) => setComboPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-pink-500 transition-all font-mono font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Selecione as Peças que fazem parte:</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-100 p-2 rounded-lg bg-slate-50/50 pr-1">
                  {products.map(p => (
                    <label key={p.id} className="flex items-center gap-2 p-1.5 bg-white border border-slate-100 rounded-md cursor-pointer hover:border-slate-200">
                      <input 
                        type="checkbox"
                        checked={selectedComboProducts.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedComboProducts(prev => [...prev, p.id]);
                          } else {
                            setSelectedComboProducts(prev => prev.filter(id => id !== p.id));
                          }
                        }}
                        className="rounded border-slate-200 text-pink-600 focus:ring-pink-500"
                      />
                      <span className="text-[11px] font-sans font-medium text-slate-700 truncate">{p.name} (SKU: {p.sku})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button 
                  type="button" 
                  onClick={() => setIsComboModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-650 rounded-lg font-bold transition-all hover:bg-slate-205 cursor-pointer text-center border-none"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-pink-600 text-white rounded-lg font-bold transition-all hover:bg-pink-700 cursor-pointer text-center shadow-md shadow-pink-500/10 border-none"
                >
                  Confirmar Combo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProductGradeCardProps {
  product: Product;
  onUpdateProduct: (prod: Product) => Promise<void> | void;
}

function ProductGradeCard({ product, onUpdateProduct }: ProductGradeCardProps) {
  const sizesList = ['P', 'M', 'G', 'GG'];
  const [matrix, setMatrix] = useState<Record<string, Record<string, number>>>(() => {
    const initialMatrix: Record<string, Record<string, number>> = {};
    const existing = product.sizeColorStocks || {};
    
    sizesList.forEach(sz => {
      initialMatrix[sz] = {};
      const colors = product.colors && product.colors.length > 0 ? product.colors : ['Preto'];
      colors.forEach(col => {
        initialMatrix[sz][col] = existing[sz]?.[col] || 0;
      });
    });
    return initialMatrix;
  });

  const [colorsList, setColorsList] = useState<string[]>(() => {
    return product.colors && product.colors.length > 0 ? product.colors : ['Preto'];
  });

  const [newColorInput, setNewColorInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    const initialMatrix: Record<string, Record<string, number>> = {};
    const existing = product.sizeColorStocks || {};
    sizesList.forEach(sz => {
      initialMatrix[sz] = {};
      const colors = product.colors && product.colors.length > 0 ? product.colors : ['Preto'];
      colors.forEach(col => {
        initialMatrix[sz][col] = existing[sz]?.[col] || 0;
      });
    });
    setMatrix(initialMatrix);
    setColorsList(product.colors && product.colors.length > 0 ? product.colors : ['Preto']);
  }, [product]);

  const handleCellChange = (size: string, color: string, value: number) => {
    const val = isNaN(value) ? 0 : Math.max(0, value);
    setMatrix(prev => ({
      ...prev,
      [size]: {
        ...(prev[size] || {}),
        [color]: val
      }
    }));
  };

  const handleAddColor = () => {
    const color = newColorInput.trim();
    if (!color) return;
    if (colorsList.includes(color)) {
      alert('Esta cor já existe na lista.');
      return;
    }
    
    setColorsList(prev => [...prev, color]);
    setMatrix(prev => {
      const updated = { ...prev };
      sizesList.forEach(sz => {
        updated[sz] = {
          ...(updated[sz] || {}),
          [color]: 0
        };
      });
      return updated;
    });
    setNewColorInput('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      let totalStock = 0;
      const finalColorStocks: Record<string, number> = {};
      const finalSizeColorStocks: Record<string, Record<string, number>> = {};

      sizesList.forEach(sz => {
        finalSizeColorStocks[sz] = {};
        colorsList.forEach(col => {
          const qty = matrix[sz]?.[col] || 0;
          finalSizeColorStocks[sz][col] = qty;
          finalColorStocks[col] = (finalColorStocks[col] || 0) + qty;
          totalStock += qty;
        });
      });

      await onUpdateProduct({
        ...product,
        stock: totalStock,
        colors: colorsList,
        sizes: sizesList,
        colorStocks: finalColorStocks,
        sizeColorStocks: finalSizeColorStocks,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar estoque da grade.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 font-sans select-none flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-slate-800 text-xs truncate leading-tight">{product.name}</h4>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="font-mono text-[9px] font-bold text-slate-400">SKU: {product.sku}</span>
              <span className="text-slate-300 text-[10px]">•</span>
              <span className="bg-slate-100 text-slate-650 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">{product.category}</span>
              <span className="text-slate-300 text-[10px]">•</span>
              <span className="text-pink-600 font-bold text-[10px] font-mono">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] text-slate-400 font-medium">Estoque Total</div>
            <div className="font-mono font-black text-slate-700 text-sm">{product.stock} un</div>
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-50 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                <th className="py-2 pr-2">Cor</th>
                {sizesList.map(sz => (
                  <th key={sz} className="py-2 text-center w-14">{sz}</th>
                ))}
                <th className="py-2 text-right w-12">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-650">
              {colorsList.map(col => {
                let rowTotal = 0;
                sizesList.forEach(sz => {
                  rowTotal += matrix[sz]?.[col] || 0;
                });

                return (
                  <tr key={col} className="hover:bg-slate-50/40">
                    <td className="py-2 pr-2 font-medium flex items-center gap-1.5 min-w-[80px]">
                      <span className="w-2 h-2 rounded-full border border-slate-200" style={{ backgroundColor: colorToHex(col) }} />
                      <span className="truncate">{col}</span>
                    </td>
                    {sizesList.map(sz => {
                      const qty = matrix[sz]?.[col] ?? 0;
                      const isCritical = qty <= 3;
                      return (
                        <td key={sz} className="py-1 text-center">
                          <input
                            type="number"
                            value={qty}
                            onChange={(e) => handleCellChange(sz, col, parseInt(e.target.value))}
                            className={`w-12 text-center border focus:outline-hidden rounded-lg p-1 font-mono text-xs font-bold transition-all ${
                              isCritical
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-750 border-rose-250 focus:border-red-500 focus:ring-red-500/10'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-850 border-slate-200 focus:border-pink-500 focus:bg-white focus:ring-pink-500/10'
                            }`}
                          />
                        </td>
                      );
                    })}
                    <td className="py-2 text-right font-mono font-bold text-slate-500">
                      {rowTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-50 flex items-center justify-between gap-4 mt-2">
        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="Nova cor..."
            value={newColorInput}
            onChange={(e) => setNewColorInput(e.target.value)}
            className="w-24 bg-slate-50 border border-slate-200 focus:border-pink-500 focus:bg-white focus:outline-hidden rounded-lg px-2 py-1 text-[11px]"
          />
          <button
            type="button"
            onClick={handleAddColor}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
          >
            + Cor
          </button>
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border-none
            ${saveSuccess 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10' 
              : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-500/10'}
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSaving ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
              <span>Salvando...</span>
            </>
          ) : saveSuccess ? (
            <>
              <Check size={13} />
              <span>Grade Salva!</span>
            </>
          ) : (
            <span>Salvar Grade</span>
          )}
        </button>
      </div>
    </div>
  );
}
