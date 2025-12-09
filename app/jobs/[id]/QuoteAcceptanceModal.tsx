"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, X, Check } from "lucide-react";

interface QuoteAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobId: string;
  userEmail: string;
}

export default function QuoteAcceptanceModal({
  isOpen,
  onClose,
  onSuccess,
  jobId,
  userEmail,
}: QuoteAcceptanceModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [email, setEmail] = useState(userEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Initialize canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 600;
    canvas.height = 200;

    // Set drawing style
    ctx.strokeStyle = "#1e293b"; // slate-800
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSignedName("");
      setEmail(userEmail);
      setError("");
      setIsSubmitting(false);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }
  }, [isOpen, userEmail]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const hasSignature = () => {
    if (!canvasRef.current) return false;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return false;
    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    return imageData.data.some((channel) => channel !== 0);
  };

  const handleSubmit = async () => {
    setError("");

    // Validation
    if (!signedName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get signature data URL (or empty string if no signature drawn)
      const signatureDataUrl = hasSignature() && canvasRef.current
        ? canvasRef.current.toDataURL("image/png")
        : "";

      const response = await fetch(`/api/jobs/${jobId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: signedName.trim(),
          email: email.trim(),
          signatureDataUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept quote.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error accepting quote:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-75 p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          disabled={isSubmitting}
        >
          <X className="h-6 w-6" />
        </button>

        <h3 className="mb-4 text-2xl font-bold text-slate-900">Accept & Sign Quote</h3>
        <p className="mb-6 text-slate-600">
          By signing below, you agree to accept this quote and proceed with the work.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="signedName" className="mb-2 block text-sm font-medium text-slate-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="signedName"
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              placeholder="John Doe"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              placeholder="you@example.com"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Your Signature <span className="text-slate-500 text-xs">(optional but recommended)</span>
            </label>
            <div className="relative rounded-lg border border-slate-300 bg-slate-50">
              <canvas
                ref={canvasRef}
                className="w-full h-48 cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasSignature() && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-400">
                  Draw your signature here
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={clearSignature}
              className="mt-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              disabled={isSubmitting}
            >
              Clear Signature
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Confirm & Sign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

