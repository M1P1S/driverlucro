import { useState, useEffect } from 'react';
import api from '../../services/api';
import Layout from '../../components/Layout';

const Dashboard = () => {
  const [dados, setDados] = useState(null);
  const [periodo, setPeriodo] = useState('mes');
  const [loading, setLoading] = useState(true);

  useEffect(() => { buscarDados(); }, [periodo]);

  const buscarDados = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/dashboard?periodo=${periodo}`);
      setDados(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cards = dados ? [
    { label: 'Ganho Bruto', valor: `R$ ${Number(dados.total_bruto).toFixed(2)}`, icon: '💰', color: '#63b3ed', bg: 'rgba(99,179,237,0.1)', border: 'rgba(99,179,237,0.2)' },
    { label: 'Ganho Líquido', valor: `R$ ${Number(dados.total_liquido).toFixed(2)}`, icon: '✅', color: '#68d391', bg: 'rgba(104,211,145,0.1)', border: 'rgba(104,211,145,0.2)' },
    { label: 'Combustível', valor: `R$ ${Number(dados.total_combustivel).toFixed(2)}`, icon: '⛽', color: '#f6ad55', bg: 'rgba(246,173,85,0.1)', border: 'rgba(246,173,85,0.2)' },
    { label: 'Lucro Real', valor: `R$ ${Number(dados.lucro_real).toFixed(2)}`, icon: '🏆', color: '#b794f4', bg: 'rgba(183,148,244,0.1)', border: 'rgba(183,148,244,0.2)' },
    { label: 'Horas Trabalhadas', valor: `${Number(dados.total_horas).toFixed(1)}h`, icon: '⏱️', color: '#76e4f7', bg: 'rgba(118,228,247,0.1)', border: 'rgba(118,228,247,0.2)' },
    { label: 'Ganho por Hora', valor: `R$ ${Number(dados.ganho_por_hora).toFixed(2)}`, icon: '📈', color: '#fc8181', bg: 'rgba(252,129,129,0.1)', border: 'rgba(252,129,129,0.2)' },
  ] : [];

  return (
    <Layout>
      <style>{`
        .periodo-btn:hover { background: rgba(99,179,237,0.15) !important; }
        .card-dash { transition: all 0.3s ease; }
        .card-dash:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.4) !important; }
      `}</style>

      {/* Header da página */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>Dashboard</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0 0' }}>Visão geral das suas finanças</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {['hoje', 'semana', 'mes'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className="periodo-btn"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                background: periodo === p ? 'linear-gradient(135deg, #63b3ed, #4299e1)' : 'transparent',
                color: periodo === p ? '#fff' : 'rgba(255,255,255,0.5)',
                boxShadow: periodo === p ? '0 4px 15px rgba(99,179,237,0.3)' : 'none'
              }}
            >
              {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* Meta do dia */}
      {dados?.meta_hoje && (
        <div style={{
          background: dados.meta_hoje.bateu_meta ? 'rgba(104,211,145,0.1)' : 'rgba(246,173,85,0.1)',
          border: `1px solid ${dados.meta_hoje.bateu_meta ? 'rgba(104,211,145,0.3)' : 'rgba(246,173,85,0.3)'}`,
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <p style={{ color: '#fff', fontWeight: '700', fontSize: '16px', margin: 0 }}>
                {dados.meta_hoje.bateu_meta ? '🎉 Meta do dia batida!' : '🎯 Meta do dia'}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '4px 0 0 0' }}>
                R$ {Number(dados.meta_hoje.valor_liquido_total).toFixed(2)} de R$ {Number(dados.meta_hoje.valor_meta).toFixed(2)}
              </p>
            </div>
            <span style={{ fontSize: '32px', fontWeight: '800', color: dados.meta_hoje.bateu_meta ? '#68d391' : '#f6ad55' }}>
              {dados.meta_hoje.bateu_meta ? '✅' : `${Math.min(100, Math.round((dados.meta_hoje.valor_liquido_total / dados.meta_hoje.valor_meta) * 100))}%`}
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '6px' }}>
            <div style={{
              height: '6px',
              borderRadius: '999px',
              background: dados.meta_hoje.bateu_meta ? '#68d391' : '#f6ad55',
              width: `${Math.min(100, (dados.meta_hoje.valor_liquido_total / dados.meta_hoje.valor_meta) * 100)}%`,
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)', fontSize: '16px' }}>
          ⏳ Carregando...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {cards.map((card) => (
            <div key={card.label} className="card-dash" style={{
              background: card.bg,
              border: `1px solid ${card.border}`,
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{card.icon}</div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{card.label}</p>
              <p style={{ color: card.color, fontSize: '22px', fontWeight: '800', margin: '6px 0 0 0', letterSpacing: '-0.5px' }}>{card.valor}</p>
            </div>
          ))}
        </div>
      )}

      {/* Resumo */}
      {dados && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '20px 24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: '700', margin: '0 0 12px 0' }}>📊 Resumo do período</h3>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>CORRIDAS</p>
              <p style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: '4px 0 0 0' }}>{dados.total_corridas}</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>PERÍODO</p>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '4px 0 0 0' }}>{dados.data_inicio} → {dados.data_fim}</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;