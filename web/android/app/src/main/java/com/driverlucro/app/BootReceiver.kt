package com.driverlucro.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Inicia o RideOverlayService automaticamente quando o celular é ligado.
 * Requer permissão RECEIVE_BOOT_COMPLETED no AndroidManifest.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action == Intent.ACTION_BOOT_COMPLETED || action == "android.intent.action.QUICKBOOT_POWERON") {
            Log.d("BootReceiver", "Boot detectado — iniciando RideOverlayService")
            val serviceIntent = Intent(context, RideOverlayService::class.java)
            context.startForegroundService(serviceIntent)
        }
    }
}
