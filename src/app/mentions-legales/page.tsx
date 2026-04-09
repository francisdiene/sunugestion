import Link from 'next/link'

const card = {
  background: '#fff',
  borderRadius: 14,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  padding: 'clamp(20px, 3vw, 32px)',
  border: '1px solid #eef2f4',
}

export default function MentionsLegalesPage() {
  return (
    <main style={{ minHeight: '100dvh', background: '#f8f9fa', padding: '20px 14px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/auth/login" style={{ color: '#1d9e75', textDecoration: 'none', fontSize: 13 }}>← Retour connexion</Link>
        </div>

        <section style={card} className="sg-fade-up">
          <h1 style={{ fontSize: 'clamp(24px,4vw,34px)', marginBottom: 8, color: '#0a1628' }}>Mentions légales</h1>
          <p style={{ color: '#667', lineHeight: 1.7, marginBottom: 16 }}>
            Informations légales relatives à l'éditeur de la plateforme SunuGestion.
          </p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>Éditeur</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>
            Francis Tech<br />
            Dakar, Sénégal<br />
            Email: francoisdiene306@gmail.com
          </p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>Directeur de publication</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>Francis Tech / Responsable du service.</p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>Hébergement</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>Infrastructure technique selon l'environnement de déploiement du client.</p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>Données personnelles</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>
            Les données collectées sont utilisées pour la fourniture du service et le support.
            Le client peut demander rectification/suppression selon la réglementation applicable.
          </p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>Propriété intellectuelle</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>
            Les contenus, marques et composants logiciels de SunuGestion sont protégés.
          </p>
        </section>
      </div>
    </main>
  )
}
