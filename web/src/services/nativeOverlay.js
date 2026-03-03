/**
 * Serviço que conecta o React com os plugins nativos do Android (via Capacitor).
 * Em ambiente web (browser), as funções retornam valores padrão sem erro.
 */

const isNativeAndroid = () => {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
};

const getPlugin = (name) => {
  if (!isNativeAndroid()) return null;
  return window.Capacitor?.Plugins?.[name] ?? null;
};

/**
 * Verifica o status de todas as permissões necessárias para o overlay funcionar.
 * @returns {{ overlay: boolean, notificationListener: boolean, allGranted: boolean }}
 */
export async function getPermissionsStatus() {
  const Overlay = getPlugin('Overlay');
  if (!Overlay) {
    return { overlay: false, notificationListener: false, allGranted: false, isWeb: true };
  }
  return Overlay.getPermissionsStatus();
}

/**
 * Solicita permissão de overlay (SYSTEM_ALERT_WINDOW).
 * Abre as configurações do Android.
 */
export async function requestOverlayPermission() {
  const Overlay = getPlugin('Overlay');
  if (!Overlay) return { opened: false };
  return Overlay.requestPermission();
}

/**
 * Solicita permissão de NotificationListenerService.
 * Abre as configurações de acesso a notificações do Android.
 */
export async function requestNotificationPermission() {
  const NotificationListener = getPlugin('NotificationListener');
  if (!NotificationListener) return { opened: false };
  return NotificationListener.requestPermission();
}

/**
 * Salva o JWT do usuário no storage nativo para uso pelos serviços em background.
 * @param {string} token - JWT de autenticação
 */
export async function saveTokenToNative(token) {
  const NotificationListener = getPlugin('NotificationListener');
  if (!NotificationListener) return;
  return NotificationListener.saveToken({ token });
}

/**
 * Inicia o serviço de monitoramento de corridas em background.
 */
export async function startMonitoring() {
  const NotificationListener = getPlugin('NotificationListener');
  if (!NotificationListener) return { started: false };
  return NotificationListener.startMonitoring();
}

/**
 * Para o serviço de monitoramento.
 */
export async function stopMonitoring() {
  const NotificationListener = getPlugin('NotificationListener');
  if (!NotificationListener) return { stopped: false };
  return NotificationListener.stopMonitoring();
}
