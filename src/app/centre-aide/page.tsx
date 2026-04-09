import Link from 'next/link'

const card = {
  background: '#fff',
  borderRadius: 14,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  padding: 'clamp(20px, 3vw, 32px)',
  border: '1px solid #eef2f4',
}

export default function CentreAidePage() {
  return (
    <main style={{ minHeight: '100dvh', background: '#f8f9fa', padding: '20px 14px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/auth/login" style={{ color: '#1d9e75', textDecoration: 'none', fontSize: 13 }}>← Retour connexion</Link>
        </div>

        <section style={{ ...card, marginBottom: 14 }} className="sg-fade-up">
          <h1 style={{ fontSize: 'clamp(24px,4vw,34px)', marginBottom: 8, color: '#0a1628' }}>Centre d'aide SunuGestion</h1>
          <p style={{ color: '#667', lineHeight: 1.7 }}>
            Retrouvez les réponses rapides pour la connexion, la gestion du catalogue, les ventes, le stock et la comptabilité.
          </p>
        </section>

        <section style={{ ...card, marginBottom: 14 }} className="sg-fade-up">
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Démarrage rapide</h2>
          <ul style={{ color: '#445', lineHeight: 1.8, paddingLeft: 18 }}>
            <li>Créez votre compte via la page d'inscription.</li>
            <li>Ajoutez vos produits et activez <strong>partage catalogue</strong>.</li>
            <li>Publiez votre catalogue et recevez des demandes de devis.</li>
            <li>Transformez les prospects en clients depuis le module Clients.</li>
          </ul>
        </section>

        <section style={card} className="sg-fade-up">
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>FAQ</h2>
          {[
            ['Je ne reçois pas le mail de réinitialisation', 'Vérifiez vos spams et la configuration SMTP dans .env.local.'],
            ['Comment partager le catalogue ?', 'Ouvrez /catalogue/[slug] puis utilisez le bouton Partager en haut de page.'],
            ['Comment gérer les catégories ?', 'Attribuez une catégorie à chaque produit, le catalogue les groupe automatiquement.'],
            ['Où voir les demandes de devis ?', 'Dans Dashboard > Clients, bloc Prospects catalogue.'],
          ].map(([q, a]) => (
            <div key={q} style={{ padding: '12px 0', borderTop: '1px solid #f0f0f0' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{q}</div>
              <div style={{ color: '#667', lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
