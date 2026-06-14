// State
let tasks = [];
let currentEditingId = null;
let currentFocusTaskId = null;

// Pomodoro State
let defaultTime = 40 * 60; // Default: 40 mins
let totalTime = defaultTime;
let timeLeft = totalTime;
let timerInterval = null;
let isRunning = false;

// DOM Elements
const pomodoroModal = document.getElementById('pomodoroModal');
const taskModal = document.getElementById('taskModal');
const closePomodoroBtn = document.getElementById('closePomodoroBtn');
const closeTaskModalBtn = document.getElementById('closeTaskModalBtn');

const columns = {
    'pending': document.getElementById('col-pending'),
    'in-progress': document.getElementById('col-in-progress'),
    'completed': document.getElementById('col-completed')
};

const addTaskBtn = document.getElementById('addTaskBtn');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const saveTaskBtn = document.getElementById('saveTaskBtn');

// Timer DOM Elements
const timeDisplay = document.getElementById('timeDisplay');
const tomatoFill = document.getElementById('tomatoFill');
const startStopBtn = document.getElementById('startStopBtn');
const editTimeBtn = document.getElementById('editTimeBtn');
const syncFileBtn = document.getElementById('syncFileBtn');

// ==========================================
// 1. IndexedDB & File System Access Engine
// ==========================================
const DB_NAME = 'PomodoroDB';
const STORE_NAME = 'handles';

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveHandle(handle) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(handle, 'fileHandle');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function getHandle() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('fileHandle');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function verifyPermission(handle) {
    if ((await handle.queryPermission({mode: 'readwrite'})) === 'granted') {
        return true;
    }
    // Might require user gesture
    if ((await handle.requestPermission({mode: 'readwrite'})) === 'granted') {
        return true;
    }
    return false;
}

let fileHandle = null;
let syncInitialized = false;

function applyImportedState(imported) {
    if (Array.isArray(imported)) {
        tasks = imported; 
    } else if (imported && Array.isArray(imported.tasks)) {
        tasks = imported.tasks;
        if (imported.timerState) {
            timeLeft = imported.timerState.timeLeft !== undefined ? imported.timerState.timeLeft : defaultTime;
            totalTime = imported.timerState.totalTime || defaultTime;
            currentFocusTaskId = imported.timerState.currentFocusTaskId || null;
            // Boundaries
            if (timeLeft <= 0 && currentFocusTaskId) timeLeft = 0;
        }
    }
    renderTasks();
    updateTimerDisplay();
}

async function loadStateFromFile() {
    if (!fileHandle) return;
    const file = await fileHandle.getFile();
    const text = await file.text();
    if(text) {
        applyImportedState(JSON.parse(text));
    }
}

async function syncToDisk() {
    const stateBlob = {
        tasks: tasks,
        timerState: {
            timeLeft: timeLeft,
            totalTime: totalTime,
            currentFocusTaskId: currentFocusTaskId
        }
    };
    const jsonString = JSON.stringify(stateBlob, null, 2);

    if (fileHandle) {
        try {
            const writable = await fileHandle.createWritable();
            await writable.write(jsonString);
            await writable.close();
            console.log("Seamlessly synced mapped file.");
        } catch (err) {
            console.warn("Failed transparent auto-save.", err);
        }
    }
}

// Global touch handler to implicitly restore cross-reload file syncing safely
document.body.addEventListener('click', async () => {
    if (syncInitialized || fileHandle) return;
    try {
        const storedHandle = await getHandle();
        if (storedHandle) {
            const hasPerm = await verifyPermission(storedHandle);
            if (hasPerm) {
                fileHandle = storedHandle;
                await loadStateFromFile();
                syncInitialized = true;
                if (syncFileBtn) {
                    syncFileBtn.textContent = 'Sync Active ✅';
                    syncFileBtn.style.color = '#34c759';
                }
            }
        }
    } catch(e) {
        console.warn("Background permission restore yielded.");
    }
}, {once: true});

// Manual Link Sync Button
if (syncFileBtn) {
    syncFileBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); // prevent global click bubbling
        if (fileHandle) {
            // Already synced, force pull again from disk
            await loadStateFromFile();
            alert("Board completely refreshed instantly from disk.");
            return;
        }
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{ description: 'JSON Files', accept: {'application/json': ['.json']} }],
                multiple: false
            });
            fileHandle = handle;
            await saveHandle(fileHandle);
            
            await loadStateFromFile();
            syncFileBtn.textContent = 'Sync Active ✅';
            syncFileBtn.style.color = '#34c759';
        } catch (e) {
            console.error("Link Cancelled:", e);
        }
    });
}

// ==========================================
// 2. Tasks Logic (Kanban)
// ==========================================

function saveTasks() {
    const updatedTasks = [];
    document.querySelectorAll('.kanban-column').forEach(column => {
        const status = column.dataset.status;
        column.querySelectorAll('.kanban-card').forEach(card => {
            const matchTask = tasks.find(t => t.id === card.dataset.id);
            if (matchTask) {
                matchTask.status = status;
                updatedTasks.push(matchTask);
            }
        });
    });
    
    // Safety check just in case
    tasks.forEach(t => {
        if (!updatedTasks.some(u => u.id === t.id)) updatedTasks.push(t);
    });

    tasks = updatedTasks;
    syncToDisk(); // Securely commit state directly to mapped disk file
}

function renderTasks() {
    Object.values(columns).forEach(col => col.innerHTML = '');

    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'kanban-card fade-in';
        card.draggable = true;
        card.dataset.id = task.id;

        card.innerHTML = `
            <div class="card-actions">
                <button class="icon-btn" onclick="editTask(event, '${task.id}')" title="Edit">✏️</button>
                <button class="icon-btn danger" onclick="deleteTask(event, '${task.id}')" title="Delete">🗑️</button>
            </div>
            <div class="card-title">${escapeHtml(task.summary)}</div>
            <div class="card-desc">${escapeHtml(task.description)}</div>
            <div class="card-meta">
                <span class="badge ${task.priority}">${formatLabel(task.priority)} Planner</span>
                <span class="time-stats">⏱ ${Math.floor((task.timeSpent || 0) / 60)}m / ${task.estimatedTime || 40}m</span>
            </div>
        `;

        card.addEventListener('click', () => openPomodoro(task.id));
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);

        const targetColumn = columns[task.status] || columns['pending'];
        targetColumn.appendChild(card);
    });
}

// Drag & Drop bindings
document.querySelectorAll('.kanban-cards').forEach(col => {
    col.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(col, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (!draggable) return;
        if (afterElement == null) {
            col.appendChild(draggable);
        } else {
            col.insertBefore(draggable, afterElement);
        }
    });
});

function handleDragStart() { this.classList.add('dragging'); }
function handleDragEnd() { this.classList.remove('dragging'); saveTasks(); }
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Task CRUD
window.editTask = function(event, id) {
    event.stopPropagation();
    currentEditingId = id;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Task';
    document.getElementById('taskSummary').value = task.summary;
    document.getElementById('taskDescription').value = task.description;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskEstimatedTime').value = task.estimatedTime || 40;
    
    taskModal.classList.remove('hidden');
};

window.deleteTask = function(event, id) {
    event.stopPropagation();
    if (confirm("Are you sure you want to delete this task?")) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks(); 
    }
};

addTaskBtn.addEventListener('click', () => {
    currentEditingId = null;
    document.getElementById('modalTitle').textContent = 'New Task';
    document.getElementById('taskSummary').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskEstimatedTime').value = '40';
    
    taskModal.classList.remove('hidden');
});

closeTaskModalBtn.addEventListener('click', () => taskModal.classList.add('hidden'));
cancelTaskBtn.addEventListener('click', () => taskModal.classList.add('hidden'));

saveTaskBtn.addEventListener('click', () => {
    const summary = document.getElementById('taskSummary').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const estimatedTime = parseInt(document.getElementById('taskEstimatedTime').value) || 40;
    
    if (!summary) {
        alert('Please enter a task summary.');
        return;
    }

    if (currentEditingId) {
        const task = tasks.find(t => t.id === currentEditingId);
        if (task) {
            task.summary = summary;
            task.description = description;
            task.priority = priority;
            task.estimatedTime = estimatedTime;
        }
    } else {
        const newId = Date.now().toString();
        tasks.push({
            id: newId,
            summary,
            description,
            priority,
            estimatedTime,
            timeSpent: 0,
            status: 'pending' 
        });
    }
    saveTasks();
    renderTasks();
    taskModal.classList.add('hidden');
});

// ==========================================
// 3. Pomodoro Timer Logic
// ==========================================
function openPomodoro(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    if (currentFocusTaskId !== id) {
        currentFocusTaskId = id;
        totalTime = (task.estimatedTime || 40) * 60;
        timeLeft = totalTime;
    }
    updateTimerDisplay();

    document.getElementById('focusTaskTitle').textContent = `Focusing on: ${task.summary}`;
    pomodoroModal.classList.remove('hidden');
}

closePomodoroBtn.addEventListener('click', () => {
    pomodoroModal.classList.add('hidden');
    saveTasks();
    renderTasks();
});

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    timeDisplay.textContent = formatTime(timeLeft);
    const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
    tomatoFill.style.height = `${percentage}%`;
}

startStopBtn.addEventListener('click', () => {
    if (isRunning) {
        clearInterval(timerInterval);
        startStopBtn.textContent = 'Start';
        isRunning = false;
        saveTasks();
        renderTasks();
    } else {
        if (timeLeft <= 0) {
            const task = tasks.find(t => t.id === currentFocusTaskId);
            totalTime = task ? (task.estimatedTime || 40) * 60 : 40*60;
            timeLeft = totalTime; 
            updateTimerDisplay();
        }
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
                if (currentFocusTaskId) {
                    const task = tasks.find(t => t.id === currentFocusTaskId);
                    if (task) {
                        task.timeSpent = (task.timeSpent || 0) + 1;
                    }
                }
            } else {
                clearInterval(timerInterval);
                startStopBtn.textContent = 'Start';
                isRunning = false;
                saveTasks();
                renderTasks();
                setTimeout(() => alert("🍅 Pomodoro finished! Take a break."), 100);
            }
        }, 1000);
        startStopBtn.textContent = 'Stop';
        isRunning = true;
        saveTasks(); 
    }
});

editTimeBtn.addEventListener('click', () => {
    const promptStr = prompt("Enter new timer duration in minutes:", Math.floor(totalTime / 60));
    if (promptStr !== null) {
        const mins = parseInt(promptStr, 10);
        if (!isNaN(mins) && mins > 0) {
            totalTime = mins * 60;
            timeLeft = totalTime;
            if (isRunning) {
                clearInterval(timerInterval);
                startStopBtn.textContent = 'Start';
                isRunning = false;
            }
            updateTimerDisplay();
            saveTasks();
        }
    }
});

// Utilities
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function formatLabel(str) {
    if (!str) return '';
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Initial UI pass
renderTasks();
updateTimerDisplay();
