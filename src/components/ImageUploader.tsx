/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  currentImageUrl?: string;
  className?: string;
  multiple?: boolean;
}

const IMAGE_EXT_REGEX = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i;

function isValidImageFile(file: File): boolean {
  if (file.type && file.type.startsWith('image/')) return true;
  if ((!file.type || file.type === 'application/octet-stream') && file.name && IMAGE_EXT_REGEX.test(file.name)) {
    return true;
  }
  return false;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo da galeria.'));
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.length > 0) {
        resolve(reader.result);
      } else {
        reject(new Error('Arquivo de imagem vazio.'));
      }
    };
    reader.readAsDataURL(file);
  });
}

// Client-side auto-compression using canvas to convert high-res photos (5MB-15MB) into lightweight WebP
async function compressImageFile(
  file: File,
  maxDim = 1200,
  quality = 0.82
): Promise<{
  dataUrl: string;
  compactFallbackUrl: string;
  browserDecoded: boolean;
  sizeKb: number;
  originalKb: number;
  reductionPercent: number;
}> {
  const rawDataUrl = await readFileAsDataUrl(file);
  const originalKb = Math.max(1, Math.round(file.size / 1024));

  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => {
      // Browser cannot decode format directly (e.g. HEIC on Chrome/Firefox) -> send raw file to server Sharp
      resolve({
        dataUrl: rawDataUrl,
        compactFallbackUrl: '',
        browserDecoded: false,
        sizeKb: originalKb,
        originalKb,
        reductionPercent: 0
      });
    };
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.max(1, Math.round((height * maxDim) / width));
            width = maxDim;
          } else {
            width = Math.max(1, Math.round((width * maxDim) / height));
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            dataUrl: rawDataUrl,
            compactFallbackUrl: rawDataUrl.length <= 120000 ? rawDataUrl : '',
            browserDecoded: true,
            sizeKb: originalKb,
            originalKb,
            reductionPercent: 0
          });
        }
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Prepare ultra-compact fallback (< 85KB base64) in case offline/proxy upload fails
        let compactFallbackUrl = dataUrl;
        if (compactFallbackUrl.length > 95000) {
          const smallDim = 760;
          let sw = img.width;
          let sh = img.height;
          if (sw > smallDim || sh > smallDim) {
            if (sw > sh) {
              sh = Math.max(1, Math.round((sh * smallDim) / sw));
              sw = smallDim;
            } else {
              sw = Math.max(1, Math.round((sw * smallDim) / sh));
              sh = smallDim;
            }
          }
          const smallCanvas = document.createElement('canvas');
          smallCanvas.width = sw;
          smallCanvas.height = sh;
          const sCtx = smallCanvas.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(img, 0, 0, sw, sh);
            let smallUrl = smallCanvas.toDataURL('image/webp', 0.62);
            if (!smallUrl.startsWith('data:image/webp')) {
              smallUrl = smallCanvas.toDataURL('image/jpeg', 0.62);
            }
            compactFallbackUrl = smallUrl;
          }
        }

        const newKb = Math.max(1, Math.round((dataUrl.length * 3) / 4 / 1024));
        const reductionPercent = originalKb > 0 ? Math.max(0, Math.round((1 - newKb / originalKb) * 100)) : 0;

        resolve({
          dataUrl,
          compactFallbackUrl,
          browserDecoded: true,
          sizeKb: newKb,
          originalKb,
          reductionPercent
        });
      } catch {
        resolve({
          dataUrl: rawDataUrl,
          compactFallbackUrl: rawDataUrl.length <= 120000 ? rawDataUrl : '',
          browserDecoded: false,
          sizeKb: originalKb,
          originalKb,
          reductionPercent: 0
        });
      }
    };
    img.src = rawDataUrl;
  });
}

export default function ImageUploader({
  onUploadSuccess,
  currentImageUrl,
  className = '',
  multiple = false
}: ImageUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState(currentImageUrl || '');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [optimizationInfo, setOptimizationInfo] = useState<{ originalKb: number; newKb: number; reduction: number; count?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentImageUrl !== undefined) {
      setUploadedUrl(currentImageUrl);
    }
  }, [currentImageUrl]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleFilesList = async (files: FileList | File[]) => {
    const validList = Array.from(files);
    if (validList.length === 0) return;

    const toProcess = multiple ? validList : [validList[0]];
    const invalidFiles = toProcess.filter(f => !isValidImageFile(f));
    if (invalidFiles.length === toProcess.length) {
      showError('O arquivo selecionado deve ser uma imagem válida (JPEG, PNG, WEBP, GIF, HEIC).');
      return;
    }

    const acceptedFiles = toProcess.filter(isValidImageFile);
    setIsUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');
    setOptimizationInfo(null);

    let successCount = 0;
    let lastError = '';
    let lastOptInfo: { originalKb: number; newKb: number; reduction: number } | null = null;

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      setUploadProgress(
        acceptedFiles.length > 1
          ? `Enviando foto ${i + 1} de ${acceptedFiles.length}...`
          : 'Otimizando e enviando foto...'
      );
      try {
        const resInfo = await uploadSingleFile(file);
        successCount++;
        lastOptInfo = resInfo;
      } catch (err: any) {
        lastError = err?.message || 'Erro ao processar imagem.';
      }
    }

    setUploadProgress('');
    setIsUploading(false);

    if (successCount > 0) {
      setUploadStatus('success');
      if (lastOptInfo) {
        setOptimizationInfo({ ...lastOptInfo, count: successCount });
      }
      if (lastError) {
        setErrorMessage(`${successCount} foto(s) enviada(s). Aviso: ${lastError}`);
      }
    } else {
      showError(lastError || 'Não foi possível enviar a foto selecionada.');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFilesList(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files && e.target.files.length > 0) {
        await handleFilesList(e.target.files);
      }
    } finally {
      // Reset input so choosing another photo (or retrying same photo) always fires onChange
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const verifyBrowserImageLoad = (url: string, timeoutMs = 4500): Promise<boolean> => {
    if (!url) return Promise.resolve(false);
    if (url.startsWith('data:image/')) return Promise.resolve(true);
    return new Promise((resolve) => {
      const probe = new Image();
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      }, timeoutMs);
      probe.onload = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(probe.naturalWidth > 0);
        }
      };
      probe.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(false);
        }
      };
      probe.referrerPolicy = 'no-referrer';
      probe.src = url;
    });
  };

  const uploadSingleFile = async (file: File): Promise<{ originalKb: number; newKb: number; reduction: number }> => {
    const { dataUrl, compactFallbackUrl, browserDecoded, sizeKb, originalKb, reductionPercent } = await compressImageFile(file);

    try {
      const response = await fetch('/api/proxy/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: dataUrl, name: file.name || `foto-${Date.now()}.webp` })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || 'Falha no servidor ao enviar imagem.');
      }

      const result = await response.json();
      if (result && result.success && typeof result.url === 'string' && result.url.trim().length > 0) {
        let finalUrl = result.url.trim();
        if (!finalUrl.startsWith('data:image/')) {
          const canRender = await verifyBrowserImageLoad(finalUrl);
          if (!canRender && browserDecoded && compactFallbackUrl && compactFallbackUrl.startsWith('data:image/')) {
            finalUrl = compactFallbackUrl;
          }
        }
        setUploadedUrl(finalUrl);
        onUploadSuccess(finalUrl);
        return { originalKb, newKb: sizeKb, reduction: reductionPercent };
      }
      throw new Error('Falha ao obter URL da imagem.');
    } catch (uploadErr: any) {
      console.warn('[Upload Proxy Warning, tentando fallback WebP compacto]:', uploadErr);
      if (browserDecoded && compactFallbackUrl && compactFallbackUrl.startsWith('data:image/')) {
        setUploadedUrl(compactFallbackUrl);
        onUploadSuccess(compactFallbackUrl);
        return { originalKb, newKb: sizeKb, reduction: reductionPercent };
      }
      throw new Error(uploadErr?.message || 'Não foi possível enviar ou converter esta foto.');
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) files.push(blob);
      }
    }
    if (files.length > 0) {
      await handleFilesList(files);
    }
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setUploadStatus('error');
    setIsUploading(false);
    setUploadProgress('');
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg"
        multiple={multiple}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center text-center space-y-3">
        {isUploading ? (
          <>
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            <div>
              <p className="font-bold text-slate-700">{uploadProgress || 'Enviando imagem...'}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Sua imagem está sendo otimizada e enviada com segurança.</p>
            </div>
          </>
        ) : uploadStatus === 'success' ? (
          <>
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 font-bold">
              <CheckCircle2 size={14} />
              <span>
                {optimizationInfo?.count && optimizationInfo.count > 1
                  ? `${optimizationInfo.count} Fotos Adicionadas!`
                  : 'Imagem Adicionada com Sucesso!'}
              </span>
            </div>

            {optimizationInfo && optimizationInfo.reduction > 0 && (
              <div className="text-[10px] text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/50 font-medium">
                ⚡ Reduzida de {optimizationInfo.originalKb} KB para {optimizationInfo.newKb} KB (-{optimizationInfo.reduction}%) para abertura rápida!
              </div>
            )}

            {errorMessage && (
              <p className="text-[10px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
                {errorMessage}
              </p>
            )}

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
                {multiple ? 'Adicionar mais fotos da galeria' : 'Escolher outro arquivo'}
              </button>
              <p className="text-[9px] text-slate-400 mt-1">
                Dica: Você pode selecionar {multiple ? 'uma ou várias fotos' : 'outra foto'}, colar (Ctrl+V) ou arrastar aqui!
              </p>
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
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold cursor-pointer"
            >
              Selecionar Foto Novamente
            </button>
          </>
        ) : (
          <>
            <div className="p-3 bg-pink-50 rounded-full text-pink-600">
              <UploadCloud size={24} />
            </div>

            <div>
              <p className="font-bold text-slate-700 text-xs">
                Arraste e solte {multiple ? 'suas fotos' : 'sua foto'} aqui, ou{' '}
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="text-pink-600 hover:text-pink-700 hover:underline font-bold cursor-pointer"
                >
                  procure na galeria / computador
                </button>
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-sans">
                Suporta JPEG, PNG, WEBP, GIF, HEIC. Pode colar (Ctrl+V) ou enviar {multiple ? 'várias de uma vez' : 'direto do aparelho'}!
              </p>
            </div>

            {uploadedUrl && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400">Imagem ativa:</span>
                <div className="w-8 h-8 rounded-md overflow-hidden border border-slate-100 bg-white">
                  <img src={uploadedUrl} alt="Preview Active" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[9px] text-emerald-600 bg-emerald-50 rounded-lg p-2 border border-emerald-100 mt-2 max-w-xs justify-center leading-relaxed font-medium">
              <span>Otimização Automática WebP + CDN Permanente Ativa ⚡</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
