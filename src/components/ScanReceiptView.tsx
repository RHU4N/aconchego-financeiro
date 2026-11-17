import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  RefreshCw,
  ArrowRight,
  FileText,
  Zap,
  Droplets,
  Receipt,
  X,
} from 'lucide-react';
import { ScannedReceiptResult, Transaction } from '../types/finance';
import { formatCurrency, formatFriendlyDate } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface ScanReceiptViewProps {
  onAutoRegisterExpense: (
    data: Omit<Transaction, 'id' | 'createdAt'>
  ) => Transaction;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onGoToTransactions: () => void;
  onViewReceipt: (tx: Transaction) => void;
}

interface CompressedImage {
  dataUrl: string;
  mimeType: string;
}

async function compressBlobToJpeg(blob: Blob): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        const MAX_DIM = 1400;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width >= height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Não foi possível preparar a imagem.'));
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        URL.revokeObjectURL(objectUrl);
        resolve({ dataUrl, mimeType: 'image/jpeg' });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível carregar o arquivo de imagem selecionado.'));
    };
    img.src = objectUrl;
  });
}

export const ScanReceiptView: React.FC<ScanReceiptViewProps> = ({
  onAutoRegisterExpense,
  onEditTransaction,
  onDeleteTransaction,
  onGoToTransactions,
  onViewReceipt,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastRegistered, setLastRegistered] = useState<{
    transaction: Transaction;
    documentType: string;
    confidence: 'alta' | 'media' | 'baixa';
  } | null>(null);
  const [sessionScanned, setSessionScanned] = useState<Transaction[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async (requestedFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setScanError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Câmera ao vivo não disponível neste navegador. Use o botão "Tirar Foto / Enviar Arquivo" abaixo.'
      );
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: requestedFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraOpen(true);

      // Attach stream after video element renders
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {
            // Auto-play handled by attributes
          });
        }
      }, 50);
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setIsCameraOpen(false);
      setCameraError(
        'Não foi possível abrir a câmera ao vivo (permissão negada ou dispositivo sem câmera). Você pode usar o botão "Enviar Foto / Câmera Nativa" abaixo.'
      );
    }
  };

  const toggleFacingMode = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  const processAndRegisterImage = async (dataUrl: string, mimeType: string) => {
    setPreviewUrl(dataUrl);
    setIsScanning(true);
    setScanError(null);
    setLastRegistered(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch('/api/receipts/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType,
          todayDate: today,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error || 'Não foi possível ler os dados deste documento.'
        );
      }

      const parsed = payload as ScannedReceiptResult;

      const createdTx = onAutoRegisterExpense({
        description: parsed.description,
        amount: parsed.amount,
        type: 'expense',
        category: parsed.category,
        date: parsed.date,
        account: parsed.account,
        status: parsed.status,
        imageUrl: dataUrl,
        notes: parsed.notes
          ? `${parsed.documentType} · ${parsed.notes}`
          : parsed.documentType,
      });

      setLastRegistered({
        transaction: createdTx,
        documentType: parsed.documentType,
        confidence: parsed.confidence,
      });
      setSessionScanned((prev) => [createdTx, ...prev]);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erro inesperado ao processar o recibo.';
      setScanError(message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCaptureFromVideo = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    await processAndRegisterImage(dataUrl, 'image/jpeg');
  };

  const handleFileSelected = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setScanError('Por favor, selecione um arquivo de imagem (JPG, PNG, WebP).');
      return;
    }

    try {
      stopCamera();
      const { dataUrl, mimeType } = await compressBlobToJpeg(file);
      await processAndRegisterImage(dataUrl, mimeType);
    } catch (err: unknown) {
      setScanError(
        err instanceof Error ? err.message : 'Erro ao preparar a imagem.'
      );
    }
  };

  const handleTestSampleReceipt = async () => {
    try {
      stopCamera();
      setScanError(null);
      const res = await fetch('/src/assets/images/receipt_supermarket_sample_1791335311360.jpg');
      if (!res.ok) throw new Error('Não foi possível carregar a imagem de exemplo.');
      const blob = await res.blob();
      const { dataUrl, mimeType } = await compressBlobToJpeg(blob);
      await processAndRegisterImage(dataUrl, mimeType);
    } catch (err: unknown) {
      setScanError(
        err instanceof Error ? err.message : 'Erro ao testar recibo de exemplo.'
      );
    }
  };

  const handleUndoLast = () => {
    if (!lastRegistered) return;
    const targetId = lastRegistered.transaction.id;
    onDeleteTransaction(targetId);
    setSessionScanned((prev) => prev.filter((t) => t.id !== targetId));
    setLastRegistered(null);
    setPreviewUrl(null);
  };

  const handleResetScanner = () => {
    setPreviewUrl(null);
    setScanError(null);
    setLastRegistered(null);
    setCameraError(null);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#1A1C1A]">
            Escanear Recibo ou Conta
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6661] mt-1">
            Fotografe seu cupom fiscal, nota fiscal, conta de água ou conta de luz — a IA lê tudo e registra a despesa automaticamente.
          </p>
        </div>
      </div>

      {/* Main Grid: Capture Area (7 cols) + Supported Documents & Tips (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left: Capture & Scan Workspace */}
        <div className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl border border-[#EAE6DE] shadow-xs p-4 sm:p-6 space-y-5">
          {/* Live Camera Viewfinder */}
          {isCameraOpen ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-[#1A1C1A] aspect-[3/4] sm:aspect-[4/3] max-h-[60vh] flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Framing guide corners */}
                <div className="pointer-events-none absolute inset-6 border-2 border-dashed border-white/50 rounded-xl flex items-end justify-center p-3">
                  <span className="text-[11px] font-medium text-white bg-black/55 px-3 py-1 rounded-full backdrop-blur-xs">
                    Enquadre o recibo ou conta com boa iluminação
                  </span>
                </div>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                  title="Fechar câmera"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="px-4 py-2.5 rounded-full bg-[#F2EFE9] hover:bg-[#EAE6DE] text-xs font-semibold text-[#1A1C1A] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Alternar Câmera</span>
                </button>

                <button
                  type="button"
                  onClick={handleCaptureFromVideo}
                  className="px-6 py-3 rounded-full bg-[#274A3C] hover:bg-[#1E3B30] text-sm font-bold text-white flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Tirar Foto & Registrar</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                  e.target.value = '';
                }}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                  e.target.value = '';
                }}
              />

              {/* If scanning or showing result */}
              {previewUrl ? (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden bg-[#F4F3F0] border border-[#EAE6DE] max-h-80 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Foto do documento capturado"
                      className={`max-h-80 w-full object-contain transition-opacity duration-300 ${
                        isScanning ? 'opacity-50' : 'opacity-100'
                      }`}
                    />
                    {isScanning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAF9F6]/75 backdrop-blur-[2px] p-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-[#274A3C] text-[#C4EBD8] flex items-center justify-center mb-3 animate-pulse">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <p className="text-sm sm:text-base font-bold text-[#1A1C1A]">
                          Lendo documento com IA...
                        </p>
                        <p className="text-xs text-[#5C6661] mt-1 max-w-xs">
                          Identificando valor total, estabelecimento, data e categoria da despesa.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Error State */}
                  {scanError && !isScanning && (
                    <div className="p-4 rounded-2xl bg-[#FDF0ED] border border-[#F5C2B8] space-y-3">
                      <div className="flex items-start gap-2.5 text-[#BA1A1A]">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm">
                          <p className="font-bold">Não foi possível registrar automaticamente</p>
                          <p className="mt-0.5 text-[#7A2018]">{scanError}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleResetScanner}
                          className="px-4 py-2 rounded-full bg-[#FFFFFF] border border-[#D9D5CC] text-xs font-semibold text-[#1A1C1A] hover:bg-[#FAF9F6] cursor-pointer"
                        >
                          Tentar outra foto
                        </button>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="px-4 py-2 rounded-full bg-[#274A3C] text-xs font-semibold text-white hover:bg-[#1E3B30] cursor-pointer"
                        >
                          Tirar nova foto
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Success Auto-Registered Card */}
                  {lastRegistered && !isScanning && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#EDF5F0] border border-[#B9DCC7] space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#274A3C] text-white flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-[#1A1C1A]">
                              Despesa registrada automaticamente
                            </h3>
                            <p className="text-xs text-[#2B4D3F]">
                              {lastRegistered.documentType} · Confiança {lastRegistered.confidence}
                            </p>
                          </div>
                        </div>

                        <span className="text-lg sm:text-xl font-extrabold text-[#274A3C] font-mono tabular-nums shrink-0">
                          -{formatCurrency(lastRegistered.transaction.amount)}
                        </span>
                      </div>

                      <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#DCE8E0] grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <span className="text-[#5C6661] block">Descrição</span>
                          <span className="font-bold text-[#1A1C1A]">
                            {lastRegistered.transaction.description}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#5C6661] block">Categoria</span>
                          <span className="font-semibold text-[#1A1C1A]">
                            {lastRegistered.transaction.category}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#5C6661] block">Data / Vencimento</span>
                          <span className="font-semibold text-[#1A1C1A]">
                            {formatFriendlyDate(lastRegistered.transaction.date)} ({lastRegistered.transaction.date})
                          </span>
                        </div>
                        <div>
                          <span className="text-[#5C6661] block">Pagamento e Situação</span>
                          <span className="font-semibold text-[#1A1C1A]">
                            {lastRegistered.transaction.account} ·{' '}
                            {lastRegistered.transaction.status === 'paid' ? 'Efetivado' : 'Pendente'}
                          </span>
                        </div>
                        {lastRegistered.transaction.notes && (
                          <div className="sm:col-span-2 pt-1 border-t border-[#F2EFE9]">
                            <span className="text-[#5C6661] block">Detalhes lidos pela IA</span>
                            <span className="text-[#414844]">
                              {lastRegistered.transaction.notes}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleResetScanner}
                          className="px-4 py-2 rounded-full bg-[#274A3C] hover:bg-[#1E3B30] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Escanear outro</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditTransaction(lastRegistered.transaction)}
                          className="px-3.5 py-2 rounded-full bg-[#FFFFFF] border border-[#D9D5CC] hover:bg-[#FAF9F6] text-xs font-semibold text-[#1A1C1A] flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar detalhes</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleUndoLast}
                          className="px-3.5 py-2 rounded-full bg-[#FFFFFF] border border-[#F5C2B8] hover:bg-[#FDF0ED] text-xs font-semibold text-[#BA1A1A] flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Desfazer</span>
                        </button>

                        <button
                          type="button"
                          onClick={onGoToTransactions}
                          className="ml-auto text-xs font-semibold text-[#274A3C] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Ver no Extrato</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty Dropzone & Camera Buttons */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileSelected(file);
                  }}
                  className={`rounded-2xl border-2 border-dashed p-6 sm:p-10 text-center transition-colors ${
                    isDragging
                      ? 'border-[#274A3C] bg-[#EEF3F0]/60'
                      : 'border-[#D9D5CC] bg-[#FAF9F6]'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#EEF3F0] text-[#274A3C] flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#1A1C1A]">
                    Fotografe ou envie seu documento
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5C6661] mt-1 max-w-md mx-auto">
                    Funciona com cupom fiscal, nota fiscal, boleto, conta de luz, conta de água ou comprovante Pix. Assim que a foto for enviada, o débito é lançado na hora.
                  </p>

                  {cameraError && (
                    <div className="mt-4 p-3 rounded-xl bg-[#FCF1ED] border border-[#F5D3C4] text-xs text-[#954827] text-left max-w-md mx-auto">
                      {cameraError}
                    </div>
                  )}

                  {scanError && (
                    <div className="mt-4 p-3 rounded-xl bg-[#FDF0ED] border border-[#F5C2B8] text-xs text-[#BA1A1A] text-left max-w-md mx-auto">
                      {scanError}
                    </div>
                  )}

                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => startCamera('environment')}
                      className="w-full sm:w-auto px-5 py-3 rounded-full bg-[#274A3C] hover:bg-[#1E3B30] text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Abrir Câmera ao Vivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full sm:w-auto px-5 py-3 rounded-full bg-[#E0835D] hover:bg-[#CC714C] text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer sm:hidden"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Câmera do Celular</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="w-full sm:w-auto px-5 py-3 rounded-full bg-[#FFFFFF] hover:bg-[#F2EFE9] border border-[#D9D5CC] text-xs sm:text-sm font-semibold text-[#1A1C1A] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-[#5C6661]" />
                      <span>Escolher Imagem</span>
                    </button>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#EAE6DE] flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleTestSampleReceipt}
                      className="text-xs font-semibold text-[#3F6253] hover:text-[#274A3C] underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Testar leitura com cupom de supermercado de exemplo</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: What the AI reads + Tips */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE6DE] shadow-xs p-5 space-y-4">
            <h2 className="text-base font-bold text-[#1A1C1A]">
              O que a IA identifica automaticamente
            </h2>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FDF2EB] text-[#E0835D] flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#1A1C1A]">Recibos e Cupons Fiscais</p>
                  <p className="text-xs text-[#5C6661]">
                    Mercados, farmácias, restaurantes, padarias e compras no cartão ou Pix.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FCF1ED] text-[#C96846] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#1A1C1A]">Contas de Luz (Energia)</p>
                  <p className="text-xs text-[#5C6661]">
                    Lê o valor total, data de vencimento, concessionária e consumo em kWh.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#EEF4F8] text-[#4B739B] flex items-center justify-center shrink-0">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#1A1C1A]">Contas de Água e Serviços</p>
                  <p className="text-xs text-[#5C6661]">
                    Faturas de água, gás, internet e boletos com classificação automática em Serviços & Contas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#EEF3F0] text-[#3F6253] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#1A1C1A]">Notas Fiscais</p>
                  <p className="text-xs text-[#5C6661]">
                    Extrai emissor, valor líquido e salva a foto do comprovante no seu extrato.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#F4F3F0] rounded-2xl border border-[#E9E5DC] p-4 sm:p-5 text-xs text-[#5C6661] space-y-1.5">
            <p className="font-bold text-[#1A1C1A]">Dicas para uma leitura precisa</p>
            <p>1. Apoie o papel em uma superfície plana com boa iluminação.</p>
            <p>2. Enquadre o nome do estabelecimento e o valor total.</p>
            <p>3. Se quiser ajustar algum detalhe após o registro, clique em "Editar detalhes".</p>
          </div>
        </div>
      </div>

      {/* Session History */}
      {sessionScanned.length > 0 && (
        <div className="bg-[#FFFFFF] p-4 sm:p-6 rounded-2xl border border-[#EAE6DE] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1A1C1A]">
                Registrados por foto agora ({sessionScanned.length})
              </h2>
              <p className="text-xs text-[#5C6661]">
                Estes lançamentos já estão salvos no seu extrato e orçamentos.
              </p>
            </div>
            <button
              type="button"
              onClick={onGoToTransactions}
              className="text-xs font-semibold text-[#274A3C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Abrir extrato</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#F2EFE9]">
            {sessionScanned.map((tx) => (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {tx.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => onViewReceipt(tx)}
                      className="w-10 h-10 rounded-xl overflow-hidden border border-[#E6E2D8] shrink-0 cursor-pointer"
                      title="Ampliar foto do recibo"
                    >
                      <img
                        src={tx.imageUrl}
                        alt={tx.description}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#FCF1ED] text-[#C96846] flex items-center justify-center shrink-0">
                      <CategoryIcon name={tx.category} className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[#1A1C1A] truncate">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#5C6661] mt-0.5 flex-wrap">
                      <span>{formatFriendlyDate(tx.date)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{tx.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{tx.account}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-[#1A1C1A] font-mono tabular-nums">
                    -{formatCurrency(tx.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEditTransaction(tx)}
                    className="p-1.5 text-[#5C6661] hover:text-[#1A1C1A] hover:bg-[#F2EFE9] rounded-lg cursor-pointer"
                    title="Editar lançamento"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
