'use client'
/**
 * Receipt Scanner page.
 * Upload a photo → Tesseract.js extracts text → parse amounts → save as expense.
 */
import { useState, useRef } from 'react'
import { Scan, Upload, CheckCircle, X, Loader } from 'lucide-react'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface ParsedReceipt {
  store: string
  items: { name: string; price: number }[]
  total: number
  rawText: string
}

export default function ScannerPage() {
  const { addExpense } = useExpenses()
  const { user } = useAuth()
  const [image, setImage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [note, setNote] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (f: File) => {
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => setImage(e.target?.result as string)
    reader.readAsDataURL(f)
    setParsed(null); setSaved(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) handleFileSelect(f)
  }

  /** Use Claude vision API for OCR (more accurate than Tesseract for receipts) */
  const scanWithAI = async () => {
    if (!file) return
    setScanning(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1]
      try {
        const resp = await fetch('/api/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mimeType: file.type }),
        })
        const data = await resp.json()
        setParsed(data.receipt)
        setNote(data.receipt?.store ?? '')
      } catch {
        // Fallback: use Tesseract.js
        await scanWithTesseract(e.target?.result as string)
      }
      setScanning(false)
    }
    reader.readAsDataURL(file)
  }

  /** Tesseract.js OCR fallback */
  const scanWithTesseract = async (dataUrl: string) => {
    try {
      const Tesseract = (await import('tesseract.js')).default
      const { data: { text } } = await Tesseract.recognize(dataUrl, 'rus+eng', {
        logger: () => {},
      })
      const receipt = parseTesseractText(text)
      setParsed(receipt)
      setNote(receipt.store)
    } catch (err) {
      console.error('OCR error:', err)
      setParsed({ store: 'Неизвестно', items: [], total: 0, rawText: '' })
    }
  }

  /** Parse Tesseract text to extract prices */
  const parseTesseractText = (text: string): ParsedReceipt => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const items: { name: string; price: number }[] = []
    let total = 0
    const priceRegex = /(\d+[.,]\d{2})/g

    lines.forEach(line => {
      const matches = line.match(priceRegex)
      if (matches) {
        const price = parseFloat(matches[matches.length - 1].replace(',', '.'))
        const name = line.replace(priceRegex, '').trim().replace(/\s+/g, ' ')
        if (name.length > 2 && price > 0) {
          items.push({ name: name.substring(0, 40), price })
          if (line.toLowerCase().includes('итого') || line.toLowerCase().includes('total')) {
            total = price
          }
        }
      }
    })

    if (!total && items.length) total = items.reduce((s, i) => s + i.price, 0)
    const storeLine = lines.find(l => l.length > 3 && !l.match(priceRegex)) ?? 'Магазин'

    return { store: storeLine.substring(0, 30), items, total, rawText: text }
  }

  const saveExpense = async () => {
    if (!parsed || parsed.total <= 0) return
    setSaving(true)

    // Upload receipt image to Supabase Storage
    let receiptUrl = null
    if (file && user) {
      const path = `${user.id}/${Date.now()}_${file.name}`
      const { data } = await supabase.storage.from('receipts').upload(path, file)
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(path)
        receiptUrl = publicUrl
      }
    }

    await addExpense({
      amount: parsed.total,
      type: 'expense',
      category_id: null,
      category_name: 'Покупки',
      note: note || parsed.store,
      date: new Date().toISOString().split('T')[0],
      receipt_url: receiptUrl,
    })

    setSaved(true); setSaving(false)
  }

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="text-xl font-bold">Сканер чеков</h2>
        <p className="text-sm text-white/40 mt-0.5">Загрузите фото чека — AI распознает суммы автоматически</p>
      </div>

      {/* Upload area */}
      <div
        className="card border-2 border-dashed border-white/[0.1] p-10 text-center cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/[0.02] transition-all"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
        {image ? (
          <img src={image} alt="Receipt" className="max-h-48 mx-auto rounded-xl object-contain" />
        ) : (
          <>
            <Scan className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="font-semibold text-white/60">Перетащите фото чека</p>
            <p className="text-sm text-white/30 mt-1">или нажмите для выбора</p>
            <p className="text-xs text-white/20 mt-2">JPG, PNG, HEIC</p>
          </>
        )}
      </div>

      {image && !saved && (
        <button onClick={scanWithAI} disabled={scanning} className="btn-primary w-full justify-center py-3">
          {scanning ? <><Loader className="w-4 h-4 animate-spin" /> Распознаём...</> : <><Scan className="w-4 h-4" /> Распознать чек</>}
        </button>
      )}

      {/* Parsed result */}
      {parsed && !saved && (
        <div className="card p-5 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{parsed.store}</h3>
            <button onClick={() => setParsed(null)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          {parsed.items.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {parsed.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-white/60 truncate flex-1">{item.name}</span>
                  <span className="font-mono text-white/80 ml-3">${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center border-t border-white/[0.07] pt-3">
            <span className="font-bold">Итого</span>
            <span className="font-mono text-xl font-bold text-red-400">${parsed.total.toFixed(2)}</span>
          </div>

          <div>
            <label className="label">Заметка</label>
            <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Описание расхода" />
          </div>

          <button onClick={saveExpense} disabled={saving || parsed.total <= 0} className="btn-primary w-full justify-center py-3">
            {saving ? 'Сохраняем...' : `Добавить расход $${parsed.total.toFixed(2)}`}
          </button>
        </div>
      )}

      {saved && (
        <div className="card p-6 text-center animate-slide-up">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="font-bold text-lg">Расход добавлен!</p>
          <p className="text-sm text-white/40 mt-1 mb-4">Чек сохранён и расход создан</p>
          <button onClick={() => { setImage(null); setFile(null); setParsed(null); setSaved(false) }} className="btn-ghost mx-auto">
            Сканировать ещё
          </button>
        </div>
      )}
    </div>
  )
}
