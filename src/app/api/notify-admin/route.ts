import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const ADMIN_EMAIL = 'admin.metadomilhao@gmail.com';

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Email não configurado' }, { status: 500 });
  }

  const { userName, userEmail } = await request.json();

  if (!userName || !userEmail) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
  }

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: 'Meta do Milhão <noreply@metadomilhao.com.br>',
      to: ADMIN_EMAIL,
      subject: `Novo cadastro: ${userName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #D4A800;">Novo usuário cadastrado!</h2>
          <div style="background: #1A1A1A; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="color: #fff; margin: 4px 0;"><strong>Nome:</strong> ${userName}</p>
            <p style="color: #fff; margin: 4px 0;"><strong>Email:</strong> ${userEmail}</p>
            <p style="color: #888; margin: 4px 0;"><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <p style="color: #888; font-size: 12px;">Meta do Milhão — Painel Admin</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 });
  }
}
