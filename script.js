// Store state
let notes = JSON.parse(localStorage.getItem('secondBrainNotes')) || [];
let reflections = JSON.parse(localStorage.getItem('secondBrainReflections')) || [];
let currentFilter = 'all';
let searchQuery = '';
let currentView = 'dashboard';
let isLightMode = localStorage.getItem('secondBrainTheme') === 'light';
let noteToDeleteId = null;

// Focus Mode State
let focusTimerInterval = null;
let focusAlarmInterval = null;
let focusTimeLeft = 0;

function saveNotes() {
    localStorage.setItem('secondBrainNotes', JSON.stringify(notes));
}

function saveReflections() {
    localStorage.setItem('secondBrainReflections', JSON.stringify(reflections));
}

function saveTheme(isLight) {
    localStorage.setItem('secondBrainTheme', isLight ? 'light' : 'dark');
}
function formatDate(isoString) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(isoString).toLocaleDateString('en-US', options);
}

// ── Smart Connections Logic ─────────────────────────────────────────────
const STOP_WORDS = new Set(['the', 'is', 'in', 'at', 'of', 'a', 'an', 'and', 'or', 'to', 'it', 'that', 'was', 'for', 'on', 'are', 'as', 'with', 'be', 'this', 'have', 'from', 'he', 'she', 'they', 'we', 'you', 'i', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'do', 'did', 'but', 'by', 'not', 'what', 'which', 'who', 'will', 'has', 'had', 'been', 'more']);

function tokenize(text) {
    if (!text) return [];
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function findRelatedNotes(note, allNotes) {
    const noteTokens = new Set([...tokenize(note.title), ...tokenize(note.description), ...note.tags.map(t => t.toLowerCase())]);
    const scores = allNotes
        .filter(n => n.id !== note.id)
        .map(n => {
            const otherTokens = new Set([...tokenize(n.title), ...tokenize(n.description), ...n.tags.map(t => t.toLowerCase())]);
            const shared = [...noteTokens].filter(t => otherTokens.has(t));
            return { note: n, score: shared.length, shared };
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    return scores;
}
// DOM Elements
const notesGrid = document.getElementById('notesGrid');
const addNoteBtn = document.getElementById('addNoteBtn');
const addNoteModal = document.getElementById('addNoteModal');
const closeModals = document.querySelectorAll('.close-modal');
const addNoteForm = document.getElementById('addNoteForm');
const searchInput = document.getElementById('searchInput');
const tagFilterList = document.getElementById('tagFilterList');
const deleteNoteModal = document.getElementById('deleteNoteModal');
const closeDeleteModals = document.querySelectorAll('.close-delete-modal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const todaysFocusSection = document.getElementById('todaysFocusSection');
const todaysFocusGrid = document.getElementById('todaysFocusGrid');
const totalNotesCount = document.getElementById('totalNotesCount');
const mostUsedTag = document.getElementById('mostUsedTag');
const tagInsights = document.getElementById('tagInsights');
const noteDescription = document.getElementById('noteDescription');
const suggestedTagsContainer = document.getElementById('suggestedTagsContainer');
const noteTagsInput = document.getElementById('noteTags');
const navDashboardBtn = document.getElementById('navDashboardBtn');
const navAllNotesBtn = document.getElementById('navAllNotesBtn');
const navPriorityBtn = document.getElementById('navPriorityBtn');
const navReflectionsBtn = document.getElementById('navReflectionsBtn');
const navGuideBtn = document.getElementById('navGuideBtn');
const dashboardView = document.getElementById('dashboardView');
const allNotesView = document.getElementById('allNotesView');
const priorityView = document.getElementById('priorityView');
const reflectionsView = document.getElementById('reflectionsView');
const guideView = document.getElementById('guideView');
const priorityGrid = document.getElementById('priorityGrid');
const deleteAllNotesBtn = document.getElementById('deleteAllNotesBtn');
const deleteAllModal = document.getElementById('deleteAllModal');
const closeDeleteAllModals = document.querySelectorAll('.close-delete-all-modal');
const confirmDeleteAllBtn = document.getElementById('confirmDeleteAllBtn');
const weeklyReportSection = document.getElementById('weeklyReportSection');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileNavDrawer = document.getElementById('mobileNavDrawer');
const mobileNavBackdrop = document.getElementById('mobileNavBackdrop');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
const drawerThemeToggleBtn = document.getElementById('drawerThemeToggleBtn');
const mobileAddNoteBtn = document.getElementById('mobileAddNoteBtn');
const mobileDeleteAllBtn = document.getElementById('mobileDeleteAllBtn');

function renderTags() {
    const allTags = new Set();
    notes.forEach(note => {
        note.tags.forEach(tag => allTags.add(tag));
    });

    let tagsHtml = `<button class="tag-btn ${currentFilter === 'all' ? 'active' : ''}" data-tag="all">All Notes</button>`;

    Array.from(allTags).sort().forEach(tag => {
        tagsHtml += `<button class="tag-btn ${currentFilter === tag ? 'active' : ''}" data-tag="${tag}">#${tag}</button>`;
    });

    tagFilterList.innerHTML = tagsHtml;

    // Add listener to tags
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentFilter = e.target.dataset.tag;
            if (currentView !== 'allNotes') switchView('allNotes');
            renderTags();
            renderNotes();
        });
    });
}

function renderNotes() {
    updateDashboard();
    renderTodaysFocus();
    renderPriorityNotes();

    let filteredNotes = notes;

    if (currentFilter !== 'all') {
        filteredNotes = filteredNotes.filter(note => note.tags.includes(currentFilter));
    }

    if (searchQuery) {
        filteredNotes = filteredNotes.filter(note =>
            note.title.toLowerCase().includes(searchQuery) ||
            note.description.toLowerCase().includes(searchQuery) ||
            note.tags.some(tag => tag.toLowerCase().includes(searchQuery))
        );
    }

    filteredNotes.sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0);
    });

    if (filteredNotes.length === 0) {
        notesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem; opacity: 0.5;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <p>No notes found. Create your first note!</p>
            </div>
        `;
    } else {
        notesGrid.innerHTML = filteredNotes.map(note => createNoteCardHTML(note)).join('');
    }
}

function createNoteCardHTML(note) {
    const starIcon = note.isImportant
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
    const checkIcon = note.isCompleted
        ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

    const related = findRelatedNotes(note, notes);
    const relatedHTML = related.length > 0 ? `
        <div class="related-notes">
            <div class="related-notes-title">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Related
            </div>
            ${related.map(r => `<span class="related-note-chip" title="${r.note.title}">${r.note.title.slice(0, 28)}${r.note.title.length > 28 ? '…' : ''}</span>`).join('')}
        </div>` : '';

    return `
        <div class="note-card ${note.isCompleted ? 'completed' : ''}" data-id="${note.id}">
            <div class="note-header">
                <div>
                    <h3 class="note-title">${note.title}</h3>
                    <span class="note-date">${formatDate(note.date)}</span>
                </div>
                <div class="note-actions">
                    <button class="focus-btn" title="Focus Mode">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                    </button>
                    <button class="star-btn ${note.isImportant ? 'active' : ''}" title="${note.isImportant ? 'Unmark important' : 'Mark important'}">${starIcon}</button>
                    <button class="delete-btn" title="Delete note">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
            
            <div class="note-desc">${note.description}</div>
            
            <div class="note-tags">
                ${note.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
            </div>

            ${relatedHTML}

            <div class="ai-summary" id="summary-${note.id}">
                <div class="ai-summary-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    AI Summary
                </div>
                <div class="ai-summary-content"></div>
            </div>
            
            <div class="note-footer">
                <button class="btn btn-sm btn-success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                    Summarize
                </button>
                <button class="btn btn-sm complete-btn ${note.isCompleted ? 'active' : ''}" title="${note.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}">
                    ${checkIcon}
                    ${note.isCompleted ? 'Completed' : 'Mark Done'}
                </button>
            </div>
        </div>
    `;
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', isLightMode ? 'light' : 'dark');
    const sunIcons = document.querySelectorAll('.sun-icon');
    const moonIcons = document.querySelectorAll('.moon-icon');

    sunIcons.forEach(icon => { icon.style.display = isLightMode ? 'none' : 'block'; });
    moonIcons.forEach(icon => { icon.style.display = isLightMode ? 'block' : 'none'; });
}

function toggleTheme() {
    isLightMode = !isLightMode;
    saveTheme(isLightMode);
    applyTheme();
}
function setupFocusMode() {
    const focusModal = document.getElementById('focusModal');
    const exitBtn = document.getElementById('exitFocusBtn');
    const startBtn = document.getElementById('focusTimerStartBtn');
    const resetBtn = document.getElementById('focusTimerResetBtn');
    const timerDisplay = document.getElementById('focusTimerDisplay');
    const hoursInput = document.getElementById('focusHoursInput');
    const minsInput = document.getElementById('focusMinsInput');

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        if (h > 0) {
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const updateFromInputs = () => {
        let h = parseInt(hoursInput.value) || 0;
        let m = parseInt(minsInput.value) || 0;

        if (m >= 60) {
            h += Math.floor(m / 60);
            m = m % 60;
            hoursInput.value = h;
            minsInput.value = m;
        }

        focusTimeLeft = (h * 3600) + (m * 60);
        timerDisplay.textContent = formatTime(focusTimeLeft);

        clearInterval(focusTimerInterval);
        focusTimerInterval = null;
        startBtn.textContent = 'Start';
    };

    hoursInput.addEventListener('change', updateFromInputs);
    minsInput.addEventListener('change', updateFromInputs);

    exitBtn.addEventListener('click', () => {
        focusModal.classList.remove('active');
        clearInterval(focusTimerInterval);
        focusTimerInterval = null;
        stopFocusAlarm();
        hoursInput.disabled = false;
        minsInput.disabled = false;
        updateFromInputs();
    });

    startBtn.addEventListener('click', () => {
        stopFocusAlarm();
        if (focusTimerInterval) {
            clearInterval(focusTimerInterval);
            focusTimerInterval = null;
            startBtn.textContent = 'Resume';
        } else {
            if (focusTimeLeft <= 0) return;
            startBtn.textContent = 'Pause';
            hoursInput.disabled = true;
            minsInput.disabled = true;
            focusTimerInterval = setInterval(() => {
                focusTimeLeft--;
                timerDisplay.textContent = formatTime(focusTimeLeft);
                if (focusTimeLeft <= 0) {
                    clearInterval(focusTimerInterval);
                    focusTimerInterval = null;
                    timerDisplay.textContent = '✓ Done!';
                    timerDisplay.classList.add('pulse-animation');
                    startBtn.textContent = 'Start';
                    hoursInput.disabled = false;
                    minsInput.disabled = false;
                    startFocusAlarm();
                }
            }, 1000);
        }
    });

    resetBtn.addEventListener('click', () => {
        clearInterval(focusTimerInterval);
        focusTimerInterval = null;
        stopFocusAlarm();
        timerDisplay.classList.remove('pulse-animation');
        hoursInput.disabled = false;
        minsInput.disabled = false;
        updateFromInputs();
    });
}

function startFocusAlarm() {
    if (focusAlarmInterval) return;
    playBeep();
    focusAlarmInterval = setInterval(playBeep, 1000);
}

function stopFocusAlarm() {
    if (focusAlarmInterval) {
        clearInterval(focusAlarmInterval);
        focusAlarmInterval = null;
    }
}

function playBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
        console.log('Audio blocked');
    }
}

function openFocusMode(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const content = document.getElementById('focusNoteContent');
    content.innerHTML = `
        <h2 class="focus-note-title">${note.title}</h2>
        <p class="focus-note-date">${formatDate(note.date)}</p>
        <div class="focus-note-body">${note.description.replace(/\n/g, '<br>')}</div>
        <div class="focus-note-tags">${note.tags.map(t => `<span class="tag">#${t}</span>`).join('')}</div>
    `;
    document.getElementById('focusModal').classList.add('active');
}
function saveReflection() {
    const input = document.getElementById('reflectionInput');
    const text = input.value.trim();
    if (!text) return;
    const entry = { id: Date.now().toString(), text, date: new Date().toISOString() };
    reflections.unshift(entry);
    saveReflections();
    input.value = '';
    renderReflections();
}

function renderReflections() {
    const list = document.getElementById('reflectionsList');
    if (!list) return;
    if (reflections.length === 0) {
        list.innerHTML = `<p style="color:var(--text-secondary);text-align:center;padding:2rem 0;">No reflections yet. Start writing!</p>`;
        return;
    }
    list.innerHTML = reflections.map(r => `
        <div class="reflection-card">
            <div class="reflection-meta">${formatDate(r.date)}</div>
            <div class="reflection-text">${r.text.replace(/\n/g, '<br>')}</div>
            <button class="btn btn-sm btn-success generate-reflection-summary" data-id="${r.id}" style="margin-top:0.75rem">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                Summarize
            </button>
            <div class="reflection-summary" id="rsummary-${r.id}"></div>
        </div>
    `).join('');

    document.querySelectorAll('.generate-reflection-summary').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const reflection = reflections.find(r => r.id === id);
            const container = document.getElementById('rsummary-' + id);
            if (!reflection || !container) return;
            container.innerHTML = '<em style="color:var(--text-secondary)">Generating summary...</em>';
            setTimeout(() => {
                const sentences = reflection.text.split(/(?<=\.)\s+/);
                const summary = sentences[0].length > 120 ? sentences[0].substring(0, 117) + '...' : sentences[0];
                let i = 0;
                container.innerHTML = '<em>TL;DR:</em> <span class="typing-text"></span>';
                const span = container.querySelector('.typing-text');
                const timer = setInterval(() => {
                    if (i < summary.length) { span.textContent += summary.charAt(i++); }
                    else clearInterval(timer);
                }, 15);
            }, 600);
        });
    });
}
function updateDashboard() {
    if (!totalNotesCount) return;
    totalNotesCount.textContent = notes.length;

    const welcomeSection = document.getElementById('welcomeSection');
    if (welcomeSection) {
        welcomeSection.style.display = (notes.length === 0 && currentView === 'dashboard') ? 'block' : 'none';
    }

    if (notes.length > 0 && currentView === 'allNotes') {
        deleteAllNotesBtn.style.display = 'flex';
        if (mobileDeleteAllBtn) mobileDeleteAllBtn.style.display = 'flex';
    } else {
        deleteAllNotesBtn.style.display = 'none';
        if (mobileDeleteAllBtn) mobileDeleteAllBtn.style.display = 'none';
    }

    if (notes.length === 0) {
        mostUsedTag.textContent = '-';
        tagInsights.textContent = 'Start writing to see insights!';
        return;
    }

    let tagCounts = {};
    let topTag = '';
    let maxCount = 0;

    notes.forEach(note => {
        note.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            if (tagCounts[tag] > maxCount) {
                maxCount = tagCounts[tag];
                topTag = tag;
            }
        });
    });

    if (topTag) {
        mostUsedTag.textContent = '#' + topTag;
        tagInsights.textContent = `You mostly write about ${topTag}!`;
    } else {
        mostUsedTag.textContent = '-';
        tagInsights.textContent = 'Add some tags to see insights!';
    }
}

function renderTodaysFocus() {
    if (!todaysFocusSection) return;
    if (searchQuery || currentFilter !== 'all') {
        todaysFocusSection.style.display = 'none';
        todaysFocusGrid.innerHTML = '';
        return [];
    }

    const todayStr = new Date().toDateString();
    let todaysNotes = notes.filter(note => new Date(note.date).toDateString() === todayStr);

    todaysNotes.sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0);
    });

    if (todaysNotes.length > 0) {
        todaysFocusSection.style.display = 'block';
        todaysFocusGrid.innerHTML = todaysNotes.map(note => createNoteCardHTML(note)).join('');
    } else {
        todaysFocusSection.style.display = 'none';
        todaysFocusGrid.innerHTML = '';
    }
}

function renderPriorityNotes() {
    if (!priorityGrid) return;
    let priorityNotes = notes.filter(note => note.isImportant);
    priorityNotes.sort((a, b) => (a.isCompleted !== b.isCompleted) ? (a.isCompleted ? 1 : -1) : 0);

    if (priorityNotes.length > 0) {
        priorityGrid.innerHTML = priorityNotes.map(note => createNoteCardHTML(note)).join('');
    } else {
        priorityGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);"><p>No priority notes. Star a note to see it here!</p></div>`;
    }
}

function renderWeeklyReport() {
    if (!weeklyReportSection) return;
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const weekNotes = notes.filter(n => new Date(n.date) >= sevenDaysAgo);

    if (weekNotes.length === 0) {
        weeklyReportSection.style.display = 'none';
        return;
    }
    weeklyReportSection.style.display = 'block';

    const dayCounts = {};
    weekNotes.forEach(n => {
        const day = new Date(n.date).toLocaleDateString('en-US', { weekday: 'long' });
        dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const mostActiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0][0];

    const tagCounts = {};
    weekNotes.forEach(n => n.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    const topTag = Object.keys(tagCounts).length > 0 ? Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0][0] : null;

    const completedCount = weekNotes.filter(n => n.isCompleted).length;
    const completionRate = weekNotes.length > 0 ? Math.round((completedCount / weekNotes.length) * 100) : 0;

    weeklyReportSection.innerHTML = `
        <div class="weekly-report-card">
            <div class="weekly-report-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Weekly Report
            </div>
            <div class="weekly-stats">
                <div class="weekly-stat">
                    <div class="weekly-stat-value">${weekNotes.length}</div>
                    <div class="weekly-stat-label">Notes This Week</div>
                </div>
                <div class="weekly-stat">
                    <div class="weekly-stat-value">${mostActiveDay.slice(0, 3)}</div>
                    <div class="weekly-stat-label">Most Active Day</div>
                </div>
                <div class="weekly-stat">
                    <div class="weekly-stat-value">${topTag ? '#' + topTag : '—'}</div>
                    <div class="weekly-stat-label">Top Topic</div>
                </div>
                <div class="weekly-stat">
                    <div class="weekly-stat-value">${completionRate}%</div>
                    <div class="weekly-stat-label">Done Rate</div>
                </div>
            </div>
            <p class="weekly-insight">You were most productive on <strong>${mostActiveDay}</strong>.</p>
        </div>
    `;
}
// Initialize
function init() {
    applyTheme();
    renderNotes();
    renderTags();
    updateDashboard();
    setupEventListeners();
    setupFocusMode();
    renderReflections();
    renderWeeklyReport();
    setupMobileNav();
}

// Navigation logic
function switchView(view) {
    currentView = view;
    navDashboardBtn.classList.toggle('active', view === 'dashboard');
    navAllNotesBtn.classList.toggle('active', view === 'allNotes');
    navPriorityBtn.classList.toggle('active', view === 'priority');
    navReflectionsBtn.classList.toggle('active', view === 'reflections');
    if (navGuideBtn) navGuideBtn.classList.toggle('active', view === 'guide');

    mobileNavItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    dashboardView.style.display = view === 'dashboard' ? 'block' : 'none';
    allNotesView.style.display = view === 'allNotes' ? 'block' : 'none';
    priorityView.style.display = view === 'priority' ? 'block' : 'none';
    reflectionsView.style.display = view === 'reflections' ? 'block' : 'none';
    if (guideView) guideView.style.display = view === 'guide' ? 'block' : 'none';

    if (view === 'dashboard' || view === 'priority' || view === 'guide') {
        searchQuery = '';
        searchInput.value = '';
        currentFilter = 'all';
        renderTags();
    }

    if (view === 'reflections') renderReflections();

    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMobileDrawer();
    renderNotes();
}

function setupMobileNav() {
    hamburgerBtn.addEventListener('click', () => {
        mobileNavDrawer.classList.add('open');
        mobileNavBackdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
    });

    const closeDrawer = () => {
        mobileNavDrawer.classList.remove('open');
        mobileNavBackdrop.classList.remove('open');
        document.body.style.overflow = '';
    };

    closeDrawerBtn.addEventListener('click', closeDrawer);
    mobileNavBackdrop.addEventListener('click', closeDrawer);

    mobileNavItems.forEach(item => {
        item.addEventListener('click', () => {
            switchView(item.dataset.view);
        });
    });

    window.closeMobileDrawer = closeDrawer;
}

function setupEventListeners() {
    addNoteBtn.addEventListener('click', () => {
        addNoteModal.classList.add('active');
        document.getElementById('noteTitle').focus();
    });

    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            addNoteModal.classList.remove('active');
            addNoteForm.reset();
        });
    });

    closeDeleteModals.forEach(btn => {
        btn.addEventListener('click', () => {
            deleteNoteModal.classList.remove('active');
            noteToDeleteId = null;
        });
    });

    addNoteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('noteTitle').value;
        const description = document.getElementById('noteDescription').value;
        const tagsInput = document.getElementById('noteTags').value;
        const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

        const newNote = {
            id: Date.now().toString(),
            title, description, tags,
            isImportant: false,
            isCompleted: false,
            date: new Date().toISOString()
        };

        notes.unshift(newNote);
        saveNotes();
        renderNotes();
        renderTags();

        addNoteModal.classList.remove('active');
        addNoteForm.reset();
    });

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        if (searchQuery && currentView !== 'allNotes') switchView('allNotes');
        renderNotes();
    });

    navDashboardBtn.addEventListener('click', () => switchView('dashboard'));
    navAllNotesBtn.addEventListener('click', () => switchView('allNotes'));
    navPriorityBtn.addEventListener('click', () => switchView('priority'));
    navReflectionsBtn.addEventListener('click', () => switchView('reflections'));
    if (navGuideBtn) navGuideBtn.addEventListener('click', () => switchView('guide'));

    document.getElementById('saveReflectionBtn').addEventListener('click', saveReflection);

    themeToggleBtn.addEventListener('click', toggleTheme);
    if (drawerThemeToggleBtn) drawerThemeToggleBtn.addEventListener('click', toggleTheme);

    if (mobileAddNoteBtn) {
        mobileAddNoteBtn.addEventListener('click', () => {
            addNoteModal.classList.add('active');
            document.getElementById('noteTitle').focus();
        });
    }

    // Delete All
    deleteAllNotesBtn.addEventListener('click', () => deleteAllModal.classList.add('active'));
    if (mobileDeleteAllBtn) mobileDeleteAllBtn.addEventListener('click', () => { deleteAllModal.classList.add('active'); closeMobileDrawer(); });
    closeDeleteAllModals.forEach(btn => btn.addEventListener('click', () => deleteAllModal.classList.remove('active')));
    confirmDeleteAllBtn.addEventListener('click', () => { notes = []; saveNotes(); renderNotes(); renderTags(); deleteAllModal.classList.remove('active'); });

    // Global Action Delegation
    document.body.addEventListener('click', (e) => {
        const card = e.target.closest('.note-card');
        if (!card || !card.dataset.id) return;
        const id = card.dataset.id;

        if (e.target.closest('.delete-btn')) {
            noteToDeleteId = id;
            deleteNoteModal.classList.add('active');
        } else if (e.target.closest('.btn-success')) {
            generateSummary(id);
        } else if (e.target.closest('.complete-btn')) {
            const note = notes.find(n => n.id === id);
            if (note) { note.isCompleted = !note.isCompleted; saveNotes(); renderNotes(); }
        } else if (e.target.closest('.star-btn')) {
            const note = notes.find(n => n.id === id);
            if (note) { note.isImportant = !note.isImportant; saveNotes(); renderNotes(); }
        } else if (e.target.closest('.focus-btn')) {
            openFocusMode(id);
        }
    });

    // Suggested Tag Delegation
    suggestedTagsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggested-tag')) {
            const tag = e.target.dataset.tag;
            const currentVal = noteTagsInput.value;
            noteTagsInput.value = currentVal ? (currentVal.includes(tag) ? currentVal : currentVal + ', ' + tag) : tag;
            e.target.remove();
            if (suggestedTagsContainer.querySelectorAll('.suggested-tag').length === 0) suggestedTagsContainer.style.display = 'none';
        }
    });

    // Close Modals on Backdrop Click
    [addNoteModal, deleteNoteModal, deleteAllModal].forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    });

    // Single Note Delete Confirmation
    confirmDeleteBtn.addEventListener('click', () => {
        if (noteToDeleteId) {
            notes = notes.filter(note => note.id !== noteToDeleteId);
            saveNotes(); renderNotes(); renderTags();
            deleteNoteModal.classList.remove('active');
            noteToDeleteId = null;
        }
    });

    // Tag Suggestion Engine
    noteDescription.addEventListener('input', () => {
        const text = noteDescription.value.toLowerCase();
        const keywords = { 'study': 'Study', 'exam': 'Study', 'learn': 'Study', 'money': 'Finance', 'expense': 'Finance', 'budget': 'Finance', 'work': 'Work', 'project': 'Work', 'meeting': 'Work', 'idea': 'Ideas', 'brainstorm': 'Ideas' };
        let foundTags = new Set();
        Object.keys(keywords).forEach(kw => { if (text.includes(kw)) foundTags.add(keywords[kw]); });
        const currentTags = noteTagsInput.value.toLowerCase();
        const tagsToSuggest = Array.from(foundTags).filter(t => !currentTags.includes(t.toLowerCase()));

        if (tagsToSuggest.length > 0) {
            suggestedTagsContainer.style.display = 'flex';
            const existingChips = Array.from(suggestedTagsContainer.querySelectorAll('.suggested-tag')).map(el => el.dataset.tag);
            tagsToSuggest.forEach(tag => {
                if (!existingChips.includes(tag)) {
                    const chip = document.createElement('span');
                    chip.className = 'suggested-tag';
                    chip.dataset.tag = tag;
                    chip.textContent = '+' + tag;
                    suggestedTagsContainer.appendChild(chip);
                }
            });
        }
    });
}

function generateSummary(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const summaryContainer = document.getElementById(`summary-${id}`);
    const contentDiv = summaryContainer.querySelector('.ai-summary-content');
    summaryContainer.classList.add('visible');
    contentDiv.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    setTimeout(() => {
        let text = note.description.trim();
        let sentences = text.split(/(?<=\.)\s+/);
        let summaryText = text.length === 0 ? "Empty note." : (sentences.length === 1 && text.length < 60 ? text : sentences[0] + (sentences.length > 2 ? " " + sentences[sentences.length - 1] : ""));
        if (summaryText.length > 120) summaryText = summaryText.substring(0, 117) + "...";
        contentDiv.innerHTML = `<em>TL;DR:</em> <span class="typing-text"></span>`;
        const textSpan = contentDiv.querySelector('.typing-text');
        let i = 0;
        const typeWriter = setInterval(() => {
            if (i < summaryText.length) { textSpan.textContent += summaryText.charAt(i++); }
            else clearInterval(typeWriter);
        }, 15);
    }, 600);
}

// Boot the app
document.addEventListener('DOMContentLoaded', init);
