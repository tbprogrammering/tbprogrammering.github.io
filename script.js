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

function normalize(text, isSymbol = false) {
    if (!text) return "";
    let processed = String(text).trim();
    processed = processed.replace(/²/g, '2').replace(/³/g, '3');
    if (!isSymbol) {
        return processed.toLowerCase().replace(/\s/g, '');
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

// Rensa-knappar logik
document.querySelectorAll('.clear-input-btn').forEach(btn => {
    const target = document.getElementById(btn.getAttribute('data-target'));
    target.addEventListener('input', () => {
        if (target.innerText.trim().length > 0) btn.classList.remove('hidden');
        else { target.innerHTML = ""; btn.classList.add('hidden'); }
    });
    btn.addEventListener('click', () => {
        target.innerHTML = ""; target.focus(); btn.classList.add('hidden');
    });
});

function updateSymbolHelpers() {
    const renderButtons = (containerId, inputId, key) => {
        const container = document.getElementById(containerId);
        container.innerHTML = "";
        const symbols = [...new Set(formulaData.map(f => f[key]))];
        symbols.forEach(symbol => {
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

function initGame() {
    const available = formulaData.filter(f => f.level <= userLevel);
    const remaining = available.filter(f => !completedInLevel.includes(f.storhet));

    document.getElementById('current-level-display').innerHTML = `Nivå <b>${userLevel}</b>`;
    document.getElementById('progress-display').innerHTML = `Framsteg: <b>${completedInLevel.length}/${available.length}</b>`;

    if (remaining.length === 0 && available.length > 0) {
        const nextExist = formulaData.some(f => f.level === userLevel + 1);
        if (nextExist) {
            alert(`Nivå ${userLevel} klar! Repetitionsläge.`);
            userLevel++;
            completedInLevel = [];
            saveProgress();
            return initGame();
        }
    }

    currentFormula = remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : available[Math.floor(Math.random() * available.length)];
    clueIndex = Math.floor(Math.random() * 4);

    inputs.forEach((input, index) => {
        input.classList.remove('field-correct', 'field-wrong');
        input.innerHTML = ""; if (input.tagName === "INPUT") input.value = "";
        
        if (index === clueIndex) {
            let val = currentFormula[keys[index]];
            input.setAttribute('contenteditable', 'false');
            if (input.tagName === "INPUT") { input.value = val; input.disabled = true; }
            else { input.innerHTML = val.includes('_') ? `${val.split('_')[0]}<sub>${val.split('_')[1]}</sub>` : val; }
            input.style.backgroundColor = "#f1f5f9";
        } else {
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
        if (index !== clueIndex) {
            // Rensa gamla färger vid nytt försök
            input.classList.remove('field-correct', 'field-wrong');

            const raw = (input.tagName === "INPUT" ? input.value : input.innerText).trim();
            const correctValue = currentFormula[keys[index]];
            
            let altValue = "";
            if (index === 2) altValue = currentFormula['bEnhet']; 
            if (index === 3) altValue = currentFormula['enhet'];  

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
        document.getElementById('feedback').textContent = "Snyggt!";
        document.getElementById('feedback').className = "feedback correct";
        document.getElementById('feedback').classList.remove('hidden');
        document.getElementById('check-btn').classList.add('hidden');
        document.getElementById('skip-btn').classList.add('hidden'); // Döljer Hoppa över
        document.getElementById('next-btn').classList.remove('hidden');
        document.querySelectorAll('.clear-input-btn').forEach(b => b.classList.add('hidden'));
    } else {
        document.getElementById('feedback').textContent = "Försök igen!";
        document.getElementById('feedback').className = "feedback wrong";
        document.getElementById('feedback').classList.remove('hidden');
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
            input.style.backgroundColor = "#fef3c7";
            input.classList.remove('field-correct', 'field-wrong');
        }
    });
    document.getElementById('check-btn').classList.add('hidden');
    document.getElementById('skip-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
    document.querySelectorAll('.clear-input-btn').forEach(b => b.classList.add('hidden'));
});

document.getElementById('reset-progress').addEventListener('click', () => {
    if(confirm("Börja om?")) { localStorage.clear(); location.reload(); }
});

function saveProgress() {
    localStorage.setItem('formulaLevel', userLevel);
    localStorage.setItem('completedFormulas', JSON.stringify(completedInLevel));
}

initGame();