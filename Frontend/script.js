import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging.js';

const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Tu API Key para la Web App de Firebase
    authDomain: "app-notifications-a1dcc.firebaseapp.com",
    projectId: "app-notifications-a1dcc",
    storageBucket: "app-notifications-a1dcc.appspot.com",
    messagingSenderId: "264755819849", // Tu Project Number (está correcto)
    appId: "YOUR_APP_ID" // El App ID de tu Web App de Firebase
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

async function requestPermissionAndGetToken() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('FCM: Permiso de notificación concedido.');

            // Obtiene el token de registro de FCM para este dispositivo/navegador
            // REEMPLAZA 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE' con tu clave VAPID real.
            // La encuentras en Firebase Console > Project settings > Cloud Messaging > Web configuration > Web push certificates.
            const currentToken = await getToken(messaging, {
                vapidKey: 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE'
            });

            if (currentToken) {
                console.log('FCM: Token de registro obtenido:', currentToken);
                // Envía el token a tu backend para almacenarlo
                // REEMPLAZA 'https://your-backend-url.com/register-fcm-token' con la URL REAL de tu endpoint de backend.
                sendTokenToBackend(currentToken);
            } else {
                console.warn('FCM: No se obtuvo el token de registro. Permiso denegado o error.');
            }
        } else {
            console.warn('FCM: Permiso de notificación denegado.');
        }
    } catch (error) {
        console.error('FCM: Error al obtener el token:', error);
    }
}

// Función para enviar el token a tu backend
async function sendTokenToBackend(token) {
    try {
        // Esta URL debe apuntar al endpoint de tu backend que espera el token
        const response = await fetch('https://your-backend-url.com/register-fcm-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token }),
        });
        if (response.ok) {
            console.log('FCM: Token enviado al backend con éxito.');
        } else {
            console.error('FCM: Error al enviar el token al backend:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('FCM: Error de red al enviar el token al backend:', error);
    }
}

// Manejar mensajes cuando la aplicación está en primer plano (visible por el usuario)
onMessage(messaging, (payload) => {
    console.log('FCM: Mensaje recibido en primer plano:', payload);
    // Puedes mostrar una notificación visualmente en la UI o usar la API nativa
    const notificationTitle = payload.notification.title || 'Nueva Notificación';
    const notificationOptions = {
        body: payload.notification.body || 'Tienes un mensaje nuevo.',
        icon: '/icon-192x192.png' // Asegúrate de que esta ruta sea correcta para tu PWA
    };
    new Notification(notificationTitle, notificationOptions);
});

function flipCard(card) {
    card.classList.toggle('flipped');
}

async function fetchSheetData() {
    const SHEET_ID = '1tdE9k9rwTN-O6ZD45-tTj_1tOjpJ7laZjaPAdmbZYeY';
    const API_KEY = 'AIzaSyBgJh_1kfV3l5K1ccs8NNOU1q3Tq2nWzY0';
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Actividades?key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const data = await response.json();
        console.log('Datos brutos de Google Sheets API:', data);
        
        return parseSheetData(data.values);
    } catch (error) {
        console.error('Error al obtener datos:', error);
        return fetchSheetDataCSV();
    }
}

async function fetchSheetDataCSV() {
    const SHEET_ID = '1tdE9k9rwTN-O6ZD45-tTj_1tOjpJ7laZjaPAdmbZYeY';
    const SHEET_NAME = 'Actividades';
    
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
    
    try {
        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const csvText = await response.text();
        
        return parseCSV(csvText);
    } catch (error) {
        console.error('Error al obtener datos CSV:', error);
        throw error;
    }
}

function parseSheetData(values) {
    if (!values || values.length < 2) {
        console.log('No hay datos suficientes en la hoja');
        return [];
    }
    
    const headers = values[0];
    console.log('Headers:', headers);
    
    const data = [];

    const materiaIndex = headers.findIndex(h => 
        h && (h.toLowerCase().includes('materia') || h.toLowerCase().includes('asignatura'))
    );
    const actividadIndex = headers.findIndex(h => 
        h && (h.toLowerCase().includes('actividad') || h.toLowerCase().includes('tarea'))
    );
    const fechaAperturaIndex = headers.findIndex(h => 
        h && h.toLowerCase().includes('apertura')
    );
    const fechaCierreIndex = headers.findIndex(h => 
        h && (h.toLowerCase().includes('cierre') || h.toLowerCase().includes('entrega'))
    );
    const descripcionIndex = headers.findIndex(h => 
        h && (h.toLowerCase().includes('descripción') || h.toLowerCase().includes('descripcion') || h.toLowerCase().includes('instrucción'))
    );
    const enlacesIndex = headers.findIndex(h => 
        h && (h.toLowerCase().includes('enlace') || h.toLowerCase().includes('link') || h.toLowerCase().includes('url'))
    );
    
    console.log('Índices encontrados:', {
        materia: materiaIndex,
        actividad: actividadIndex,
        fechaApertura: fechaAperturaIndex,
        fechaCierre: fechaCierreIndex,
        descripcion: descripcionIndex,
        enlaces: enlacesIndex
    });

    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row || row.length === 0) continue;
        
        const materia = materiaIndex !== -1 ? (row[materiaIndex] || '') : '';
        const actividad = actividadIndex !== -1 ? (row[actividadIndex] || '') : '';

        if (materia.trim() || actividad.trim()) {
            const activity = {
                Materia: materia,
                Actividad: actividad,
                'Fecha Apertura': fechaAperturaIndex !== -1 ? (row[fechaAperturaIndex] || '') : '',
                'Fecha Cierre': fechaCierreIndex !== -1 ? (row[fechaCierreIndex] || '') : '',
                Descripción: descripcionIndex !== -1 ? (row[descripcionIndex] || '') : '',
                Enlaces: enlacesIndex !== -1 ? (row[enlacesIndex] || '') : ''
            };
            
            console.log(`Actividad ${i}:`, {
                materia: activity.Materia,
                actividad: activity.Actividad,
                descripcion: activity.Descripción ? activity.Descripción.substring(0, 50) + '...' : 'VACÍA'
            });
            
            data.push(activity);
        }
    }
    
    console.log('Total de actividades procesadas:', data.length);
    return data;
}

function parseCSV(csvText) {
    const lines = [];
    let currentLine = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
            currentLine += char;
        } else if (char === '\n' && !inQuotes) {
            lines.push(currentLine);
            currentLine = '';
        } else if (char === '\r') {
            continue;
        } else {
            currentLine += char;
        }
    }
    
    if (currentLine) {
        lines.push(currentLine);
    }
    
    const filteredLines = lines.filter(line => line.trim() !== '');
    console.log('Líneas CSV procesadas:', filteredLines.length);
    
    if (filteredLines.length < 2) return [];
    
    const headers = parseCSVLine(filteredLines[0]);
    console.log('Headers CSV:', headers);
    
    const data = [];
    const materiaIndex = 0;
    const actividadIndex = 1;
    const fechaAperturaIndex = 2;
    const fechaCierreIndex = 3;
    const descripcionIndex = 4;
    const enlacesIndex = 5;
    
    for (let i = 1; i < filteredLines.length; i++) {
        const values = parseCSVLine(filteredLines[i]);
        
        const materia = values[materiaIndex] || '';
        const actividad = values[actividadIndex] || '';
        
        if (materia.trim() || actividad.trim()) {
            const activity = {
                Materia: materia,
                Actividad: actividad,
                'Fecha Apertura': values[fechaAperturaIndex] || '',
                'Fecha Cierre': values[fechaCierreIndex] || '',
                Descripción: values[descripcionIndex] || '',
                Enlaces: values[enlacesIndex] || ''
            };
            
            data.push(activity);
        }
    }
    
    return data;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
            current += char;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    
    return result.map(field => {
        let cleaned = field.trim();
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.substring(1, cleaned.length - 1);
        }
        return cleaned;
    });
}

function formatFecha(fechaStr) {
    if (!fechaStr) return 'No especificada';
    return fechaStr.toString().replace(/"/g, '').trim();
}

function extractLinks(text) {
    if (!text) return [];
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    
    if (!matches) return [];
    
    return matches.map(url => ({
        url: url,
        displayText: url.length > 50 ? url.substring(0, 47) + '...' : url
    }));
}

function processDescription(desc) {
    if (!desc) return 'No hay descripción disponible.';
    
    return desc.toString().trim();
}

function createCard(activity, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => flipCard(card);
    
    const materia = activity.Materia || 'Actividad Académica';
    const nombreActividad = activity.Actividad || 'Actividad sin nombre';
    const fechaApertura = formatFecha(activity['Fecha Apertura']);
    const fechaCierre = formatFecha(activity['Fecha Cierre']);
    const descripcion = processDescription(activity.Descripción);
    const enlacesTexto = activity.Enlaces || '';

    const enlacesFromColumn = extractLinks(enlacesTexto);
    const enlacesFromDesc = extractLinks(descripcion);
    const todosEnlaces = [...new Set([...enlacesFromColumn, ...enlacesFromDesc])];

    let descripcionLimpia = descripcion;
    todosEnlaces.forEach(link => {
        descripcionLimpia = descripcionLimpia.replace(link.url, '');
    });
    
    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front">
                <div class="card-header">
                    <div class="materia">${materia}</div>
                    <div class="actividad">${nombreActividad}</div>
                </div>
                <div class="card-details">
                    ${fechaApertura && fechaApertura !== 'No especificada' ? `
                    <div class="fecha-apertura">
                        Inicio: ${fechaApertura}
                    </div>
                    ` : ''}
                    <div class="fecha-cierre">
                        Cierre: ${fechaCierre}
                    </div>
                </div>
            </div>
            <div class="card-back">
                <div class="card-back-content">
                    <div class="card-header">
                        <div class="materia">${materia}</div>
                        <div class="actividad">${nombreActividad}</div>
                    </div>
                    <div class="descripcion">
                        <strong>Descripción:</strong>
                        <div class="descripcion-completa">
                            ${formatTextWithLineBreaks(descripcionLimpia)}
                        </div>
                    </div>
                    ${todosEnlaces.length > 0 ? `
                    <div class="enlaces">
                        <h4> Enlaces relacionados:</h4>
                        ${todosEnlaces.map(enlace => `
                            <div class="enlace-item">
                                <a href="${enlace.url}" target="_blank" onclick="event.stopPropagation();">${enlace.displayText}</a>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    return card;
}

function formatTextWithLineBreaks(text) {
    if (!text || text === 'No hay descripción disponible.') {
        return '<p class="no-descripcion">No hay descripción disponible.</p>';
    }

    return text.split('\n').map(line => {
        const trimmed = line.trim();
        return trimmed ? `<p>${trimmed}</p>` : '';
    }).join('');
}

async function loadActivities() {
    const loadingElement = document.getElementById('loading');
    const cardsContainer = document.getElementById('cardsContainer');
    
    try {
        loadingElement.style.display = 'block';
        cardsContainer.innerHTML = '';
        
        const activities = await fetchSheetData();
        loadingElement.style.display = 'none';
        
        console.log('Actividades finales:', activities);
        
        if (activities.length === 0) {
            cardsContainer.innerHTML = `
                <div class="empty-message">
                    <h3>No se encontraron actividades</h3>
                    <p>Verifica que tengas conexion a internet.</p>
                    <p><strong>Si ese no es el caso, reportalo para que lo pueda arreglar pronto.</strong></p>
                    <p>Si aun no lo arreglo es porque nunca me dijiste nada, que se supone que sea? Adivino tambien?... Tss...</p>
                </div>
            `;
            return;
        }

        activities.forEach((activity, index) => {
            const card = createCard(activity, index);
            cardsContainer.appendChild(card);
        });
        
    } catch (error) {
        loadingElement.style.display = 'none';
        cardsContainer.innerHTML = `
            <div class="error-message">
                <h3>Error al cargar las actividades</h3>
                <p>Verifica que tengas conexion a internet.</p>
                <p><strong>Si ese no es el caso reportalo para que lo pueda arreglar pronto.</strong></p>
                <p>Si aun no lo arreglo es porque nunca me dijiste nada, que se supone que sea? Adivino tambien?... Tss...</p>
            </div>
        `;
        console.error('Error completo:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadActivities);

async function fetchScheduleData() {
    const SHEET_ID = '1tdE9k9rwTN-O6ZD45-tTj_1tOjpJ7laZjaPAdmbZYeY';
    const SCHEDULE_SHEET_NAME = 'Horarios';
    
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SCHEDULE_SHEET_NAME}?key=AIzaSyBgJh_1kfV3l5K1ccs8NNOU1q3Tq2nWzY0`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const data = await response.json();
        console.log('Datos de horarios:', data);
        
        return parseScheduleData(data.values);
    } catch (error) {
        console.error('Error al obtener horarios:', error);
        return fetchScheduleDataCSV();
    }
}

async function fetchScheduleDataCSV() {
    const SHEET_ID = '1tdE9k9rwTN-O6ZD45-tTj_1tOjpJ7laZjaPAdmbZYeY';
    const SCHEDULE_SHEET_NAME = 'Horarios';
    
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SCHEDULE_SHEET_NAME}`;
    
    try {
        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const csvText = await response.text();
        
        return parseScheduleCSV(csvText);
    } catch (error) {
        console.error('Error al obtener horarios CSV:', error);
        return [];
    }
}

function parseScheduleData(values) {
    if (!values || values.length < 2) {
        console.log('No hay datos de horarios');
        return [];
    }
    
    const headers = values[0];
    console.log('Headers de horarios:', headers);
    
    const data = [];

    const materiaIndex = headers.findIndex(h => 
        h && (h.toLowerCase().includes('materia') || h.toLowerCase().includes('asignatura'))
    );
    const diaIndex = headers.findIndex(h => 
        h && (h.toLowerCase().includes('día') || h.toLowerCase().includes('dia'))
    );
    const horaIndex = headers.findIndex(h => 
        h && (h.toLowerCase().includes('hora') || h.toLowerCase().includes('horario'))
    );
    const enlaceClaseIndex = headers.findIndex(h => 
        h && (h.toLowerCase().includes('enlace') && !h.toLowerCase().includes('grupo'))
    );
    const enlaceGrupoIndex = headers.findIndex(h => 
        h && (h.toLowerCase().includes('grupo') || h.toLowerCase().includes('whatsapp') || h.toLowerCase().includes('telegram'))
    );
    
    console.log('Índices de horarios detectados:', {
        materia: materiaIndex,
        dia: diaIndex,
        hora: horaIndex,
        enlaceClase: enlaceClaseIndex,
        enlaceGrupo: enlaceGrupoIndex
    });

    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row || row.length === 0) continue;
        
        const materia = materiaIndex !== -1 ? (row[materiaIndex] || '') : '';
        const dia = diaIndex !== -1 ? (row[diaIndex] || '') : '';
        const hora = horaIndex !== -1 ? (row[horaIndex] || '') : '';
        const enlaceClase = enlaceClaseIndex !== -1 ? (row[enlaceClaseIndex] || '') : '';
        const enlaceGrupo = enlaceGrupoIndex !== -1 ? (row[enlaceGrupoIndex] || '') : '';

        if (materia.trim()) {
            const scheduleItem = {
                materia: materia,
                dia: dia,
                hora: hora,
                enlaces: []
            };

            if (enlaceClase.trim()) {
                scheduleItem.enlaces.push({
                    nombre: 'Clase Virtual',
                    url: enlaceClase,
                    tipo: 'clase'
                });
            }

            if (enlaceGrupo.trim()) {
                scheduleItem.enlaces.push({
                    nombre: 'Grupo de la Materia',
                    url: enlaceGrupo,
                    tipo: 'grupo'
                });
            }
            
            console.log('Horario procesado:', scheduleItem);
            data.push(scheduleItem);
        }
    }
    
    return data;
}

function parseScheduleCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    const headers = parseCSVLine(lines[0]);
    const data = [];
    const materiaIndex = 0;
    const diaIndex = 1;        
    const horaIndex = 2;        
    const enlaceClaseIndex = 3; 
    const enlaceGrupoIndex = 4; 
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        if (values.length >= 3 && values[materiaIndex] && values[materiaIndex].trim()) {
            const scheduleItem = {
                materia: values[materiaIndex] || '',
                dia: values[diaIndex] || '',
                hora: values[horaIndex] || '',
                enlaces: []
            };

            if (values[enlaceClaseIndex] && values[enlaceClaseIndex].trim()) {
                scheduleItem.enlaces.push({
                    nombre: 'Clase Virtual',
                    url: values[enlaceClaseIndex],
                    tipo: 'clase'
                });
            }

            if (values[enlaceGrupoIndex] && values[enlaceGrupoIndex].trim()) {
                scheduleItem.enlaces.push({
                    nombre: 'Grupo de la Materia',
                    url: values[enlaceGrupoIndex],
                    tipo: 'grupo'
                });
            }
            
            data.push(scheduleItem);
        }
    }
    
    return data;
}

async function openScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    const scheduleContent = document.getElementById('scheduleContent');
    const loadingSchedule = document.getElementById('loadingSchedule');
    
    modal.style.display = 'block';
    loadingSchedule.style.display = 'block';
    scheduleContent.innerHTML = '';
    
    try {
        const horariosClase = await fetchScheduleData();
        
        loadingSchedule.style.display = 'none';
        
        if (horariosClase.length === 0) {
            scheduleContent.innerHTML = `
                <div class="no-schedule">
                    <h3>No se encontraron horarios</h3>
                    <p>Verifica que tengas conexion a internet.</p>
                    <p><strong>Si ese no es el caso reportalo para que lo pueda arreglar pronto.</strong></p>
                    <p>Si aun no lo arreglo es porque nunca me dijiste nada, que se supone que sea? Adivino tambien?... Tss...</p>
                </div>
            `;
            return;
        }
        
        scheduleContent.innerHTML = generateScheduleHTML(horariosClase);
        
    } catch (error) {
        loadingSchedule.style.display = 'none';
        scheduleContent.innerHTML = `
            <div class="error-message">
                <h3>Error al cargar los horarios</h3>
                <p><strong>Detalles:</strong> ${error.message}</p>
                <p>Lo arreglare pronto si me avisas...</p>
            </div>
        `;
    }
}

function generateScheduleHTML(horariosClase) {
    return horariosClase.map(clase => `
        <div class="schedule-item">
            <div class="schedule-materia">${clase.materia}</div>
            <div class="schedule-horario">
                <span class="schedule-dia">${clase.dia || 'Día no especificado'}</span>
                <span class="schedule-hora">${clase.hora || 'Horario no especificado'}</span>
            </div>
            ${clase.enlaces && clase.enlaces.length > 0 ? `
            <div class="schedule-enlaces">
                ${clase.enlaces.map(enlace => `
                    <a href="${enlace.url}" target="_blank" class="enlace-clase enlace-${enlace.tipo}">
                        ${enlace.nombre}
                    </a>
                `).join('')}
            </div>
            ` : '<div class="no-enlaces">No hay enlaces disponibles</div>'}
        </div>
    `).join('');
}

function closeScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    modal.style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('scheduleModal');
    if (event.target === modal) {
        closeScheduleModal();
    }
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeScheduleModal();
    }
});

function isTaskExpired(fechaCierre) {
    if (!fechaCierre || fechaCierre === 'No especificada') {
        return false;
    }
    
    try {
        const partes = fechaCierre.split('/');
        if (partes.length === 3) {
            const dia = parseInt(partes[0]);
            const mes = parseInt(partes[1]) - 1;
            const año = parseInt(partes[2]);
            
            const fechaCierreObj = new Date(año, mes, dia, 23, 59, 59);
            const hoy = new Date();
            
            return fechaCierreObj < hoy;
        }
    } catch (error) {
        console.error('Error al parsear fecha:', fechaCierre, error);
    }
    
    return false;
}

function formatFecha(fechaStr) {
    if (!fechaStr) return 'No especificada';

    let fechaLimpia = fechaStr.toString().replace(/"/g, '').trim();

    if (fechaLimpia.includes('/')) {
        return fechaLimpia;
    }
    
    return fechaLimpia;
}

function toggleCompletedTasks() {
    const showCompleted = document.getElementById('showCompleted').checked;
    const cards = document.querySelectorAll('.card');
    let expiredCount = 0;
    let pendingCount = 0;
    
    cards.forEach(card => {
        if (card.classList.contains('expired')) {
            if (showCompleted) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
            expiredCount++;
        } else {
            pendingCount++;
        }
    });
    
    updateTasksCounter(pendingCount, expiredCount, showCompleted);
}

function updateTasksCounter(pending, expired, showCompleted) {
    const counter = document.getElementById('tasksCounter');
    
    if (showCompleted) {
        counter.innerHTML = `
            <span class="status-indicator status-pending"></span>${pending} pendientes 
            | <span class="status-indicator status-expired"></span>${expired} vencidas
        `;
    } else {
        counter.innerHTML = `
            <span class="status-indicator status-pending"></span>${pending} tareas pendientes
        `;
    }
}

function processExpiredTasks(activities) {
    let expiredCount = 0;
    let pendingCount = 0;
    
    activities.forEach((activity, index) => {
        const fechaCierre = formatFecha(activity['Fecha Cierre']);
        const isExpired = isTaskExpired(fechaCierre);
        
        if (isExpired) {
            expiredCount++;
        } else {
            pendingCount++;
        }
    });
    
    console.log(`Tareas procesadas: ${pendingCount} pendientes, ${expiredCount} vencidas`);
    return { expiredCount, pendingCount };
}

function createCard(activity, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => flipCard(card);
    
    const materia = activity.Materia || 'Actividad Académica';
    const nombreActividad = activity.Actividad || 'Actividad sin nombre';
    const fechaApertura = formatFecha(activity['Fecha Apertura']);
    const fechaCierre = formatFecha(activity['Fecha Cierre']);
    const descripcion = processDescription(activity.Descripción);
    const enlacesTexto = activity.Enlaces || '';

    const isExpired = isTaskExpired(fechaCierre);
    if (isExpired) {
        card.classList.add('expired', 'hidden');
    }

    const enlacesFromColumn = extractLinks(enlacesTexto);
    const enlacesFromDesc = extractLinks(descripcion);
    const todosEnlaces = [...new Set([...enlacesFromColumn, ...enlacesFromDesc])];

    let descripcionLimpia = descripcion;
    todosEnlaces.forEach(link => {
        descripcionLimpia = descripcionLimpia.replace(link.url, '');
    });
    
    card.innerHTML = `
        <div class="card-inner">
            ${isExpired ? '<div class="expired-badge">VENCIDA</div>' : ''}
            <div class="card-front">
                <div class="card-header">
                    <div class="materia">${materia}</div>
                    <div class="actividad">${nombreActividad}</div>
                </div>
                <div class="card-details">
                    ${fechaApertura && fechaApertura !== 'No especificada' ? `
                    <div class="fecha-apertura">
                        Inicio: ${fechaApertura}
                    </div>
                    ` : ''}
                    <div class="fecha-cierre">
                        Cierre: ${fechaCierre}
                    </div>
                </div>
            </div>
            <div class="card-back">
                <div class="card-back-content">
                    <div class="card-header">
                        <div class="materia">${materia}</div>
                        <div class="actividad">${nombreActividad}</div>
                    </div>
                    <div class="descripcion">
                        <strong>Descripción:</strong>
                        <div class="descripcion-completa">
                            ${formatTextWithLineBreaks(descripcionLimpia)}
                        </div>
                    </div>
                    ${todosEnlaces.length > 0 ? `
                    <div class="enlaces">
                        <h4>Enlaces relacionados:</h4>
                        ${todosEnlaces.map(enlace => `
                            <div class="enlace-item">
                                <a href="${enlace.url}" target="_blank" onclick="event.stopPropagation();">${enlace.displayText}</a>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    return card;
}

async function loadActivities() {
    const loadingElement = document.getElementById('loading');
    const cardsContainer = document.getElementById('cardsContainer');
    
    try {
        loadingElement.style.display = 'block';
        cardsContainer.innerHTML = '';
        
        const activities = await fetchSheetData();
        loadingElement.style.display = 'none';
        
        console.log('Actividades finales:', activities);
        
        if (activities.length === 0) {
            cardsContainer.innerHTML = `
                <div class="empty-message">
                    <h3>No se encontraron actividades</h3>
                    <p>Lo arreglare pronto si me avisas...</p>
                </div>
            `;
            return;
        }

        const { expiredCount, pendingCount } = processExpiredTasks(activities);

        activities.forEach((activity, index) => {
            const card = createCard(activity, index);
            cardsContainer.appendChild(card);
        });

        updateTasksCounter(pendingCount, expiredCount, false);

        setTimeout(() => {
            setupHoverMessages();
            enhanceSubtitle();
        }, 100);
        
    } catch (error) {
        loadingElement.style.display = 'none';
        cardsContainer.innerHTML = `
            <div class="error-message">
                <h3>Error al cargar las actividades</h3>
                <p><strong>Detalles:</strong> ${error.message}</p>
            </div>
        `;
        console.error('Error completo:', error);
    }
}

function setupHoverMessages() {
    const cards = document.querySelectorAll('.card');
    const hoverMessage = document.getElementById('hoverMessage');
    
    let hideTimeout;
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            clearTimeout(hideTimeout);
            hoverMessage.textContent = 'Haz clic o selecciona la tarjeta para ver los detalles completos de esta actividad';
            hoverMessage.classList.add('show');
        });

        card.addEventListener('mouseleave', function() {
            hideTimeout = setTimeout(() => {
                hoverMessage.classList.remove('show');
            }, 300);
        });

        card.addEventListener('click', function() {
            hoverMessage.classList.remove('show');
        });
    });

    document.addEventListener('mousemove', function(e) {
        const isOverCard = Array.from(cards).some(card => card.contains(e.target));
        if (!isOverCard && !hoverMessage.contains(e.target)) {
            hoverMessage.classList.remove('show');
        }
    });
}

function enhanceSubtitle() {
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) {
        subtitle.innerHTML = 'Haz clic o selecciona cualquier tarjeta para ver los detalles';
        subtitle.style.cursor = 'default';

        subtitle.addEventListener('mouseenter', function() {
            this.style.opacity = '1';
            this.style.color = '#3498db';
        });
        
        subtitle.addEventListener('mouseleave', function() {
            this.style.opacity = '0.9';
            this.style.color = 'white';
        });
    }
}

function showLocalNotification(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    const notificationOptions = {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        ...options
    };

    new Notification(title, notificationOptions);
}

function showInstallSuccessMessage() {
    const message = document.createElement('div');
    message.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ecc71;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);
            z-index: 1000;
            animation: slideInRight 0.5s ease;
        ">
            <strong> ¡App instalada!</strong>
            <p style="margin: 5px 0 0 0; font-size: 0.9rem;">
                Ahora puedes acceder rápidamente desde tu pantalla de inicio
            </p>
        </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 5000);
}

function showInstallRejectedMessage() {
    const message = document.createElement('div');
    message.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f39c12;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(243, 156, 18, 0.4);
            z-index: 1000;
            animation: slideInRight 0.5s ease;
        ">
            <strong>¿Cambiaste de idea?</strong>
            <p style="margin: 5px 0 0 0; font-size: 0.9rem;">
                Puedes instalar la app luego desde el menú de tu navegador
            </p>
        </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 4000);
}

async function loadActivities() {
    const loadingElement = document.getElementById('loading');
    const cardsContainer = document.getElementById('cardsContainer');

    if (!navigator.onLine) {
        showOfflineMessage();
        return;
    }
    
    try {
        loadingElement.style.display = 'block';
        cardsContainer.innerHTML = '';
        
        const activities = await fetchSheetData();
        loadingElement.style.display = 'none';

        localStorage.setItem('cachedActivities', JSON.stringify(activities));
        localStorage.setItem('lastUpdate', new Date().toISOString());
        
        processAndDisplayActivities(activities);
        
    } catch (error) {
        loadingElement.style.display = 'none';

        const cachedActivities = localStorage.getItem('cachedActivities');
        if (cachedActivities) {
            console.log('Cargando datos cacheados...');
            processAndDisplayActivities(JSON.parse(cachedActivities));
        } else {
            showError(error);
        }
    }
}

function processAndDisplayActivities(activities) {
    const cardsContainer = document.getElementById('cardsContainer');
    
    if (activities.length === 0) {
        cardsContainer.innerHTML = `
            <div class="empty-message">
                <h3>No se encontraron actividades</h3>
                <p>${navigator.onLine ? 'No hay datos cacheados disponibles.'}</p>
            </div>
        `;
        return;
    }
    
    const { expiredCount, pendingCount } = processExpiredTasks(activities);
    
    activities.forEach((activity, index) => {
        const card = createCard(activity, index);
        cardsContainer.appendChild(card);
    });
    
    updateTasksCounter(pendingCount, expiredCount, false);
    
    setTimeout(() => {
        setupHoverMessages();
        enhanceSubtitle();
    }, 100);
}

function showOfflineMessage() {
    const cardsContainer = document.getElementById('cardsContainer');
    const cachedActivities = localStorage.getItem('cachedActivities');
    
    if (cachedActivities) {
        console.log('Modo offline - Cargando datos cacheados');
        processAndDisplayActivities(JSON.parse(cachedActivities));

        showOfflineBanner();
    } else {
        cardsContainer.innerHTML = `
            <div class="empty-message">
                <h3>Sin conexión a internet</h3>
                <p>No hay datos cacheados disponibles. Conéctate a internet para cargar las actividades.</p>
            </div>
        `;
    }
}
function showOfflineBanner() {
    const existingBanner = document.getElementById('offlineBanner');
    if (existingBanner) return;
    
    const banner = document.createElement('div');
    banner.id = 'offlineBanner';
    banner.innerHTML = `
        <div style="background: #f39c12; color: white; padding: 10px; text-align: center; position: fixed; top: 0; left: 0; right: 0; z-index: 2000;">
            <strong>Modo Offline</strong> - Visualizando datos cacheados
        </div>
    `;
    
    document.body.appendChild(banner);
    
    setTimeout(() => {
        if (banner.parentNode) {
            banner.parentNode.removeChild(banner);
        }
    }, 5000);
}

const installButton = document.getElementById('installButton');
const pwaPromoBanner = document.getElementById('pwaPromoBanner');

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.classList.remove('hidden');

    setTimeout(showPWAPromoBanner, 5000);
    
    console.log('PWA está lista para instalación');
});

installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
        console.log('El evento beforeinstallprompt no se ha disparado');
        return;
    }

    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`Usuario ${outcome} la instalación`);

    hidePWAPromoBanner();
    
    if (outcome === 'accepted') {
        showInstallSuccessMessage();
    } else {
        showInstallRejectedMessage();
    }

    deferredPrompt = null;

    installButton.classList.add('hidden');
});

window.addEventListener('appinstalled', () => {
    installButton.classList.add('hidden');
    hidePWAPromoBanner();
    deferredPrompt = null;
    
    console.log('PWA instalada correctamente');
    showInstallSuccessMessage();
});

if (window.matchMedia('(display-mode: standalone)').matches) {
    installButton.classList.add('hidden');
    console.log('La aplicación ya está instalada');
}

function showPWAPromoBanner() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return; 
    }
    
    if (deferredPrompt && !sessionStorage.getItem('pwaBannerDismissed')) {
        pwaPromoBanner.classList.add('show');
    }
}

function hidePWAPromoBanner() {
    pwaPromoBanner.classList.remove('show');
    sessionStorage.setItem('pwaBannerDismissed', 'true');
}

function triggerPWAInstall() {
    if (installButton && !installButton.classList.contains('hidden')) {
        installButton.click();
    }
    hidePWAPromoBanner();
}

function showInstallSuccessMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);
        z-index: 1000;
        animation: slideInRight 0.5s ease;
    `;
    message.innerHTML = `
        <strong>¡App instalada!</strong>
        <p style="margin: 5px 0 0 0; font-size: 0.9rem;">
            Ahora puedes acceder rápidamente desde tu pantalla de inicio
        </p>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 5000);
}

function showInstallRejectedMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f39c12;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(243, 156, 18, 0.4);
        z-index: 1000;
        animation: slideInRight 0.5s ease;
    `;
    message.innerHTML = `
        <strong>¿Cambiaste de idea?</strong>
        <p style="margin: 5px 0 0 0; font-size: 0.9rem;">
            Puedes instalar la app luego desde el menú de tu navegador
        </p>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 4000);
}

function setupConnectionMonitor() {
    const connectionStatus = document.getElementById('connectionStatus');
    
    function updateConnectionStatus() {
        if (navigator.onLine) {
            connectionStatus.textContent = '✅ Conectado';
            connectionStatus.style.color = '#2ecc71';
            connectionStatus.style.background = 'rgba(46, 204, 113, 0.1)';
        } else {
            connectionStatus.textContent = '⚠️ Sin conexión - Modo offline';
            connectionStatus.style.color = '#e74c3c';
            connectionStatus.style.background = 'rgba(231, 76, 60, 0.1)';
        }
    }

    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    updateConnectionStatus();
}

document.addEventListener('DOMContentLoaded', function() {
    setupConnectionMonitor();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/firebase-messaging-sw.js') // REGISTRA EL SW DE FCM
            .then((registration) => {
                console.log('FCM: Service Worker registrado con éxito:', registration);
            })
            .catch((error) => {
                console.error('FCM: Fallo el registro del Service Worker:', error);
            });
    });
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

document.addEventListener('DOMContentLoaded', function() {
    setupConnectionMonitor(); // Esta función la mantienes.
    loadActivities();         // Esta función la mantienes.

    // AÑADE ESTO para iniciar el proceso de FCM cuando la PWA carga
    requestPermissionAndGetToken();
});

window.addEventListener("load", () => {
  registerPush();
});


