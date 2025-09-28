// ==== DOM elements ====
const taskTextEl = document.getElementById('taskText');
const dueDateEl = document.getElementById('dueDate');
const addBtn = document.getElementById('addBtn');
const taskListEl = document.getElementById('taskList');
const sortBtn = document.getElementById('sortBtn');
const filterBtns = Array.from(document.querySelectorAll('[data-filter]'));

// ==== Storage helpers ====
const STORAGE_KEY = 'tasks';

function getTasks() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Failed to read tasks from storage', e);
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ==== State ====
let currentFilter = 'all';
let sortAsc = true;

// ==== Rendering ====
function renderTasks() {
  let tasks = getTasks();

  // filter
  if (currentFilter === 'completed') {
    tasks = tasks.filter(t => t.completed);
  } else if (currentFilter === 'active') {
    tasks = tasks.filter(t => !t.completed);
  }

  // sort by due date (when exists)
  tasks.sort((a, b) => {
    const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return sortAsc ? da - db : db - da;
  });

  taskListEl.innerHTML = '';

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item${task.completed ? ' completed' : ''}`;
    li.dataset.id = task.id;

    // checkbox
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = task.completed;
    cb.title = 'Mark completed';
    cb.addEventListener('change', onToggleComplete);

    // title block
    const titleWrap = document.createElement('div');
    titleWrap.className = 'title';

    const textSpan = document.createElement('span');
    textSpan.className = 'text';
    textSpan.textContent = task.text;

    const dateSmall = document.createElement('small');
    dateSmall.textContent = task.dueDate ? ` • due: ${task.dueDate}` : '';

    titleWrap.append(textSpan, dateSmall);

    // actions
    const actions = document.createElement('div');
    actions.className = 'actions';

    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.addEventListener('click', onDelete);

    actions.append(del);

    li.append(cb, titleWrap, actions);
    taskListEl.append(li);
  });
}


function addTask() {
  const text = taskTextEl.value.trim();
  const dueDate = dueDateEl.value;
  if (!text) {
    alert('Please write a task description');
    taskTextEl.focus();
    return;
  }
  const tasks = getTasks();
  const id = (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now());
  const newTask = { id, text, dueDate, completed: false };
  tasks.push(newTask);
  saveTasks(tasks);
  renderTasks();
  taskTextEl.value = '';
  dueDateEl.value = '';
}

function onToggleComplete(e) {
  const id = e.target.closest('li').dataset.id;
  const tasks = getTasks();
  const t = tasks.find(x => x.id === id);
  if (t) {
    t.completed = !!e.target.checked;
    saveTasks(tasks);
    renderTasks();
  }
}

function onDelete(e) {
  const id = e.target.closest('li').dataset.id;
  let tasks = getTasks();
  tasks = tasks.filter(x => x.id !== id);
  saveTasks(tasks);
  renderTasks();
}

// ==== Filtering & sorting ====
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

sortBtn.addEventListener('click', () => {
  sortAsc = !sortAsc;
  renderTasks();
});

addBtn.addEventListener('click', addTask);

// Press Enter to add
taskTextEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

// ==== Seed from API if empty ====
async function fetchInitialTasks() {
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
    if (!res.ok) return;
    const data = await res.json();
    const tasks = data.map(item => ({
      id: String(item.id),
      text: item.title,
      completed: !!item.completed,
      dueDate: ''
    }));
    if (getTasks().length === 0) {
      saveTasks(tasks);
    }
  } catch (e) {
    console.warn('Seed fetch failed', e);
  }
}

// ==== Init ====
(async function init() {
  await fetchInitialTasks();
  renderTasks();
})();