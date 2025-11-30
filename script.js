// --- GLOBAL GAME STATE ---
const BOARD_SIZE = 6;
const MAX_VALUE = 9;

let board = [];
let turn = 'A'; // 'A' (Human) or 'B' (Bot)
let gameState = 'CHOOSE_NUMBERS'; // 'CHOOSE_NUMBERS', 'CHOOSE_OP', 'EXECUTE_ACTION', 'GAME_OVER'

let chosenNumbers = { num1: null, num2: null };
let calculatedResult = { value: null, action: null };
let activeScreen = 'start-screen';
let currentActor = 'A'; // Người có quyền thực hiện hành động (Luôn là người chọn số)

// --- UTILITY FUNCTIONS ---

function showScreen(screenId) {
    document.getElementById(activeScreen).classList.remove('active');
    document.getElementById(screenId).classList.add('active');
    activeScreen = screenId;
    
    if (screenId === 'game-screen') {
        initGame();
    }
}

function updateMessage(msg, isError = false) {
    const messageArea = document.getElementById('message-area');
    messageArea.textContent = msg;
    messageArea.style.color = isError ? '#e74c3c' : '#333';
}

// --- GAME CORE LOGIC ---

function initGame() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    
    // Khởi tạo board 6x6
    board = Array(BOARD_SIZE).fill(null).map(() => 
        Array(BOARD_SIZE).fill(null).map(() => ({ value: null, owner: null, lockedTurns: 0 }))
    );

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', () => handleCellClick(r, c)); // Sử dụng Event Listener
            boardElement.appendChild(cell);
        }
    }

    turn = 'A'; // Người chơi A đi trước
    currentActor = 'A';
    gameState = 'CHOOSE_NUMBERS';
    updateGameDisplay();
    handleTurnA_ChooseNumbers();
}

// --- RENDERING & DISPLAY ---

function updateGameDisplay() {
    // 1. Cập nhật thông báo lượt chơi
    const turnMessage = turn === 'A' ? 'NGƯỜI CHƠI (Bạn)' : 'BOT (Đối thủ)';
    let statusMessage = '';

    if (gameState === 'CHOOSE_NUMBERS' || gameState === 'CHOOSE_OP') {
        statusMessage = currentActor === 'A' ? `Lượt của BẠN (Chọn số)` : `Lượt của BOT (Chọn phép tính)`;
    } else if (gameState === 'EXECUTE_ACTION') {
        const actor = currentActor === 'A' ? 'Bạn' : 'BOT';
        statusMessage = `${actor}: Đang thực hiện hành động ${calculatedResult.action}. **Hãy click vào ô.**`;
    } else {
        statusMessage = 'Ván đấu kết thúc. Bấm "Kết Thúc Ván" để chơi lại.';
    }

    document.getElementById('current-turn').textContent = statusMessage;

    // 2. Cập nhật bàn cờ
    const cells = document.querySelectorAll('.cell');
    let cellIndex = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = cells[cellIndex];
            const cellData = board[r][c];

            cell.innerHTML = cellData.value !== null ? cellData.value : '';
            cell.className = 'cell';

            if (cellData.owner === 'A') {
                cell.classList.add('player-a');
            } else if (cellData.owner === 'B') {
                cell.classList.add('player-b');
            }
            if (cellData.lockedTurns > 0) {
                cell.classList.add('locked');
                cell.innerHTML = '🔒';
            }
            
            cellIndex++;
        }
    }
}

// --- TURN MANAGEMENT ---

function advanceTurn() {
    // 1. Giảm thời gian khóa ô
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c].lockedTurns > 0) {
                board[r][c].lockedTurns--;
                if (board[r][c].lockedTurns === 0) {
                    // Nếu hết thời gian khóa, reset ô (nếu nó đang bị khóa)
                    board[r][c].owner = null; 
                    board[r][c].value = null;
                }
            }
        }
    }

    // 2. Đảo vai
    turn = (turn === 'A') ? 'B' : 'A';
    currentActor = turn;
    gameState = 'CHOOSE_NUMBERS';

    // 3. Tiếp tục lượt chơi
    if (turn === 'A') {
        handleTurnA_ChooseNumbers();
    } else {
        setTimeout(botTurn_ChooseNumbers, 1000); 
    }

    updateGameDisplay();
    checkWinCondition();
}

// --- STAGE 1: HUMAN CHOOSES NUMBERS ---

function handleTurnA_ChooseNumbers() {
    document.getElementById('game-inputs').innerHTML = `
        <input type="number" id="num1" min="1" max="9" value="5" placeholder="Số 1 (1-9)">
        <input type="number" id="num2" min="1" max="9" value="3" placeholder="Số 2 (1-9)">
        <button id="submit-numbers-btn">Xác nhận số</button>
    `;
    updateMessage('Bạn: Chọn 2 số bí mật của bạn (1-9).');

    // Gán listener cho nút vừa được tạo ra
    document.getElementById('submit-numbers-btn').addEventListener('click', submitNumbers);
}

function submitNumbers() {
    const n1 = parseInt(document.getElementById('num1').value);
    const n2 = parseInt(document.getElementById('num2').value);

    if (n1 >= 1 && n1 <= 9 && n2 >= 1 && n2 <= 9) {
        chosenNumbers = { num1: n1, num2: n2 };
        
        // Chuyển sang lượt BOT chọn phép tính
        turn = 'B';
        gameState = 'CHOOSE_OP';
        updateGameDisplay();
        setTimeout(botTurn_ChooseOperation, 1000);
    } else {
        updateMessage('Lỗi: Vui lòng chọn số từ 1 đến 9.', true);
    }
}

// --- STAGE 2: BOT CHOOSES OPERATION (BOT'S TURN) ---

function botTurn_ChooseNumbers() {
    // BOT chọn số (đơn giản: chọn ngẫu nhiên)
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    chosenNumbers = { num1: n1, num2: n2 };
    
    updateMessage(`BOT: Đã chọn số ${n1} và ${n2}.`);
    
    // Chuyển sang lượt NGƯỜI CHƠI chọn phép tính
    turn = 'A';
    gameState = 'CHOOSE_OP';
    updateGameDisplay();
    handleTurnA_ChooseOperation();
}

function botTurn_ChooseOperation() {
    // BOT chọn phép tính (đơn giản: chọn ngẫu nhiên)
    const ops = ['+', '-', '*', '/'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    
    // 1. Tính toán kết quả
    calculateResultAndAction(op);
    
    updateMessage(`BOT đã chọn phép tính: ${op}. Kết quả là ${calculatedResult.value}.`);

    // 2. Chuyển sang lượt BOT thực hiện hành động
    gameState = 'EXECUTE_ACTION';
    document.getElementById('game-inputs').innerHTML = ''; // Xóa input cũ
    updateGameDisplay();
    setTimeout(botExecuteAction, 1500);
}

// --- STAGE 2: HUMAN CHOOSES OPERATION ---

function handleTurnA_ChooseOperation() {
    document.getElementById('game-inputs').innerHTML = `
        <p>BOT đã chọn: ${chosenNumbers.num1} và ${chosenNumbers.num2}</p>
        <select id="op">
            <option value="+">Cộng (+)</option>
            <option value="-">Trừ (-)</option>
            <option value="*">Nhân (*)</option>
            <option value="/">Chia (/)</option>
        </select>
        <button id="submit-op-btn">Xác nhận phép tính</button>
    `;
    updateMessage('Bạn: Chọn phép tính cho 2 số trên.');

    // Gán listener cho nút vừa được tạo ra
    document.getElementById('submit-op-btn').addEventListener('click', submitOperation);
}

function submitOperation() {
    const op = document.getElementById('op').value;
    calculateResultAndAction(op);

    updateMessage(`Kết quả: ${calculatedResult.value}. Hành động: ${calculatedResult.action}. **Chọn ô để thực hiện.**`);
    
    // Chuyển sang giai đoạn Thực hiện hành động
    gameState = 'EXECUTE_ACTION';
    document.getElementById('game-inputs').innerHTML = ''; // Xóa input cũ
    updateGameDisplay();
}

// --- RESULT CALCULATION & ACTION DETERMINATION ---

function calculateResultAndAction(op) {
    const { num1, num2 } = chosenNumbers;
    let resultValue;
    let actionType = 'PLACE'; // PLACE (Điền), ERASE (Xóa), UPGRADE (Cộng dồn), LOCK (Khóa)

    try {
        switch (op) {
            case '+': resultValue = num1 + num2; break;
            case '-': resultValue = num1 - num2; break;
            case '*': resultValue = num1 * num2; break;
            case '/': 
                if (num2 === 0) throw new Error("Chia cho 0");
                resultValue = num1 / num2;
                break;
            default: throw new Error("Phép tính không hợp lệ");
        }
    } catch (e) {
        updateMessage(`Lỗi tính toán: ${e.message}`, true);
        resultValue = 0;
    }

    if (Number.isInteger(resultValue)) {
        if (resultValue < 0) {
            actionType = 'ERASE';
            resultValue = Math.abs(resultValue); // Dùng giá trị tuyệt đối cho dễ hiển thị
        } else if (resultValue > MAX_VALUE) {
            actionType = 'LOCK';
        } else {
            actionType = 'PLACE';
        }
    } else {
        // Số thập phân
        actionType = 'UPGRADE';
        // Lấy phần thập phân
        const decimalPart = (resultValue - Math.floor(resultValue)).toFixed(2).substring(2);
        // Chọn chữ số đầu tiên làm giá trị cộng dồn
        resultValue = parseInt(decimalPart[0]); 
    }

    calculatedResult = { value: resultValue, action: actionType };
}

// --- STAGE 3: EXECUTE ACTION (CELL CLICK) ---

function handleCellClick(r, c) {
    if (gameState !== 'EXECUTE_ACTION' || currentActor !== 'A') {
        return; // Chỉ người chơi A (người chọn số) mới được thực hiện hành động
    }

    const { action, value } = calculatedResult;
    const cell = board[r][c];

    // Xử lý logic theo hành động
    if (action === 'PLACE') {
        if (cell.value === null && cell.lockedTurns === 0) {
            cell.value = value;
            cell.owner = currentActor;
            advanceTurn();
        } else {
            updateMessage('Ô này không hợp lệ (đã có số hoặc bị khóa). Vui lòng chọn ô trống.', true);
        }
    } else if (action === 'ERASE') {
        if (cell.owner === 'B') {
            cell.value = null;
            cell.owner = null;
            updateMessage(`Bạn: Đã xóa ô [${r},${c}] của BOT.`);
            advanceTurn();
        } else {
            updateMessage('Chỉ có thể xóa ô của đối thủ (BOT).', true);
        }
    } else if (action === 'UPGRADE') {
        if (cell.owner === 'A' && cell.value !== null) {
            const newValue = cell.value + value;
            if (newValue > MAX_VALUE) {
                // Áp dụng luật > 9: Chuyển hành động thành khóa ô
                calculatedResult.action = 'LOCK';
                updateMessage(`Giá trị mới (${newValue}) > 9. Hành động thay đổi thành KHÓA Ô. **Chọn ô trống để khóa.**`);
                updateGameDisplay();
            } else {
                cell.value = newValue;
                updateMessage(`Bạn: Đã cộng dồn ${value} vào ô [${r},${c}].`);
                advanceTurn();
            }
        } else {
            updateMessage('Chỉ có thể cộng dồn vào ô của mình.', true);
        }
    } else if (action === 'LOCK') {
        if (cell.value === null && cell.lockedTurns === 0) {
            cell.lockedTurns = 2; // Khóa 2 lượt
            updateMessage(`Bạn: Đã khóa ô [${r},${c}]. Nó sẽ mở lại sau 2 lượt.`);
            advanceTurn();
        } else {
            updateMessage('Chỉ có thể khóa ô trống chưa bị khóa.', true);
        }
    }
}

// --- BOT ACTION EXECUTION ---

function botExecuteAction() {
    const { action, value } = calculatedResult;
    let targetCell = null;
    let availableCells = [];

    // Tìm tất cả các ô hợp lệ
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = board[r][c];
            if (action === 'PLACE' && cell.value === null && cell.lockedTurns === 0) availableCells.push({ r, c });
            if (action === 'ERASE' && cell.owner === 'A') availableCells.push({ r, c }); 
            if (action === 'UPGRADE' && cell.owner === 'B' && cell.value !== null) availableCells.push({ r, c });
            if (action === 'LOCK' && cell.value === null && cell.lockedTurns === 0) availableCells.push({ r, c });
        }
    }

    if (availableCells.length > 0) {
        // BOT chọn ngẫu nhiên trong số các ô hợp lệ
        targetCell = availableCells[Math.floor(Math.random() * availableCells.length)];
        
        const { r, c } = targetCell;
        const cell = board[r][c];
        
        // Thực hiện hành động
        if (action === 'PLACE') {
            cell.value = value; cell.owner = 'B';
        } else if (action === 'ERASE') {
            cell.value = null; cell.owner = null;
        } else if (action === 'UPGRADE') {
            const newValue = cell.value + value;
            if (newValue > MAX_VALUE) {
                 // Bot cũng áp dụng luật khóa ô nếu UPGRADE thất bại
                cell.lockedTurns = 2;
                updateMessage(`BOT: Cộng dồn vượt quá 9, BOT đã khóa ô [${r},${c}].`);
                advanceTurn(); // Tiến lượt ngay sau khi khóa
                return;
            } else {
                cell.value = newValue;
            }
        }
        else if (action === 'LOCK') {
            cell.lockedTurns = 2;
        }

        updateMessage(`BOT đã thực hiện hành động ${action} tại ô [${r},${c}].`);
    } else {
        updateMessage(`BOT: Không tìm thấy ô hợp lệ cho hành động ${action}. BOT nhường lượt.`);
    }
    
    advanceTurn();
}

// --- WIN CONDITION CHECK ---

function checkWinCondition() {
    if (gameState === 'GAME_OVER') return true;

    const win = check2x2Consecutive();
    if (win) {
        updateMessage(`🎉🎉🎉 CHÚC MỪNG ${win === 'A' ? 'BẠN' : 'BOT'} ĐÃ TẠO ĐƯỢC MA TRẬN 2x2 LIÊN TIẾP VÀ CHIẾN THẮNG! 🎉🎉🎉`, false);
        gameState = 'GAME_OVER';
        document.getElementById('game-inputs').innerHTML = `<button id="new-game-btn" class="active">Ván mới</button>`;
        document.getElementById('new-game-btn').addEventListener('click', () => showScreen('start-screen'));
        return true;
    }

    // Kiểm tra bàn cờ kín (Luật Thắng Tính Tổng)
    const isFull = board.flat().every(cell => cell.value !== null || cell.lockedTurns > 0);
    if (isFull) {
        const scoreA = board.flat().filter(cell => cell.owner === 'A').reduce((sum, cell) => sum + cell.value, 0);
        const scoreB = board.flat().filter(cell => cell.owner === 'B').reduce((sum, cell) => sum + cell.value, 0);
        let winnerMsg = `Hòa! Điểm Bạn: ${scoreA}, Điểm BOT: ${scoreB}.`;
        if (scoreA > scoreB) winnerMsg = `🎉🎉🎉 CHÚC MỪNG BẠN THẮNG! (Tổng điểm ${scoreA} > ${scoreB}) 🎉🎉🎉`;
        else if (scoreB > scoreA) winnerMsg = `BOT THẮNG! (Tổng điểm ${scoreB} > ${scoreA})`;

        updateMessage(winnerMsg);
        gameState = 'GAME_OVER';
        document.getElementById('game-inputs').innerHTML = `<button id="new-game-btn" class="active">Ván mới</button>`;
        document.getElementById('new-game-btn').addEventListener('click', () => showScreen('start-screen'));
        return true;
    }
    return false;
}

function check2x2Consecutive() {
    for (let r = 0; r <= BOARD_SIZE - 2; r++) {
        for (let c = 0; c <= BOARD_SIZE - 2; c++) {
            const cells = [
                board[r][c], board[r][c + 1],
                board[r + 1][c], board[r + 1][c + 1]
            ];
            
            const owner = cells[0].owner;
            if (owner !== null && cells.every(cell => cell.owner === owner && cell.value !== null)) {
                const values = cells.map(cell => cell.value).sort((a, b) => a - b);
                
                // Kiểm tra 4 số liên tiếp
                if (values[3] === values[0] + 3 && 
                    values[1] === values[0] + 1 && 
                    values[2] === values[0] + 2) {
                    return owner; 
                }
            }
        }
    }
    return null; 
}

// --- INITIALIZATION ---

function addEventListeners() {
    // 1. Nút màn hình Start
    document.getElementById('play-bot-btn').addEventListener('click', () => {
        showScreen('game-screen');
    });

    document.getElementById('guide-btn').addEventListener('click', () => {
        showScreen('guide-screen');
    });

    // 2. Nút màn hình Guide
    document.getElementById('back-to-start-guide-btn').addEventListener('click', () => {
        showScreen('start-screen');
    });

    // 3. Nút màn hình Game
    document.getElementById('end-game-btn').addEventListener('click', () => {
        showScreen('start-screen');
    });
    
    // Gán Event Listeners cho các nút tĩnh
}

document.addEventListener('DOMContentLoaded', () => {
    // Chèn luật chơi
    document.getElementById('guide-screen').querySelector('.rules').innerHTML = `
        <p><strong>Bàn cờ:</strong> 6x6. 2 người chơi (Bạn vs BOT).</p>
        <p><strong>Mục tiêu:</strong> Tạo ma trận 2x2 gồm 4 số liên tiếp nhau (Ví dụ: 4, 5, 6, 7).</p>
        <p><strong>Luật Lượt Chơi:</strong> Người chọn số (A) -> Người chọn phép tính (B) -> Người chọn số (A) thực hiện hành động.</p>
        
        <h3>Quy Tắc Hành Động (Người chọn số quyết định vị trí):</h3>
        <ul>
            <li><strong>Số Nguyên (1-9):</strong> Điền số vào ô trống.</li>
            <li><strong>Số Âm:</strong> Xóa ô của đối thủ.</li>
            <li><strong>Số Thập Phân:</strong> Chọn 1 chữ số thập phân, cộng dồn vào ô của mình.</li>
            <li><strong>Kết quả > 9:</strong> KHÔNG điền/cộng dồn. Thay vào đó, Khóa (Lock) 1 ô trống. Ô khóa mở sau 2 lượt.</li>
        </ul>
        <p><strong>Thắng Tính Tổng:</strong> Nếu bàn cờ kín, người có tổng điểm số đã điền cao hơn sẽ thắng.</p>
    `;
    
    addEventListeners(); 
    showScreen('start-screen');
});

