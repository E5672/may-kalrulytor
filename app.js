// ─── Telegram WebApp Init ───────────────────────────────────────
if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.expand();
    Telegram.WebApp.setHeaderColor('#0f0f13');
    Telegram.WebApp.setBackgroundColor('#0f0f13');
}

// ─── DOM Refs ────────────────────────────────────────────────────
const heroCard      = document.getElementById('hero-card');
const profitValue   = document.getElementById('profit-value');
const heroPeriod    = document.getElementById('hero-period-text');
const incomeValue   = document.getElementById('income-value');
const expenseValue  = document.getElementById('expense-value');
const incomeTotal   = document.getElementById('income-total');
const expenseTotal  = document.getElementById('expense-total');
const ratioValue    = document.getElementById('expense-ratio-value');
const progressFill  = document.getElementById('progress-fill');
const warningEl     = document.getElementById('warning');
const headerBadge   = document.getElementById('period-label');

// ─── Period State ────────────────────────────────────────────────
let currentPeriod = 'month';

const periodLabels = {
    day:   { badge: 'День',    hero: 'в день' },
    week:  { badge: 'Неделя',  hero: 'в неделю' },
    month: { badge: 'Месяц',   hero: 'в месяц' },
};

document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPeriod = btn.dataset.period;
        headerBadge.textContent = periodLabels[currentPeriod].badge;
        heroPeriod.textContent  = periodLabels[currentPeriod].hero;
        calculate();
    });
});

// ─── Format Numbers ──────────────────────────────────────────────
function fmt(num) {
    const rounded = Math.round(num);
    return rounded.toLocaleString('ru-RU') + ' ₽';
}

function fmtRatio(ratio) {
    return ratio.toFixed(1) + '%';
}

// ─── Animate value update ────────────────────────────────────────
function flash(el) {
    el.classList.remove('value-updated');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('value-updated');
}

// ─── Main Calculate ──────────────────────────────────────────────
function calculate() {
    const v = id => parseFloat(document.getElementById(id).value) || 0;

    const salary        = v('salary');
    const freelance     = v('freelance');
    const passiveIncome = v('passive_income');
    const otherIncome   = v('other_income');

    const rent          = v('rent');
    const food          = v('food');
    const transport     = v('transport');
    const marketing     = v('marketing');
    const otherExpenses = v('other_expenses');

    const totalIncome   = salary + freelance + passiveIncome + otherIncome;
    const totalExpenses = rent + food + transport + marketing + otherExpenses;

    let profit = totalIncome - totalExpenses;

    if (currentPeriod === 'day')  profit = profit / 30;
    if (currentPeriod === 'week') profit = profit / 4;

    const expenseRatio = totalIncome > 0
        ? Math.min((totalExpenses / totalIncome) * 100, 100)
        : 0;

    // ── Update hero card ──
    flash(profitValue);
    profitValue.textContent = fmt(profit);

    heroCard.classList.remove('positive', 'negative');
    if (profit > 0) heroCard.classList.add('positive');
    if (profit < 0) heroCard.classList.add('negative');

    // ── Update stat cards ──
    flash(incomeValue);
    flash(expenseValue);
    incomeValue.textContent  = fmt(totalIncome);
    expenseValue.textContent = fmt(totalExpenses);

    // ── Section totals ──
    incomeTotal.textContent  = fmt(totalIncome);
    expenseTotal.textContent = fmt(totalExpenses);

    // ── Ratio bar ──
    flash(ratioValue);
    ratioValue.textContent = fmtRatio(expenseRatio);
    progressFill.style.width = expenseRatio + '%';

    // ── Warning ──
    if (totalExpenses > totalIncome && totalIncome > 0) {
        warningEl.style.display = 'flex';
    } else {
        warningEl.style.display = 'none';
    }
}

// ─── Listen to all number inputs ─────────────────────────────────
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', calculate);
});

// ─── Init ─────────────────────────────────────────────────────────
calculate();
