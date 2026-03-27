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
    // Gör om specialtecken till siffror för säkrare jämförelse (m³ -> m3)
    processed = processed.replace(/²/g, '2').replace(/³/g, '3');
    if (!isSymbol) return processed.toLowerCase().replace(/\s/g, '');
    return processed.replace(/\s/g, '');
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
    const closeBtn = document.getElementById('modal-close-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');

    if (type === 'level-up') {
        icon.textContent = "🏆";
        title.textContent = "Nivå avklarad!";
        text.textContent = `Snyggt jobbat! Du har nu låst upp nivå ${userLevel}. Nu blandar vi gamla och nya utmaningar.`;
        closeBtn.textContent = "Fortsätt";
        confirmBtn.classList.add('hidden');
    } else if (type === 'reset') {
        icon.textContent = "⚠️";
        title.textContent = "Nollställ framsteg?";
        text.textContent = "Vill du verkligen börja om från början? All din historik försvinner.";
        closeBtn.textContent = "Avbryt";
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
            // Skapa knappar för nedsänkt text, potenser eller grekiska tecken
            if (/[_²³]/.test(symbol) || /[^\x00-\x7F]/.test(symbol)) {
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
    clueIndex = Math.floor(Math.random() * 4);

    inputs.forEach((input, index) => {
        input.classList.remove('field-correct', 'field-wrong', 'field-skipped');
        input.innerHTML = ""; 
        if (input.tagName === "INPUT") input.value = "";
        
        if (index === clueIndex) {
            // Sätt in ledtråden och markera den som grön direkt
            let val = currentFormula[keys[index]];
            input.setAttribute('contenteditable', 'false');
            if (input.tagName === "INPUT") { 
                input.value = val; 
                input.disabled = true; 
            } else { 
                input.innerHTML = val.includes('_') ? `${val.split('_')[0]}<sub>${val.split('_')[1]}</sub>` : val; 
            }
            input.classList.add('field-correct');
        } else {
            input.setAttribute('contenteditable', 'true');
            if (input.tagName === "INPUT") input.disabled = false;
            input.style.backgroundColor = "white";
        }
    });

    updateSymbolHelpers();
    document.getElementById('check-btn').classList.remove('hidden');
    document.getElementById('skip-btn').classList.remove('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.querySelectorAll('.clear-input-btn').forEach(b => b.classList.add('hidden'));
}

document.getElementById('check-btn').addEventListener('click', () => {
    let allCorrect = true;
    inputs.forEach((input, index) => {
        if (index !== clueIndex) {
            input.classList.remove('field-correct', 'field-wrong', 'field-skipped');
            
            const raw = (input.tagName === "INPUT" ? input.value : input.innerText).trim();
            const correctValue = currentFormula[keys[index]];
            
            // Smart kontroll: Jämför enheter (namn vs beteckning)
            let altValue = (index === 2) ? currentFormula['bEnhet'] : (index === 3) ? currentFormula['enhet'] : "";

            const userAns = normalize(raw, (index === 1 || index === 3));
            const correctAns = normalize(correctValue, true).replace('_','');
            const altAns = altValue ? normalize(altValue, true).replace('_','') : null;

            if (userAns === correctAns || (altAns && userAns === altAns) || (userAns === "" && correctValue === "-")) {
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
        document.getElementById('check-btn').classList.add('hidden');
        document.getElementById('skip-btn').classList.add('hidden');
        document.getElementById('next-btn').classList.remove('hidden');
        document.querySelectorAll('.clear-input-btn').forEach(b => b.classList.add('hidden'));
    }
});

document.getElementById('next-btn').addEventListener('click', initGame);

document.getElementById('skip-btn').addEventListener('click', () => {
    inputs.forEach((input, index) => {
        if (index !== clueIndex) {
            let val = currentFormula[keys[index]];
            if (input.tagName === "INPUT") {
                input.value = val;
            } else {
                input.innerHTML = val.includes('_') ? `${val.split('_')[0]}<sub>${val.split('_')[1]}</sub>` : val;
            }
            // Markera med gult för att visa att man hoppat över
            input.classList.remove('field-correct', 'field-wrong');
            input.classList.add('field-skipped');
        }
    });
    document.getElementById('check-btn').classList.add('hidden');
    document.getElementById('skip-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
    document.querySelectorAll('.clear-input-btn').forEach(b => b.classList.add('hidden'));
});

// Modal-lyssnare
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