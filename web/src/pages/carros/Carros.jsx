import { useState, useEffect } from 'react';
import api from '../../services/api';
import Layout from '../../components/Layout';

const COMBUSTIVEIS = [
  { value: 'flex', label: '⛽ Flex', color: '#63b3ed' },
  { value: 'gasolina', label: '⛽ Gasolina', color: '#f6ad55' },
  { value: 'etanol', label: '🌿 Etanol', color: '#68d391' },
  { value: 'gnv', label: '💨 GNV', color: '#76e4f7' },
  { value: 'eletrico', label: '⚡ Elétrico', color: '#b794f4' },
];

const Carros = () => {
  const [carros, setCarros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    apelido: '', modelo: '', placa: '', ano: '',
    combustivel: 'flex', consumo_medio_estimado: '', km_atual: ''
  });

  useEffect(() => { buscarCarros(); }, []);

  const buscarCarros = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/carros');
      setCarros(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/carros', form);
      setShowForm(false);
      setForm({ apelido: '', modelo: '', placa: '', ano: '', combustivel: 'flex', consumo_medio_estimado: '', km_atual: '' });
      buscarCarros();
    } catch (err) { console.error(err); }
  };

  const deletar = async (id) => {
    if (!confirm('Remover este carro?')) return;
    try { await api.delete(`/carros/${id}`); buscarCarros(); }
    catch (err) { console.error(err); }
  };

  const getCombustivel = (val) => COMBUSTIVEIS.find(c => c.value === val) || { label: val, color: '#fff' };

  return (
    <Layout>
      <style>{`
        .input-dark { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #fff !important; border-radius: 10px !important; padding: 12px 14px !important; width: 100% !important; font-size: 14px !important; transition: all 0.2s ease !important; box-sizing: border-box !important; }
        .input-dark:focus { border-color: rgba(99,179,237,0.5) !important; outline: none !important; background: rgba(99,179,237,0.05) !important; }
        .input-dark option { background: #1a1d2e; color: #fff; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(99,179,237,0.35) !important; }
        .btn-primary { transition: all 0.2s ease; }
        .carro-card:hover { border-color: rgba(99,179,237,0.3) !important; transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.4) !important; }
        .carro-card { transition: all 0.3s ease; }
        .btn-delete:hover { color: #fc8181 !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>🚗 Meus Carros</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0 0' }}>Gerencie seus veículos</p>
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
          {showForm ? '✕ Cancelar' : '+ Adicionar Carro'}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '24px', marginBottom: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0' }}>Novo Veículo</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>APELIDO</label>
                <input type="text" name="apelido" value={form.apelido} onChange={handleChange} className="input-dark" placeholder="Ex: Meu HB20" />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>MODELO *</label>
                <input type="text" name="modelo" value={form.modelo} onChange={handleChange} className="input-dark" placeholder="Ex: Hyundai HB20" required />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>PLACA</label>
                <input type="text" name="placa" value={form.placa} onChange={handleChange} className="input-dark" placeholder="ABC1D23" />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>ANO</label>
                <input type="number" name="ano" value={form.ano} onChange={handleChange} className="input-dark" placeholder="2020" />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>COMBUSTÍVEL</label>
                <select name="combustivel" value={form.combustivel} onChange={handleChange} className="input-dark">
                  {COMBUSTIVEIS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                    {form.combustivel === 'eletrico' ? 'CONSUMO MÉDIO (km/kWh)' : 'CONSUMO MÉDIO (km/L)'}
                    </label>
                    <input type="number" name="consumo_medio_estimado" value={form.consumo_medio_estimado} onChange={handleChange} className="input-dark" placeholder={form.combustivel === 'eletrico' ? 'Ex: 6.5' : 'Ex: 12.5'} step="0.1" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>KM ATUAL</label>
                <input type="number" name="km_atual" value={form.km_atual} onChange={handleChange} className="input-dark" placeholder="50000" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="btn-primary" style={{
                  width: '100%', background: 'linear-gradient(135deg, #63b3ed, #4299e1)',
                  border: 'none', borderRadius: '10px', padding: '13px',
                  color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer'
                }}>
                  Salvar Veículo
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>⏳ Carregando...</div>
      ) : carros.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
          <p style={{ fontSize: '48px', margin: '0 0 12px 0' }}>🚗</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', margin: 0 }}>Nenhum carro cadastrado. Adicione o primeiro!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {carros.map((c) => {
            const comb = getCombustivel(c.combustivel);
            return (
              <div key={c.id} className="carro-card" style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px', padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '800', margin: 0 }}>{c.apelido || c.modelo}</h3>
                    {c.apelido && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '2px 0 0 0' }}>{c.modelo}</p>}
                  </div>
                  <button onClick={() => deletar(c.id)} className="btn-delete"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', fontSize: '18px', transition: 'color 0.2s' }}>
                    🗑️
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'ANO', value: c.ano || '—' },
                    { label: 'PLACA', value: c.placa || '—' },
                    { label: 'COMBUSTÍVEL', value: comb.label, color: comb.color },
                    { label: 'CONSUMO', value: c.consumo_medio_estimado ? `${c.consumo_medio_estimado} km/L` : '—' },
                    { label: 'KM ATUAL', value: c.km_atual ? c.km_atual.toLocaleString() + ' km' : '0 km', span: true },
                  ].map((info) => (
                    <div key={info.label} style={{ gridColumn: info.span ? '1 / -1' : 'auto', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px 12px' }}>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: '600', margin: 0, letterSpacing: '0.5px' }}>{info.label}</p>
                      <p style={{ color: info.color || 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: '600', margin: '3px 0 0 0' }}>{info.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default Carros;