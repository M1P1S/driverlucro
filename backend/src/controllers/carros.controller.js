const { supabaseAdmin } = require('../config/supabase');

// Listar carros do usuário
const listar = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('carros')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar carro
const criar = async (req, res) => {
  const { apelido, modelo, placa, ano, combustivel, consumo_medio_estimado, km_atual } = req.body;

  if (!modelo) {
    return res.status(400).json({ error: 'Modelo do carro é obrigatório' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('carros')
      .insert({
        user_id: req.user.id,
        apelido, modelo, placa, ano,
        combustivel: combustivel || 'flex',
        consumo_medio_estimado,
        km_atual: km_atual || 0
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar carro
const atualizar = async (req, res) => {
  const { id } = req.params;
  const campos = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('carros')
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

// Deletar carro (soft delete)
const deletar = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('carros')
      .update({ ativo: false })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: 'Carro removido com sucesso' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = { listar, criar, atualizar, deletar };