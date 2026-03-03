package com.driverlucro.app

import android.app.Notification
import android.content.Intent
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import org.json.JSONObject

/**
 * Serviço que intercepta notificações dos apps de corrida (Uber, 99, InDriver, Cabify).
 * Quando uma corrida chega, extrai os dados e dispara o avaliador com overlay.
 */
class RideNotificationService : NotificationListenerService() {

    companion object {
        const val TAG = "RideNotificationSvc"
        const val ACTION_RIDE_DETECTED = "com.driverlucro.RIDE_DETECTED"

        // Package names dos apps de corrida monitorados
        val RIDE_APP_PACKAGES = mapOf(
            "com.ubercab.driver" to "Uber",
            "com.ubercab.ubereats.driver" to "Uber",
            "br.com.ninety9" to "99",
            "com.indriverapp.driver" to "InDriver",
            "com.cabify.driver" to "Cabify"
        )

        // Palavras-chave que indicam uma nova corrida disponível
        val RIDE_KEYWORDS = listOf(
            // Uber
            "nova viagem", "new trip", "trip request",
            // 99
            "nova corrida", "corrida disponível", "solicitação",
            // InDriver
            "proposta", "oferta de corrida", "novo pedido",
            // Cabify
            "nova solicitação", "viagem disponível"
        )
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        sbn ?: return

        val packageName = sbn.packageName ?: return
        val platform = RIDE_APP_PACKAGES[packageName] ?: return

        val extras: Bundle = sbn.notification?.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.lowercase() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: text

        Log.d(TAG, "[$platform] Notificação recebida - Título: $title | Texto: $text")

        // Verificar se é uma corrida nova
        val isRideRequest = RIDE_KEYWORDS.any { keyword ->
            title.contains(keyword) || text.lowercase().contains(keyword)
        }

        if (!isRideRequest) {
            Log.d(TAG, "[$platform] Notificação ignorada (não é corrida)")
            return
        }

        Log.d(TAG, "[$platform] CORRIDA DETECTADA! Analisando...")

        // Extrair dados da corrida do texto da notificação
        val rideData = parseRideData(platform, title, bigText)
        rideData.put("raw_title", title)
        rideData.put("raw_text", bigText)
        rideData.put("notification_id", sbn.id)

        // Disparar intent para o RideOverlayService processar e exibir o overlay
        val intent = Intent(this, RideOverlayService::class.java).apply {
            action = ACTION_RIDE_DETECTED
            putExtra("ride_data", rideData.toString())
            putExtra("platform", platform)
        }
        startService(intent)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // Corrida aceita ou expirou — pode-se fechar o overlay automaticamente
        sbn ?: return
        val packageName = sbn.packageName ?: return
        if (RIDE_APP_PACKAGES.containsKey(packageName)) {
            val intent = Intent(this, RideOverlayService::class.java).apply {
                action = "com.driverlucro.NOTIFICATION_REMOVED"
                putExtra("notification_id", sbn.id)
            }
            startService(intent)
        }
    }

    /**
     * Extrai valor, distância e tempo estimado do texto da notificação.
     * Cada plataforma tem formatos diferentes — usamos regex para capturar.
     */
    private fun parseRideData(platform: String, title: String, text: String): JSONObject {
        val data = JSONObject()
        data.put("platform", platform)

        val fullText = "$title $text"

        // Extrair valor monetário (R$ 12,50 ou R$12.50 ou 12,50)
        val valueRegex = Regex("""R\$\s*(\d+[,.]?\d*)""")
        val valueMatch = valueRegex.find(fullText)
        if (valueMatch != null) {
            val valueStr = valueMatch.groupValues[1].replace(",", ".")
            data.put("valor_ofertado", valueStr.toDoubleOrNull() ?: 0.0)
        }

        // Extrair distância (ex: "3,2 km" ou "5.1km" ou "3 km")
        val distanceRegex = Regex("""(\d+[,.]?\d*)\s*km""", RegexOption.IGNORE_CASE)
        val distanceMatch = distanceRegex.find(fullText)
        if (distanceMatch != null) {
            val distStr = distanceMatch.groupValues[1].replace(",", ".")
            data.put("distancia_km", distStr.toDoubleOrNull() ?: 0.0)
        }

        // Extrair tempo estimado (ex: "12 min" ou "~8 minutos")
        val timeRegex = Regex("""(\d+)\s*min""", RegexOption.IGNORE_CASE)
        val timeMatch = timeRegex.find(fullText)
        if (timeMatch != null) {
            data.put("tempo_estimado_min", timeMatch.groupValues[1].toIntOrNull() ?: 0)
        }

        // Se não conseguiu extrair dados suficientes, marca como incompleto
        val hasValue = data.has("valor_ofertado") && data.getDouble("valor_ofertado") > 0
        val hasDistance = data.has("distancia_km") && data.getDouble("distancia_km") > 0
        data.put("dados_completos", hasValue && hasDistance)

        Log.d(TAG, "[$platform] Dados extraídos: $data")
        return data
    }
}
