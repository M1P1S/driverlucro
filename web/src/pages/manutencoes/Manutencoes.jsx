import { useState, useEffect } from 'react';
import api from '../../services/api';
import Layout from '../../components/Layout';

const Manutencoes = () => {
  const [manutencoes, setManutencoes] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [carros, setCarros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    carro_id: '', tipo_manutencao_id: '', tipo_personalizado: '',
    data_realizada: new Date().toISOString().split('T')[0],
    km_realizado: '', custo: '', proxima_data: '',
    proximo_km: '', oficina: '', observacao: ''
  });

  useEffect(() => { buscarDados(); }, []);

  const buscarDados = async () => {
    setLoading(true);
    try {
      const [manResp, alertasResp, tiposResp, carrosResp] = await Promise.all([
        api.get('/manutencoes'),
        api.get('/manutencoes/alertas'),
        api.get('/manutencoes/tipos'),
        api.get('/carros')
      ]);
      setManutencoes(manResp.data);
      setAlertas(alertasResp.data);
      setTipos(tiposResp.data);
      setCarros(carrosResp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/manutencoes', form);
      setShowForm(false);
      setForm({
        carro_id: '', tipo_manutencao_id: '',
        data_realizada: new Date().toISOString().split('T')[0],
        km_realizado: '', custo: '', proxima_data: '',
        proximo_km: '', oficina: '', observacao: ''
      });
      buscarDados();
    } catch (err) {
      console.error(err);
    }
  };

  const deletar = async (id) => {
    if (!confirm('Remover esta manutenção?')) return;
    try { await api.delete(`/manutencoes/${id}`); buscarDados(); }
    catch (err) { console.error(err); }
  };

  const corUrgencia = (u) => {
    if (u === 'atrasado') return { bg: 'rgba(252,129,129,0.1)', border: 'rgba(252,129,129,0.3)', cor: '#fc8181', badge: 'rgba(252,129,129,0.2)' };
    if (u === 'urgente') return { bg: 'rgba(246,173,85,0.1)', border: 'rgba(246,173,85,0.3)', cor: '#f6ad55', badge: 'rgba(246,173,85,0.2)' };
    if (u === 'proximo') return { bg: 'rgba(99,179,237,0.1)', border: 'rgba(99,179,237,0.3)', cor: '#63b3ed', badge: 'rgba(99,179,237,0.2)' };
    return { bg: 'rgba(104,211,145,0.1)', border: 'rgba(104,211,145,0.3)', cor: '#68d391', badge: 'rgba(104,211,145,0.2)' };
  };

  const labelUrgencia = (u) => {
    if (u === 'atrasado') return '🔴 ATRASADO';
    if (u === 'urgente') return '🟠 URGENTE';
    if (u === 'proximo') return '🔵 EM BREVE';
    return '🟢 OK';
  };

  return (
    <Layout>
      <style>{`
        .input-dark { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #fff !important; border-radius: 10px !important; padding: 12px 14px !important; width: 100% !important; font-size: 14px !important; box-sizing: border-box !important; transition: all 0.2s !important; }
        .input-dark:focus { border-color: rgba(99,179,237,0.5) !important; outline: none !important; }
        .input-dark option { background: #1a1d2e; color: #fff; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(99,179,237,0.35) !important; }
        .btn-primary { transition: all 0.2s ease; }
        .item-hover:hover { border-color: rgba(255,255,255,0.15) !important; }
        .item-hover { transition: all 0.2s ease; }
        .btn-delete:hover { color: #fc8181 !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>🔧 ManutençãoCerta</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0 0' }}>Histórico e alertas de manutenção</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{
          background: showForm ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #63b3ed, #4299e1)',
          border: showForm ? '1px solid rgba(255,255,255,0.1)' : 'none',
          borderRadius: '10px', padding: '10px 20px',
          color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
        }}>
          {showForm ? '✕ Cancelar' : '+ Registrar Manutenção'}
        </button>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '0 0 12px 0' }}>⚠️ Alertas Ativos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alertas.map((alerta) => {
              const cores = corUrgencia(alerta.urgencia);
              return (
                <div key={alerta.id} style={{
                  background: cores.bg, border: `1px solid ${cores.border}`,
                  borderRadius: '12px', padding: '14px 18px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{alerta.tipos_manutencao?.icone || '🔧'}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                          {alerta.tipos_manutencao?.nome}
                        </span>
                        <span style={{ background: cores.badge, color: cores.cor, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                          {labelUrgencia(alerta.urgencia)}
                        </span>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>
                        {alerta.carros?.apelido || alerta.carros?.modelo} • {alerta.mensagem}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0' }}>Registrar Manutenção</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>VEÍCULO *</label>
                <select name="carro_id" value={form.carro_id} onChange={handleChange} className="input-dark" required>
                  <option value="">Selecione o carro</option>
                  {carros.map(c => <option key={c.id} value={c.id}>{c.apelido || c.modelo}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>TIPO DE MANUTENÇÃO *</label>
                <select name="tipo_manutencao_id" value={form.tipo_manutencao_id} onChange={handleChange} className="input-dark" required>
                  <option value="">Selecione o tipo</option>
                  {tipos.map(t => <option key={t.id} value={t.id}>{t.icone} {t.nome}</option>)}
                  <option value="outro">✏️ Outro (digitar)</option>
                </select>
              </div>
              {form.tipo_manutencao_id === 'outro' && (
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>DESCREVA A MANUTENÇÃO *</label>
                  <input type="text" name="tipo_personalizado" value={form.tipo_personalizado} onChange={handleChange} className="input-dark" placeholder="Ex: Troca de correia dentada" required />
                </div>
              )}
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>DATA REALIZADA *</label>
                <input type="date" name="data_realizada" value={form.data_realizada} onChange={handleChange} className="input-dark" required />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>KM NA MANUTENÇÃO *</label>
                <input type="number" name="km_realizado" value={form.km_realizado} onChange={handleChange} className="input-dark" placeholder="Ex: 52000" required />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>CUSTO (R$)</label>
                <input type="number" name="custo" value={form.custo} onChange={handleChange} className="input-dark" placeholder="Ex: 250.00" step="0.01" />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>OFICINA</label>
                <input type="text" name="oficina" value={form.oficina} onChange={handleChange} className="input-dark" placeholder="Nome da oficina" />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>PRÓXIMA DATA</label>
                <input type="date" name="proxima_data" value={form.proxima_data} onChange={handleChange} className="input-dark" />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>PRÓXIMO KM</label>
                <input type="number" name="proximo_km" value={form.proximo_km} onChange={handleChange} className="input-dark" placeholder="Ex: 62000" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>OBSERVAÇÃO</label>
                <input type="text" name="observacao" value={form.observacao} onChange={handleChange} className="input-dark" placeholder="Opcional" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="btn-primary" style={{
                  width: '100%', background: 'linear-gradient(135deg, #63b3ed, #4299e1)',
                  border: 'none', borderRadius: '10px', padding: '13px',
                  color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer'
                }}>
                  Salvar Manutenção
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>⏳ Carregando...</div>
      ) : manutencoes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
          <p style={{ fontSize: '48px', margin: '0 0 12px 0' }}>🔧</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', margin: 0 }}>Nenhuma manutenção registrada ainda.</p>
        </div>
      ) : (
        <div>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '0 0 12px 0' }}>📋 Histórico</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {manutencoes.map((m) => (
              <div key={m.id} className="item-hover" style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px', padding: '18px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '28px' }}>{m.tipos_manutencao?.icone || '🔧'}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>{m.tipos_manutencao?.nome}</span>
                      {m.custo && <span style={{ color: '#f6ad55', fontSize: '14px', fontWeight: '600' }}>R$ {Number(m.custo).toFixed(2)}</span>}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: 0 }}>
                      {m.carros?.apelido || m.carros?.modelo} • {m.data_realizada} • {Number(m.km_realizado).toLocaleString()} km
                      {m.oficina ? ` • ${m.oficina}` : ''}
                    </p>
                    {(m.proxima_data || m.proximo_km) && (
                      <p style={{ color: 'rgba(99,179,237,0.7)', fontSize: '12px', margin: '4px 0 0 0' }}>
                        Próxima: {m.proxima_data || ''} {m.proximo_km ? `• ${Number(m.proximo_km).toLocaleString()} km` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => deletar(m.id)} className="btn-delete"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', fontSize: '18px', transition: 'color 0.2s' }}>
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Manutencoes;