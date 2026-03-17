package app.kamples.desktop

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import java.net.HttpURLConnection
import java.net.URL

/**
 * Servicio FCM para recibir notificaciones push remotas.
 * Maneja tokens nuevos y mensajes entrantes incluso con app cerrada.
 *
 * QL45: Enriquecido con large icon (foto actor) y click-to-navigate (enlace).
 *
 * Canales:
 *   - "notificaciones" (IMPORTANCE_HIGH): likes, follows, sistema
 *   - "mensajes" (IMPORTANCE_MAX): mensajes directos, heads-up
 */
class KamplesFirebaseService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "KamplesFCM"
        private const val CANAL_NOTIFICACIONES = "notificaciones"
        private const val CANAL_MENSAJES = "mensajes"
        private const val PREFS_NAME = "kamples_fcm"
        private const val PREF_TOKEN_KEY = "fcm_token"
        private const val ARCHIVO_TOKEN = "fcm_token.txt"
        private const val ARCHIVO_NAVEGACION = "pending_navigation.json"
        private const val TIMEOUT_DESCARGA_AVATAR_MS = 5000
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Nuevo token FCM recibido")

        /* Persistir token en SharedPreferences para lectura rapida */
        try {
            getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(PREF_TOKEN_KEY, token)
                .apply()
        } catch (e: Exception) {
            Log.e(TAG, "Error guardando token FCM en prefs: ${e.message}")
        }

        /* Escribir token a archivo para que el WebView (Tauri FS) pueda leerlo */
        try {
            java.io.File(filesDir, ARCHIVO_TOKEN).writeText(token)
        } catch (e: Exception) {
            Log.e(TAG, "Error guardando token FCM en archivo: ${e.message}")
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val datos = message.data
        val tipo = datos["tipo"] ?: "sistema"
        val canalId = if (tipo == "mensaje_nuevo") CANAL_MENSAJES else CANAL_NOTIFICACIONES

        val titulo = datos["titulo"] ?: message.notification?.title ?: "Kamples"
        val cuerpo = datos["cuerpo"] ?: message.notification?.body ?: ""
        val actorAvatarUrl = datos["actorAvatarUrl"]
        val enlace = datos["enlace"]

        crearCanalSiNecesario(canalId)

        try {
            val notifBuilder = NotificationCompat.Builder(this, canalId)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(titulo)
                .setContentText(cuerpo)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)

            /* QL45: Large icon — foto del actor que genero la notificacion */
            val avatar = descargarBitmap(actorAvatarUrl)
            if (avatar != null) {
                notifBuilder.setLargeIcon(avatar)
            }

            /* QL45: Click-to-navigate — abrir la app y navegar al contenido */
            val pendingIntent = crearPendingIntent(enlace)
            if (pendingIntent != null) {
                notifBuilder.setContentIntent(pendingIntent)
                /* Escribir enlace a archivo para que el WebView lo lea al abrir */
                guardarNavegacionPendiente(enlace)
            }

            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.notify(System.currentTimeMillis().toInt(), notifBuilder.build())
        } catch (e: Exception) {
            Log.e(TAG, "Error mostrando notificacion: ${e.message}")
        }
    }

    /**
     * QL45: Descargar bitmap de avatar para usar como large icon.
     * onMessageReceived corre en background thread, asi que la operacion de red es segura.
     * Timeout agresivo para no bloquear la entrega de la notificacion.
     */
    private fun descargarBitmap(url: String?): Bitmap? {
        if (url.isNullOrBlank()) return null
        return try {
            val conn = URL(url).openConnection() as HttpURLConnection
            conn.connectTimeout = TIMEOUT_DESCARGA_AVATAR_MS
            conn.readTimeout = TIMEOUT_DESCARGA_AVATAR_MS
            conn.doInput = true
            conn.connect()
            val bitmap = BitmapFactory.decodeStream(conn.inputStream)
            conn.disconnect()
            bitmap
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo descargar avatar para notificacion: ${e.message}")
            null
        }
    }

    /**
     * QL45: Crear PendingIntent que abre la app al hacer click en la notificacion.
     * El enlace se persiste via archivo para que el WebView navegue al contenido.
     */
    private fun crearPendingIntent(enlace: String?): PendingIntent? {
        val intent = packageManager.getLaunchIntentForPackage(packageName) ?: return null
        intent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        if (!enlace.isNullOrBlank()) {
            intent.putExtra("enlace", enlace)
        }
        return PendingIntent.getActivity(
            this,
            System.currentTimeMillis().toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    /**
     * QL45: Persistir enlace de navegacion para que el WebView (React) lo lea.
     * Bridge: Kotlin escribe en files/pending_navigation.json → React lo lee con Tauri FS.
     * Patron identico al de fcm_token.txt.
     */
    private fun guardarNavegacionPendiente(enlace: String?) {
        if (enlace.isNullOrBlank()) return
        try {
            val json = """{"enlace":"${enlace.replace("\"", "\\\"")}","timestamp":${System.currentTimeMillis()}}"""
            java.io.File(filesDir, ARCHIVO_NAVEGACION).writeText(json)
        } catch (e: Exception) {
            Log.w(TAG, "Error guardando navegacion pendiente: ${e.message}")
        }
    }

    private fun crearCanalSiNecesario(canalId: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                if (manager.getNotificationChannel(canalId) == null) {
                    val nombre = if (canalId == CANAL_MENSAJES) "Mensajes" else "Notificaciones"
                    val importancia = if (canalId == CANAL_MENSAJES)
                        NotificationManager.IMPORTANCE_HIGH
                    else
                        NotificationManager.IMPORTANCE_DEFAULT
                    val canal = NotificationChannel(canalId, nombre, importancia).apply {
                        description = if (canalId == CANAL_MENSAJES)
                            "Mensajes directos de otros usuarios"
                        else
                            "Likes, follows y actividad general"
                    }
                    manager.createNotificationChannel(canal)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error creando canal: ${e.message}")
            }
        }
    }
}
