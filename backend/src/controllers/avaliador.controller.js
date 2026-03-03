const { supabaseAdmin } = require('../config/supabase');

// Taxas padrão por plataforma (%)
const TAXAS_PLATAFORMA = {
  uber: 25,
  '99': 25,
  indriver: 20,
  cabify: 25,
  ladydriver: 20,
};

// Avaliar se uma corrida vale a pena
const avaliarCorrida = async (req, res) => {
  const {
    plataforma,
    distancia_km,
    tempo_estimado_min,
    valor_ofertado,
    preco_combustivel,
    km_por_litro,
    salvar_historico = false,
  } = req.body;

  if (!plataforma || !distancia_km || !tempo_estimado_min || !valor_ofertado || !preco_combustivel || !km_por_litro) {
    return res.status(400).json({
      error: 'Campos obrigatórios: plataforma, distancia_km, tempo_estimado_min, valor_ofertado, preco_combustivel, km_por_litro',
    });
  }

  try {
    const taxa_percentual = TAXAS_PLATAFORMA[plataforma] || 25;

    // Cálculos financeiros
    const custo_combustivel = (Number(distancia_km) / Number(km_por_litro)) * Number(preco_combustivel);
    const desconto_plataforma = Number(valor_ofertado) * (taxa_percentual / 100);
    const valor_liquido = Number(valor_ofertado) - desconto_plataforma - custo_combustivel;
    const horas_estimadas = Number(tempo_estimado_min) / 60;
    const ganho_por_hora = horas_estimadas > 0 ? valor_liquido / horas_estimadas : 0;
    const ganho_por_km = Number(distancia_km) > 0 ? valor_liquido / Number(distancia_km) : 0;
    const percentual_custo = Number(valor_ofertado) > 0 ? (custo_combustivel / Number(valor_ofertado)) * 100 : 0;

    // Busca métricas históricas do motorista para comparação
    const hoje = new Date().toISOString().split('T')[0];
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    const dataInicio30d = trintaDiasAtras.toISOString().split('T')[0];

    const { data: lancamentos30d } = await supabaseAdmin
      .from('lancamentos')
      .select('valor_liquido, horas_trabalhadas, corridas')
      .eq('user_id', req.user.id)
      .gte('data', dataInicio30d)
      .lte('data', hoje);

    let ganho_medio_por_hora_historico = 0;
    let ganho_medio_por_corrida_historico = 0;

    if (lancamentos30d && lancamentos30d.length > 0) {
      const total_liquido_30d = lancamentos30d.reduce((s, l) => s + Number(l.valor_liquido), 0);
      const total_horas_30d = lancamentos30d.reduce((s, l) => s + Number(l.horas_trabalhadas || 0), 0);
      const total_corridas_30d = lancamentos30d.reduce((s, l) => s + Number(l.corridas || 0), 0);

      ganho_medio_por_hora_historico = total_horas_30d > 0 ? total_liquido_30d / total_horas_30d : 0;
      ganho_medio_por_corrida_historico = total_corridas_30d > 0 ? total_liquido_30d / total_corridas_30d : 0;
    }

    // Busca meta diária configurada
    const { data: metaConfig } = await supabaseAdmin
      .from('metas_config')
      .select('valor_meta_diaria')
      .eq('user_id', req.user.id)
      .single();

    const meta_diaria = metaConfig?.valor_meta_diaria || 200;

    // Critérios de avaliação com pontuação
    let pontos = 0;
    const motivos = [];

    // Critério 1: Valor mínimo líquido (R$ 5 por corrida)
    if (valor_liquido >= 5) {
      pontos += 25;
      motivos.push({ tipo: 'positivo', texto: `Lucro líquido de R$ ${valor_liquido.toFixed(2)} é aceitável` });
    } else if (valor_liquido >= 2) {
      pontos += 10;
      motivos.push({ tipo: 'atencao', texto: `Lucro líquido de R$ ${valor_liquido.toFixed(2)} está abaixo do ideal` });
    } else {
      motivos.push({ tipo: 'negativo', texto: `Lucro líquido de R$ ${valor_liquido.toFixed(2)} é muito baixo` });
    }

    // Critério 2: Comparação com ganho/hora histórico
    if (ganho_medio_por_hora_historico > 0) {
      const percentual_vs_historico = (ganho_por_hora / ganho_medio_por_hora_historico) * 100;
      if (percentual_vs_historico >= 90) {
        pontos += 30;
        motivos.push({ tipo: 'positivo', texto: `Ganho/hora (R$ ${ganho_por_hora.toFixed(2)}/h) está dentro da sua média histórica` });
      } else if (percentual_vs_historico >= 70) {
        pontos += 15;
        motivos.push({ tipo: 'atencao', texto: `Ganho/hora (R$ ${ganho_por_hora.toFixed(2)}/h) está abaixo da média histórica (R$ ${ganho_medio_por_hora_historico.toFixed(2)}/h)` });
      } else {
        motivos.push({ tipo: 'negativo', texto: `Ganho/hora (R$ ${ganho_por_hora.toFixed(2)}/h) muito abaixo da sua média (R$ ${ganho_medio_por_hora_historico.toFixed(2)}/h)` });
      }
    } else {
      // Sem histórico, usa benchmark genérico: R$ 15/h
      if (ganho_por_hora >= 15) {
        pontos += 30;
        motivos.push({ tipo: 'positivo', texto: `Ganho/hora de R$ ${ganho_por_hora.toFixed(2)}/h é bom` });
      } else if (ganho_por_hora >= 10) {
        pontos += 15;
        motivos.push({ tipo: 'atencao', texto: `Ganho/hora de R$ ${ganho_por_hora.toFixed(2)}/h está moderado` });
      } else {
        motivos.push({ tipo: 'negativo', texto: `Ganho/hora de R$ ${ganho_por_hora.toFixed(2)}/h está baixo` });
      }
    }

    // Critério 3: Custo de combustível vs valor ofertado
    if (percentual_custo <= 15) {
      pontos += 25;
      motivos.push({ tipo: 'positivo', texto: `Custo de combustível baixo (${percentual_custo.toFixed(1)}% do valor)` });
    } else if (percentual_custo <= 25) {
      pontos += 15;
      motivos.push({ tipo: 'atencao', texto: `Custo de combustível moderado (${percentual_custo.toFixed(1)}% do valor)` });
    } else {
      motivos.push({ tipo: 'negativo', texto: `Alto custo de combustível (${percentual_custo.toFixed(1)}% do valor bruto)` });
    }

    // Critério 4: Valor por km
    if (ganho_por_km >= 1.5) {
      pontos += 20;
      motivos.push({ tipo: 'positivo', texto: `Bom valor por km (R$ ${ganho_por_km.toFixed(2)}/km)` });
    } else if (ganho_por_km >= 0.8) {
      pontos += 10;
      motivos.push({ tipo: 'atencao', texto: `Valor por km moderado (R$ ${ganho_por_km.toFixed(2)}/km)` });
    } else {
      motivos.push({ tipo: 'negativo', texto: `Baixo valor por km (R$ ${ganho_por_km.toFixed(2)}/km)` });
    }

    // Veredicto final
    let veredicto, cor_veredicto;
    if (pontos >= 70) {
      veredicto = 'ACEITAR';
      cor_veredicto = 'verde';
    } else if (pontos >= 40) {
      veredicto = 'AVALIAR';
      cor_veredicto = 'amarelo';
    } else {
      veredicto = 'REJEITAR';
      cor_veredicto = 'vermelho';
    }

    const resultado = {
      veredicto,
      cor_veredicto,
      pontuacao: pontos,
      detalhes: {
        plataforma,
        distancia_km: Number(distancia_km),
        tempo_estimado_min: Number(tempo_estimado_min),
        valor_ofertado: Number(valor_ofertado),
        taxa_percentual,
        desconto_plataforma: Number(desconto_plataforma.toFixed(2)),
        custo_combustivel: Number(custo_combustivel.toFixed(2)),
        valor_liquido: Number(valor_liquido.toFixed(2)),
        ganho_por_hora: Number(ganho_por_hora.toFixed(2)),
        ganho_por_km: Number(ganho_por_km.toFixed(2)),
        percentual_custo: Number(percentual_custo.toFixed(1)),
        ganho_medio_por_hora_historico: Number(ganho_medio_por_hora_historico.toFixed(2)),
        meta_diaria,
      },
      motivos,
    };

    // Salva no histórico se solicitado
    if (salvar_historico) {
      await supabaseAdmin
        .from('avaliacoes_corrida')
        .insert({
          user_id: req.user.id,
          plataforma,
          distancia_km: Number(distancia_km),
          tempo_estimado_min: Number(tempo_estimado_min),
          valor_ofertado: Number(valor_ofertado),
          custo_combustivel: Number(custo_combustivel.toFixed(2)),
          valor_liquido: Number(valor_liquido.toFixed(2)),
          ganho_por_hora: Number(ganho_por_hora.toFixed(2)),
          veredicto,
          pontuacao: pontos,
        });
    }

    return res.json(resultado);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar histórico de avaliações
const listarAvaliacoes = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('avaliacoes_corrida')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar configurações do veículo para pré-preencher o avaliador
const getConfigAvaliador = async (req, res) => {
  try {
    // Busca veículo ativo com melhor dado de consumo
    const { data: carros } = await supabaseAdmin
      .from('carros')
      .select('id, apelido, modelo, combustivel, consumo_medio_estimado')
      .eq('user_id', req.user.id)
      .eq('ativo', true)
      .limit(5);

    // Busca média de km/litro dos abastecimentos recentes
    const { data: abastecimentos } = await supabaseAdmin
      .from('abastecimentos')
      .select('km_por_litro, carro_id, combustivel')
      .eq('user_id', req.user.id)
      .not('km_por_litro', 'is', null)
      .order('data', { ascending: false })
      .limit(10);

    let km_por_litro_sugerido = 10; // padrão
    if (abastecimentos && abastecimentos.length > 0) {
      const media = abastecimentos.reduce((s, a) => s + Number(a.km_por_litro), 0) / abastecimentos.length;
      km_por_litro_sugerido = Number(media.toFixed(1));
    } else if (carros && carros.length > 0 && carros[0].consumo_medio_estimado) {
      km_por_litro_sugerido = Number(carros[0].consumo_medio_estimado);
    }

    // Busca último preço de combustível registrado
    const { data: ultimoAbast } = await supabaseAdmin
      .from('abastecimentos')
      .select('valor_total, litros, combustivel')
      .eq('user_id', req.user.id)
      .order('data', { ascending: false })
      .limit(1)
      .single();

    let preco_combustivel_sugerido = 6.00; // padrão
    if (ultimoAbast && ultimoAbast.litros > 0) {
      preco_combustivel_sugerido = Number((Number(ultimoAbast.valor_total) / Number(ultimoAbast.litros)).toFixed(2));
    }

    return res.json({
      km_por_litro_sugerido,
      preco_combustivel_sugerido,
      carros: carros || [],
      taxas_plataforma: TAXAS_PLATAFORMA,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Avaliação rápida para o overlay nativo Android.
 * Recebe apenas os dados básicos da notificação e busca automaticamente
 * as configurações do veículo do usuário (combustível, consumo).
 */
const avaliarRapido = async (req, res) => {
  const { plataforma, valor_ofertado, distancia_km, tempo_estimado_min } = req.body;

  if (!plataforma || !valor_ofertado || !distancia_km) {
    return res.status(400).json({
      error: 'Campos obrigatórios: plataforma, valor_ofertado, distancia_km',
    });
  }

  try {
    const { data: abastecimentos } = await supabaseAdmin
      .from('abastecimentos')
      .select('km_por_litro, valor_total, litros')
      .eq('user_id', req.user.id)
      .not('km_por_litro', 'is', null)
      .order('data', { ascending: false })
      .limit(10);

    let km_por_litro = 10;
    let preco_combustivel = 6.00;

    if (abastecimentos && abastecimentos.length > 0) {
      const media = abastecimentos.reduce((s, a) => s + Number(a.km_por_litro), 0) / abastecimentos.length;
      km_por_litro = Number(media.toFixed(1));
      const ultimo = abastecimentos[0];
      if (Number(ultimo.litros) > 0) {
        preco_combustivel = Number((Number(ultimo.valor_total) / Number(ultimo.litros)).toFixed(2));
      }
    } else {
      const { data: carro } = await supabaseAdmin
        .from('carros')
        .select('consumo_medio_estimado')
        .eq('user_id', req.user.id)
        .eq('ativo', true)
        .limit(1)
        .single();
      if (carro?.consumo_medio_estimado) {
        km_por_litro = Number(carro.consumo_medio_estimado);
      }
    }

    const taxa_percentual = TAXAS_PLATAFORMA[plataforma.toLowerCase()] || 25;
    const custo_combustivel = (Number(distancia_km) / km_por_litro) * preco_combustivel;
    const desconto_plataforma = Number(valor_ofertado) * (taxa_percentual / 100);
    const valor_liquido = Number(valor_ofertado) - desconto_plataforma - custo_combustivel;
    const horas_estimadas = Number(tempo_estimado_min || 0) / 60;
    const ganho_por_hora = horas_estimadas > 0 ? valor_liquido / horas_estimadas : 0;
    const ganho_por_km = Number(distancia_km) > 0 ? valor_liquido / Number(distancia_km) : 0;
    const percentual_custo = Number(valor_ofertado) > 0 ? (custo_combustivel / Number(valor_ofertado)) * 100 : 0;

    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    const { data: lancamentos30d } = await supabaseAdmin
      .from('lancamentos')
      .select('valor_liquido, horas_trabalhadas')
      .eq('user_id', req.user.id)
      .gte('data', trintaDiasAtras.toISOString().split('T')[0]);

    let ganho_medio_hora = 0;
    if (lancamentos30d && lancamentos30d.length > 0) {
      const totLiq = lancamentos30d.reduce((s, l) => s + Number(l.valor_liquido), 0);
      const totHoras = lancamentos30d.reduce((s, l) => s + Number(l.horas_trabalhadas || 0), 0);
      ganho_medio_hora = totHoras > 0 ? totLiq / totHoras : 0;
    }

    let pontos = 0;
    if (valor_liquido >= 5) pontos += 25;
    else if (valor_liquido >= 2) pontos += 10;

    if (ganho_medio_hora > 0) {
      const pct = (ganho_por_hora / ganho_medio_hora) * 100;
      if (pct >= 90) pontos += 30;
      else if (pct >= 70) pontos += 15;
    } else {
      if (ganho_por_hora >= 15) pontos += 30;
      else if (ganho_por_hora >= 10) pontos += 15;
    }

    if (percentual_custo <= 15) pontos += 25;
    else if (percentual_custo <= 25) pontos += 15;

    if (ganho_por_km >= 1.5) pontos += 20;
    else if (ganho_por_km >= 0.8) pontos += 10;

    let verdict;
    if (pontos >= 70) verdict = 'ACEITAR';
    else if (pontos >= 40) verdict = 'AVALIAR';
    else verdict = 'REJEITAR';

    return res.json({
      verdict,
      score: pontos,
      platform: plataforma,
      valor_liquido: Number(valor_liquido.toFixed(2)),
      ganho_por_km: Number(ganho_por_km.toFixed(2)),
      ganho_por_hora: Number(ganho_por_hora.toFixed(2)),
      custo_combustivel: Number(custo_combustivel.toFixed(2)),
      message: `${verdict} — ${pontos} pts`,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = { avaliarCorrida, listarAvaliacoes, getConfigAvaliador, avaliarRapido };
