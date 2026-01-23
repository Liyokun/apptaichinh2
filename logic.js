/* =================================================================
   FILE LOGIC: HỆ THỐNG VÍ ĐỘNG (DYNAMIC WALLET SYSTEM) - FIX FULL
   ================================================================= */

// --- 1. KHỞI TẠO DỮ LIỆU ---
// Cấu trúc mới: appData chứa tổng ngân sách và mảng các ví con
let appData = JSON.parse(localStorage.getItem('app_data_v4')) || {
    totalBudget: 0,
    wallets: [
        // Dữ liệu mẫu ban đầu
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
// Kiểm tra phần tử tồn tại trước khi gán để tránh lỗi
if(document.getElementById('month-name-inp')) document.getElementById('month-name-inp').value = mName;
if(document.getElementById('display-month-title')) document.getElementById('display-month-title').innerText = mName;

function tab(id) {
    document.querySelectorAll('.screen').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
    
    const screen = document.getElementById('screen-' + id);
    if(screen) screen.classList.add('active');
    
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
    const totalEl = document.getElementById('base-total-budget');
    if(totalEl) totalEl.value = appData.totalBudget || '';
    
    const container = document.getElementById('alloc-wallets-container');
    if(!container) return;
    
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
    previewSaving(); 
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
    const display = document.getElementById('preview-saving-calc');
    if(display) display.innerText = (total - allocated).toLocaleString('vi-VN') + " K";
}

// Nút Lưu Cấu Hình
function saveAllocConfig() {
    saveDB();
    alert("Đã cập nhật cấu trúc Ví & Ngân sách!");
    tab('daily'); 
}

// --- 4. LOGIC NHẬP LIỆU (DAILY INPUT) ---

function renderDailyInputs() {
    const container = document.getElementById('daily-wallets-list');
    if(!container) return;
    
    container.innerHTML = '';

    if(appData.wallets.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px;">Chưa có ví nào.<br>Hãy sang mục Phân bổ để tạo.</p>';
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
                   placeholder="Ghi chú cho mục này..." style="font-size:14px; color:#666; font-style:italic; margin-bottom:10px; text-align:left; width: 100%; box-sizing: border-box;">

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
        w.spent += val;      
        w.lastInput = val;   
        
        saveDB();
        
        inputEl.value = '';
        document.getElementById(`display-${w.id}`).innerText = fmt(w.spent * 1000);
    }
}

function undoTransaction(index) {
    const w = appData.wallets[index];
    if (w.lastInput > 0) {
        if(confirm(`Hoàn tác lệnh vừa nhập: trừ lại ${w.lastInput}K?`)) {
            w.spent -= w.lastInput;
            w.lastInput = 0; 
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
    const totalBudget = appData.totalBudget * 1000;
    const allocated = appData.wallets.reduce((sum, w) => sum + (w.alloc || 0), 0) * 1000;
    const totalSpent = appData.wallets.reduce((sum, w) => sum + (w.spent || 0), 0) * 1000;
    
    // 1. Hiển thị Tiết kiệm dự tính
    const staticSaving = totalBudget - allocated;
    const saveDisplay = document.getElementById('static-saving-display');
    if(saveDisplay) saveDisplay.innerText = fmt(staticSaving) + " VNĐ";

    // 2. Hiển thị chi tiết từng ví
    const container = document.getElementById('budget-details');
    if(container) {
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
    }

    // 3. Hiển thị Số dư thực tế
    const actualBalance = totalBudget - totalSpent;
    const balEl = document.getElementById('actual-balance-display');
    const balBox = document.getElementById('balance-box-ui');
    
    if(balEl && balBox) {
        balEl.innerText = fmt(actualBalance) + " VNĐ";
        if (actualBalance < 0) {
            balEl.className = 'balance-value text-red';
            balBox.className = 'balance-box border-red';
        } else {
            balEl.className = 'balance-value text-green';
            balBox.className = 'balance-box';
        }
    }
}

function renderStatusLogic() {
    const totalBudget = appData.totalBudget * 1000;
    const totalSpent = appData.wallets.reduce((sum, w) => sum + (w.spent || 0), 0) * 1000;
    const balance = totalBudget - totalSpent;

    let percent = 0;
    if (totalBudget > 0) percent = (balance / totalBudget) * 100;
    else percent = balance < 0 ? -1 : 0;

    const percentEl = document.getElementById('hologram-percent');
    if(percentEl) percentEl.innerText = percent.toFixed(1) + "%";
    
    let statusText = "Ổn định";
    if(percent >= 75) statusText = "Rất tốt (Sakura)";
    else if(percent >= 50) statusText = "Tốt (Summer)";
    else if(percent >= 25) statusText = "Cẩn thận (Fall)";
    else if(percent >= 0) statusText = "Nguy hiểm (Winter)";
    else statusText = "Vỡ nợ (Zero)";
    
    const statusTextEl = document.getElementById('hologram-status-text');
    if(statusTextEl) statusTextEl.innerText = statusText;
    
    if(typeof updateVisuals === "function") updateVisuals(percent);
}

// --- 6. LOGIC LỊCH SỬ & KẾT THÚC THÁNG ---

function endMonth() {
    if(!confirm("Xác nhận KẾT THÚC THÁNG?\n- Dữ liệu hiện tại sẽ được lưu vào Lịch sử.\n- Các số liệu đã chi sẽ được reset về 0.")) return;

    const totalSpent = appData.wallets.reduce((sum, w) => sum + (w.spent || 0), 0) * 1000;
    const totalBudget = appData.totalBudget * 1000;
    const finalBalance = totalBudget - totalSpent;

    // Snapshot: Chỉ lưu những ví đang tồn tại
    let snapshotData = appData.wallets.map(w => ({
        name: w.name,
        spent: w.spent * 1000,
        note: w.note
    }));

    const record = {
        id: Date.now(),
        name: mName,
        date: new Date().toLocaleDateString('vi-VN'),
        balance: finalBalance,
        details: snapshotData // Lưu mảng chi tiết
    };

    const hist = JSON.parse(localStorage.getItem('hist_v3')) || [];
    hist.unshift(record);
    localStorage.setItem('hist_v3', JSON.stringify(hist));

    // Reset dữ liệu cho tháng mới
    appData.wallets.forEach(w => {
        w.spent = 0;
        w.lastInput = 0;
        w.note = "";
    });
    saveDB();

    alert("Đã chốt sổ tháng cũ & Mở tháng mới!");
    tab('history');
}

function renderHistory() {
    const hist = JSON.parse(localStorage.getItem('hist_v3')) || [];
    const container = document.getElementById('history-list');
    
    if(!container) return;

    if(hist.length === 0) { 
        container.innerHTML = '<p style="text-align:center;color:#999;margin-top:30px;">Chưa có lịch sử</p>'; 
        return; 
    }

    container.innerHTML = hist.map(h => {
        let detailHtml = '';
        if (h.details && Array.isArray(h.details)) {
             detailHtml = h.details.map(d => `
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; border-bottom:1px dashed #eee; padding-bottom:5px;">
                    <div>
                        <div>${d.name}</div>
                        ${d.note ? `<i style="font-size:11px; color:#888;">"${d.note}"</i>` : ''}
                    </div>
                    <b>${fmt(d.spent)}</b>
                </div>
            `).join('');
        } else {
            // Hỗ trợ hiển thị lịch sử cũ (phiên bản v3) nếu có
            detailHtml = '<i style="font-size:12px; color:#999;">Dữ liệu cũ (Không hiển thị chi tiết)</i>';
        }

        return `
            <div class="card history-card">
                <div class="history-header" onclick="this.nextElementSibling.classList.toggle('show')">
                    <div>
                        <div style="font-weight:bold; font-size:16px;">${h.name}</div>
                        <div style="font-size:12px; color:#888;">${h.date}</div>
                    </div>
                    <div style="font-weight:900; font-size:16px; ${h.balance < 0 ? 'color:var(--danger)' : 'color:var(--success)'}">
                        ${h.balance < 0 ? '' : 'Dư: '}${fmt(h.balance)}
                    </div>
                </div>
                <div class="history-details">
                    ${detailHtml}
                    <button onclick="delHist(${h.id})" style="color:var(--danger); background:none; border:1px solid var(--danger); width:100%; margin-top:15px; border-radius:8px; padding:10px; font-weight:bold;">🗑️ Xóa bản ghi này</button>
                </div>
            </div>
        `;
    }).join('');
}

function delHist(id) {
    if(confirm("Xóa bản ghi này?")) {
        let hist = JSON.parse(localStorage.getItem('hist_v3')) || [];
        hist = hist.filter(h => h.id !== id);
        localStorage.setItem('hist_v3', JSON.stringify(hist));
        renderHistory();
    }
}

function updateMonthName() {
    mName = document.getElementById('month-name-inp').value;
    localStorage.setItem('mName_v3', mName);
    document.getElementById('display-month-title').innerText = mName;
    alert("Đã đổi tên tháng");
}

// --- 7. KÍCH HOẠT HỆ THỐNG (CHÌA KHÓA QUAN TRỌNG NHẤT) ---
window.onload = () => {
    // Tự động vào màn hình nhập liệu để render giao diện
    tab('daily'); 
    console.log("System Started - Dynamic Core V4");
};
