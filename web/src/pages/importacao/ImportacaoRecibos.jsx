import { useState } from 'react';
import api from '../../services/api';
import Layout from '../../components/Layout';

const PLATAFORMAS = [
  { value: 'uber', label: 'Uber', cor: '#1a1a1a', bg: '#fff' },
  { value: '99', label: '99', cor: '#fff', bg: '#f5a623' },
  { value: 'indriver', label: 'InDriver', cor: '#fff', bg: '#1db954' },
  { value: 'cabify', label: 'Cabify', cor: '#fff', bg: '#7c3aed' },
  { value: 'ladydriver', label: 'LadyDriver', cor: '#fff', bg: '#ec4899' },
];

const TAXAS = { uber: 25, '99': 25, indriver: 20, cabify: 25, ladydriver: 20 };

const ImportacaoRecibos = () => {
  const [aba, setAba] = useState('corrida'); // 'corrida' | 'resumo' | 'csv'

  // Formulário corrida individual
  const [formCorrida, setFormCorrida] = useState({
    plataforma: 'uber', data: new Date().toISOString().split('T')[0],
    valor_bruto: '', taxa_percentual: '25', horas_trabalhadas: '',
    corridas: '1', observacao: '',
  });

  // Formulário resumo
  const [formResumo, setFormResumo] = useState({
    plataforma: 'uber',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: new Date().toISOString().split('T')[0],
    valor_bruto_total: '', taxa_percentual: '25',
    total_corridas: '', total_horas: '', observacao: '',
  });

  // CSV
  const [plataformaCSV, setPlataformaCSV] = useState('uber');
  const [csvTexto, setCsvTexto] = useState('');
  const [previewCSV, setPreviewCSV] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importandoCSV, setImportandoCSV] = useState(false);

  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(null);
  const [erro, setErro] = useState(null);

  const resetFeedback = () => { setSucesso(null); setErro(null); };

  const handleChangeCorrida = (e) => {
    const { name, value } = e.target;
    if (name === 'plataforma') {
      setFormCorrida(prev => ({ ...prev, plataforma: value, taxa_percentual: String(TAXAS[value] || 25) }));
    } else {
      setFormCorrida(prev => ({ ...prev, [name]: value }));
    }
    resetFeedback();
  };

  const handleChangeResumo = (e) => {
    const { name, value } = e.target;
    if (name === 'plataforma') {
      setFormResumo(prev => ({ ...prev, plataforma: value, taxa_percentual: String(TAXAS[value] || 25) }));
    } else {
      setFormResumo(prev => ({ ...prev, [name]: value }));
    }
    resetFeedback();
  };

  const importarCorrida = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetFeedback();
    try {
      const { data } = await api.post('/importacao/corrida', formCorrida);
      setSucesso(`Corrida de R$ ${Number(formCorrida.valor_bruto).toFixed(2)} importada com sucesso! Lançamento criado.`);
      setFormCorrida(prev => ({
        ...prev, valor_bruto: '', horas_trabalhadas: '', corridas: '1', observacao: '',
        data: new Date().toISOString().split('T')[0],
      }));
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao importar corrida');
    } finally {
      setLoading(false);
    }
  };

  const importarResumo = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetFeedback();
    try {
      await api.post('/importacao/resumo', formResumo);
      setSucesso(`Resumo de R$ ${Number(formResumo.valor_bruto_total).toFixed(2)} importado com sucesso!`);
      setFormResumo(prev => ({
        ...prev, valor_bruto_total: '', total_corridas: '', total_horas: '', observacao: '',
      }));
    } catch (err) {
      if (err.response?.status === 409) {
        setErro('Já existe um lançamento para esta plataforma nesta data. Verifique seus lançamentos.');
      } else {
        setErro(err.response?.data?.error || 'Erro ao importar resumo');
      }
    } finally {
      setLoading(false);
    }
  };

  const fazerPreviewCSV = async () => {
    if (!csvTexto.trim()) { setErro('Cole o conteúdo do CSV antes de visualizar'); return; }
    setLoadingPreview(true);
    resetFeedback();
    setPreviewCSV(null);
    try {
      const { data } = await api.post('/importacao/csv/preview', {
        plataforma: plataformaCSV,
        conteudo_csv: csvTexto,
      });
      setPreviewCSV(data);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao processar CSV');
    } finally {
      setLoadingPreview(false);
    }
  };

  const importarCSV = async () => {
    if (!csvTexto.trim()) { setErro('Cole o conteúdo do CSV antes de importar'); return; }
    setImportandoCSV(true);
    resetFeedback();
    try {
      const { data } = await api.post('/importacao/csv', {
        plataforma: plataformaCSV,
        conteudo_csv: csvTexto,
      });
      setSucesso(`${data.total_importado} lançamento(s) importado(s) com sucesso!`);
      setCsvTexto('');
      setPreviewCSV(null);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao importar CSV');
    } finally {
      setImportandoCSV(false);
    }
  };

  const handleArquivoCSV = (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvTexto(ev.target.result);
      setPreviewCSV(null);
      resetFeedback();
    };
    reader.readAsText(arquivo, 'utf-8');
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', borderRadius: '10px', padding: '12px 14px',
    width: '100%', fontSize: '14px', boxSizing: 'border-box', outline: 'none'
  };
  const labelStyle = {
    color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600',
    display: 'block', marginBottom: '8px', letterSpacing: '0.5px'
  };
  const btnPrimary = {
    background: 'linear-gradient(135deg, #63b3ed, #4299e1)',
    border: 'none', borderRadius: '10px', padding: '13px',
    color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    width: '100%'
  };

  const abaStyle = (ativo) => ({
    padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
    borderBottom: ativo ? '2px solid #63b3ed' : '2px solid transparent',
    color: ativo ? '#63b3ed' : 'rgba(255,255,255,0.4)',
    background: 'transparent',
    transition: 'all 0.2s ease',
  });

  const platBtn = (plat, atual) => ({
    background: atual === plat.value ? plat.bg : 'rgba(255,255,255,0.05)',
    color: atual === plat.value ? plat.cor : 'rgba(255,255,255,0.5)',
    border: `2px solid ${atual === plat.value ? plat.bg : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '20px', padding: '6px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
  });

  return (
    <Layout>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
          📥 Importar Recibos
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0 0' }}>
          Registre seus ganhos automaticamente — por corrida, resumo ou CSV da plataforma
        </p>
      </div>

      {/* Feedback */}
      {sucesso && (
        <div style={{
          background: 'rgba(72,187,120,0.15)', border: '1px solid rgba(72,187,120,0.4)',
          borderRadius: '12px', padding: '14px 18px', marginBottom: '20px',
          color: '#68d391', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span>✅</span> {sucesso}
        </div>
      )}
      {erro && (
        <div style={{
          background: 'rgba(245,101,101,0.15)', border: '1px solid rgba(245,101,101,0.4)',
          borderRadius: '12px', padding: '14px 18px', marginBottom: '20px',
          color: '#fc8181', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span>❌</span> {erro}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 8px' }}>
          <button onClick={() => { setAba('corrida'); resetFeedback(); }} style={abaStyle(aba === 'corrida')}>
            🚗 Corrida Individual
          </button>
          <button onClick={() => { setAba('resumo'); resetFeedback(); }} style={abaStyle(aba === 'resumo')}>
            📊 Resumo do Período
          </button>
          <button onClick={() => { setAba('csv'); resetFeedback(); }} style={abaStyle(aba === 'csv')}>
            📄 Importar CSV
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* ABA: Corrida Individual */}
          {aba === 'corrida' && (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px', marginTop: 0 }}>
                Registre uma corrida que você acabou de concluir. O lançamento será criado automaticamente.
              </p>

              {/* Seletor plataforma */}
              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>PLATAFORMA</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PLATAFORMAS.map(p => (
                    <button key={p.value} onClick={() => handleChangeCorrida({ target: { name: 'plataforma', value: p.value } })}
                      style={platBtn(p, formCorrida.plataforma)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={importarCorrida}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>DATA</label>
                    <input type="date" name="data" value={formCorrida.data} onChange={handleChangeCorrida} style={inputStyle} required />
                  </div>
                  <div>
                    <label style={labelStyle}>VALOR BRUTO (R$)</label>
                    <input type="number" name="valor_bruto" value={formCorrida.valor_bruto} onChange={handleChangeCorrida}
                      style={inputStyle} placeholder="Ex: 15.50" step="0.01" min="0" required />
                  </div>
                  <div>
                    <label style={labelStyle}>TAXA DA PLATAFORMA (%)</label>
                    <input type="number" name="taxa_percentual" value={formCorrida.taxa_percentual} onChange={handleChangeCorrida}
                      style={inputStyle} placeholder="25" required />
                  </div>
                  <div>
                    <label style={labelStyle}>HORAS TRABALHADAS</label>
                    <input type="number" name="horas_trabalhadas" value={formCorrida.horas_trabalhadas} onChange={handleChangeCorrida}
                      style={inputStyle} placeholder="0.5 (opcional)" step="0.1" min="0" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>OBSERVAÇÃO (opcional)</label>
                    <input type="text" name="observacao" value={formCorrida.observacao} onChange={handleChangeCorrida}
                      style={inputStyle} placeholder="Ex: Corrida aeroporto" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
                      {loading ? '⏳ Salvando...' : '✅ Registrar Corrida'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ABA: Resumo do Período */}
          {aba === 'resumo' && (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px', marginTop: 0 }}>
                Importe o resumo semanal ou diário direto do app da Uber/99. Um único lançamento será criado com o total do período.
              </p>

              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>PLATAFORMA</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PLATAFORMAS.map(p => (
                    <button key={p.value} onClick={() => handleChangeResumo({ target: { name: 'plataforma', value: p.value } })}
                      style={platBtn(p, formResumo.plataforma)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={importarResumo}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>DATA INÍCIO</label>
                    <input type="date" name="data_inicio" value={formResumo.data_inicio} onChange={handleChangeResumo}
                      style={inputStyle} required />
                  </div>
                  <div>
                    <label style={labelStyle}>DATA FIM</label>
                    <input type="date" name="data_fim" value={formResumo.data_fim} onChange={handleChangeResumo}
                      style={inputStyle} required />
                  </div>
                  <div>
                    <label style={labelStyle}>VALOR BRUTO TOTAL (R$)</label>
                    <input type="number" name="valor_bruto_total" value={formResumo.valor_bruto_total} onChange={handleChangeResumo}
                      style={inputStyle} placeholder="Ex: 450.00" step="0.01" min="0" required />
                  </div>
                  <div>
                    <label style={labelStyle}>TAXA DA PLATAFORMA (%)</label>
                    <input type="number" name="taxa_percentual" value={formResumo.taxa_percentual} onChange={handleChangeResumo}
                      style={inputStyle} placeholder="25" required />
                  </div>
                  <div>
                    <label style={labelStyle}>TOTAL DE CORRIDAS</label>
                    <input type="number" name="total_corridas" value={formResumo.total_corridas} onChange={handleChangeResumo}
                      style={inputStyle} placeholder="Ex: 42 (opcional)" min="0" />
                  </div>
                  <div>
                    <label style={labelStyle}>TOTAL DE HORAS</label>
                    <input type="number" name="total_horas" value={formResumo.total_horas} onChange={handleChangeResumo}
                      style={inputStyle} placeholder="Ex: 28.5 (opcional)" step="0.5" min="0" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>OBSERVAÇÃO (opcional)</label>
                    <input type="text" name="observacao" value={formResumo.observacao} onChange={handleChangeResumo}
                      style={inputStyle} placeholder="Ex: Semana 10 - Março 2026" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
                      {loading ? '⏳ Importando...' : '📊 Importar Resumo'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ABA: CSV */}
          {aba === 'csv' && (
            <div>
              <div style={{
                background: 'rgba(99,179,237,0.08)',
                border: '1px solid rgba(99,179,237,0.2)',
                borderRadius: '12px', padding: '16px', marginBottom: '20px'
              }}>
                <p style={{ color: '#63b3ed', fontSize: '13px', fontWeight: '600', margin: '0 0 8px 0' }}>
                  Como exportar o CSV da Uber:
                </p>
                <ol style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0, paddingLeft: '16px', lineHeight: '1.8' }}>
                  <li>Acesse <strong style={{ color: 'rgba(255,255,255,0.7)' }}>drivers.uber.com</strong></li>
                  <li>Vá em <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Pagamentos → Extrato de ganhos</strong></li>
                  <li>Selecione o período e clique em <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Exportar CSV</strong></li>
                  <li>Faça upload do arquivo abaixo ou cole o conteúdo</li>
                </ol>
                <p style={{ color: '#63b3ed', fontSize: '13px', fontWeight: '600', margin: '12px 0 8px 0' }}>
                  Como exportar o CSV da 99:
                </p>
                <ol style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0, paddingLeft: '16px', lineHeight: '1.8' }}>
                  <li>Acesse o app 99 como motorista</li>
                  <li>Vá em <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Extrato → Exportar</strong></li>
                  <li>Selecione o período e exporte o CSV</li>
                </ol>
              </div>

              {/* Seletor plataforma */}
              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>PLATAFORMA DO CSV</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {PLATAFORMAS.filter(p => ['uber', '99'].includes(p.value)).map(p => (
                    <button key={p.value} onClick={() => { setPlataformaCSV(p.value); setPreviewCSV(null); resetFeedback(); }}
                      style={platBtn(p, plataformaCSV)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload ou paste */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>ARQUIVO CSV</label>
                <input
                  type="file" accept=".csv,.txt"
                  onChange={handleArquivoCSV}
                  style={{
                    ...inputStyle,
                    padding: '10px',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>OU COLE O CONTEÚDO DO CSV AQUI</label>
                <textarea
                  value={csvTexto}
                  onChange={(e) => { setCsvTexto(e.target.value); setPreviewCSV(null); resetFeedback(); }}
                  style={{
                    ...inputStyle,
                    minHeight: '120px',
                    resize: 'vertical',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                  placeholder={'Date,Fare,Tip,Bonus,Total\n2026-03-01,15.50,0,0,15.50\n2026-03-02,22.00,2.00,0,24.00'}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <button
                  onClick={fazerPreviewCSV}
                  disabled={loadingPreview || !csvTexto.trim()}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px', padding: '12px',
                    color: '#fff', fontSize: '14px', fontWeight: '600',
                    cursor: !csvTexto.trim() ? 'not-allowed' : 'pointer',
                    opacity: !csvTexto.trim() ? 0.4 : 1,
                  }}
                >
                  {loadingPreview ? '⏳ Analisando...' : '👁️ Visualizar Preview'}
                </button>
                <button
                  onClick={importarCSV}
                  disabled={importandoCSV || !csvTexto.trim()}
                  style={{
                    flex: 1,
                    ...btnPrimary,
                    width: 'auto',
                    opacity: (!csvTexto.trim() || importandoCSV) ? 0.6 : 1,
                    cursor: (!csvTexto.trim() || importandoCSV) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {importandoCSV ? '⏳ Importando...' : '📥 Importar Tudo'}
                </button>
              </div>

              {/* Preview */}
              {previewCSV && (
                <div style={{
                  background: 'rgba(72,187,120,0.08)',
                  border: '1px solid rgba(72,187,120,0.25)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '14px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#68d391', fontSize: '24px', fontWeight: '800' }}>{previewCSV.total_registros}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>REGISTROS</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#68d391', fontSize: '24px', fontWeight: '800' }}>R$ {previewCSV.total_valor}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>VALOR TOTAL</div>
                    </div>
                  </div>

                  {previewCSV.preview && previewCSV.preview.length > 0 && (
                    <>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 8px 0' }}>
                        Prévia dos primeiros registros:
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {previewCSV.preview.map((r, i) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px 12px'
                          }}>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{r.data}</span>
                            <span style={{ color: '#68d391', fontSize: '13px', fontWeight: '600' }}>
                              R$ {Number(r.valor_bruto).toFixed(2)}
                            </span>
                            {r.corridas && (
                              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{r.corridas} corridas</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {previewCSV.erros && previewCSV.erros.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ color: '#f6ad55', fontSize: '12px', margin: '0 0 4px 0' }}>Avisos:</p>
                      {previewCSV.erros.map((e, i) => (
                        <p key={i} style={{ color: 'rgba(246,173,85,0.7)', fontSize: '11px', margin: '2px 0' }}>• {e}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ImportacaoRecibos;
