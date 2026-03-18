// ============================================
// ✅ نظام الحسابات المالية الدقيق
// ============================================
const MONEY_PRECISION = 100;
function toCents(amount) { if (amount === null || amount === undefined || isNaN(amount)) return 0; return Math.round(parseFloat(amount) * MONEY_PRECISION); }
function fromCents(cents) { if (cents === null || cents === undefined || isNaN(cents)) return 0; return parseFloat((cents / MONEY_PRECISION).toFixed(2)); }
function formatNumber(num) { if (num === null || num === undefined || isNaN(num)) return '0.00'; const rounded = Math.round(parseFloat(num) * MONEY_PRECISION) / MONEY_PRECISION; return rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function safeAddMoney(...amounts) { let totalCents = 0; amounts.forEach(amount => { totalCents += toCents(amount); }); return fromCents(totalCents); }
function safeSubtractMoney(amount1, amount2) { return fromCents(toCents(amount1) - toCents(amount2)); }
function safeMultiplyMoney(price, quantity) { return fromCents(toCents(price) * quantity); }
// ============================================
// ✅ بيانات الأجل للعملاء والموردين
// ============================================
let customerCredits = JSON.parse(localStorage.getItem('erp_customerCredits')) || [];
let supplierCredits = JSON.parse(localStorage.getItem('erp_supplierCredits')) || [];
// ============================================
// ✅ دالة تتبع كميات المرتجعات
// ============================================
function getReturnedQuantityFromInvoice(invoiceId) {
return salesReturns.filter(r => r.invoiceId == invoiceId).reduce((sum, r) => sum + (r.quantity || 0), 0);
}
// ============================================
// ✅ دالة حساب صافي مبيعات فاتورة معينة
// ============================================
function getNetSalesFromInvoice(invoice) {
const returnedQty = getReturnedQuantityFromInvoice(invoice.id);
const netQty = invoice.quantity - returnedQty;
if (netQty <= 0) return 0;
return safeMultiplyMoney(invoice.salePrice, netQty);
}
// ============================================
// ✅ استخراج التاريخ من الفاتورة بشكل صحيح
// ============================================
function parseInvoiceDate(dateStr) {
if (!dateStr) return { month: 0, year: new Date().getFullYear() };
let parts;
if (dateStr.includes('/')) {
parts = dateStr.split('/');
return { month: parseInt(parts[1]) - 1, year: parseInt(parts[2]) };
} else if (dateStr.includes('-')) {
parts = dateStr.split('-');
if (parts.length === 3) {
return { month: parseInt(parts[1]) - 1, year: parseInt(parts[0]) };
}
}
return { month: 0, year: new Date().getFullYear() };
}
// ============================================
// ✅ معادلات المخزون المحاسبية الصحيحة
// ============================================
function calculateInventoryMetrics() {
const beginningInventory = products.reduce((sum, p) => {
return safeAddMoney(sum, safeMultiplyMoney(p.purchasePrice || 0, p.count || 0));
}, 0);
const endingInventory = beginningInventory;
const averageInventory = safeAddMoney(beginningInventory, endingInventory) / 2;
const cogs = invoices.reduce((sum, inv) => safeAddMoney(sum, inv.cogs || 0), 0);
let inventoryTurnover = 0;
let turnoverDisplay = '0.00';
if (averageInventory > 0) {
inventoryTurnover = cogs / averageInventory;
turnoverDisplay = inventoryTurnover.toFixed(2);
} else {
turnoverDisplay = 'لا يمكن الحساب';
}
return {
averageInventory: formatNumber(averageInventory),
cogs: formatNumber(cogs),
turnover: turnoverDisplay
};
}
// ============================================
// ✅ البيانات العامة
// ============================================
let userData = JSON.parse(localStorage.getItem('erp_user')) || null;
let products = JSON.parse(localStorage.getItem('erp_products')) || [];
let deletedProducts = JSON.parse(localStorage.getItem('erp_deleted')) || [];
let invoices = JSON.parse(localStorage.getItem('erp_invoices')) || [];
let purchases = JSON.parse(localStorage.getItem('erp_purchases')) || [];
let salesReturns = JSON.parse(localStorage.getItem('erp_sales_returns')) || [];
let purchaseReturns = JSON.parse(localStorage.getItem('erp_purchase_returns')) || [];
let employees = JSON.parse(localStorage.getItem('erp_employees')) || [];
let attendanceDB = JSON.parse(localStorage.getItem('erp_attendance')) || {};
let treasuryDB = JSON.parse(localStorage.getItem('erp_treasury')) || { balance: 0, transactions: [], creditCustomers: 0, creditSuppliers: 0 };
let editingInvoiceIndex = -1;
let editingPurchaseIndex = -1;
let editingEmployeeId = null;
let currentSection = 'dashboard';
let charts = {};
let employeeCharts = {};
let purchaseItems = [];
let saleItems = [];
let selectedSaleProduct = null;
let recentActivity = [];
let alertTimer = null;
// ============================================
// ✅ تحديث قائمة الموظفين ديناميكياً (Smart Search)
// ============================================
function renderEmployeesDropdown() {
// تحديث قائمة الموظفين في المبيعات
const saleInput = document.getElementById('saleEmployeeInput');
const saleDatalist = document.getElementById('employeeDatalist');
if (saleDatalist) {
saleDatalist.innerHTML = '';
employees.forEach(emp => {
const option = document.createElement('option');
option.value = emp.name;
option.textContent = emp.name;
saleDatalist.appendChild(option);
});
}

// تحديث قائمة الموظفين في التحليل
const analysisInput = document.getElementById('analysisEmployeeInput');
const analysisDatalist = document.getElementById('analysisEmployeeDatalist');
if (analysisDatalist) {
analysisDatalist.innerHTML = '<option value="all">كل الموظفين</option>';
employees.forEach(emp => {
const option = document.createElement('option');
option.value = emp.name;
option.textContent = emp.name;
analysisDatalist.appendChild(option);
});
}
}
// ============================================
// ✅ حساب عمولة الموظف تلقائياً
// ============================================
function calculateEmployeeCommission(employeeName, month = null, year = null) {
const emp = employees.find(e => e.name === employeeName);
if (!emp) return 0;
let empInvoices = invoices.filter(inv => inv.employeeName === employeeName);
if (month !== null && year !== null) {
empInvoices = empInvoices.filter(inv => {
const dateInfo = parseInvoiceDate(inv.date);
return dateInfo.month == month && dateInfo.year == year;
});
}
let totalNetSales = 0;
empInvoices.forEach(inv => {
totalNetSales = safeAddMoney(totalNetSales, getNetSalesFromInvoice(inv));
});
const commissionRate = emp.commissionRate || 0;
return safeMultiplyMoney(totalNetSales, commissionRate / 100);
}
// ============================================
// ✅ تقييم الأداء بالألوان
// ============================================
function getPerformanceLevel(percentage) {
if (percentage >= 30) return { text: 'ممتاز 🔥', class: 'performance-excellent' };
if (percentage >= 15) return { text: 'جيد ✅', class: 'performance-good' };
return { text: 'يحتاج تحسين ⚠️', class: 'performance-weak' };
}
// ============================================
// ✅ تحليل أداء الموظفين
// ============================================
function renderEmployeeAnalysis() {
const employeeName = document.getElementById('analysisEmployeeInput').value;
const month = document.getElementById('analysisMonth').value;
const year = document.getElementById('analysisYear').value;
const yearSelect = document.getElementById('analysisYear');
if (yearSelect.options.length === 1) {
const currentYear = new Date().getFullYear();
for (let y = currentYear; y >= currentYear - 5; y--) {
yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
}
yearSelect.value = currentYear;
}

let filteredInvoices = [...invoices];
if (employeeName && employeeName !== 'all') {
filteredInvoices = filteredInvoices.filter(inv => inv.employeeName === employeeName);
}
if (month !== 'all' || year !== 'all') {
filteredInvoices = filteredInvoices.filter(inv => {
const dateInfo = parseInvoiceDate(inv.date);
const monthMatch = month === 'all' || dateInfo.month == parseInt(month);
const yearMatch = year === 'all' || dateInfo.year == parseInt(year);
return monthMatch && yearMatch;
});
}
const stats = employees.map(emp => {
const empInvoices = filteredInvoices.filter(inv => inv.employeeName === emp.name);
let totalNetSales = 0;
let totalProfit = 0;
empInvoices.forEach(inv => {
const netSales = getNetSalesFromInvoice(inv);
totalNetSales = safeAddMoney(totalNetSales, netSales);
const returnedQty = getReturnedQuantityFromInvoice(inv.id);
const netQty = inv.quantity - returnedQty;
const netCOGS = safeMultiplyMoney(inv.purchasePrice || 0, netQty > 0 ? netQty : 0);
totalProfit = safeAddMoney(totalProfit, safeSubtractMoney(netSales, netCOGS));
});
let companyTotalNetSales = 0;
invoices.forEach(inv => {
const dateInfo = parseInvoiceDate(inv.date);
const monthMatch = month === 'all' || dateInfo.month == parseInt(month);
const yearMatch = year === 'all' || dateInfo.year == parseInt(year);
if (monthMatch && yearMatch) {
companyTotalNetSales = safeAddMoney(companyTotalNetSales, getNetSalesFromInvoice(inv));
}
});
const contribution = companyTotalNetSales > 0 ? ((totalNetSales / companyTotalNetSales) * 100).toFixed(1) : 0;
const commission = calculateEmployeeCommission(emp.name, month !== 'all' ? parseInt(month) : null, year !== 'all' ? parseInt(year) : null);
const level = getPerformanceLevel(parseFloat(contribution));
return {
id: emp.id,
name: emp.name,
job: emp.job,
invoices: empInvoices.length,
totalSales: totalNetSales,
totalProfit: totalProfit,
contribution: contribution,
commission: commission,
level: level
};
}).filter(s => s.invoices > 0 || (!employeeName || employeeName === 'all'));
const tbody = document.getElementById('employeeAnalysisBody');
tbody.innerHTML = '';
stats.forEach(s => {
tbody.innerHTML += `
<tr>
<td>${s.name}</td>
<td>${s.job}</td>
<td>${s.invoices}</td>
<td><span class="price">${formatNumber(s.totalSales)}</span></td>
<td>${s.contribution}%</td>
<td><span class="price">${formatNumber(s.commission)}</span></td>
<td><span class="performance-badge ${s.level.class}">${s.level.text}</span></td>
</tr>
`;
});
renderEmployeeCharts(stats, month, year);
}
// ============================================
// ✅ رسم الرسوم البيانية للموظفين
// ============================================
function renderEmployeeCharts(stats, selectedMonth, selectedYear) {
const pieCtx = document.getElementById('employeePieChart');
const lineCtx = document.getElementById('employeeLineChart');
if (pieCtx && stats.length > 0) {
const context = pieCtx.getContext('2d');
if (employeeCharts.pie) employeeCharts.pie.destroy();
employeeCharts.pie = new Chart(context, {
type: 'doughnut',
data: {
labels: stats.map(s => `${s.name} (${s.contribution}%)`),
datasets: [{
data: stats.map(s => s.totalSales),
backgroundColor: ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'],
borderWidth: 0
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 8, font: { size: 10 } } },
tooltip: { callbacks: { label: ctx => `${ctx.label}: ${formatNumber(ctx.raw)} ج.م` } }
},
cutout: '55%'
}
});
}
if (lineCtx) {
const context = lineCtx.getContext('2d');
if (employeeCharts.line) employeeCharts.line.destroy();
const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const monthlyNetSales = new Array(12).fill(0);
invoices.forEach(inv => {
const dateInfo = parseInvoiceDate(inv.date);
const yearMatch = selectedYear === 'all' || dateInfo.year === parseInt(selectedYear);
if (yearMatch && dateInfo.month >= 0 && dateInfo.month < 12) {
const netSales = getNetSalesFromInvoice(inv);
monthlyNetSales[dateInfo.month] = safeAddMoney(monthlyNetSales[dateInfo.month], netSales);
}
});
employeeCharts.line = new Chart(context, {
type: 'line',
data: {
labels: monthNames,
datasets: [{
label: 'صافي مبيعات الفريق',
data: monthlyNetSales,
borderColor: '#0ea5e9',
backgroundColor: 'rgba(14, 165, 233, 0.1)',
fill: true,
tension: 0.4,
pointBackgroundColor: '#0ea5e9',
pointRadius: 4,
pointHoverRadius: 6
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: {
labels: { color: '#94a3b8', font: { size: 11 } }
},
tooltip: {
callbacks: {
label: ctx => `${ctx.label}: ${formatNumber(ctx.raw)} ج.م`
}
}
},
scales: {
y: {
grid: { color: 'rgba(255,255,255,0.05)' },
ticks: {
color: '#94a3b8',
callback: v => formatNumber(v)
}
},
x: {
grid: { display: false },
ticks: { color: '#94a3b8' }
}
}
}
});
}
}
// ============================================
// ✅ واجهة تسجيل الدخول
// ============================================
function renderLoginUI() {
const container = document.getElementById('loginContainer');
const loginPage = document.getElementById('loginPage');
const mainApp = document.getElementById('mainApp');
loginPage.style.display = 'flex';
mainApp.classList.remove('visible');
setTimeout(() => { mainApp.style.display = 'none'; }, 500);
const isRegistered = userData && userData.username && userData.password;
if (isRegistered) {
container.innerHTML = `<h2>تسجيل الدخول</h2><div class="profile-preview"><img src="${userData.image || ''}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-user\\'></i>'" /></div><input type="text" id="loginUser" class="login-input" value="${userData.username}" readonly /><input type="password" id="loginPass" class="login-input" placeholder="كلمة المرور" /><button id="btnLogin" class="login-btn">دخول</button><p id="loginMsg" class="login-msg"></p>`;
document.getElementById('btnLogin').onclick = () => {
const pass = document.getElementById('loginPass').value;
const msg = document.getElementById('loginMsg');
if (!pass) { msg.textContent = "أدخل كلمة المرور"; msg.style.display = 'block'; return; }
if (pass === userData.password) enterApp();
else { msg.textContent = "كلمة المرور غير صحيحة!"; msg.style.display = 'block'; }
};
} else {
container.innerHTML = `<h2>إنشاء حساب جديد</h2><div class="profile-preview" id="regPreview"><i class="fas fa-user"></i></div><input type="text" id="regUser" class="login-input" placeholder="اسم المستخدم" /><input type="password" id="regPass" class="login-input" placeholder="كلمة المرور" /><input type="password" id="regConfirmPass" class="login-input" placeholder="تأكيد كلمة المرور" /><input type="file" id="regImage" class="login-input" accept="image/*" /><button id="btnRegister" class="login-btn">تسجيل</button><p id="regMsg" class="login-msg"></p>`;
document.getElementById('regImage').addEventListener('change', function(e) {
const file = e.target.files[0];
if (file) { const reader = new FileReader(); reader.onload = (evt) => { document.getElementById('regPreview').innerHTML = `<img src="${evt.target.result}" />`; }; reader.readAsDataURL(file); }
});
document.getElementById('btnRegister').onclick = () => {
const user = document.getElementById('regUser').value.trim();
const pass = document.getElementById('regPass').value;
const confirmPass = document.getElementById('regConfirmPass').value;
const msg = document.getElementById('regMsg');
if (!user) { msg.textContent = "أدخل اسم المستخدم"; msg.style.display = 'block'; return; }
if (!pass) { msg.textContent = "أدخل كلمة المرور"; msg.style.display = 'block'; return; }
if (pass !== confirmPass) { msg.textContent = "كلمة المرور غير متطابقة"; msg.style.display = 'block'; return; }
const imgInput = document.getElementById('regImage');
if (imgInput.files && imgInput.files[0]) {
const reader = new FileReader();
reader.onload = (evt) => { userData = { username: user, password: pass, image: evt.target.result }; localStorage.setItem('erp_user', JSON.stringify(userData)); enterApp(); };
reader.readAsDataURL(imgInput.files[0]);
} else { userData = { username: user, password: pass, image: '' }; localStorage.setItem('erp_user', JSON.stringify(userData)); enterApp(); }
};
}
}
function enterApp() {
document.getElementById('loginPage').style.display = 'none';
const mainApp = document.getElementById('mainApp');
mainApp.style.display = 'flex';
void mainApp.offsetWidth;
mainApp.classList.add('visible');
initApp();
}
function initApp() {
document.getElementById('menuUsername').textContent = formatName(userData?.username || 'مستخدم');
document.getElementById('settingsUsername').textContent = formatName(userData?.username || 'مستخدم');
if (userData?.image) { document.getElementById('menuProfileImg').src = userData.image; document.getElementById('settingsProfileImg').src = userData.image; }
const today = new Date().toISOString().split('T')[0];
document.getElementById('purchaseInvoiceDate').value = today;
document.getElementById('invoiceDate').value = today;
renderAll();
loadReturnProducts();
renderEmployees();
renderInventory();
renderTreasury();
renderEmployeesDropdown();
const now = new Date();
document.getElementById('attYear').value = now.getFullYear();
document.getElementById('attMonth').value = now.getMonth();
const yearSelect = document.getElementById('analysisYear');
yearSelect.innerHTML = `<option value="all">كل السنوات</option>`;
const currentYear = now.getFullYear();
for (let y = currentYear; y >= currentYear - 5; y--) {
yearSelect.innerHTML += `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`;
}
setTimeout(() => { updateDashboardCharts(); }, 100);
renderAlerts();
renderActivityFeed();
startActiveAlerts();
}
function formatName(name) { if (!name) return ''; return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '); }
// ============================================
// ✅ التنقل بين الأقسام
// ============================================
document.querySelectorAll('.menu a[data-section]').forEach(link => {
link.addEventListener('click', function(e) {
e.preventDefault();
document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
this.classList.add('active');
const sectionId = this.getAttribute('data-section');
document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
const target = document.getElementById(sectionId);
if (target) {
target.classList.add('active');
currentSection = sectionId;
if (sectionId === 'treasury') renderTreasury();
else if (sectionId === 'dashboard') { renderDashboardStats(); updateDashboardCharts(); }
else if (sectionId === 'inventory') renderInventory();
else if (sectionId === 'employees') renderEmployees();
else if (sectionId === 'attendance') loadAttendanceGrid();
else if (sectionId === 'salesAnalysis') renderEmployeeAnalysis();
else if (sectionId === 'settings') { }
}
});
});
document.getElementById('logoutBtn').addEventListener('click', e => { e.preventDefault(); renderLoginUI(); });
function switchTab(section, tabName) {
document.querySelectorAll(`#${section} .sub-tab`).forEach(b => b.classList.remove('active'));
document.querySelectorAll(`#${section} .sub-content`).forEach(c => c.classList.remove('active'));
if (event && event.currentTarget) { event.currentTarget.classList.add('active'); }
document.getElementById(`${section}-${tabName}`).classList.add('active');
}
// ============================================
// ✅ الخزينة - النوافذ المنبثقة
// ============================================
function openIncomeModal() { document.getElementById('incomeModal').classList.add('active'); ['incomeAmount', 'incomeDesc', 'incomePayer', 'incomeReceiver'].forEach(id => document.getElementById(id).value = ''); document.getElementById('incomeAmount').focus(); }
function closeIncomeModal() { document.getElementById('incomeModal').classList.remove('active'); }
function openExpenseModal() { document.getElementById('expenseModal').classList.add('active'); ['expenseAmount', 'expenseDesc', 'expensePayer', 'expenseReceiver'].forEach(id => document.getElementById(id).value = ''); document.getElementById('expenseAmount').focus(); }
function closeExpenseModal() { document.getElementById('expenseModal').classList.remove('active'); }
// ✅ تحديث رصيد العميل/المورد بعد السداد
function updateCreditBalance(type, name, paidAmount) {
const cleanName = name.trim().toLowerCase();
let found = false;
if (type === 'customer') {
for (let i = 0; i < customerCredits.length; i++) {
const credit = customerCredits[i];
const creditName = credit.name.trim().toLowerCase();
if (creditName === cleanName || creditName.includes(cleanName) || cleanName.includes(creditName)) {
credit.paid = safeAddMoney(credit.paid || 0, paidAmount);
credit.remaining = safeSubtractMoney(credit.total, credit.paid);
if (credit.remaining <= 0) credit.remaining = 0;
found = true;
break;
}
}
if (found) {
localStorage.setItem('erp_customerCredits', JSON.stringify(customerCredits));
return true;
}
} else if (type === 'supplier') {
for (let i = 0; i < supplierCredits.length; i++) {
const credit = supplierCredits[i];
const creditName = credit.name.trim().toLowerCase();
if (creditName === cleanName || creditName.includes(cleanName) || cleanName.includes(creditName)) {
credit.paid = safeAddMoney(credit.paid || 0, paidAmount);
credit.remaining = safeSubtractMoney(credit.total, credit.paid);
if (credit.remaining <= 0) credit.remaining = 0;
found = true;
break;
}
}
if (found) {
localStorage.setItem('erp_supplierCredits', JSON.stringify(supplierCredits));
return true;
}
}
return false;
}
function submitIncome(e) {
e.preventDefault();
const amount = parseFloat(document.getElementById('incomeAmount').value);
const desc = document.getElementById('incomeDesc').value.trim();
const payer = document.getElementById('incomePayer').value.trim();
const receiver = document.getElementById('incomeReceiver').value.trim();
if (isNaN(amount) || amount <= 0) { alert('مبلغ غير صحيح'); return; }
if ((desc.toLowerCase().includes('سداد') || desc.toLowerCase().includes('فاتورة') || desc.toLowerCase().includes('أجل')) && payer) {
const updated = updateCreditBalance('customer', payer, amount);
if (updated) { console.log('✅ تم تحديث رصيد العميل:', payer); }
}
addTreasuryTransaction('in', amount, desc || 'إيداع', payer || '-', receiver || '-', 'وارد عام', true);
closeIncomeModal();
showSuccessMessage('وارد', amount, treasuryDB.balance);
renderTreasury();
renderDashboardStats();
updateDashboardCharts();
addActivity('treasury', `إيداع مبلغ ${formatNumber(amount)} جنيه`, desc);
}
function submitExpense(e) {
e.preventDefault();
const amount = parseFloat(document.getElementById('expenseAmount').value);
const desc = document.getElementById('expenseDesc').value.trim();
const payer = document.getElementById('expensePayer').value.trim();
const receiver = document.getElementById('expenseReceiver').value.trim();
const category = document.querySelector('input[name="expenseCategory"]:checked').value;
if (isNaN(amount) || amount <= 0) { alert('مبلغ غير صحيح'); return; }
if (treasuryDB.balance < amount) { alert(`رصيد غير كافي (${formatNumber(treasuryDB.balance)})`); return; }
if ((desc.toLowerCase().includes('سداد') || desc.toLowerCase().includes('فاتورة') || desc.toLowerCase().includes('أجل')) && receiver) {
const updated = updateCreditBalance('supplier', receiver, amount);
if (updated) { console.log('✅ تم تحديث رصيد المورد:', receiver); }
}
addTreasuryTransaction('out', amount, desc || 'سحب', payer || '-', receiver || '-', category, true);
closeExpenseModal();
showSuccessMessage('صادر', amount, treasuryDB.balance);
renderTreasury();
renderDashboardStats();
updateDashboardCharts();
addActivity('treasury', `صرف مبلغ ${formatNumber(amount)} جنيه`, desc);
}
function showSuccessMessage(type, amount, balance) {
const msg = document.getElementById('successMessage');
document.getElementById('successTitle').textContent = type === 'وارد' ? 'تم الإيداع' : 'تم الصرف';
document.getElementById('successText').textContent = type === 'وارد' ? 'تمت الإضافة للخزينة' : 'تم الخصم من الخزينة';
document.getElementById('successAmount').textContent = formatNumber(amount) + ' ج.م';
document.getElementById('successBalance').textContent = 'الرصيد: ' + formatNumber(balance) + ' ج.م';
msg.classList.add('active');
setTimeout(() => msg.classList.remove('active'), 2500);
}
document.getElementById('incomeModal').addEventListener('click', e => { if (e.target.id === 'incomeModal') closeIncomeModal(); });
document.getElementById('expenseModal').addEventListener('click', e => { if (e.target.id === 'expenseModal') closeExpenseModal(); });
function addTreasuryTransaction(type, amount, desc, payer, receiver, category, auto = false) {
const now = new Date().toLocaleDateString('ar-EG');
const isIncome = type === 'in';
if (isIncome) treasuryDB.balance = safeAddMoney(treasuryDB.balance, amount);
else treasuryDB.balance = safeSubtractMoney(treasuryDB.balance, amount);
treasuryDB.transactions.unshift({ date: now, type: isIncome ? 'وارد' : 'صادر', desc: desc || 'حركة يدوية', category: category || 'عام', payer: payer || '-', receiver: receiver || '-', amount: fromCents(toCents(amount)), balance: treasuryDB.balance });
saveData();
return true;
}
// ✅ فتح قائمة أجل العملاء/الموردين
function openCreditListModal(type) {
const modal = document.createElement('div');
modal.className = 'treasury-modal active';
modal.innerHTML = `
<div class="modal-content" style="max-width:800px; border-color:var(--accent);">
<button class="close-modal" onclick="this.closest('.treasury-modal').remove()"><i class="fas fa-times"></i></button>
<div class="modal-header">
<h2 style="color:var(--accent)"><i class="fas fa-list"></i> قائمة ${type === 'customer' ? 'أجل العملاء' : 'أجل الموردين'}</h2>
<p>تفاصيل الديون الحالية</p>
</div>
<div style="max-height:60vh; overflow-y:auto; padding:10px;">
<table style="width:100%; border-collapse:collapse; font-size:13px;">
<thead>
<tr style="background:rgba(14,165,233,0.2);">
<th style="padding:10px; text-align:right;">${type === 'customer' ? 'العميل' : 'المورد'}</th>
<th style="padding:10px;">الهاتف</th>
<th style="padding:10px;">إجمالي الفواتير</th>
<th style="padding:10px;">المدفوع</th>
<th style="padding:10px; color:var(--warning);">المتبقي</th>
</tr>
</thead>
<tbody>
${(type === 'customer' ? customerCredits : supplierCredits)
.filter(c => c.remaining > 0)
.map(c => `
<tr style="border-bottom:1px solid var(--border);">
<td style="padding:10px; text-align:right; font-weight:600;">${c.name}</td>
<td style="padding:10px;">${c.phone || '—'}</td>
<td style="padding:10px;">${formatNumber(c.total)}</td>
<td style="padding:10px; color:var(--success);">${formatNumber(c.paid || 0)}</td>
<td style="padding:10px; color:var(--warning); font-weight:bold;">${formatNumber(c.remaining)}</td>
</tr>
`).join('') || '<tr><td colspan="5" style="padding:20px; text-align:center; color:var(--text-muted);">لا توجد ديون حالية</td></tr>'}
</tbody>
</table>
</div>
</div>
`;
document.body.appendChild(modal);
modal.addEventListener('click', e => {
if (e.target === modal) modal.remove();
});
}
function renderTreasury() {
if (!treasuryDB.transactions) treasuryDB.transactions = [];
document.getElementById('treasuryBalanceBig').innerText = formatNumber(treasuryDB.balance);
document.getElementById('dashTreasury').innerText = formatNumber(treasuryDB.balance);
let income = 0, expense = 0;
treasuryDB.transactions.forEach(log => { if (log.type === 'وارد') income = safeAddMoney(income, log.amount); else expense = safeAddMoney(expense, log.amount); });
let creditCust = customerCredits.reduce((sum, c) => safeAddMoney(sum, c.remaining || 0), 0);
let creditSupp = supplierCredits.reduce((sum, s) => safeAddMoney(sum, s.remaining || 0), 0);
document.getElementById('treasuryIncome').innerText = formatNumber(income);
document.getElementById('treasuryExpense').innerText = formatNumber(expense);
document.getElementById('creditCustomersTotalValue').innerText = formatNumber(creditCust);
document.getElementById('creditSuppliersTotalValue').innerText = formatNumber(creditSupp);
const tbody = document.getElementById('treasuryLog');
tbody.innerHTML = '';
treasuryDB.transactions.forEach(log => {
const color = log.type === 'وارد' ? 'var(--success)' : 'var(--danger)';
const icon = log.type === 'وارد' ? 'arrow-down' : 'arrow-up';
const sign = log.type === 'وارد' ? '+' : '-';
const row = `<tr>
<td>${log.date}</td>
<td style="color:${color};font-weight:bold;"><i class="fas fa-${icon}"></i> ${log.type}</td>
<td>${log.desc}</td>
<td>${log.category || 'عام'}</td>
<td>${log.payer}</td>
<td>${log.receiver}</td>
<td style="color:${color};font-weight:bold;">${sign}${formatNumber(log.amount)}</td>
<td>${formatNumber(log.balance)}</td>
</tr>`;
tbody.innerHTML += row;
});
}
// ============================================
// ✅ الحضور والغياب
// ============================================
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
document.getElementById('loadAttendanceBtn').addEventListener('click', loadAttendanceGrid);
function loadAttendanceGrid() {
const year = parseInt(document.getElementById('attYear').value);
const month = parseInt(document.getElementById('attMonth').value);
const days = getDaysInMonth(year, month);
let headHTML = '<tr><th>#</th><th>الموظف</th>';
for (let i = 1; i <= days; i++) { headHTML += `<th>${i}</th>`; }
headHTML += '<th>خصم</th><th>الراتب</th></tr>';
document.getElementById('attHead').innerHTML = headHTML;
const tbody = document.getElementById('attBody');
tbody.innerHTML = '';
employees.forEach((emp, idx) => {
const key = `${emp.id}_${year}_${month}`;
const record = attendanceDB[key] || { days: [], deduction: 0, paid: false, finalSalary: 0 };
let rowHTML = `<tr><td>${idx + 1}</td><td style="text-align:right; font-weight:600;">${emp.name}</td>`;
for (let i = 1; i <= days; i++) {
const status = record.days[i];
let cls = 'day-cell';
if (status === 'present') cls += ' present';
else if (status === 'absent') cls += ' absent';
rowHTML += `<td class="${cls}" onclick="toggleAttendance(${emp.id},${year},${month},${i})">${i}</td>`;
}
rowHTML += `<td><input type="number" class="month-deduction-input" id="ded_${emp.id}" value="${record.deduction}" ${record.paid ? 'disabled' : ''}></td>
<td class="month-action-cell"><button class="pay-btn" onclick="deliverSalary(${emp.id},${year},${month})" ${record.paid ? 'disabled' : ''}>${record.paid ? 'تم التسليم' : '<i class="fas fa-hand-holding-usd"></i> تسليم'}</button></td></tr>`;
tbody.innerHTML += rowHTML;
});
}
function toggleAttendance(empId, year, month, day) {
const key = `${empId}_${year}_${month}`;
if (!attendanceDB[key]) attendanceDB[key] = { days: [], deduction: 0, paid: false, finalSalary: 0 };
const current = attendanceDB[key].days[day];
if (current === 'present') attendanceDB[key].days[day] = 'absent';
else if (current === 'absent') attendanceDB[key].days[day] = null;
else attendanceDB[key].days[day] = 'present';
localStorage.setItem('erp_attendance', JSON.stringify(attendanceDB));
loadAttendanceGrid();
}
function deliverSalary(empId, year, month) {
const emp = employees.find(e => e.id === empId);
if (!emp) return;
const key = `${empId}_${year}_${month}`;
const deductionInput = document.getElementById(`ded_${empId}`);
const deduction = deductionInput ? (parseFloat(deductionInput.value) || 0) : 0;
const addons = safeAddMoney(emp.incentives || 0, emp.allowances || 0, emp.bonuses || 0);
const commissionBalance = emp.commissionBalance || 0;
const net = safeSubtractMoney(safeAddMoney(emp.salary || 0, addons, commissionBalance), deduction);
if (net <= 0) { alert('لا يمكن صرف راتب بقيمة صفر'); return; }
if (treasuryDB.balance < net) { alert(`رصيد الخزينة غير كافي. المتاح: ${formatNumber(treasuryDB.balance)} ج.م`); return; }
addTreasuryTransaction('out', net, `راتب: ${emp.name} (شامل العمولات)`, 'الإدارة', emp.name, 'مرتبات', true);
emp.commissionBalance = 0;
if (!attendanceDB[key]) attendanceDB[key] = { days: [], deduction: 0, paid: false };
attendanceDB[key].deduction = deduction;
attendanceDB[key].paid = true;
attendanceDB[key].finalSalary = net;
saveData();
renderTreasury();
renderDashboardStats();
updateDashboardCharts();
loadAttendanceGrid();
showSalaryDeliveryMessage(emp.name, net, commissionBalance);
addActivity('treasury', `صرف راتب ${emp.name}`, formatNumber(net) + ' جنيه');
}
function showSalaryDeliveryMessage(name, amount, commission) {
const msg = document.getElementById('successMessage');
document.getElementById('successTitle').textContent = '✅ تسليم راتب الموظف';
document.getElementById('successText').textContent = `تم صرف راتب ${name} بنجاح`;
document.getElementById('successAmount').textContent = formatNumber(amount) + ' ج.م';
document.getElementById('successBalance').textContent = commission > 0 ? `شامل عمولات: ${formatNumber(commission)} ج.م` : 'الرصيد: 0.00 ج.م';
msg.classList.add('active');
setTimeout(() => msg.classList.remove('active'), 3000);
}
// ============================================
// ✅ إشعار العمولات
// ============================================
function showCommissionNotification(type, amount, balance) {
const msg = document.getElementById('successMessage');
document.getElementById('successTitle').textContent = type;
document.getElementById('successText').textContent = type === 'إضافة عمولة' ?
'تم إضافة العمولة لرصيد الموظف' : 'تم خصم العمولة من رصيد الموظف';
document.getElementById('successAmount').textContent = formatNumber(Math.abs(amount)) + ' ج.م';
document.getElementById('successBalance').textContent = 'الرصيد الجديد: ' + formatNumber(balance) + ' ج.م';
msg.classList.add('active');
setTimeout(() => msg.classList.remove('active'), 2500);
}
// ============================================
// ✅ المشتريات
// ============================================
function addPurchaseItem() {
const code = document.getElementById('newPurchaseProductCode').value.trim();
const name = document.getElementById('newPurchaseProductName').value.trim();
const unit = document.getElementById('newPurchaseUnit').value.trim();
const price = parseFloat(document.getElementById('newPurchasePrice').value);
const salePrice = parseFloat(document.getElementById('newPurchaseSalePrice').value);
const quantity = parseFloat(document.getElementById('newPurchaseQuantity').value);
const category = document.getElementById('newPurchaseCategory').value.trim();
if (!name || isNaN(price) || isNaN(salePrice) || !quantity || quantity <= 0) { alert('بيانات المنتج غير مكتملة'); return; }
purchaseItems.push({ id: Date.now(), productCode: code, title: name, unit: unit || 'قطعة', purchasePrice: fromCents(toCents(price)), salePrice: fromCents(toCents(salePrice)), quantity: quantity, value: safeMultiplyMoney(price, quantity), category: category });
renderPurchaseItems();
clearPurchaseItemForm();
}
function renderPurchaseItems() {
const tbody = document.getElementById('purchaseItemsList');
tbody.innerHTML = '';
let total = 0;
purchaseItems.forEach((item, index) => {
total = safeAddMoney(total, item.value);
tbody.innerHTML += `<tr><td>${item.productCode || '—'}</td><td>${item.title}</td><td>${item.unit}</td><td>${formatNumber(item.purchasePrice)}</td><td>${formatNumber(item.salePrice)}</td><td>${item.quantity}</td><td>${formatNumber(item.value)}</td><td><button class="action-btn btn-delete" onclick="removePurchaseItem(${index})"><i class="fas fa-trash"></i></button></td></tr>`;
});
document.getElementById('purTotalPreview').innerText = formatNumber(total);
}
function removePurchaseItem(index) { purchaseItems.splice(index, 1); renderPurchaseItems(); }
function clearPurchaseItemForm() { ['newPurchaseProductCode', 'newPurchaseProductName', 'newPurchaseUnit', 'newPurchasePrice', 'newPurchaseSalePrice', 'newPurchaseQuantity', 'newPurchaseCategory'].forEach(id => { document.getElementById(id).value = ''; }); }
// ============================================
// ✅ المبيعات
// ============================================
function onSaleProductChange() {
const input = document.getElementById('saleProductInput');
const productName = input.value;
if (!productName) { document.getElementById('invoiceProductCodeDisplay').value = ''; document.getElementById('invoiceSalePrice').value = ''; document.getElementById('invoiceQuantity').value = '1'; return; }
const product = products.find(p => p.title === productName);
if (product) {
document.getElementById('invoiceProductCodeDisplay').value = product.productCode || '';
document.getElementById('invoiceSalePrice').value = product.salePrice || 0;
document.getElementById('invoiceQuantity').value = '1';
document.getElementById('invoiceQuantity').max = product.count || 9999;
}
}
function addSaleItem() {
const input = document.getElementById('saleProductInput');
const productName = input.value;
const code = document.getElementById('invoiceProductCodeDisplay').value.trim();
const price = parseFloat(document.getElementById('invoiceSalePrice').value);
const quantity = parseFloat(document.getElementById('invoiceQuantity').value);
if (!productName || isNaN(price) || !quantity || quantity <= 0) { alert('بيانات المنتج غير مكتملة'); return; }
const product = products.find(p => p.title === productName);
if (!product || product.count < quantity) { alert('❌ خطأ: الكمية المطلوبة (' + quantity + ') أكبر من المتاح (' + product.count + ')'); return; }
saleItems.push({ id: Date.now(), productId: product.id, productCode: code, title: product.title, unit: product.unit || 'قطعة', salePrice: fromCents(toCents(price)), purchasePrice: product.purchasePrice, quantity: quantity, value: safeMultiplyMoney(price, quantity), cogs: safeMultiplyMoney(product.purchasePrice, quantity) });
renderSaleItems();
clearSaleItemForm();
}
function renderSaleItems() {
const tbody = document.getElementById('saleItemsList');
tbody.innerHTML = '';
let total = 0;
saleItems.forEach((item, index) => {
total = safeAddMoney(total, item.value);
tbody.innerHTML += `<tr><td>${item.productCode || '—'}</td><td>${item.title}</td><td>${item.unit}</td><td>${formatNumber(item.salePrice)}</td><td>${item.quantity}</td><td>${formatNumber(item.value)}</td><td>${formatNumber(item.cogs)}</td><td><button class="action-btn btn-delete" onclick="removeSaleItem(${index})"><i class="fas fa-trash"></i></button></td></tr>`;
});
document.getElementById('saleTotalPreview').innerText = formatNumber(total);
}
function removeSaleItem(index) { saleItems.splice(index, 1); renderSaleItems(); }
function clearSaleItemForm() { document.getElementById('saleProductInput').value = ''; document.getElementById('invoiceProductCodeDisplay').value = ''; document.getElementById('invoiceSalePrice').value = ''; document.getElementById('invoiceQuantity').value = '1'; selectedSaleProduct = null; }
// ============================================
// ✅ المرتجعات
// ============================================
function onPurchaseReturnProductChange() {
const input = document.getElementById('returnPurchaseProductInput');
const productName = input.value;
if (!productName) { document.getElementById('returnPurchasePrice').value = ''; document.getElementById('returnPurchaseQuantity').value = ''; document.getElementById('purchaseReturnTotalBox').style.display = 'none'; return; }
const product = products.find(p => p.title === productName);
if (product) {
document.getElementById('returnPurchasePrice').value = product.purchasePrice || 0;
document.getElementById('returnPurchaseQuantity').value = '';
document.getElementById('returnPurchaseQuantity').max = product.count || 9999;
document.getElementById('returnPurchasePrice').removeAttribute('readonly');
calculatePurchaseReturnTotal();
}
}
function calculatePurchaseReturnTotal() {
const price = parseFloat(document.getElementById('returnPurchasePrice').value) || 0;
const quantity = parseFloat(document.getElementById('returnPurchaseQuantity').value) || 0;
const total = safeMultiplyMoney(price, quantity);
if (total > 0) { document.getElementById('purchaseReturnTotalAmount').textContent = formatNumber(total); document.getElementById('purchaseReturnTotalBox').style.display = 'block'; } else { document.getElementById('purchaseReturnTotalBox').style.display = 'none'; }
}
function savePurchaseReturn() {
const input = document.getElementById('returnPurchaseProductInput');
const productName = input.value;
const returnPrice = parseFloat(document.getElementById('returnPurchasePrice').value);
const quantity = parseFloat(document.getElementById('returnPurchaseQuantity').value);
if (!productName) { alert('يجب اختيار منتج'); return; }
if (isNaN(returnPrice) || returnPrice <= 0) { alert('يجب إدخال سعر صحيح'); return; }
if (isNaN(quantity) || quantity <= 0) { alert('يجب إدخال كمية صحيحة'); return; }
const product = products.find(p => p.title === productName);
if (!product) { alert('منتج غير موجود'); return; }
if (quantity > product.count) { alert(`الكمية المرتجعة (${quantity}) أكبر من المتاح في المخزون (${product.count})`); return; }
product.count -= quantity;
const refund = safeMultiplyMoney(returnPrice, quantity);
addTreasuryTransaction('in', refund, `مردود مشتريات: ${product.title}`, 'المورد', 'الخزينة', 'مردودات مشتريات', true);
purchaseReturns.push({ id: Date.now(), productId: product.id, productName: product.title, productCode: product.productCode, unit: product.unit, returnPrice: fromCents(toCents(returnPrice)), quantity, date: new Date().toLocaleDateString('ar-EG') });
saveData();
renderAll();
renderTreasury();
renderDashboardStats();
updateDashboardCharts();
document.getElementById('returnPurchaseProductInput').value = '';
document.getElementById('returnPurchasePrice').value = '';
document.getElementById('returnPurchaseQuantity').value = '';
document.getElementById('purchaseReturnTotalBox').style.display = 'none';
alert(`تم الإرجاع وإضافة ${formatNumber(refund)} للخزينة`);
}
function loadReturnProducts() {
// تحديث قائمة الفواتير للمرتجعات
const saleInput = document.getElementById('returnSaleInvoiceInput');
const saleDatalist = document.getElementById('invoiceDatalist');
if (saleDatalist) {
saleDatalist.innerHTML = '';
const uniqueInvoices = [];
const seenIds = new Set();
invoices.forEach(inv => {
if(!seenIds.has(inv.id)){
uniqueInvoices.push(inv);
seenIds.add(inv.id);
}
});
uniqueInvoices.forEach(inv => {
const returnedQty = getReturnedQuantityFromInvoice(inv.id);
const remainingQty = inv.quantity - returnedQty;
if (remainingQty <= 0) return;
const option = document.createElement('option');
option.value = `فاتورة #${inv.id.toString().slice(-4)} - ${inv.customerName}`;
option.textContent = `فاتورة #${inv.id.toString().slice(-4)} - ${inv.customerName} - ${inv.productName} (المتبقي: ${remainingQty})`;
option.setAttribute('data-id', inv.id);
saleDatalist.appendChild(option);
});
}

// تحديث قائمة منتجات المشتريات للمرتجعات
const purchaseInput = document.getElementById('returnPurchaseProductInput');
const purchaseDatalist = document.getElementById('returnProductDatalist');
if (purchaseDatalist) {
purchaseDatalist.innerHTML = '';
const availableProducts = products.filter(p => p.count > 0);
availableProducts.forEach(p => {
const option = document.createElement('option');
option.value = p.title;
option.textContent = `${p.title} [${p.productCode || '—'}] - شراء: ${formatNumber(p.purchasePrice)} - الكمية: ${p.count}`;
purchaseDatalist.appendChild(option);
});
}

// تحديث قائمة منتجات المبيعات
const saleProductInput = document.getElementById('saleProductInput');
const saleProductDatalist = document.getElementById('productDatalist');
if (saleProductDatalist) {
saleProductDatalist.innerHTML = '';
const availableProducts = products.filter(p => p.count > 0);
availableProducts.forEach(p => {
const option = document.createElement('option');
option.value = p.title;
option.textContent = `${p.title} [${p.productCode || '—'}] - متاح: ${p.count}`;
saleProductDatalist.appendChild(option);
});
}
}
function onSaleReturnInvoiceChange() {
const input = document.getElementById('returnSaleInvoiceInput');
const inputValue = input.value;
if (!inputValue) {
document.getElementById('returnSalePrice').value = '';
document.getElementById('returnSaleQuantity').value = '';
document.getElementById('returnSaleQuantity').max = 9999;
document.getElementById('saleReturnTotalBox').style.display = 'none';
return;
}
const option = Array.from(document.getElementById('invoiceDatalist').options).find(o => o.value === inputValue);
if (option) {
const invoiceId = option.getAttribute('data-id');
const invoice = invoices.find(i => i.id == invoiceId);
if (invoice) {
const returnedQty = getReturnedQuantityFromInvoice(invoiceId);
const remainingQty = invoice.quantity - returnedQty;
document.getElementById('returnSalePrice').value = invoice.salePrice;
document.getElementById('returnSaleQuantity').value = '';
document.getElementById('returnSaleQuantity').max = remainingQty;
document.getElementById('returnSaleQuantity').placeholder = `الحد الأقصى: ${remainingQty}`;
document.getElementById('returnSalePrice').removeAttribute('readonly');
calculateSaleReturnTotal();
}
}
}
function calculateSaleReturnTotal() {
const price = parseFloat(document.getElementById('returnSalePrice').value) || 0;
const quantity = parseFloat(document.getElementById('returnSaleQuantity').value) || 0;
const total = safeMultiplyMoney(price, quantity);
if (total > 0) { document.getElementById('saleReturnTotalAmount').textContent = formatNumber(total); document.getElementById('saleReturnTotalBox').style.display = 'flex'; } else { document.getElementById('saleReturnTotalBox').style.display = 'none'; }
}
function saveSalesReturn() {
const input = document.getElementById('returnSaleInvoiceInput');
const inputValue = input.value;
const returnPrice = parseFloat(document.getElementById('returnSalePrice').value);
const quantity = parseFloat(document.getElementById('returnSaleQuantity').value);
const condition = document.getElementById('returnSaleCondition').value;
if (!inputValue) { alert('يجب اختيار فاتورة أصلية'); return; }
if (isNaN(returnPrice) || returnPrice <= 0) { alert('يجب إدخال سعر صحيح'); return; }
if (isNaN(quantity) || quantity <= 0) { alert('يجب إدخال كمية صحيحة'); return; }

const option = Array.from(document.getElementById('invoiceDatalist').options).find(o => o.value === inputValue);
let invoiceId = null;
if (option) invoiceId = option.getAttribute('data-id');

if (!invoiceId) { alert('فاتورة غير موجودة'); return; }
const originalInvoice = invoices.find(i => i.id == invoiceId);
if (!originalInvoice) { alert('فاتورة غير موجودة'); return; }
const returnedQty = getReturnedQuantityFromInvoice(invoiceId);
const remainingQty = originalInvoice.quantity - returnedQty;
if (quantity > remainingQty) { alert(`❌ لا يمكن إرجاع كمية (${quantity}) أكبر من المتبقي (${remainingQty})`); return; }
const product = products.find(p => p.id == originalInvoice.productId);
if (condition === 'good') {
if(product) product.count += quantity;
}
const refund = safeMultiplyMoney(returnPrice, quantity);
const returnCOGS = safeMultiplyMoney(originalInvoice.purchasePrice, quantity);
addTreasuryTransaction('out', refund, `مردود مبيعات: ${originalInvoice.productName}`, 'الخزينة', 'العميل', 'مردودات مبيعات', true);
const originalEmployeeId = originalInvoice.employeeId;
if (originalEmployeeId) {
const employee = employees.find(e => e.id == originalEmployeeId);
if (employee) {
const commissionToDeduct = safeMultiplyMoney(refund, employee.commissionRate / 100);
employee.commissionBalance = safeSubtractMoney(employee.commissionBalance || 0, commissionToDeduct);
showCommissionNotification('خصم عمولة', commissionToDeduct, employee.commissionBalance);
}
}
salesReturns.push({
id: Date.now(),
invoiceId: originalInvoice.id,
productId: originalInvoice.productId,
productName: originalInvoice.productName,
productCode: originalInvoice.productCode,
unit: originalInvoice.unit,
returnPrice: fromCents(toCents(returnPrice)),
quantity,
condition: condition,
purchasePrice: originalInvoice.purchasePrice,
cogs: returnCOGS,
date: new Date().toLocaleDateString('ar-EG')
});
saveData();
renderAll();
renderTreasury();
renderDashboardStats();
updateDashboardCharts();
renderEmployeeAnalysis();
loadReturnProducts();
document.getElementById('returnSaleInvoiceInput').value = '';
document.getElementById('returnSalePrice').value = '';
document.getElementById('returnSaleQuantity').value = '';
document.getElementById('saleReturnTotalBox').style.display = 'none';
alert(`تم الإرجاع وخصم ${formatNumber(refund)} من الخزينة`);
}
// ============================================
// ✅ حفظ الفواتير
// ============================================
function createPurchase() {
const supplierName = document.getElementById('purchaseSupplierName').value.trim();
const supplierPhone = document.getElementById('purchaseSupplierPhone').value.trim();
const invoiceDate = document.getElementById('purchaseInvoiceDate').value;
const paymentType = document.getElementById('purchasePaymentType').value;
if (!supplierName || purchaseItems.length === 0) { alert('يجب إدخال اسم المورد وإضافة منتج واحد على الأقل'); return; }
let totalInvoice = 0;
purchaseItems.forEach(item => {
totalInvoice = safeAddMoney(totalInvoice, item.value);
let existing = products.find(p => p.productCode === item.productCode || p.title === item.title);
if (existing) {
const totalCostOld = safeMultiplyMoney(existing.purchasePrice, existing.count);
const totalCostNew = safeMultiplyMoney(item.purchasePrice, item.quantity);
const newCount = existing.count + item.quantity;
existing.count = newCount;
existing.purchasePrice = fromCents(toCents((totalCostOld + totalCostNew) / newCount));
existing.salePrice = fromCents(toCents(item.salePrice));
if (item.unit) existing.unit = item.unit;
if (item.category) existing.category = item.category;
if (!existing.originalCount) existing.originalCount = existing.count;
} else {
products.push({ id: Date.now() + Math.random(), title: item.title, productCode: item.productCode, purchasePrice: fromCents(toCents(item.purchasePrice)), salePrice: fromCents(toCents(item.salePrice)), unit: item.unit, count: item.quantity, originalCount: item.quantity, category: item.category, createdAt: new Date().toLocaleDateString('ar-EG') });
}
purchases.push({ id: Date.now() + Math.random(), productId: existing ? existing.id : products[products.length - 1].id, title: item.title, productCode: item.productCode, category: item.category, unit: item.unit, purchasePrice: fromCents(toCents(item.purchasePrice)), salePrice: fromCents(toCents(item.salePrice)), count: item.quantity, total: item.value, supplier: supplierName, supplierPhone: supplierPhone, date: invoiceDate || new Date().toLocaleDateString('ar-EG'), paymentType: paymentType });
});
if (paymentType === 'credit') {
let supplierCredit = supplierCredits.find(s => s.name === supplierName);
if (supplierCredit) {
supplierCredit.total = safeAddMoney(supplierCredit.total, totalInvoice);
supplierCredit.remaining = safeAddMoney(supplierCredit.remaining, totalInvoice);
} else {
supplierCredits.push({
name: supplierName,
phone: supplierPhone,
total: totalInvoice,
paid: 0,
remaining: totalInvoice
});
}
} else {
addTreasuryTransaction('out', totalInvoice, `شراء من ${supplierName}`, 'الخزينة', supplierName, 'سداد فواتير مشتريات', true);
}
saveData();
renderAll();
renderTreasury();
renderDashboardStats();
updateDashboardCharts();
loadReturnProducts();
purchaseItems = [];
renderPurchaseItems();
document.getElementById('purchaseSupplierName').value = '';
document.getElementById('purchaseSupplierPhone').value = '';
document.getElementById('purchaseInvoiceDate').value = new Date().toISOString().split('T')[0];
alert(`تم حفظ فاتورة المشتريات (${paymentType === 'cash' ? 'نقدي' : 'آجل'}) بقيمة ${formatNumber(totalInvoice)} جنيه`);
addActivity('purchase', `شراء من ${supplierName}`, formatNumber(totalInvoice) + ' جنيه');
}
function saveInvoice() {
const customerName = document.getElementById('invoiceCustomerName').value.trim();
const customerPhone = document.getElementById('invoiceCustomerPhone').value.trim();
const invoiceDate = document.getElementById('invoiceDate').value;
const paymentType = document.getElementById('salePaymentType').value;
const employeeName = document.getElementById('saleEmployeeInput').value;
if (!customerName || saleItems.length === 0) { alert('يجب إدخال اسم العميل وإضافة منتج واحد على الأقل'); return; }
if (!employeeName) { alert('يجب اختيار الموظف المسؤول عن البيع'); return; }

const selectedEmployee = employees.find(e => e.name === employeeName);
const employeeId = selectedEmployee ? selectedEmployee.id : '';
const employeeNameText = selectedEmployee ? selectedEmployee.name : 'غير محدد';

let totalInvoice = 0;
let totalCOGS = 0;
saleItems.forEach(item => {
totalInvoice = safeAddMoney(totalInvoice, item.value);
totalCOGS = safeAddMoney(totalCOGS, item.cogs);
const product = products.find(p => p.id === item.productId);
if (product) { product.count -= item.quantity; }
invoices.push({
id: Date.now() + Math.random(),
customerName: customerName,
customerPhone: customerPhone,
employeeId: employeeId,
employeeName: employeeNameText,
productId: item.productId,
productName: item.title,
productCode: item.productCode,
unit: item.unit,
salePrice: item.salePrice,
purchasePrice: item.purchasePrice,
quantity: item.quantity,
total: item.value,
cogs: item.cogs,
profit: safeSubtractMoney(item.value, item.cogs),
date: invoiceDate || new Date().toLocaleDateString('ar-EG'),
paymentType: paymentType
});
});
if (paymentType === 'credit') {
let customerCredit = customerCredits.find(c => c.name === customerName);
if (customerCredit) {
customerCredit.total = safeAddMoney(customerCredit.total, totalInvoice);
customerCredit.remaining = safeAddMoney(customerCredit.remaining, totalInvoice);
} else {
customerCredits.push({
name: customerName,
phone: customerPhone,
total: totalInvoice,
paid: 0,
remaining: totalInvoice
});
}
} else {
addTreasuryTransaction('in', totalInvoice, `مبيعات للعميل ${customerName}`, customerName, 'الخزينة', 'مبيعات', true);
}
if (employeeId && paymentType === 'cash') {
const employee = employees.find(e => e.id == employeeId);
if (employee) {
const commissionAmount = safeMultiplyMoney(totalInvoice, employee.commissionRate / 100);
employee.commissionBalance = safeAddMoney(employee.commissionBalance || 0, commissionAmount);
showCommissionNotification('إضافة عمولة', commissionAmount, employee.commissionBalance);
}
}
saveData();
renderAll();
renderTreasury();
renderDashboardStats();
updateDashboardCharts();
renderEmployeeAnalysis();
loadReturnProducts();
saleItems = [];
renderSaleItems();
['invoiceCustomerName', 'invoiceCustomerPhone'].forEach(id => document.getElementById(id).value = '');
document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
alert(`تم حفظ فاتورة المبيعات (${paymentType === 'cash' ? 'نقدي' : 'آجل'}) بقيمة ${formatNumber(totalInvoice)} جنيه`);
addActivity('sale', `مبيعات للعميل ${customerName}`, formatNumber(totalInvoice) + ' جنيه');
}
// ============================================
// ✅ الموظفين والعمولات
// ============================================
function saveEmployee() {
const name = document.getElementById('empName').value.trim();
const nationalId = document.getElementById('empNationalId').value.trim();
const phone = document.getElementById('empPhone').value.trim();
const job = document.getElementById('empJob').value.trim();
const salary = parseFloat(document.getElementById('empSalary').value) || 0;
const incentives = parseFloat(document.getElementById('empIncentives').value) || 0;
const allowances = parseFloat(document.getElementById('empAllowances').value) || 0;
const bonuses = parseFloat(document.getElementById('empBonuses').value) || 0;
const commissionRate = parseFloat(document.getElementById('empCommissionRate').value) || 0;
if (!name || !nationalId || !phone || !job) { alert('بيانات ناقصة'); return; }
const netSalary = safeAddMoney(salary, incentives, allowances, bonuses);
if (editingEmployeeId) {
const empIndex = employees.findIndex(e => e.id === editingEmployeeId);
if (empIndex !== -1) {
employees[empIndex] = {...employees[empIndex], name, nationalId, phone, job, salary: fromCents(toCents(salary)), incentives: fromCents(toCents(incentives)), allowances: fromCents(toCents(allowances)), bonuses: fromCents(toCents(bonuses)), commissionRate, netSalary };
alert(`تم تحديث بيانات الموظف: ${name}`);
}
editingEmployeeId = null;
resetEmployeeForm();
} else {
employees.push({
id: Date.now(),
name,
nationalId,
phone,
job,
salary: fromCents(toCents(salary)),
incentives: fromCents(toCents(incentives)),
allowances: fromCents(toCents(allowances)),
bonuses: fromCents(toCents(bonuses)),
commissionRate,
netSalary,
commissionBalance: 0,
createdAt: new Date().toLocaleDateString('ar-EG')
});
alert(`تم إضافة الموظف: ${name}`);
}
saveData();
renderEmployees();
renderDashboardStats();
updateDashboardCharts();
renderEmployeesDropdown();
resetEmployeeForm();
}
function editEmployee(id) {
const emp = employees.find(e => e.id === id);
if (!emp) return;
document.getElementById('empName').value = emp.name;
document.getElementById('empNationalId').value = emp.nationalId;
document.getElementById('empPhone').value = emp.phone;
document.getElementById('empJob').value = emp.job;
document.getElementById('empSalary').value = emp.salary;
document.getElementById('empIncentives').value = emp.incentives || 0;
document.getElementById('empAllowances').value = emp.allowances || 0;
document.getElementById('empBonuses').value = emp.bonuses || 0;
document.getElementById('empCommissionRate').value = emp.commissionRate || 0;
editingEmployeeId = id;
document.getElementById('employeeFormTitle').innerHTML = '<i class="fas fa-user-edit"></i> تعديل بيانات الموظف';
document.getElementById('saveEmployeeBtnText').textContent = 'تحديث البيانات';
document.getElementById('saveEmployeeBtn').classList.add('btn-warning');
document.getElementById('cancelEditBtn').style.display = 'block';
document.querySelector('#employees .form-container').scrollIntoView({ behavior: 'smooth' });
}
function deleteEmployee(id) {
const emp = employees.find(e => e.id === id);
if (!emp) return;
if (confirm(`هل أنت متأكد من حذف الموظف "${emp.name}"؟`)) {
employees = employees.filter(e => e.id !== id);
saveData();
renderEmployees();
renderDashboardStats();
updateDashboardCharts();
renderEmployeesDropdown();
alert(`تم حذف الموظف: ${emp.name}`);
}
}
function resetEmployeeForm() {
editingEmployeeId = null;
document.getElementById('empName').value = '';
document.getElementById('empNationalId').value = '';
document.getElementById('empPhone').value = '';
document.getElementById('empJob').value = '';
document.getElementById('empSalary').value = '';
document.getElementById('empIncentives').value = '';
document.getElementById('empAllowances').value = '';
document.getElementById('empBonuses').value = '';
document.getElementById('empCommissionRate').value = '';
document.getElementById('employeeFormTitle').innerHTML = '<i class="fas fa-user-plus"></i> إضافة موظف';
document.getElementById('saveEmployeeBtnText').textContent = 'حفظ الموظف';
document.getElementById('saveEmployeeBtn').classList.remove('btn-warning');
document.getElementById('cancelEditBtn').style.display = 'none';
}
function renderEmployees() {
const tbody = document.getElementById('employeesList');
tbody.innerHTML = '';
employees.forEach((emp, idx) => {
tbody.innerHTML += `<tr><td>${idx + 1}</td><td>${emp.name}</td><td>${emp.nationalId}</td><td>${emp.phone}</td><td>${emp.job}</td><td><span class="price">${formatNumber(emp.netSalary)}</span></td><td>${emp.commissionRate}%</td><td><span class="count">${formatNumber(emp.commissionBalance || 0)}</span></td><td class="actions-cell"><button class="action-btn btn-edit" onclick="editEmployee(${emp.id})" title="تعديل"><i class="fas fa-edit"></i></button><button class="action-btn btn-delete" onclick="deleteEmployee(${emp.id})" title="حذف"><i class="fas fa-trash"></i></button></td></tr>`;
});
}
document.getElementById('cancelEditBtn').addEventListener('click', resetEmployeeForm);
// ============================================
// ✅ المخزون والإحصائيات
// ============================================
function renderInventory() {
const tbody = document.getElementById('inventoryList');
tbody.innerHTML = '';
products.forEach(p => {
const totalIn = purchases.filter(item => item.productId === p.id).reduce((sum, item) => sum + (item.count || 0), 0);
const totalSold = invoices.filter(item => item.productId === p.id).reduce((sum, item) => sum + (item.quantity || 0), 0);
const totalReturned = salesReturns.filter(item => item.productId === p.id).reduce((sum, item) => sum + (item.quantity || 0), 0);
const totalOut = totalSold - totalReturned;
const available = p.count || 0;
const totalValue = safeMultiplyMoney(available, p.purchasePrice || 0);
tbody.innerHTML += `<tr><td>${p.productCode || p.id}</td><td>${p.title}</td><td>${p.unit || 'قطعة'}</td><td>${formatNumber(p.purchasePrice)}</td><td>${formatNumber(p.salePrice)}</td><td style="color: var(--income); font-weight:bold;">${totalIn}</td><td style="color: var(--expense); font-weight:bold;">${totalOut}</td><td style="color: var(--success); font-weight:bold;">${available}</td><td style="color: var(--warning); font-weight:bold;">${formatNumber(totalValue)}</td></tr>`;
});
}
function renderSales() {
const tbody = document.getElementById('salesList');
tbody.innerHTML = '';
invoices.forEach((inv, idx) => {
const payText = inv.paymentType === 'cash' ? '<span style="color:var(--success)">نقدي</span>' : '<span style="color:var(--warning)">آجل</span>';
const empName = inv.employeeName || 'غير محدد';
tbody.innerHTML += `<tr><td>${idx + 1}</td><td>${inv.productCode || '—'}</td><td>${inv.productName}</td><td>${inv.customerName}</td><td>${empName}</td><td>${inv.quantity}</td><td><span class="price">${formatNumber(inv.total)}</span></td><td>${payText}</td><td>${inv.date}</td></tr>`;
});
}
function renderPurchases() {
const tbody = document.getElementById('purchasesList');
tbody.innerHTML = '';
purchases.forEach((pur, idx) => {
const payText = pur.paymentType === 'cash' ? '<span style="color:var(--success)">نقدي</span>' : '<span style="color:var(--warning)">آجل</span>';
tbody.innerHTML += `<tr><td>${idx + 1}</td><td>${pur.productCode || '—'}</td><td>${pur.title}</td><td>${formatNumber(pur.purchasePrice)}</td><td>${formatNumber(pur.salePrice)}</td><td>${pur.count}</td><td><span class="price">${formatNumber(pur.total)}</span></td><td>${pur.supplier || '—'}</td><td>${pur.supplierPhone || '—'}</td><td>${payText}</td><td>${pur.date}</td></tr>`;
});
}
function renderSalesReturns() {
const tbody = document.getElementById('salesReturnsList');
tbody.innerHTML = '';
salesReturns.forEach((ret, idx) => {
const conditionText = ret.condition === 'damaged' ? '<span style="color:var(--danger)">تالف</span>' : '<span style="color:var(--success)">جيد</span>';
tbody.innerHTML += `<tr><td>${idx + 1}</td><td>${ret.productName}</td><td>${ret.productCode || '—'}</td><td>${ret.unit || '—'}</td><td>${formatNumber(ret.returnPrice)}</td><td>${ret.quantity}</td><td>${conditionText}</td><td>${ret.date}</td></tr>`;
});
}
function renderPurchaseReturns() {
const tbody = document.getElementById('purchaseReturnsList');
tbody.innerHTML = '';
purchaseReturns.forEach((ret, idx) => {
tbody.innerHTML += `<tr><td>${idx + 1}</td><td>${ret.productName}</td><td>${ret.productCode || '—'}</td><td>${ret.unit || '—'}</td><td>${formatNumber(ret.returnPrice)}</td><td>${ret.quantity}</td><td>${ret.date}</td></tr>`;
});
}
// ============================================
// ✅ لوحة التحكم - الإحصائيات
// ============================================
function renderDashboardStats() {
const totalSales = invoices.reduce((s, i) => safeAddMoney(s, i.total), 0);
const totalSalesReturns = salesReturns.reduce((s, r) => safeAddMoney(s, safeMultiplyMoney(r.returnPrice, r.quantity)), 0);
const netSales = safeSubtractMoney(totalSales, totalSalesReturns);
const totalPurchases = purchases.reduce((s, p) => safeAddMoney(s, p.total), 0);
const totalPurchaseReturns = purchaseReturns.reduce((s, r) => safeAddMoney(s, safeMultiplyMoney(r.returnPrice, r.quantity)), 0);
const netPurchases = safeSubtractMoney(totalPurchases, totalPurchaseReturns);
const totalCOGS = invoices.reduce((s, i) => safeAddMoney(s, i.cogs || safeMultiplyMoney(i.quantity, i.purchasePrice || 0)), 0);
const totalReturnsCOGS = salesReturns.reduce((s, r) => safeAddMoney(s, r.cogs || 0), 0);
const netCOGS = safeSubtractMoney(totalCOGS, totalReturnsCOGS);
const totalExpenses = treasuryDB.transactions.filter(t => t.type === 'صادر' && t.category !== 'سداد فواتير مشتريات').reduce((s, t) => safeAddMoney(s, t.amount), 0);
const grossProfit = safeSubtractMoney(netSales, netCOGS);
const netProfit = safeSubtractMoney(grossProfit, totalExpenses);
document.getElementById('totalSales').textContent = formatNumber(netSales);
document.getElementById('cogs').textContent = formatNumber(netCOGS);
document.getElementById('totalPurchases').textContent = formatNumber(netPurchases);
document.getElementById('grossProfit').textContent = formatNumber(grossProfit);
document.getElementById('totalExpenses').textContent = formatNumber(totalExpenses);
document.getElementById('netProfit').textContent = formatNumber(netProfit);
document.getElementById('dashTreasury').textContent = formatNumber(treasuryDB.balance);
const profitMargin = netSales > 0 ? ((netProfit / netSales) * 100).toFixed(2) : 0;
document.getElementById('profitMargin').textContent = profitMargin + '%';
const inventoryMetrics = calculateInventoryMetrics();
document.getElementById('inventoryTurnover').textContent = inventoryMetrics.turnover;
const uniqueCustomers = [...new Set(invoices.map(i => i.customerName))].length;
document.getElementById('totalCustomers').textContent = uniqueCustomers;
document.getElementById('totalEmployees').textContent = employees.length;
}
function renderAll() {
renderDashboardStats();
renderSales();
renderSalesReturns();
renderPurchases();
renderPurchaseReturns();
renderInventory();
renderEmployees();
loadReturnProducts();
}
function saveData() {
localStorage.setItem('erp_products', JSON.stringify(products));
localStorage.setItem('erp_deleted', JSON.stringify(deletedProducts));
localStorage.setItem('erp_invoices', JSON.stringify(invoices));
localStorage.setItem('erp_purchases', JSON.stringify(purchases));
localStorage.setItem('erp_sales_returns', JSON.stringify(salesReturns));
localStorage.setItem('erp_purchase_returns', JSON.stringify(purchaseReturns));
localStorage.setItem('erp_employees', JSON.stringify(employees));
localStorage.setItem('erp_attendance', JSON.stringify(attendanceDB));
localStorage.setItem('erp_treasury', JSON.stringify(treasuryDB));
localStorage.setItem('erp_customerCredits', JSON.stringify(customerCredits));
localStorage.setItem('erp_supplierCredits', JSON.stringify(supplierCredits));
}
// ============================================
// ✅ الرسوم البيانية
// ============================================
function updateDashboardCharts() {
const totalSales = invoices.reduce((s, i) => safeAddMoney(s, i.total), 0);
const totalSalesReturns = salesReturns.reduce((s, r) => safeAddMoney(s, safeMultiplyMoney(r.returnPrice, r.quantity)), 0);
const netSales = safeSubtractMoney(totalSales, totalSalesReturns);
const totalPurchases = purchases.reduce((s, p) => safeAddMoney(s, p.total), 0);
const totalCOGS = invoices.reduce((s, i) => safeAddMoney(s, i.cogs || safeMultiplyMoney(i.quantity, i.purchasePrice || 0)), 0);
const totalReturnsCOGS = salesReturns.reduce((s, r) => safeAddMoney(s, r.cogs || 0), 0);
const netCOGS = safeSubtractMoney(totalCOGS, totalReturnsCOGS);
const totalExpenses = treasuryDB.transactions.filter(t => t.type === 'صادر' && t.category !== 'سداد فواتير مشتريات').reduce((s, t) => safeAddMoney(s, t.amount), 0);
const grossProfit = safeSubtractMoney(netSales, netCOGS);
const netProfit = safeSubtractMoney(grossProfit, totalExpenses);
const chartColors = ['#f59e0b', '#10b981', '#64748b', '#ef4444', '#8b5cf6', '#0ea5e9', '#059669', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#a855f7'];
const chartLabels = ['رصيد الخزينة', 'صافي المبيعات', 'تكلفة البضاعة', 'المشتريات', 'المصاريف', 'مجمل الربح', 'صافي الربح', 'هامش الربح', 'دورة المخزون', 'العملاء', 'الموظفين'];
const chartDataValues = [treasuryDB.balance, netSales, netCOGS, totalPurchases, totalExpenses, grossProfit, netProfit, parseFloat(document.getElementById('profitMargin').textContent), parseFloat(document.getElementById('inventoryTurnover').textContent) || 0, parseInt(document.getElementById('totalCustomers').textContent), employees.length];
// Chart 1: Bar Chart
const ctx1 = document.getElementById('mainStatsBarChart');
if (ctx1) {
const context1 = ctx1.getContext('2d');
if (charts.mainBar) charts.mainBar.destroy();
charts.mainBar = new Chart(context1, {
type: 'bar',
data: {
labels: chartLabels.slice(0, 7),
datasets: [{
label: 'الأداء المالي',
data: chartDataValues.slice(0, 7),
backgroundColor: chartColors.slice(0, 7),
borderRadius: 8,
borderWidth: 0
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { display: false },
tooltip: {
callbacks: {
label: function(context) {
return context.label + ': ' + formatNumber(context.raw) + ' جنيه';
}
}
}
},
scales: {
y: {
grid: { color: 'rgba(255,255,255,0.05)' },
ticks: {
color: '#94a3b8',
callback: function(value) {
return formatNumber(value);
}
}
},
x: {
grid: { display: false },
ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } }
}
}
}
});
}
// Chart 2: Doughnut Chart
const ctx2 = document.getElementById('mainStatsDoughnutChart');
if (ctx2) {
const context2 = ctx2.getContext('2d');
if (charts.mainDoughnut) charts.mainDoughnut.destroy();
const allValues = chartDataValues.slice(0, 7).filter(v => v > 0);
const allLabels = chartLabels.slice(0, 7).filter((_, i) => chartDataValues.slice(0, 7)[i] > 0);
const allColors = chartColors.slice(0, 7).filter((_, i) => chartDataValues.slice(0, 7)[i] > 0);
charts.mainDoughnut = new Chart(context2, {
type: 'doughnut',
data: {
labels: allLabels,
datasets: [{
data: allValues,
backgroundColor: allColors,
borderWidth: 0,
hoverOffset: 10
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: {
position: 'bottom',
labels: { color: '#94a3b8', padding: 10, font: { size: 10 } }
}
},
cutout: '55%'
}
});
}
// Chart 3: Sales Trend
const ctx3 = document.getElementById('salesTrendChart');
if (ctx3) {
const context3 = ctx3.getContext('2d');
if (charts.salesTrend) charts.salesTrend.destroy();
const gradient3 = context3.createLinearGradient(0, 0, 0, 400);
gradient3.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
gradient3.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
const currentYear = new Date().getFullYear();
const monthlyNetSales = new Array(12).fill(0);
const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
invoices.forEach(inv => {
const dateInfo = parseInvoiceDate(inv.date);
if (dateInfo.year === currentYear && dateInfo.month >= 0 && dateInfo.month < 12) {
const netSales = getNetSalesFromInvoice(inv);
monthlyNetSales[dateInfo.month] = safeAddMoney(monthlyNetSales[dateInfo.month], netSales);
}
});
charts.salesTrend = new Chart(context3, {
type: 'line',
data: {
labels: monthNames,
datasets: [{
label: 'صافي المبيعات الشهرية',
data: monthlyNetSales,
borderColor: '#10b981',
backgroundColor: gradient3,
fill: true,
tension: 0.4
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { labels: { color: '#94a3b8', font: { size: 10 } } }
},
scales: {
y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
}
}
});
}
// Chart 4: Category Performance
const ctx4 = document.getElementById('categoryPerformanceChart');
if (ctx4) {
const context4 = ctx4.getContext('2d');
if (charts.categoryPerformance) charts.categoryPerformance.destroy();
const categories = {};
purchases.forEach(p => { const cat = p.category || 'غير مصنف'; categories[cat] = safeAddMoney(categories[cat] || 0, p.total); });
const catLabels = Object.keys(categories).slice(0, 5);
const catData = catLabels.map(c => categories[c]);
charts.categoryPerformance = new Chart(context4, {
type: 'pie',
data: {
labels: catLabels,
datasets: [{
data: catData,
backgroundColor: chartColors.slice(0, 5),
borderWidth: 0
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 8, font: { size: 10 } } }
}
}
});
}
// Chart 5: Cash Flow Chart
const ctx5 = document.getElementById('cashFlowChart');
if (ctx5) {
const context5 = ctx5.getContext('2d');
if (charts.cashFlow) charts.cashFlow.destroy();
const gradient5 = context5.createLinearGradient(0, 0, 0, 400);
gradient5.addColorStop(0, 'rgba(245, 158, 11, 0.5)');
gradient5.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
const gradientIncome = context5.createLinearGradient(0, 0, 0, 400);
gradientIncome.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
gradientIncome.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
const recentTransactions = treasuryDB.transactions.slice(0, 15).reverse();
const labels = recentTransactions.map((t, i) => `حركة ${i + 1}`);
const incomeData = recentTransactions.map(t => t.type === 'وارد' ? t.amount : null);
const expenseData = recentTransactions.map(t => t.type === 'صادر' ? t.amount : null);
const balanceData = recentTransactions.map(t => t.balance);
charts.cashFlow = new Chart(context5, {
type: 'line',
data: {
labels: labels,
datasets: [
{
label: 'الرصيد',
data: balanceData,
borderColor: '#0ea5e9',
backgroundColor: 'rgba(14, 165, 233, 0.1)',
fill: true,
tension: 0.4,
yAxisID: 'y',
pointRadius: 4,
pointHoverRadius: 6
},
{
label: 'وارد',
data: incomeData,
borderColor: '#10b981',
backgroundColor: gradientIncome,
fill: true,
tension: 0.4,
yAxisID: 'y1',
pointRadius: 3,
spanGaps: true
},
{
label: 'صادر',
data: expenseData,
borderColor: '#ef4444',
backgroundColor: 'rgba(239, 68, 68, 0.0)',
fill: false,
tension: 0.4,
yAxisID: 'y1',
pointRadius: 3,
spanGaps: true,
borderDash: [5, 5]
}
]
},
options: {
responsive: true,
maintainAspectRatio: false,
interaction: {
mode: 'index',
intersect: false,
},
plugins: {
legend: {
labels: { color: '#94a3b8', font: { size: 10 } }
},
tooltip: {
callbacks: {
label: function(context) {
if (context.raw === null || context.raw === undefined) return null;
return context.dataset.label + ': ' + formatNumber(context.raw) + ' جنيه';
}
}
}
},
scales: {
y: {
type: 'linear',
display: true,
position: 'left',
grid: { color: 'rgba(255,255,255,0.05)' },
ticks: { color: '#0ea5e9', callback: v => formatNumber(v) },
title: { display: true, text: 'الرصيد', color: '#0ea5e9' }
},
y1: {
type: 'linear',
display: true,
position: 'right',
grid: { drawOnChartArea: false },
ticks: { color: '#94a3b8', callback: v => formatNumber(v) },
title: { display: true, text: 'الحركات', color: '#94a3b8' }
},
x: {
grid: { display: false },
ticks: { color: '#94a3b8' }
}
}
}
});
}
// Chart 6: Monthly Comparison
const ctx6 = document.getElementById('monthlyComparisonChart');
if (ctx6) {
const context6 = ctx6.getContext('2d');
if (charts.monthlyComparison) charts.monthlyComparison.destroy();
charts.monthlyComparison = new Chart(context6, {
type: 'bar',
data: {
labels: ['صافي المبيعات', 'المشتريات', 'المصاريف', 'الأرباح'],
datasets: [{
label: 'مقارنة شهرية',
data: [netSales, totalPurchases, totalExpenses, netProfit],
backgroundColor: ['#10b981', '#ef4444', '#8b5cf6', '#059669'],
borderRadius: 8,
borderWidth: 0
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: { legend: { display: false } },
scales: {
y: {
grid: { color: 'rgba(255,255,255,0.05)' },
ticks: {
color: '#94a3b8',
callback: function(value) {
return formatNumber(value);
}
}
},
x: {
grid: { display: false },
ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } }
}
}
}
});
}
}
// ============================================
// ✅ التنبيهات النشطة
// ============================================
function renderAlerts() {
const alertsList = document.getElementById('alertsList');
alertsList.innerHTML = '';
const alerts = [];
products.filter(p => p.originalCount && p.count <= p.originalCount * 0.10).forEach(p => {
const percent = ((p.count / p.originalCount) * 100).toFixed(0);
alerts.push({ type: 'warning', text: `⚠️ المنتج "${p.title}" وصل لـ ${percent}% فقط من الكمية الأصلية (${p.count} من ${p.originalCount})`, time: 'الآن' });
});
if (treasuryDB.balance < 1000) { alerts.push({ type: 'danger', text: `رصيد الخزينة منخفض: ${formatNumber(treasuryDB.balance)} جنيه`, time: 'الآن' }); }
if (salesReturns.length > 5) { alerts.push({ type: 'warning', text: `عدد مرتجعات المبيعات مرتفع: ${salesReturns.length}`, time: 'اليوم' }); }
if (alerts.length === 0) { alerts.push({ type: 'success', text: 'لا توجد تنبيهات - النظام يعمل بشكل مثالي', time: 'الآن' }); }
alerts.slice(0, 5).forEach(alert => {
const alertHTML = `<div class="alert-item ${alert.type}"><i class="fas fa-${alert.type === 'warning' ? 'exclamation-triangle' : alert.type === 'danger' ? 'times-circle' : alert.type === 'success' ? 'check-circle' : 'info-circle'}"></i><span class="alert-text">${alert.text}</span><span class="alert-time">${alert.time}</span></div>`;
alertsList.innerHTML += alertHTML;
});
}
function startActiveAlerts() {
if (alertTimer) clearInterval(alertTimer);
renderAlerts();
alertTimer = setInterval(() => { renderAlerts(); }, 5000);
}
function addActivity(type, text, amount) {
recentActivity.unshift({ type, text, amount, time: new Date().toLocaleTimeString('ar-EG') });
if (recentActivity.length > 10) recentActivity.pop();
renderActivityFeed();
}
function renderActivityFeed() {
const activityList = document.getElementById('activityList');
activityList.innerHTML = '';
if (recentActivity.length === 0) { activityList.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px;">لا يوجد نشاط حديث</p>'; return; }
recentActivity.slice(0, 5).forEach(activity => {
const activityHTML = `<div class="activity-item ${activity.type}"><div class="activity-icon"><i class="fas fa-${activity.type === 'sale' ? 'shopping-cart' : activity.type === 'purchase' ? 'truck' : 'wallet'}"></i></div><div class="activity-details"><strong>${activity.text}</strong><br><span style="color:var(--accent)">${activity.amount}</span></div><div class="activity-time">${activity.time}</div></div>`;
activityList.innerHTML += activityHTML;
});
}
// ============================================
// ✅ الطباعة
// ============================================
function printCurrentSection() {
updateDashboardCharts();
setTimeout(() => { window.print(); }, 500);
}
function printComprehensive() {
document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
const sectionsToPrint = ['dashboard', 'treasury', 'purchases', 'sales', 'salesAnalysis', 'inventory', 'employees'];
sectionsToPrint.forEach(sectionId => {
document.getElementById(sectionId).classList.add('active');
});
updateDashboardCharts();
renderEmployeeAnalysis();
setTimeout(() => {
window.print();
document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
document.getElementById(currentSection).classList.add('active');
}, 1000);
}
function sumByName() {
const searchTerm = prompt('أدخل اسم المنتج للبحث:');
if (!searchTerm) return;
const term = searchTerm.trim().toLowerCase();
let results = [];
let msg = '';
if (currentSection === 'sales') {
results = invoices.filter(inv => inv.productName.toLowerCase().includes(term));
if (results.length === 0) { alert('لا توجد نتائج'); return; }
const totalQty = results.reduce((s, i) => s + i.quantity, 0);
const totalAmount = results.reduce((s, i) => safeAddMoney(s, getNetSalesFromInvoice(i)), 0);
msg = `نتائج البحث في المبيعات عن: "${searchTerm}"
عدد الفواتير: ${results.length}
إجمالي الكمية: ${totalQty}
صافي المبلغ: ${formatNumber(totalAmount)}`;
} else if (currentSection === 'purchases') {
results = purchases.filter(p => p.title.toLowerCase().includes(term));
if (results.length === 0) { alert('لا توجد نتائج'); return; }
const totalQty = results.reduce((s, p) => s + p.count, 0);
const totalAmount = results.reduce((s, p) => safeAddMoney(s, p.total), 0);
msg = `نتائج البحث في المشتريات عن: "${searchTerm}"
عدد الفواتير: ${results.length}
إجمالي الكمية: ${totalQty}
إجمالي المبلغ: ${formatNumber(totalAmount)}`;
} else if (currentSection === 'inventory') {
results = products.filter(p => p.title.toLowerCase().includes(term));
if (results.length === 0) { alert('لا توجد نتائج'); return; }
const totalQty = results.reduce((s, p) => s + p.count, 0);
msg = `نتائج البحث في المخزون عن: "${searchTerm}"
عدد المنتجات: ${results.length}
إجمالي الكمية: ${totalQty}`;
} else {
alert('هذه الميزة متاحة في: المبيعات، المشتريات، المخزون');
return;
}
alert(msg);
}
function sumByCategory() {
const searchTerm = prompt('أدخل اسم الفئة للبحث:');
if (!searchTerm) return;
const term = searchTerm.trim().toLowerCase();
let results = [];
let msg = '';
if (currentSection === 'purchases') {
results = purchases.filter(p => p.category && p.category.toLowerCase().includes(term));
if (results.length === 0) { alert('لا توجد نتائج'); return; }
const totalQty = results.reduce((s, p) => s + p.count, 0);
const totalAmount = results.reduce((s, p) => safeAddMoney(s, p.total), 0);
msg = `نتائج البحث في المشتريات عن الفئة: "${searchTerm}"
عدد الفواتير: ${results.length}
إجمالي الكمية: ${totalQty}
إجمالي المبلغ: ${formatNumber(totalAmount)}`;
} else if (currentSection === 'inventory') {
results = products.filter(p => p.category && p.category.toLowerCase().includes(term));
if (results.length === 0) { alert('لا توجد نتائج'); return; }
const totalQty = results.reduce((s, p) => s + p.count, 0);
const totalValue = results.reduce((s, p) => safeAddMoney(s, safeMultiplyMoney(p.purchasePrice || 0, p.count)), 0);
msg = `نتائج البحث في المخزون عن الفئة: "${searchTerm}"
عدد المنتجات: ${results.length}
إجمالي الكمية: ${totalQty}
القيمة: ${formatNumber(totalValue)}`;
} else {
alert('هذه الميزة متاحة في: المشتريات، المخزون');
return;
}
alert(msg);
}
// ============================================
// ✅ الاستعلامات
// ============================================
function openInquiryModal() {
document.getElementById('inquiryModal').classList.add('active');
document.querySelectorAll('.inquiry-form').forEach(f => f.classList.remove('active'));
document.getElementById('inquiryResult').classList.remove('active');
document.getElementById('inquiryFormTreasury').classList.add('active');
}
function closeInquiryModal() {
document.getElementById('inquiryModal').classList.remove('active');
}
function showInquiryForm(type) {
document.querySelectorAll('.inquiry-form').forEach(f => f.classList.remove('active'));
document.getElementById('inquiryResult').classList.remove('active');
document.getElementById(`inquiryForm${type.charAt(0).toUpperCase() + type.slice(1)}`).classList.add('active');
}
function executeEmployeeInquiry() {
const name = document.getElementById('inquiryEmpName').value.trim().toLowerCase();
const month = parseInt(document.getElementById('inquiryEmpMonth').value);
const year = parseInt(document.getElementById('inquiryEmpYear').value) || new Date().getFullYear();
if (!name) { alert('أدخل اسم الموظف'); return; }
const emp = employees.find(e => e.name.toLowerCase().includes(name));
if (!emp) {
document.getElementById('inquiryResult').innerHTML = '<p>لم يتم العثور على الموظف</p>';
document.getElementById('inquiryResult').classList.add('active');
return;
}
const key = `${emp.id}_${year}_${month - 1}`;
const record = attendanceDB[key] || { days: [], deduction: 0, paid: false, finalSalary: 0 };
const daysInMonth = getDaysInMonth(year, month - 1);
let presentCount = 0, absentCount = 0;
for (let i = 1; i <= daysInMonth; i++) {
if (record.days[i] === 'present') presentCount++;
if (record.days[i] === 'absent') absentCount++;
}
const empInvoices = invoices.filter(inv => {
const dateInfo = parseInvoiceDate(inv.date);
return inv.employeeName === emp.name && dateInfo.month == (month - 1) && dateInfo.year == year;
});
let totalNetSales = 0;
let totalProfit = 0;
empInvoices.forEach(inv => {
const netSales = getNetSalesFromInvoice(inv);
totalNetSales = safeAddMoney(totalNetSales, netSales);
const returnedQty = getReturnedQuantityFromInvoice(inv.id);
const netQty = inv.quantity - returnedQty;
const netCOGS = safeMultiplyMoney(inv.purchasePrice || 0, netQty > 0 ? netQty : 0);
totalProfit = safeAddMoney(totalProfit, safeSubtractMoney(netSales, netCOGS));
});
const companyTotalNetSales = invoices.reduce((sum, inv) => {
const dateInfo = parseInvoiceDate(inv.date);
if (dateInfo.month == (month - 1) && dateInfo.year == year) {
return safeAddMoney(sum, getNetSalesFromInvoice(inv));
}
return sum;
}, 0);
const contribution = companyTotalNetSales > 0 ? ((totalNetSales / companyTotalNetSales) * 100).toFixed(1) : 0;
const commission = calculateEmployeeCommission(emp.name, month - 1, year);
const level = getPerformanceLevel(parseFloat(contribution));
const netDue = safeAddMoney(emp.salary, commission, emp.incentives || 0, emp.allowances || 0, emp.bonuses || 0);
const finalDue = safeSubtractMoney(netDue, record.deduction || 0);
const result = `
<div style="display:grid; grid-template-columns:repeat(2,1fr); gap:15px; margin-bottom:20px;">
<div style="background:rgba(14,165,233,0.1); padding:15px; border-radius:10px; border:1px solid var(--accent);">
<h4 style="color:var(--accent); margin-bottom:10px;"><i class="fas fa-user"></i> بيانات الموظف</h4>
<p><strong>الاسم:</strong> ${emp.name}</p>
<p><strong>الرقم القومي:</strong> ${emp.nationalId}</p>
<p><strong>الوظيفة:</strong> ${emp.job}</p>
<p><strong>الهاتف:</strong> ${emp.phone}</p>
</div>
<div style="background:rgba(34,197,94,0.1); padding:15px; border-radius:10px; border:1px solid var(--success);">
<h4 style="color:var(--success); margin-bottom:10px;"><i class="fas fa-chart-line"></i> أداء المبيعات</h4>
<p><strong>عدد الفواتير:</strong> ${empInvoices.length}</p>
<p><strong>صافي المبيعات:</strong> ${formatNumber(totalNetSales)} ج.م</p>
<p><strong>إجمالي الربح:</strong> ${formatNumber(totalProfit)} ج.م</p>
<p><strong>نسبة المساهمة:</strong> ${contribution}%</p>
</div>
</div>
<div style="background:rgba(245,158,11,0.1); padding:15px; border-radius:10px; border:1px solid var(--warning); margin-bottom:15px;">
<h4 style="color:var(--warning); margin-bottom:10px;"><i class="fas fa-coins"></i> البيانات المالية</h4>
<p><strong>الراتب الأساسي:</strong> ${formatNumber(emp.salary)} ج.م</p>
<p><strong>العمولة (${emp.commissionRate}%):</strong> ${formatNumber(commission)} ج.م</p>
<p><strong>الحوافز + البدلات:</strong> ${formatNumber(safeAddMoney(emp.incentives||0, emp.allowances||0, emp.bonuses||0))} ج.م</p>
<p><strong>الخصم:</strong> ${formatNumber(record.deduction||0)} ج.م</p>
<p style="font-size:16px; font-weight:bold; margin-top:10px;"><strong>الصافي المستحق:</strong> <span style="color:var(--success)">${formatNumber(finalDue)} ج.م</span></p>
</div>
<div style="background:rgba(100,116,139,0.1); padding:15px; border-radius:10px; border:1px solid var(--text-muted);">
<h4 style="color:var(--text-muted); margin-bottom:10px;"><i class="fas fa-calendar-check"></i> الحضور والغياب</h4>
<p><strong>أيام الحضور:</strong> <span style="color:var(--success)">${presentCount}</span></p>
<p><strong>أيام الغياب:</strong> <span style="color:var(--danger)">${absentCount}</span></p>
<p><strong>حالة الراتب:</strong> ${record.paid ? '<span style="color:var(--success)">تم الصرف</span>' : '<span style="color:var(--warning)">لم يُصرف</span>'}</p>
</div>
<div style="text-align:center; margin-top:20px; padding:15px; background:linear-gradient(135deg, ${level.class === 'performance-excellent' ? 'rgba(34,197,94,0.2)' : level.class === 'performance-good' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}); border-radius:10px; border:2px solid ${level.class === 'performance-excellent' ? 'var(--success)' : level.class === 'performance-good' ? 'var(--warning)' : 'var(--danger)'};">
<h3 style="margin-bottom:5px;">🎯 مستوى الأداء: <span style="font-size:20px;">${level.text}</span></h3>
<p style="color:var(--text-muted); font-size:13px;">${parseFloat(contribution) >= 30 ? 'موظف متميز - يستحق المكافأة والتقدير' : parseFloat(contribution) >= 15 ? 'أداء جيد - يحتاج لمزيد من التحفيز' : 'يحتاج لدعم وتدريب إضافي'}</p>
</div>
`;
document.getElementById('inquiryResult').innerHTML = result;
document.getElementById('inquiryResult').classList.add('active');
}
function executeClientInquiry() {
const name = document.getElementById('inquiryClientName').value.trim().toLowerCase();
if (!name) { alert('أدخل اسم العميل'); return; }
const clientInvoices = invoices.filter(inv => inv.customerName.toLowerCase().includes(name));
if (clientInvoices.length === 0) {
document.getElementById('inquiryResult').innerHTML = '<p>لم يتم العثور على هذا العميل</p>';
document.getElementById('inquiryResult').classList.add('active');
return;
}
const totalAmount = clientInvoices.reduce((s, i) => safeAddMoney(s, getNetSalesFromInvoice(i)), 0);
const totalQty = clientInvoices.reduce((s, i) => s + i.quantity, 0);
const phone = clientInvoices[0].customerPhone;
const credit = customerCredits.find(c => c.name.toLowerCase() === name);
const remaining = credit ? formatNumber(credit.remaining) : '0.00';
const result = `
<p><strong>اسم العميل:</strong> ${clientInvoices[0].customerName}</p>
<p><strong>رقم الهاتف:</strong> ${phone}</p>
<p><strong>عدد الفواتير:</strong> ${clientInvoices.length}</p>
<p><strong>إجمالي الكميات:</strong> ${totalQty}</p>
<p><strong>صافي المبالغ:</strong> ${formatNumber(totalAmount)} ج.م</p>
<p style="color:var(--warning); font-weight:bold; margin-top:10px;">
<i class="fas fa-hand-holding-usd"></i> المتبقي عليه (أجل): ${remaining} ج.م
</p>
`;
document.getElementById('inquiryResult').innerHTML = result;
document.getElementById('inquiryResult').classList.add('active');
}
function executeProductInquiry() {
const name = document.getElementById('inquiryProductName').value.trim().toLowerCase();
if (!name) { alert('أدخل اسم المنتج أو الكود'); return; }
const matchingProducts = products.filter(p => p.title.toLowerCase().includes(name) || (p.productCode && p.productCode.toLowerCase().includes(name)));
if (matchingProducts.length === 0) {
document.getElementById('inquiryResult').innerHTML = '<p>لم يتم العثور على هذا المنتج</p>';
document.getElementById('inquiryResult').classList.add('active');
return;
}
let result = '';
matchingProducts.forEach(p => {
const soldQty = invoices.filter(i => i.productId === p.id).reduce((s, i) => s + i.quantity, 0);
const returnedQty = salesReturns.filter(i => i.productId === p.id).reduce((s, i) => s + i.quantity, 0);
const netSold = soldQty - returnedQty;
result += `<p><strong>المنتج:</strong> ${p.title}</p><p><strong>الكود:</strong> ${p.productCode || '—'}</p><p><strong>الفئة:</strong> ${p.category || '—'}</p><p><strong>الكمية المتاحة:</strong> ${p.count}</p><p><strong>سعر الشراء:</strong> ${formatNumber(p.purchasePrice)} ج.م</p><p><strong>سعر البيع:</strong> ${formatNumber(p.salePrice)} ج.م</p><p><strong>الكمية المباعة:</strong> ${soldQty}</p><p><strong>الكمية المرتجعة:</strong> ${returnedQty}</p><p><strong>صافي المبيعات:</strong> ${netSold}</p><hr style="border-color:var(--border);margin:10px 0;">`;
});
document.getElementById('inquiryResult').innerHTML = result;
document.getElementById('inquiryResult').classList.add('active');
}
function executeTreasuryInquiry() {
const income = treasuryDB.transactions.filter(t => t.type === 'وارد').reduce((s, t) => safeAddMoney(s, t.amount), 0);
const expense = treasuryDB.transactions.filter(t => t.type === 'صادر').reduce((s, t) => safeAddMoney(s, t.amount), 0);
let result = `<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px; margin-bottom:20px;"><div style="background:rgba(245,158,11,0.1); padding:15px; border-radius:10px; text-align:center; border:1px solid var(--treasury);"><p style="color:var(--text-muted); font-size:12px; margin-bottom:5px;">الرصيد الحالي</p><span style="font-size:24px; font-weight:bold; color:var(--treasury);">${formatNumber(treasuryDB.balance)} ج.م</span></div><div style="background:rgba(16,185,129,0.1); padding:15px; border-radius:10px; text-align:center; border:1px solid var(--income);"><p style="color:var(--text-muted); font-size:12px; margin-bottom:5px;">إجمالي الوارد</p><span style="font-size:24px; font-weight:bold; color:var(--income);">${formatNumber(income)} ج.م</span></div><div style="background:rgba(239,68,68,0.1); padding:15px; border-radius:10px; text-align:center; border:1px solid var(--expense);"><p style="color:var(--text-muted); font-size:12px; margin-bottom:5px;">إجمالي الصادر</p><span style="font-size:24px; font-weight:bold; color:var(--expense);">${formatNumber(expense)} ج.م</span></div></div><h4 style="color:var(--accent); margin-bottom:15px;"><i class="fas fa-history"></i> سجل جميع الحركات:</h4>`;
if (treasuryDB.transactions.length > 0) {
result += `<table class="inquiry-table"><thead><tr><th>التاريخ</th><th>النوع</th><th>البيان</th><th>التصنيف</th><th>المسلم</th><th>المستلم</th><th>المبلغ</th><th>الرصيد</th></tr></thead><tbody>`;
treasuryDB.transactions.forEach(t => {
const color = t.type === 'وارد' ? 'var(--income)' : 'var(--expense)';
const sign = t.type === 'وارد' ? '+' : '-';
result += `<tr><td>${t.date}</td><td style="color:${color}; font-weight:bold;">${t.type}</td><td>${t.desc}</td><td>${t.category || 'عام'}</td><td>${t.payer}</td><td>${t.receiver}</td><td style="color:${color}; font-weight:bold;">${sign}${formatNumber(t.amount)}</td><td>${formatNumber(t.balance)}</td></tr>`;
});
result += `</tbody></table>`;
} else {
result += `<p style="text-align:center; color:var(--text-muted); padding:20px;">لا توجد حركات في الخزينة</p>`;
}
document.getElementById('inquiryResult').innerHTML = result;
document.getElementById('inquiryResult').classList.add('active');
}
function executeInvoiceInquiry() {
const name = document.getElementById('inquiryInvoiceName').value.trim().toLowerCase();
if (!name) { alert('أدخل اسم الفاتورة أو العميل'); return; }
const matchingInvoices = invoices.filter(inv => inv.customerName.toLowerCase().includes(name));
if (matchingInvoices.length === 0) {
document.getElementById('inquiryResult').innerHTML = '<p>لم يتم العثور على فواتير</p>';
document.getElementById('inquiryResult').classList.add('active');
return;
}
let result = '';
let totalAll = 0;
matchingInvoices.forEach((inv, idx) => {
totalAll = safeAddMoney(totalAll, getNetSalesFromInvoice(inv));
const returnedQty = getReturnedQuantityFromInvoice(inv.id);
result += `<p><strong>فاتورة #${idx + 1}:</strong> ${inv.customerName}</p><p>العميل: ${inv.customerName} | الهاتف: ${inv.customerPhone}</p><p>المنتج: ${inv.productName} | الكمية: ${inv.quantity}</p><p>الكمية المرتجعة من هذه الفاتورة: ${returnedQty}</p><p>المتبقي للإرجاع: ${inv.quantity - returnedQty}</p><p>صافي الإجمالي: ${formatNumber(getNetSalesFromInvoice(inv))} ج.م | التاريخ: ${inv.date}</p><hr style="border-color:var(--border);margin:10px 0;">`;
});
result += `<p><strong>إجمالي كل الفواتير (صافي):</strong> ${formatNumber(totalAll)} ج.م</p>`;
document.getElementById('inquiryResult').innerHTML = result;
document.getElementById('inquiryResult').classList.add('active');
}
function executeSupplierInquiry() {
const name = document.getElementById('inquirySupplierName').value.trim().toLowerCase();
if (!name) { alert('أدخل اسم المورد'); return; }
const supplierPurchases = purchases.filter(p => p.supplier && p.supplier.toLowerCase().includes(name));
if (supplierPurchases.length === 0) {
document.getElementById('inquiryResult').innerHTML = '<p>لم يتم العثور على هذا المورد</p>';
document.getElementById('inquiryResult').classList.add('active');
return;
}
const totalPurchases = supplierPurchases.reduce((sum, p) => safeAddMoney(sum, p.total), 0);
const creditPurchases = supplierPurchases.filter(p => p.paymentType === 'credit').reduce((sum, p) => safeAddMoney(sum, p.total), 0);
const cashPurchases = supplierPurchases.filter(p => p.paymentType === 'cash').reduce((sum, p) => safeAddMoney(sum, p.total), 0);
const uniqueProducts = [...new Set(supplierPurchases.map(p => p.title))];
const firstPurchase = supplierPurchases[0];
const credit = supplierCredits.find(s => s.name.toLowerCase() === name);
const remaining = credit ? formatNumber(credit.remaining) : '0.00';
const result = `
<div style="background:rgba(245,158,11,0.1); padding:20px; border-radius:12px; border:1px solid var(--treasury); margin-bottom:15px;">
<h4 style="color:var(--treasury); margin-bottom:15px;"><i class="fas fa-truck"></i> بيانات المورد</h4>
<p><strong>اسم المورد:</strong> ${firstPurchase.supplier}</p>
<p><strong>رقم الهاتف:</strong> ${firstPurchase.supplierPhone || 'غير متاح'}</p>
<p><strong>عدد الفواتير:</strong> ${supplierPurchases.length}</p>
<p><strong>عدد الأصناف المشتراة:</strong> ${uniqueProducts.length}</p>
</div>
<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px;">
<div style="background:rgba(16,185,129,0.1); padding:15px; border-radius:10px; text-align:center; border:1px solid var(--income);">
<p style="color:var(--text-muted); font-size:11px;">مدفوع نقداً</p>
<span style="font-size:20px; font-weight:bold; color:var(--income);">${formatNumber(cashPurchases)}</span>
</div>
<div style="background:rgba(239,68,68,0.1); padding:15px; border-radius:10px; text-align:center; border:1px solid var(--expense);">
<p style="color:var(--text-muted); font-size:11px;">متبقي (آجل)</p>
<span style="font-size:20px; font-weight:bold; color:var(--danger);">${remaining}</span>
</div>
<div style="background:rgba(14,165,233,0.1); padding:15px; border-radius:10px; text-align:center; border:1px solid var(--accent);">
<p style="color:var(--text-muted); font-size:11px;">إجمالي المشتريات</p>
<span style="font-size:20px; font-weight:bold; color:var(--accent);">${formatNumber(totalPurchases)}</span>
</div>
</div>
${parseFloat(remaining) > 0 ? `
<div class="return-warning-box" style="margin-bottom:15px;">
<i class="fas fa-exclamation-triangle"></i>
<span>⚠️ هناك مبلغ <strong class="amount">${remaining}</strong> جنيه مستحق لهذا المورد</span>
</div>` : `
<div class="return-success-box" style="margin-bottom:15px;">
<i class="fas fa-check-circle"></i>
<span>✅ لا يوجد مبالغ مستحقة - جميع المشتريات تم سدادها</span>
</div>`}
<h4 style="color:var(--accent); margin:15px 0 10px;"><i class="fas fa-list"></i> تفاصيل الفواتير</h4>
<table class="inquiry-table">
<thead>
<tr><th>تاريخ</th><th>المنتج</th><th>الكمية</th><th>سعر الشراء</th><th>الإجمالي</th><th>الدفع</th></tr>
</thead>
<tbody>
${supplierPurchases.slice(0, 20).map(p => `
<tr>
<td>${p.date}</td>
<td>${p.title}</td>
<td>${p.count}</td>
<td>${formatNumber(p.purchasePrice)}</td>
<td>${formatNumber(p.total)}</td>
<td style="color:${p.paymentType==='cash'?'var(--success)':'var(--warning)'};font-weight:bold;">
${p.paymentType==='cash'?'نقدي':'آجل'}
</td>
</tr>`).join('')}
</tbody>
</table>
${supplierPurchases.length > 20 ? `<p style="text-align:center; color:var(--text-muted); margin-top:10px;">... وعرض ${supplierPurchases.length - 20} فاتورة أخرى</p>` : ''}
`;
document.getElementById('inquiryResult').innerHTML = result;
document.getElementById('inquiryResult').classList.add('active');
}
// ============================================
// ✅ التصدير والاستيراد (MERGED LOGIC)
// ============================================
function exportData() {
const userDataForExport = {...userData};
if (userDataForExport.password) delete userDataForExport.password;
const data = {
user: userDataForExport,
products,
invoices,
purchases,
salesReturns,
purchaseReturns,
employees,
attendance: attendanceDB,
treasury: treasuryDB,
deletedProducts,
customerCredits,
supplierCredits,
version: "14.0-Final-Merged",
exportDate: new Date().toISOString()
};
const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = `erp_backup_${new Date().toISOString().split('T')[0]}.json`;
a.click();
URL.revokeObjectURL(a.href);
}
function importData(e) {
const files = e.target.files;
if (!files || files.length === 0) return;
let filesProcessed = 0;
let totalFiles = files.length;
for (let i = 0; i < files.length; i++) {
const file = files[i];
const reader = new FileReader();
reader.onload = (evt) => {
try {
const data = JSON.parse(evt.target.result);
if (data.user) {
const importedUser = data.user;
if (userData && userData.password) importedUser.password = userData.password;
userData = importedUser;
localStorage.setItem('erp_user', JSON.stringify(userData));
}
if (data.products) {
products = [...products, ...data.products].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
}
if (data.invoices) {
invoices = [...invoices, ...data.invoices].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
}
if (data.purchases) {
purchases = [...purchases, ...data.purchases].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
}
if (data.salesReturns) {
salesReturns = [...salesReturns, ...data.salesReturns].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
}
if (data.purchaseReturns) {
purchaseReturns = [...purchaseReturns, ...data.purchaseReturns].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
}
if (data.employees) {
employees = [...employees, ...data.employees].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
}
if (data.attendance) {
attendanceDB = {...attendanceDB, ...data.attendance};
}
if (data.treasury) {
if (data.treasury.transactions) {
treasuryDB.transactions = [...treasuryDB.transactions, ...data.treasury.transactions].filter((v, i, a) =>
a.findIndex(t => t.date === v.date && t.desc === v.desc && t.amount === v.amount) === i
);
}
treasuryDB.balance = treasuryDB.transactions.reduce((sum, t) => {
return t.type === 'وارد' ? safeAddMoney(sum, t.amount) : safeSubtractMoney(sum, t.amount);
}, 0);
}
if (data.deletedProducts) {
deletedProducts = [...deletedProducts, ...data.deletedProducts].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
}
if (data.customerCredits) {
customerCredits = [...customerCredits, ...data.customerCredits].filter((v, i, a) => a.findIndex(t => t.name === v.name && t.phone === v.phone) === i);
}
if (data.supplierCredits) {
supplierCredits = [...supplierCredits, ...data.supplierCredits].filter((v, i, a) => a.findIndex(t => t.name === v.name && t.phone === v.phone) === i);
}
saveData();
filesProcessed++;
if (filesProcessed === totalFiles) {
alert(`✅ تم استيراد ${totalFiles} ملف ودمج البيانات بنجاح!
تم الحفاظ على البيانات القديمة وإضافة الجديد دون تكرار.`);
initApp();
}
} catch (err) {
console.error('خطأ في الملف:', file.name, err);
filesProcessed++;
if (filesProcessed === totalFiles) alert('⚠️ حدث خطأ في بعض الملفات أثناء المعالجة');
}
};
reader.onerror = () => {
filesProcessed++;
if (filesProcessed === totalFiles) alert('⚠️ فشل قراءة بعض الملفات');
};
reader.readAsText(file);
}
e.target.value = '';
}
// ============================================
// ✅ Event Listeners
// ============================================
document.getElementById('createPurchaseBtn').addEventListener('click', createPurchase);
document.getElementById('savePurchaseReturnBtn').addEventListener('click', savePurchaseReturn);
document.getElementById('saveInvoiceBtn').addEventListener('click', saveInvoice);
document.getElementById('saveSalesReturnBtn').addEventListener('click', saveSalesReturn);
document.getElementById('saveEmployeeBtn').addEventListener('click', saveEmployee);
document.getElementById('clearDataBtn').addEventListener('click', () => { if (confirm('مسح كل البيانات؟')) { localStorage.clear(); location.reload(); } });
document.getElementById('printCurrentBtn').addEventListener('click', printCurrentSection);
document.getElementById('sumByNameBtn').addEventListener('click', sumByName);
document.getElementById('sumByCategoryBtn').addEventListener('click', sumByCategory);
document.getElementById('inquiryBtn').addEventListener('click', openInquiryModal);
document.getElementById('exportDataBtn').addEventListener('click', exportData);
document.getElementById('importDataBtn').addEventListener('click', () => document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', importData);
document.getElementById('inquiryModal').addEventListener('click', e => { if (e.target.id === 'inquiryModal') closeInquiryModal(); });
renderLoginUI();