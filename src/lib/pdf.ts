import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'
import type { Nalog } from '@/types'
import { formatDate } from './utils'

export async function generatePDF(nalog: Nalog) {
  const el = document.createElement('div')
  el.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:white;font-family:Arial,sans-serif;'
  el.innerHTML = buildHTML(nalog)
  document.body.appendChild(el)

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = 210
    const H = (canvas.height * W) / canvas.width

    if (H <= 297) {
      pdf.addImage(imgData, 'PNG', 0, 0, W, H)
    } else {
      // Več strani
      const pageH = 297
      let offset = 0
      while (offset < H) {
        if (offset > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -offset, W, H)
        offset += pageH
      }
    }

    pdf.save(`${nalog.stevilka}.pdf`)
  } finally {
    document.body.removeChild(el)
  }
}

function buildHTML(nalog: Nalog): string {
  const statusColor = nalog.status === 'zakljucen' ? '#16a34a' : '#ca8a04'
  const statusLabel = nalog.status === 'zakljucen' ? 'ZAKLJUČEN' : 'ODPRT'

  return `
    <div style="padding:32px;color:#111;">

      <!-- Glava -->
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #1d4ed8;padding-bottom:16px;margin-bottom:20px;">
        <img src="/logo.png" alt="Algoja" style="height:48px;object-fit:contain;" onerror="this.style.display='none'" />
        <div style="text-align:center;flex:1;">
          <div style="font-size:13px;color:#6b7280;margin-top:4px;">Servisni nalog za stroje za folijo</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:22px;font-weight:bold;color:#1d4ed8;">${nalog.stevilka}</div>
          <div style="font-size:12px;color:#6b7280;">${formatDate(nalog.datum)}</div>
          <div style="display:inline-block;margin-top:4px;padding:2px 10px;border-radius:12px;background:${statusColor};color:white;font-size:11px;font-weight:bold;">${statusLabel}</div>
        </div>
      </div>

      <!-- Stranka -->
      <div style="margin-bottom:16px;">
        ${sectionHeader('Stranka')}
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:12px 0;">
          ${fieldHTML('Naziv', nalog.stranka_naziv)}
          ${fieldHTML('Lokacija', nalog.stranka_lokacija)}
          ${fieldHTML('Telefon', nalog.stranka_telefon)}
        </div>
      </div>

      <!-- Stroj -->
      ${nalog.stroj_naziv || nalog.stroj_serijska ? `
      <div style="margin-bottom:16px;">
        ${sectionHeader('Stroj')}
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:12px 0;">
          ${fieldHTML('Naziv stroja', nalog.stroj_naziv)}
          ${fieldHTML('Serijska številka', nalog.stroj_serijska)}
        </div>
      </div>` : ''}

      <!-- Opis dela -->
      <div style="margin-bottom:16px;">
        ${sectionHeader('Opis dela')}
        <div style="padding:12px 0;font-size:13px;min-height:60px;white-space:pre-wrap;">${nalog.opis_dela || '—'}</div>
      </div>

      <!-- Rezervni deli -->
      ${nalog.rezervni_deli ? `
      <div style="margin-bottom:16px;">
        ${sectionHeader('Rezervni deli')}
        <div style="padding:12px 0;font-size:13px;min-height:40px;white-space:pre-wrap;">${nalog.rezervni_deli}</div>
      </div>` : ''}

      <!-- Povzetek -->
      <div style="margin-bottom:16px;">
        ${sectionHeader('Povzetek')}
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:12px 0;">
          ${fieldHTML('Število ur', nalog.st_ur != null ? `${nalog.st_ur} h` : null)}
          ${fieldHTML('Kilometri', nalog.km != null ? `${nalog.km} km` : null)}
          ${fieldHTML('Serviserji', nalog.serviserji.length > 0 ? nalog.serviserji.join(', ') : null)}
        </div>
      </div>

      <!-- Podpis -->
      <div style="margin-bottom:16px;">
        ${sectionHeader('Podpis stranke')}
        <div style="padding:12px 0;">
          ${nalog.podpis_url
            ? `<img src="${nalog.podpis_url}" style="max-height:100px;border:1px solid #e5e7eb;border-radius:4px;" />`
            : `<div style="width:240px;height:80px;border:1px dashed #d1d5db;border-radius:4px;display:flex;align-items:flex-end;padding:6px;">
                 <span style="font-size:10px;color:#9ca3af;">Podpis</span>
               </div>`
          }
        </div>
      </div>

      <!-- Noga -->
      <div style="border-top:1px solid #e5e7eb;padding-top:10px;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;">
        <span>Algoja d.o.o. &mdash; Servisni nalog</span>
        <span>Generirano: ${new Date().toLocaleString('sl-SI')}</span>
      </div>
    </div>
  `
}

function sectionHeader(title: string): string {
  return `<div style="background:#1d4ed8;color:white;font-size:11px;font-weight:bold;padding:4px 8px;border-radius:4px;letter-spacing:0.05em;">${title.toUpperCase()}</div>`
}

function fieldHTML(label: string, value: string | null | undefined): string {
  return `
    <div>
      <div style="font-size:10px;color:#6b7280;margin-bottom:2px;">${label}</div>
      <div style="font-size:13px;font-weight:500;">${value || '—'}</div>
    </div>
  `
}
