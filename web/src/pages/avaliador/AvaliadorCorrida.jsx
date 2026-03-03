import { useState, useEffect } from 'react';
import api from '../../services/api';
import Layout from '../../components/Layout';

const PLATAFORMAS = [
  { value: 'uber', label: 'Uber', taxa: 25, cor: '#1a1a1a', bg: '#fff' },
  { value: '99', label: '99', taxa: 25, cor: '#fff', bg: '#f5a623' },
  { value: 'indriver', label: 'InDriver', taxa: 20, cor: '#fff', bg: '#1db954' },
  { value: 'cabify', label: 'Cabify', taxa: 25, cor: '#fff', bg: '#7c3aed' },
  { value: 'ladydriver', label: 'LadyDriver', taxa: 20, cor: '#fff', bg: '#ec4899' },
];

const AvaliadorCorrida = () => {
  const [form, setForm] = useState({
    plataforma: 'uber',
    distancia_km: '',
    tempo_estimado_min: '',
    valor_ofertado: '',
    preco_combustivel: '',
    km_por_litro: '',
  });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [historico, setHistorico] = useState([]);
  const [showHistorico, setShowHistorico] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarConfig();
    carregarHistorico();
  }, []);

  const carregarConfig = async () => {
    setLoadingConfig(true);
    try {
      const { data } = await api.get('/avaliador/config');
      setForm(prev => ({
        ...prev,
        preco_combustivel: data.preco_combustivel_sugerido || '',
        km_por_litro: data.km_por_litro_sugerido || '',
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const carregarHistorico = async () => {
    try {
      const { data } = await api.get('/avaliador/historico');
      setHistorico(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'plataforma') {
      const plat = PLATAFORMAS.find(p => p.value === value);
      setForm(prev => ({ ...prev, plataforma: value }));
      // Reseta resultado ao trocar plataforma
      setResultado(null);
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
      setResultado(null);
    }
  };

  const handleAvaliar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResultado(null);
    try {
      const { data } = await api.post('/avaliador/avaliar', {
        ...form,
        distancia_km: Number(form.distancia_km),
        tempo_estimado_min: Number(form.tempo_estimado_min),
        valor_ofertado: Number(form.valor_ofertado),
        preco_combustivel: Number(form.preco_combustivel),
        km_por_litro: Number(form.km_por_litro),
        salvar_historico: false,
      });
      setResultado(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const salvarNoHistorico = async () => {
    if (!resultado) return;
    setSalvando(true);
    try {
      await api.post('/avaliador/avaliar', {
        ...form,
        distancia_km: Number(form.distancia_km),
        tempo_estimado_min: Number(form.tempo_estimado_min),
        valor_ofertado: Number(form.valor_ofertado),
        preco_combustivel: Number(form.preco_combustivel),
        km_por_litro: Number(form.km_por_litro),
        salvar_historico: true,
      });
      await carregarHistorico();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const getVeredictoStyle = (veredicto) => {
    switch (veredicto) {
      case 'ACEITAR':
        return { bg: 'rgba(72,187,120,0.15)', border: 'rgba(72,187,120,0.4)', cor: '#68d391', icone: '✅' };
      case 'AVALIAR':
        return { bg: 'rgba(237,137,54,0.15)', border: 'rgba(237,137,54,0.4)', cor: '#f6ad55', icone: '⚠️' };
      case 'REJEITAR':
        return { bg: 'rgba(245,101,101,0.15)', border: 'rgba(245,101,101,0.4)', cor: '#fc8181', icone: '❌' };
      default:
        return { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', cor: '#fff', icone: '❓' };
    }
  };

  const getMotivoStyle = (tipo) => {
    switch (tipo) {
      case 'positivo': return { cor: '#68d391', icone: '✓' };
      case 'negativo': return { cor: '#fc8181', icone: '✗' };
      default: return { cor: '#f6ad55', icone: '!' };
    }
  };

  const plataformaSelecionada = PLATAFORMAS.find(p => p.value === form.plataforma);

  return (
    <Layout>
      <style>{`
        .input-dark { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #fff !important; border-radius: 10px !important; padding: 12px 14px !important; width: 100% !important; font-size: 14px !important; transition: all 0.2s ease !important; box-sizing: border-box !important; }
        .input-dark:focus { border-color: rgba(99,179,237,0.5) !important; outline: none !important; background: rgba(99,179,237,0.05) !important; }
        .input-dark option { background: #1a1d2e; color: #fff; }
        .btn-avaliar:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(99,179,237,0.35) !important; }
        .btn-avaliar { transition: all 0.2s ease; }
        .hist-item:hover { border-color: rgba(99,179,237,0.3) !important; }
        .hist-item { transition: border-color 0.2s; }
        .plat-btn { transition: all 0.2s ease; cursor: pointer; }
        .plat-btn:hover { transform: translateY(-2px); }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
            🚦 Avaliador de Corrida
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0 0' }}>
            Descubra se a corrida vale a pena antes de aceitar
          </p>
        </div>
        <button
          onClick={() => setShowHistorico(!showHistorico)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', padding: '10px 16px',
            color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer'
          }}
        >
          📋 Histórico ({historico.length})
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: resultado ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* Formulário */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0' }}>
            Dados da Corrida
          </h3>

          {/* Seletor de plataforma visual */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '10px', letterSpacing: '0.5px' }}>
              PLATAFORMA
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PLATAFORMAS.map(p => (
                <button
                  key={p.value}
                  className="plat-btn"
                  onClick={() => handleChange({ target: { name: 'plataforma', value: p.value } })}
                  style={{
                    background: form.plataforma === p.value ? p.bg : 'rgba(255,255,255,0.05)',
                    color: form.plataforma === p.value ? p.cor : 'rgba(255,255,255,0.5)',
                    border: `2px solid ${form.plataforma === p.value ? p.bg : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '20px',
                    padding: '6px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '6px 0 0 0' }}>
              Taxa {plataformaSelecionada?.taxa}% será aplicada automaticamente
            </p>
          </div>

          <form onSubmit={handleAvaliar}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  VALOR OFERTADO (R$)
                </label>
                <input
                  type="number" name="valor_ofertado" value={form.valor_ofertado}
                  onChange={handleChange} className="input-dark"
                  placeholder="Ex: 12.50" step="0.01" min="0" required
                />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  DISTÂNCIA (km)
                </label>
                <input
                  type="number" name="distancia_km" value={form.distancia_km}
                  onChange={handleChange} className="input-dark"
                  placeholder="Ex: 8.5" step="0.1" min="0" required
                />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  TEMPO ESTIMADO (min)
                </label>
                <input
                  type="number" name="tempo_estimado_min" value={form.tempo_estimado_min}
                  onChange={handleChange} className="input-dark"
                  placeholder="Ex: 20" min="1" required
                />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  PREÇO COMBUSTÍVEL (R$/L)
                </label>
                <input
                  type="number" name="preco_combustivel" value={form.preco_combustivel}
                  onChange={handleChange} className="input-dark"
                  placeholder="Ex: 6.20" step="0.01" min="0" required
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  CONSUMO DO VEÍCULO (km/L)
                  {loadingConfig && <span style={{ color: 'rgba(99,179,237,0.6)', marginLeft: '8px' }}>Carregando dados do veículo...</span>}
                </label>
                <input
                  type="number" name="km_por_litro" value={form.km_por_litro}
                  onChange={handleChange} className="input-dark"
                  placeholder="Ex: 10.5" step="0.1" min="0" required
                />
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '4px 0 0 0' }}>
                  Preenchido automaticamente com base nos seus abastecimentos
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="btn-avaliar"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '20px',
                background: loading ? 'rgba(99,179,237,0.3)' : 'linear-gradient(135deg, #63b3ed, #4299e1)',
                border: 'none', borderRadius: '10px', padding: '14px',
                color: '#fff', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Analisando...' : '🔍 Avaliar Corrida'}
            </button>
          </form>
        </div>

        {/* Resultado */}
        {resultado && (() => {
          const vs = getVeredictoStyle(resultado.veredicto);
          const d = resultado.detalhes;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Veredicto principal */}
              <div style={{
                background: vs.bg,
                border: `2px solid ${vs.border}`,
                borderRadius: '16px', padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>{vs.icone}</div>
                <div style={{ color: vs.cor, fontSize: '32px', fontWeight: '900', letterSpacing: '1px' }}>
                  {resultado.veredicto}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '6px' }}>
                  Pontuação: {resultado.pontuacao}/100
                </div>
                {/* Barra de pontuação */}
                <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '6px' }}>
                  <div style={{
                    width: `${resultado.pontuacao}%`,
                    height: '100%',
                    background: vs.cor,
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>

                <button
                  onClick={salvarNoHistorico}
                  disabled={salvando}
                  style={{
                    marginTop: '16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px', padding: '8px 16px',
                    color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  {salvando ? '...' : '📋 Salvar no histórico'}
                </button>
              </div>

              {/* Números da corrida */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px', padding: '18px'
              }}>
                <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: '700', margin: '0 0 14px 0' }}>Detalhes Financeiros</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Valor Bruto', valor: `R$ ${Number(d.valor_ofertado).toFixed(2)}`, cor: '#fff' },
                    { label: `Taxa ${d.plataforma} (${d.taxa_percentual}%)`, valor: `- R$ ${d.desconto_plataforma.toFixed(2)}`, cor: '#fc8181' },
                    { label: 'Custo Combustível', valor: `- R$ ${d.custo_combustivel.toFixed(2)}`, cor: '#f6ad55' },
                    { label: 'Lucro Líquido', valor: `R$ ${d.valor_liquido.toFixed(2)}`, cor: d.valor_liquido >= 0 ? '#68d391' : '#fc8181' },
                    { label: 'Ganho por Hora', valor: `R$ ${d.ganho_por_hora.toFixed(2)}/h`, cor: '#63b3ed' },
                    { label: 'Ganho por Km', valor: `R$ ${d.ganho_por_km.toFixed(2)}/km`, cor: '#63b3ed' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px', padding: '10px 12px'
                    }}>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '2px' }}>{item.label}</div>
                      <div style={{ color: item.cor, fontSize: '15px', fontWeight: '700' }}>{item.valor}</div>
                    </div>
                  ))}
                </div>
                {d.ganho_medio_por_hora_historico > 0 && (
                  <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(99,179,237,0.05)', borderRadius: '10px', border: '1px solid rgba(99,179,237,0.15)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Sua média histórica: </span>
                    <span style={{ color: '#63b3ed', fontSize: '13px', fontWeight: '700' }}>R$ {d.ganho_medio_por_hora_historico.toFixed(2)}/h</span>
                  </div>
                )}
              </div>

              {/* Motivos */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px', padding: '18px'
              }}>
                <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: '700', margin: '0 0 12px 0' }}>Análise Detalhada</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {resultado.motivos.map((m, i) => {
                    const ms = getMotivoStyle(m.tipo);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span style={{ color: ms.cor, fontWeight: '700', fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>{ms.icone}</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.5' }}>{m.texto}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Histórico */}
      {showHistorico && (
        <div style={{
          marginTop: '32px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0' }}>
            Histórico de Avaliações
          </h3>
          {historico.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px' }}>
              Nenhuma avaliação salva ainda
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {historico.map((h) => {
                const vs = getVeredictoStyle(h.veredicto);
                const plat = PLATAFORMAS.find(p => p.value === h.plataforma);
                return (
                  <div key={h.id} className="hist-item" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px', padding: '14px 16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        background: plat?.bg || '#4a5568', color: plat?.cor || '#fff',
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700'
                      }}>{plat?.label || h.plataforma}</span>
                      <div>
                        <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>
                          R$ {Number(h.valor_ofertado).toFixed(2)}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginLeft: '8px' }}>
                          {h.distancia_km}km • {h.tempo_estimado_min}min
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#68d391', fontSize: '13px', fontWeight: '600' }}>
                        R$ {Number(h.valor_liquido).toFixed(2)} líq.
                      </span>
                      <span style={{
                        background: vs.bg, color: vs.cor,
                        border: `1px solid ${vs.border}`,
                        padding: '3px 10px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: '700'
                      }}>
                        {h.veredicto}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>
                        {new Date(h.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default AvaliadorCorrida;
