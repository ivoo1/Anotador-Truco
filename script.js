const maxPoints = 30;

let scores = {
    nosotros: 0,
    ellos: 0
};

// Update scores from local storage if any
function loadState() {
    const savedScores = localStorage.getItem('truco_scores');
    if (savedScores) {
        try {
            scores = JSON.parse(savedScores);
        } catch(e) {
            console.error("Could not load scores", e);
        }
    }
    
    ['nosotros', 'ellos'].forEach(team => {
        const nameInput = document.querySelector(`#team-${team} .team-name`);
        const savedName = localStorage.getItem(`truco_name_${team}`);
        if (savedName) nameInput.value = savedName;
        
        // Add listeners to save names
        nameInput.addEventListener('input', (e) => {
            localStorage.setItem(`truco_name_${team}`, e.target.value);
        });

        // Add visual feedback on focus out
        nameInput.addEventListener('blur', (e) => {
            if (e.target.value.trim() === '') {
                e.target.value = team === 'nosotros' ? 'NOS' : 'ELLOS';
                localStorage.setItem(`truco_name_${team}`, e.target.value);
            }
        });
    });

    renderAll();
}

function saveState() {
    localStorage.setItem('truco_scores', JSON.stringify(scores));
}

function addPoint(team) {
    if (scores[team] < maxPoints) {
        // Vibrate if supported to give haptic feedback
        if (navigator.vibrate) navigator.vibrate(40);
        scores[team]++;
        saveState();
        renderTeam(team);
        
        // Check for win
        if (scores[team] === maxPoints) {
            setTimeout(() => showWinnerModal(team), 100);
        }
    }
}

function subPoint(team) {
    if (scores[team] > 0) {
        if (navigator.vibrate) navigator.vibrate(20);
        scores[team]--;
        saveState();
        renderTeam(team);
    }
}

let resetTimeout = null;
function resetGame() {
    const btn = document.querySelector('.btn-reset');
    if (btn.classList.contains('confirm-mode')) {
        scores.nosotros = 0;
        scores.ellos = 0;
        saveState();
        renderAll();
        
        btn.classList.remove('confirm-mode');
        btn.textContent = 'Nueva Partida';
        clearTimeout(resetTimeout);
    } else {
        btn.classList.add('confirm-mode');
        btn.textContent = '¿Seguro? Click para reset';
        
        resetTimeout = setTimeout(() => {
            btn.classList.remove('confirm-mode');
            btn.textContent = 'Nueva Partida';
        }, 3000);
    }
}

function forceResetGame() {
    scores.nosotros = 0;
    scores.ellos = 0;
    saveState();
    renderAll();
    closeModal();
}

function showWinnerModal(team) {
    const nameInput = document.querySelector(`#team-${team} .team-name`).value || (team === 'nosotros' ? 'NOS' : 'ELLOS');
    const modal = document.getElementById('winner-modal');
    const title = document.getElementById('winner-text');
    
    title.textContent = `¡Ganó ${nameInput}!`;
    title.style.color = team === 'nosotros' ? 'var(--brand-nosotros)' : 'var(--brand-ellos)';
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('winner-modal').classList.add('hidden');
}

function renderAll() {
    renderTeam('nosotros');
    renderTeam('ellos');
}

function renderTeam(team) {
    const score = scores[team];
    
    // Update numeric display
    document.querySelector(`#team-${team} .score-display`).textContent = score;
    
    // Update matches container
    const container = document.querySelector(`#matches-${team}`);
    
    // If empty create grid, otherwise just replace content inside
    let grid = container.querySelector('.matches-grid');
    if (!grid) {
        grid = document.createElement('div');
        grid.className = 'matches-grid';
        container.appendChild(grid);
    }
    grid.innerHTML = ''; // reset children
    
    // Create grid for up to 30 points (6 boxes of 5 in a single column)
    for (let i = 0; i < 6; i++) {
        const boxPoints = Math.max(0, Math.min(5, score - (i * 5)));
        grid.appendChild(createMatchBox(boxPoints, i));
        
        // Add horizontal divider after the first 15 points (3 boxes)
        if (i === 2) {
            const divider = document.createElement('div');
            divider.className = 'divider-15';
            grid.appendChild(divider);
        }
    }
}

/*
  Creates an SVG representing up to 5 points.
  Line drawing logic for Argentina Truco standard:
  1: Left vertical
  2: Left + Bottom
  3: Left + Bottom + Right
  4: Full square
  5: Square + Diagonal (Top-left to Bottom-right)
*/
function createMatchBox(points, index) {
    const size = 45;
    const padding = 5;
    const innerSize = size - (padding * 2);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'match-box';
    
    if (points === 0) return wrapper;
    
    let paths = '';
    
    // Helper to format line drawing
    const line = (x1, y1, x2, y2) => `<line class="match-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    
    const p = padding;
    const p2 = padding + innerSize;
    
    // 1 point: Left vertical
    if (points >= 1) paths += line(p, p, p, p2);
    // 2 points: Bottom horizontal
    if (points >= 2) paths += line(p, p2, p2, p2);
    // 3 points: Right vertical
    if (points >= 3) paths += line(p2, p2, p2, p);
    // 4 points: Top horizontal
    if (points >= 4) paths += line(p2, p, p, p);
    // 5 points: Diagonal
    if (points === 5) paths += line(p, p, p2, p2);
    
    wrapper.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 ${size} ${size}">${paths}</svg>`;
    return wrapper;
}

// Initialize
document.addEventListener('DOMContentLoaded', loadState);

// Optional: Keyboard support for quick adding
document.addEventListener('keydown', (e) => {
    // Only if we aren't typing in an input
    if (e.target.tagName !== 'INPUT') {
        if (e.key === 'ArrowLeft') addPoint('nosotros');
        if (e.key === 'ArrowRight') addPoint('ellos');
    }
});
