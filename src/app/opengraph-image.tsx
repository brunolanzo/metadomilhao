import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Meta do Milhão - Controle Financeiro Familiar';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: '#FFD700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#000',
            }}
          >
            M
          </div>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#FFFFFF',
            }}
          >
            Meta do Milhão
          </span>
        </div>
        <div
          style={{
            fontSize: '28px',
            color: '#FFD700',
            fontWeight: 'bold',
            marginBottom: '16px',
          }}
        >
          Controle Financeiro Familiar
        </div>
        <div
          style={{
            fontSize: '20px',
            color: '#9CA3AF',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: '1.6',
          }}
        >
          100% gratuito. Dashboard com gráficos, categorias, metas e gestão familiar.
        </div>
        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginTop: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#22C55E',
              fontSize: '18px',
            }}
          >
            ✓ Gratuito
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#22C55E',
              fontSize: '18px',
            }}
          >
            ✓ Seguro
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#22C55E',
              fontSize: '18px',
            }}
          >
            ✓ Familiar
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            fontSize: '16px',
            color: '#6B7280',
          }}
        >
          metadomilhao.com.br
        </div>
      </div>
    ),
    { ...size }
  );
}
