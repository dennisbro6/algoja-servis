import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const TO_EMAIL = 'tomaz@tana.si'
const FROM_EMAIL = 'Algoja Servis <servis@studio56.si>'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { stevilka, stranka_naziv, stranka_lokacija, datum, status, serviserji, stroj_naziv } = await req.json()

    const isZakljucen = status === 'zakljucen'
    const subject = isZakljucen
      ? `✅ Servisni nalog ${stevilka} zaključen`
      : `🔧 Nov servisni nalog ${stevilka}`

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1d4ed8;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">Algoja Servis</h1>
          <p style="color:#bfdbfe;margin:4px 0 0;">${subject}</p>
        </div>
        <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#6b7280;width:140px;">Številka naloga</td>
              <td style="padding:8px 0;font-weight:bold;">${stevilka}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Datum</td>
              <td style="padding:8px 0;">${datum}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Stranka</td>
              <td style="padding:8px 0;">${stranka_naziv}</td>
            </tr>
            ${stranka_lokacija ? `
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Lokacija</td>
              <td style="padding:8px 0;">${stranka_lokacija}</td>
            </tr>` : ''}
            ${stroj_naziv ? `
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Stroj</td>
              <td style="padding:8px 0;">${stroj_naziv}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Serviserji</td>
              <td style="padding:8px 0;">${serviserji?.join(', ') || '—'}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Status</td>
              <td style="padding:8px 0;">
                <span style="background:${isZakljucen ? '#dcfce7' : '#fef9c3'};color:${isZakljucen ? '#16a34a' : '#ca8a04'};padding:2px 10px;border-radius:12px;font-size:13px;font-weight:bold;">
                  ${isZakljucen ? 'Zaključen' : 'Odprt'}
                </span>
              </td>
            </tr>
          </table>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px;">Algoja d.o.o. &mdash; Servisni nalogi</p>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [TO_EMAIL], subject, html }),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: res.ok ? 200 : 400,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
