const { supabaseAdmin } = require('../config/supabase');

// Listar lançamentos
const listar = async (req, res) => {
  const { data_inicio, data_fim, plataforma } = req.query;

  try {
    let query = supabaseAdmin
      .from('lancamentos')
      .select('*')
      .eq('user_id', req.user.id)
      .order('data', { ascending: false });

    if (data_inicio) query = query.gte('data', data_inicio);
    if (data_fim) query = query.lte('data', data_fim);
    if (plataforma) query = query.eq('plataforma', plataforma);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar lançamento
const criar = async (req, res) => {
  const { plataforma, data, valor_bruto, taxa_percentual, horas_trabalhadas, corridas, observacao } = req.body;

  if (!plataforma || !valor_bruto || !taxa_percentual) {
    return res.status(400).json({ error: 'Plataforma, valor bruto e taxa são obrigatórios' });
  }

  try {
    const { data: lancamento, error } = await supabaseAdmin
      .from('lancamentos')
      .insert({
        user_id: req.user.id,
        plataforma,
        data: data || new Date().toISOString().split('T')[0],
        valor_bruto,
        taxa_percentual,
        horas_trabalhadas,
        corridas,
        observacao
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Atualiza meta diária automaticamente
    await supabaseAdmin.rpc('atualizar_meta_diaria', {
      p_user_id: req.user.id,
      p_data: lancamento.data
    });

    return res.status(201).json(lancamento);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar lançamento
const atualizar = async (req, res) => {
  const { id } = req.params;
  const campos = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('lancamentos')
      .update({ ...campos, updated_at: new Date() })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar lançamento
const deletar = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('lancamentos')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: 'Lançamento removido com sucesso' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Resumo por plataforma
const resumoPorPlataforma = async (req, res) => {
  const { data_inicio, data_fim } = req.query;

  try {
    let query = supabaseAdmin
      .from('lancamentos')
      .select('plataforma, valor_bruto, valor_liquido, horas_trabalhadas, corridas')
      .eq('user_id', req.user.id);

    if (data_inicio) query = query.gte('data', data_inicio);
    if (data_fim) query = query.lte('data', data_fim);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    // Agrupa por plataforma
    const resumo = data.reduce((acc, item) => {
      if (!acc[item.plataforma]) {
        acc[item.plataforma] = {
          plataforma: item.plataforma,
          total_bruto: 0,
          total_liquido: 0,
          total_horas: 0,
          total_corridas: 0
        };
      }
      acc[item.plataforma].total_bruto += Number(item.valor_bruto);
      acc[item.plataforma].total_liquido += Number(item.valor_liquido);
      acc[item.plataforma].total_horas += Number(item.horas_trabalhadas || 0);
      acc[item.plataforma].total_corridas += Number(item.corridas || 0);
      return acc;
    }, {});

    return res.json(Object.values(resumo));
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = { listar, criar, atualizar, deletar, resumoPorPlataforma };