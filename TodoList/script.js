// DOM Elements
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const todoList = document.getElementById('todo-list');
const tasksCount = document.getElementById('tasks-count');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

// App State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

// Initialize app
function init() {
    renderTasks();
    updateTasksCount();
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Add a new task
function addTask(text) {
    if (text.trim() === '') return;
    
    const newTask = {
        id: Date.now().toString(),
        text: text,
        completed: false
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    updateTasksCount();
    taskInput.value = '';
}

// Delete a task
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    updateTasksCount();
}

// Toggle task completion status
function toggleTaskStatus(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    
    saveTasks();
    renderTasks();
    updateTasksCount();
}

// Clear all completed tasks
function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
    updateTasksCount();
}

// Filter tasks based on current filter
function getFilteredTasks() {
    switch(currentFilter) {
        case 'active':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        default:
            return tasks;
    }
}

// Update tasks count display
function updateTasksCount() {
    const activeTasks = tasks.filter(task => !task.completed).length;
    tasksCount.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} left`;
}

// Render tasks to the DOM
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    todoList.innerHTML = '';
    
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <button class="delete-btn">×</button>
        `;
        
        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleTaskStatus(task.id));
        
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        todoList.appendChild(li);
    });
}

// Set active filter
function setFilter(filter) {
    currentFilter = filter;
    
    // Update active filter button
    filterBtns.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderTasks();
}

// Event Listeners
addTaskBtn.addEventListener('click', () => addTask(taskInput.value));

taskInput.addEventListener('keypress', event => {
    if (event.key === 'Enter') {
        addTask(taskInput.value);
    }
});

clearCompletedBtn.addEventListener('click', clearCompleted);

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

// Initialize the app
init();