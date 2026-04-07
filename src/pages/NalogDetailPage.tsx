import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Nalog } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, nalogStatusLabel, nalogStatusColor } from '@/lib/utils'
import { ArrowLeft, Pencil, FileText, MapPin, Phone, Hash, Clock, Car, Users } from 'lucide-react'
import { generatePDF } from '@/lib/pdf'
import { toast } from 'sonner'

export default function NalogDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [nalog, setNalog] = useState<Nalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    if (id) load(id)
  }, [id])

  async function load(nalogId: string) {
    const { data } = await supabase.from('nalogi').select('*').eq('id', nalogId).single()
    setNalog(data)
    setLoading(false)
  }

  async function handlePDF() {
    if (!nalog) return
    setPdfLoading(true)
    try {
      await generatePDF(nalog)
    } catch (e) {
      toast.error('Napaka pri generiranju PDF')
      console.error(e)
    }
    setPdfLoading(false)
  }

  if (loading) return <div className="p-6 text-gray-400">Nalagam...</div>
  if (!nalog) return <div className="p-6 text-gray-500">Nalog ni najden.</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{nalog.stevilka}</h1>
          <p className="text-sm text-gray-500">{formatDate(nalog.datum)}</p>
        </div>
        <Badge className={nalogStatusColor(nalog.status)}>
          {nalogStatusLabel(nalog.status)}
        </Badge>
        <Button variant="outline" onClick={handlePDF} disabled={pdfLoading}>
          <FileText className="h-4 w-4" />
          {pdfLoading ? 'Generiram...' : 'PDF'}
        </Button>
        <Button asChild>
          <Link to={`/nalogi/${nalog.id}/uredi`}>
            <Pencil className="h-4 w-4" /> Uredi
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {/* Stranka */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Stranka</h2>
          <div className="text-lg font-semibold text-gray-900 mb-2">{nalog.stranka_naziv}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {nalog.stranka_lokacija && (
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gray-400" />{nalog.stranka_lokacija}</span>
            )}
            {nalog.stranka_telefon && (
              <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-gray-400" />{nalog.stranka_telefon}</span>
            )}
          </div>
        </div>

        {/* Stroj */}
        {(nalog.stroj_naziv || nalog.stroj_serijska) && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Stroj</h2>
            <div className="flex items-center gap-3 text-sm">
              {nalog.stroj_naziv && <span className="font-medium text-gray-900">{nalog.stroj_naziv}</span>}
              {nalog.stroj_serijska && (
                <span className="flex items-center gap-1 text-gray-500">
                  <Hash className="h-3.5 w-3.5" />{nalog.stroj_serijska}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Delo */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Opis dela</h2>
          {nalog.opis_dela ? (
            <p className="text-gray-800 whitespace-pre-wrap">{nalog.opis_dela}</p>
          ) : (
            <p className="text-gray-400 italic">Ni opisa</p>
          )}
          {nalog.rezervni_deli && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Rezervni deli</div>
              <p className="text-gray-800 whitespace-pre-wrap">{nalog.rezervni_deli}</p>
            </div>
          )}
        </div>

        {/* Čas, km, serviserji */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Clock className="h-5 w-5 text-gray-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900">{nalog.st_ur ?? '—'}</div>
              <div className="text-xs text-gray-500">ur</div>
            </div>
            <div className="text-center">
              <Car className="h-5 w-5 text-gray-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900">{nalog.km ?? '—'}</div>
              <div className="text-xs text-gray-500">km</div>
            </div>
            <div className="text-center">
              <Users className="h-5 w-5 text-gray-400 mx-auto mb-1" />
              <div className="text-sm font-medium text-gray-900">
                {nalog.serviserji.length > 0 ? nalog.serviserji.join(', ') : '—'}
              </div>
              <div className="text-xs text-gray-500">serviserji</div>
            </div>
          </div>
        </div>

        {/* Podpis */}
        {nalog.podpis_url && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Podpis stranke</h2>
            <img src={nalog.podpis_url} alt="Podpis stranke" className="max-h-32 border border-gray-200 rounded" />
          </div>
        )}
      </div>
    </div>
  )
}
