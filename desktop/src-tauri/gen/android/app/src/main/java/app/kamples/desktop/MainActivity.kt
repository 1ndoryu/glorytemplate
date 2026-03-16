package app.kamples.desktop

import android.os.Bundle
import android.util.Log
import androidx.activity.enableEdgeToEdge
import com.google.firebase.messaging.FirebaseMessaging

class MainActivity : TauriActivity() {
  companion object {
      private const val TAG = "KamplesMain"
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    /* QL34: Solicitar token FCM al iniciar y guardarlo para el WebView */
    FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
        Log.d(TAG, "Token FCM obtenido al inicio")
        try {
            getSharedPreferences("kamples_fcm", MODE_PRIVATE)
                .edit()
                .putString("fcm_token", token)
                .apply()
            java.io.File(filesDir, "fcm_token.txt").writeText(token)
        } catch (e: Exception) {
            Log.e(TAG, "Error guardando token FCM: ${e.message}")
        }
    }.addOnFailureListener { e ->
        Log.w(TAG, "No se pudo obtener token FCM: ${e.message}")
    }
  }
}
