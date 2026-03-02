const { supabaseAdmin } = require('../config/supabase');

const listar = async (req, res) => {
  const { carro_id } = req.query;
  try {
    let query = supabaseAdmin
      .from('manutencoes')
      .select('*, carros(modelo, apelido), tipos_manutencao(nome, icone)')
      .eq('user_id', req.user.id)
      .order('data', { ascending: false });

    if (carro_id) query = query.eq('carro_id', carro_id);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const criar = async (req, res) => {
  const { carro_id, tipo_manutencao_id, data_realizada, km_realizado, custo, proxima_data, proximo_km, oficina, observacao } = req.body;

  if (!carro_id || !tipo_manutencao_id || !data_realizada || !km_realizado) {
    return res.status(400).json({ error: 'Carro, tipo, data e KM são obrigatórios' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('manutencoes')
      .insert({
        user_id: req.user.id,
        carro_id,
        tipo_manutencao_id,
        data: data_realizada,
        km_no_momento: parseInt(km_realizado),
        valor: custo ? parseFloat(custo) : null,
        proxima_troca_data: proxima_data || null,
        proxima_troca_km: proximo_km ? parseInt(proximo_km) : null,
        oficina: oficina || null,
        observacao: observacao || null
      })
      .select('*, carros(modelo, apelido), tipos_manutencao(nome, icone)')
      .single();

    if (error) return res.status(400).json({ error: error.message });

    if (proxima_data || proximo_km) {
      await supabaseAdmin
        .from('alertas_manutencao')
        .insert({
          user_id: req.user.id,
          carro_id,
          tipo_manutencao_id,
          data_alerta: proxima_data || null,
          km_alerta: proximo_km ? parseInt(proximo_km) : null,
          ativo: true
        });
    }

    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const deletar = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin
      .from('manutencoes')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: 'Manutenção removida com sucesso' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getAlertas = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('alertas_manutencao')
      .select('*, carros(modelo, apelido, km_atual), tipos_manutencao(nome, icone)')
      .eq('user_id', req.user.id)
      .eq('ativo', true)
      .order('data_alerta', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    const hoje = new Date();
    const alertasComStatus = data.map(alerta => {
      let urgencia = 'normal';
      let mensagem = '';

      if (alerta.data_alerta) {
        const diasRestantes = Math.ceil((new Date(alerta.data_alerta) - hoje) / (1000 * 60 * 60 * 24));
        if (diasRestantes < 0) { urgencia = 'atrasado'; mensagem = `Atrasado ${Math.abs(diasRestantes)} dias`; }
        else if (diasRestantes <= 7) { urgencia = 'urgente'; mensagem = `Vence em ${diasRestantes} dias`; }
        else if (diasRestantes <= 30) { urgencia = 'proximo'; mensagem = `Vence em ${diasRestantes} dias`; }
        else { mensagem = `Vence em ${diasRestantes} dias`; }
      }

      if (alerta.km_alerta && alerta.carros?.km_atual) {
        const kmRestantes = alerta.km_alerta - alerta.carros.km_atual;
        if (kmRestantes < 0) { urgencia = 'atrasado'; mensagem += ` • ${Math.abs(kmRestantes)} km atrasado`; }
        else if (kmRestantes <= 500) { urgencia = urgencia === 'atrasado' ? 'atrasado' : 'urgente'; mensagem += ` • ${kmRestantes} km restantes`; }
        else if (kmRestantes <= 1000) { urgencia = urgencia === 'normal' ? 'proximo' : urgencia; mensagem += ` • ${kmRestantes} km restantes`; }
      }

      return { ...alerta, urgencia, mensagem };
    });

    return res.json(alertasComStatus);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getTipos = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('tipos_manutencao')
      .select('id, nome, icone')
      .order('nome');

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { listar, criar, deletar, getAlertas, getTipos };