const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const SOIA_LOGO = "https://soia.app.br/lovable-uploads/Logo_SOIA.png";

export function coBrandedHeader(partnerLogoUrl?: string | null) {
  const partner = partnerLogoUrl
    ? `<img src="${partnerLogoUrl}" alt="Parceiro" height="38" style="max-height:38px;display:inline-block;vertical-align:middle" />
       <span style="display:inline-block;width:1px;height:34px;background:#334155;margin:0 16px;vertical-align:middle"></span>`
    : "";
  return `
    <div style="background:#0f172a;padding:22px;text-align:center">
      ${partner}
      <img src="${SOIA_LOGO}" alt="SOIA" height="30" style="max-height:30px;display:inline-block;vertical-align:middle" />
    </div>`;
}

export function emailShell(innerHtml: string, partnerLogoUrl?: string | null) {
  return `
  <div style="background:#f1f5f9;padding:32px 12px;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
      ${coBrandedHeader(partnerLogoUrl)}
      <div style="padding:30px 28px;color:#0f172a">${innerHtml}</div>
      <div style="background:#f8fafc;padding:18px;text-align:center;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0">
        SOIA — Canal de Ouvidoria e Gestão de Riscos Psicossociais<br />
        <a href="https://soia.app.br" style="color:#0f766e;text-decoration:none">soia.app.br</a>
      </div>
    </div>
  </div>`;
}

export function itemsTable(rows: [string, string][]) {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:18px 0">
    ${rows
      .map(
        ([label, value], i) =>
          `<tr style="background:${i % 2 === 0 ? "#f8fafc" : "#ffffff"}">
             <td style="padding:10px 12px;color:#475569">${label}</td>
             <td style="padding:10px 12px;text-align:right;font-weight:bold">${value}</td>
           </tr>`,
      )
      .join("")}
  </table>`;
}

export function ctaButton(url: string, label: string) {
  return `<div style="text-align:center;margin:26px 0">
    <a href="${url}" style="background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 30px;border-radius:10px;font-weight:bold;display:inline-block">${label}</a>
  </div>`;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY_1") ?? Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    console.error("[operatorEmail] chaves de e-mail ausentes");
    return false;
  }
  try {
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({ from: "SOIA <noreply@soia.app.br>", to: [to], subject, html }),
    });
    if (!res.ok) {
      console.error("[operatorEmail] falha", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[operatorEmail] erro", err);
    return false;
  }
}
