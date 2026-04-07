import { useEffect, useRef } from 'react'
import SignaturePadLib from 'signature_pad'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

interface SignaturePadProps {
  value: string
  onChange: (dataUrl: string) => void
}

export default function SignaturePad({ value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePadLib | null>(null)
  const onChangeRef = useRef(onChange)

  // Vedno aktualen onChange, brez stale closure
  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    padRef.current = new SignaturePadLib(canvas, {
      backgroundColor: 'rgb(255,255,255)',
      penColor: '#1e3a8a',
    })

    padRef.current.addEventListener('endStroke', () => {
      if (padRef.current) onChangeRef.current(padRef.current.toDataURL())
    })

    // Počakaj da browser izriše canvas pred resize
    const timer = setTimeout(() => resizeCanvas(), 50)

    const observer = new ResizeObserver(() => resizeCanvas())
    observer.observe(canvas)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!value && padRef.current) padRef.current.clear()
  }, [value])

  function resizeCanvas() {
    const canvas = canvasRef.current
    if (!canvas || !padRef.current) return
    const ratio = window.devicePixelRatio || 1
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    if (w === 0 || h === 0) return
    canvas.width = w * ratio
    canvas.height = h * ratio
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(ratio, ratio)
    padRef.current.clear()
  }

  function clear() {
    padRef.current?.clear()
    onChangeRef.current('')
  }

  return (
    <div className="space-y-2">
      <div
        className="relative border-2 border-dashed border-gray-300 rounded-md overflow-hidden bg-white"
        style={{ height: 160 }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair"
        />
        {!value && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-gray-400">Podpis stranke tukaj</span>
          </div>
        )}
      </div>
      <Button variant="outline" size="sm" type="button" onClick={clear}>
        <RotateCcw className="h-3.5 w-3.5" /> Počisti podpis
      </Button>
    </div>
  )
}
