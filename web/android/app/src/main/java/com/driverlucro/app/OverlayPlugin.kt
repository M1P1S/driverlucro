package com.driverlucro.app

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Plugin Capacitor que expõe o controle do overlay para o React.
 * Permite verificar e solicitar permissão SYSTEM_ALERT_WINDOW.
 */
@CapacitorPlugin(name = "Overlay")
class OverlayPlugin : Plugin() {

    /**
     * Verifica se o app tem permissão para exibir overlay.
     * JS: Overlay.canDraw()
     */
    @PluginMethod
    fun canDraw(call: PluginCall) {
        val result = JSObject()
        val canDraw = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }
        result.put("canDraw", canDraw)
        call.resolve(result)
    }

    /**
     * Abre as configurações do Android para o usuário conceder permissão de overlay.
     * JS: Overlay.requestPermission()
     */
    @PluginMethod
    fun requestPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            activity.startActivity(intent)
        }
        val result = JSObject()
        result.put("opened", true)
        call.resolve(result)
    }

    /**
     * Retorna o status completo de todas as permissões necessárias.
     * JS: Overlay.getPermissionsStatus()
     */
    @PluginMethod
    fun getPermissionsStatus(call: PluginCall) {
        val canDrawOverlay = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }

        // Verificar NotificationListener
        val flat = Settings.Secure.getString(
            context.contentResolver,
            "enabled_notification_listeners"
        ) ?: ""
        val notificationEnabled = flat.split(":").any {
            val cn = android.content.ComponentName.unflattenFromString(it)
            cn?.packageName == context.packageName
        }

        val result = JSObject().apply {
            put("overlay", canDrawOverlay)
            put("notificationListener", notificationEnabled)
            put("allGranted", canDrawOverlay && notificationEnabled)
        }
        call.resolve(result)
    }
}
