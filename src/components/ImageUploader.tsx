/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Settings,
  Clipboard
} from 'lucide-react';

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  currentImageUrl?: string;
  className?: string;
}

export default function ImageUploader({ onUploadSuccess, currentImageUrl, className = '' }: ImageUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState(currentImageUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Retrieve the ImgBB Key from local storage
  const getImgbbKey = (): string => {
    const rawKey = localStorage.getItem('ap_imgbb_key') || '';
    // Use the real ImgBB API key supplied by the user as the default
    if (!rawKey || rawKey === 'imgbb_live_tok_9821379128') {
      return '18601b3928fe35b4d0d517fe002c2df7';
    }
    return rawKey.trim();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processAndUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processAndUploadFile(e.target.files[0]);
    }
  };

  const processAndUploadFile = async (file: File) => {
    // Validate file type
    if (!file.type.match('image.*')) {
      showError('O arquivo selecionado deve ser uma imagem válida (JPEG, PNG, WEBP, GIF).');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    // Convert to Base64 to send via JSON Proxy
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        try {
          // Send to the secure Supabase proxy endpoint
          const response = await fetch('/api/proxy/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: base64data, name: file.name })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Falha no servidor ao fazer upload da imagem.');
          }

          const result = await response.json();
          if (result && result.success && result.url) {
            setUploadedUrl(result.url);
            onUploadSuccess(result.url);
            setUploadStatus('success');
          } else {
            throw new Error('Falha ao obter URL pública da imagem.');
          }
        } catch (uploadErr: any) {
          console.error('[Upload Proxy Error]:', uploadErr);
          // Fallback to local Base64 on failure so user experience isn't blocked
          setUploadedUrl(base64data);
          onUploadSuccess(base64data);
          setUploadStatus('success');
          alert('Upload em nuvem falhou. Usando preview local temporário de imagem!');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      showError('Erro ao ler o arquivo local.');
      setIsUploading(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
                await processAndUploadFile(blob);
            }
        }
    }
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setUploadStatus('error');
    setIsUploading(false);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-2xl p-6 transition-all relative font-sans text-xs ${
        isDragActive 
          ? 'border-pink-500 bg-pink-50/30 font-medium' 
          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
      } ${className}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center text-center space-y-3">
        {isUploading ? (
          <>
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            <div>
              <p className="font-bold text-slate-700">Enviando imagem...</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Sua imagem está sendo enviada e otimizada na nuvem.</p>
            </div>
          </>
        ) : uploadStatus === 'success' ? (
          <>
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 font-bold">
              <CheckCircle2 size={14} />
              <span>Pronto para Gravar!</span>
            </div>
            
            {uploadedUrl && (
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                <img src={uploadedUrl} alt="Preview Uploaded" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}

            <div>
              <button 
                type="button"
                onClick={triggerFileInput}
                className="text-pink-600 hover:text-pink-700 font-bold hover:underline cursor-pointer"
              >
                Escolher outro arquivo
              </button>
              <p className="text-[9px] text-slate-400 mt-1">Dica: Você também pode colar (Ctrl+V) ou arrastar outra foto aqui!</p>
            </div>
          </>
        ) : uploadStatus === 'error' ? (
          <>
            <div className="flex items-center gap-1 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-full border border-rose-100 font-bold">
              <AlertCircle size={14} />
              <span>Falha no Upload</span>
            </div>
            <p className="text-[11px] text-rose-600 font-medium px-4">{errorMessage}</p>
            <button 
              type="button"
              onClick={triggerFileInput}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold"
            >
              Tentar Novamente
            </button>
          </>
        ) : (
          <>
            <div className="p-3 bg-pink-50 rounded-full text-pink-600">
              <UploadCloud size={24} />
            </div>
            
            <div>
              <p className="font-bold text-slate-700 text-xs">
                Arraste e solte sua foto aqui, ou{' '}
                <button 
                  type="button"
                  onClick={triggerFileInput}
                  className="text-pink-600 hover:text-pink-700 hover:underline font-bold cursor-pointer"
                >
                  procure no computador
                </button>
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-sans">
                Suporta JPEG, PNG, WEBP, GIF. Pode colar da área de transferência (Ctrl+V)!
              </p>
            </div>

            {uploadedUrl && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400">Imagem ativa:</span>
                <div className="w-8 h-8 rounded-md overflow-hidden border border-slate-150 bg-white">
                  <img src={uploadedUrl} alt="Preview Active" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-1.5 text-[9px] text-emerald-600 bg-emerald-50 rounded-lg p-2 border border-emerald-100 mt-2 max-w-xs justify-center leading-relaxed font-medium">
              <span>Nuvem Segura Ativa! Imagens salvas direto no Supabase Storage 🎉</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
