const { supabaseAdmin } = require('../config/supabase');

// Taxas padrão por plataforma para cálculo automático
const TAXAS_PADRAO = {
  uber: 25,
  '99': 25,
  indriver: 20,
  cabify: 25,
  ladydriver: 20,
};

// Importar corrida individual (entrada rápida de recibo)
const importarCorridaIndividual = async (req, res) => {
  const {
    plataforma,
    data,
    valor_bruto,
    taxa_percentual,
    horas_trabalhadas,
    corridas = 1,
    observacao,
  } = req.body;

  if (!plataforma || !valor_bruto) {
    return res.status(400).json({ error: 'Plataforma e valor bruto são obrigatórios' });
  }

  const taxa = taxa_percentual !== undefined ? Number(taxa_percentual) : (TAXAS_PADRAO[plataforma] || 25);

  try {
    const { data: lancamento, error } = await supabaseAdmin
      .from('lancamentos')
      .insert({
        user_id: req.user.id,
        plataforma,
        data: data || new Date().toISOString().split('T')[0],
        valor_bruto: Number(valor_bruto),
        taxa_percentual: taxa,
        horas_trabalhadas: horas_trabalhadas ? Number(horas_trabalhadas) : null,
        corridas: Number(corridas),
        observacao: observacao || `Importado via recibo`,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Atualiza meta diária automaticamente
    await supabaseAdmin.rpc('atualizar_meta_diaria', {
      p_user_id: req.user.id,
      p_data: lancamento.data,
    });

    return res.status(201).json({ lancamento, mensagem: 'Corrida importada e lançamento criado com sucesso' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Importar resumo (semanal/diário) de uma plataforma
const importarResumo = async (req, res) => {
  const {
    plataforma,
    data_inicio,
    data_fim,
    valor_bruto_total,
    taxa_percentual,
    total_corridas,
    total_horas,
    observacao,
  } = req.body;

  if (!plataforma || !valor_bruto_total || !data_inicio) {
    return res.status(400).json({ error: 'Plataforma, data início e valor bruto total são obrigatórios' });
  }

  const taxa = taxa_percentual !== undefined ? Number(taxa_percentual) : (TAXAS_PADRAO[plataforma] || 25);
  const dataFim = data_fim || data_inicio;

  try {
    // Verifica se já existe lançamento para este período e plataforma
    const { data: existente } = await supabaseAdmin
      .from('lancamentos')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('plataforma', plataforma)
      .eq('data', dataFim)
      .single();

    if (existente) {
      return res.status(409).json({
        error: 'Já existe um lançamento para esta plataforma nesta data',
        lancamento_existente_id: existente.id,
      });
    }

    const { data: lancamento, error } = await supabaseAdmin
      .from('lancamentos')
      .insert({
        user_id: req.user.id,
        plataforma,
        data: dataFim,
        valor_bruto: Number(valor_bruto_total),
        taxa_percentual: taxa,
        horas_trabalhadas: total_horas ? Number(total_horas) : null,
        corridas: total_corridas ? Number(total_corridas) : null,
        observacao: observacao || `Resumo ${plataforma} ${data_inicio}${data_fim && data_fim !== data_inicio ? ' a ' + data_fim : ''}`,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Atualiza meta diária
    await supabaseAdmin.rpc('atualizar_meta_diaria', {
      p_user_id: req.user.id,
      p_data: lancamento.data,
    });

    return res.status(201).json({ lancamento, mensagem: 'Resumo importado com sucesso' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Processar CSV da Uber (formato do portal do motorista)
const processarCSVUber = (linhas) => {
  // Uber CSV típico tem colunas:
  // "Trip or Order Date","Fare","Tip","Bonus","Total","Surge Multiplier","City"
  // ou: "Date","Trips Completed","Online Hours","Earnings"

  const registros = [];
  const erros = [];

  if (linhas.length < 2) {
    return { registros, erros: ['CSV vazio ou sem dados'] };
  }

  const cabecalho = linhas[0].map(c => c.toLowerCase().trim().replace(/"/g, ''));

  // Detecta formato por data
  const idxData = cabecalho.findIndex(c => c.includes('date') || c.includes('data'));
  const idxTotal = cabecalho.findIndex(c => c === 'total' || c.includes('earnings') || c.includes('ganhos'));
  const idxBruto = cabecalho.findIndex(c => c.includes('fare') || c.includes('tarifa'));
  const idxCorridas = cabecalho.findIndex(c => c.includes('trips') || c.includes('corridas') || c.includes('viagens'));
  const idxHoras = cabecalho.findIndex(c => c.includes('hours') || c.includes('horas') || c.includes('online'));

  if (idxData === -1 || idxTotal === -1) {
    return { registros, erros: ['Formato de CSV da Uber não reconhecido. Colunas esperadas: Date, Total'] };
  }

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i];
    if (!linha || linha.every(c => !c || c.trim() === '')) continue;

    try {
      const dataStr = linha[idxData]?.replace(/"/g, '').trim();
      const totalStr = linha[idxTotal]?.replace(/[R$",]/g, '').trim();
      const brutoStr = idxBruto >= 0 ? linha[idxBruto]?.replace(/[R$",]/g, '').trim() : null;
      const corridasStr = idxCorridas >= 0 ? linha[idxCorridas]?.replace(/"/g, '').trim() : null;
      const horasStr = idxHoras >= 0 ? linha[idxHoras]?.replace(/"/g, '').trim() : null;

      if (!dataStr || !totalStr) continue;

      // Normaliza data para YYYY-MM-DD
      let dataNormalizada = dataStr;
      if (dataStr.includes('/')) {
        const partes = dataStr.split('/');
        if (partes.length === 3) {
          // DD/MM/YYYY ou MM/DD/YYYY
          if (partes[2].length === 4) {
            dataNormalizada = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
          }
        }
      }

      const valor = parseFloat(totalStr.replace(',', '.'));
      if (isNaN(valor) || valor <= 0) continue;

      registros.push({
        plataforma: 'uber',
        data: dataNormalizada,
        valor_bruto: brutoStr ? parseFloat(brutoStr.replace(',', '.')) || valor : valor,
        taxa_percentual: 25,
        corridas: corridasStr ? parseInt(corridasStr) || null : null,
        horas_trabalhadas: horasStr ? parseFloat(horasStr.replace(',', '.')) || null : null,
        observacao: 'Importado via CSV Uber',
      });
    } catch {
      erros.push(`Erro na linha ${i + 1}`);
    }
  }

  return { registros, erros };
};

// Processar CSV da 99 (formato do portal do motorista)
const processarCSV99 = (linhas) => {
  // 99 CSV típico tem colunas variáveis
  // Tentamos detectar as colunas relevantes

  const registros = [];
  const erros = [];

  if (linhas.length < 2) {
    return { registros, erros: ['CSV vazio ou sem dados'] };
  }

  const cabecalho = linhas[0].map(c => c.toLowerCase().trim().replace(/"/g, ''));

  const idxData = cabecalho.findIndex(c => c.includes('data') || c.includes('date'));
  const idxValor = cabecalho.findIndex(c =>
    c.includes('valor') || c.includes('total') || c.includes('ganhos') || c.includes('receita')
  );
  const idxCorridas = cabecalho.findIndex(c =>
    c.includes('corridas') || c.includes('viagens') || c.includes('trips')
  );
  const idxHoras = cabecalho.findIndex(c => c.includes('horas') || c.includes('tempo'));

  if (idxData === -1 || idxValor === -1) {
    return { registros, erros: ['Formato de CSV da 99 não reconhecido. Colunas esperadas: Data, Valor'] };
  }

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i];
    if (!linha || linha.every(c => !c || c.trim() === '')) continue;

    try {
      const dataStr = linha[idxData]?.replace(/"/g, '').trim();
      const valorStr = linha[idxValor]?.replace(/[R$",\s]/g, '').trim();
      const corridasStr = idxCorridas >= 0 ? linha[idxCorridas]?.replace(/"/g, '').trim() : null;
      const horasStr = idxHoras >= 0 ? linha[idxHoras]?.replace(/"/g, '').trim() : null;

      if (!dataStr || !valorStr) continue;

      let dataNormalizada = dataStr;
      if (dataStr.includes('/')) {
        const partes = dataStr.split('/');
        if (partes.length === 3 && partes[2].length === 4) {
          dataNormalizada = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        }
      }

      const valor = parseFloat(valorStr.replace(',', '.'));
      if (isNaN(valor) || valor <= 0) continue;

      registros.push({
        plataforma: '99',
        data: dataNormalizada,
        valor_bruto: valor,
        taxa_percentual: 25,
        corridas: corridasStr ? parseInt(corridasStr) || null : null,
        horas_trabalhadas: horasStr ? parseFloat(horasStr.replace(',', '.')) || null : null,
        observacao: 'Importado via CSV 99',
      });
    } catch {
      erros.push(`Erro na linha ${i + 1}`);
    }
  }

  return { registros, erros };
};

// Parsear conteúdo CSV genérico
const parsearCSV = (conteudo) => {
  const linhas = [];
  const rows = conteudo.split(/\r?\n/);

  for (const row of rows) {
    if (!row.trim()) continue;

    const cols = [];
    let dentro_aspas = false;
    let coluna_atual = '';

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        dentro_aspas = !dentro_aspas;
      } else if (char === ',' && !dentro_aspas) {
        cols.push(coluna_atual.trim());
        coluna_atual = '';
      } else {
        coluna_atual += char;
      }
    }
    cols.push(coluna_atual.trim());
    linhas.push(cols);
  }

  return linhas;
};

// Importar CSV (Uber ou 99)
const importarCSV = async (req, res) => {
  const { plataforma, conteudo_csv } = req.body;

  if (!plataforma || !conteudo_csv) {
    return res.status(400).json({ error: 'Plataforma e conteúdo do CSV são obrigatórios' });
  }

  if (!['uber', '99'].includes(plataforma)) {
    return res.status(400).json({ error: 'Plataforma deve ser uber ou 99 para importação CSV' });
  }

  try {
    const linhas = parsearCSV(conteudo_csv);

    let resultado;
    if (plataforma === 'uber') {
      resultado = processarCSVUber(linhas);
    } else {
      resultado = processarCSV99(linhas);
    }

    if (resultado.registros.length === 0) {
      return res.status(400).json({
        error: 'Nenhum registro válido encontrado no CSV',
        erros: resultado.erros,
      });
    }

    // Insere todos os registros válidos
    const lancamentosParaInserir = resultado.registros.map(r => ({
      user_id: req.user.id,
      ...r,
    }));

    const { data: inseridos, error } = await supabaseAdmin
      .from('lancamentos')
      .insert(lancamentosParaInserir)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    // Atualiza meta diária para cada data única importada
    const datasUnicas = [...new Set(inseridos.map(l => l.data))];
    for (const data of datasUnicas) {
      await supabaseAdmin.rpc('atualizar_meta_diaria', {
        p_user_id: req.user.id,
        p_data: data,
      });
    }

    return res.status(201).json({
      mensagem: `${inseridos.length} lançamento(s) importado(s) com sucesso`,
      total_importado: inseridos.length,
      erros: resultado.erros,
      lancamentos: inseridos,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Visualizar preview do CSV antes de importar (sem salvar)
const previewCSV = async (req, res) => {
  const { plataforma, conteudo_csv } = req.body;

  if (!plataforma || !conteudo_csv) {
    return res.status(400).json({ error: 'Plataforma e conteúdo CSV são obrigatórios' });
  }

  try {
    const linhas = parsearCSV(conteudo_csv);

    let resultado;
    if (plataforma === 'uber') {
      resultado = processarCSVUber(linhas);
    } else {
      resultado = processarCSV99(linhas);
    }

    const total_valor = resultado.registros.reduce((s, r) => s + r.valor_bruto, 0);

    return res.json({
      total_registros: resultado.registros.length,
      total_valor: total_valor.toFixed(2),
      preview: resultado.registros.slice(0, 5),
      erros: resultado.erros,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = { importarCorridaIndividual, importarResumo, importarCSV, previewCSV };
