import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Stranka } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Search, Phone, MapPin } from 'lucide-react'
import { toast } from 'sonner'

const emptyForm = {
  naziv: '', naslov: '', lokacija: '', telefon: '', kontakt_oseba: '', opombe: ''
}

export default function StrankePage() {
  const [stranke, setStranke] = useState<Stranka[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Stranka | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    console.log('Loading stranke...')
    const { data, error } = await supabase.from('stranke').select('*').order('naziv')
    console.log('Result:', { data, error })
    if (error) console.error('Stranke error:', error)
    setStranke(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(s: Stranka) {
    setEditing(s)
    setForm({
      naziv: s.naziv, naslov: s.naslov || '', lokacija: s.lokacija || '',
      telefon: s.telefon || '', kontakt_oseba: s.kontakt_oseba || '', opombe: s.opombe || ''
    })
    setOpen(true)
  }

  async function save() {
    if (!form.naziv.trim()) { toast.error('Naziv je obvezen'); return }
    setSaving(true)
    if (editing) {
      const { error } = await supabase.from('stranke').update(form).eq('id', editing.id)
      if (error) { toast.error('Napaka pri shranjevanju'); setSaving(false); return }
      toast.success('Stranka posodobljena')
    } else {
      const { error } = await supabase.from('stranke').insert(form)
      if (error) { toast.error('Napaka pri shranjevanju'); setSaving(false); return }
      toast.success('Stranka dodana')
    }
    setSaving(false)
    setOpen(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Res izbrisati stranko?')) return
    const { error } = await supabase.from('stranke').delete().eq('id', id)
    if (error) { toast.error('Napaka pri brisanju'); return }
    toast.success('Stranka izbrisana')
    load()
  }

  const filtered = stranke.filter(s =>
    s.naziv.toLowerCase().includes(search.toLowerCase()) ||
    (s.lokacija || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stranke</h1>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Nova stranka
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Išči po nazivu ali lokaciji..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Nalagam...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Ni strank</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {filtered.map(s => (
            <div key={s.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{s.naziv}</div>
                <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500">
                  {s.lokacija && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.lokacija}</span>}
                  {s.telefon && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.telefon}</span>}
                  {s.kontakt_oseba && <span>{s.kontakt_oseba}</span>}
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
            <DialogTitle>{editing ? 'Uredi stranko' : 'Nova stranka'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Naziv *</Label>
              <Input value={form.naziv} onChange={e => setForm(f => ({ ...f, naziv: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Lokacija</Label>
                <Input value={form.lokacija} onChange={e => setForm(f => ({ ...f, lokacija: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Naslov</Label>
              <Input value={form.naslov} onChange={e => setForm(f => ({ ...f, naslov: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Kontaktna oseba</Label>
              <Input value={form.kontakt_oseba} onChange={e => setForm(f => ({ ...f, kontakt_oseba: e.target.value }))} />
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
