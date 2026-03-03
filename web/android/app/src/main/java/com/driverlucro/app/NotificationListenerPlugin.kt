package com.driverlucro.app

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Plugin Capacitor que expõe a funcionalidade de leitura de notificações para o React.
 * Permite verificar e solicitar a permissão de NotificationListenerService.
 */
@CapacitorPlugin(name = "NotificationListener")
class NotificationListenerPlugin : Plugin() {

    /**
     * Verifica se o DriverLucro tem permissão para ler notificações.
     * JS: NotificationListener.isEnabled()
     */
    @PluginMethod
    fun isEnabled(call: PluginCall) {
        val result = JSObject()
        result.put("enabled", isNotificationServiceEnabled())
        call.resolve(result)
    }

    /**
     * Abre as configurações do Android para o usuário conceder permissão.
     * JS: NotificationListener.requestPermission()
     */
    @PluginMethod
    fun requestPermission(call: PluginCall) {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        activity.startActivity(intent)
        val result = JSObject()
        result.put("opened", true)
        call.resolve(result)
    }

    /**
     * Salva o token JWT do usuário para uso interno nos serviços nativos.
     * JS: NotificationListener.saveToken({ token: "..." })
     */
    @PluginMethod
    fun saveToken(call: PluginCall) {
        val token = call.getString("token") ?: run {
            call.reject("token é obrigatório")
            return
        }
        val prefs = context.getSharedPreferences("DriverLucroPrefs", android.content.Context.MODE_PRIVATE)
        prefs.edit().putString("auth_token", token).apply()

        val result = JSObject()
        result.put("saved", true)
        call.resolve(result)
    }

    /**
     * Inicia o serviço de monitoramento.
     * JS: NotificationListener.startMonitoring()
     */
    @PluginMethod
    fun startMonitoring(call: PluginCall) {
        val intent = Intent(context, RideOverlayService::class.java)
        context.startForegroundService(intent)
        val result = JSObject()
        result.put("started", true)
        call.resolve(result)
    }

    /**
     * Para o serviço de monitoramento.
     * JS: NotificationListener.stopMonitoring()
     */
    @PluginMethod
    fun stopMonitoring(call: PluginCall) {
        val intent = Intent(context, RideOverlayService::class.java)
        context.stopService(intent)
        val result = JSObject()
        result.put("stopped", true)
        call.resolve(result)
    }

    private fun isNotificationServiceEnabled(): Boolean {
        val pkgName = context.packageName
        val flat = Settings.Secure.getString(
            context.contentResolver,
            "enabled_notification_listeners"
        ) ?: return false
        if (flat.isEmpty()) return false
        val names = flat.split(":")
        for (name in names) {
            val cn = ComponentName.unflattenFromString(name) ?: continue
            if (cn.packageName == pkgName) return true
        }
        return false
    }
}
