import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, CheckCircle2, X, AlertCircle, Upload } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (file: File, previewUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string>('');
  const [videoReady, setVideoReady] = useState<boolean>(false);

  const stopStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    setVideoReady(false);
  };

  const startCamera = async () => {
    stopStream();
    setCameraError('');
    setCapturedBlob(null);
    setCapturedPreviewUrl('');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser environment.');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch (e) {
        // Fallback for devices without environment facing mode constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      mediaStreamRef.current = stream;
      setStreamActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            // Wait until dimensions exist
            if (videoRef.current && videoRef.current.videoWidth > 0) {
              setVideoReady(true);
            }
          } catch (playErr) {
            console.warn('Camera video play error:', playErr);
          }
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let message = 'Unable to access camera. Please check device permissions or use Upload Photo.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission denied. Please allow camera access in browser settings or use Upload Photo.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera device found on this device. Please use Upload Photo instead.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera is currently in use by another application. Please close other camera apps or use Upload Photo.';
      }
      setCameraError(message);
      setStreamActive(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Strict readiness check to fix black image bug
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError('Camera frame is initializing. Please wait a moment and try again.');
      return;
    }

    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          const previewUrl = URL.createObjectURL(blob);
          setCapturedPreviewUrl(previewUrl);
          stopStream(); // Pause stream once captured
        }
      },
      'image/jpeg',
      0.85
    );
  };

  const handleUsePhoto = () => {
    if (!capturedBlob || !capturedPreviewUrl) return;
    const file = new File([capturedBlob], `customer_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    onPhotoCaptured(file, capturedPreviewUrl);
    onClose();
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    setCapturedPreviewUrl('');
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-luxury-gold/40 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-luxury-border pb-3">
          <h3 className="font-serif text-lg font-bold text-luxury-charcoal flex items-center gap-2">
            <Camera className="w-5 h-5 text-luxury-gold" /> Take Customer Photo
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-luxury-gray hover:text-luxury-charcoal rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cameraError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            {cameraError}
          </div>
        )}

        {/* Media Viewport */}
        <div className="relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-luxury-border">
          {capturedPreviewUrl ? (
            <img src={capturedPreviewUrl} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              onCanPlay={() => setVideoReady(true)}
            />
          )}

          {!streamActive && !capturedPreviewUrl && !cameraError && (
            <div className="text-luxury-gold text-xs font-semibold flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Accessing camera stream...
            </div>
          )}
        </div>

        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Action Controls */}
        <div className="flex justify-between items-center pt-2">
          {capturedPreviewUrl ? (
            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-3 bg-luxury-ivory border border-luxury-border hover:bg-luxury-border/40 text-luxury-charcoal rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> RETAKE
              </button>
              <button
                type="button"
                onClick={handleUsePhoto}
                className="flex-1 py-3 bg-luxury-gold hover:bg-luxury-gold/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> USE PHOTO
              </button>
            </div>
          ) : (
            <div className="flex justify-end w-full gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-luxury-border text-luxury-gray hover:text-luxury-charcoal rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleCapture}
                disabled={!videoReady && !streamActive}
                className="px-6 py-2.5 bg-luxury-gold hover:bg-luxury-gold/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                <Camera className="w-4 h-4" /> TAKE PHOTO
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

