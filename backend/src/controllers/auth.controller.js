const { supabaseAdmin } = require('../config/supabase');

// Cadastro
const register = async (req, res) => {
  const { nome, email, senha, telefone } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      user_metadata: { nome, telefone },
      email_confirm: true
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: { id: data.user.id, email: data.user.email, nome }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Login
const login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) return res.status(401).json({ error: 'Email ou senha incorretos' });

    return res.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        nome: data.user.user_metadata?.nome
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Perfil do usuário logado
const perfil = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) return res.status(404).json({ error: 'Perfil não encontrado' });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = { register, login, perfil };