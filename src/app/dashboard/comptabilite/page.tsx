'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'

interface Ecriture {
  id: string
  date_ecriture: string
  journal: string
  compte_numero: string
  compte_intitule: string
  libelle: string
  debit: number
  credit: number
  piece_ref: string
}

interface CompteBalance {
  numero: string
  intitule: string
  classe: number
  total_debit: number
  total_credit: number
  solde: number
}

interface PlanCompte {
  id: string
  numero: string
  intitule: string
  classe: number
  type: string
}

const JOURNAUX: Record<string, { label: string; color: string; bg: string }> = {
  VT: { label: 'Ventes',    color: '#185FA5', bg: '#e6f1fb' },
  AC: { label: 'Achats',    color: '#534AB7', bg: '#eeedfe' },
  CA: { label: 'Caisse',    color: '#0f6e56', bg: '#e8f8f2' },
  BQ: { label: 'Banque',    color: '#BA7517', bg: '#faeeda' },
  OD: { label: 'Op. div.',  color: '#5F5E5A', bg: '#f1efe8' },
  SA: { label: 'Salaires',  color: '#D85A30', bg: '#faece7' },
  IM: { label: 'Immob.',    color: '#791F1F', bg: '#fcebeb' },
}

export default function ComptabilitePage() {
  const [ecritures, setEcritures]     = useState<Ecriture[]>([])
  const [balance, setBalance]         = useState<CompteBalance[]>([])
  const [planComptes, setPlanComptes] = useState<PlanCompte[]>([])
  const [activeTab, setActiveTab]     = useState<'journal' | 'balance' | 'plan'>('journal')
  const [loading, setLoading]         = useState(true)
  const [filtreJournal, setFiltreJournal] = useState('')
  const [dateDebut, setDateDebut]     = useState('')
  const [dateFin, setDateFin]         = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/comptabilite').then(r => r.json()),
      fetch('/api/comptabilite/balance').then(r => r.json()),
      fetch('/api/comptabilite/plan').then(r => r.json()),
    ]).then(([journal, bal, plan]) => {
      if (journal.data)    setEcritures(journal.data)
      if (journal.balance) {
        // on n'a pas encore /balance — on calcule depuis les écritures
      }
      if (bal.data)  setBalance(bal.data)
      if (plan.data) setPlanComptes(plan.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function reloadJournal() {
    const params = new URLSearchParams()
    if (filtreJournal) params.set('journal', filtreJournal)
    if (dateDebut)     params.set('date_debut', dateDebut)
    if (dateFin)       params.set('date_fin', dateFin)
    fetch(`/api/comptabilite?${params}`).then(r => r.json()).then(d => {
      if (d.data) setEcritures(d.data)
    })
  }

  useEffect(() => { reloadJournal() }, [filtreJournal, dateDebut, dateFin])

  const totalDebit  = ecritures.reduce((s, e) => s + Number(e.debit  || 0), 0)
  const totalCredit = ecritures.reduce((s, e) => s + Number(e.credit || 0), 0)
  const equilibre   = Math.abs(totalDebit - totalCredit) < 0.01

  const inp = { padding: '8px 12px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 12, outline: 'none' }
  const tabs = [
    { key: 'journal', label: 'Journal général' },
    { key: 'balance', label: 'Balance des comptes' },
    { key: 'plan',    label: 'Plan comptable SYSCOHADA' },
  ] as const

  return (
    <DashboardLayout title="Comptabilité SYSCOHADA" subtitle="Journal, balance et plan comptable">

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', padding: 6, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', maxWidth: '100%', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: activeTab === t.key ? '#0a1628' : 'transparent',
            color: activeTab === t.key ? '#fff' : '#666',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── JOURNAL ───────────────────────────────────────────── */}
      {activeTab === 'journal' && (
        <>
          {/* Filtres */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={filtreJournal} onChange={e => setFiltreJournal(e.target.value)} style={{ ...inp }}>
              <option value="">Tous les journaux</option>
              {Object.entries(JOURNAUX).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={{ ...inp }} />
            <span style={{ fontSize: 12, color: '#aaa' }}>→</span>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} style={{ ...inp }} />
            <button onClick={() => { setFiltreJournal(''); setDateDebut(''); setDateFin('') }} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid #e0e0e0', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#888' }}>
              Réinitialiser
            </button>
            <button onClick={() => window.print()} style={{ padding: '8px 14px', borderRadius: 7, border: 'none', background: '#0a1628', color: '#fff', fontSize: 12, cursor: 'pointer', marginLeft: 'auto' }}>
              Exporter PDF
            </button>
          </div>

          {/* Table journal */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#ccc', fontSize: 13 }}>Chargement…</div>
            ) : ecritures.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#ccc' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>◌</div>
                <p>Aucune écriture comptable</p>
                <p style={{ fontSize: 12, marginTop: 6 }}>Les écritures sont générées automatiquement lors de la validation des ventes</p>
              </div>
            ) : (
              <>
                <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fafafa' }}>
                      {['Date', 'Journal', 'N° Compte', 'Intitulé', 'Libellé', 'Débit', 'Crédit'].map(h => (
                        <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ecritures.map((e, i) => {
                      const j = JOURNAUX[e.journal] || { label: e.journal, color: '#888', bg: '#f1efe8' }
                      return (
                        <tr key={e.id} style={{ borderTop: '1px solid #f7f7f7' }}>
                          <td style={{ padding: '11px 14px', fontSize: 12, color: '#888' }}>
                            {new Date(e.date_ecriture).toLocaleDateString('fr-FR')}
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: j.bg, color: j.color }}>{e.journal}</span>
                          </td>
                          <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#0a1628' }}>{e.compte_numero}</td>
                          <td style={{ padding: '11px 14px', fontSize: 12, color: '#555', maxWidth: 160, overflowX: 'auto', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.compte_intitule}</td>
                          <td style={{ padding: '11px 14px', fontSize: 12, color: '#888', maxWidth: 200, overflowX: 'auto', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.libelle}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: Number(e.debit) > 0 ? 700 : 400, color: Number(e.debit) > 0 ? '#185FA5' : '#ddd', textAlign: 'right' }}>
                            {Number(e.debit) > 0 ? Number(e.debit).toLocaleString('fr-FR') : '—'}
                          </td>
                          <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: Number(e.credit) > 0 ? 700 : 400, color: Number(e.credit) > 0 ? '#1d9e75' : '#ddd', textAlign: 'right' }}>
                            {Number(e.credit) > 0 ? Number(e.credit).toLocaleString('fr-FR') : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#fafafa', borderTop: '2px solid #e8e8e8' }}>
                      <td colSpan={5} style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700 }}>TOTAUX ({ecritures.length} écritures)</td>
                      <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 700, color: '#185FA5', textAlign: 'right' }}>{totalDebit.toLocaleString('fr-FR')} XOF</td>
                      <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 700, color: '#1d9e75', textAlign: 'right' }}>{totalCredit.toLocaleString('fr-FR')} XOF</td>
                    </tr>
                    <tr style={{ background: equilibre ? '#e8f8f2' : '#faece7' }}>
                      <td colSpan={7} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: equilibre ? '#0f6e56' : '#D85A30', textAlign: 'center' }}>
                        {equilibre ? '✓ Journal équilibré — Débit = Crédit' : `⚠ Déséquilibre : ${Math.abs(totalDebit - totalCredit).toLocaleString('fr-FR')} XOF`}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </>
            )}
          </div>
        </>
      )}

      {/* ── BALANCE ───────────────────────────────────────────── */}
      {activeTab === 'balance' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
          {balance.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#ccc' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>◌</div>
              <p>Aucune balance disponible — enregistre des ventes d'abord</p>
            </div>
          ) : (
            <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0a1628' }}>
                  {['N° Compte', 'Intitulé', 'Classe', 'Total Débit', 'Total Crédit', 'Solde'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: h.includes('Total') || h === 'Solde' ? 'right' : 'left', fontSize: 10, fontWeight: 600, color: '#fff', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {balance.map((c, i) => (
                  <tr key={c.numero} style={{ borderTop: '1px solid #f7f7f7', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#0a1628' }}>{c.numero}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#555' }}>{c.intitule}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#888', textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: '#e6f1fb', color: '#185FA5', fontWeight: 600 }}>Cl. {c.classe}</span>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#185FA5', fontWeight: 600, textAlign: 'right' }}>{Number(c.total_debit).toLocaleString('fr-FR')}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#1d9e75', fontWeight: 600, textAlign: 'right' }}>{Number(c.total_credit).toLocaleString('fr-FR')}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: Number(c.solde) >= 0 ? '#185FA5' : '#D85A30', textAlign: 'right' }}>
                      {Number(c.solde).toLocaleString('fr-FR')} XOF
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── PLAN COMPTABLE ────────────────────────────────────── */}
      {activeTab === 'plan' && (
        <div>
          {[1,2,3,4,5,6,7,8].map(classe => {
            const comptes = planComptes.filter(c => c.classe === classe)
            if (comptes.length === 0) return null
            const classeLabels: Record<number, string> = {
              1: 'Ressources durables', 2: 'Actif immobilisé', 3: 'Stocks',
              4: 'Tiers', 5: 'Trésorerie', 6: 'Charges', 7: 'Produits', 8: 'Autres'
            }
            return (
              <div key={classe} style={{ marginBottom: 16 }}>
                <div style={{ background: '#0a1628', borderRadius: '8px 8px 0 0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ background: '#1d9e75', color: '#fff', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>Classe {classe}</span>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{classeLabels[classe]}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginLeft: 'auto' }}>{comptes.length} comptes</span>
                </div>
                <div style={{ background: '#fff', borderRadius: '0 0 8px 8px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse' }}>
                    <tbody>
                      {comptes.map((c, i) => (
                        <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid #f7f7f7' : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '9px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#0a1628', width: 100 }}>{c.numero}</td>
                          <td style={{ padding: '9px 16px', fontSize: 13, color: '#444' }}>{c.intitule}</td>
                          <td style={{ padding: '9px 16px', textAlign: 'right' }}>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: c.type === 'actif' || c.type === 'charge' ? '#e6f1fb' : '#e8f8f2', color: c.type === 'actif' || c.type === 'charge' ? '#185FA5' : '#0f6e56' }}>
                              {c.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
