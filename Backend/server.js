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

app.use(express.static(path.join(__dirname, "../Frontend")));

const keys = JSON.parse(fs.readFileSync(path.join(__dirname, "webpush-keys.json")));
webpush.setVapidDetails(
  "mailto:abatalla9571@utm.edu.ec",
  keys.publicKey,
  keys.privateKey
);

let subscriptions = [];

app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({ message: "Suscripción guardada." });
});

app.post("/notify", async (req, res) => {
  const payload = JSON.stringify({
    title: "Notificación de prueba",
    body: "Hola esto es una prueba"
  });

  try {
    await Promise.all(subscriptions.map(sub => webpush.sendNotification(sub, payload)));
    res.status(200).json({ message: "Notificaciones enviadas" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error enviando notificación" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
