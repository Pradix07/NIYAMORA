import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, VideoOff, RotateCcw, X, Layers } from 'lucide-react';

export type PackagingPanelType = 'FRONT' | 'BACK' | 'SIDE_LEFT' | 'SIDE_RIGHT' | 'TOP' | 'BOTTOM';

interface CameraCaptureProps {
  onCapture: (file: File, panelType: PackagingPanelType) => void;
  onCancel?: () => void;
  defaultPanel?: PackagingPanelType;
  maxPhotos?: number;
  currentPhotoCount?: number;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onCancel,
  defaultPanel = 'FRONT',
  maxPhotos = 4,
  currentPhotoCount = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [capturedBlobUrl, setCapturedBlobUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [panelType, setPanelType] = useState<PackagingPanelType>(defaultPanel);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Initialize camera stream
  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      setIsInitializing(true);
      setCameraError(null);

      // Stop existing tracks if any
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported by your browser.');
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1920, min: 1024 },
            height: { ideal: 1080, min: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          newStream.getTracks().forEach((t) => t.stop());
          return;
        }

        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.play().catch(() => {});
        }
        setIsInitializing(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Camera initialization failed:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Camera access was denied. Please allow camera permissions in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setCameraError('No camera hardware was detected on this device.');
        } else {
          setCameraError('Unable to start camera feed. Please check device permissions.');
        }
        setIsInitializing(false);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
    };
  }, [facingMode, retryTrigger]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (capturedBlobUrl) {
        URL.revokeObjectURL(capturedBlobUrl);
      }
    };
  }, [stream, capturedBlobUrl]);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const filename = `packaging_${panelType.toLowerCase()}_${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);

        setCapturedFile(file);
        setCapturedBlobUrl(url);
        stopStream();
      },
      'image/jpeg',
      0.92
    );
  };

  const handleRetake = () => {
    if (capturedBlobUrl) {
      URL.revokeObjectURL(capturedBlobUrl);
      setCapturedBlobUrl(null);
      setCapturedFile(null);
    }
    setRetryTrigger((prev) => prev + 1);
  };

  const handleConfirm = () => {
    if (capturedFile) {
      onCapture(capturedFile, panelType);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div
      style={{
        borderRadius: '1rem',
        border: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-surface)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            Live Packaging Camera Scan
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
            Capture packaging faces for OCR & statutory Legal Metrology compliance inspection
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.25rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--accent-primary, #10b981)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            Panel {Math.min(currentPhotoCount + 1, maxPhotos)} of {maxPhotos}
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
              title="Close camera"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Panel Selection Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Layers size={14} /> Tag Panel:
        </span>
        {(['FRONT', 'BACK', 'SIDE_LEFT', 'SIDE_RIGHT', 'TOP', 'BOTTOM'] as PackagingPanelType[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPanelType(p)}
            style={{
              padding: '0.25rem 0.6rem',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: panelType === p ? 700 : 500,
              border: panelType === p ? '1px solid var(--accent-primary, #10b981)' : '1px solid var(--border-default)',
              backgroundColor: panelType === p ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-base)',
              color: panelType === p ? 'var(--accent-primary, #10b981)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {p === 'SIDE_LEFT' ? 'Left Side' : p === 'SIDE_RIGHT' ? 'Right Side' : p}
          </button>
        ))}
      </div>

      {/* Camera Viewport or Snapshot Preview */}
      {cameraError ? (
        <div
          style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            borderRadius: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
            }}
          >
            <VideoOff size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Camera Unavailable</h4>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '380px' }}>
              {cameraError}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setRetryTrigger((p) => p + 1)}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
            >
              <RefreshCw size={14} /> Retry Camera
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                Upload File Instead
              </button>
            )}
          </div>
        </div>
      ) : capturedBlobUrl ? (
        /* Captured Still Frame Preview */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              aspectRatio: '4/3',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              backgroundColor: '#000',
              border: '1px solid var(--border-default)',
              position: 'relative',
            }}
          >
            <img
              src={capturedBlobUrl}
              alt="Captured packaging frame"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            <div
              style={{
                position: 'absolute',
                top: '0.75rem',
                left: '0.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                color: '#fff',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              Tagged: {panelType} Panel
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleRetake}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <RotateCcw size={15} /> Retake
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <CheckCircle2 size={15} /> Confirm & Use Photo
            </button>
          </div>
        </div>
      ) : (
        /* Live Camera Feed */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              aspectRatio: '4/3',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              backgroundColor: '#0a0f1d',
              border: '1px solid var(--border-default)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isInitializing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--accent-primary, #10b981)' }} />
                Starting camera...
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isInitializing ? 0 : 1,
              }}
            />

            {/* Viewfinder Target Overlays */}
            {!isInitializing && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    inset: '1.25rem',
                    border: '2px dashed rgba(16, 185, 129, 0.65)',
                    borderRadius: '0.5rem',
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '0.6rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      color: '#6ee7b7',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '0.25rem',
                      alignSelf: 'flex-start',
                    }}
                  >
                    Align {panelType} Panel in Box
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      color: '#6ee7b7',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '0.25rem',
                      alignSelf: 'flex-end',
                    }}
                  >
                    Hold steady for sharp OCR
                  </span>
                </div>

                {/* Flip Camera Button */}
                <button
                  type="button"
                  onClick={toggleCamera}
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Switch front/back camera"
                >
                  <RotateCcw size={16} />
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              onClick={handleSnap}
              disabled={isInitializing || !stream}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.95rem',
                padding: '0.6rem 1.4rem',
                borderRadius: '0.5rem',
              }}
            >
              <Camera size={18} /> Take Photo of {panelType}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
