import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Nalog } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate, nalogStatusLabel, nalogStatusColor } from '@/lib/utils'
import { Plus, Search, MapPin, Phone, Clock, Car, ChevronRight } from 'lucide-react'

export default function DashboardPage() {
  const [nalogi, setNalogi] = useState<Nalog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('vse')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('nalogi')
      .select('*')
      .order('datum', { ascending: false })
      .order('created_at', { ascending: false })
    setNalogi(data || [])
    setLoading(false)
  }

  const filtered = nalogi.filter(n => {
    const matchSearch =
      n.stevilka.toLowerCase().includes(search.toLowerCase()) ||
      n.stranka_naziv.toLowerCase().includes(search.toLowerCase()) ||
      (n.stranka_lokacija || '').toLowerCase().includes(search.toLowerCase()) ||
      n.serviserji.some(s => s.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = statusFilter === 'vse' || n.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    odprti: nalogi.filter(n => n.status === 'odprt').length,
    zakljuceni: nalogi.filter(n => n.status === 'zakljucen').length,
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servisni nalogi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats.odprti} odprtih · {stats.zakljuceni} zaključenih
          </p>
        </div>
        <Button asChild>
          <Link to="/nalogi/nov">
            <Plus className="h-4 w-4" /> Nov nalog
          </Link>
        </Button>
      </div>

      {/* Filtri */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Išči po številki, stranki, serviserju..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vse">Vsi statusi</SelectItem>
            <SelectItem value="odprt">Odprti</SelectItem>
            <SelectItem value="zakljucen">Zaključeni</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Nalagam...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">
            {search || statusFilter !== 'vse' ? 'Ni zadetkov' : 'Še ni servisnih nalogov'}
          </p>
          {!search && statusFilter === 'vse' && (
            <Button asChild>
              <Link to="/nalogi/nov"><Plus className="h-4 w-4" /> Nov nalog</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {filtered.map(n => (
            <Link
              key={n.id}
              to={`/nalogi/${n.id}`}
              className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors group"
            >
              {/* Datum + številka */}
              <div className="w-28 shrink-0">
                <div className="text-xs text-gray-400">{formatDate(n.datum)}</div>
                <div className="font-mono text-sm font-semibold text-gray-900">{n.stevilka}</div>
              </div>

              {/* Stranka */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{n.stranka_naziv}</div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                  {n.stranka_lokacija && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{n.stranka_lokacija}</span>
                  )}
                  {n.stranka_telefon && (
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{n.stranka_telefon}</span>
                  )}
                  {n.stroj_naziv && <span className="text-blue-600">{n.stroj_naziv}</span>}
                </div>
              </div>

              {/* Statistike */}
              <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 shrink-0">
                {n.st_ur != null && (
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{n.st_ur}h</span>
                )}
                {n.km != null && (
                  <span className="flex items-center gap-1"><Car className="h-3 w-3" />{n.km}km</span>
                )}
                {n.serviserji.length > 0 && (
                  <span className="max-w-[120px] truncate">{n.serviserji.join(', ')}</span>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={nalogStatusColor(n.status)}>
                  {nalogStatusLabel(n.status)}
                </Badge>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
