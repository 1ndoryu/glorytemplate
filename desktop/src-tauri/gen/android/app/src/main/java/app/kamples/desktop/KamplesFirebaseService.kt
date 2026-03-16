package app.kamples.desktop

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Servicio FCM para recibir notificaciones push remotas.
 * Maneja tokens nuevos y mensajes entrantes incluso con app cerrada.
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

        crearCanalSiNecesario(canalId)

        try {
            val notifBuilder = NotificationCompat.Builder(this, canalId)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(titulo)
                .setContentText(cuerpo)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)

            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.notify(System.currentTimeMillis().toInt(), notifBuilder.build())
        } catch (e: Exception) {
            Log.e(TAG, "Error mostrando notificacion: ${e.message}")
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
