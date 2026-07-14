/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  FileText, 
  Calendar, 
  ShoppingBag, 
  CheckCircle, 
  Clock, 
  TrendingDown, 
  DollarSign, 
  Trash2, 
  ArrowUpRight, 
  Truck, 
  Users,
  Award,
  Zap,
  Edit,
  X
} from 'lucide-react';
import { Product, Transaction } from '../types';

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  category?: string;
  notes?: string;
  createdAt: string;
}

export interface SupplierPurchase {
  id: string;
  supplierId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  purchaseDate: string;
  status: 'Recebido' | 'A Caminho' | 'Pendente';
  notes?: string;
  createdAt: string;
}

interface SuppliersManagementProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onAddTransaction: (transaction: Transaction) => void;
  activeSubTab?: 'fornecedores' | 'compras';
  setActiveSubTab?: (subTab: 'fornecedores' | 'compras') => void;
}

export default function SuppliersManagement({ 
  products, 
  onUpdateProduct, 
  onAddTransaction,
  activeSubTab: propActiveSubTab,
  setActiveSubTab: propSetActiveSubTab
}: SuppliersManagementProps) {
  const [internalActiveSubTab, setInternalActiveSubTab] = useState<'fornecedores' | 'compras'>('fornecedores');
  const activeSubTab = propActiveSubTab || internalActiveSubTab;
  const setActiveSubTab = propSetActiveSubTab || setInternalActiveSubTab;
  
  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('ap_moda_suppliers');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'sup-1', name: 'Suplementos e Tecidos Brás Ltda', cnpj: '12.345.678/0001-90', contactName: 'Renato Silva', phone: '(11) 98765-4321', email: 'vendas@brastextil.com', category: 'Tecidos & Malhas', notes: 'Contato principal para tecidos de poliamida e suplex.', createdAt: '2026-06-12T10:00:00Z' },
      { id: 'sup-2', name: 'Confecções Sul Fit Brasil', cnpj: '98.765.432/0001-21', contactName: 'Marta Souza', phone: '(47) 99821-3344', email: 'marta.fit@sulfit.com.br', category: 'Faccionista / Fitness', notes: 'Faccionista externa parceira na montagem de tops e calças dry-fit.', createdAt: '2026-06-13T14:30:00Z' },
      { id: 'sup-3', name: 'Acessórios e Elásticos Prime', cnpj: '45.678.901/0001-30', contactName: 'Carlos Santos', phone: '(11) 2233-4455', email: 'carlos@elasticosprime.com', category: 'Aviamentos', notes: 'Fornecedor de elásticos personalizados com a marca AP Moda.', createdAt: '2026-06-14T09:15:00Z' }
    ];
  });

  // Purchases state
  const [purchases, setPurchases] = useState<SupplierPurchase[]>(() => {
    const saved = localStorage.getItem('ap_moda_supplier_purchases');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'pur-1', supplierId: 'sup-1', productId: 'p-1', productName: 'Conjunto Legging Alto Relevo Pink', quantity: 15, unitCost: 45.00, totalCost: 675.00, purchaseDate: '2026-06-15', status: 'Recebido', notes: 'Suprimento de estoque para reposição urgente de inverno.', createdAt: '2026-06-15T15:20:00Z' },
      { id: 'pur-2', supplierId: 'sup-2', productId: 'p-2', productName: 'Calça Legging Fusô Black', quantity: 20, unitCost: 40.00, totalCost: 800.00, purchaseDate: '2026-06-16', status: 'A Caminho', notes: 'Remessa de Dry-Fit de poliamida premium.', createdAt: '2026-06-16T11:45:00Z' }
    ];
  });

  // Keep state synced in localStorage
  useEffect(() => {
    localStorage.setItem('ap_moda_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('ap_moda_supplier_purchases', JSON.stringify(purchases));
  }, [purchases]);

  const [editingPurchase, setEditingPurchase] = useState<SupplierPurchase | null>(null);
  const [editPurSupplierId, setEditPurSupplierId] = useState('');
  const [editPurProductId, setEditPurProductId] = useState('');
  const [editPurQty, setEditPurQty] = useState<number>(0);
  const [editPurUnitCost, setEditPurUnitCost] = useState<number>(0);
  const [editPurDate, setEditPurDate] = useState('');
  const [editPurStatus, setEditPurStatus] = useState<'Recebido' | 'A Caminho' | 'Pendente'>('Recebido');
  const [editPurNotes, setEditPurNotes] = useState('');

  const handleDeletePurchase = (id: string) => {
    if (confirm('Deseja realmente excluir esta compra de suprimentos?')) {
      setPurchases(prev => prev.filter(p => p.id !== id));
    }
  };

  const startEditPurchase = (pur: SupplierPurchase) => {
    setEditingPurchase(pur);
    setEditPurSupplierId(pur.supplierId);
    setEditPurProductId(pur.productId || '');
    setEditPurQty(pur.quantity);
    setEditPurUnitCost(pur.unitCost);
    setEditPurDate(pur.purchaseDate);
    setEditPurStatus(pur.status);
    setEditPurNotes(pur.notes || '');
  };

  const handleSavePurchaseEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;
    
    const selectedProd = products.find(p => p.id === editPurProductId);
    const prodName = selectedProd ? selectedProd.name : editingPurchase.productName;
    const totCost = Number(editPurQty) * Number(editPurUnitCost);

    setPurchases(prev => prev.map(p => p.id === editingPurchase.id ? {
      ...p,
      supplierId: editPurSupplierId,
      productId: editPurProductId,
      productName: prodName,
      quantity: Number(editPurQty),
      unitCost: Number(editPurUnitCost),
      totalCost: totCost,
      purchaseDate: editPurDate,
      status: editPurStatus,
      notes: editPurNotes
    } : p));

    setEditingPurchase(null);
    alert('Compra de suprimentos editada com sucesso!');
  };

  // Form states - Fornecedor
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [supCnpj, setSupCnpj] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supCategory, setSupCategory] = useState('Tecidos & Malhas');
  const [supNotes, setSupNotes] = useState('');

  // Form states - Compra
  const [isAddPurchaseModalOpen, setIsAddPurchaseModalOpen] = useState(false);
  const [purSupplierId, setPurSupplierId] = useState('');
  const [purProductId, setPurProductId] = useState('');
  const [purQty, setPurQty] = useState<number>(10);
  const [purUnitCost, setPurUnitCost] = useState<number>(0);
  const [purDate, setPurDate] = useState(new Date().toISOString().split('T')[0]);
  const [purStatus, setPurStatus] = useState<'Recebido' | 'A Caminho' | 'Pendente'>('Recebido');
  const [purNotes, setPurNotes] = useState('');
  const [linkToFinance, setLinkToFinance] = useState(true);

  // Filters
  const [supSearchTerm, setSupSearchTerm] = useState('');
  const [purSearchTerm, setPurSearchTerm] = useState('');

  // Watch selected product to pre-fill cost value
  useEffect(() => {
    if (purProductId) {
      const selectedProd = products.find(p => p.id === purProductId);
      if (selectedProd) {
        setPurUnitCost(selectedProd.cost || 0);
      }
    }
  }, [purProductId, products]);

  // Handle adding a Supplier
  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: supName.trim(),
      cnpj: supCnpj.trim() || undefined,
      contactName: supContact.trim() || undefined,
      phone: supPhone.trim() || undefined,
      email: supEmail.trim() || undefined,
      category: supCategory,
      notes: supNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    setSuppliers(prev => [newSup, ...prev]);
    setIsAddSupplierModalOpen(false);
    
    // Clear fields
    setSupName('');
    setSupCnpj('');
    setSupContact('');
    setSupPhone('');
    setSupEmail('');
    setSupNotes('');
  };

  // Handle deleting a supplier
  const handleDeleteSupplier = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fornecedor? As compras vinculadas continuarão registradas.')) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
    }
  };

  // Handle adding a Purchase
  const handleAddPurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purSupplierId || !purProductId) {
      alert('Por favor, selecione o fornecedor e o produto correspondente.');
      return;
    }

    const selectedProduct = products.find(p => p.id === purProductId);
    const selectedSupplier = suppliers.find(s => s.id === purSupplierId);

    if (!selectedProduct || !selectedSupplier) return;

    const totalCost = Number((purQty * purUnitCost).toFixed(2));

    const newPurchase: SupplierPurchase = {
      id: `pur-${Date.now()}`,
      supplierId: purSupplierId,
      productId: purProductId,
      productName: selectedProduct.name,
      quantity: purQty,
      unitCost: purUnitCost,
      totalCost: totalCost,
      purchaseDate: purDate,
      status: purStatus,
      notes: purNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    setPurchases(prev => [newPurchase, ...prev]);

    // OPTIONAL SCIENTIFIC LOGIC: If purchase is RECEIVED ("Recebido"), update product stock!
    if (purStatus === 'Recebido') {
      const updatedProduct = {
        ...selectedProduct,
        stock: selectedProduct.stock + purQty,
        cost: purUnitCost // Update product standard cost price with this new purchase cost price automatically!
      };
      onUpdateProduct(updatedProduct);
    }

    // Is Linked to Finance? Add outflow transaction
    if (linkToFinance) {
      const tx: Transaction = {
        id: `tx-sup-${Date.now()}`,
        type: 'Outflow',
        category: 'Fornecedores',
        description: `Compra Ref: ${selectedProduct.name} (${purQty} Unid) - ${selectedSupplier.name}`,
        amount: totalCost,
        date: purDate
      };
      onAddTransaction(tx);
    }

    setIsAddPurchaseModalOpen(false);
    alert(`Compra registrada com sucesso! ${purStatus === 'Recebido' ? 'Estoque do produto incrementado no sistema.' : 'Estoque pendente de recebimento físico.'}`);

    // Reset fields
    setPurProductId('');
    setPurQty(10);
    setPurNotes('');
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Filters computed lists
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const query = supSearchTerm.toLowerCase();
      return (
        s.name.toLowerCase().includes(query) ||
        (s.cnpj && s.cnpj.includes(query)) ||
        (s.contactName && s.contactName.toLowerCase().includes(query)) ||
        (s.category && s.category.toLowerCase().includes(query))
      );
    });
  }, [suppliers, supSearchTerm]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const query = purSearchTerm.toLowerCase();
      const sup = suppliers.find(s => s.id === p.supplierId);
      return (
        p.productName.toLowerCase().includes(query) ||
        (sup && sup.name.toLowerCase().includes(query)) ||
        (p.notes && p.notes.toLowerCase().includes(query))
      );
    });
  }, [purchases, suppliers, purSearchTerm]);

  // Statistics summaries
  const stats = useMemo(() => {
    const totalSpent = purchases.reduce((sum, p) => sum + p.totalCost, 0);
    const pendingPurchasesCount = purchases.filter(p => p.status !== 'Recebido').length;
    return {
      totalSpent,
      suppliersCount: suppliers.length,
      purchasesCount: purchases.length,
      pendingCount: pendingPurchasesCount
    };
  }, [suppliers, purchases]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Upper header action zone */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100/80 shadow-xs">
        <div className="flex items-center gap-3.5 text-left">
          <div className="p-2.5 bg-pink-100 border border-pink-200 text-pink-600 rounded-xl">
            <Building2 size={24} className="animate-pulse" />
          </div>
          <div className="space-y-0.5 leading-snug">
            <h1 className="text-slate-800 font-extrabold text-base tracking-tight uppercase">Gestão de Fornecedores & Compras</h1>
            <p className="text-slate-500 text-[11px] font-medium leading-none">Cadastre fornecedores, controle faturas e vincule suprimentos de estoque</p>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddSupplierModalOpen(true)}
            className="px-3.5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-pink-600/10 active:scale-95 border-0"
          >
            <Plus size={14} />
            <span>Novo Fornecedor</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (suppliers.length === 0) {
                alert('Por favor, cadastre ao menos um fornecedor primeiro antes de realizar lançamentos de estoque!');
                return;
              }
              setIsAddPurchaseModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 border-0"
          >
            <ShoppingBag size={14} />
            <span>Lançar Compra / Estoque</span>
          </button>
        </div>
      </div>

      {/* KPI Stats widgets grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg shrink-0">
            <Users size={18} />
          </div>
          <div className="text-left leading-normal min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-medium">Fornecedores Parceiros</span>
            <span className="text-lg font-black text-slate-850 block">{stats.suppliersCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="p-2.5 bg-pink-50 text-pink-600 rounded-lg shrink-0">
            <ShoppingBag size={18} />
          </div>
          <div className="text-left leading-normal min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-medium">Compras Realizadas</span>
            <span className="text-lg font-black text-slate-850 block">{stats.purchasesCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <DollarSign size={18} />
          </div>
          <div className="text-left leading-normal min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-medium">Total Investido (Custo)</span>
            <span className="text-lg font-black text-emerald-600 block">{formatCurrency(stats.totalSpent)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <Clock size={18} className="animate-spin duration-3000" />
          </div>
          <div className="text-left leading-normal min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-medium">Remessas Pendentes</span>
            <span className="text-lg font-black text-amber-600 block">{stats.pendingCount}</span>
          </div>
        </div>
      </div>

      {/* Main interactive Tab controller */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2">
          <button
            onClick={() => setActiveSubTab('fornecedores')}
            className={`px-4 py-2 text-xs font-extrabold tracking-wide uppercase transition rounded-lg cursor-pointer flex items-center gap-2 border-0
              ${activeSubTab === 'fornecedores' 
                ? 'bg-white text-pink-600 shadow-xs border-b-2 border-pink-500/80' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-150/40'}`}
          >
            <Building2 size={13} />
            <span>Lista de Fornecedores</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('compras')}
            className={`px-4 py-2 text-xs font-extrabold tracking-wide uppercase transition rounded-lg cursor-pointer flex items-center gap-2 border-0
              ${activeSubTab === 'compras' 
                ? 'bg-white text-pink-600 shadow-xs border-b-2 border-pink-500/80' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-150/40'}`}
          >
            <Truck size={13} />
            <span>Suprimentos & Compras</span>
          </button>
        </div>

        <div className="p-5">
          {/* TAB 1: LIST OF SUPPLIERS */}
          {activeSubTab === 'fornecedores' && (
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CNPJ, categoria..."
                    value={supSearchTerm}
                    onChange={(e) => setSupSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-pink-500 transition-all font-sans"
                  />
                </div>
                <div className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                  Listando {filteredSuppliers.length} de {suppliers.length} cadastrados
                </div>
              </div>

              {filteredSuppliers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredSuppliers.map((sup) => {
                    const linkedPurchases = purchases.filter(p => p.supplierId === sup.id);
                    const totalPurchasedValue = linkedPurchases.reduce((sum, p) => sum + p.totalCost, 0);

                    return (
                      <div 
                        key={sup.id} 
                        className="bg-white border border-slate-100 rounded-xl p-4.5 hover:shadow-xs hover:border-slate-200 transition-all space-y-4"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-extrabold tracking-wider rounded-md uppercase">
                              {sup.category || 'Outros'}
                            </span>
                            <h3 className="font-extrabold text-xs text-slate-800 leading-snug">{sup.name}</h3>
                            {sup.cnpj && <p className="text-[9px] font-mono font-medium text-slate-450 uppercase leading-none">CNPJ: {sup.cnpj}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSupplier(sup.id)}
                            className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition-colors border-0 cursor-pointer outline-none"
                            title="Remover Fornecedor"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="border-t border-slate-50 pt-3 text-[10px] space-y-2">
                          {sup.contactName && (
                            <div className="flex items-center gap-2 text-slate-500">
                              <span className="font-bold text-slate-400 uppercase text-[8px] tracking-wider w-16">Contato:</span>
                              <span className="font-semibold text-slate-700">{sup.contactName}</span>
                            </div>
                          )}
                          {sup.phone && (
                            <div className="flex items-center gap-2 text-slate-500">
                              <span className="font-bold text-slate-400 uppercase text-[8px] tracking-wider w-16 flex items-center gap-1">
                                <Phone size={9} /> Fone:
                              </span>
                              <a href={`https://wa.me/${sup.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="font-mono text-pink-600 hover:underline">
                                {sup.phone}
                              </a>
                            </div>
                          )}
                          {sup.email && (
                            <div className="flex items-center gap-2 text-slate-500">
                              <span className="font-bold text-slate-400 uppercase text-[8px] tracking-wider w-16 flex items-center gap-1">
                                <Mail size={9} /> Email:
                              </span>
                              <span className="font-mono truncate text-slate-600">{sup.email}</span>
                            </div>
                          )}
                        </div>

                        {sup.notes && (
                          <div className="bg-slate-50/60 p-2 text-[9.5px] text-slate-500 border border-slate-100 rounded-lg">
                            <span className="font-bold block uppercase text-[7.5px] text-slate-400 tracking-wider mb-0.5">Observações:</span>
                            {sup.notes}
                          </div>
                        )}

                        <div className="bg-pink-50/30 border border-pink-100/50 rounded-xl p-2.5 flex justify-between items-center text-[10px]">
                          <div>
                            <span className="block text-[8px] text-slate-400 uppercase font-mono leading-none">Histórico de Pedidos</span>
                            <span className="font-black text-slate-750 block mt-0.5">{linkedPurchases.length} compras</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-[8px] text-slate-400 uppercase font-mono leading-none">Total Faturado</span>
                            <span className="font-black text-pink-600 block mt-0.5">{formatCurrency(totalPurchasedValue)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30 text-center">
                  <Building2 size={36} className="text-slate-300 mx-auto mb-2.5" />
                  <p className="text-slate-500 text-xs font-semibold">Nenhum fornecedor encontrado no sistema</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">Cadastre seus parceiros para poder vincular faturas e compras de peças.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SYSTEM PURCHASES HISTORY & UPDATES STOCK */}
          {activeSubTab === 'compras' && (
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome do produto, fornecedor ou observação..."
                    value={purSearchTerm}
                    onChange={(e) => setPurSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-pink-500 transition-all font-sans"
                  />
                </div>
                <div className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                  Listando {filteredPurchases.length} de {purchases.length} faturas lançadas
                </div>
              </div>

              {filteredPurchases.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse font-sans">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                        <th className="p-3">Data Compra</th>
                        <th className="p-3">Fornecedor</th>
                        <th className="p-3">Peça / Produto Cadastrado</th>
                        <th className="p-3 text-center">Qtd</th>
                        <th className="p-3 text-right">Preço Custo Un.</th>
                        <th className="p-3 text-right">Total Pedido</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3">Obs</th>
                        <th className="p-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-700">
                      {filteredPurchases.map((pur) => {
                        const sup = suppliers.find(s => s.id === pur.supplierId);
                        
                        return (
                          <tr key={pur.id} className="hover:bg-slate-50/50">
                            <td className="p-3 whitespace-nowrap font-mono text-[10px]">
                              {pur.purchaseDate}
                            </td>
                            <td className="p-3">
                              <span className="font-extrabold text-slate-800 block text-[11px]">
                                {sup?.name || "Fornecedor Excluído"}
                              </span>
                              <span className="text-[9px] text-slate-400 uppercase font-mono">{sup?.category}</span>
                            </td>
                            <td className="p-3 font-extrabold text-slate-800">
                              {pur.productName}
                            </td>
                            <td className="p-3 text-center font-mono">
                              {pur.quantity} un
                            </td>
                            <td className="p-3 text-right font-mono text-slate-650">
                              {formatCurrency(pur.unitCost)}
                            </td>
                            <td className="p-3 text-right font-mono font-extrabold text-pink-600">
                              {formatCurrency(pur.totalCost)}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase
                                ${pur.status === 'Recebido' 
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                  : pur.status === 'A Caminho' 
                                    ? 'bg-pink-50 text-pink-600 border border-pink-100' 
                                    : 'bg-amber-50 text-amber-600 border border-amber-100'}`}
                              >
                                {pur.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 max-w-xs truncate text-[10px]" title={pur.notes}>
                              {pur.notes || '-'}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => startEditPurchase(pur)}
                                  className="p-1 text-slate-450 hover:text-slate-800 transition-colors cursor-pointer"
                                  title="Editar Lançamento"
                                >
                                  <Edit size={12} className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePurchase(pur.id)}
                                  className="p-1 text-slate-450 hover:text-red-650 transition-colors cursor-pointer"
                                  title="Excluir Lançamento"
                                >
                                  <Trash2 size={12} className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30 text-center">
                  <Truck size={36} className="text-slate-300 mx-auto mb-2.5" />
                  <p className="text-slate-500 text-xs font-semibold">Nenhuma compra de peças cadastrada</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">Lance um novo estoque selecionando produtos cadastrados e fornecedores da marca.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD NEW SUPPLIER (FORNECEDOR) */}
      {isAddSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-lg overflow-hidden animate-in fade-in duration-200 text-left">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-pink-500 animate-pulse" />
                <span className="font-extrabold text-xs uppercase tracking-wider">Novo Fornecedor / Fabricante</span>
              </div>
              <button 
                onClick={() => setIsAddSupplierModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold uppercase text-[9px] bg-transparent border-none cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="p-5 space-y-3 font-sans">
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Nome / Razão Social *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Brás Tecidos Atacado Ltda"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">CNPJ do Fornecedor</label>
                  <input 
                    type="text"
                    placeholder="Ex: 00.000.000/0001-00"
                    value={supCnpj}
                    onChange={(e) => setSupCnpj(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Categoria / Segmento</label>
                  <select
                    value={supCategory}
                    onChange={(e) => setSupCategory(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 cursor-pointer text-slate-700"
                  >
                    <option value="Tecidos & Malhas">Tecidos & Malhas</option>
                    <option value="Faccionista / Fitness">Faccionista / Fitness</option>
                    <option value="Aviamentos">Aviamentos</option>
                    <option value="Embalagens">Embalagens</option>
                    <option value="Serviços / Fretes">Serviços / Fretes</option>
                    <option value="Marketing / Tags">Marketing / Tags</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex flex-col gap-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Dados de Contato</span>
                
                <div>
                  <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Nome de Contato Comercial</label>
                  <input 
                    type="text"
                    placeholder="Ex: João Vendedor"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">WhatsApp / Fone comercial</label>
                    <input 
                      type="text"
                      placeholder="Ex: (11) 99999-9999"
                      value={supPhone}
                      onChange={(e) => setSupPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Email Comercial</label>
                    <input 
                      type="email"
                      placeholder="vendas@fornecedor.com"
                      value={supEmail}
                      onChange={(e) => setSupEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Observações Adicionais</label>
                <textarea 
                  rows={2}
                  placeholder="Instruções de envio, prazos de faturamento..."
                  value={supNotes}
                  onChange={(e) => setSupNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 font-sans"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-550 border border-slate-200 rounded-lg font-bold text-[11px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-extrabold text-[11px] uppercase tracking-wide cursor-pointer border-0 shadow-sm"
                >
                  Cadastrar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW PRODUCT PURCHASE (VINCULAR COPRAS/ESTOQUE) */}
      {isAddPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-lg overflow-hidden animate-in fade-in duration-200 text-left">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-pink-500 animate-pulse" />
                <span className="font-extrabold text-xs uppercase tracking-wider">Lançar Compra / Suprimentos</span>
              </div>
              <button 
                onClick={() => setIsAddPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold uppercase text-[9px] bg-transparent border-none cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleAddPurchaseSubmit} className="p-5 space-y-3 font-sans">
              
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Selecionar Fornecedor Responsável *</label>
                <select
                  required
                  value={purSupplierId}
                  onChange={(e) => setPurSupplierId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 cursor-pointer text-slate-700"
                >
                  <option value="">-- Selecione um Fornecedor Comercial --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Vincular Peça / Produto do Catálogo *</label>
                <select
                  required
                  value={purProductId}
                  onChange={(e) => setPurProductId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 cursor-pointer text-slate-700"
                >
                  <option value="">-- Selecione a Peça no Catálogo --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - SKU: {p.sku} (Estoque atual: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Quantidade Comprada *</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    placeholder="Quantidade comprada"
                    value={purQty}
                    onChange={(e) => setPurQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Preço Unitário de Custo (R$) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    placeholder="Preço de custo unitário"
                    value={purUnitCost}
                    onChange={(e) => setPurUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Data da Operação</label>
                  <input 
                    type="date"
                    value={purDate}
                    onChange={(e) => setPurDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Status de Transporte / Recebimento</label>
                  <select
                    value={purStatus}
                    onChange={(e) => setPurStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 cursor-pointer text-slate-700 font-bold"
                  >
                    <option value="Recebido">Recebido (Incrementa Estoque Imediato) ✅</option>
                    <option value="A Caminho">A Caminho (Aguarda Recebimento) 🚚</option>
                    <option value="Pendente">Pendente / Em Produção ⏳</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes variables */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <input 
                    id="checkbox-finance"
                    type="checkbox"
                    checked={linkToFinance}
                    onChange={(e) => setLinkToFinance(e.target.checked)}
                    className="mt-0.5 rounded-sm outline-none text-pink-600 focus:ring-0 cursor-pointer"
                  />
                  <div className="leading-tight">
                    <label htmlFor="checkbox-finance" className="font-extrabold text-[10.5px] text-slate-750 block cursor-pointer select-none">Vincular e Abater Financeiro</label>
                    <span className="text-[9px] text-slate-400 block font-normal">Ao ativar, lançará um Outflow (Saída) de caixa no valor de <strong>{formatCurrency(purQty * purUnitCost)}</strong> automaticamente.</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Notas Fiscal / Observação</label>
                <input 
                  type="text"
                  placeholder="Ex: ref NF 1029 e-invoice. Tecido Suplex Amaciado Extra..."
                  value={purNotes}
                  onChange={(e) => setPurNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddPurchaseModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-550 border border-slate-200 rounded-lg font-bold text-[11px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-extrabold text-[11px] uppercase tracking-wide cursor-pointer border-0 shadow-sm"
                >
                  Lançar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT PURCHASE (COMPRA) */}
      {editingPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-lg overflow-hidden animate-in fade-in duration-200 text-left font-sans text-xs">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-pink-500" />
                <span className="font-extrabold text-xs uppercase tracking-wider">Editar Compra de Suprimentos</span>
              </div>
              <button 
                type="button"
                onClick={() => setEditingPurchase(null)}
                className="text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSavePurchaseEdit} className="p-4 space-y-3">
              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Fornecedor *</label>
                <select
                  required
                  value={editPurSupplierId}
                  onChange={(e) => setEditPurSupplierId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 cursor-pointer text-slate-700 font-bold"
                >
                  <option value="">Selecione o fabricante...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Produto Cadastrado *</label>
                <select
                  required
                  value={editPurProductId}
                  onChange={(e) => setEditPurProductId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 cursor-pointer text-slate-700 font-bold"
                >
                  <option value="">Selecione a mercadoria...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Ref: {p.sku || p.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5 font-sans">Quantidade Comprada *</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={editPurQty}
                    onChange={(e) => setEditPurQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5 font-sans">Preço Custo Un. (R$) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={editPurUnitCost}
                    onChange={(e) => setEditPurUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-sans">
                <div>
                  <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Data Compra</label>
                  <input 
                    type="date"
                    value={editPurDate}
                    onChange={(e) => setEditPurDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5">Status</label>
                  <select
                    value={editPurStatus}
                    onChange={(e) => setEditPurStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500 cursor-pointer text-slate-700 font-bold"
                  >
                    <option value="Recebido">Recebido</option>
                    <option value="A Caminho">A Caminho</option>
                    <option value="Pendente">Pendente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold text-[8px] uppercase block tracking-wider mb-0.5 font-sans">Observação</label>
                <input 
                  type="text"
                  value={editPurNotes}
                  onChange={(e) => setEditPurNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-pink-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5 font-sans">
                <button
                  type="button"
                  onClick={() => setEditingPurchase(null)}
                  className="px-4 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-550 border border-slate-200 rounded-lg font-bold text-[11px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-extrabold text-[11px] uppercase tracking-wide cursor-pointer border-0"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
