import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json", // tu archivo de cuenta de servicio
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
});

const sheets = google.sheets({ version: "v4", auth });

export async function getSheetData(spreadsheetId, range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return res.data.values;
}
