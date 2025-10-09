import express from "express";
import webpush from "web-push";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Servir frontend desde Express
app.use(express.static(path.join(__dirname, "../Frontend")));

// Leer claves VAPID desde JSON
const keys = JSON.parse(fs.readFileSync(path.join(__dirname, "webpush-keys.json")));
webpush.setVapidDetails(
  "mailto:tu-email@ejemplo.com", // Debe ser un mail o URL válido
  keys.publicKey,
  keys.privateKey
);

// Almacenar suscripciones
let subscriptions = [];

// Ruta para suscribirse
app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({ message: "Suscripción guardada." });
});

// Ruta para enviar notificación
app.post("/notify", async (req, res) => {
  const payload = JSON.stringify({ title: "Notificación de prueba" });
  try {
    await Promise.all(subscriptions.map(sub => webpush.sendNotification(sub, payload)));
    res.status(200).json({ message: "Notificaciones enviadas" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error enviando notificación" });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
