import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Stroj, Stranka } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Search, Hash } from 'lucide-react'
import { toast } from 'sonner'

const emptyForm = {
  naziv: '', model: '', serijska: '', stranka_id: '', opombe: ''
}

export default function StrojiPage() {
  const [stroji, setStroji] = useState<Stroj[]>([])
  const [stranke, setStranke] = useState<Stranka[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Stroj | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: s }, { data: st }] = await Promise.all([
      supabase.from('stroji').select('*, stranke(naziv)').order('naziv'),
      supabase.from('stranke').select('*').order('naziv'),
    ])
    setStroji(s || [])
    setStranke(st || [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(s: Stroj) {
    setEditing(s)
    setForm({
      naziv: s.naziv, model: s.model || '', serijska: s.serijska || '',
      stranka_id: s.stranka_id || '', opombe: s.opombe || ''
    })
    setOpen(true)
  }

  async function save() {
    if (!form.naziv.trim()) { toast.error('Naziv je obvezen'); return }
    setSaving(true)
    const data = { ...form, stranka_id: form.stranka_id || null }
    if (editing) {
      const { error } = await supabase.from('stroji').update(data).eq('id', editing.id)
      if (error) { toast.error('Napaka'); setSaving(false); return }
      toast.success('Stroj posodobljen')
    } else {
      const { error } = await supabase.from('stroji').insert(data)
      if (error) { toast.error('Napaka'); setSaving(false); return }
      toast.success('Stroj dodan')
    }
    setSaving(false)
    setOpen(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Res izbrisati stroj?')) return
    const { error } = await supabase.from('stroji').delete().eq('id', id)
    if (error) { toast.error('Napaka pri brisanju'); return }
    toast.success('Stroj izbrisan')
    load()
  }

  const filtered = stroji.filter(s =>
    s.naziv.toLowerCase().includes(search.toLowerCase()) ||
    (s.serijska || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.model || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stroji</h1>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Nov stroj
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Išči po nazivu, modelu ali serijski..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Nalagam...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Ni strojev</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {filtered.map(s => (
            <div key={s.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{s.naziv}</div>
                <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500">
                  {s.model && <span>{s.model}</span>}
                  {s.serijska && <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{s.serijska}</span>}
                  {s.stranke && <span className="text-blue-600">{s.stranke.naziv}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(s.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Uredi stroj' : 'Nov stroj'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Naziv *</Label>
              <Input value={form.naziv} onChange={e => setForm(f => ({ ...f, naziv: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Model</Label>
                <Input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Serijska številka</Label>
                <Input value={form.serijska} onChange={e => setForm(f => ({ ...f, serijska: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Stranka</Label>
              <Select value={form.stranka_id} onValueChange={v => setForm(f => ({ ...f, stranka_id: v === '__none__' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="— brez stranke —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— brez stranke —</SelectItem>
                  {stranke.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.naziv}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Opombe</Label>
              <Textarea rows={2} value={form.opombe} onChange={e => setForm(f => ({ ...f, opombe: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Prekliči</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Shranjujem...' : 'Shrani'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
