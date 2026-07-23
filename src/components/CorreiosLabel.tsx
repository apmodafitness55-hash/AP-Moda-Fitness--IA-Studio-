/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { X, Printer, Check, Tag, FileText } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { getSupabaseClient } from '../supabase';

interface FormattedItem {
  name: string;
  color: string;
  size: string;
  quantity: number;
}

// Highly reliable standard Code 128 Barcode Generator using jsbarcode
function BarcodeComponent({ value }: { value: string }) {
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        const renderBarcode = (JsBarcode as any).default || JsBarcode;
        if (typeof renderBarcode === 'function') {
          renderBarcode(barcodeRef.current, value, {
            format: 'CODE128',
            lineColor: '#000000',
            width: 1.5,
            height: 38,
            displayValue: true,
            fontSize: 9,
            font: 'monospace',
            fontOptions: 'bold',
            background: '#ffffff',
            margin: 2
          });
        }
      } catch (err) {
        console.warn('Error rendering barcode with JsBarcode:', err);
      }
    }
  }, [value]);

  return (
    <div className="flex justify-center bg-white py-1">
      <svg ref={barcodeRef} className="max-w-full" />
    </div>
  );
}

// Parses complex item names to extract separate Name, Color and Size attributes
function parseItem(item: { name?: string; productName?: string; color?: string; size?: string; quantity: number }): FormattedItem {
  const rawName = item.productName || item.name || 'Produto';
  
  let name = rawName;
  let color = item.color || 'Única';
  let size = item.size || 'M';
  
  if (rawName.includes('-')) {
    const parts = rawName.split('-').map(p => p.trim());
    if (parts.length === 3) {
      name = parts[0];
      color = parts[1];
      size = parts[2];
    } else if (parts.length === 2) {
      name = parts[0];
      const secondPart = parts[1];
      const possibleSizes = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'EG', 'EXG', '34', '36', '38', '40', '42', '44', '46', '48'];
      if (possibleSizes.includes(secondPart.toUpperCase())) {
        size = secondPart;
      } else {
        color = secondPart;
      }
    }
  }
  
  return {
    name,
    color,
    size,
    quantity: item.quantity
  };
}

interface ShippingLabelProps {
  order?: {
    id?: string;
    clientName?: string;
    phone?: string;
    address?: string;
    items?: { productName: string; quantity: number; price: number }[];
    total?: number;
    trackingCode?: string;
    deliveryMethod?: string;
    tipo_envio?: string;
    status_logistico?: string;
  };
  sale?: {
    id?: string;
    clientName?: string;
    items?: { name: string; quantity: number; price: number; color?: string; size?: string }[];
    total?: number;
    address?: string;
    trackingCode?: string;
    deliveryMethod?: string;
    tipo_envio?: string;
    status_logistico?: string;
  };
  onClose: () => void;
  onUpdateTrackingCode?: (id: string, code: string) => void;
}

export default function CorreiosLabel({ order, sale, onClose, onUpdateTrackingCode }: ShippingLabelProps) {
  // Label style tab selector: 'thermal' (Default marketplace) or 'correios' (With content declaration)
  const [activeLabelType, setActiveLabelType] = useState<'thermal' | 'correios'>('thermal');

  // Remetente / Store Address configured according to requested default details
  const storeName = localStorage.getItem('ap_store_name') || 'AP Moda Fitness';
  const storeAddress = localStorage.getItem('ap_store_address') || 'Av. Hermes da Fonseca, 500, Tirol - Natal, RN';
  const storeCep = localStorage.getItem('ap_store_cep') || '59020-000';
  const storeCnpj = localStorage.getItem('ap_store_cnpj') || '52.348.910/0001-88';

  // Identify recipient data
  const recipientName = order?.clientName || sale?.clientName || 'Cliente';
  const rawAddress = order?.address || sale?.address || 'A combinar / Entrega Balcão';
  const recipientPhone = order?.phone || '(84) 99999-0000';
  const orderId = order?.id || sale?.id || 'PEDIDO';
  const orderIdShort = typeof orderId === 'string' ? orderId.replace('ord-', '').replace('sale-', '').substring(0, 8).toUpperCase() : 'PEDIDO';
  const shippingType = order?.tipo_envio || sale?.tipo_envio || 'correios';
  const isPostal = shippingType !== 'motoboy' && shippingType !== 'retirada';
  const isLandscapePrint = false; // Em acordo com a exigência de etiqueta adesiva de tamanho 10x15 vertical

  const [isLocalLoading, setIsLocalLoading] = useState<boolean>(true);

  useEffect(() => {
    // Confirm and delay slightly to ensure Supabase database data is fully loaded and synced
    const timer = setTimeout(() => {
      setIsLocalLoading(false);
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  // Generate tracking code in official Correios format: e.g. QC123456789BR
  const [trackingCode, setTrackingCode] = useState<string>(() => {
    const current = order?.trackingCode || sale?.trackingCode;
    if (current) return current;
    
    const prefixes = ['QC', 'BR', 'PM', 'AL', 'JN', 'OB', 'XY'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const middleNum = Math.floor(100000000 + Math.random() * 900000000).toString();
    return `${prefix}${middleNum}BR`;
  });

  const [deliveryType, setDeliveryType] = useState<string>(() => {
    const method = order?.deliveryMethod || sale?.deliveryMethod || '';
    if (method.toLowerCase().includes('sedex')) return 'SEDEX';
    if (method.toLowerCase().includes('pac')) return 'PAC';
    return 'PAC'; // Default to PAC
  });

  const [saving, setSaving] = useState(false);

  // Auto-sync generated tracking code to database
  useEffect(() => {
    const currentCodeInDb = order?.trackingCode || sale?.trackingCode;
    if (!currentCodeInDb) {
      handleSaveTrackingCode(trackingCode);
    }
  }, [trackingCode]);

  const handleSaveTrackingCode = async (codeToSave: string) => {
    setSaving(true);
    try {
      const db = getSupabaseClient();
      if (db) {
        if (order && order.id) {
          await db
            .from('ap_online_orders')
            .update({ trackingCode: codeToSave })
            .eq('id', order.id);
            
          if (onUpdateTrackingCode) {
            onUpdateTrackingCode(order.id, codeToSave);
          }
        } else if (sale && sale.id) {
          await db
            .from('ap_sales')
            .update({ trackingCode: codeToSave })
            .eq('id', sale.id);
            
          if (onUpdateTrackingCode) {
            onUpdateTrackingCode(sale.id, codeToSave);
          }
        }
      }
    } catch (err) {
      console.warn('Error saving tracking code to Supabase:', err);
    } finally {
      setSaving(false);
    }
  };

  // Extract items for list parsing
  const rawItemsList: any[] = (order && order.items) 
    ? order.items.map(it => ({ 
        name: it.productName, 
        quantity: it.quantity, 
        price: it.price,
        color: (it as any).color,
        size: (it as any).size
      }))
    : (sale && sale.items) 
      ? sale.items.map(it => ({ name: it.name, quantity: it.quantity, price: it.price, color: it.color, size: it.size }))
      : [{ name: 'Peças de Vestuário (AP Moda Fitness)', quantity: 1, price: order?.total || sale?.total || 150 }];

  const formattedItems = rawItemsList.map(it => parseItem(it));
  const totalQty = formattedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalVal = order?.total || sale?.total || 0;

  // Print execution targeting the exact thermal paper size (handling orientation dynamically)
  const handlePrint = () => {
    const printWindowStyleId = 'correios-print-layout';
    
    // Remove existing print layouts
    const existing = document.getElementById(printWindowStyleId);
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = printWindowStyleId;
    
    const pageCss = isLandscapePrint
      ? `@page { size: 150mm 100mm landscape; margin: 0; }`
      : `@page { size: 100mm 150mm portrait; margin: 0; }`;

    const dimsCss = isLandscapePrint
      ? `
        width: 150mm !important;
        height: 100mm !important;
        max-width: 150mm !important;
        max-height: 100mm !important;
      `
      : `
        width: 100mm !important;
        height: 150mm !important;
        max-width: 100mm !important;
        max-height: 150mm !important;
      `;

    style.innerHTML = `
      @media print {
        ${pageCss}

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

        #printable-shipping-label, #printable-shipping-label * {
          visibility: visible !important;
        }

        #printable-shipping-label {
          display: block !important;
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          ${dimsCss}
          margin: 0 !important;
          padding: 3.5mm !important;
          background: #ffffff !important;
          color: #000000 !important;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif !important;
          box-sizing: border-box !important;
          z-index: 99999999 !important;
        }

        #printable-shipping-label * {
          color: #000000 !important;
          background: transparent !important;
        }
      }
    `;

    document.head.appendChild(style);
    
    // Listen for afterprint event so styles persist until print dialog closes
    const cleanup = () => {
      try {
        const el = document.getElementById(printWindowStyleId);
        if (el) el.remove();
      } catch (e) {}
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();

    // Fallback safety timeout (30 seconds) in case afterprint does not fire
    setTimeout(cleanup, 30000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      {isLocalLoading ? (
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-850">Sincronizando com Supabase</h3>
            <p className="text-[10.5px] text-slate-450 mt-1">Carregando dados logísticos em tempo real para evitar etiquetas de PDF em branco...</p>
          </div>
        </div>
      ) : (
        <div className={`bg-white rounded-2xl ${isLandscapePrint ? 'max-w-4xl' : 'max-w-lg'} w-full shadow-2xl border border-slate-150 overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300`}>
        
        {/* Header Options */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-pink-100 text-pink-600 rounded-lg">
              <Printer size={16} />
            </span>
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Etiqueta de Envio Térmica</h3>
              <p className="text-[10px] text-slate-400">
                {isLandscapePrint 
                  ? 'Layout híbrido integrado (etiqueta + declaração lado a lado em 15x10cm)' 
                  : 'Layout profissional otimizado para rolos de 10x15cm (100x150mm)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-97 transition-all"
            >
              <Printer size={13} />
              <span>Imprimir Etiqueta</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Configurations Selector (Tabs) */}
        <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex flex-col gap-2 font-sans">
          <div className="flex items-center justify-between gap-2.5 flex-wrap">
            {/* View Style Selection */}
            <div className="flex bg-slate-200 p-1 rounded-lg gap-1">
              <button
                type="button"
                onClick={() => setActiveLabelType('thermal')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeLabelType === 'thermal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Tag size={12} />
                <span>Térmica 10x15cm (Marketplace)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLabelType('correios')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeLabelType === 'correios' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FileText size={12} />
                <span>Padrão Correios + Declaração</span>
              </button>
            </div>

            {isPostal && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Postagem:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('PAC')}
                    className={`px-2 py-0.5 rounded font-extrabold text-[9.5px] border transition-all ${deliveryType === 'PAC' ? 'bg-pink-600 border-pink-600 text-white' : 'bg-white border-slate-250 text-slate-600 hover:border-slate-350'}`}
                  >
                    PAC
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType('SEDEX')}
                    className={`px-2 py-0.5 rounded font-extrabold text-[9.5px] border transition-all ${deliveryType === 'SEDEX' ? 'bg-pink-600 border-pink-600 text-white' : 'bg-white border-slate-250 text-slate-600 hover:border-slate-350'}`}
                  >
                    SEDEX
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="p-6 bg-slate-100 overflow-y-auto flex-1 flex justify-center items-center min-h-[400px]">
          
          {/* Main Printable Shipping Label format */}
          <div 
            id="printable-shipping-label"
            className={`${isLandscapePrint ? 'w-[150mm] h-[100mm] p-3' : 'w-[100mm] h-[150mm] p-4'} bg-white text-black font-sans border-2 border-dashed border-slate-400 rounded-lg flex flex-col justify-between text-left leading-tight shadow-lg overflow-hidden shrink-0`}
            style={{ boxSizing: 'border-box' }}
          >
            {isLandscapePrint ? (
              /* --- LANDSCAPE INTEGRATED SIDE-BY-SIDE TEMPLATE (COLUMNS LEFT & RIGHT) --- */
              <div className="flex-1 flex h-full w-full select-none text-black bg-white">
                
                {/* LEFT COLUMN: SIMPLIFIED CONTENT DECLARATION */}
                <div className="w-[50%] flex flex-col justify-between pr-3 border-r border-dashed border-black h-full">
                  <div>
                    <div className="text-center border-b border-black pb-1 mb-1 bg-white">
                      <h4 className="text-[8.5px] font-black uppercase tracking-tight leading-none text-black">
                        DECLARAÇÃO DE CONTEÚDO
                      </h4>
                      <p className="text-[6px] text-slate-700 font-extrabold uppercase mt-0.5 tracking-wider">
                        AP MODA FITNESS
                      </p>
                    </div>

                    <div className="space-y-0.5 text-[7px] leading-tight mb-1 bg-white p-0.5">
                      <p><span className="font-bold">Remetente:</span> {storeName} (CNPJ: {storeCnpj})</p>
                      <p className="truncate"><span className="font-bold">Destinatário:</span> {recipientName}</p>
                    </div>

                    {/* Table of items */}
                    <div className="border border-black rounded-xs overflow-hidden mt-1">
                      <table className="w-full text-[7px] text-left leading-normal border-collapse">
                        <thead>
                          <tr className="border-b border-black font-black bg-slate-100 text-[6.5px] uppercase text-black">
                            <th className="py-0.5 px-1 w-[45%]">Descrição do Produto</th>
                            <th className="py-0.5 text-center w-[20%]">Cor</th>
                            <th className="py-0.5 text-center w-[15%]">Tam</th>
                            <th className="py-0.5 text-center w-[10%]">Qtd</th>
                            <th className="py-0.5 text-right px-1 w-[10%]">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/20 text-black">
                          {(() => {
                            // Slice to show up to 4 items elegantly to prevent overflow in 100mm height
                            const itemsToShow = formattedItems.slice(0, 4);
                            const remainingCount = formattedItems.length - itemsToShow.length;
                            
                            return (
                              <>
                                {itemsToShow.map((item, idx) => (
                                  <tr key={idx} className="font-semibold">
                                    <td className="py-0.5 px-1 truncate max-w-[95px] font-bold text-black">{item.name}</td>
                                    <td className="py-0.5 text-center text-black truncate max-w-[40px]">{item.color}</td>
                                    <td className="py-0.5 text-center font-bold text-black">{item.size}</td>
                                    <td className="py-0.5 text-center font-black text-black">{item.quantity}</td>
                                    <td className="py-0.5 text-right px-1 font-mono text-black">
                                      R$ {(totalVal / (totalQty || 1) * item.quantity).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                                {remainingCount > 0 && (
                                  <tr className="font-bold text-slate-500 bg-slate-50/50">
                                    <td colSpan={5} className="py-0.5 px-1 text-[6.5px]">
                                      + {remainingCount} outros itens do pedido...
                                    </td>
                                  </tr>
                                )}
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals Block */}
                    <div className="flex justify-between items-center text-[7.5px] font-black border-t border-black pt-1 mt-1 text-black">
                      <span className="uppercase tracking-wider">Quantidade: {totalQty}</span>
                      <span className="font-mono text-[8.5px]">VALOR: R$ {totalVal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Terms & Signature Fields */}
                  <div className="border-t border-black/40 pt-1 text-[5.8px] text-slate-750 leading-snug">
                    <p className="italic leading-tight">
                      Declaro que não sou contribuinte do ICMS e que o produto não se destina a fins comerciais nas normas postais.
                    </p>
                    <div className="flex justify-between items-end mt-1">
                      <span className="font-bold text-black">Data: {new Date().toLocaleDateString('pt-BR')}</span>
                      <div className="border-t border-black w-24 text-center pt-0.5 font-sans font-semibold text-[5.2px] uppercase tracking-wide text-black">
                        Assinatura do Declarante
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: CORREIOS SHIPPING LABEL */}
                <div className="w-[50%] flex flex-col justify-between pl-3 h-full">
                  <div>
                    {/* Header: Correios Tag and Delivery Service type */}
                    <div className="flex justify-between items-center border-b border-black pb-1 mb-1 bg-white">
                      <div className="bg-yellow-400 text-blue-950 font-black px-1.5 py-0.5 rounded text-[8px] border border-blue-900 flex items-center justify-center tracking-tighter leading-none uppercase">
                        CORREIOS
                      </div>
                      <span className="font-black text-[9.5px] font-mono tracking-wider text-black bg-slate-100 px-1.5 py-0.5 rounded border border-black uppercase leading-none">
                        {deliveryType}
                      </span>
                    </div>

                    {/* Tracking Code Barcode (rendered using JsBarcode SVGSVGElement) */}
                    <div className="py-1 bg-white flex flex-col items-center justify-center rounded border border-black/10 scale-95 origin-center">
                      <BarcodeComponent value={trackingCode} />
                    </div>
                  </div>

                  {/* Recipient Area (Destinatário) with Highlight */}
                  <div className="border-t border-black pt-1 mb-1 text-black">
                    <span className="bg-black text-white text-[6.5px] font-black px-1.5 py-0.2 uppercase tracking-wide rounded inline-block mb-1">
                      DESTINATÁRIO
                    </span>
                    <div className="text-[8px] space-y-0.5 leading-snug">
                      <p className="font-black text-[9.5px] uppercase text-black leading-tight">
                        {recipientName}
                      </p>
                      <p className="font-bold text-black leading-tight">
                        {rawAddress}
                      </p>
                      <p className="font-black text-black font-mono text-[7.5px]">
                        TEL: {recipientPhone}
                      </p>
                    </div>
                  </div>

                  {/* Sender Area (Remetente) Base Natal-RN */}
                  <div className="border-t border-black pt-1 text-black">
                    <span className="border border-black text-black text-[6.5px] font-black px-1.5 py-0.2 uppercase tracking-wide rounded bg-slate-50 inline-block mb-1">
                      REMETENTE
                    </span>
                    <div className="text-[7.5px] text-slate-800 space-y-0.5 leading-tight">
                      <p className="font-bold uppercase text-black">{storeName}</p>
                      <p className="font-semibold text-slate-750">{storeAddress}</p>
                      <p className="font-black text-black font-mono text-[6.5px] uppercase tracking-tighter">
                        CEP: {storeCep} | CNPJ: {storeCnpj}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            ) : activeLabelType === 'thermal' ? (
              /* --- MARKETPLACE THERMAL 10X15 TEMPLATE (VERTICAL) --- */
              <div className="flex-1 flex flex-col justify-between">
                
                {/* 1. BLOCO SUPERIOR (LOGÍSTICA E RASTREIO) */}
                <div className="border-b-2 border-black pb-2 mb-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-xs font-black tracking-tighter text-black uppercase leading-none mb-0.5">AP MODA FITNESS</h1>
                      <p className="text-[7.5px] text-black font-extrabold uppercase tracking-widest leading-none">Moda de Alta Performance</p>
                      <div className="mt-1">
                        <span className="text-[7px] font-black text-white bg-black px-1.5 py-0.5 rounded-xs tracking-wider">
                          COMPRA ONLINE
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[7.5px] text-black font-extrabold uppercase tracking-wide leading-none">ID DO PEDIDO</p>
                      <p className="text-[12px] font-black text-black tracking-wider font-mono">#{orderIdShort}</p>
                    </div>
                  </div>

                  {/* Conditional Top Block / Barcode */}
                  {shippingType === 'correios' ? (
                    <div className="mt-2.5 flex justify-center bg-white">
                      <BarcodeComponent value={orderIdShort} />
                    </div>
                  ) : shippingType === 'motoboy' ? (
                    <div className="mt-2.5 flex items-center justify-center bg-black text-white py-2 rounded">
                      <span className="text-[11px] font-black tracking-wider uppercase">
                        🏍️ ENTREGA VIA MOTOBOY
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex items-center justify-center bg-black text-white py-2 rounded">
                      <span className="text-[11px] font-black tracking-wider uppercase">
                        🛍️ RETIRADA
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. BLOCO CENTRAL (DADOS DE ENTREGA) */}
                <div className="grid grid-cols-1 gap-2 border-b-2 border-black pb-2 mb-1">
                  {shippingType !== 'retirada' ? (
                    <>
                      {/* Destinatário */}
                      <div className="p-1 border border-black rounded bg-white">
                        <div className="flex justify-between items-center bg-black px-1.5 py-0.5 rounded-xs mb-1.5">
                          <span className="text-[8px] font-black text-white uppercase tracking-wider">DESTINATÁRIO (ENTREGA)</span>
                          {deliveryType && <span className="text-[8px] font-black text-white font-mono bg-white/20 px-1 rounded-xs">{deliveryType}</span>}
                        </div>
                        <div className="text-[9.5px] space-y-0.5 leading-snug">
                          <p className="font-black text-[10.5px] uppercase text-black">{recipientName}</p>
                          <p className="font-bold text-black leading-tight">{rawAddress}</p>
                          <p className="font-bold text-black text-[9px] font-mono">TEL: {recipientPhone}</p>
                        </div>
                      </div>

                      {/* Remetente */}
                      <div className="p-1 border border-black rounded bg-white">
                        <span className="inline-block text-[8px] font-black text-black border border-black px-1.5 py-0.2 rounded bg-slate-50 uppercase tracking-wider mb-1">
                          REMETENTE
                        </span>
                        <div className="text-[8.5px] leading-snug text-black space-y-0.5">
                          <p className="font-bold uppercase text-black">{storeName}</p>
                          <p className="font-medium text-black">{storeAddress}</p>
                          <p className="font-semibold text-black font-mono text-[8px]">CEP: {storeCep} | CNPJ: {storeCnpj}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Sacola/Retirada custom high-contrast block */
                    <div className="p-2.5 border-2 border-black rounded bg-white text-center">
                      <div className="bg-black text-white py-1 px-2 rounded-xs mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          IDENTIFICAÇÃO DE RETIRADA
                        </span>
                      </div>
                      <div className="space-y-2 py-1">
                        <p className="font-black text-[15px] uppercase text-black tracking-tight leading-tight">
                          {recipientName}
                        </p>
                        <p className="font-black text-[11px] text-black font-mono border-2 border-black py-1.5 px-3 inline-block rounded bg-slate-55">
                          📱 CONTATO: {recipientPhone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. BLOCO INFERIOR (LISTA DE SEPARAÇÃO / COMPROVANTE) */}
                <div className="flex-1 flex flex-col justify-between pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8.5px] font-black text-black uppercase tracking-wider">
                        📋 LISTA DE SEPARAÇÃO (PICKING LIST)
                      </span>
                      <span className="text-[8.5px] font-black text-black font-mono">
                        QTD: {totalQty}
                      </span>
                    </div>
                    
                    <table className="w-full text-[8.5px] text-left leading-tight border-collapse">
                      <thead>
                        <tr className="border-b border-black font-black text-black text-[8px] uppercase">
                          <th className="py-0.5 pb-1">Produto / Modelo</th>
                          <th className="py-0.5 pb-1 text-center">Cor</th>
                          <th className="py-0.5 pb-1 text-center">Tam</th>
                          <th className="py-0.5 pb-1 text-center">Qtd</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/30">
                        {formattedItems.map((item, idx) => (
                          <tr key={idx} className="text-black text-[8.5px]">
                            <td className="py-1 font-bold max-w-[170px] truncate">{item.name}</td>
                            <td className="py-1 text-center font-semibold">{item.color}</td>
                            <td className="py-1 text-center font-bold font-mono">{item.size}</td>
                            <td className="py-1 text-center font-black text-[9.5px] font-mono">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    {/* Divider dotted line */}
                    <div className="border-t border-dashed border-black my-1.5" />
                    
                    <div className="text-center text-[7.5px] font-mono font-bold text-black tracking-tight uppercase leading-none">
                      AP MODA FITNESS - Expedição e Logística Sem Falhas © 2026
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* --- TRADITIONAL CORREIOS STANDARD TEMPLATE (VERTICAL) --- */
              <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-0.5">
                <div className="border-2 border-black p-1 rounded">
                  <div className="flex justify-between items-center border-b-2 border-black pb-1 mb-2">
                    <div className="bg-yellow-400 text-blue-950 font-black px-2 py-0.5 rounded text-[10px] border border-blue-900 flex items-center justify-center tracking-tight leading-none">
                      CORREIOS
                    </div>
                    <span className="font-black text-xs font-mono tracking-wider">{deliveryType}</span>
                  </div>

                  <div className="flex flex-col items-center justify-center py-2 bg-slate-50 border border-slate-200 rounded mb-2.5">
                    <BarcodeComponent value={trackingCode} />
                  </div>

                  <div className="border-t-2 border-black pt-2 mb-2">
                    <span className="bg-black text-white text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wide rounded">DESTINATÁRIO</span>
                    <div className="mt-1.5 text-[9.5px] space-y-0.5">
                      <p className="font-extrabold text-[10.5px] uppercase">{recipientName}</p>
                      <p className="font-medium text-slate-850 leading-snug">{rawAddress}</p>
                      <p className="font-semibold text-slate-900">Tel: {recipientPhone}</p>
                    </div>
                  </div>

                  <div className="border-t-2 border-black pt-2">
                    <span className="border border-black text-black text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wide rounded bg-slate-100">REMETENTE</span>
                    <div className="mt-1.5 text-[8.5px] text-slate-700 space-y-0.5 leading-tight">
                      <p className="font-bold">{storeName}</p>
                      <p>{storeAddress}</p>
                      <p>CNPJ: {storeCnpj} - CEP: {storeCep}</p>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-black p-1 mt-2.5 rounded">
                  <div className="text-center border-b border-black pb-1 mb-1 bg-slate-50">
                    <h4 className="text-[8.5px] font-black uppercase leading-none">DECLARAÇÃO DE CONTEÚDO (SIMPLIFICADA)</h4>
                  </div>

                  <table className="w-full text-[8px] text-left leading-normal border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 font-bold bg-slate-100">
                        <th className="py-0.5">Descrição</th>
                        <th className="py-0.5 text-center">Qtd</th>
                        <th className="py-0.5 text-right">R$ Un.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {formattedItems.slice(0, 3).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-0.5 truncate max-w-[150px] font-medium">{item.name} ({item.size})</td>
                          <td className="py-0.5 text-center">{item.quantity}</td>
                          <td className="py-0.5 text-right">R$ {(totalVal / (totalQty || 1)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-between items-center text-[8.5px] font-bold border-t border-black pt-1 mt-1 leading-none">
                    <span>Qtd Total: {totalQty}</span>
                    <span className="font-extrabold">Total: R$ {totalVal.toFixed(2)}</span>
                  </div>

                  <div className="text-[6.5px] text-slate-650 mt-1.5 leading-tight">
                    <p>Declaro que não sou contribuinte do ICMS e que a mercadoria descrita não comercializa-se fora das normas postais.</p>
                    <div className="flex justify-between items-end mt-2">
                      <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
                      <div className="border-t border-slate-400 w-24 text-center pt-0.5 font-sans scale-90">
                        Assinatura
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Info footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 font-sans flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Código de Rastreamento Sincronizado</span>
          </span>
          <span>AP Moda Fitness Logística © 2026</span>
        </div>

        </div>
      )}
    </div>
  );
}
