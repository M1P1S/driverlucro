import { useState, useEffect } from 'react';
import api from '../../services/api';
import Layout from '../../components/Layout';

const MetaDiaria = () => {
  const [metaHoje, setMetaHoje] = useState(null);
  const [historico, setHistorico] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [novaMeta, setNovaMeta] = useState('');

  useEffect(() => {
    buscarDados();
    const interval = setInterval(buscarMetaHoje, 60000);
    return () => clearInterval(interval);
  }, []);

  const buscarDados = async () => {
    setLoading(true);
    try {
      const [metaResp, historicoResp, configResp] = await Promise.all([
        api.get('/metas/hoje'),
        api.get('/metas/historico?dias=30'),
        api.get('/metas/config')
      ]);
      setMetaHoje(metaResp.data);
      setHistorico(historicoResp.data);
      setConfig(configResp.data);
      setNovaMeta(configResp.data.valor_meta_diaria);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const buscarMetaHoje = async () => {
    try {
      const { data } = await api.get('/metas/hoje');
      setMetaHoje(data);
    } catch (err) {
      console.error(err);
    }
  };

  const salvarConfig = async (e) => {
    e.preventDefault();
    try {
      await api.put('/metas/config', {
        valor_meta_diaria: parseFloat(novaMeta),
        considerar_combustivel: config?.considerar_combustivel,
        notificar_whatsapp: config?.notificar_whatsapp
      });
      setShowConfig(false);
      buscarDados();
    } catch (err) {
      console.error(err);
    }
  };

  const getCorPercentual = (p) => {
    if (p >= 100) return { cor: '#68d391', bg: 'rgba(104,211,145,0.1)', border: 'rgba(104,211,145,0.3)' };
    if (p >= 70) return { cor: '#f6ad55', bg: 'rgba(246,173,85,0.1)', border: 'rgba(246,173,85,0.3)' };
    return { cor: '#fc8181', bg: 'rgba(252,129,129,0.1)', border: 'rgba(252,129,129,0.3)' };
  };

  const renderMetaHoje = () => {
    if (!metaHoje) return null;
    const cores = getCorPercentual(metaHoje.percentual);
    const faltam = Math.max(0, Number(metaHoje.valor_meta) - Number(metaHoje.valor_liquido_total));

    return (
      <div style={{ background: cores.bg, border: `2px solid ${cores.border}`, borderRadius: '20px', padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>META DE HOJE</p>
            <p style={{ color: '#fff', fontSize: '42px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>
              R$ {Number(metaHoje.valor_liquido_total).toFixed(2)}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', margin: '6px 0 0 0' }}>
              de R$ {Number(metaHoje.valor_meta).toFixed(2)} de meta
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '52px', fontWeight: '900', color: cores.cor, lineHeight: 1 }}>
              {metaHoje.percentual}%
            </div>
            {metaHoje.bateu_meta && (
              <p style={{ color: '#68d391', fontSize: '14px', fontWeight: '700', margin: '4px 0 0 0' }}>🎉 META BATIDA!</p>
            )}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '10px', marginBottom: '20px' }}>
          <div style={{
            height: '10px', borderRadius: '999px',
            background: `linear-gradient(90deg, ${cores.cor}, ${cores.cor}99)`,
            width: `${metaHoje.percentual}%`,
            transition: 'width 1s ease'
          }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {[
            { label: 'BRUTO HOJE', valor: `R$ ${Number(metaHoje.valor_bruto_total).toFixed(2)}`, icon: '💰' },
            { label: 'COMBUSTÍVEL', valor: `R$ ${Number(metaHoje.custo_combustivel).toFixed(2)}`, icon: '⛽' },
            { label: 'HORAS', valor: `${Number(metaHoje.horas_trabalhadas || 0).toFixed(1)}h`, icon: '⏱️' },
            { label: 'FALTAM', valor: metaHoje.bateu_meta ? '✅ Batida!' : `R$ ${faltam.toFixed(2)}`, icon: '🎯' },
          ].map((item) => (
            <div key={item.label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '12px 14px' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '600', margin: 0, letterSpacing: '0.5px' }}>{item.icon} {item.label}</p>
              <p style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '4px 0 0 0' }}>{item.valor}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHistorico = () => {
    if (!historico || historico.historico.length === 0) return null;

    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
        <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: '700', margin: '0 0 16px 0' }}>📅 Histórico dos últimos 30 dias</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {historico.historico.map((dia) => {
            const perc = dia.valor_meta > 0
              ? Math.min(100, Math.round((dia.valor_liquido_total / dia.valor_meta) * 100))
              : 0;
            const cores = getCorPercentual(perc);
            return (
              <div key={dia.id} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: '16px'
              }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', minWidth: '90px' }}>{dia.data}</span>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '999px', height: '6px' }}>
                  <div style={{ width: `${perc}%`, height: '6px', borderRadius: '999px', background: cores.cor }} />
                </div>
                <span style={{ color: cores.cor, fontSize: '13px', fontWeight: '700', minWidth: '40px', textAlign: 'right' }}>{perc}%</span>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: '700', minWidth: '90px', textAlign: 'right' }}>
                  R$ {Number(dia.valor_liquido_total).toFixed(2)}
                </span>
                <span style={{ fontSize: '16px' }}>{dia.bateu_meta ? '✅' : '❌'}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <style>{`
        .input-dark { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #fff !important; border-radius: 10px !important; padding: 12px 14px !important; width: 100% !important; font-size: 14px !important; box-sizing: border-box !important; }
        .input-dark:focus { border-color: rgba(99,179,237,0.5) !important; outline: none !important; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(99,179,237,0.35) !important; }
        .btn-primary { transition: all 0.2s ease; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>🎯 Meta Diária</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0 0' }}>Acompanhe seu progresso em tempo real</p>
        </div>
        <button onClick={() => setShowConfig(!showConfig)} className="btn-primary" style={{
          background: showConfig ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #63b3ed, #4299e1)',
          border: showConfig ? '1px solid rgba(255,255,255,0.1)' : 'none',
          borderRadius: '10px', padding: '10px 20px',
          color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
        }}>
          {showConfig ? '✕ Cancelar' : '⚙️ Configurar Meta'}
        </button>
      </div>

      {/* Config */}
      {showConfig && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0' }}>⚙️ Configurar Meta Diária</h3>
          <form onSubmit={salvarConfig}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>META DIÁRIA DE LUCRO LÍQUIDO (R$)</label>
                <input
                  type="number"
                  value={novaMeta}
                  onChange={(e) => setNovaMeta(e.target.value)}
                  className="input-dark"
                  placeholder="200.00"
                  step="0.01"
                  required
                />
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: '8px 0 0 0' }}>
                  Valor líquido que você quer ganhar por dia (após taxa da plataforma e combustível).
                </p>
              </div>
              <div>
                <button type="submit" className="btn-primary" style={{
                  width: '100%', background: 'linear-gradient(135deg, #63b3ed, #4299e1)',
                  border: 'none', borderRadius: '10px', padding: '13px',
                  color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer'
                }}>
                  Salvar Meta
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>⏳ Carregando...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {renderMetaHoje()}

          {/* Resumo do mês */}
          {historico && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {[
                { label: 'DIAS TRABALHADOS', valor: historico.resumo.total_dias, icon: '📅', color: '#63b3ed', bg: 'rgba(99,179,237,0.1)', border: 'rgba(99,179,237,0.2)' },
                { label: 'METAS BATIDAS', valor: historico.resumo.dias_batidos, icon: '🏆', color: '#68d391', bg: 'rgba(104,211,145,0.1)', border: 'rgba(104,211,145,0.2)' },
                { label: 'TAXA DE SUCESSO', valor: `${historico.resumo.taxa_sucesso}%`, icon: '📊', color: '#b794f4', bg: 'rgba(183,148,244,0.1)', border: 'rgba(183,148,244,0.2)' },
                { label: 'MÉDIA DIÁRIA', valor: `R$ ${historico.resumo.media_diaria}`, icon: '💰', color: '#f6ad55', bg: 'rgba(246,173,85,0.1)', border: 'rgba(246,173,85,0.2)' },
              ].map((card) => (
                <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: '14px', padding: '16px' }}>
                  <div style={{ fontSize: '22px', marginBottom: '8px' }}>{card.icon}</div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '600', margin: 0, letterSpacing: '0.5px' }}>{card.label}</p>
                  <p style={{ color: card.color, fontSize: '22px', fontWeight: '800', margin: '4px 0 0 0' }}>{card.valor}</p>
                </div>
              ))}
            </div>
          )}

          {renderHistorico()}
        </div>
      )}
    </Layout>
  );
};

export default MetaDiaria;