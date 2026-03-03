import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
  { path: '/', label: '🏠 Dashboard' },
  { path: '/lancamentos', label: '💰 Lançamentos' },
  { path: '/metas', label: '🎯 Meta Diária' },
  { path: '/abastecimentos', label: '⛽ Abastecimentos' },
  { path: '/manutencoes', label: '🔧 Manutenções' },
  { path: '/carros', label: '🚗 Meus Carros' },
  { path: '/avaliador', label: '🚦 Avaliador' },
  { path: '/importacao', label: '📥 Importar Recibos' },
];

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .main-content { animation: fadeIn 0.4s ease forwards; }
        .nav-link:hover { background: rgba(99,179,237,0.1) !important; color: #63b3ed !important; }
        .btn-sair:hover { background: rgba(245,101,101,0.2) !important; color: #fc8181 !important; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
        .card-hover { transition: all 0.3s ease; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #1a1d2e; }
        ::-webkit-scrollbar-thumb { background: #2d3748; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🚗</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
              Driver<span style={{ color: '#63b3ed' }}>Lucro</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
              Olá, <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{user?.nome || 'Motorista'}</strong>
            </span>
            <button
              className="btn-sair"
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '7px 14px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav style={{
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '4px' }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="nav-link"
              style={{
                padding: '14px 18px',
                fontSize: '14px',
                fontWeight: '500',
                textDecoration: 'none',
                color: location.pathname === item.path ? '#63b3ed' : 'rgba(255,255,255,0.5)',
                borderBottom: location.pathname === item.path ? '2px solid #63b3ed' : '2px solid transparent',
                transition: 'all 0.2s ease',
                borderRadius: '6px 6px 0 0'
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Conteúdo */}
      <main className="main-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;