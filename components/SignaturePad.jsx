"use client";

import { useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Eraser } from "lucide-react";

const SignaturePad = forwardRef(function SignaturePad(_, ref) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  useImperativeHandle(ref, () => ({
    getDataUrl: () => (hasSignature ? canvasRef.current.toDataURL("image/png") : null),
    clear: () => clear(),
    isEmpty: () => !hasSignature,
  }));

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return {
      x: ((point.clientX - rect.left) / rect.width) * canvasRef.current.width,
      y: ((point.clientY - rect.top) / rect.height) * canvasRef.current.height,
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#142D65";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    setHasSignature(true);
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <canvas
        ref={canvasRef}
        width={400}
        height={160}
        className="w-full h-40 bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-strong)/0.4)] touch-none cursor-crosshair"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <button
        type="button"
        onClick={clear}
        className="self-end flex items-center gap-1 text-[11px] text-[rgb(var(--stone))] hover:text-[#A02018] transition-colors"
      >
        <Eraser size={12} /> Limpar assinatura
      </button>
    </div>
  );
});

export default SignaturePad;
