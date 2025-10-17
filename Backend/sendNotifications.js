// sendNotifications.js

import admin from "firebase-admin";
import fs from "fs";
import { getTodayTasks } from "./sheets.js"; // Ajusta según tu función real

// 1️⃣ Inicializar Firebase Admin con la clave descargada desde el secret
const serviceAccount = JSON.parse(fs.readFileSync("serviceAccountKey.json"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 2️⃣ Obtener tokens de los usuarios suscritos a notificaciones
// 🔸 Idealmente esto vendrá de tu BD o archivo JSON. Por ahora lo dejaremos como ejemplo:
const registrationTokens = [
  "TOKEN_FCM_DEL_USUARIO_1",
  "TOKEN_FCM_DEL_USUARIO_2",
  // ...
];

// 3️⃣ Obtener tareas próximas (por ejemplo, de hoy o mañana)
const tasks = await getTodayTasks(); // Supongamos que esta función devuelve tareas próximas

// Si no hay tareas, salimos
if (!tasks || tasks.length === 0) {
  console.log("✅ No hay tareas pendientes para hoy.");
  process.exit(0);
}

// 4️⃣ Crear mensaje de notificación
const message = {
  notification: {
    title: "📘 Recordatorio de tareas",
    body: `Tienes ${tasks.length} tarea(s) pendiente(s) hoy.`,
  },
  tokens: registrationTokens,
};

// 5️⃣ Enviar la notificación con FCM
try {
  const response = await admin.messaging().sendMulticast(message);
  console.log(`✅ Notificaciones enviadas correctamente: ${response.successCount}`);
} catch (error) {
  console.error("❌ Error al enviar notificaciones:", error);
}
