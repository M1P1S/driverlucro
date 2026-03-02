import { useState, useEffect } from 'react';
import api from '../../services/api';
import Layout from '../../components/Layout';

const COMBUSTIVEIS = [
  { value: 'gasolina', label: '⛽ Gasolina' },
  { value: 'etanol', label: '🌿 Etanol' },
  { value: 'flex', label: '⛽ Flex' },
  { value: 'gnv', label: '💨 GNV' },
  { value: 'eletrico', label: '⚡ Elétrico (kWh)' },
];

const Abastecimentos = () => {
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [carros, setCarros] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    carro_id: '', combustivel: 'gasolina',
    data: new Date().toISOString().split('T')[0],
    litros: '', valor_total: '', km_no_momento: '',
    posto: '', tanque_cheio: true, observacao: ''
  });

  useEffect(() => {
    buscarDados();
  }, []);

  const buscarDados = async () => {
    setLoading(true);
    try {
      const [abResp, carrosResp] = await Promise.all([
        api.get('/abastecimentos'),
        api.get('/carros')
      ]);
      setAbastecimentos(abResp.data);
      setCarros(carrosResp.data);

      const resumoResp = await api.get('/abastecimentos/resumo');
      setResumo(resumoResp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/abastecimentos', form);
      setShowForm(false);
      setForm({
        carro_id: '', combustivel: 'gasolina',
        data: new Date().toISOString().split('T')[0],
        litros: '', valor_total: '', km_no_momento: '',
        posto: '', tanque_cheio: true, observacao: ''
      });
      buscarDados();
    } catch (err) {
      console.error(err);
    }
  };

  const deletar = async (id) => {
    if (!confirm('Remover este abastecimento?')) return;
    try {
      await api.delete(`/abastecimentos/${id}`);
      buscarDados();
    } catch (err) {
      console.error(err);
    }
  };

  const valorPorLitro = form.litros && form.valor_total
    ? (parseFloat(form.valor_total) / parseFloat(form.litros)).toFixed(3)
    : null;

  return (
    <Layout>
      <style>{`
        .input-dark { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #fff !important; border-radius: 10px !important; padding: 12px 14px !important; width: 100% !important; font-size: 14px !important; transition: all 0.2s ease !important; box-sizing: border-box !important; }
        .input-dark:focus { border-color: rgba(99,179,237,0.5) !important; outline: none !important; background: rgba(99,179,237,0.05) !important; }
        .input-dark option { background: #1a1d2e; color: #fff; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(99,179,237,0.35) !important; }
        .btn-primary { transition: all 0.2s ease; }
        .item-hover:hover { border-color: rgba(99,179,237,0.3) !important; background: rgba(99,179,237,0.05) !important; }
        .item-hover { transition: all 0.2s ease; }
        .btn-delete:hover { color: #fc8181 !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>⛽ Abastecimentos</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0 0' }}>Controle seu consumo de combustível</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{
          background: showForm ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #63b3ed, #4299e1)',
          border: showForm ? '1px solid rgba(255,255,255,0.1)' : 'none',
          borderRadius: '10px', padding: '10px 20px',
          color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
        }}>
          {showForm ? '✕ Cancelar' : '+ Novo Abastecimento'}
        </button>
      </div>

      {/* Cards de resumo */}
      {resumo && resumo.media > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'MÉDIA DE CONSUMO', valor: `${resumo.media} km/L`, icon: '📊', color: '#63b3ed', bg: 'rgba(99,179,237,0.1)', border: 'rgba(99,179,237,0.2)' },
            { label: 'MELHOR CONSUMO', valor: `${resumo.melhor} km/L`, icon: '🏆', color: '#68d391', bg: 'rgba(104,211,145,0.1)', border: 'rgba(104,211,145,0.2)' },
            { label: 'PIOR CONSUMO', valor: `${resumo.pior} km/L`, icon: '⚠️', color: '#fc8181', bg: 'rgba(252,129,129,0.1)', border: 'rgba(252,129,129,0.2)' },
            { label: 'TOTAL GASTO', valor: `R$ ${resumo.total_gasto}`, icon: '💸', color: '#f6ad55', bg: 'rgba(246,173,85,0.1)', border: 'rgba(246,173,85,0.2)' },
            { label: 'TOTAL LITROS', valor: `${resumo.total_litros}L`, icon: '⛽', color: '#b794f4', bg: 'rgba(183,148,244,0.1)', border: 'rgba(183,148,244,0.2)' },
          ].map((card) => (
            <div key={card.label} style={{
              background: card.bg, border: `1px solid ${card.border}`,
              borderRadius: '14px', padding: '16px'
            }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{card.icon}</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '600', margin: 0, letterSpacing: '0.5px' }}>{card.label}</p>
              <p style={{ color: card.color, fontSize: '18px', fontWeight: '800', margin: '4px 0 0 0' }}>{card.valor}</p>
            </div>
          ))}
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '24px', marginBottom: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0' }}>Novo Abastecimento</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>VEÍCULO</label>
                <select name="carro_id" value={form.carro_id} onChange={handleChange} className="input-dark">
                  <option value="">Selecione o carro</option>
                  {carros.map(c => <option key={c.id} value={c.id}>{c.apelido || c.modelo}</option>)}
                </select>
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>COMBUSTÍVEL</label>
                <select name="combustivel" value={form.combustivel} onChange={handleChange} className="input-dark">
                  {COMBUSTIVEIS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>DATA</label>
                <input type="date" name="data" value={form.data} onChange={handleChange} className="input-dark" required />
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>KM ATUAL DO CARRO</label>
                <input type="number" name="km_no_momento" value={form.km_no_momento} onChange={handleChange} className="input-dark" placeholder="Ex: 52000" required />
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                {form.combustivel === 'eletrico' ? 'kWh CARREGADOS' : 'LITROS ABASTECIDOS'}
                </label>
                <input type="number" name="litros" value={form.litros} onChange={handleChange} className="input-dark" placeholder={form.combustivel === 'eletrico' ? 'Ex: 45.0 kWh' : 'Ex: 40.5 L'} step="0.001" required />
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>VALOR TOTAL (R$)</label>
                <input type="number" name="valor_total" value={form.valor_total} onChange={handleChange} className="input-dark" placeholder="Ex: 250.00" step="0.01" required />
              </div>

                            {valorPorLitro && (
                <div style={{ gridColumn: '1 / -1', background: 'rgba(99,179,237,0.08)', border: '1px solid rgba(99,179,237,0.2)', borderRadius: '10px', padding: '12px 16px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 }}>
                    {form.combustivel === 'eletrico' ? 'PREÇO POR kWh CALCULADO' : 'PREÇO POR LITRO CALCULADO'}
                    </p>
                    <p style={{ color: '#63b3ed', fontSize: '20px', fontWeight: '800', margin: '4px 0 0 0' }}>
                    R$ {valorPorLitro}/{form.combustivel === 'eletrico' ? 'kWh' : 'L'}
                    </p>
                </div>
                )}

              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>POSTO</label>
                <input type="text" name="posto" value={form.posto} onChange={handleChange} className="input-dark" placeholder="Nome do posto (opcional)" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '20px' }}>
                <input type="checkbox" name="tanque_cheio" checked={form.tanque_cheio} onChange={handleChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', cursor: 'pointer' }}>Tanque cheio</label>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="btn-primary" style={{
                  width: '100%', background: 'linear-gradient(135deg, #63b3ed, #4299e1)',
                  border: 'none', borderRadius: '10px', padding: '13px',
                  color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer'
                }}>
                  Salvar Abastecimento
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>⏳ Carregando...</div>
      ) : abastecimentos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
          <p style={{ fontSize: '48px', margin: '0 0 12px 0' }}>⛽</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', margin: 0 }}>Nenhum abastecimento ainda. Adicione o primeiro!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {abastecimentos.map((a) => (
            <div key={a.id} className="item-hover" style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px', padding: '18px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '32px' }}>⛽</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>R$ {Number(a.valor_total).toFixed(2)}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>•</span>
                    <span style={{ color: '#63b3ed', fontSize: '14px', fontWeight: '600' }}>
                    {a.litros}{a.combustivel === 'eletrico' ? ' kWh' : 'L'}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>•</span>
                    <span style={{ color: '#f6ad55', fontSize: '14px', fontWeight: '600' }}>R$ {Number(a.valor_por_litro).toFixed(3)}/L</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: 0 }}>
                    {a.data} • {a.km_no_momento?.toLocaleString()} km
                    {a.km_por_litro ? ` • ${Number(a.km_por_litro).toFixed(1)} ${a.combustivel === 'eletrico' ? 'km/kWh' : 'km/L'}` : ''}
                    {a.carros ? ` • ${a.carros.apelido || a.carros.modelo}` : ''}
                    {a.posto ? ` • ${a.posto}` : ''}
                  </p>
                </div>
              </div>
              <button onClick={() => deletar(a.id)} className="btn-delete"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', fontSize: '18px', transition: 'color 0.2s' }}>
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Abastecimentos;