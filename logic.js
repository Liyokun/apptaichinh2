/* =================================================================
   FILE LOGIC: CHỨA CÁC PHÉP TÍNH TOÁN VÀ DỮ LIỆU
   ================================================================= */

// --- KHỞI TẠO DỮ LIỆU ---
let base = JSON.parse(localStorage.getItem('base_config_v3')) || {
    total: 0, skin: 0, health: 0, lifeOther: 0, ess: 0
};
let notes = {};
let mName = localStorage.getItem('mName_v3') || "Tháng hiện tại";
let theme = localStorage.getItem('theme_v3') || 'light';

// Hàm tiện ích
const getVal = (id) => (Number(document.getElementById(id).value) || 0) * 1000;
const fmt = (n) => n.toLocaleString('vi-VN');

// --- LOGIC GIAO DIỆN ---
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

    if(id === 'budget') renderBudgetLogic();
    if(id === 'status') renderStatusLogic(); 
    if(id === 'history') renderHistory();
    if(id === 'alloc') loadAllocInputs();
    window.scrollTo(0,0);
}

function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme_v3', theme);
    document.body.setAttribute('data-theme', theme);
}

function calc() {
    const life = getVal('inp-skincare') + getVal('inp-health') + getVal('inp-other-lifestyle');
    const ess = getVal('inp-gas') + getVal('inp-other-essential');
    document.getElementById('total-lifestyle').innerText = fmt(life);
    document.getElementById('total-essential').innerText = fmt(ess);
}

function addNote(key) {
    const current = notes[key] || "";
    const input = prompt("Ghi chú:", current);
    if(input !== null) notes[key] = input;
}

function loadAllocInputs() {
    document.getElementById('base-total-budget').value = base.total || '';
    document.getElementById('base-skincare').value = base.skin || '';
    document.getElementById('base-health').value = base.health || '';
    document.getElementById('base-other-lifestyle').value = base.lifeOther || '';
    document.getElementById('base-essential').value = base.ess || '';
    previewSaving();
}

function previewSaving() {
    const total = Number(document.getElementById('base-total-budget').value) || 0;
    const sub = (Number(document.getElementById('base-skincare').value)||0) +
                (Number(document.getElementById('base-health').value)||0) +
                (Number(document.getElementById('base-other-lifestyle').value)||0) +
                (Number(document.getElementById('base-essential').value)||0);
    document.getElementById('preview-saving-calc').innerText = (total - sub).toLocaleString('vi-VN') + " K";
}

function saveBase() {
    base = {
        total: Number(document.getElementById('base-total-budget').value),
        skin: Number(document.getElementById('base-skincare').value),
        health: Number(document.getElementById('base-health').value),
        lifeOther: Number(document.getElementById('base-other-lifestyle').value),
        ess: Number(document.getElementById('base-essential').value)
    };
    localStorage.setItem('base_config_v3', JSON.stringify(base));
    alert("Đã lưu Phân bổ & Tính toán lại Tiết kiệm dự tính!");
    tab('daily');
}

function renderBudgetLogic() {
    const spentSkin = getVal('inp-skincare');
    const spentHealth = getVal('inp-health');
    const spentLifeOther = getVal('inp-other-lifestyle');
    const spentGas = getVal('inp-gas');
    const spentEssOther = getVal('inp-other-essential');
    const totalSpent = spentSkin + spentHealth + spentLifeOther + spentGas + spentEssOther;

    const allocatedTotal = (base.skin + base.health + base.lifeOther + base.ess) * 1000;
    const totalBudget = base.total * 1000;
    const staticSaving = totalBudget - allocatedTotal;

    document.getElementById('static-saving-display').innerText = fmt(staticSaving) + " VNĐ";

    const details = [
        { name: "Skincare", alloc: base.skin*1000, spent: spentSkin },
        { name: "Sức khỏe", alloc: base.health*1000, spent: spentHealth },
        { name: "Tiêu dùng (Khác)", alloc: base.lifeOther*1000, spent: spentLifeOther },
        { name: "Cần thiết (Tổng)", alloc: base.ess*1000, spent: spentGas + spentEssOther }
    ];

    let html = '';
    details.forEach(item => {
        const remain = item.alloc - item.spent;
        const isNeg = remain < 0; 
        html += `<div class="budget-row"><span>${item.name}</span><span class="budget-val ${isNeg ? 'text-red' : 'text-green'}">${fmt(remain)}</span></div>`;
    });
    document.getElementById('budget-details').innerHTML = html;

    const actualBalance = totalBudget - totalSpent;
    const balEl = document.getElementById('actual-balance-display');
    const balBox = document.getElementById('balance-box-ui');
    balEl.innerText = fmt(actualBalance) + " VNĐ";
    
    if (actualBalance < 0) {
        balEl.classList.remove('text-green'); balEl.classList.add('text-red'); balBox.classList.add('border-red');
    } else {
        balEl.classList.remove('text-red'); balEl.classList.add('text-green'); balBox.classList.remove('border-red');
    }
}

// Logic tính phần trăm cho màn hình Status
function renderStatusLogic() {
    const totalBudget = (base.total || 0) * 1000;
    const currentSpent = getVal('inp-skincare') + getVal('inp-health') + getVal('inp-other-lifestyle') + getVal('inp-gas') + getVal('inp-other-essential');
    const balance = totalBudget - currentSpent;
    
    let percent = 0;
    if (totalBudget > 0) percent = (balance / totalBudget) * 100;
    else percent = balance < 0 ? -1 : 0; 

    document.getElementById('hologram-percent').innerText = percent.toFixed(1) + "%";
    
    let statusText = "Ổn định";
    if(percent >= 75) statusText = "Rất tốt (Sakura)";
    else if(percent >= 50) statusText = "Tốt (Summer)";
    else if(percent >= 25) statusText = "Cẩn thận (Fall)";
    else if(percent >= 0) statusText = "Nguy hiểm (Winter)";
    else statusText = "Vỡ nợ (Zero)";
    document.getElementById('hologram-status-text').innerText = statusText;

    // GỌI HÀM BÊN FILE MAGIC ĐỂ HIỂN THỊ HÌNH ẢNH
    updateVisuals(percent);
}

function endMonth() {
    if(!confirm("Xác nhận Kết thúc tháng?\nDữ liệu sẽ được lưu vào lịch sử.")) return;
    
    const totalSpent = getVal('inp-skincare') + getVal('inp-health') + getVal('inp-other-lifestyle') + getVal('inp-gas') + getVal('inp-other-essential');
    const totalBudget = base.total * 1000;
    const finalBalance = totalBudget - totalSpent;

    const record = {
        id: Date.now(),
        name: mName,
        date: new Date().toLocaleDateString('vi-VN'),
        balance: finalBalance,
        spentData: {
            skin: getVal('inp-skincare'),
            health: getVal('inp-health'),
            lifeOther: { v: getVal('inp-other-lifestyle'), n: notes.otherLife },
            gas: getVal('inp-gas'),
            essOther: { v: getVal('inp-other-essential'), n: notes.otherEss } 
        }
    };

    const hist = JSON.parse(localStorage.getItem('hist_v3')) || [];
    hist.unshift(record);
    localStorage.setItem('hist_v3', JSON.stringify(hist));

    document.querySelectorAll('#screen-daily input').forEach(i => i.value = '');
    notes = {};
    calc();
    tab('history');
}

function renderHistory() {
    const hist = JSON.parse(localStorage.getItem('hist_v3')) || [];
    const container = document.getElementById('history-list');
    if(hist.length === 0) { container.innerHTML = '<p style="text-align:center;color:#999;margin-top:30px;">Chưa có lịch sử</p>'; return; }

    container.innerHTML = hist.map(h => `
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
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Skincare:</span> <b>${fmt(h.spentData.skin)}</b></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Sức khỏe:</span> <b>${fmt(h.spentData.health)}</b></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span>Khác (Tiêu dùng):</span> 
                    <div style="text-align:right">
                        <b>${fmt(h.spentData.lifeOther.v)}</b>
                        ${h.spentData.lifeOther.n ? `<br><i style="font-size:12px;color:#666">"${h.spentData.lifeOther.n}"</i>` : ''}
                    </div>
                </div>
                <div style="border-top:1px dashed #ddd; margin:8px 0;"></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Tiền xăng:</span> <b>${fmt(h.spentData.gas || 0)}</b></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span>Khác (Cần thiết):</span> 
                    <div style="text-align:right">
                        <b>${fmt(h.spentData.essOther ? h.spentData.essOther.v : (h.spentData.ess ? h.spentData.ess.v : 0))}</b>
                         ${(h.spentData.essOther && h.spentData.essOther.n) ? `<br><i style="font-size:12px;color:#666">"${h.spentData.essOther.n}"</i>` : ''}
                    </div>
                </div>
                <button onclick="delHist(${h.id})" style="color:var(--danger); background:none; border:1px solid var(--danger); width:100%; margin-top:15px; border-radius:8px; padding:10px; font-weight:bold;">🗑️ Xóa bản ghi này</button>
            </div>
        </div>
    `).join('');
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

document.querySelectorAll('input[type="number"]').forEach(i => i.setAttribute('inputmode', 'decimal'));
