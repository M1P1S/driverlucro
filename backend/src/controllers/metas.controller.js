const { supabaseAdmin } = require('../config/supabase');

// Buscar configuração da meta
const getConfig = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('metas_config')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Cria config padrão se não existir
      const { data: nova, error: errNova } = await supabaseAdmin
        .from('metas_config')
        .insert({ user_id: req.user.id, valor_meta_diaria: 200.00 })
        .select()
        .single();

      if (errNova) return res.status(400).json({ error: errNova.message });
      return res.json(nova);
    }

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar configuração da meta
const updateConfig = async (req, res) => {
  const { valor_meta_diaria, considerar_combustivel, notificar_whatsapp } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('metas_config')
      .upsert({
        user_id: req.user.id,
        valor_meta_diaria,
        considerar_combustivel,
        notificar_whatsapp,
        updated_at: new Date()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar meta do dia atual
const getMetaHoje = async (req, res) => {
  const hoje = new Date().toISOString().split('T')[0];

  try {
    // Atualiza o cálculo primeiro
    await supabaseAdmin.rpc('atualizar_meta_diaria', {
      p_user_id: req.user.id,
      p_data: hoje
    });

    const { data, error } = await supabaseAdmin
      .from('metas_diarias')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('data', hoje)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.json({
        data: hoje,
        valor_meta: 200,
        valor_bruto_total: 0,
        custo_combustivel: 0,
        valor_liquido_total: 0,
        bateu_meta: false,
        horas_trabalhadas: 0,
        percentual: 0
      });
    }

    if (error) return res.status(400).json({ error: error.message });

    const percentual = data.valor_meta > 0
      ? Math.min(100, Math.round((data.valor_liquido_total / data.valor_meta) * 100))
      : 0;

    return res.json({ ...data, percentual });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Histórico de metas
const getHistorico = async (req, res) => {
  const { dias = 30 } = req.query;

  try {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - parseInt(dias));

    const { data, error } = await supabaseAdmin
      .from('metas_diarias')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('data', dataInicio.toISOString().split('T')[0])
      .order('data', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    const total_dias = data.length;
    const dias_batidos = data.filter(d => d.bateu_meta).length;
    const taxa_sucesso = total_dias > 0 ? Math.round((dias_batidos / total_dias) * 100) : 0;
    const media_diaria = total_dias > 0
      ? (data.reduce((s, d) => s + Number(d.valor_liquido_total), 0) / total_dias).toFixed(2)
      : 0;

    return res.json({
      historico: data,
      resumo: { total_dias, dias_batidos, taxa_sucesso, media_diaria }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = { getConfig, updateConfig, getMetaHoje, getHistorico };