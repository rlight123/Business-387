// Import electron modules for native features
const { app, dialog } = window.require ? window.require('electron') : { app: null, dialog: null };
const version = app ? app.getVersion() : '1.0.0';

// DOM Elements
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const addNoteBtn = document.getElementById('add-note');
const cancelNoteBtn = document.getElementById('cancel-note');
const newNoteBtn = document.getElementById('new-note-btn');
const notesList = document.getElementById('notes-list');
const noteForm = document.getElementById('note-form');
const searchInput = document.getElementById('search-notes');
const notesCountEl = document.getElementById('notes-count');
const appVersionEl = document.getElementById('app-version');
const categoriesList = document.getElementById('categories-list');

// App State
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let editingNoteIndex = null;
let activeCategory = 'all';
let searchTerm = '';

// Set app version in status bar
appVersionEl.textContent = `v${version}`;

// Helper Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    }).format(date);
}

function showNoteForm() {
    noteForm.style.display = 'block';
    noteTitle.focus();
}

function hideNoteForm() {
    noteForm.style.display = 'none';
    noteTitle.value = '';
    noteContent.value = '';
    editingNoteIndex = null;
}

function updateNotesCount() {
    const count = notes.length;
    notesCountEl.textContent = `${count} note${count !== 1 ? 's' : ''}`;
}

// Filtering Functions
function filterNotesByCategory(category) {
    if (category === 'all') {
        return notes;
    } else if (category === 'favorites') {
        return notes.filter(note => note.favorite);
    }
    return notes;
}

function filterNotesBySearch(notesToFilter, term) {
    if (!term) return notesToFilter;
    
    return notesToFilter.filter(note => 
        note.title.toLowerCase().includes(term.toLowerCase()) || 
        note.content.toLowerCase().includes(term.toLowerCase())
    );
}

// Render notes based on current filters
function renderNotes() {
    let filteredNotes = filterNotesByCategory(activeCategory);
    filteredNotes = filterNotesBySearch(filteredNotes, searchTerm);
    
    notesList.innerHTML = '';
    
    filteredNotes.forEach((note, index) => {
        const noteElement = document.createElement('div');
        noteElement.classList.add('note');
        
        // Find the actual index in the original notes array
        const originalIndex = notes.findIndex(n => 
            n.id === note.id || 
            (n.title === note.title && n.content === note.content && n.date === note.date)
        );
        
        noteElement.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.content}</p>
            <div class="note-date">${formatDate(note.date)}</div>
            <button class="favorite-btn ${note.favorite ? 'active' : ''}" data-index="${originalIndex}">★</button>
            <button class="delete-btn" data-index="${originalIndex}">×</button>
        `;
        
        // Add click event to open note for editing
        noteElement.addEventListener('click', (e) => {
            // Don't open if clicking on buttons
            if (e.target.classList.contains('delete-btn') || 
                e.target.classList.contains('favorite-btn')) {
                return;
            }
            openNoteForEditing(originalIndex);
        });
        
        notesList.appendChild(noteElement);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteNote);
    });
    
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', toggleFavorite);
    });
    
    updateNotesCount();
}

// Note CRUD Operations
function addOrUpdateNote() {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    
    if (title === '' && content === '') {
        if (dialog) {
            dialog.showMessageBox({
                type: 'warning',
                title: 'Empty Note',
                message: 'Please add a title or content to your note'
            });
        } else {
            alert('Please add a title or content to your note');
        }
        return;
    }
    
    if (editingNoteIndex !== null) {
        // Update existing note
        notes[editingNoteIndex].title = title || 'Untitled';
        notes[editingNoteIndex].content = content;
        notes[editingNoteIndex].updated = new Date().toISOString();
    } else {
        // Add new note
        const newNote = {
            id: Date.now().toString(),
            title: title || 'Untitled',
            content: content,
            date: new Date().toISOString(),
            favorite: false
        };
        
        notes.unshift(newNote); // Add to beginning of array
    }
    
    saveNotes();
    renderNotes();
    hideNoteForm();
}

function openNoteForEditing(index) {
    const note = notes[index];
    editingNoteIndex = index;
    
    noteTitle.value = note.title;
    noteContent.value = note.content;
    
    showNoteForm();
}

function deleteNote(event) {
    event.stopPropagation();
    const index = parseInt(event.target.getAttribute('data-index'));
    
    if (dialog) {
        const result = dialog.showMessageBoxSync({
            type: 'question',
            buttons: ['Cancel', 'Delete'],
            title: 'Confirm',
            message: 'Are you sure you want to delete this note?'
        });
        
        if (result !== 1) return; // If not "Delete" button
    } else if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }
    
    notes.splice(index, 1);
    saveNotes();
    renderNotes();
}

function toggleFavorite(event) {
    event.stopPropagation();
    const index = parseInt(event.target.getAttribute('data-index'));
    notes[index].favorite = !notes[index].favorite;
    
    saveNotes();
    renderNotes();
}

// Save notes to localStorage
function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

// Set active category
function setActiveCategory(category) {
    activeCategory = category;
    
    // Update UI
    document.querySelectorAll('#categories-list li').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-category') === category) {
            item.classList.add('active');
        }
    });
    
    renderNotes();
}

// Event Listeners
newNoteBtn.addEventListener('click', () => {
    editingNoteIndex = null;
    showNoteForm();
});

addNoteBtn.addEventListener('click', addOrUpdateNote);
cancelNoteBtn.addEventListener('click', hideNoteForm);

searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    renderNotes();
});

// Category filtering
categoriesList.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        const category = e.target.getAttribute('data-category');
        setActiveCategory(category);
    }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key to cancel form
    if (e.key === 'Escape' && noteForm.style.display !== 'none') {
        hideNoteForm();
    }
    
    // Ctrl/Cmd + N to create new note
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        editingNoteIndex = null;
        showNoteForm();
    }
});

// Initialize the app
hideNoteForm(); // Hide form initially
renderNotes();