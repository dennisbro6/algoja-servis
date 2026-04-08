import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { generatePDFBase64 } from '@/lib/pdf'
import type { Stranka, Stroj, Profile, NalogFormData, Nalog } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import SignaturePad from '@/components/SignaturePad'
import { todayISO } from '@/lib/utils'
import { ArrowLeft, Save, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

const emptyForm: NalogFormData = {
  datum: todayISO(),
  stranka_id: '', stranka_naziv: '', stranka_lokacija: '', stranka_telefon: '',
  stroj_id: '', stroj_naziv: '', stroj_serijska: '',
  opis_dela: '', rezervni_deli: '',
  st_ur: '', km: '',
  serviserji: [],
  podpis_url: '',
  status: 'odprt',
}

export default function NovNalogPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<NalogFormData>(emptyForm)
  const [stranke, setStranke] = useState<Stranka[]>([])
  const [stroji, setStroji] = useState<Stroj[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    loadBaze()
    if (isEdit && id) loadNalog(id)
  }, [id])

  async function loadBaze() {
    const [{ data: s }, { data: st }, { data: p }] = await Promise.all([
      supabase.from('stranke').select('*').order('naziv'),
      supabase.from('stroji').select('*, stranke(naziv)').order('naziv'),
      supabase.from('profiles').select('*').eq('aktiven', true).order('priimek'),
    ])
    setStranke(s || [])
    setStroji(st || [])
    setProfiles(p || [])
  }

  async function loadNalog(nalogId: string) {
    const { data } = await supabase.from('nalogi').select('*').eq('id', nalogId).single()
    if (data) {
      setForm({
        datum: data.datum,
        stranka_id: data.stranka_id || '',
        stranka_naziv: data.stranka_naziv,
        stranka_lokacija: data.stranka_lokacija || '',
        stranka_telefon: data.stranka_telefon || '',
        stroj_id: data.stroj_id || '',
        stroj_naziv: data.stroj_naziv || '',
        stroj_serijska: data.stroj_serijska || '',
        opis_dela: data.opis_dela || '',
        rezervni_deli: data.rezervni_deli || '',
        st_ur: data.st_ur?.toString() || '',
        km: data.km?.toString() || '',
        serviserji: data.serviserji || [],
        podpis_url: data.podpis_url || '',
        status: data.status,
      })
    }
    setLoading(false)
  }

  function selectStranka(strankaId: string) {
    const id = strankaId === '__none__' ? '' : strankaId
    const s = stranke.find(x => x.id === id)
    setForm(f => ({
      ...f,
      stranka_id: id,
      stranka_naziv: s?.naziv || '',
      stranka_lokacija: s?.lokacija || '',
      stranka_telefon: s?.telefon || '',
    }))
  }

  function selectStroj(strojId: string) {
    const id = strojId === '__none__' ? '' : strojId
    const s = stroji.find(x => x.id === id)
    setForm(f => ({
      ...f,
      stroj_id: id,
      stroj_naziv: s?.naziv || '',
      stroj_serijska: s?.serijska || '',
    }))
  }

  function toggleServiser(ime: string) {
    setForm(f => ({
      ...f,
      serviserji: f.serviserji.includes(ime)
        ? f.serviserji.filter(s => s !== ime)
        : [...f.serviserji, ime],
    }))
  }

  async function sendEmail(nalog: Nalog) {
    let pdfBase64: string | undefined
    try {
      pdfBase64 = await generatePDFBase64(nalog)
      console.log('PDF base64 length:', pdfBase64?.length)
    } catch (e) {
      console.error('PDF generiranje neuspešno:', e)
    }
    supabase.functions.invoke('send-email', {
      body: { stevilka: nalog.stevilka, pdfBase64 }
    }).catch(console.error)
  }

  async function generateStevilka(): Promise<string> {
    const { data } = await supabase.rpc('generate_nalog_stevilka')
    return data as string
  }

  async function save(closeStatus?: 'zakljucen') {
    if (!form.stranka_naziv.trim()) { toast.error('Stranka je obvezna'); return }
    setSaving(true)

    try {
      const podpisUrl = form.podpis_url || null

      const payload = {
        datum: form.datum,
        stranka_id: form.stranka_id || null,
        stranka_naziv: form.stranka_naziv,
        stranka_lokacija: form.stranka_lokacija || null,
        stranka_telefon: form.stranka_telefon || null,
        stroj_id: form.stroj_id || null,
        stroj_naziv: form.stroj_naziv || null,
        stroj_serijska: form.stroj_serijska || null,
        opis_dela: form.opis_dela || null,
        rezervni_deli: form.rezervni_deli || null,
        st_ur: form.st_ur ? parseFloat(form.st_ur) : null,
        km: form.km ? parseFloat(form.km) : null,
        serviserji: form.serviserji,
        podpis_url: podpisUrl || null,
        status: closeStatus || form.status,
      }

      if (isEdit && id) {
        const { data: updated, error } = await supabase.from('nalogi').update(payload).eq('id', id).select().single()
        if (error) throw error
        toast.success('Nalog posodobljen')
        if (closeStatus === 'zakljucen') await sendEmail(updated)
        navigate(`/nalogi/${id}`)
      } else {
        const stevilka = await generateStevilka()
        const { data, error } = await supabase.from('nalogi').insert({ ...payload, stevilka }).select().single()
        if (error) throw error
        toast.success(`Nalog ${stevilka} shranjen`)
        await sendEmail(data)
        navigate(`/nalogi/${data.id}`)
      }
    } catch (e) {
      toast.error('Napaka pri shranjevanju')
      console.error(e)
    }
    setSaving(false)
  }

  if (loading) return <div className="p-6 text-gray-400">Nalagam...</div>

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Uredi nalog' : 'Nov servisni nalog'}
        </h1>
      </div>

      <div className="space-y-6">
        {/* Osnovni podatki */}
        <section className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Osnovni podatki</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Datum *</Label>
              <Input
                type="date"
                value={form.datum}
                onChange={e => setForm(f => ({ ...f, datum: e.target.value }))}
              />
            </div>
          </div>
        </section>

        {/* Stranka */}
        <section className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Stranka</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Stranka iz baze</Label>
              <Select value={form.stranka_id} onValueChange={selectStranka}>
                <SelectTrigger>
                  <SelectValue placeholder="— izberi stranko —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— brez —</SelectItem>
                  {stranke.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.naziv}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Naziv *</Label>
                <Input
                  value={form.stranka_naziv}
                  onChange={e => setForm(f => ({ ...f, stranka_naziv: e.target.value }))}
                  placeholder="Naziv stranke"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Lokacija</Label>
                <Input
                  value={form.stranka_lokacija}
                  onChange={e => setForm(f => ({ ...f, stranka_lokacija: e.target.value }))}
                  placeholder="Lokacija"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input
                  value={form.stranka_telefon}
                  onChange={e => setForm(f => ({ ...f, stranka_telefon: e.target.value }))}
                  placeholder="Telefon"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stroj */}
        <section className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Stroj</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Stroj iz baze</Label>
              <Select value={form.stroj_id} onValueChange={selectStroj}>
                <SelectTrigger>
                  <SelectValue placeholder="— izberi stroj —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— brez —</SelectItem>
                  {stroji.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.naziv}{s.serijska ? ` (${s.serijska})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Naziv stroja</Label>
                <Input
                  value={form.stroj_naziv}
                  onChange={e => setForm(f => ({ ...f, stroj_naziv: e.target.value }))}
                  placeholder="Naziv stroja"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Serijska številka</Label>
                <Input
                  value={form.stroj_serijska}
                  onChange={e => setForm(f => ({ ...f, stroj_serijska: e.target.value }))}
                  placeholder="SN-XXXX"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Delo */}
        <section className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Opis dela</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Opis dela</Label>
              <Textarea
                rows={4}
                value={form.opis_dela}
                onChange={e => setForm(f => ({ ...f, opis_dela: e.target.value }))}
                placeholder="Opis opravljenih del..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rezervni deli</Label>
              <Textarea
                rows={3}
                value={form.rezervni_deli}
                onChange={e => setForm(f => ({ ...f, rezervni_deli: e.target.value }))}
                placeholder="Seznam vgrajenih rezervnih delov..."
              />
            </div>
          </div>
        </section>

        {/* Čas in km */}
        <section className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Čas in prevoz</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Število ur</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={form.st_ur}
                onChange={e => setForm(f => ({ ...f, st_ur: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kilometri (od serviserja do stranke)</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.km}
                onChange={e => setForm(f => ({ ...f, km: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
        </section>

        {/* Serviserji */}
        <section className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Serviserji</h2>
          <div className="flex flex-wrap gap-2">
            {profiles.map(p => {
              const ime = `${p.ime} ${p.priimek}`
              const selected = form.serviserji.includes(ime)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleServiser(ime)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {ime}
                </button>
              )
            })}
          </div>
          {form.serviserji.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">Izbrani: {form.serviserji.join(', ')}</p>
          )}
        </section>

        {/* Podpis */}
        <section className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Podpis stranke</h2>
          <SignaturePad
            value={form.podpis_url}
            onChange={v => setForm(f => ({ ...f, podpis_url: v }))}
          />
        </section>

        {/* Akcije */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>Prekliči</Button>
          <Button variant="outline" onClick={() => save()} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Shranjujem...' : 'Shrani kot odprt'}
          </Button>
          <Button onClick={() => save('zakljucen')} disabled={saving} variant="success">
            <CheckCircle className="h-4 w-4" />
            {saving ? 'Shranjujem...' : 'Zaključi nalog'}
          </Button>
        </div>
      </div>
    </div>
  )
}
