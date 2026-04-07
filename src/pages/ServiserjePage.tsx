import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'

export default function ServiserjePage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [form, setForm] = useState({ ime: '', priimek: '', vloga: 'serviser', email: '', password: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('priimek')
    setProfiles(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm({ ime: '', priimek: '', vloga: 'serviser', email: '', password: '' })
    setOpen(true)
  }

  function openEdit(p: Profile) {
    setEditing(p)
    setForm({ ime: p.ime, priimek: p.priimek, vloga: p.vloga, email: '', password: '' })
    setOpen(true)
  }

  async function save() {
    if (!form.ime.trim() || !form.priimek.trim()) { toast.error('Ime in priimek sta obvezna'); return }
    setSaving(true)

    if (editing) {
      const { error } = await supabase.from('profiles').update({
        ime: form.ime, priimek: form.priimek, vloga: form.vloga
      }).eq('id', editing.id)
      if (error) { toast.error('Napaka pri shranjevanju'); setSaving(false); return }
      toast.success('Serviser posodobljen')
    } else {
      if (!form.email || !form.password) { toast.error('E-mail in geslo sta obvezna za novega serviserja'); setSaving(false); return }
      // Ustvari Supabase Auth uporabnika
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })
      if (authError || !authData.user) { toast.error('Napaka pri ustvarjanju: ' + authError?.message); setSaving(false); return }
      const { error } = await supabase.from('profiles').insert({
        id: authData.user.id, ime: form.ime, priimek: form.priimek, vloga: form.vloga
      })
      if (error) { toast.error('Napaka pri shranjevanju profila'); setSaving(false); return }
      toast.success('Serviser dodan — v Supabase Auth potrdi email če je potrebno')
    }

    setSaving(false)
    setOpen(false)
    load()
  }

  async function toggleAktiven(p: Profile) {
    const { error } = await supabase.from('profiles').update({ aktiven: !p.aktiven }).eq('id', p.id)
    if (error) { toast.error('Napaka'); return }
    toast.success(p.aktiven ? 'Serviser deaktiviran' : 'Serviser aktiviran')
    load()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Serviserji</h1>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Dodaj serviserja
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Nalagam...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {profiles.map(p => (
            <div key={p.id} className="flex items-center gap-4 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                {p.ime[0]}{p.priimek[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{p.ime} {p.priimek}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={p.vloga === 'admin' ? 'default' : 'warning'}>
                    {p.vloga}
                  </Badge>
                  {!p.aktiven && <Badge variant="destructive">neaktiven</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  onClick={() => toggleAktiven(p)}
                  className={p.aktiven ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                  title={p.aktiven ? 'Deaktiviraj' : 'Aktiviraj'}
                >
                  {p.aktiven ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Uredi serviserja' : 'Nov serviser'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ime *</Label>
                <Input value={form.ime} onChange={e => setForm(f => ({ ...f, ime: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Priimek *</Label>
                <Input value={form.priimek} onChange={e => setForm(f => ({ ...f, priimek: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vloga</Label>
              <Select value={form.vloga} onValueChange={v => setForm(f => ({ ...f, vloga: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="serviser">Serviser</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editing && (
              <>
                <div className="space-y-1.5">
                  <Label>E-mail *</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Geslo *</Label>
                  <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
              </>
            )}
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
