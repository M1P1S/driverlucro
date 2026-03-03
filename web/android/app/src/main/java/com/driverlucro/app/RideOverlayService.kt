package com.driverlucro.app

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.util.Log
import android.view.*
import android.view.WindowManager.LayoutParams
import android.widget.*
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

/**
 * Serviço que cria e gerencia o overlay flutuante de avaliação de corridas.
 * Exibe um card sobre o app de corrida com o veredicto do DriverLucro.
 */
class RideOverlayService : Service() {

    companion object {
        const val TAG = "RideOverlayService"
        const val CHANNEL_ID = "driverlucro_overlay"
        const val NOTIFICATION_ID = 1001
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private val httpClient = OkHttpClient()

    // URL base da API — deve ser a URL de produção ou tunnel local para dev
    private val API_BASE_URL = "https://driverlucro-backend.onrender.com/api"

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildForegroundNotification())
        Log.d(TAG, "RideOverlayService iniciado")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            RideNotificationService.ACTION_RIDE_DETECTED -> {
                val rideDataStr = intent.getStringExtra("ride_data") ?: return START_STICKY
                val platform = intent.getStringExtra("platform") ?: "Desconhecido"

                try {
                    val rideData = JSONObject(rideDataStr)
                    Log.d(TAG, "Corrida recebida: $rideData")
                    evaluateAndShowOverlay(rideData, platform)
                } catch (e: Exception) {
                    Log.e(TAG, "Erro ao processar dados da corrida: ${e.message}")
                }
            }
            "com.driverlucro.NOTIFICATION_REMOVED" -> {
                dismissOverlay()
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        dismissOverlay()
        serviceScope.cancel()
    }

    /**
     * Chama a API do DriverLucro para avaliar a corrida e exibe o overlay com o resultado.
     */
    private fun evaluateAndShowOverlay(rideData: JSONObject, platform: String) {
        if (!rideData.optBoolean("dados_completos", false)) {
            // Dados incompletos — mostrar overlay simplificado pedindo avaliação manual
            showOverlay(
                platform = platform,
                verdict = "AVALIAR",
                score = -1,
                valorLiquido = 0.0,
                ganhoKm = 0.0,
                ganhoHora = 0.0,
                combustivel = 0.0,
                message = "Abra o app para avaliar",
                incompleto = true
            )
            return
        }

        // Mostrar overlay de "Calculando..." enquanto chama a API
        showLoadingOverlay(platform)

        serviceScope.launch {
            try {
                val result = callEvaluatorAPI(rideData, platform)
                withContext(Dispatchers.Main) {
                    dismissOverlay()
                    showOverlay(
                        platform = result.getString("platform"),
                        verdict = result.getString("verdict"),
                        score = result.getInt("score"),
                        valorLiquido = result.getDouble("valor_liquido"),
                        ganhoKm = result.getDouble("ganho_por_km"),
                        ganhoHora = result.getDouble("ganho_por_hora"),
                        combustivel = result.getDouble("custo_combustivel"),
                        message = result.optString("message", ""),
                        incompleto = false
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "Erro ao chamar API: ${e.message}")
                withContext(Dispatchers.Main) {
                    dismissOverlay()
                    showOverlay(
                        platform = platform,
                        verdict = "AVALIAR",
                        score = -1,
                        valorLiquido = 0.0,
                        ganhoKm = 0.0,
                        ganhoHora = 0.0,
                        combustivel = 0.0,
                        message = "Sem conexão — avalie manualmente",
                        incompleto = true
                    )
                }
            }
        }
    }

    /**
     * Chama o endpoint /api/avaliador/avaliar via HTTP com os dados da corrida.
     */
    private suspend fun callEvaluatorAPI(rideData: JSONObject, platform: String): JSONObject {
        return withContext(Dispatchers.IO) {
            // Recuperar token JWT salvo (persistido pelo app Capacitor)
            val prefs = getSharedPreferences("DriverLucroPrefs", Context.MODE_PRIVATE)
            val token = prefs.getString("auth_token", "") ?: ""

            val body = JSONObject().apply {
                put("plataforma", platform.lowercase())
                put("valor_ofertado", rideData.optDouble("valor_ofertado", 0.0))
                put("distancia_km", rideData.optDouble("distancia_km", 0.0))
                put("tempo_estimado_min", rideData.optInt("tempo_estimado_min", 0))
                // Configurações padrão serão buscadas pelo backend do usuário
                put("usar_config_usuario", true)
            }

            val request = Request.Builder()
                .url("$API_BASE_URL/avaliador/avaliar-rapido")
                .post(body.toString().toRequestBody("application/json".toMediaType()))
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Content-Type", "application/json")
                .build()

            val response = httpClient.newCall(request).execute()
            val responseBody = response.body?.string() ?: "{}"
            JSONObject(responseBody)
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Overlay UI
    // ─────────────────────────────────────────────────────────────────────────

    private fun showLoadingOverlay(platform: String) {
        if (!canDrawOverlay()) return
        dismissOverlay()

        val view = buildOverlayView(
            platform = platform,
            verdict = "...",
            score = -1,
            loading = true,
            valorLiquido = 0.0,
            ganhoKm = 0.0,
            ganhoHora = 0.0,
            combustivel = 0.0,
            message = "Calculando...",
            incompleto = false
        )
        addOverlayToWindow(view)
    }

    private fun showOverlay(
        platform: String,
        verdict: String,
        score: Int,
        valorLiquido: Double,
        ganhoKm: Double,
        ganhoHora: Double,
        combustivel: Double,
        message: String,
        incompleto: Boolean
    ) {
        if (!canDrawOverlay()) {
            Log.w(TAG, "Sem permissão SYSTEM_ALERT_WINDOW")
            requestOverlayPermission()
            return
        }
        dismissOverlay()

        val view = buildOverlayView(
            platform = platform,
            verdict = verdict,
            score = score,
            loading = false,
            valorLiquido = valorLiquido,
            ganhoKm = ganhoKm,
            ganhoHora = ganhoHora,
            combustivel = combustivel,
            message = message,
            incompleto = incompleto
        )
        addOverlayToWindow(view)
    }

    private fun buildOverlayView(
        platform: String,
        verdict: String,
        score: Int,
        loading: Boolean,
        valorLiquido: Double,
        ganhoKm: Double,
        ganhoHora: Double,
        combustivel: Double,
        message: String,
        incompleto: Boolean
    ): View {
        // Card container
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 24, 32, 24)
            setBackgroundColor(Color.parseColor("#1E1E2E"))
            elevation = 12f
        }

        // ── Linha do topo: plataforma + botão fechar ──
        val topRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val tvPlatform = TextView(this).apply {
            text = "● $platform"
            textSize = 13f
            setTextColor(Color.parseColor("#A0A0C0"))
            layoutParams = LinearLayout.LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f)
        }

        val btnClose = TextView(this).apply {
            text = "✕"
            textSize = 16f
            setTextColor(Color.parseColor("#888888"))
            setPadding(8, 0, 0, 0)
            setOnClickListener { dismissOverlay() }
        }

        topRow.addView(tvPlatform)
        topRow.addView(btnClose)

        // ── Veredicto ──
        val (verdictColor, verdictIcon, verdictLabel) = when (verdict) {
            "ACEITAR" -> Triple("#22C55E", "✅", "ACEITAR")
            "REJEITAR" -> Triple("#EF4444", "❌", "REJEITAR")
            else -> Triple("#F59E0B", "⚠️", if (loading) "Calculando..." else "AVALIAR")
        }

        val tvVerdict = TextView(this).apply {
            text = "$verdictIcon  $verdictLabel"
            textSize = 22f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor(verdictColor))
            setPadding(0, 12, 0, 4)
        }

        // ── Score bar ──
        val scoreRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, 0, 0, 8)
        }

        if (score >= 0) {
            val tvScore = TextView(this).apply {
                text = "$score pts"
                textSize = 12f
                setTextColor(Color.parseColor("#A0A0C0"))
            }
            scoreRow.addView(tvScore)
        }

        // ── Dados financeiros ──
        val dataContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, 8, 0, 0)
        }

        if (!incompleto && !loading) {
            dataContainer.addView(buildDataRow("💰 Líquido", "R$ ${String.format("%.2f", valorLiquido)}"))
            dataContainer.addView(buildDataRow("📍 Por km", "R$ ${String.format("%.2f", ganhoKm)}"))
            dataContainer.addView(buildDataRow("⏱ Por hora", "R$ ${String.format("%.2f", ganhoHora)}"))
            dataContainer.addView(buildDataRow("⛽ Combustível", "R$ ${String.format("%.2f", combustivel)}"))
        } else if (message.isNotBlank()) {
            val tvMsg = TextView(this).apply {
                text = message
                textSize = 13f
                setTextColor(Color.parseColor("#A0A0C0"))
                setPadding(0, 4, 0, 4)
            }
            dataContainer.addView(tvMsg)
        }

        // ── Botão "Ver Detalhes" ──
        val btnDetails = TextView(this).apply {
            text = "Ver detalhes no app →"
            textSize = 12f
            setTextColor(Color.parseColor("#6366F1"))
            setPadding(0, 12, 0, 0)
            setOnClickListener {
                val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
                launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(launchIntent)
                dismissOverlay()
            }
        }

        card.addView(topRow)
        card.addView(tvVerdict)
        card.addView(scoreRow)
        card.addView(dataContainer)
        card.addView(btnDetails)

        // Tornar o card arrastável
        makeDraggable(card)

        return card
    }

    private fun buildDataRow(label: String, value: String): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 2, 0, 2)

            addView(TextView(this@RideOverlayService).apply {
                text = label
                textSize = 13f
                setTextColor(Color.parseColor("#9CA3AF"))
                layoutParams = LinearLayout.LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f)
            })

            addView(TextView(this@RideOverlayService).apply {
                text = value
                textSize = 13f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.WHITE)
            })
        }
    }

    private fun addOverlayToWindow(view: View) {
        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            LayoutParams.TYPE_PHONE
        }

        val params = LayoutParams(
            700,              // largura em pixels (ajusta no dispositivo)
            LayoutParams.WRAP_CONTENT,
            overlayType,
            LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            x = 0
            y = 120   // distância do topo (abaixo da status bar)
        }

        overlayView = view
        windowManager?.addView(view, params)
        Log.d(TAG, "Overlay exibido")
    }

    private fun makeDraggable(view: View) {
        var initialX = 0
        var initialY = 0
        var touchX = 0f
        var touchY = 0f

        view.setOnTouchListener { v, event ->
            val params = v.layoutParams as LayoutParams
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    touchX = event.rawX
                    touchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params.x = initialX + (event.rawX - touchX).toInt()
                    params.y = initialY + (event.rawY - touchY).toInt()
                    windowManager?.updateViewLayout(v, params)
                    true
                }
                else -> false
            }
        }
    }

    private fun dismissOverlay() {
        overlayView?.let {
            try {
                windowManager?.removeView(it)
            } catch (e: Exception) {
                Log.e(TAG, "Erro ao remover overlay: ${e.message}")
            }
            overlayView = null
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private fun canDrawOverlay(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(this)
        } else {
            true
        }
    }

    private fun requestOverlayPermission() {
        val intent = Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:$packageName")
        ).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        startActivity(intent)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "DriverLucro Avaliador",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Avaliação automática de corridas em tempo real"
            }
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("DriverLucro Ativo")
            .setContentText("Monitorando corridas em tempo real")
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
