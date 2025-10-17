import { google } from "googleapis";

// Configurar autenticación con la cuenta de servicio de Google
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json", // archivo JSON de tu cuenta de servicio de Google
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
});

const sheets = google.sheets({ version: "v4", auth });

/**
 * Obtiene datos crudos desde una hoja de cálculo
 */
export async function getSheetData(spreadsheetId, range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return res.data.values;
}

/**
 * Devuelve las tareas que están programadas para hoy o mañana
 */
export async function getTodayTasks() {
  const spreadsheetId = "tdE9k9rwTN-O6ZD45-tTj_1tOjpJ7laZjaPAdmbZYeY"; // cambia por el ID real
  const range = "Hoja1!A2:E"; // ajusta el rango según tus columnas

  const data = await getSheetData(spreadsheetId, range);

  if (!data || data.length === 0) {
    console.log("No se encontraron datos en la hoja.");
    return [];
  }

  // Suponiendo que las columnas son: [Nombre, Descripción, Fecha, Estado, ...]
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Opcional: incluir tareas de mañana también
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const tasks = data
    .map(row => ({
      nombre: row[0],
      descripcion: row[1],
      fecha: row[2] ? new Date(row[2]) : null
    }))
    .filter(task => {
      if (!task.fecha) return false;
      const taskDate = task.fecha.toISOString().split("T")[0];
      return taskDate === todayStr || taskDate === tomorrowStr;
    });

  console.log(`Tareas encontradas: ${tasks.length}`);
  return tasks;
}
