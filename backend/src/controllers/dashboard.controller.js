const { supabaseAdmin } = require('../config/supabase');

// Dashboard principal
const resumoGeral = async (req, res) => {
  const { periodo } = req.query; // hoje | semana | mes
  const hoje = new Date().toISOString().split('T')[0];

  let data_inicio;
  if (periodo === 'hoje') {
    data_inicio = hoje;
  } else if (periodo === 'semana') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    data_inicio = d.toISOString().split('T')[0];
  } else {
    const d = new Date();
    d.setDate(1);
    data_inicio = d.toISOString().split('T')[0];
  }

  try {
    // Lançamentos do período
    const { data: lancamentos, error: errLanc } = await supabaseAdmin
      .from('lancamentos')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('data', data_inicio)
      .lte('data', hoje);

    if (errLanc) return res.status(400).json({ error: errLanc.message });

    // Abastecimentos do período
    const { data: abastecimentos, error: errAbast } = await supabaseAdmin
      .from('abastecimentos')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('data', data_inicio)
      .lte('data', hoje);

    if (errAbast) return res.status(400).json({ error: errAbast.message });

    // Meta do dia
    const { data: metaHoje } = await supabaseAdmin
      .from('metas_diarias')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('data', hoje)
      .single();

    // Cálculos
    const total_bruto = lancamentos.reduce((s, l) => s + Number(l.valor_bruto), 0);
    const total_liquido = lancamentos.reduce((s, l) => s + Number(l.valor_liquido), 0);
    const total_combustivel = abastecimentos.reduce((s, a) => s + Number(a.valor_total), 0);
    const total_horas = lancamentos.reduce((s, l) => s + Number(l.horas_trabalhadas || 0), 0);
    const total_corridas = lancamentos.reduce((s, l) => s + Number(l.corridas || 0), 0);
    const lucro_real = total_liquido - total_combustivel;
    const ganho_por_hora = total_horas > 0 ? lucro_real / total_horas : 0;

    return res.json({
      periodo,
      data_inicio,
      data_fim: hoje,
      total_bruto: total_bruto.toFixed(2),
      total_liquido: total_liquido.toFixed(2),
      total_combustivel: total_combustivel.toFixed(2),
      lucro_real: lucro_real.toFixed(2),
      total_horas: total_horas.toFixed(2),
      total_corridas,
      ganho_por_hora: ganho_por_hora.toFixed(2),
      meta_hoje: metaHoje || null
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = { resumoGeral };