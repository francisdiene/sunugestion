import Link from 'next/link'

const card = {
  background: '#fff',
  borderRadius: 14,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  padding: 'clamp(20px, 3vw, 32px)',
  border: '1px solid #eef2f4',
}

export default function CcvPage() {
  return (
    <main style={{ minHeight: '100dvh', background: '#f8f9fa', padding: '20px 14px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/auth/login" style={{ color: '#1d9e75', textDecoration: 'none', fontSize: 13 }}>← Retour connexion</Link>
        </div>

        <section style={card} className="sg-fade-up">
          <h1 style={{ fontSize: 'clamp(24px,4vw,34px)', marginBottom: 8, color: '#0a1628' }}>Conditions commerciales de vente (CCV)</h1>
          <p style={{ color: '#667', lineHeight: 1.7, marginBottom: 16 }}>
            Ces conditions encadrent l'usage de SunuGestion (abonnement SaaS) entre Francis Tech et le client professionnel.
          </p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>1. Objet</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>Fourniture d'un accès logiciel en ligne pour la gestion commerciale, stock et comptabilité.</p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>2. Tarifs et paiement</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>Les prix sont indiqués en XOF, facturés selon le plan choisi. Le défaut de paiement peut suspendre l'accès.</p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>3. Durée et résiliation</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>Abonnement sans engagement long terme sauf mention contraire. Résiliation possible à échéance mensuelle.</p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>4. Disponibilité du service</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>Francis Tech met en oeuvre les moyens raisonnables pour assurer la continuité, hors maintenance et cas de force majeure.</p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>5. Responsabilité</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>Le client reste responsable des données saisies et de l'usage métier fait de la plateforme.</p>

          <h2 style={{ fontSize: 18, margin: '14px 0 8px' }}>6. Support</h2>
          <p style={{ color: '#556', lineHeight: 1.7 }}>Support fonctionnel via les canaux communiqués par Francis Tech, selon le plan souscrit.</p>
        </section>
      </div>
    </main>
  )
}
