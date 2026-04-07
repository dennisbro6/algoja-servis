export interface Profile {
  id: string
  ime: string
  priimek: string
  vloga: 'admin' | 'serviser'
  aktiven: boolean
  created_at: string
}

export interface Stranka {
  id: string
  naziv: string
  naslov: string | null
  lokacija: string | null
  telefon: string | null
  kontakt_oseba: string | null
  opombe: string | null
  created_at: string
  updated_at: string
}

export interface Stroj {
  id: string
  naziv: string
  model: string | null
  serijska: string | null
  stranka_id: string | null
  opombe: string | null
  created_at: string
  updated_at: string
  stranke?: Stranka
}

export interface Nalog {
  id: string
  stevilka: string
  datum: string
  stranka_id: string | null
  stranka_naziv: string
  stranka_lokacija: string | null
  stranka_telefon: string | null
  stroj_id: string | null
  stroj_naziv: string | null
  stroj_serijska: string | null
  opis_dela: string | null
  rezervni_deli: string | null
  st_ur: number | null
  km: number | null
  serviserji: string[]
  podpis_url: string | null
  status: 'odprt' | 'zakljucen'
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface NalogFormData {
  datum: string
  stranka_id: string
  stranka_naziv: string
  stranka_lokacija: string
  stranka_telefon: string
  stroj_id: string
  stroj_naziv: string
  stroj_serijska: string
  opis_dela: string
  rezervni_deli: string
  st_ur: string
  km: string
  serviserji: string[]
  podpis_url: string
  status: 'odprt' | 'zakljucen'
}
