import admin from "firebase-admin";
import { google } from "googleapis";
import fs from "fs";

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_JSON)),
});

// Inicializar Sheets
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
});
const sheets = google.sheets({ version: "v4", auth });

// Leer hoja
async function obtenerTareas() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "Hoja1!A:E",
  });
  return res.data.values;
}

// Calcular y enviar notificaciones
async function enviarNotificaciones() {
  const tareas = await obtenerTareas();

  const hoy = new Date();
  for (const fila of tareas.slice(1)) { // Saltar encabezado
    const [id, nombre, materia, fecha, descripcion] = fila;
    if (!fecha) continue;

    const fechaTarea = new Date(fecha);
    const diferencia = (fechaTarea - hoy) / (1000 * 60 * 60 * 24);

    if (diferencia <= 2 && diferencia >= 1) {
      const message = {
        notification: {
          title: "⏰ Tarea próxima a vencer",
          body: `${nombre} vence el ${fecha}`,
        },
        topic: "recordatorios",
      };
      await admin.messaging().send(message);
      console.log(`Notificación enviada: ${nombre}`);
    }
  }
}

enviarNotificaciones().catch(console.error);
