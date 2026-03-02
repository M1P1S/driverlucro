import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await login(email, senha);
      navigate('/');
    } catch {
      setErro('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif",
      padding: '20px'
    }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99, 179, 237, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(99, 179, 237, 0); }
        }
        .card { animation: fadeIn 0.6s ease forwards; }
        .logo { animation: float 3s ease-in-out infinite; }
        .btn-login:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(99,179,237,0.4); }
        .btn-login { transition: all 0.3s ease; }
        .input-field:focus { border-color: #63b3ed; box-shadow: 0 0 0 3px rgba(99,179,237,0.2); outline: none; }
        .input-field { transition: all 0.3s ease; }
      `}</style>

      {/* Círculos decorativos */}
      <div style={{ position: 'fixed', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(99,179,237,0.05)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-150px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(159,122,234,0.05)', pointerEvents: 'none' }} />

      <div className="card" style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '48px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        {/* Logo */}
        <div className="logo" style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '56px', marginBottom: '8px' }}>🚗</div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-1px' }}>
            Driver<span style={{ color: '#63b3ed' }}>Lucro</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '6px' }}>
            Controle financeiro para motoristas
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {erro && (
            <div style={{
              background: 'rgba(245,101,101,0.15)',
              border: '1px solid rgba(245,101,101,0.3)',
              color: '#fc8181',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {erro}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: '#fff',
                fontSize: '15px',
                boxSizing: 'border-box'
              }}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
              SENHA
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="input-field"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: '#fff',
                fontSize: '15px',
                boxSizing: 'border-box'
              }}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-login"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #63b3ed, #4299e1)',
              border: 'none',
              borderRadius: '12px',
              padding: '15px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              letterSpacing: '0.5px'
            }}
          >
            {loading ? '⏳ Entrando...' : '→ Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '28px' }}>
          Não tem conta?{' '}
          <Link to="/register" style={{ color: '#63b3ed', fontWeight: '600', textDecoration: 'none' }}>
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;