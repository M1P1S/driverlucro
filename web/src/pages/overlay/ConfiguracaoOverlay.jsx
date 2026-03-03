import { useState, useEffect } from 'react';
import {
  getPermissionsStatus,
  requestOverlayPermission,
  requestNotificationPermission,
  startMonitoring,
  stopMonitoring,
  saveTokenToNative,
} from '../../services/nativeOverlay';
import { useAuth } from '../../context/AuthContext';

export default function ConfiguracaoOverlay() {
  const { session } = useAuth();
  const [permissions, setPermissions] = useState({
    overlay: false,
    notificationListener: false,
    allGranted: false,
    isWeb: true,
  });
  const [monitoring, setMonitoring] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const isAndroid = !permissions.isWeb;

  useEffect(() => {
    checkPermissions();
  }, []);

  // Salvar token no nativo quando a sessão estiver disponível
  useEffect(() => {
    if (session?.access_token && isAndroid) {
      saveTokenToNative(session.access_token).catch(() => {});
    }
  }, [session, isAndroid]);

  const checkPermissions = async () => {
    setLoading(true);
    const status = await getPermissionsStatus();
    setPermissions(status);
    setLoading(false);
  };

  const handleRequestOverlay = async () => {
    await requestOverlayPermission();
    setMsg('Conceda a permissão e volte para este app.');
    setTimeout(checkPermissions, 3000);
  };

  const handleRequestNotification = async () => {
    await requestNotificationPermission();
    setMsg('Ative o DriverLucro na lista de apps com acesso a notificações.');
    setTimeout(checkPermissions, 3000);
  };

  const handleToggleMonitoring = async () => {
    if (monitoring) {
      await stopMonitoring();
      setMonitoring(false);
      setMsg('Monitoramento pausado.');
    } else {
      if (!permissions.allGranted) {
        setMsg('Conceda todas as permissões primeiro.');
        return;
      }
      await startMonitoring();
      setMonitoring(true);
      setMsg('Monitoramento ativado! O overlay aparecerá quando uma corrida chegar.');
    }
  };

  const statusIcon = (granted) => granted ? '✅' : '❌';

  return (
    <div style={{ padding: '16px', maxWidth: '480px', margin: '0 auto' }}>
      <h2 style={{ color: '#fff', marginBottom: '4px' }}>Overlay em Tempo Real</h2>
      <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '24px' }}>
        Avaliação automática de corridas exibida diretamente sobre o app da plataforma.
      </p>

      {/* Aviso web */}
      {permissions.isWeb && !loading && (
        <div style={{
          background: '#1E293B',
          border: '1px solid #F59E0B',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <p style={{ color: '#F59E0B', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            📱 Funcionalidade Android Exclusiva
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
            O overlay em tempo real requer o app instalado no seu celular Android.
            No navegador você pode usar o <strong style={{ color: '#fff' }}>Avaliador Manual</strong> normalmente.
          </p>
        </div>
      )}

      {/* Como funciona */}
      <div style={{
        background: '#111827',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
      }}>
        <h3 style={{ color: '#E5E7EB', fontSize: '14px', margin: '0 0 12px 0' }}>Como funciona</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { icon: '🔔', text: 'Uber/99/InDriver envia notificação de corrida' },
            { icon: '🤖', text: 'DriverLucro lê a notificação automaticamente' },
            { icon: '⚡', text: 'Avalia em menos de 1 segundo com seus dados históricos' },
            { icon: '📊', text: 'Exibe card flutuante com ACEITAR/AVALIAR/REJEITAR' },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>{step.icon}</span>
              <span style={{ color: '#9CA3AF', fontSize: '13px' }}>{step.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Permissões */}
      {isAndroid && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#E5E7EB', fontSize: '14px', marginBottom: '12px' }}>
            Permissões Necessárias
          </h3>

          {/* Overlay */}
          <div style={{
            background: '#1F2937',
            borderRadius: '8px',
            padding: '14px',
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <p style={{ color: '#fff', margin: '0 0 2px 0', fontSize: '14px' }}>
                {statusIcon(permissions.overlay)} Desenhar sobre outros apps
              </p>
              <p style={{ color: '#6B7280', fontSize: '12px', margin: 0 }}>
                Permissão SYSTEM_ALERT_WINDOW
              </p>
            </div>
            {!permissions.overlay && (
              <button
                onClick={handleRequestOverlay}
                style={{
                  background: '#6366F1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Conceder
              </button>
            )}
          </div>

          {/* Notificação */}
          <div style={{
            background: '#1F2937',
            borderRadius: '8px',
            padding: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <p style={{ color: '#fff', margin: '0 0 2px 0', fontSize: '14px' }}>
                {statusIcon(permissions.notificationListener)} Acesso a notificações
              </p>
              <p style={{ color: '#6B7280', fontSize: '12px', margin: 0 }}>
                NotificationListenerService
              </p>
            </div>
            {!permissions.notificationListener && (
              <button
                onClick={handleRequestNotification}
                style={{
                  background: '#6366F1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Conceder
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mensagem */}
      {msg && (
        <div style={{
          background: '#1E293B',
          border: '1px solid #6366F1',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          color: '#A5B4FC',
          fontSize: '13px',
        }}>
          {msg}
        </div>
      )}

      {/* Botão ligar/desligar */}
      {isAndroid && (
        <button
          onClick={handleToggleMonitoring}
          disabled={!permissions.allGranted && !monitoring}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: permissions.allGranted || monitoring ? 'pointer' : 'not-allowed',
            background: monitoring
              ? '#DC2626'
              : permissions.allGranted
                ? '#22C55E'
                : '#374151',
            color: '#fff',
            marginBottom: '12px',
          }}
        >
          {monitoring ? '⏹ Pausar Monitoramento' : '▶ Ativar Monitoramento'}
        </button>
      )}

      <button
        onClick={checkPermissions}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #374151',
          background: 'transparent',
          color: '#9CA3AF',
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        Atualizar Status
      </button>
    </div>
  );
}
