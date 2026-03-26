// --- GLOBAL DATA & STATE ---
let currentFormula = {};
let clueIndex = 0;
let userLevel = parseInt(localStorage.getItem('formulaLevel')) || 1;
let completedInLevel = JSON.parse(localStorage.getItem('completedFormulas')) || [];

const inputs = [
    document.getElementById('input-storhet'),   
    document.getElementById('input-b-storhet'), 
    document.getElementById('input-enhet'),     
    document.getElementById('input-b-enhet')    
];
const keys = ['storhet', 'bStorhet', 'enhet', 'bEnhet'];

// --- HJÄLPFUNKTIONER ---

function normalize(text, isSymbol = false) {
    if (!text) return "";
    let processed = String(text).trim();
    if (!isSymbol) {
        return processed.toLowerCase().replace(/²/g, '2').replace(/³/g, '3').replace(/\s/g, '');
    } else {
        return processed.replace(/\s/g, '');
    }
}

// Tvingar markören till slutet av en contenteditable div
function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

function updateSymbolHelpers() {
    const renderButtons = (containerId, inputId, key) => {
        const container = document.getElementById(containerId);
        container.innerHTML = "";
        const symbols = [...new Set(formulaData.map(f => f[key]))];

        symbols.forEach(symbol => {
            if (/[_²³]|[^a-zA-Z0-9\/\s\-\(\)]/.test(symbol)) {
                const btn = document.createElement('button');
                btn.className = 'symbol-btn';
                btn.type = "button";
                
                if (symbol.includes('_')) {
                    const parts = symbol.split('_');
                    btn.innerHTML = `${parts[0]}<sub>${parts[1]}</sub>`;
                } else {
                    btn.textContent = symbol;
                }

                btn.onclick = () => {
                    const targetInput = document.getElementById(inputId);
                    if (targetInput.getAttribute('contenteditable') === 'false') return;

                    if (symbol.includes('_')) {
                        const parts = symbol.split('_');
                        targetInput.innerHTML = `${parts[0]}<sub>${parts[1]}</sub>`;
                    } else {
                        targetInput.innerHTML = symbol;
                    }
                    placeCaretAtEnd(targetInput);
                };
                container.appendChild(btn);
            }
        });
    };
    renderButtons('symbol-helper-b-storhet', 'input-b-storhet', 'bStorhet');
    renderButtons('symbol-helper-b-enhet', 'input-b-enhet', 'bEnhet');
}

// --- SPEL-LOGIK ---

function initGame() {
    const availableFormulas = formulaData.filter(f => f.level <= userLevel);
    const remaining = availableFormulas.filter(f => !completedInLevel.includes(f.storhet));

    document.getElementById('current-level-display').innerHTML = `Nivå: <b>${userLevel}</b>`;
    document.getElementById('progress-display').innerHTML = `Framsteg: <b>${completedInLevel.length}/${availableFormulas.length}</b>`;

    if (remaining.length === 0) {
        const nextLevelExist = formulaData.some(f => f.level === userLevel + 1);
        if (nextLevelExist) {
            alert(`Nivå ${userLevel} klar! För att nå nivå ${userLevel + 1} måste du nu lösa både gamla och nya storheter igen.`);
            userLevel++;
            completedInLevel = []; // Nollställ framsteg för kumulativ utmaning
            saveProgress();
            return initGame();
        }
    }

    const pool = remaining.length > 0 ? remaining : availableFormulas;
    currentFormula = pool[Math.floor(Math.random() * pool.length)];
    clueIndex = Math.floor(Math.random() * 4);

    inputs.forEach((input, index) => {
        input.innerHTML = ""; 
        if (input.tagName === "INPUT") input.value = ""; 
        input.style.backgroundColor = "white";
        input.style.borderColor = "#ddd";

        if (index === clueIndex) {
            let val = currentFormula[keys[index]];
            if (input.tagName === "INPUT") {
                input.value = val;
                input.disabled = true;
            } else {
                input.setAttribute('contenteditable', 'false');
                if (typeof val === 'string' && val.includes('_')) {
                    const p = val.split('_');
                    input.innerHTML = `${p[0]}<sub>${p[1]}</sub>`;
                } else {
                    input.innerHTML = val;
                }
            }
            input.style.backgroundColor = "#e9ecef";
        } else {
            if (input.tagName === "INPUT") input.disabled = false;
            else input.setAttribute('contenteditable', 'true');
        }
    });

    updateSymbolHelpers();
    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('check-btn').classList.remove('hidden');
    document.getElementById('skip-btn').classList.remove('hidden');
    document.getElementById('next-btn').classList.add('hidden');
}

// --- LISTENERS ---

document.querySelectorAll('.editable-input').forEach(div => {
    div.addEventListener('mousedown', function() {
        setTimeout(() => placeCaretAtEnd(this), 1);
    });
    div.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && this.innerText.length <= 1) {
            this.innerHTML = "";
        }
    });
});

document.getElementById('check-btn').addEventListener('click', () => {
    let allCorrect = true;
    inputs.forEach((input, index) => {
        if (index !== clueIndex) {
            const userRaw = (input.tagName === "INPUT" ? input.value : input.innerText).trim();
            const correctVal = currentFormula[keys[index]];
            const userAns = normalize(userRaw, (index === 1 || index === 3));
            const correctAns = normalize(correctVal, (index === 1 || index === 3)).replace('_', '');

            if (userAns === correctAns || (userAns === "" && correctVal === "-")) {
                input.style.backgroundColor = "#f0fff4";
            } else {
                input.style.backgroundColor = "#fff5f5";
                allCorrect = false;
            }
        }
    });

    if (allCorrect) {
        if (!completedInLevel.includes(currentFormula.storhet)) {
            completedInLevel.push(currentFormula.storhet);
            saveProgress();
        }
        document.getElementById('feedback').textContent = "Helt rätt!";
        document.getElementById('feedback').className = "feedback correct";
        document.getElementById('feedback').classList.remove('hidden');
        document.getElementById('check-btn').classList.add('hidden');
        document.getElementById('skip-btn').classList.add('hidden');
        document.getElementById('next-btn').classList.remove('hidden');
    } else {
        document.getElementById('feedback').textContent = "Fel, titta noga!";
        document.getElementById('feedback').className = "feedback wrong";
        document.getElementById('feedback').classList.remove('hidden');
    }
});

document.getElementById('skip-btn').addEventListener('click', () => {
    inputs.forEach((input, index) => {
        if (index !== clueIndex) {
            let val = currentFormula[keys[index]];
            if (input.tagName === "INPUT") { input.value = val; input.disabled = true; }
            else {
                input.setAttribute('contenteditable', 'false');
                if (typeof val === 'string' && val.includes('_')) {
                    const p = val.split('_'); input.innerHTML = `${p[0]}<sub>${p[1]}</sub>`;
                } else { input.innerHTML = val; }
            }
            input.style.backgroundColor = "#fff3cd"; 
        }
    });
    document.getElementById('check-btn').classList.add('hidden');
    document.getElementById('skip-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
});

document.getElementById('next-btn').addEventListener('click', initGame);
document.getElementById('reset-progress').addEventListener('click', () => {
    if(confirm("Börja om från Nivå 1?")) { localStorage.clear(); location.reload(); }
});

function saveProgress() {
    localStorage.setItem('formulaLevel', userLevel);
    localStorage.setItem('completedFormulas', JSON.stringify(completedInLevel));
}

initGame();