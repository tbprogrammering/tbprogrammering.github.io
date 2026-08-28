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

// Central lista för godkända synonymer per fälttyp
const synonyms = [
    ["kilogram/kubikmeter", "kilogram per kubikmeter"],
    ["meter/sekund", "meter per sekund"],
    ["meter/sekundkvadrat", "meter per sekundkvadrat"],
    ["kilogrammeter/sekund", "kilogrammeter per sekund"],
    ["joule/kilogram", "joule per kilogram"],
    ["kraftmoment", "vridmoment"],
    ["n/c = v/m", "n/c", "v/m", "newton/coulomb", "volt/meter"]
];

// --- HJÄLPFUNKTIONER ---

function normalize(text, isSymbol = false) {
    if (!text) return "";
    let processed = String(text).trim();
    processed = processed.replace(/²/g, '2').replace(/³/g, '3');
    
    processed = processed.replace(/_/g, '');
    
    // FIXEN: Om det är en symbol/beteckning gör vi den INTE till lowercase.
    // Detta sparar skillnaden på stort V och litet v.
    if (!isSymbol) {
        return processed.toLowerCase().replace(/\s/g, '');
    } else {
        return processed.replace(/\s/g, ''); // Behåller skiftläge för symboler
    }
}

function isSynonym(userStr, correctStr, isSymbol = false) {
    const u = normalize(userStr, isSymbol);
    const c = normalize(correctStr, isSymbol);
    if (u === c) return true;

    // Synonymer gäller bara för ord, inte för enstaka beteckningar
    if (!isSymbol) {
        for (const group of synonyms) {
            const normalizedGroup = group.map(s => normalize(s, false));
            if (normalizedGroup.includes(u) && normalizedGroup.includes(c)) {
                return true;
            }
        }
    }
    return false;
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

function openModal(type) {
    const modal = document.getElementById('level-modal');
    const title = document.getElementById('modal-title');
    const text = document.getElementById('modal-text');
    const icon = document.getElementById('modal-icon');
    const confirmBtn = document.getElementById('modal-confirm-btn');

    if (type === 'level-up') {
        icon.textContent = "🏆";
        title.textContent = "Nivå avklarad!";
        text.textContent = `Snyggt jobbat! Du har nu låst upp nivå ${userLevel}. Nu blandar vi gamla och nya utmaningar.`;
        confirmBtn.classList.add('hidden');
    } else if (type === 'reset') {
        icon.textContent = "⚠️";
        title.textContent = "Nollställ framsteg?";
        text.textContent = "Vill du verkligen börja om? All din historik verförsvinner.";
        confirmBtn.classList.remove('hidden');
    }
    modal.classList.remove('hidden');
}

// --- RENSA-LOGIK ---

document.querySelectorAll('.clear-input-btn').forEach(btn => {
    const target = document.getElementById(btn.getAttribute('data-target'));
    target.addEventListener('input', () => {
        if (target.innerText.trim().length > 0) btn.classList.remove('hidden');
        else { target.innerHTML = ""; btn.classList.add('hidden'); }
    });
    btn.addEventListener('click', () => {
        target.innerHTML = ""; target.focus(); btn.classList.add('hidden');
        target.classList.remove('field-correct', 'field-wrong', 'field-skipped');
    });
});

function updateSymbolHelpers() {
    const renderButtons = (containerId, inputId, key) => {
        const container = document.getElementById(containerId);
        container.innerHTML = "";
        const symbols = [...new Set(formulaData.map(f => f[key]))];
        symbols.forEach(symbol => {
            if (/[_²³]/.test(symbol) || /[^\x00-\x7F]/.test(symbol)) {
                if (symbol === "-") return;
                const btn = document.createElement('button');
                btn.className = 'symbol-btn';
                btn.innerHTML = symbol.includes('_') ? `${symbol.split('_')[0]}<sub>${symbol.split('_')[1]}</sub>` : symbol;
                btn.onclick = () => {
                    const target = document.getElementById(inputId);
                    if (target.getAttribute('contenteditable') === 'false') return;
                    target.innerHTML = btn.innerHTML;
                    document.querySelector(`[data-target="${inputId}"]`).classList.remove('hidden');
                    placeCaretAtEnd(target);
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
    const available = formulaData.filter(f => f.level <= userLevel);
    const remaining = available.filter(f => !completedInLevel.includes(f.storhet));

    document.getElementById('current-level-display').innerHTML = `Nivå <b>${userLevel}</b>`;
    document.getElementById('progress-display').innerHTML = `Framsteg: <b>${completedInLevel.length}/${available.length}</b>`;

    if (remaining.length === 0 && available.length > 0) {
        const nextExist = formulaData.some(f => f.level === userLevel + 1);
        if (nextExist) {
            userLevel++;
            completedInLevel = [];
            saveProgress();
            openModal('level-up');
            return initGame();
        }
    }

    currentFormula = remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : available[Math.floor(Math.random() * available.length)];
    
    let validIndices = [];
    keys.forEach((key, idx) => {
        if (currentFormula[key] !== "-") {
            validIndices.push(idx);
        }
    });

    let selectedClue = validIndices[Math.floor(Math.random() * validIndices.length)];
    const clueValue = normalize(currentFormula[keys[selectedClue]], false); // Här kan vi använda false eftersom det bara är en intern koll
    
    const forbiddenClues = [
        "joule", "j", 
        "newton", "n", 
        "joule/kilogram", "j/kg", 
        "watt", "w", 
        "q", "p", "i", "m"
    ];

    if (forbiddenClues.includes(clueValue)) {
        selectedClue = 0;
    }
    
    clueIndex = selectedClue;

    inputs.forEach((input, index) => {
        input.classList.remove('field-correct', 'field-wrong', 'field-skipped');
        input.innerHTML = ""; 
        if (input.tagName === "INPUT") input.value = "";
        
        const correctValue = currentFormula[keys[index]];

        if (correctValue === "-") {
            input.setAttribute('contenteditable', 'false');
            if (input.tagName === "INPUT") {
                input.value = "-";
                input.disabled = true;
            } else {
                input.innerHTML = "-";
            }
            input.style.backgroundColor = "#f1f5f9";
            input.classList.add('field-correct');
        }
        else if (index === clueIndex) {
            input.setAttribute('contenteditable', 'false');
            if (input.tagName === "INPUT") { 
                input.value = correctValue; 
                input.disabled = true; 
            } else { 
                input.innerHTML = correctValue.includes('_') ? `${correctValue.split('_')[0]}<sub>${correctValue.split('_')[1]}</sub>` : correctValue; 
            }
            input.classList.add('field-correct');
            input.style.backgroundColor = "#f1f5f9";
        } 
        else {
            input.setAttribute('contenteditable', 'true');
            if (input.tagName === "INPUT") input.disabled = false;
            input.style.backgroundColor = "white";
        }
    });

    updateSymbolHelpers();
    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('check-btn').classList.remove('hidden');
    document.getElementById('skip-btn').classList.remove('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.querySelectorAll('.clear-input-btn').forEach(b => b.classList.add('hidden'));
}

document.getElementById('check-btn').addEventListener('click', () => {
    let allCorrect = true;
    inputs.forEach((input, index) => {
        const correctValue = currentFormula[keys[index]];
        if (index !== clueIndex && correctValue !== "-") {
            input.classList.remove('field-correct', 'field-wrong', 'field-skipped');
            
            const userRaw = (input.tagName === "INPUT" ? input.value : input.innerText).trim();
            let altValue = (index === 2) ? currentFormula['bEnhet'] : (index === 3) ? currentFormula['enhet'] : "";

            // Flagga för om det aktuella fältet är en beteckning/symbol (index 1 eller 3)
            const isSym = (index === 1 || index === 3);

            if (isSynonym(userRaw, correctValue, isSym) || (altValue && isSynonym(userRaw, altValue, isSym))) {
                input.classList.add('field-correct');
            } else {
                input.classList.add('field-wrong');
                allCorrect = false;
            }
        }
    });

    if (allCorrect) {
        if (!completedInLevel.includes(currentFormula.storhet)) completedInLevel.push(currentFormula.storhet);
        saveProgress();
        document.getElementById('feedback').textContent = "Snyggt!";
        document.getElementById('feedback').className = "feedback correct";
        document.getElementById('feedback').classList.remove('hidden');
        document.getElementById('check-btn').classList.add('hidden');
        document.getElementById('skip-btn').classList.add('hidden');
        document.getElementById('next-btn').classList.remove('hidden');
        document.querySelectorAll('.clear-input-btn').forEach(b => b.classList.add('hidden'));
    } else {
        document.getElementById('feedback').textContent = "Något är fel, kolla noga!";
        document.getElementById('feedback').className = "feedback wrong";
        document.getElementById('feedback').classList.remove('hidden');
    }
});

document.getElementById('next-btn').addEventListener('click', initGame);

document.getElementById('skip-btn').addEventListener('click', () => {
    inputs.forEach((input, index) => {
        const correctValue = currentFormula[keys[index]];
        if (index !== clueIndex && correctValue !== "-") {
            if (input.tagName === "INPUT") {
                input.value = correctValue;
            } else {
                input.innerHTML = correctValue.includes('_') ? `${correctValue.split('_')[0]}<sub>${correctValue.split('_')[1]}</sub>` : correctValue;
            }
            input.classList.remove('field-correct', 'field-wrong');
            input.classList.add('field-skipped');
        }
    });
    document.getElementById('check-btn').classList.add('hidden');
    document.getElementById('skip-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
});

document.getElementById('modal-close-btn').addEventListener('click', () => {
    document.getElementById('level-modal').classList.add('hidden');
});

document.getElementById('modal-confirm-btn').addEventListener('click', () => {
    localStorage.clear();
    location.reload();
});

document.getElementById('reset-progress').addEventListener('click', () => openModal('reset'));

function saveProgress() {
    localStorage.setItem('formulaLevel', userLevel);
    localStorage.setItem('completedFormulas', JSON.stringify(completedInLevel));
}

initGame();