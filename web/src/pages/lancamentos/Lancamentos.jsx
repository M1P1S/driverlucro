import { useState, useEffect } from 'react';
import api from '../../services/api';
import Layout from '../../components/Layout';

const PLATAFORMAS = [
  { value: 'uber', label: 'Uber', color: '#000', bg: '#fff' },
  { value: '99', label: '99', color: '#fff', bg: '#f5a623' },
  { value: 'indriver', label: 'InDriver', color: '#fff', bg: '#1db954' },
  { value: 'cabify', label: 'Cabify', color: '#fff', bg: '#7c3aed' },
  { value: 'ladydriver', label: 'LadyDriver', color: '#fff', bg: '#ec4899' },
];

const Lancamentos = () => {
  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    plataforma: 'uber', data: new Date().toISOString().split('T')[0],
    valor_bruto: '', taxa_percentual: '25', horas_trabalhadas: '', corridas: '', observacao: ''
  });

  useEffect(() => { buscarLancamentos(); }, []);

  const buscarLancamentos = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/lancamentos');
      setLancamentos(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lancamentos', form);
      setShowForm(false);
      setForm({ plataforma: 'uber', data: new Date().toISOString().split('T')[0], valor_bruto: '', taxa_percentual: '25', horas_trabalhadas: '', corridas: '', observacao: '' });
      buscarLancamentos();
    } catch (err) { console.error(err); }
  };

  const deletar = async (id) => {
    if (!confirm('Remover este lançamento?')) return;
    try { await api.delete(`/lancamentos/${id}`); buscarLancamentos(); }
    catch (err) { console.error(err); }
  };

  const getPlatColor = (plat) => PLATAFORMAS.find(p => p.value === plat) || { bg: '#4a5568', color: '#fff', label: plat };

  return (
    <Layout>
      <style>{`
        .input-dark { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #fff !important; border-radius: 10px !important; padding: 12px 14px !important; width: 100% !important; font-size: 14px !important; transition: all 0.2s ease !important; box-sizing: border-box !important; }
        .input-dark:focus { border-color: rgba(99,179,237,0.5) !important; outline: none !important; background: rgba(99,179,237,0.05) !important; }
        .input-dark option { background: #1a1d2e; color: #fff; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(99,179,237,0.35) !important; }
        .btn-primary { transition: all 0.2s ease; }
        .lancamento-item:hover { border-color: rgba(99,179,237,0.3) !important; background: rgba(99,179,237,0.05) !important; }
        .lancamento-item { transition: all 0.2s ease; }
        .btn-delete:hover { color: #fc8181 !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>💰 Lançamentos</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0 0' }}>Registre seus ganhos por plataforma</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
          style={{
            background: showForm ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #63b3ed, #4299e1)',
            border: showForm ? '1px solid rgba(255,255,255,0.1)' : 'none',
            borderRadius: '10px', padding: '10px 20px',
            color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
          }}
        >
          {showForm ? '✕ Cancelar' : '+ Novo Lançamento'}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '24px', marginBottom: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0' }}>Novo Lançamento</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>PLATAFORMA</label>
                <select name="plataforma" value={form.plataforma} onChange={handleChange} className="input-dark">
                  {PLATAFORMAS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>DATA</label>
                <input type="date" name="data" value={form.data} onChange={handleChange} className="input-dark" required />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>VALOR BRUTO (R$)</label>
                <input type="number" name="valor_bruto" value={form.valor_bruto} onChange={handleChange} className="input-dark" placeholder="0,00" step="0.01" required />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>TAXA DA PLATAFORMA (%)</label>
                <input type="number" name="taxa_percentual" value={form.taxa_percentual} onChange={handleChange} className="input-dark" placeholder="25" required />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>HORAS TRABALHADAS</label>
                <input type="number" name="horas_trabalhadas" value={form.horas_trabalhadas} onChange={handleChange} className="input-dark" placeholder="6.5" step="0.5" />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Nº DE CORRIDAS</label>
                <input type="number" name="corridas" value={form.corridas} onChange={handleChange} className="input-dark" placeholder="20" />
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
                  Salvar Lançamento
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>⏳ Carregando...</div>
      ) : lancamentos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
          <p style={{ fontSize: '48px', margin: '0 0 12px 0' }}>💰</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', margin: 0 }}>Nenhum lançamento ainda. Adicione o primeiro!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {lancamentos.map((l) => {
            const plat = getPlatColor(l.plataforma);
            const liquido = Number(l.valor_liquido);
            return (
              <div key={l.id} className="lancamento-item" style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px', padding: '18px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{
                    background: plat.bg, color: plat.color,
                    padding: '5px 12px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>{plat.label}</span>
                  <div>
                    <p style={{ color: '#fff', fontWeight: '700', fontSize: '16px', margin: 0 }}>
                      R$ {Number(l.valor_bruto).toFixed(2)}
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '400', fontSize: '13px', margin: '0 6px' }}>bruto →</span>
                      <span style={{ color: '#68d391' }}>R$ {liquido.toFixed(2)}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '400', fontSize: '13px', marginLeft: '4px' }}>líquido</span>
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: '4px 0 0 0' }}>
                      {l.data} {l.horas_trabalhadas ? `• ${l.horas_trabalhadas}h` : ''} {l.corridas ? `• ${l.corridas} corridas` : ''}
                    </p>
                  </div>
                </div>
                <button onClick={() => deletar(l.id)} className="btn-delete"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', fontSize: '18px', padding: '4px', transition: 'color 0.2s' }}>
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default Lancamentos;