/* =================================================================
   FILE LOGIC: HỆ THỐNG VÍ ĐỘNG (DYNAMIC WALLET SYSTEM)
   ================================================================= */

// --- 1. KHỞI TẠO DỮ LIỆU ---
// Cấu trúc mới: appData chứa tổng ngân sách và mảng các ví con
let appData = JSON.parse(localStorage.getItem('app_data_v4')) || {
    totalBudget: 0,
    wallets: [
        // Dữ liệu mẫu ban đầu (Bạn có thể xóa trong app sau này)
        { id: 1, name: "Skincare", alloc: 0, spent: 0, lastInput: 0, note: "" },
        { id: 2, name: "Sức khỏe", alloc: 0, spent: 0, lastInput: 0, note: "" },
        { id: 3, name: "Tiêu dùng", alloc: 0, spent: 0, lastInput: 0, note: "" },
        { id: 4, name: "Cần thiết", alloc: 0, spent: 0, lastInput: 0, note: "" }
    ]
};

let mName = localStorage.getItem('mName_v3') || "Tháng hiện tại";
let theme = localStorage.getItem('theme_v3') || 'light';

// Hàm tiện ích
const fmt = (n) => n.toLocaleString('vi-VN');
const saveDB = () => localStorage.setItem('app_data_v4', JSON.stringify(appData));

// --- 2. LOGIC GIAO DIỆN CHUNG ---
document.body.setAttribute('data-theme', theme);
document.getElementById('month-name-inp').value = mName;
document.getElementById('display-month-title').innerText = mName;

function tab(id) {
    document.querySelectorAll('.screen').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
    
    const navMap = ['daily', 'budget', 'status', 'history', 'alloc', 'settings'];
    const idx = navMap.indexOf(id);
    if(document.querySelectorAll('.nav-item')[idx]) {
        document.querySelectorAll('.nav-item')[idx].classList.add('active');
    }

    // Render lại dữ liệu mới nhất mỗi khi chuyển tab
    if(id === 'daily') renderDailyInputs();
    if(id === 'budget') renderBudgetLogic();
    if(id === 'status') renderStatusLogic(); 
    if(id === 'history') renderHistory();
    if(id === 'alloc') renderAllocInputs();
    
    window.scrollTo(0,0);
}

function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme_v3', theme);
    document.body.setAttribute('data-theme', theme);
}

// --- 3. LOGIC PHÂN BỔ (GỐC RỄ) ---

// Vẽ danh sách ví ở màn hình Phân bổ
function renderAllocInputs() {
    document.getElementById('base-total-budget').value = appData.totalBudget || '';
    
    const container = document.getElementById('alloc-wallets-container');
    container.innerHTML = ''; // Xóa cũ vẽ mới

    appData.wallets.forEach((w, index) => {
        const div = document.createElement('div');
        div.className = 'input-group';
        div.innerHTML = `
            <div style="display:flex; align-items:center; width:100%;">
                <button class="btn-icon-del" onclick="deleteWallet(${index})">🗑️</button>
                <span style="flex:1; margin-left:10px; font-weight:500;">${w.name}</span>
            </div>
            <div class="k-input-wrapper">
                <input type="number" value="${w.alloc || ''}" onchange="updateWalletAlloc(${index}, this.value)" placeholder="0">
            </div>
        `;
        container.appendChild(div);
    });
    previewSaving();
}

// Thêm ví mới
function addNewWallet() {
    const name = prompt("Nhập tên ví mới (Ví dụ: Trà sữa):");
    if (name) {
        appData.wallets.push({
            id: Date.now(), // ID duy nhất
            name: name,
            alloc: 0,
            spent: 0,
            lastInput: 0,
            note: ""
        });
        saveDB();
        renderAllocInputs();
    }
}

// Xóa ví
function deleteWallet(index) {
    const w = appData.wallets[index];
    if(confirm(`CẢNH BÁO: Bạn có chắc muốn xóa ví "${w.name}"?\nToàn bộ dữ liệu nhập liệu và biến động của ví này sẽ mất vĩnh viễn!`)) {
        appData.wallets.splice(index, 1);
        saveDB();
        renderAllocInputs();
    }
}

// Cập nhật ngân sách cho từng ví
function updateWalletAlloc(index, val) {
    appData.wallets[index].alloc = Number(val);
    previewSaving(); // Tính toán lại số dư dự kiến ngay lập tức
}

// Lưu tổng ngân sách gốc
function updateBaseTotal(val) {
    appData.totalBudget = Number(val);
    previewSaving();
}

// Tính toán Tiết kiệm dự tính (Real-time)
function previewSaving() {
    const total = appData.totalBudget || 0;
    const allocated = appData.wallets.reduce((sum, w) => sum + (w.alloc || 0), 0);
    document.getElementById('preview-saving-calc').innerText = (total - allocated).toLocaleString('vi-VN') + " K";
}

// Nút Lưu Cấu Hình
function saveAllocConfig() {
    saveDB();
    alert("Đã cập nhật cấu trúc Ví & Ngân sách!");
    tab('daily'); // Chuyển về màn hình nhập liệu
}

// --- 4. LOGIC NHẬP LIỆU (DAILY INPUT) ---

function renderDailyInputs() {
    const container = document.getElementById('daily-wallets-list');
    container.innerHTML = '';

    if(appData.wallets.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">Chưa có ví nào. Hãy sang mục Phân bổ để tạo.</p>';
        return;
    }

    appData.wallets.forEach((w, index) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <div class="group-title">${w.name}</div>
            
            <div style="display:flex; gap:5px; margin-bottom:10px;">
                <input type="number" id="inp-${w.id}" placeholder="Nhập số thêm..." style="flex:1;">
                <button class="btn-mini btn-save" onclick="saveTransaction(${index})">Lưu</button>
                <button class="btn-mini btn-undo" onclick="undoTransaction(${index})">Xóa</button>
            </div>

            <input type="text" id="note-${w.id}" value="${w.note}" onchange="updateNote(${index}, this.value)" 
                   placeholder="Ghi chú cho mục này..." style="font-size:14px; color:#666; font-style:italic; margin-bottom:10px; text-align:left;">

            <div class="total-row">
                Đã dùng: <span id="display-${w.id}">${fmt(w.spent * 1000)}</span>
            </div>
        `;
        container.appendChild(div);
    });
}

function saveTransaction(index) {
    const w = appData.wallets[index];
    const inputEl = document.getElementById(`inp-${w.id}`);
    const val = Number(inputEl.value);

    if (val > 0) {
        w.spent += val;      // Cộng dồn
        w.lastInput = val;   // Lưu lịch sử tạm để Undo
        
        saveDB();
        
        // Cập nhật giao diện ngay lập tức
        inputEl.value = '';
        document.getElementById(`display-${w.id}`).innerText = fmt(w.spent * 1000);
    }
}

function undoTransaction(index) {
    const w = appData.wallets[index];
    if (w.lastInput > 0) {
        if(confirm(`Hoàn tác lệnh vừa nhập: trừ lại ${w.lastInput}K?`)) {
            w.spent -= w.lastInput;
            w.lastInput = 0; // Chỉ cho Undo 1 lần gần nhất
            saveDB();
            document.getElementById(`display-${w.id}`).innerText = fmt(w.spent * 1000);
        }
    } else {
        alert("Không có lệnh nhập mới nào để xóa!");
    }
}

function updateNote(index, val) {
    appData.wallets[index].note = val;
    saveDB();
}

// --- 5. LOGIC BIẾN ĐỘNG & TÌNH HÌNH ---

function renderBudgetLogic() {
    // Tính toán lại
    const totalBudget = appData.totalBudget * 1000;
    const allocated = appData.wallets.reduce((sum, w) => sum + (w.alloc || 0), 0) * 1000;
    const totalSpent = appData.wallets.reduce((sum, w) => sum + (w.spent || 0), 0) * 1000;
    
    // 1. Hiển thị Tiết kiệm dự tính
    const staticSaving = totalBudget - allocated;
    document.getElementById('static-saving-display').innerText = fmt(staticSaving) + " VNĐ";

    // 2. Hiển thị chi tiết từng ví
    const container = document.getElementById('budget-details');
    let html = '';
    
    appData.wallets.forEach(w => {
        const wAlloc = (w.alloc || 0) * 1000;
        const wSpent = (w.spent || 0) * 1000;
        const remain = wAlloc - wSpent;
        const isNeg = remain < 0;
        
        html += `<div class="budget-row">
                    <span>${w.name}</span>
                    <span class="budget-val ${isNeg ? 'text-red' : 'text-green'}">${fmt(remain)}</span>
                 </div>`;
    });
    container.innerHTML = html;

    // 3. Hiển thị Số dư thực tế
    const actualBalance = totalBudget - totalSpent;
    const balEl = document.getElementById('actual-balance-display');
    const balBox = document.getElementById('balance-box-ui');
