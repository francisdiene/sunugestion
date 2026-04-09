import Link from 'next/link'

const card = {
  background: '#fff',
  borderRadius: 14,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  padding: 'clamp(20px, 3vw, 32px)',
  border: '1px solid #eef2f4',
}

export default function PolitiqueConfidentialitePage() {
  return (
    <main style={{ minHeight: '100dvh', background: '#f8f9fa', padding: '20px 14px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/auth/login" style={{ color: '#1d9e75', textDecoration: 'none', fontSize: 13 }}>← Retour connexion</Link>
        </div>

        <section style={card} className="sg-fade-up">
          <h1 style={{ fontSize: 'clamp(24px,4vw,34px)', marginBottom: 8, color: '#0a1628' }}>Politique de confidentialité</h1>
          <p style={{ color: '#667', lineHeight: 1.7, marginBottom: 16 }}>
            Cette politique explique comment SunuGestion collecte, utilise et protège les données.
          </p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>1. Données collectées</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>
            Données de compte (nom, email, téléphone), données opérationnelles (produits, ventes, clients), et données techniques nécessaires au fonctionnement.
          </p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>2. Finalités</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>
            Exploitation de la plateforme, support, sécurité, amélioration du service et respect des obligations légales.
          </p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>3. Conservation</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>
            Les données sont conservées pendant la durée du contrat puis archivées/supprimées selon les obligations applicables.
          </p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>4. Sécurité</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>
            SunuGestion met en place des mesures techniques et organisationnelles raisonnables pour protéger les données.
          </p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>5. Vos droits</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>
            Accès, rectification, suppression, opposition selon la réglementation applicable. Contact: francoisdiene306@gmail.com
          </p>
        </section>
      </div>
    </main>
  )
}
