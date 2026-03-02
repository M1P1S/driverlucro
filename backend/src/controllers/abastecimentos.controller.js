const { supabaseAdmin } = require('../config/supabase');

// Listar abastecimentos
const listar = async (req, res) => {
  const { data_inicio, data_fim, carro_id } = req.query;
  try {
    let query = supabaseAdmin
      .from('abastecimentos')
      .select('*, carros(modelo, apelido)')
      .eq('user_id', req.user.id)
      .order('data', { ascending: false });

    if (data_inicio) query = query.gte('data', data_inicio);
    if (data_fim) query = query.lte('data', data_fim);
    if (carro_id) query = query.eq('carro_id', carro_id);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Criar abastecimento
const criar = async (req, res) => {
  console.log('BODY RECEBIDO:', req.body);
  const { carro_id, data, combustivel, litros, valor_total, km_no_momento, posto, tanque_cheio, observacao } = req.body;

  if (!litros || !valor_total || !km_no_momento || !combustivel) {
    return res.status(400).json({ error: 'Litros, valor total, km e combustível são obrigatórios' });
  }

  try {

    const insertData = {
      user_id: req.user.id,
      carro_id: carro_id || null,
      data: data || new Date().toISOString().split('T')[0],
      combustivel,
      litros: parseFloat(litros),
      valor_total: parseFloat(valor_total),
      km_no_momento: parseInt(km_no_momento),
      posto: posto || null,
      tanque_cheio: tanque_cheio !== false,
      observacao: observacao || null
    };

    console.log('INSERINDO:', insertData);

    const { data: result, error } = await supabaseAdmin
      .from('abastecimentos')
      .insert(insertData)
      .select()
      .single();

    console.log('RESULTADO:', result, 'ERRO:', error);

    if (error) return res.status(400).json({ error: error.message });

    // Atualiza km do carro
    if (carro_id) {
      await supabaseAdmin
        .from('carros')
        .update({ km_atual: parseInt(km_no_momento) })
        .eq('id', carro_id)
        .eq('user_id', req.user.id);
    }

    return res.status(201).json(result);
  } catch (err) {
    console.error('ERRO CATCH:', err.message, err.stack);
    return res.status(500).json({ error: err.message });
  }
};

// Deletar abastecimento
const deletar = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin
      .from('abastecimentos')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: 'Abastecimento removido com sucesso' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Resumo de consumo
const resumoConsumo = async (req, res) => {
  const { carro_id } = req.query;
  try {
    let query = supabaseAdmin
      .from('abastecimentos')
      .select('*')
      .eq('user_id', req.user.id)
      .order('data', { ascending: false })
      .limit(10);

    if (carro_id) query = query.eq('carro_id', carro_id);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    if (!data.length) return res.json({ media: 0, historico: [] });

    const comConsumo = data.filter(a => a.km_por_litro);
    const media = comConsumo.length > 0
      ? (comConsumo.reduce((s, a) => s + Number(a.km_por_litro), 0) / comConsumo.length).toFixed(2)
      : 0;
    const melhor = comConsumo.length > 0 ? Math.max(...comConsumo.map(a => Number(a.km_por_litro))).toFixed(2) : 0;
    const pior = comConsumo.length > 0 ? Math.min(...comConsumo.map(a => Number(a.km_por_litro))).toFixed(2) : 0;
    const total_gasto = data.reduce((s, a) => s + Number(a.valor_total), 0).toFixed(2);
    const total_litros = data.reduce((s, a) => s + Number(a.litros), 0).toFixed(2);

    return res.json({ media, melhor, pior, total_gasto, total_litros, historico: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { listar, criar, deletar, resumoConsumo };