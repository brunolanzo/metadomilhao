import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { email, familyName, invitedByName } = await request.json();

  if (!email || !familyName) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const appUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const { error } = await resend.emails.send({
    from: 'Meta do Milhão <onboarding@resend.dev>',
    to: email,
    subject: `Você foi convidado para a família "${familyName}" no Meta do Milhão`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #1A1A1A; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: #FFD700; border-radius: 50%; line-height: 48px; font-size: 24px; font-weight: bold; color: #1A1A1A;">M</div>
        </div>
        <h1 style="color: #FFD700; font-size: 20px; text-align: center; margin: 0 0 8px;">Meta do Milhão</h1>
        <p style="color: #E5E5E5; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 24px;">
          <strong style="color: #FFFFFF;">${invitedByName || 'Alguém'}</strong> convidou você para participar da família
          <strong style="color: #FFFFFF;">"${familyName}"</strong> no Meta do Milhão.
        </p>
        <p style="color: #A3A3A3; font-size: 14px; line-height: 1.5; text-align: center; margin: 0 0 32px;">
          Crie sua conta gratuita para gerenciar as finanças da família juntos.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${appUrl}/register" style="display: inline-block; background: #FFD700; color: #1A1A1A; font-weight: 600; font-size: 15px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
            Criar minha conta
          </a>
        </div>
        <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
          Use o email <strong>${email}</strong> para se cadastrar e ser adicionado automaticamente à família.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('Resend error:', error);
    return NextResponse.json({ error: 'Falha ao enviar email' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
