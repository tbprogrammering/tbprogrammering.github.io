// --- STATE ---
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

function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection !== "undefined") {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

// --- LOGIK FÖR RENSA-KNAPPAR ---
document.querySelectorAll('.clear-input-btn').forEach(btn => {
    const targetId = btn.getAttribute('data-target');
    const targetEl = document.getElementById(targetId);

    // Visa/Dölj kryss vid ändring
    targetEl.addEventListener('input', () => {
        if (targetEl.innerText.trim().length > 0) btn.classList.remove('hidden');
        else { targetEl.innerHTML = ""; btn.classList.add('hidden'); }
    });

    // Rensa vid klick
    btn.addEventListener('click', () => {
        targetEl.innerHTML = "";
        targetEl.focus();
        btn.classList.add('hidden');
    });
});

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
                    const p = symbol.split('_');
                    btn.innerHTML = `${p[0]}<sub>${p[1]}</sub>`;
                } else { btn.textContent = symbol; }

                btn.onclick = () => {
                    const target = document.getElementById(inputId);
                    if (target.getAttribute('contenteditable') === 'false') return;
                    
                    if (symbol.includes('_')) {
                        const p = symbol.split('_');
                        target.innerHTML = `${p[0]}<sub>${p[1]}</sub>`;
                    } else { target.innerHTML = symbol; }
                    
                    // Visa krysset eftersom rutan nu har text
                    const clearBtn = document.querySelector(`[data-target="${inputId}"]`);
                    if (clearBtn) clearBtn.classList.remove('hidden');
                    
                    placeCaretAtEnd(target);
                };
                container.appendChild(btn);
            }
        });
    };
    renderButtons('symbol-helper-b-storhet', 'input-b-storhet', 'bStorhet');
    renderButtons('symbol-helper-b-enhet', 'input-b-enhet', 'bEnhet');
}

function initGame() {
    const available = formulaData.filter(f => f.level <= userLevel);
    const remaining = available.filter(f => !completedInLevel.includes(f.storhet));

    document.getElementById('current-level-display').innerHTML = `Nivå: <b>${userLevel}</b>`;
    document.getElementById('progress-display').innerHTML = `Framsteg: <b>${completedInLevel.length}/${available.length}</b>`;

    if (remaining.length === 0 && available.length > 0) {
        const nextExist = formulaData.some(f => f.level === userLevel + 1);
        if (nextExist) {
            alert(`Nivå ${userLevel} klar! Nu testar vi både gamla och nya.`);
            userLevel++;
            completedInLevel = [];
            saveProgress();
            return initGame();
        }
    }

    currentFormula = remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : available[Math.floor(Math.random() * available.length)];
    clueIndex = Math.floor(Math.random() * 4);

    inputs.forEach((input, index) => {
        input.innerHTML = ""; if (input.tagName === "INPUT") input.value = "";
        input.style.backgroundColor = "white";
        
        // Dölj alla kryss i starten
        const clearBtn = document.querySelector(`[data-target="${input.id}"]`);
        if (clearBtn) clearBtn.classList.add('hidden');

        if (index === clueIndex) {
            let val = currentFormula[keys[index]];
            if (input.tagName === "INPUT") { input.value = val; input.disabled = true; }
            else {
                input.setAttribute('contenteditable', 'false');
                if (typeof val === 'string' && val.includes('_')) {
                    const p = val.split('_'); input.innerHTML = `${p[0]}<sub>${p[1]}</sub>`;
                } else { input.innerHTML = val; }
            }
            input.style.backgroundColor = "#f1f5f9";
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

// --- EVENTS ---
document.getElementById('check-btn').addEventListener('click', () => {
    let allCorrect = true;
    inputs.forEach((input, index) => {
        if (index !== clueIndex) {
            const raw = (input.tagName === "INPUT" ? input.value : input.innerText).trim();
            const correct = currentFormula[keys[index]];
            const isSym = (index === 1 || index === 3);
            if (normalize(raw, isSym) !== normalize(correct, isSym).replace('_','')) allCorrect = false;
        }
    });

    const f = document.getElementById('feedback');
    f.classList.remove('hidden');
    if (allCorrect) {
        if (!completedInLevel.includes(currentFormula.storhet)) completedInLevel.push(currentFormula.storhet);
        saveProgress();
        f.textContent = "Snyggt!"; f.className = "feedback correct";
        document.getElementById('check-btn').classList.add('hidden');
        document.getElementById('skip-btn').classList.add('hidden');
        document.getElementById('next-btn').classList.remove('hidden');
    } else {
        f.textContent = "Försök igen!"; f.className = "feedback wrong";
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
            input.style.backgroundColor = "#fef3c7";
        }
    });
    document.getElementById('check-btn').classList.add('hidden');
    document.getElementById('skip-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
});

document.getElementById('next-btn').addEventListener('click', initGame);
document.getElementById('reset-progress').addEventListener('click', () => {
    if(confirm("Börja om?")) { localStorage.clear(); location.reload(); }
});

function saveProgress() {
    localStorage.setItem('formulaLevel', userLevel);
    localStorage.setItem('completedFormulas', JSON.stringify(completedInLevel));
}

initGame();