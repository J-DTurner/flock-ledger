React.Fragment=React.Fragment||function Fragment(p){return p.children||null;};
const M = FlockMath;
const money = (n, dp = 0) => n === null || n === undefined || !Number.isFinite(n) ? '—' : '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: dp, maximumFractionDigits: dp });
const qty = (n, dp = 2) => n === null || n === undefined || !Number.isFinite(n) ? '—' : n.toLocaleString('en-PH', { maximumFractionDigits: dp, minimumFractionDigits: dp });
const dateLabel = (s) => M.validDate(s) ? new Date(s + 'T12:00:00').toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unknown';
const dateShort = (s) => M.validDate(s) ? new Date(s + 'T12:00:00').toLocaleDateString('en-PH', { day: 'numeric', month: 'long' }) : 'Date unknown';
function workingDateTitle(date) { const today = M.today(); if (date === today)
    return { h1: 'Today', eyebrow: 'DAILY LOG' }; if (date < today)
    return { h1: 'Daily log · ' + dateShort(date), eyebrow: 'PAST DATE' }; return { h1: 'Upcoming · ' + dateShort(date), eyebrow: 'FUTURE DATE' }; }
const clone = (s) => JSON.parse(JSON.stringify(s));
const NATIVE = typeof navigator !== 'undefined' && navigator.userAgent.indexOf('FlockLedger/1') >= 0;
function nativeCall(op, data = '') { return window.prompt('flock:' + op, data); }
function storeRead() { return NATIVE ? nativeCall('load') : localStorage.getItem('flock-ledger-v1'); }
function storeWrite(s) { const text = JSON.stringify(s); if (text.length > 4500000)
    throw new Error('The local ledger is near its 4.5 MB limit. Export a backup before removing old batches.'); if (NATIVE) {
    if (nativeCall('save', text) !== 'ok')
        throw new Error('Android storage could not save the change. Your previous data has been kept.');
}
else
    localStorage.setItem('flock-ledger-v1', text); }
function saveDownload(name, text, mime = 'application/json') { if (NATIVE) {
    const result = nativeCall('export', JSON.stringify({ name, mime, text }));
    if (result !== 'pending')
        throw new Error(result || 'Export was not started.');
    return;
} const u = URL.createObjectURL(new Blob([text], { type: mime })); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 3000); }
const ICONS = { home: 'M3 11l9-8 9 8M5 10v11h5v-7h4v7h5V10', log: 'M5 3h14v18H5zM9 7h6M9 11h6M9 15h4', chart: 'M4 4v16h17M7 15l4-5 4 2 5-7', flock: 'M5 19v-5a7 7 0 0114 0v5M8 20h8M8 8V5h8v3', save: 'M5 3h12l3 3v15H4V3zM8 3v6h8V3M8 21v-7h8v7', plus: 'M12 5v14M5 12h14', arrow: 'M5 12h14M14 7l5 5-5 5', close: 'M6 6l12 12M18 6L6 18', edit: 'M4 20l4-1 12-12-4-4L4 15v5M14 5l4 4', down: 'M6 9l6 6 6-6', check: 'M5 12l4 4L19 6', feed: 'M5 7h14l2 14H3L5 7zM8 3h8M12 11v6', weight: 'M5 8h14l2 13H3L5 8zM9 8V5a3 3 0 016 0v3', trash: 'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7', removal: 'M15 3h6v18h-6M10 17l-5-5 5-5M5 12h12', info: 'M12 11v6M12 7v.1M22 12a10 10 0 11-20 0 10 10 0 0120 0' };
const TYPELABEL = { feed: 'Feed purchase', usage: 'Feed used', weigh: 'Weighing', count: 'Live count', loss: 'Bird loss', harvest: 'Harvest', expense: 'Expense', budget: 'Budget only', openingUsage: 'Historical feed use', note: 'Note' };
const ACTION_META = { feed: { title: 'Buy feed', save: 'Save purchase', eyebrow: 'FEED PURCHASE' }, usage: { title: 'Use feed', save: 'Save feed use', eyebrow: 'FEED USE' }, weigh: { title: 'Weigh birds', save: 'Save weighing', eyebrow: 'WEIGHING' }, count: { title: 'Count birds', save: 'Save count', eyebrow: 'LIVE COUNT' }, loss: { title: 'Loss / removal', save: 'Save removal', eyebrow: 'REMOVAL' }, harvest: { title: 'Harvest', save: 'Save harvest', eyebrow: 'HARVEST' }, expense: { title: 'Expense', save: 'Save expense', eyebrow: 'EXPENSE' }, budget: { title: 'Feed budget', save: 'Save budget', eyebrow: 'BUDGET' }, openingUsage: { title: 'Historical feed use', save: 'Save historical use', eyebrow: 'HISTORICAL USE' }, note: { title: 'Note', save: 'Save note', eyebrow: 'NOTE' } };
const CHOOSER = [['usage', 'Use feed'], ['feed', 'Buy feed'], ['weigh', 'Weigh birds'], ['count', 'Count birds'], ['loss', 'Loss / removal'], ['expense', 'Expense'], ['harvest', 'Harvest'], ['note', 'Note'], ['budget', 'Feed budget'], ['openingUsage', 'Historical feed use']];
function Icon({ name, size = 20 }) { return React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.65", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
    React.createElement("path", { d: ICONS[name] || ICONS.log })); }
function Badge({ children, kind = 'muted' }) { return React.createElement("span", { className: 'badge ' + kind }, children); }
function Note({ children, tone = 'info' }) { return React.createElement("div", { className: 'note ' + tone },
    React.createElement(Icon, { name: "info", size: 17 }),
    React.createElement("div", null, children)); }
function Field({ label, hint, children, wide = false }) { return React.createElement("label", { className: 'field ' + (wide ? 'wide' : '') },
    React.createElement("span", null, label),
    children,
    hint && React.createElement("small", null, hint)); }
function Metric({ label, value, sub, accent = false }) { return React.createElement("div", { className: 'metric ' + (accent ? 'accent' : '') },
    React.createElement("span", { className: "eyebrow" }, label),
    React.createElement("strong", null, value),
    React.createElement("small", null, sub)); }
function Empty({ title, text, action }) { return React.createElement("div", { className: "empty" },
    React.createElement(Icon, { name: "chart", size: 30 }),
    React.createElement("h3", null, title),
    React.createElement("p", null, text),
    action); }
function SectionTitle({ title, sub, action }) { return React.createElement("div", { className: "section-heading" },
    React.createElement("div", null,
        React.createElement("h2", null, title),
        sub && React.createElement("p", null, sub)),
    action); }
function draftKey(cmd) { return [cmd.action, cmd.batchId, cmd.date || '', cmd.lotId || '', cmd.event && cmd.event.id || '', cmd.convert && cmd.convert.id || ''].join('|'); }
function freshDraft(cmd) {
    const e = cmd.event || (cmd.convert ? { name: cmd.convert.name || '', cost: cmd.convert.cost, date: cmd.date || M.today(), phase: 'unknown', type: 'feed' } : {});
    const product = cmd.product || null;
    const defaults = M.purchaseDefaults(cmd.action === 'feed' && !e.id ? product : e.type === 'feed' ? e : null);
    const date = e.date === null ? '' : (e.date || cmd.date || M.today());
    const weighMode = e.weights && e.weights.length ? 'individual' : e.method === 'estimate' ? 'estimate' : 'average';
    return {
        date, name: e.name || defaults.name || '', phase: e.phase || defaults.phase || 'unknown',
        cost: e.cost === undefined ? '' : String(e.cost), kg: e.kg === null || e.kg === undefined ? '' : String(e.kg),
        qtyUnknown: e.type === 'feed' && e.id ? e.kg === null : false, qtyMode: 'kg', sacks: '', packKg: cmd.packKg ? String(cmd.packKg) : '',
        lotId: e.lotId || cmd.lotId || '', extraLots: [], startDate: e.startDate || (date ? M.addDays(date, -1) : M.addDays(M.today(), -1)),
        periodMode: 'daily', avgKg: e.avgKg === undefined ? '' : String(e.avgKg), minKg: e.minKg == null ? '' : String(e.minKg),
        maxKg: e.maxKg == null ? '' : String(e.maxKg), sampleN: e.sampleN == null ? '' : String(e.sampleN), method: e.method || 'measured',
        weighMode, weighUnit: 'kg', weights: e.weights ? e.weights.join(', ') : '', count: e.count === undefined ? '' : String(e.count),
        liveKg: e.liveKg == null ? '' : String(e.liveKg), dressedKg: e.dressedKg === undefined ? '' : String(e.dressedKg),
        revenue: e.revenue === undefined ? '0' : String(e.revenue), homeKg: e.homeKg === undefined ? '0' : String(e.homeKg),
        dest: e.type === 'harvest' && Number(e.revenue) > 0 ? 'cash' : 'home', note: e.note || '', detailsOpen: !!e.note, error: '', overlap: '',
        lastPriceOffer: product && product.lastKg && product.lastCost ? product.lastCost / product.lastKg : null, lastPriceDate: product && product.lastDate || null
    };
}
function draftDirty(cmd, s) {
    const f = freshDraft(cmd);
    return ['name', 'phase', 'cost', 'kg', 'qtyUnknown', 'lotId', 'avgKg', 'minKg', 'maxKg', 'sampleN', 'weights', 'count', 'liveKg', 'dressedKg', 'revenue', 'homeKg', 'note', 'sacks', 'packKg', 'date', 'startDate', 'weighMode', 'weighUnit', 'qtyMode', 'periodMode', 'dest', 'method'].some(k => { var _a, _b; return String((_a = s[k]) !== null && _a !== void 0 ? _a : '') !== String((_b = f[k]) !== null && _b !== void 0 ? _b : ''); }) || (s.extraLots && s.extraLots.length);
}
function LineChart({ series, title, unit = 'kg', xLabel = 'Days since purchase', floorZero = false }) {
    const all = series.reduce((a, s) => a.concat(s.points), []).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (!all.length)
        return React.createElement(Empty, { title: "No chart data yet", text: "Add a dated record to begin." });
    const W = 720, H = 220, L = 8, R = 8, T = 12, B = 12;
    let minX = Math.min(...all.map((p) => p.x)), maxX = Math.max(...all.map((p) => p.x));
    if (minX === maxX) {
        minX -= 1;
        maxX += 1;
    }
    let minY = floorZero ? 0 : Math.min(...all.map((p) => p.y)), maxY = Math.max(...all.map((p) => p.y));
    let delta = maxY - minY || Math.max(1, maxY * .2);
    if (!floorZero)
        minY = Math.max(0, minY - delta * .12);
    maxY += delta * .15;
    if (maxY === minY)
        maxY = minY + 1;
    const x = (v) => L + (v - minX) / (maxX - minX) * (W - L - R), y = (v) => H - B - (v - minY) / (maxY - minY) * (H - T - B);
    const yfmt = (n) => unit === '₱/kg' ? '₱' + n.toFixed(0) : n.toFixed(maxY < 5 ? 1 : 0);
    const yTicks = [0, 1, 2, 3, 4].map(i => minY + (maxY - minY) * i / 4);
    const xTicks = [0, 1, 2, 3, 4, 5].map(i => minX + (maxX - minX) * i / 5);
    return React.createElement("div", { className: "chart" },
        React.createElement("div", { className: "chart-legend" }, series.map((s, i) => React.createElement("span", { key: i },
            React.createElement("i", { className: s.dash ? 'dashed' : '', style: { borderColor: s.color } }),
            s.label))),
        React.createElement("div", { className: "chart-plot" },
            React.createElement("div", { className: "chart-y", "aria-hidden": "true" }, yTicks.slice().reverse().map((val, i) => React.createElement("span", { key: i }, yfmt(val)))),
            React.createElement("div", { className: "chart-svg-wrap" },
                React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": title + '; ' + unit + ' by ' + xLabel, preserveAspectRatio: "none" },
                    yTicks.map((val, i) => React.createElement("line", { key: i, x1: L, x2: W - R, y1: y(val), y2: y(val), stroke: "#e7e9e2" })),
                    React.createElement("line", { x1: L, x2: W - R, y1: H - B, y2: H - B, stroke: "#bac2b5" }),
                    series.map((s, i) => React.createElement("g", { key: i },
                        s.connect !== false && s.points.length > 1 && React.createElement("polyline", { fill: "none", stroke: s.color, strokeWidth: "2.7", strokeDasharray: s.dash ? '7 6' : undefined, points: s.points.map((p) => `${x(p.x)},${y(p.y)}`).join(' ') }),
                        " ",
                        s.points.filter((p, j) => s.markAll || s.points.length < 5 || j === 0 || j === s.points.length - 1).map((p, j) => React.createElement("circle", { key: j, cx: x(p.x), cy: y(p.y), r: s.connect === false ? 5 : 3, fill: s.open ? '#fff' : s.color, stroke: s.color, strokeWidth: "2" },
                            React.createElement("title", null, `Day ${p.x}: ${unit === '₱/kg' ? money(p.y, 2) : qty(p.y) + ' ' + unit}`)))))),
                React.createElement("div", { className: "chart-x", "aria-hidden": "true" }, xTicks.map((val, i) => React.createElement("span", { key: i }, Math.round(val)))))),
        React.createElement("small", { className: "chart-caption" },
            xLabel,
            ". ",
            unit === '₱/kg' ? 'Focused vertical scale for comparing cost differences. ' : '',
            "Exact values are shown in the records or comparison table below."));
}
function recordDescription(e, b) { const p = b.events.find((x) => x.id === e.lotId); switch (e.type) {
    case 'feed': return `${e.kg === null ? 'kg unknown' : qty(e.kg) + ' kg'} · ${e.phase} · ${money(e.cost)}${e.kg ? ' · ' + money(e.cost / e.kg, 2) + '/kg' : ''}`;
    case 'usage': return `${qty(e.kg)} kg · ${(p === null || p === void 0 ? void 0 : p.name) || 'Feed lot'} · ${dateLabel(e.startDate)} → ${dateLabel(e.date)}`;
    case 'weigh': return `${qty(e.avgKg)} kg average${e.sampleN ? ' · ' + e.sampleN + ' weighed' : ''}${e.maxKg !== null ? ' · max ' + qty(e.maxKg) + ' kg' : ''}${e.method === 'estimate' ? ' · estimate' : ''}`;
    case 'count': return `${e.count} live birds counted`;
    case 'loss': return `${e.count} birds removed`;
    case 'harvest': return `${e.count} birds · ${qty(e.dressedKg)} kg dressed · ${money(e.revenue)} cash`;
    case 'openingUsage': return `${money(e.cost)} historical feed used · no new cash expense`;
    case 'note': return e.note || 'Farm note';
    default: return money(e.cost);
} }
class BatchForm extends React.Component {
    constructor(props) { super(props); const b = props.batch; this.state = { name: (b === null || b === void 0 ? void 0 : b.name) || '', placementDate: (b === null || b === void 0 ? void 0 : b.placementDate) || M.today(), initialBirds: (b === null || b === void 0 ? void 0 : b.initialBirds) || '', chickCost: (b === null || b === void 0 ? void 0 : b.chickCost) === undefined ? '' : b.chickCost, ageAtPlacement: (b === null || b === void 0 ? void 0 : b.ageAtPlacement) === null || (b === null || b === void 0 ? void 0 : b.ageAtPlacement) === undefined ? '' : b.ageAtPlacement, placementEstimated: !!(b === null || b === void 0 ? void 0 : b.placementEstimated), status: (b === null || b === void 0 ? void 0 : b.status) || 'active', error: '' }; }
    render() { const s = this.state, change = (k, v) => this.setState({ [k]: v, error: '' }); return React.createElement("form", { onSubmit: ev => { ev.preventDefault(); try {
            this.props.onSave(Object.assign(Object.assign({}, s), { initialBirds: Number(s.initialBirds), chickCost: Number(s.chickCost), ageAtPlacement: s.ageAtPlacement === '' ? null : Number(s.ageAtPlacement) }));
        }
        catch (e) {
            change('error', e.message);
        } } },
        React.createElement("div", { className: "modal-heading" },
            React.createElement("h2", null, this.props.batch ? 'Edit batch' : 'Start a new batch'),
            React.createElement("button", { type: "button", className: "icon-btn", "aria-label": "Close", onClick: this.props.onCancel },
                React.createElement(Icon, { name: "close" }))),
        React.createElement("div", { className: "form-grid" },
            React.createElement(Field, { label: "Batch name", wide: true },
                React.createElement("input", { value: s.name, maxLength: 120, required: true, onChange: e => change('name', e.target.value), placeholder: "e.g. October broilers" })),
            React.createElement(Field, { label: "Date chicks were purchased" },
                React.createElement("input", { type: "date", required: true, value: s.placementDate, onChange: e => change('placementDate', e.target.value) })),
            React.createElement(Field, { label: "Date confidence" },
                React.createElement("select", { value: String(s.placementEstimated), onChange: e => change('placementEstimated', e.target.value === 'true') },
                    React.createElement("option", { value: "false" }, "Known date"),
                    React.createElement("option", { value: "true" }, "Approximate / needs correction"))),
            React.createElement(Field, { label: "Number of chicks purchased" },
                React.createElement("input", { type: "number", min: "1", step: "1", required: true, value: s.initialBirds, onChange: e => change('initialBirds', e.target.value) })),
            React.createElement(Field, { label: "Total chick cost (\u20B1)" },
                React.createElement("input", { type: "number", min: "0", step: "0.01", required: true, value: s.chickCost, onChange: e => change('chickCost', e.target.value) })),
            React.createElement(Field, { label: "Chick age at purchase (days)", hint: "Leave blank when unknown. The app then uses days since purchase." },
                React.createElement("input", { type: "number", min: "0", max: "180", step: "1", value: s.ageAtPlacement, onChange: e => change('ageAtPlacement', e.target.value) })),
            React.createElement(Field, { label: "Status" },
                React.createElement("select", { value: s.status, onChange: e => change('status', e.target.value) },
                    React.createElement("option", { value: "active" }, "Active"),
                    React.createElement("option", { value: "closed" }, "Closed / harvested")))),
        s.error && React.createElement(Note, { tone: "error" }, s.error),
        React.createElement("div", { className: "modal-actions" },
            React.createElement("button", { type: "button", className: "btn secondary", onClick: this.props.onCancel }, "Cancel"),
            React.createElement("button", { className: "btn primary", type: "submit" }, "Save batch"))); }
}
function ActionChooser({ onPick, onCancel }) {
    return React.createElement("div", null,
        React.createElement("div", { className: "modal-heading" },
            React.createElement("div", null,
                React.createElement("span", { className: "eyebrow" }, "ADD"),
                React.createElement("h2", null, "Choose an action")),
            React.createElement("button", { type: "button", className: "icon-btn", "aria-label": "Close form", onClick: onCancel },
                React.createElement(Icon, { name: "close" }))),
        React.createElement("p", { className: "muted small-text" }, "Choose an action to record."),
        React.createElement("div", { className: "chooser-grid" }, CHOOSER.map(([action, label]) => React.createElement("button", { key: action, type: "button", className: "chooser-btn", onClick: () => onPick(action) }, label))));
}
class TaskForm extends React.Component {
    constructor(props) {
        super(props);
        this.emit = () => { if (this.props.onDraft)
            this.props.onDraft(this.state); };
        this.set = (k, v) => this.setState({ [k]: v, error: '' }, this.emit);
        this.input = (k, opts = {}) => React.createElement("input", Object.assign({ type: "number", inputMode: "decimal", step: "any", min: "0", value: this.state[k], onChange: e => this.set(k, e.target.value) }, opts));
        this.endDate = () => this.state.date || '';
        this.resolvedKg = () => { const s = this.state; if (s.qtyUnknown)
            return null; if (s.qtyMode === 'sacks') {
            const a = Number(s.sacks), p = Number(s.packKg);
            return a > 0 && p > 0 ? a * p : NaN;
        } return s.kg === '' ? NaN : Number(s.kg); };
        this.build = () => {
            var _a, _b;
            const s = this.state, cmd = this.props.command, n = (k, optional = false) => s[k] === '' ? (optional ? null : NaN) : Number(s[k]);
            const base = { id: cmd.eventId || ((_a = cmd.event) === null || _a === void 0 ? void 0 : _a.id) || M.uid(), type: cmd.action, date: s.date || null, createdAt: ((_b = cmd.event) === null || _b === void 0 ? void 0 : _b.createdAt) || new Date().toISOString(), note: s.note };
            if (['feed', 'expense', 'budget', 'openingUsage'].includes(cmd.action)) {
                base.cost = n('cost');
                base.name = s.name.trim() || { feed: 'Feed purchase', expense: 'Batch expense', budget: 'Feed budget', openingUsage: 'Historical feed used' }[cmd.action];
            }
            if (cmd.action === 'feed') {
                base.kg = s.qtyUnknown ? null : this.resolvedKg();
                base.phase = s.phase;
            }
            if (cmd.action === 'usage') {
                const rows = [{ lotId: s.lotId, kg: n('kg') }].concat((s.extraLots || []).filter((r) => r.lotId && r.kg !== '').map((r) => ({ lotId: r.lotId, kg: Number(r.kg) })));
                return rows.map((r, i) => (Object.assign(Object.assign({}, base), { id: i === 0 ? base.id : M.uid(), type: 'usage', kg: r.kg, lotId: r.lotId, startDate: s.startDate || null, date: s.date || null })));
            }
            if (cmd.action === 'weigh') {
                const n = M.normalizeWeighDraft(s);
                Object.assign(base, M.serializeWeigh(n.weighMode, n));
            }
            if (['count', 'loss', 'harvest'].includes(cmd.action))
                base.count = n('count');
            if (cmd.action === 'harvest') {
                base.liveKg = n('liveKg', true);
                base.dressedKg = n('dressedKg');
                base.revenue = s.dest === 'home' ? 0 : n('revenue');
                base.homeKg = s.dest === 'home' ? (s.homeKg === '' ? n('dressedKg') : n('homeKg')) : n('homeKg');
            }
            if (cmd.action === 'openingUsage')
                base.kg = n('kg', true);
            if (cmd.action === 'note')
                base.name = s.name.trim() || 'Farm note';
            return [base];
        };
        this.save = (ev, andAnother = false) => { ev.preventDefault(); try {
            if (['weigh', 'count', 'loss', 'harvest', 'usage'].includes(this.props.command.action) && !M.validDate(this.state.date))
                throw new Error('Date is required.');
            this.props.onSave(this.build(), { andAnother, command: this.props.command, packKg: Number(this.state.packKg) || undefined });
        }
        catch (err) {
            this.setState({ error: err.message });
        } };
        this.state = props.draft || freshDraft(props.command);
    }
    componentDidMount() { this.emit(); }
    renderFeed(batch) {
        const s = this.state, suggestions = M.productSuggestions(batch).filter((p) => !s.name || p.name.toLowerCase().includes(s.name.toLowerCase()));
        const kg = this.resolvedKg();
        return React.createElement(React.Fragment, null,
            React.createElement(Field, { label: "Brand / product name", wide: true },
                React.createElement("input", { value: s.name, maxLength: 180, placeholder: "e.g. Sarimanok Finisher Pellet", onChange: e => this.set('name', e.target.value) })),
            !!suggestions.length && React.createElement("div", { className: "wide suggest-row" }, suggestions.slice(0, 6).map((p) => React.createElement("button", { type: "button", key: p.name + p.phase, className: "chip", onClick: () => { const d = M.purchaseDefaults(p); this.setState({ name: d.name, phase: d.phase, lastPriceOffer: p.lastKg && p.lastCost ? p.lastCost / p.lastKg : null, lastPriceDate: p.lastDate, error: '' }, this.emit); } },
                p.name,
                " \u00B7 ",
                p.phase))),
            React.createElement(Field, { label: "Feed stage" },
                React.createElement("select", { value: s.phase, onChange: e => this.set('phase', e.target.value) }, ['unknown', 'starter', 'grower', 'finisher', 'booster', 'other'].map(v => React.createElement("option", { key: v, value: v }, v[0].toUpperCase() + v.slice(1))))),
            React.createElement(Field, { label: "Date", hint: "Leave empty only when the original date is unknown." },
                React.createElement("input", { type: "date", value: s.date, min: batch.placementDate, onChange: e => this.set('date', e.target.value) })),
            React.createElement("div", { className: "wide mode-tabs", role: "tablist", "aria-label": "Quantity mode" },
                React.createElement("button", { type: "button", className: s.qtyMode === 'kg' && !s.qtyUnknown ? 'active' : '', onClick: () => this.setState({ qtyMode: 'kg', qtyUnknown: false }, this.emit) }, "Total kilograms"),
                React.createElement("button", { type: "button", className: s.qtyMode === 'sacks' && !s.qtyUnknown ? 'active' : '', onClick: () => this.setState({ qtyMode: 'sacks', qtyUnknown: false }, this.emit) }, "Sacks"),
                React.createElement("button", { type: "button", className: s.qtyUnknown ? 'active' : '', onClick: () => this.setState({ qtyUnknown: true, kg: '' }, this.emit) }, "Quantity unknown")),
            !s.qtyUnknown && s.qtyMode === 'kg' && React.createElement(Field, { label: "Total kilograms purchased", hint: "All sacks combined. Leave blank only by choosing Quantity unknown." }, this.input('kg', { placeholder: 'e.g. 100' })),
            !s.qtyUnknown && s.qtyMode === 'sacks' && React.createElement(React.Fragment, null,
                React.createElement(Field, { label: "Number of sacks" }, this.input('sacks')),
                React.createElement(Field, { label: "Kilograms per sack", hint: "Enter the actual pack size. 50 kg is never assumed." }, this.input('packKg')),
                React.createElement("div", { className: "field" },
                    React.createElement("span", null, "Total kilograms"),
                    React.createElement("strong", { className: "calculated" }, Number.isFinite(kg) ? qty(kg) + ' kg' : '—'))),
            s.qtyUnknown && React.createElement("div", { className: "wide" },
                React.createElement(Note, { tone: "warn" }, "Quantity unknown \u2014 unavailable for lot-based feed-use logging. The cash amount is still recorded.")),
            React.createElement(Field, { label: "Total amount (\u20B1)" }, this.input('cost', { required: true, placeholder: 'e.g. 3000' })),
            Number.isFinite(kg) && kg > 0 && s.cost !== '' && React.createElement("div", { className: "field" },
                React.createElement("span", null, "Calculated price"),
                React.createElement("strong", { className: "calculated" },
                    money(Number(s.cost) / kg, 2),
                    " / kg"),
                React.createElement("small", null,
                    money(Number(s.cost) / kg * 50),
                    " per 50 kg equivalent (display only)")),
            s.lastPriceOffer && React.createElement("div", { className: "wide" },
                React.createElement("button", { type: "button", className: "text-btn", onClick: () => { if (!Number.isFinite(kg) || kg <= 0) {
                        this.setState({ error: 'Enter kilograms first to use the last recorded price.' });
                        return;
                    } this.setState({ cost: String(Math.round(s.lastPriceOffer * kg * 100) / 100) }, this.emit); } },
                    "Last recorded price: ",
                    money(s.lastPriceOffer, 2),
                    "/kg",
                    s.lastPriceDate ? ' · recorded on ' + dateLabel(s.lastPriceDate) : '',
                    " \u00B7 Use this price")));
    }
    renderUsage(batch) {
        var _a, _b;
        const s = this.state, end = this.endDate(), lots = M.eligibleLots(batch, end, this.props.command.event);
        const locked = !!this.props.command.lotId && !this.props.command.event;
        const selected = lots.find((p) => p.id === s.lotId) || batch.events.find((e) => e.id === s.lotId);
        const previewKg = s.kg === '' ? NaN : Number(s.kg);
        const previewEvent = s.lotId && Number.isFinite(previewKg) && previewKg > 0 ? { id: ((_a = this.props.command.event) === null || _a === void 0 ? void 0 : _a.id) || this.props.command.eventId || 'preview-usage', type: 'usage', lotId: s.lotId, kg: previewKg, startDate: s.startDate, date: end, createdAt: ((_b = this.props.command.event) === null || _b === void 0 ? void 0 : _b.createdAt) || new Date().toISOString(), note: s.note || '' } : null;
        const candidate = previewEvent ? M.candidateBatch(batch, [previewEvent]) : batch;
        const bal = s.lotId ? M.lotBalances(candidate, s.lotId, end) : null;
        const afterAll = s.lotId && previewEvent ? M.lotBalances(candidate, s.lotId) : null;
        const prev = batch.events.filter((e) => e.type === 'usage').sort((a, c) => (c.date || '').localeCompare(a.date || ''))[0];
        const similar = s.lotId && batch.events.find((e) => e.type === 'usage' && e.lotId === s.lotId && e.date === end && e.startDate === s.startDate && (!this.props.command.event || e.id !== this.props.command.event.id));
        return React.createElement(React.Fragment, null,
            React.createElement(Field, { label: s.periodMode === 'period' ? 'Period end (inclusive)' : 'Date' },
                React.createElement("input", { type: "date", value: s.date, min: batch.placementDate, onChange: e => { const date = e.target.value; this.setState({ date, startDate: s.periodMode === 'daily' && date ? M.addDays(date, -1) : s.startDate }, this.emit); } })),
            React.createElement("div", { className: "wide mode-tabs", role: "tablist", "aria-label": "Usage period" },
                React.createElement("button", { type: "button", className: s.periodMode === 'daily' ? 'active' : '', onClick: () => this.setState({ periodMode: 'daily', startDate: s.date ? M.addDays(s.date, -1) : s.startDate }, this.emit) }, "Daily amount"),
                React.createElement("button", { type: "button", className: s.periodMode === 'period' ? 'active' : '', onClick: () => this.set('periodMode', 'period') }, "Choose period"),
                React.createElement("button", { type: "button", className: s.periodMode === 'since' ? 'active' : '', disabled: !prev, onClick: () => this.setState({ periodMode: 'since', startDate: prev.date }, this.emit) }, "Since a previous log")),
            s.periodMode === 'daily' && React.createElement("div", { className: "wide" },
                React.createElement(Note, null,
                    "Daily amount for ",
                    dateLabel(end),
                    ". Feed used after ",
                    dateLabel(s.startDate),
                    " through ",
                    dateLabel(end),
                    " ",
                    React.createElement("details", null,
                        React.createElement("summary", null, "Why these dates?"),
                        "Usage is stored as (start date, end date]. Consecutive calendar dates are one day."))),
            s.periodMode !== 'daily' && React.createElement(Field, { label: "Period start (exclusive)" },
                React.createElement("input", { type: "date", value: s.startDate, min: batch.placementDate, onChange: e => this.set('startDate', e.target.value) })),
            s.periodMode === 'since' && prev && React.createElement("div", { className: "wide" },
                React.createElement(Note, null,
                    "Previous logged endpoint: ",
                    dateLabel(prev.date),
                    ". This is a convenience you chose, not an assumption that every unlogged day belongs here.")),
            locked && selected && React.createElement("div", { className: "wide entry-context" },
                React.createElement("strong", null, selected.name || 'Feed lot'),
                React.createElement("small", null,
                    dateLabel(selected.date),
                    " \u00B7 ",
                    (selected.id || '').slice(-6))),
            !locked && !lots.length && React.createElement("div", { className: "wide" },
                React.createElement(Note, { tone: "warn" }, "No eligible purchase lot for this date. Buy feed with a known quantity first."),
                React.createElement("button", { type: "button", className: "btn secondary small", onClick: this.props.onBuyFeed }, "Buy feed")),
            !locked && lots.length > 0 && React.createElement("div", { className: "wide lot-choices" }, lots.map((p) => React.createElement("button", { type: "button", key: p.id, className: 'lot-choice ' + (s.lotId === p.id ? 'active' : ''), onClick: () => this.set('lotId', p.id) },
                React.createElement("strong", null, p.name),
                React.createElement("small", null,
                    dateLabel(p.date),
                    " \u00B7 ",
                    qty(p.remaining),
                    " kg remaining")))),
            React.createElement(Field, { label: "Kilograms used in this period", hint: "Include feed lost at the feeder. Unused stock stays in inventory." }, this.input('kg', { required: true })),
            bal && React.createElement("div", { className: "wide live-preview" },
                React.createElement("div", null,
                    "Stock recorded at this date: ",
                    React.createElement("strong", null,
                        qty(bal.balanceAtDate),
                        " kg")),
                React.createElement("div", null,
                    "Quantity still available after all recorded usage: ",
                    React.createElement("strong", null,
                        qty((afterAll || bal).remainingAfterAll),
                        " kg")),
                afterAll && React.createElement("div", null,
                    "Recorded stock after this entry: ",
                    React.createElement("strong", null,
                        qty(afterAll.remainingAfterAll),
                        " kg"))),
            similar && s.overlap !== 'additional' && React.createElement("div", { className: "wide" },
                React.createElement(Note, { tone: "warn" },
                    "A ",
                    qty(similar.kg),
                    " kg entry already exists for this lot and period. ",
                    React.createElement("button", { type: "button", className: "text-btn", onClick: () => this.props.onEdit(similar) }, "Edit existing entry"),
                    " \u00B7 ",
                    React.createElement("button", { type: "button", className: "text-btn", onClick: () => this.set('overlap', 'additional') }, "Record an additional amount"))),
            React.createElement("div", { className: "wide" },
                React.createElement("button", { type: "button", className: "text-btn", onClick: () => this.setState({ extraLots: s.extraLots.concat([{ lotId: '', kg: '' }]) }, this.emit) }, "Use another lot")),
            s.extraLots.map((row, i) => React.createElement("div", { className: "wide extra-lot", key: i },
                React.createElement(Field, { label: "Additional lot" },
                    React.createElement("div", { className: "lot-choices compact" }, lots.filter((p) => p.id !== s.lotId).map((p) => React.createElement("button", { type: "button", key: p.id, className: 'lot-choice ' + (row.lotId === p.id ? 'active' : ''), onClick: () => { const extraLots = s.extraLots.slice(); extraLots[i] = Object.assign(Object.assign({}, row), { lotId: p.id }); this.setState({ extraLots }, this.emit); } },
                        p.name,
                        " \u00B7 ",
                        qty(p.remaining),
                        " kg")))),
                React.createElement(Field, { label: "Kilograms from this lot" },
                    React.createElement("input", { type: "number", min: "0", step: "any", value: row.kg, onChange: e => { const extraLots = s.extraLots.slice(); extraLots[i] = Object.assign(Object.assign({}, row), { kg: e.target.value }); this.setState({ extraLots }, this.emit); } })))));
    }
    renderWeigh() {
        const s = this.state, normalized = s.weighMode === 'individual' ? M.normalizeWeighDraft(s) : null, parsed = normalized ? M.parseWeightList(normalized.weights) : null;
        const unit = s.weighUnit === 'g' ? 'g' : 'kg';
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: "wide mode-tabs", role: "tablist", "aria-label": "Weighing mode" },
                React.createElement("button", { type: "button", className: s.weighMode === 'average' ? 'active' : '', onClick: () => this.set('weighMode', 'average') }, "Measured average"),
                React.createElement("button", { type: "button", className: s.weighMode === 'individual' ? 'active' : '', onClick: () => this.set('weighMode', 'individual') }, "Individual weights"),
                React.createElement("button", { type: "button", className: s.weighMode === 'estimate' ? 'active' : '', onClick: () => this.set('weighMode', 'estimate') }, "Estimate")),
            React.createElement(Field, { label: "Date" },
                React.createElement("input", { type: "date", value: s.date, min: this.props.batch.placementDate, onChange: e => this.set('date', e.target.value) })),
            React.createElement(Field, { label: "Unit" },
                React.createElement("select", { "aria-label": "Unit", value: s.weighUnit, onChange: e => this.set('weighUnit', e.target.value) },
                    React.createElement("option", { value: "kg" }, "Kilograms"),
                    React.createElement("option", { value: "g" }, "Grams (converted to kg)"))),
            s.weighMode === 'average' && React.createElement(React.Fragment, null,
                React.createElement(Field, { label: `Average live weight (${unit})` }, this.input('avgKg', { required: true })),
                React.createElement(Field, { label: "Number of birds weighed", hint: "Do not reuse a previous sample size as if it were observed again." }, this.input('sampleN', { step: 1, required: true }))),
            s.weighMode === 'individual' && React.createElement(React.Fragment, null,
                React.createElement(Field, { label: `Individual weights (${unit})`, wide: true, hint: "Separate birds with commas, spaces, or new lines. A period is the decimal mark." },
                    React.createElement("textarea", { rows: 3, placeholder: unit === 'g' ? '1000, 1100, 1200' : '0.98, 1.04, 1.10, 0.95', value: s.weights, onChange: e => this.set('weights', e.target.value) })),
                React.createElement("div", { className: "wide live-preview" }, parsed && !parsed.error && parsed.sampleN ? React.createElement(React.Fragment, null,
                    React.createElement("div", null,
                        "Birds entered: ",
                        React.createElement("strong", null, parsed.sampleN)),
                    React.createElement("div", null,
                        "Average: ",
                        React.createElement("strong", null,
                            qty(parsed.avgKg),
                            " kg")),
                    React.createElement("div", null,
                        "Minimum: ",
                        React.createElement("strong", null,
                            qty(parsed.minKg),
                            " kg")),
                    React.createElement("div", null,
                        "Maximum: ",
                        React.createElement("strong", null,
                            qty(parsed.maxKg),
                            " kg"))) : React.createElement("span", { className: "muted" }, parsed && parsed.error ? parsed.error : 'Add weights to preview the sample.'))),
            s.weighMode === 'estimate' && React.createElement(React.Fragment, null,
                React.createElement(Field, { label: `Estimated average live weight (${unit})` }, this.input('avgKg', { required: true })),
                React.createElement("div", { className: "wide" },
                    React.createElement(Note, { tone: "warn" }, "This stays an estimate. It is not a measured sample and will not create observed daily gain by itself."))));
    }
    renderCount(batch) {
        const s = this.state, live = M.headcount(batch, this.endDate()), same = batch.events.filter((e) => ['count', 'loss', 'harvest'].includes(e.type) && e.date === s.date);
        const predicted = s.count === '' ? null : Number(s.count);
        return React.createElement(React.Fragment, null,
            React.createElement(Field, { label: "Date" },
                React.createElement("input", { type: "date", value: s.date, min: batch.placementDate, onChange: e => this.set('date', e.target.value) })),
            React.createElement(Field, { label: "Birds actually alive and present", hint: "This records a count. It does not subtract birds.", wide: true }, this.input('count', { step: 1, required: true })),
            React.createElement("div", { className: "wide" },
                React.createElement(Note, null,
                    "Currently recorded: ",
                    live.confirmed ? live.count + ' live birds, last counted, less subsequent recorded removals' : live.count + ' on the ledger; not a verified live count',
                    ".")),
            React.createElement("div", { className: "wide" },
                React.createElement("button", { type: "button", className: "text-btn", onClick: () => this.set('count', String(live.count)) },
                    "Use displayed ledger count (",
                    live.count,
                    ")")),
            !!same.length && React.createElement("div", { className: "wide" },
                React.createElement(Note, null, "Same-date count or removal records already exist. A later-created same-date loss will reduce an earlier count. Counts are not treated as end-of-day totals."),
                same.map((e) => React.createElement("button", { key: e.id, type: "button", className: "text-btn", onClick: () => this.props.onEdit(e) },
                    TYPELABEL[e.type],
                    " \u00B7 ",
                    e.count,
                    " \u00B7 ",
                    dateLabel(e.date)))),
            predicted !== null && live.confirmed === false && React.createElement("p", { className: "muted small-text" }, "Saving this count will become the verified live snapshot for later removals."));
    }
    renderLoss(batch) {
        var _a, _b;
        const s = this.state, previewCount = s.count === '' ? NaN : Number(s.count);
        const previewEvent = Number.isFinite(previewCount) ? { id: ((_a = this.props.command.event) === null || _a === void 0 ? void 0 : _a.id) || this.props.command.eventId || 'preview-loss', type: 'loss', count: previewCount, date: this.endDate(), createdAt: ((_b = this.props.command.event) === null || _b === void 0 ? void 0 : _b.createdAt) || new Date().toISOString(), note: s.note || '' } : null;
        const candidate = previewEvent ? M.candidateBatch(batch, [previewEvent]) : batch;
        const live = M.headcount(batch, this.endDate()), after = previewEvent ? M.headcount(candidate, this.endDate()).count : null;
        const same = batch.events.filter((e) => ['count', 'loss', 'harvest'].includes(e.type) && e.date === s.date);
        return React.createElement(React.Fragment, null,
            React.createElement(Field, { label: "Date" },
                React.createElement("input", { type: "date", value: s.date, min: batch.placementDate, onChange: e => this.set('date', e.target.value) })),
            React.createElement(Field, { label: "Birds lost or removed", wide: true }, this.input('count', { step: 1, required: true })),
            after !== null && React.createElement("div", { className: "wide live-preview" },
                "Predicted ledger count after this removal: ",
                React.createElement("strong", null, after),
                " ",
                React.createElement("small", null,
                    "(",
                    live.label,
                    ")")),
            !!same.length && React.createElement("div", { className: "wide" },
                React.createElement(Note, null, "A later-created same-date loss will reduce an earlier count from this date. This does not create a second count record.")));
    }
    renderHarvest() {
        const s = this.state;
        return React.createElement(React.Fragment, null,
            React.createElement(Field, { label: "Date" },
                React.createElement("input", { type: "date", value: s.date, min: this.props.batch.placementDate, onChange: e => this.set('date', e.target.value) })),
            React.createElement(Field, { label: "Birds harvested" }, this.input('count', { step: 1, required: true })),
            React.createElement(Field, { label: "Total dressed kilograms" }, this.input('dressedKg', { required: true })),
            React.createElement("div", { className: "wide mode-tabs", role: "tablist", "aria-label": "Destination" },
                React.createElement("button", { type: "button", className: s.dest === 'cash' ? 'active' : '', onClick: () => this.set('dest', 'cash') }, "Cash received"),
                React.createElement("button", { type: "button", className: s.dest === 'home' ? 'active' : '', onClick: () => this.setState({ dest: 'home', revenue: '0' }, this.emit) }, "Home consumption")),
            s.dest === 'cash' && React.createElement(Field, { label: "Cash received for this harvest (\u20B1)" }, this.input('revenue', { required: true })),
            s.dest === 'home' && React.createElement(Note, null, "Home consumption is recorded as 0 cash, not a retail-equivalent estimate."),
            React.createElement(Field, { label: "Dressed kg kept for home" }, this.input('homeKg', { required: true })));
    }
    renderSimple(batch) {
        const s = this.state, a = this.props.command.action;
        return React.createElement(React.Fragment, null,
            React.createElement(Field, { label: "Date", hint: ['feed', 'expense', 'budget', 'openingUsage', 'note'].includes(a) ? 'Leave empty only when the original date is unknown.' : undefined },
                React.createElement("input", { type: "date", value: s.date, min: batch.placementDate, onChange: e => this.set('date', e.target.value) })),
            a !== 'note' && React.createElement(Field, { label: "Description" },
                React.createElement("input", { value: s.name, maxLength: 180, onChange: e => this.set('name', e.target.value) })),
            ['expense', 'budget', 'openingUsage'].includes(a) && React.createElement(Field, { label: a === 'openingUsage' ? 'Cost of feed already USED (₱)' : 'Total amount (₱)', hint: a === 'openingUsage' ? 'Not a new payment; must already appear in feed purchases.' : undefined }, this.input('cost', { required: true })),
            a === 'openingUsage' && React.createElement(React.Fragment, null,
                React.createElement("div", { className: "wide" },
                    React.createElement(Note, { tone: "warn" }, "Use only for feed used before detailed tracking. Do not also log the same feed as lot usage. This entry adds production cost, not another cash payment.")),
                React.createElement(Field, { label: "Historical kg used (optional)" }, this.input('kg'))));
    }
    render() {
        const s = this.state, cmd = this.props.command, meta = ACTION_META[cmd.action], batch = this.props.batch, bname = batch.name;
        const details = cmd.action === 'weigh' && s.weighMode === 'average' || cmd.action === 'harvest' || cmd.action !== 'note';
        return React.createElement("form", { onSubmit: e => this.save(e, false) },
            React.createElement("div", { className: "modal-heading" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, cmd.event ? 'EDIT' : 'TASK'),
                    React.createElement("h2", null, meta.title)),
                React.createElement("button", { type: "button", className: "icon-btn", "aria-label": "Close form", onClick: this.props.onCancel },
                    React.createElement(Icon, { name: "close" }))),
            React.createElement("div", { className: "entry-context" },
                React.createElement("span", null, bname),
                React.createElement("span", null, s.date ? dateLabel(s.date) : (cmd.event ? 'Date unknown' : 'Date required'))),
            cmd.convert && React.createElement(Note, null,
                "Planned budget: ",
                money(cmd.convert.cost),
                ". This plan will be replaced by the purchase you save. Enter the actual kilograms and amount paid, or ",
                React.createElement("button", { type: "button", className: "text-btn", onClick: () => this.set('cost', String(cmd.convert.cost)) }, "adopt the planned amount"),
                "."),
            React.createElement("div", { className: "form-grid" },
                cmd.action === 'feed' && this.renderFeed(batch),
                cmd.action === 'usage' && this.renderUsage(batch),
                cmd.action === 'weigh' && this.renderWeigh(),
                cmd.action === 'count' && this.renderCount(batch),
                cmd.action === 'loss' && this.renderLoss(batch),
                cmd.action === 'harvest' && this.renderHarvest(),
                ['expense', 'budget', 'openingUsage', 'note'].includes(cmd.action) && this.renderSimple(batch),
                cmd.action === 'weigh' && s.weighMode === 'average' && s.detailsOpen && React.createElement(React.Fragment, null,
                    React.createElement(Field, { label: "Smallest bird (kg, optional)" }, this.input('minKg')),
                    React.createElement(Field, { label: "Largest bird (kg, optional)" }, this.input('maxKg'))),
                cmd.action === 'harvest' && s.detailsOpen && React.createElement(Field, { label: "Total live weight (kg, optional)" }, this.input('liveKg')),
                cmd.action === 'note' ? React.createElement(Field, { label: "Notes", wide: true },
                    React.createElement("textarea", { rows: 5, maxLength: 5000, value: s.note, onChange: e => this.set('note', e.target.value) })) : s.detailsOpen ? React.createElement(Field, { label: "Notes", wide: true },
                    React.createElement("textarea", { rows: 3, maxLength: 5000, value: s.note, onChange: e => this.set('note', e.target.value), placeholder: "Supplier, feed quality, flock health, or anything worth remembering." })) : React.createElement("div", { className: "wide" },
                    React.createElement("button", { type: "button", className: "text-btn", onClick: () => this.set('detailsOpen', true) }, "Optional details and notes"))),
            s.error && React.createElement(Note, { tone: "error" },
                s.error,
                /exceeds the birds/.test(s.error) && (() => { const block = M.blockingCountRecord(batch, Number(s.count), s.date || M.today()); return block ? React.createElement("button", { type: "button", className: "text-btn", onClick: () => block.id && this.props.onEdit(block) },
                    "Open earlier ",
                    block.type === 'placement' ? 'placement' : TYPELABEL[block.type] || block.type) : null; })()),
            React.createElement("div", { className: "modal-actions" },
                React.createElement("button", { type: "button", className: "btn secondary", onClick: this.props.onCancel }, "Cancel"),
                React.createElement("button", { type: "button", className: "btn secondary", onClick: e => this.save(e, true) }, "Save and another"),
                React.createElement("button", { type: "submit", className: "btn primary" },
                    React.createElement(Icon, { name: "check" }),
                    meta.save)));
    }
}
class App extends React.Component {
    constructor(props) {
        super(props);
        this.keydown = (e) => { if (e.key === 'Escape' && this.state.modal)
            this.dismissEditor(); };
        this.b = () => this.state.data.batches.find((b) => b.id === this.state.data.selectedBatchId);
        this.toast = (msg) => { if (!msg)
            return; this.setState({ toast: msg }); setTimeout(() => this.setState({ toast: '' }), 5200); };
        this.commit = (data, msg) => { M.validateState(data); storeWrite(data); this.setState({ data, storageError: '' }); if (msg !== '')
            this.toast(msg === undefined ? 'Saved on this device' : msg); };
        this.mutate = (fn, msg) => { const d = clone(this.state.data); fn(d, d.batches.find((b) => b.id === d.selectedBatchId)); this.commit(d, msg); };
        this.ui = () => (this.state.data.settings && this.state.data.settings.ui) || {};
        this.persistDraft = (cmd, draft) => { try {
            this.mutate((d) => { d.settings.ui = d.settings.ui || {}; d.settings.ui.drafts = d.settings.ui.drafts || {}; d.settings.ui.drafts[draftKey(cmd)] = draft; }, '');
        }
        catch (e) {
            this.toast(e.message);
        } };
        this.clearDraft = (cmd) => { try {
            this.mutate((d) => { if (!d.settings.ui || !d.settings.ui.drafts)
                return; delete d.settings.ui.drafts[draftKey(cmd)]; }, '');
        }
        catch (e) { /* keep going */ } };
        this.dismissEditor = () => { const modal = this.state.modal; if (modal && modal.kind === 'task' && this.state.pendingDraft && draftDirty(modal.command, this.state.pendingDraft))
            this.persistDraft(modal.command, this.state.pendingDraft); this.setState({ modal: null, pendingDraft: null }); };
        this.openAction = (partial) => {
            var _a;
            const batchId = partial.batchId || ((_a = this.b()) === null || _a === void 0 ? void 0 : _a.id);
            const date = partial.date !== undefined ? partial.date : (this.state.selectedDate || M.today());
            const command = { action: partial.action, batchId, date, lotId: partial.lotId, product: partial.product, packKg: partial.packKg || this.ui().packKg, event: partial.event || null, convert: partial.convert || null, eventId: partial.event ? partial.event.id : M.uid(), budgetId: partial.convert && partial.convert.id };
            if (partial.action === 'usage' && !command.lotId && !command.event) {
                const lots = M.eligibleLots(this.state.data.batches.find((b) => b.id === batchId), date);
                if (lots.length === 1)
                    command.lotId = lots[0].id;
                else if (this.ui().lastLotId && lots.some((p) => p.id === this.ui().lastLotId))
                    command.lotId = this.ui().lastLotId;
            }
            const stored = (this.ui().drafts || {})[draftKey(command)];
            this.setState({ modal: { kind: 'task', command }, pendingDraft: stored || null });
        };
        this.openChooser = () => this.setState({ modal: { kind: 'chooser' }, pendingDraft: null });
        this.saveRecords = (records, opts) => {
            const cmd = opts.command, batchId = cmd.batchId;
            const snapshot = clone(this.state.data);
            const d = clone(this.state.data);
            const next = M.applyEvents(d, batchId, records, cmd.convert ? [cmd.convert.id] : []);
            const last = records[0];
            const ui = Object.assign({}, (next.settings.ui || {}));
            ui.drafts = Object.assign({}, (ui.drafts || {}));
            delete ui.drafts[draftKey(cmd)];
            if (last.type === 'usage')
                ui.lastLotId = last.lotId;
            if (last.type === 'feed' && opts.packKg)
                ui.packKg = opts.packKg;
            next.settings.ui = ui;
            M.validateState(next);
            storeWrite(next);
            const b = next.batches.find((x) => x.id === batchId);
            const msg = this.consequence(records, b);
            this.setState({ data: next, storageError: '', lastSave: { events: records, batchId, message: msg, snapshot }, pendingDraft: null });
            if (opts.andAnother) {
                const again = { action: cmd.action, batchId, date: cmd.date, lotId: cmd.action === 'usage' ? cmd.lotId || last.lotId : undefined };
                if (cmd.action === 'feed')
                    again.product = { name: last.name, phase: last.phase, lastKg: last.kg, lastCost: last.cost, lastDate: last.date };
                this.openAction(again);
            }
            else
                this.setState({ modal: null });
            this.toast(msg);
        };
        this.undoLastChange = () => {
            const ls = this.state.lastSave;
            if (!ls || !ls.snapshot)
                return;
            try {
                storeWrite(ls.snapshot);
                this.setState({ data: ls.snapshot, lastSave: null, storageError: '' });
                this.toast('Last change undone');
            }
            catch (e) {
                this.toast(e.message);
            }
        };
        this.consequence = (records, b) => {
            const e = records[0];
            if (e.type === 'usage') {
                const lot = b.events.find((x) => x.id === e.lotId);
                const rem = M.lotBalances(b, e.lotId);
                const total = M.sum(records.map((r) => r.kg));
                return `Feed used: ${qty(total)} kg · ${(lot === null || lot === void 0 ? void 0 : lot.name) || 'lot'} · ${qty(rem && rem.remainingAfterAll)} kg recorded stock remaining`;
            }
            if (e.type === 'feed')
                return `Feed purchased: ${e.kg === null ? 'quantity unknown' : qty(e.kg) + ' kg'} · ${money(e.cost)}`;
            if (e.type === 'weigh')
                return e.method === 'estimate' ? `Weight estimate: ${qty(e.avgKg)} kg` : `Weighed: ${qty(e.avgKg)} kg average`;
            if (e.type === 'count')
                return `Counted ${e.count} live birds`;
            if (e.type === 'loss')
                return `Recorded ${e.count} birds removed`;
            return TYPELABEL[e.type] + ' saved';
        };
        this.deleteRecord = (event) => {
            const name = (event.name || TYPELABEL[event.type] || 'record').toLowerCase();
            const extra = event.type === 'usage' ? ' Recorded stock and production cost will change.' : event.type === 'feed' ? ' Usage entries that depend on this purchase will block deletion.' : ' This can change stock and costs.';
            if (!window.confirm(`Delete this ${name}?${extra}`))
                return;
            try {
                this.mutate((d, b) => { b.events = b.events.filter((e) => e.id !== event.id); }, 'Record deleted');
                this.setState({ lastSave: null });
            }
            catch (e) {
                this.toast(e.message);
            }
        };
        this.capital = () => M.sum(this.state.data.settings.capital.map((a) => a.cost));
        this.projection = () => M.forecast(this.b(), this.state.scenarioDraft || this.b().forecast, this.capital(), this.state.data.settings.recoveryBatches);
        this.switchTab = (tab) => { this.setState({ tab, morePage: tab === 'more' && this.state.tab === 'more' ? this.state.morePage : 'menu' }); window.scrollTo(0, 0); };
        this.openMore = (page) => { this.setState({ tab: 'more', morePage: page }); window.scrollTo(0, 0); };
        this.workingDateBar = () => {
            const date = this.state.selectedDate || M.today(), away = date !== M.today();
            return React.createElement("div", { className: "working-date" },
                React.createElement(Field, { label: "Working date" },
                    React.createElement("input", { type: "date", "aria-label": "Selected date", value: date, onChange: e => this.setState({ selectedDate: e.target.value }) })),
                away && React.createElement("button", { type: "button", className: "btn secondary", onClick: () => this.setState({ selectedDate: M.today() }) }, "Return to today"));
        };
        this.renderLotCard = (p, date, opts = {}) => {
            const usable = p.kg !== null && p.remaining !== null && p.remaining > 0.00001;
            const later = M.lotBalances(this.b(), p.id);
            const showSplit = later && p.remaining !== null && later.remainingAfterAll !== null && Math.abs((p.remaining || 0) - (later.remainingAfterAll || 0)) > 0.00001;
            return React.createElement("section", { className: "card lot-card", key: p.id },
                React.createElement("h3", null, p.name),
                React.createElement("p", null,
                    p.phase,
                    " \u00B7 ",
                    dateLabel(p.date)),
                React.createElement("div", { className: "detail-grid" },
                    React.createElement("div", null,
                        React.createElement("small", null, "Recorded remaining"),
                        React.createElement("strong", null,
                            qty(p.remaining),
                            " kg")),
                    React.createElement("div", null,
                        React.createElement("small", null, "Purchased"),
                        React.createElement("strong", null,
                            qty(p.kg),
                            " kg")),
                    React.createElement("div", null,
                        React.createElement("small", null, "Used"),
                        React.createElement("strong", null,
                            qty(p.used),
                            " kg")),
                    React.createElement("div", null,
                        React.createElement("small", null, "Recorded \u20B1/kg"),
                        React.createElement("strong", null, money(p.price, 2)))),
                showSplit && React.createElement("p", { className: "muted small-text" },
                    "Stock recorded at ",
                    dateLabel(date),
                    ": ",
                    qty(p.remaining),
                    " kg. Still available after all recorded usage: ",
                    qty(later.remainingAfterAll),
                    " kg."),
                p.kg === null && React.createElement(Note, { tone: "warn" }, "Quantity unknown \u2014 unavailable for lot-based feed-use logging."),
                React.createElement("div", { className: "button-row" },
                    p.kg !== null && React.createElement("button", { className: "btn secondary", disabled: !usable, onClick: () => usable && this.openAction({ action: 'usage', lotId: p.id, date }) }, "Use feed"),
                    React.createElement("button", { className: "btn secondary", onClick: () => this.openAction({ action: 'feed', product: { name: p.name, phase: p.phase, lastKg: p.kg, lastCost: p.cost, lastDate: p.date }, date }) }, "Buy again"),
                    React.createElement("button", { className: "text-btn", onClick: () => this.openAction({ action: 'feed', event: p }) }, "Edit purchase")));
        };
        this.recordMatches = (e, b) => {
            const st = this.state;
            if (st.filter !== 'all' && e.type !== st.filter)
                return false;
            if (st.recordFrom && (!e.date || e.date < st.recordFrom))
                return false;
            if (st.recordTo && (!e.date || e.date > st.recordTo))
                return false;
            const q = (st.recordSearch || '').trim().toLowerCase();
            if (!q)
                return true;
            const lot = b.events.find((x) => x.id === e.lotId);
            const hay = [e.name, e.note, lot && lot.name, TYPELABEL[e.type], e.phase].filter(Boolean).join(' ').toLowerCase();
            return hay.includes(q);
        };
        this.forecastInput = (key, label, hint, step = 'any') => { const p = this.state.scenarioDraft || this.b().forecast; return React.createElement(Field, { label: label, hint: hint },
            React.createElement("input", { type: "number", min: "0", step: step, inputMode: "decimal", value: p[key] === null ? '' : p[key], onChange: e => this.setState({ scenarioDraft: Object.assign(Object.assign({}, p), { [key]: e.target.value === '' ? null : Number(e.target.value) }) }) })); };
        this.saveScenario = () => { try {
            const p = this.state.scenarioDraft || this.b().forecast;
            this.mutate((d, b) => { b.forecast = clone(p); }, 'Scenario saved');
            this.setState({ scenarioDraft: null });
        }
        catch (e) {
            this.toast(e.message);
        } };
        this.exportForecast = (rows) => { const keys = ['day', 'date', 'weight', 'feedKg', 'cost', 'dressed', 'perKg', 'fullPerKg', 'marginal', 'cycles', 'annualBreakEven', 'annualMargin']; let csv = keys.join(',') + '\n' + rows.map(r => keys.map(k => r[k] === null ? '' : typeof r[k] === 'number' ? r[k].toFixed(4) : r[k]).join(',')).join('\n'); try {
            saveDownload('flock-ledger-forecast.csv', csv, 'text/csv');
        }
        catch (e) {
            this.toast(e.message);
        } };
        this.backup = () => { try {
            saveDownload('flock-ledger-backup-' + M.today() + '.json', JSON.stringify(this.state.data, null, 2));
            if (!NATIVE)
                this.toast('Backup download started');
        }
        catch (e) {
            this.toast(e.message);
        } };
        this.importBackup = () => { try {
            const raw = this.state.importText;
            if (raw.length > 4500000)
                throw new Error('Backup exceeds the 4.5 MB import limit.');
            const d = M.validateState(JSON.parse(raw));
            if (!window.confirm(`Replace the ledger on THIS device with ${d.batches.length} batch(es) from the backup? Export the current ledger first to keep it.`))
                return;
            this.commit(d, 'Backup restored');
            this.setState({ importText: '', importError: '', scenarioDraft: null, selectedDay: null, filter: 'all' });
        }
        catch (e) {
            this.setState({ importError: e.message });
        } };
        this.chooseBackup = () => { if (NATIVE) {
            const result = nativeCall('import');
            if (result !== 'pending')
                this.toast(result || 'Import could not start.');
        }
        else
            document.getElementById('backup-file').click(); };
        let data = null, error = '';
        try {
            const raw = storeRead();
            data = raw ? M.validateState(JSON.parse(raw)) : M.seededState();
            if (!raw)
                storeWrite(data);
        }
        catch (e) {
            error = e.message;
        }
        this.state = { data, tab: 'today', morePage: 'menu', modal: null, toast: '', filter: 'all', recordSearch: '', recordFrom: '', recordTo: '', recordsShown: 50, scenarioDraft: null, selectedDay: null, showModelOverlay: false, forecastProposal: null, forecastStartReview: null, scenarioProvenance: null, importText: '', importError: '', storageError: error, loadError: !data ? error : '', capitalDraft: { name: '', cost: '', date: '' }, selectedDate: M.today(), pendingDraft: null, lastSave: null };
    }
    componentDidMount() { window.checkPendingImport = () => { if (NATIVE) {
        const text = nativeCall('take-import');
        if (text)
            window.receiveNativeBackup(text);
    } }; window.receiveNativeBackup = (text) => { const hasBatches = !!(this.state.data && this.state.data.batches && this.state.data.batches.length); this.setState({ tab: hasBatches ? 'more' : 'backup', morePage: 'backup', importText: text, importError: '' }); }; window.nativeNotice = (s) => this.toast(s); window.nativeBack = () => { if (this.state.modal) {
        this.dismissEditor();
        return true;
    } if (this.state.tab === 'more' && this.state.morePage !== 'menu') {
        this.setState({ morePage: 'menu' });
        return true;
    } if (this.state.tab !== 'today') {
        this.setState({ tab: 'today', morePage: 'menu' });
        return true;
    } return false; }; window.addEventListener('keydown', this.keydown); window.checkPendingImport(); }
    componentWillUnmount() { window.removeEventListener('keydown', this.keydown); }
    renderLastSave(b) {
        const ls = this.state.lastSave;
        if (!ls || ls.batchId !== b.id)
            return null;
        return React.createElement("section", { className: "card consequence" },
            React.createElement("strong", null, ls.message),
            React.createElement("div", { className: "button-row" },
                ls.events.map((e) => React.createElement("button", { key: e.id, type: "button", className: "text-btn", onClick: () => this.openAction({ action: e.type, event: e }) }, "Edit")),
                ls.snapshot && React.createElement("button", { type: "button", className: "text-btn", onClick: this.undoLastChange }, "Undo last change"),
                ls.events[0].type === 'feed' && ls.events[0].kg !== null && React.createElement("button", { type: "button", className: "text-btn", onClick: () => this.openAction({ action: 'usage', lotId: ls.events[0].id, date: this.state.selectedDate }) }, "Log use from this purchase")));
    }
    renderToday() {
        const b = this.b(), date = this.state.selectedDate || M.today(), s = M.summary(b, date), perf = M.recentPerformance(b, date), f = this.projection();
        const heading = workingDateTitle(date), preStart = M.validDate(date) && date < b.placementDate;
        const pts = M.weighSeriesPoints(b).filter((w) => !w.date || w.date <= date), live = M.headcount(b, date), age = M.days(b.placementDate, date);
        const series = [{ label: 'Measured sample', color: '#395a43', markAll: true, points: pts.filter((w) => w.method === 'measured') }, { label: 'Rough estimate', color: '#a57636', connect: false, open: true, points: pts.filter((w) => w.method === 'estimate') }];
        if (this.state.showModelOverlay && f.rows.length)
            series.push({ label: 'Editable scenario, not a prediction', color: '#788570', dash: true, points: f.rows.filter((r) => r.date <= date).map((r) => ({ x: r.day, y: r.weight })) });
        const attention = M.attentionItems(b, date);
        const todayEntries = b.events.filter((e) => e.date === date).sort((a, c) => (c.createdAt || '').localeCompare(a.createdAt || ''));
        const latestMeasured = M.latestWeigh(b, date, true);
        const latestAny = M.latestWeigh(b, date, false);
        const latestEstimate = latestAny && latestAny.method === 'estimate' ? latestAny : null;
        const unknownLots = (s.inventoryIncomplete ? b.events.filter((e) => e.type === 'feed' && e.kg === null && (!e.date || e.date <= date)).length : 0);
        const birdValue = preStart ? '—' : (live.confirmed ? live.count + ' birds' : 'Not counted');
        const birdSub = preStart ? 'Batch not started on this date' : (live.confirmed ? `Counted ${dateLabel(live.confirmedOn)}, less later recorded removals` : `${b.initialBirds} purchased, less recorded removals`);
        const weightMain = latestMeasured ? qty(latestMeasured.avgKg) + ' kg' : (latestEstimate ? qty(latestEstimate.avgKg) + ' kg' : 'Not recorded');
        const weightSub = latestMeasured ? `Measured average · ${dateLabel(latestMeasured.date)}` : (latestEstimate ? `Estimate · ${dateLabel(latestEstimate.date)}` : 'No weighing recorded');
        const stockValue = preStart ? '—' : (!b.events.some((e) => e.type === 'feed' && (!e.date || e.date <= date)) ? 'No feed purchases recorded' : qty(s.inventoryKg) + ' kg known remaining');
        const stockSub = preStart ? 'Batch not started on this date' : (unknownLots ? `${unknownLots} purchase${unknownLots === 1 ? ' has' : 's have'} an unknown quantity` : (s.inventoryKg === 0 ? '0 kg recorded remaining' : 'Known remaining kilograms'));
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: "batch-context" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "BATCH"),
                    React.createElement("strong", null, b.name),
                    React.createElement("p", null,
                        preStart ? 'Batch not started on this date' : (age < 0 ? 'Purchase is in the future' : `Day ${age} since purchase`),
                        b.placementEstimated ? ' · Purchase date approximate' : '',
                        " \u00B7 ",
                        dateLabel(b.placementDate))),
                React.createElement("button", { className: "btn secondary", onClick: () => this.setState({ modal: { kind: 'batch', batch: b } }) }, "Edit batch")),
            React.createElement("div", { className: "page-title" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, heading.eyebrow),
                    React.createElement("h1", null, heading.h1))),
            this.workingDateBar(),
            React.createElement("div", { className: "quick-actions eight" },
                React.createElement("button", { className: "primary-action", onClick: () => this.openAction({ action: 'usage', date }) },
                    React.createElement(Icon, { name: "log" }),
                    React.createElement("span", null, "Use feed")),
                React.createElement("button", { onClick: () => this.openAction({ action: 'feed', date }) },
                    React.createElement(Icon, { name: "feed" }),
                    React.createElement("span", null, "Buy feed")),
                React.createElement("button", { onClick: () => this.openAction({ action: 'weigh', date }) },
                    React.createElement(Icon, { name: "weight" }),
                    React.createElement("span", null, "Weigh birds")),
                React.createElement("button", { onClick: () => this.openAction({ action: 'count', date }) },
                    React.createElement(Icon, { name: "flock" }),
                    React.createElement("span", null, "Count birds")),
                React.createElement("button", { onClick: () => this.openAction({ action: 'loss', date }) },
                    React.createElement(Icon, { name: "removal" }),
                    React.createElement("span", null, "Loss / removal")),
                React.createElement("button", { onClick: () => this.openAction({ action: 'expense', date }) },
                    React.createElement(Icon, { name: "log" }),
                    React.createElement("span", null, "Expense")),
                React.createElement("button", { onClick: () => this.openAction({ action: 'harvest', date }) },
                    React.createElement(Icon, { name: "arrow" }),
                    React.createElement("span", null, "Harvest")),
                React.createElement("button", { onClick: () => this.openAction({ action: 'note', date }) },
                    React.createElement(Icon, { name: "edit" }),
                    React.createElement("span", null, "Note"))),
            preStart && React.createElement(Note, null, "Batch not started on this date. Purchased birds and chick cost are not treated as already present."),
            React.createElement("div", { className: "metrics three" },
                React.createElement(Metric, { label: "Birds", value: birdValue, sub: birdSub }),
                React.createElement(Metric, { label: "Average weight", value: weightMain, sub: React.createElement(React.Fragment, null,
                        weightSub,
                        latestMeasured && latestEstimate && latestEstimate.date > latestMeasured.date && React.createElement("span", { className: "estimate-line" },
                            "Later estimate: ",
                            qty(latestEstimate.avgKg),
                            " kg \u00B7 ",
                            dateLabel(latestEstimate.date))) }),
                React.createElement(Metric, { label: "Recorded feed stock", value: stockValue, sub: stockSub })),
            this.renderLastSave(b),
            React.createElement("section", { className: "card" },
                React.createElement(SectionTitle, { title: "Entries", sub: dateLabel(date) }),
                !todayEntries.length ? React.createElement("div", { className: "empty-log" },
                    React.createElement("strong", null, "No entries recorded for this date."),
                    React.createElement("p", { className: "muted small-text" }, "An empty log does not establish whether the work was performed.")) : todayEntries.map((e) => React.createElement("div", { className: "log-row", key: e.id },
                    React.createElement("div", null,
                        React.createElement("strong", null, e.type === 'weigh' && e.method === 'estimate' ? 'Estimated weighing' : TYPELABEL[e.type]),
                        React.createElement("small", null, recordDescription(e, b))),
                    React.createElement("div", { className: "log-row-meta" },
                        React.createElement("span", { className: "date" }, dateLabel(e.date)),
                        React.createElement("button", { className: "text-btn", onClick: () => this.openAction({ action: e.type, event: e }) }, "Edit"))))),
            !!attention.length && React.createElement("section", { className: "card" },
                React.createElement(SectionTitle, { title: "Record gaps" }),
                React.createElement("div", null, attention.map((item) => React.createElement("div", { className: "attention-item", key: item.key },
                    React.createElement("div", null,
                        React.createElement("strong", null, item.title),
                        item.detail && React.createElement("p", null, item.detail)),
                    React.createElement("button", { type: "button", className: "text-btn", onClick: () => { if (item.actionType === 'records')
                            this.switchTab('records');
                        else if (item.eventId)
                            this.openAction({ action: item.actionType, event: b.events.find((e) => e.id === item.eventId) });
                        else
                            this.openAction({ action: item.actionType, date }); } }, item.action))))),
            React.createElement("details", { className: "card batch-summary" },
                React.createElement("summary", null, "Batch summary"),
                React.createElement("h3", null, "Growth"),
                pts.length ? React.createElement(LineChart, { series: series.filter((x) => x.points.length), title: "Live weight over time", floorZero: true }) : React.createElement(Empty, { title: "Your growth chart starts here", text: "Add a dated weighing to see progress." }),
                React.createElement("label", { className: "overlay-toggle" },
                    React.createElement("input", { type: "checkbox", checked: !!this.state.showModelOverlay, onChange: e => this.setState({ showModelOverlay: e.target.checked }) }),
                    " Show modeled growth overlay"),
                !perf && React.createElement("p", { className: "muted small-text" }, "One estimated point is not a growth curve. No growth rate is inferred from it."),
                React.createElement("h3", null, "Spending"),
                React.createElement("div", { className: "detail-grid" },
                    React.createElement("div", null,
                        React.createElement("small", null, "Chicks"),
                        React.createElement("strong", null, preStart ? '—' : money(b.chickCost))),
                    React.createElement("div", null,
                        React.createElement("small", null, "Feed purchased"),
                        React.createElement("strong", null, money(s.feedPaid))),
                    React.createElement("div", null,
                        React.createElement("small", null, "Other expenses"),
                        React.createElement("strong", null, money(s.otherPaid))),
                    React.createElement("div", null,
                        React.createElement("small", null, "Batch cash recorded"),
                        React.createElement("strong", null, money(s.cashPaid)))),
                React.createElement("p", { className: "muted small-text" },
                    "Budgets ",
                    money(s.budgets),
                    " and infrastructure ",
                    money(this.capital()),
                    " stay out of this cash total."),
                React.createElement("h3", null, "Feed and production"),
                React.createElement("div", { className: "detail-grid" },
                    React.createElement("div", null,
                        React.createElement("small", null, "Known feed bought"),
                        React.createElement("strong", null,
                            qty(s.knownPurchasedKg),
                            " kg",
                            s.inventoryIncomplete ? ' + unknown' : '')),
                    React.createElement("div", null,
                        React.createElement("small", null, "Recorded feed used"),
                        React.createElement("strong", null,
                            qty(s.recordedUsedKg),
                            " kg")),
                    React.createElement("div", null,
                        React.createElement("small", null, "Known stock remaining"),
                        React.createElement("strong", null,
                            qty(s.inventoryKg),
                            " kg")),
                    React.createElement("div", null,
                        React.createElement("small", null, "Feed-use cost logged"),
                        React.createElement("strong", null, money(s.usedFeed)))),
                perf && React.createElement(Note, null,
                    React.createElement("strong", null,
                        qty(perf.gainG, 1),
                        " g/day"),
                    " observed sample growth (",
                    dateLabel(perf.start),
                    "\u2013",
                    dateLabel(perf.end),
                    "). ",
                    perf.fcr !== null ? `${qty(perf.fcr)} logged-feed ratio; incomplete usage logs can bias it.` : 'No comparable logged-feed ratio is available yet.'),
                React.createElement("h3", null, "Harvest results"),
                React.createElement("div", { className: "detail-grid" },
                    React.createElement("div", null,
                        React.createElement("small", null, "Birds harvested"),
                        React.createElement("strong", null, s.harvestedBirds)),
                    React.createElement("div", null,
                        React.createElement("small", null, "Dressed output"),
                        React.createElement("strong", null,
                            qty(s.dressedKg),
                            " kg")),
                    React.createElement("div", null,
                        React.createElement("small", null, "Cash received"),
                        React.createElement("strong", null, money(s.revenue))),
                    React.createElement("div", null,
                        React.createElement("small", null, "Kept for home"),
                        React.createElement("strong", null,
                            qty(s.homeKg),
                            " kg")))));
    }
    renderFeed() {
        const b = this.b(), date = this.state.selectedDate || M.today(), inv = M.feedInventory(b, date), budgets = b.events.filter((e) => e.type === 'budget');
        const heading = workingDateTitle(date);
        const available = inv.filter((p) => p.kg !== null && p.remaining !== null && p.remaining > 0.00001);
        const unknown = inv.filter((p) => p.kg === null);
        const used = inv.filter((p) => p.kg !== null && (p.remaining === null || p.remaining <= 0.00001));
        const known = M.sum(available.map((p) => p.remaining).concat(used.map((p) => p.remaining || 0)));
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: "page-title" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "FEED"),
                    React.createElement("h1", null, "Lots on hand"),
                    React.createElement("p", null,
                        heading.h1 === 'Today' ? 'Working date: today' : heading.h1,
                        ". Each purchase stays its own lot.")),
                React.createElement("button", { className: "btn primary", onClick: () => this.openAction({ action: 'feed', date }) },
                    React.createElement(Icon, { name: "plus" }),
                    "Buy feed")),
            this.workingDateBar(),
            React.createElement("div", { className: "feed-summary" },
                React.createElement("strong", null,
                    qty(known),
                    " kg known remaining"),
                unknown.length ? React.createElement("span", { className: "muted" },
                    unknown.length,
                    " purchase",
                    unknown.length === 1 ? ' has' : 's have',
                    " an unknown quantity") : React.createElement("span", { className: "muted" }, "Known remaining kilograms")),
            this.renderLastSave(b),
            !inv.length && React.createElement(Empty, { title: "No purchase lots yet", text: "Buy feed with a known quantity to create a lot you can use.", action: React.createElement("button", { className: "btn secondary", onClick: () => this.openAction({ action: 'feed', date }) }, "Buy feed") }),
            !!available.length && React.createElement(React.Fragment, null,
                React.createElement("h2", { className: "group-heading" }, "Available recorded stock"),
                available.map((p) => this.renderLotCard(p, date))),
            !!unknown.length && React.createElement(React.Fragment, null,
                React.createElement("h2", { className: "group-heading" }, "Quantity unknown"),
                unknown.map((p) => this.renderLotCard(p, date))),
            !!used.length && React.createElement("details", { className: "used-lots" },
                React.createElement("summary", null,
                    "Fully used (",
                    used.length,
                    ")"),
                used.map((p) => this.renderLotCard(p, date, { used: true }))),
            React.createElement("section", { className: "card budget-section" },
                React.createElement(SectionTitle, { title: "Feed budgets", sub: "Plans, not cash and not consumption" }),
                !budgets.length ? React.createElement("p", { className: "muted small-text" }, "No feed budgets on this batch.") : budgets.map((e) => React.createElement("div", { className: "recent-row", key: e.id },
                    React.createElement("div", null,
                        React.createElement("strong", null, e.name || 'Feed budget'),
                        React.createElement("small", null,
                            money(e.cost),
                            " planned \u00B7 ",
                            dateLabel(e.date)),
                        React.createElement("div", { className: "button-row" },
                            React.createElement("button", { className: "text-btn", onClick: () => this.openAction({ action: 'feed', convert: e, date }) }, "Record actual purchase")))))));
    }
    renderRecords() {
        const b = this.b(), st = this.state;
        const matched = b.events.filter((e) => this.recordMatches(e, b)).sort((a, c) => (c.date || '').localeCompare(a.date || '') || (c.createdAt || '').localeCompare(a.createdAt || ''));
        const groups = [];
        const unknown = matched.filter((e) => !e.date);
        const dated = matched.filter((e) => e.date);
        const byDate = {};
        dated.forEach((e) => { byDate[e.date] = byDate[e.date] || []; byDate[e.date].push(e); });
        Object.keys(byDate).sort((a, c) => c.localeCompare(a)).forEach(d => groups.push({ key: d, title: dateLabel(d), rows: byDate[d].sort((a, c) => (c.createdAt || '').localeCompare(a.createdAt || '')) }));
        if (unknown.length)
            groups.push({ key: 'unknown', title: 'Date unknown', rows: unknown });
        let remaining = st.recordsShown || 50;
        const visible = [];
        for (const g of groups) {
            if (remaining <= 0)
                break;
            const rows = g.rows.slice(0, remaining);
            remaining -= rows.length;
            visible.push(Object.assign(Object.assign({}, g), { rows }));
        }
        const shown = visible.reduce((n, g) => n + g.rows.length, 0);
        const clear = () => this.setState({ filter: 'all', recordSearch: '', recordFrom: '', recordTo: '', recordsShown: 50 });
        const filtersOn = st.filter !== 'all' || st.recordSearch || st.recordFrom || st.recordTo;
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: "page-title" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "RECORDS"),
                    React.createElement("h1", null, "Dated log"),
                    React.createElement("p", null, "Search and correct historical entries. Unknown dates stay in their own group.")),
                React.createElement("button", { className: "btn primary", onClick: this.openChooser },
                    React.createElement(Icon, { name: "plus" }),
                    "Add record")),
            this.renderLastSave(b),
            React.createElement("section", { className: "card" },
                React.createElement("div", { className: "filter-row records-filters" },
                    React.createElement(Field, { label: "Search" },
                        React.createElement("input", { "aria-label": "Search records", value: st.recordSearch, onChange: e => this.setState({ recordSearch: e.target.value, recordsShown: 50 }), placeholder: "Name, note, or feed product" })),
                    React.createElement(Field, { label: "Record type" },
                        React.createElement("select", { "aria-label": "Filter records", value: st.filter, onChange: e => this.setState({ filter: e.target.value, recordsShown: 50 }) },
                            React.createElement("option", { value: "all" }, "All records"),
                            Object.entries(TYPELABEL).map(([v, l]) => React.createElement("option", { key: v, value: v }, l)))),
                    React.createElement(Field, { label: "From" },
                        React.createElement("input", { type: "date", "aria-label": "Records from date", value: st.recordFrom, onChange: e => this.setState({ recordFrom: e.target.value, recordsShown: 50 }) })),
                    React.createElement(Field, { label: "To" },
                        React.createElement("input", { type: "date", "aria-label": "Records to date", value: st.recordTo, onChange: e => this.setState({ recordTo: e.target.value, recordsShown: 50 }) })),
                    filtersOn && React.createElement("button", { type: "button", className: "btn secondary", onClick: clear }, "Clear filters"),
                    React.createElement("span", { className: "muted" },
                        matched.length,
                        " matching")),
                !matched.length ? React.createElement(Empty, { title: "No entries here yet", text: "Add a record for this batch." }) : visible.map((g) => React.createElement("div", { className: "record-group", key: g.key },
                    React.createElement("h2", null, g.title),
                    g.rows.map((e) => React.createElement("article", { className: "record", key: e.id },
                        React.createElement("div", { className: "record-top" },
                            React.createElement(Badge, { kind: e.type === 'budget' || e.method === 'estimate' ? 'warn' : 'muted' }, e.type === 'weigh' && e.method === 'estimate' ? 'Estimated weight' : TYPELABEL[e.type]),
                            React.createElement("span", null, dateLabel(e.date))),
                        React.createElement("h3", null, e.name || TYPELABEL[e.type]),
                        React.createElement("p", null, recordDescription(e, b)),
                        e.note && e.type !== 'note' && React.createElement("p", { className: "record-note" }, e.note),
                        React.createElement("div", { className: "record-buttons" },
                            e.type === 'budget' && React.createElement("button", { className: "text-btn", onClick: () => this.openAction({ action: 'feed', convert: e, date: this.state.selectedDate }) },
                                "Record actual purchase ",
                                React.createElement(Icon, { name: "arrow", size: 15 })),
                            React.createElement("div", { className: "spacer" }),
                            React.createElement("button", { className: "icon-btn", title: "Edit record", "aria-label": 'Edit ' + (e.name || TYPELABEL[e.type]), onClick: () => this.openAction({ action: e.type, event: e }) },
                                React.createElement(Icon, { name: "edit", size: 17 })),
                            React.createElement("button", { className: "icon-btn danger", title: "Delete record", "aria-label": 'Delete ' + (e.name || TYPELABEL[e.type]), onClick: () => this.deleteRecord(e) },
                                React.createElement(Icon, { name: "trash", size: 17 }))))))),
                shown < matched.length && React.createElement("button", { type: "button", className: "btn secondary", onClick: () => this.setState({ recordsShown: shown + 50 }) }, "Show more")));
    }
    renderForecast() {
        const b = this.b(), p = this.state.scenarioDraft || b.forecast, f = this.projection(), s = M.summary(b, p.startDate || M.today()), perf = M.recentPerformance(b);
        const chosen = f.rows.find((r) => r.day === this.state.selectedDay) || f.best;
        const important = f.rows.filter((r) => { var _a; return [f.startDay, 35, 38, 40, 42, 45, 47, 49, 52, 56, 60, 70, 84, p.endDay, (_a = f.best) === null || _a === void 0 ? void 0 : _a.day, this.state.selectedDay].includes(r.day); });
        const dirty = !!this.state.scenarioDraft;
        const proposal = this.state.forecastProposal;
        const review = this.state.forecastStartReview;
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: "page-title" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "HARVEST PLANNER"),
                    React.createElement("h1", null, f.rows.length ? (dirty ? 'Unsaved scenario' : 'Harvest comparison') : 'Set up a harvest comparison'),
                    React.createElement("p", null, f.rows.length ? 'Lowest modeled operating cost within this scenario and comparison range.' : 'Enter a starting flock state and the costs you want to model.')),
                React.createElement(Badge, { kind: "warn" }, "Scenario, not a guarantee")),
            f.rows.length > 0 && chosen && React.createElement(React.Fragment, null,
                React.createElement("section", { className: "card result-card" },
                    React.createElement(SectionTitle, { title: "Lowest modeled operating cost", sub: "A low within the selected scenario and comparison range" }),
                    React.createElement("p", { className: "primary-metric" },
                        money(f.best.perKg, 2),
                        "/kg dressed"),
                    React.createElement("p", null,
                        dateLabel(f.best.date),
                        " \u00B7 Day ",
                        f.best.day,
                        " since purchase"),
                    React.createElement("p", null,
                        "Dates within 1% of that cost: ",
                        f.nearBest.map((r) => dateShort(r.date)).filter((v, i, a) => a.indexOf(v) === i).join(', ')),
                    f.atBoundary && React.createElement(Note, { tone: "warn" }, "This low is at the edge of the selected date range. It does not establish an interior optimum."))),
            f.rows.length > 0 && chosen && React.createElement(React.Fragment, null,
                React.createElement("section", { className: "card" },
                    React.createElement(SectionTitle, { title: "Operating cost per dressed kilogram", sub: `${p.birds} birds · ${p.yieldPct}% dressed yield · no future deaths modeled` }),
                    React.createElement(LineChart, { unit: "\u20B1/kg", title: "Projected cost per dressed kilogram", series: [{ label: 'Operating cost only', color: '#395a43', points: f.rows.map((r) => ({ x: r.day, y: r.perKg })) }, { label: `Including pen recovery over ${this.state.data.settings.recoveryBatches} batches`, color: '#a57636', dash: true, points: f.rows.map((r) => ({ x: r.day, y: r.fullPerKg })) }] }),
                    React.createElement(Note, null,
                        "Further growth lowers the average cost only while ",
                        React.createElement("strong", null, "marginal cost/kg is below the existing average cost/kg"),
                        ". A low scenario cost does not establish health, welfare or market suitability.")),
                React.createElement("section", { className: "card" },
                    React.createElement(SectionTitle, { title: "Compare slaughter dates", sub: "Tap a row to update the annual comparison. All rows are modeled, not observations." }),
                    React.createElement(Field, { label: "Harvest date for annual comparison" },
                        React.createElement("select", { value: chosen.day, onChange: e => this.setState({ selectedDay: Number(e.target.value) }) }, f.rows.map((r) => React.createElement("option", { value: r.day, key: r.day },
                            "Day ",
                            r.day,
                            " \u00B7 ",
                            dateLabel(r.date),
                            " \u00B7 ",
                            money(r.perKg, 2),
                            "/kg")))),
                    React.createElement("div", { className: "table-wrap" },
                        React.createElement("table", { className: "forecast-table" },
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", null, "Date"),
                                    React.createElement("th", null, "Live kg/bird"),
                                    React.createElement("th", { className: "desk-only" }, "Extra feed kg"),
                                    React.createElement("th", { className: "desk-only" }, "Operating \u20B1"),
                                    React.createElement("th", { className: "desk-only" }, "Dressed kg"),
                                    React.createElement("th", null, "Operating \u20B1/kg"),
                                    React.createElement("th", { className: "desk-only" }, "Next-day marginal \u20B1/kg*"))),
                            React.createElement("tbody", null, important.map((r) => { const next = f.rows.find((n) => n.day === r.day + 1); return React.createElement("tr", { key: r.day, className: r.day === chosen.day ? 'selected' : '', onClick: () => this.setState({ selectedDay: r.day }) },
                                React.createElement("td", null,
                                    React.createElement("button", { className: "day-pick", "aria-label": 'Select day ' + r.day },
                                        "Day ",
                                        r.day),
                                    React.createElement("small", null, dateLabel(r.date)),
                                    r.day === f.best.day && React.createElement(Badge, { kind: "green" }, "Scenario low")),
                                React.createElement("td", null, qty(r.weight)),
                                React.createElement("td", { className: "desk-only" }, qty(r.feedKg, 1)),
                                React.createElement("td", { className: "desk-only" }, money(r.cost)),
                                React.createElement("td", { className: "desk-only" }, qty(r.dressed, 1)),
                                React.createElement("td", null,
                                    React.createElement("strong", null, money(r.perKg, 2))),
                                React.createElement("td", { className: "desk-only" }, next ? money(next.marginal, 2) : '—')); })))),
                    chosen && React.createElement("div", { className: "phone-row-detail" },
                        React.createElement("h3", null,
                            "Selected day ",
                            chosen.day),
                        React.createElement("div", { className: "detail-grid" },
                            React.createElement("div", null,
                                React.createElement("small", null, "Cumulative extra feed"),
                                React.createElement("strong", null,
                                    qty(chosen.feedKg, 1),
                                    " kg")),
                            React.createElement("div", null,
                                React.createElement("small", null, "Operating cost"),
                                React.createElement("strong", null, money(chosen.cost))),
                            React.createElement("div", null,
                                React.createElement("small", null, "Dressed output"),
                                React.createElement("strong", null,
                                    qty(chosen.dressed, 1),
                                    " kg")),
                            React.createElement("div", null,
                                React.createElement("small", null, "Next-day marginal cost"),
                                React.createElement("strong", null, (() => { const next = f.rows.find((n) => n.day === chosen.day + 1); return next ? money(next.marginal, 2) : '—'; })())))),
                    React.createElement("p", { className: "muted small-text" }, "*Cost of the additional dressed gain during the next modeled day. Extra feed is cumulative from the projection start. It is feed consumed, not necessarily new feed to purchase."),
                    React.createElement("div", { className: "button-row" },
                        React.createElement("button", { className: "btn secondary small", onClick: () => this.exportForecast(f.rows) }, "Export daily comparison CSV")))),
            React.createElement("section", { className: "card" },
                React.createElement(SectionTitle, { title: "Starting flock and cost", sub: "The cost and flock state must refer to the same date." }),
                React.createElement("div", { className: "form-grid three" },
                    React.createElement(Field, { label: "Starting date" },
                        React.createElement("input", { type: "date", min: b.placementDate, value: p.startDate || '', onChange: e => { const next = e.target.value; const prev = p.startDate; this.setState({ scenarioDraft: Object.assign(Object.assign({}, p), { startDate: next }), forecastStartReview: prev && next && prev !== next ? { from: prev, to: next, birds: p.birds, weightKg: p.weightKg, baselineCost: p.baselineCost } : null, scenarioProvenance: this.state.scenarioProvenance === 'records' ? null : this.state.scenarioProvenance }); } })),
                    this.forecastInput('birds', 'Birds remaining at start', 'Required; use a real count or an explicitly chosen scenario.', 1),
                    this.forecastInput('weightKg', 'Average live weight at start (kg)', 'Use a weighed sample average. Rough estimates are not measured samples.'),
                    this.forecastInput('baselineCost', 'Operating cost USED by start (₱)', 'Chicks + feed already used + other costs. Exclude unused feed, budgets and the pen.'),
                    this.forecastInput('feedPrice', 'Future feed price (₱ per kg)', 'Enter your actual purchase price, or your chosen scenario price.'),
                    this.forecastInput('yieldPct', 'Dressed yield (%)', '70% is an editable illustration. Actual yield comes from harvest records.')),
                !this.state.scenarioProvenance && !this.state.scenarioDraft && React.createElement("p", { className: "muted small-text" }, "Saved scenario values. How they were entered is not reconstructed."),
                review && React.createElement(Note, { tone: "warn" },
                    "Starting date changed from ",
                    dateLabel(review.from),
                    " to ",
                    dateLabel(review.to),
                    ". Birds, weight, and cost need review. ",
                    React.createElement("button", { type: "button", className: "text-btn", onClick: () => { var _a; const prop = M.proposeForecastStart(b); this.setState({ scenarioDraft: Object.assign(Object.assign({}, p), { startDate: review.to, weightKg: prop.weightKg, birds: prop.birds, baselineCost: prop.baselineCost, feedPrice: (_a = prop.feedPrice) !== null && _a !== void 0 ? _a : p.feedPrice }), forecastStartReview: null, scenarioProvenance: 'records', forecastProposal: null }); } }, "Reset date-dependent starting values from records"),
                    " \u00B7 ",
                    React.createElement("button", { type: "button", className: "text-btn", onClick: () => this.setState({ forecastStartReview: null, scenarioProvenance: 'chosen' }) }, "Retain them as values chosen for the new date")),
                React.createElement("div", { className: "button-row" },
                    React.createElement("button", { className: "btn secondary", onClick: () => { const prop = M.proposeForecastStart(b); if (!prop.startDate) {
                            this.toast('Add a weighing first.');
                            return;
                        } this.setState({ forecastProposal: prop }); } }, "Use latest records"),
                    React.createElement("button", { className: "btn secondary", onClick: () => this.setState({ scenarioDraft: Object.assign(Object.assign({}, p), { baselineCost: s.usedOperating }) }) },
                        "Use logged production costs (",
                        money(s.usedOperating),
                        ")")),
                proposal && React.createElement("div", { className: "proposal-table" },
                    React.createElement("h3", null, "Values that will be copied"),
                    React.createElement("table", null,
                        React.createElement("tbody", null,
                            React.createElement("tr", null,
                                React.createElement("th", null, "Weight"),
                                React.createElement("td", null, proposal.weightKg == null ? 'Not recorded' : `${qty(proposal.weightKg)} kg · ${proposal.weightMethod} · ${dateLabel(proposal.startDate)}`)),
                            React.createElement("tr", null,
                                React.createElement("th", null, "Bird count"),
                                React.createElement("td", null, proposal.birds == null ? 'Not a verified count on this date' : `${proposal.birds} birds from a count record, less later recorded removals. Not a physical count on the weigh date.`)),
                            React.createElement("tr", null,
                                React.createElement("th", null, "Starting cost"),
                                React.createElement("td", null, proposal.baselineCost == null ? 'Not recorded' : money(proposal.baselineCost) + ' consumption-based logged production cost at the starting date')),
                            React.createElement("tr", null,
                                React.createElement("th", null, "Feed price"),
                                React.createElement("td", null, proposal.feedPrice == null ? 'Not recorded' : `${money(proposal.feedPrice, 2)}/kg${proposal.feedPriceDate ? ' · ' + dateLabel(proposal.feedPriceDate) : ''}`)))),
                    React.createElement("p", { className: "muted small-text" }, "Logged production cost reflects entered records. Unrecorded feed use or expenses may make it incomplete. Missing values remain blank."),
                    React.createElement("div", { className: "button-row" },
                        React.createElement("button", { className: "btn primary", onClick: () => { this.setState({ scenarioDraft: Object.assign(Object.assign({}, p), { startDate: proposal.startDate, weightKg: proposal.weightKg, birds: proposal.birds, baselineCost: proposal.baselineCost, feedPrice: proposal.feedPrice }), forecastProposal: null, scenarioProvenance: 'records' }); } }, "Apply these values"),
                        React.createElement("button", { className: "btn secondary", onClick: () => this.setState({ forecastProposal: null }) }, "Cancel"))),
                React.createElement("p", { className: "muted small-text" }, "Logged production costs may be incomplete. Include only chicks, feed already used, and other incurred costs at the projection start. Exclude unused feed, future budgets, and shared infrastructure."),
                perf && React.createElement(Note, null,
                    "Observed ",
                    qty(perf.gainG, 1),
                    " g/day between the last two measured samples. Enter growth assumptions below; they are not filled automatically.")),
            React.createElement("section", { className: "card" },
                React.createElement(SectionTitle, { title: "Growth and feed assumptions", sub: "Editable scenario values, not a breed curve" }),
                React.createElement("div", { className: "form-grid three" },
                    this.forecastInput('gainG', 'Starting daily gain (g)', 'Live-weight gain on the first modeled day.'),
                    this.forecastInput('gainDeclinePct', 'Daily growth decline (%)', '0 keeps gain constant.'),
                    this.forecastInput('fcr', 'Incremental FCR', 'Feed kilograms used for each additional kilogram of live weight.'),
                    this.forecastInput('fcrRise', 'Daily FCR increase', 'How quickly conversion worsens.'),
                    this.forecastInput('dailyOther', 'Extra daily flock costs (₱)', 'Charged once per elapsed modeled day.'),
                    this.forecastInput('endDay', 'Final day since purchase', 'Must be after the projection start.', 1)),
                React.createElement("div", { className: "form-grid" },
                    React.createElement(Field, { label: "Dressed sale / replacement price (\u20B1/kg)", hint: "Leave blank to hide profit figures." },
                        React.createElement("input", { type: "number", min: "0", step: "any", value: p.salePrice === null ? '' : p.salePrice, onChange: e => this.setState({ scenarioDraft: Object.assign(Object.assign({}, p), { salePrice: e.target.value === '' ? null : Number(e.target.value) }) }) })),
                    this.forecastInput('downtime', 'Days between batches', 'Turnaround after a full cycle.', 1)),
                React.createElement("div", { className: "button-row" },
                    React.createElement("button", { className: "btn primary", onClick: this.saveScenario }, "Save scenario"))),
            dirty && f.errors.length > 0 && React.createElement("section", { className: "card" },
                React.createElement("div", { className: "requirements" }, f.errors.map((err) => React.createElement("p", { key: err }, err)))),
            b.events.some((e) => e.type === 'harvest') && React.createElement(Note, { tone: "warn" }, "This is a forward scenario for the remaining birds only. Allocate the starting cost to those birds; do not load the full batch cost after a partial harvest. The app does not infer that allocation."),
            f.rows.length > 0 && chosen && React.createElement(React.Fragment, null,
                React.createElement("section", { className: "card annual" },
                    React.createElement(SectionTitle, { title: `Repeat-batch economics · day ${chosen.day}`, sub: "365-day capacity scenario, not a calendar schedule or promised profit" }),
                    React.createElement("div", { className: "metrics compact" },
                        React.createElement(Metric, { label: "Full cycles in 365 days", value: chosen.cycles, sub: `${chosen.day} days growing + ${p.downtime} days turnaround each` }),
                        React.createElement(Metric, { label: "Recurring batch cost", value: money(chosen.cost), sub: "Repeats this exact operating-cost scenario" }),
                        React.createElement(Metric, { label: "First-year break-even", value: money(chosen.annualBreakEven, 2) + '/kg', sub: "Includes one full recovery of farm capital" }),
                        React.createElement(Metric, { label: "First-year cash margin*", value: money(chosen.annualMargin), sub: p.salePrice === null ? 'Enter a selling price above' : 'After one capital recovery; listed costs only' })),
                    React.createElement("div", { className: "detail-grid" },
                        React.createElement("div", null,
                            React.createElement("small", null, "Annual dressed output"),
                            React.createElement("strong", null,
                                qty(chosen.annualKg, 1),
                                " kg")),
                        React.createElement("div", null,
                            React.createElement("small", null, "Annual recurring cost"),
                            React.createElement("strong", null, money(chosen.annualCost))),
                        React.createElement("div", null,
                            React.createElement("small", null, "Capital recovered once"),
                            React.createElement("strong", null, money(this.capital()))),
                        React.createElement("div", null,
                            React.createElement("small", null, "Per-batch operating margin*"),
                            React.createElement("strong", null, money(chosen.margin)))),
                    React.createElement("p", { className: "small-text muted" }, "*Only cash profit if every modeled dressed kilogram is sold at the entered price. For home use it is replacement-value savings, not cash income. Excludes any labor, utilities, losses, taxes, selling or processing costs you have not entered. No overlapping flocks; downtime after each full cycle is counted conservatively. Repeating this batch's partial-age starting cost is a deliberate scenario, not a prediction for future flocks."))),
            React.createElement("section", { className: "card" },
                React.createElement(SectionTitle, { title: "How this is calculated" }),
                React.createElement("div", { className: "formula" },
                    "Daily gain = starting gain \u00D7 (1 \u2212 daily decline)",
                    React.createElement("sup", null, "days elapsed"),
                    React.createElement("br", null),
                    "Extra feed = live birds \u00D7 daily live gain \u00D7 incremental FCR",
                    React.createElement("br", null),
                    "Operating cost = starting used cost + extra feed cost + extra daily costs",
                    React.createElement("br", null),
                    "Dressed kg = live birds \u00D7 projected average live kg \u00D7 yield",
                    React.createElement("br", null),
                    "Cost/kg = operating cost \u00F7 dressed kg"),
                React.createElement("p", { className: "muted small-text" }, "Weights, gain and FCR here are explicit assumptions. No automatic breeding-strain curve, compensatory-growth claim or age-specific nutritional prescription is built in. Costs can rise beyond the feed budget.")));
    }
    renderBatches() {
        const d = this.state.data;
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: "page-title" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "MORE"),
                    React.createElement("h1", null, "Batches"),
                    React.createElement("p", null, "Keep each flock's records separate.")),
                React.createElement("div", { className: "button-row" },
                    React.createElement("button", { type: "button", className: "btn secondary", onClick: () => this.openMore('menu') }, "Back"),
                    React.createElement("button", { className: "btn primary", onClick: () => this.setState({ modal: { kind: 'batch' } }) },
                        React.createElement(Icon, { name: "plus" }),
                        "New batch"))),
            React.createElement("div", { className: "batch-grid" }, d.batches.map((b) => { const s = M.summary(b), selected = b.id === d.selectedBatchId; return React.createElement("section", { className: 'card batch-card ' + (selected ? 'active' : ''), key: b.id },
                React.createElement(Badge, { kind: b.status === 'active' ? 'green' : 'muted' }, b.status),
                React.createElement("h2", null, b.name),
                React.createElement("p", null,
                    dateLabel(b.placementDate),
                    b.placementEstimated ? ' · approximate' : ''),
                React.createElement("div", { className: "detail-grid" },
                    React.createElement("div", null,
                        React.createElement("small", null, "Placed"),
                        React.createElement("strong", null,
                            b.initialBirds,
                            " birds")),
                    React.createElement("div", null,
                        React.createElement("small", null, "Cash recorded"),
                        React.createElement("strong", null, money(s.cashPaid))),
                    React.createElement("div", null,
                        React.createElement("small", null, "Dressed output"),
                        React.createElement("strong", null,
                            qty(s.dressedKg),
                            " kg")),
                    React.createElement("div", null,
                        React.createElement("small", null, "Cash received"),
                        React.createElement("strong", null, money(s.revenue)))),
                React.createElement("div", { className: "button-row" },
                    React.createElement("button", { className: 'btn small ' + (selected ? 'secondary' : 'primary'), onClick: () => { try {
                            this.mutate((d) => { d.selectedBatchId = b.id; });
                            this.setState({ scenarioDraft: null, selectedDay: null, tab: 'today' });
                        }
                        catch (e) {
                            this.toast(e.message);
                        } } }, selected ? 'Open current batch' : 'Open batch'),
                    React.createElement("button", { className: "icon-btn", "aria-label": 'Edit ' + b.name, onClick: () => this.setState({ modal: { kind: 'batch', batch: b } }) },
                        React.createElement(Icon, { name: "edit" })))); })));
    }
    renderInfrastructure() {
        const d = this.state.data;
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: "page-title" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "MORE"),
                    React.createElement("h1", null, "Shared infrastructure"),
                    React.createElement("p", null, "One-time purchases, separate from feed and chicks.")),
                React.createElement("button", { type: "button", className: "btn secondary", onClick: () => this.openMore('menu') }, "Back")),
            React.createElement("section", { className: "card" },
                React.createElement(SectionTitle, { title: "Capital items", sub: "Not operating cost" }),
                React.createElement("div", { className: "table-wrap" },
                    React.createElement("table", null,
                        React.createElement("thead", null,
                            React.createElement("tr", null,
                                React.createElement("th", null, "Item"),
                                React.createElement("th", null, "Date"),
                                React.createElement("th", null, "Cost"),
                                React.createElement("th", null))),
                        React.createElement("tbody", null, d.settings.capital.map((a) => React.createElement("tr", { key: a.id },
                            React.createElement("td", null, a.name),
                            React.createElement("td", null, dateLabel(a.date)),
                            React.createElement("td", null, money(a.cost)),
                            React.createElement("td", null,
                                React.createElement("button", { className: "icon-btn danger", "aria-label": 'Remove capital ' + a.name, onClick: () => { if (!window.confirm('Remove this infrastructure record?'))
                                        return; try {
                                        this.mutate((d) => { d.settings.capital = d.settings.capital.filter((x) => x.id !== a.id); });
                                    }
                                    catch (e) {
                                        this.toast(e.message);
                                    } } },
                                    React.createElement(Icon, { name: "trash", size: 16 })))))))),
                React.createElement("form", { onSubmit: e => { e.preventDefault(); const c = this.state.capitalDraft; try {
                        this.mutate((d) => { d.settings.capital.push({ id: M.uid(), name: c.name, date: c.date || null, cost: Number(c.cost) }); });
                        this.setState({ capitalDraft: { name: '', cost: '', date: '' } });
                    }
                    catch (err) {
                        this.toast(err.message);
                    } } },
                    React.createElement("div", { className: "form-grid three" },
                        React.createElement(Field, { label: "New infrastructure item" },
                            React.createElement("input", { required: true, maxLength: 180, value: this.state.capitalDraft.name, onChange: e => this.setState({ capitalDraft: Object.assign(Object.assign({}, this.state.capitalDraft), { name: e.target.value }) }) })),
                        React.createElement(Field, { label: "Amount (\u20B1)" },
                            React.createElement("input", { required: true, type: "number", min: "0", step: "0.01", value: this.state.capitalDraft.cost, onChange: e => this.setState({ capitalDraft: Object.assign(Object.assign({}, this.state.capitalDraft), { cost: e.target.value }) }) })),
                        React.createElement(Field, { label: "Purchase date (optional)" },
                            React.createElement("input", { type: "date", value: this.state.capitalDraft.date, onChange: e => this.setState({ capitalDraft: Object.assign(Object.assign({}, this.state.capitalDraft), { date: e.target.value }) }) }))),
                    React.createElement("button", { className: "btn secondary small", type: "submit" }, "Add infrastructure")),
                React.createElement("hr", null),
                React.createElement(Field, { label: "Batches over which to show capital recovery", hint: "A planning allocation, not tax depreciation. This never changes operating-only cost/kg." },
                    React.createElement("input", { type: "number", min: "1", max: "1000", step: "1", value: d.settings.recoveryBatches, onChange: e => { const n = Number(e.target.value); if (Number.isInteger(n) && n > 0 && n <= 1000) {
                            try {
                                this.mutate((d) => { d.settings.recoveryBatches = n; });
                            }
                            catch (err) {
                                this.toast(err.message);
                            }
                        } } })),
                React.createElement("p", null,
                    "At ",
                    d.settings.recoveryBatches,
                    " batches, shared capital adds ",
                    React.createElement("strong", null,
                        money(this.capital() / d.settings.recoveryBatches, 2),
                        " per batch"),
                    " to the full-cost scenario, before dividing by dressed kilograms.")));
    }
    renderBackup() {
        const nested = !!(this.state.data && this.state.data.batches && this.state.data.batches.length);
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: "page-title" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, nested ? 'MORE' : 'BACKUP'),
                    React.createElement("h1", null, "Backup & transfer"),
                    React.createElement("p", null, "Offline storage on this device. No account, subscription or cloud service.")),
                React.createElement("div", { className: "button-row" },
                    nested && React.createElement("button", { type: "button", className: "btn secondary", onClick: () => this.openMore('menu') }, "Back"),
                    React.createElement(Badge, { kind: "green" }, NATIVE ? 'Android local storage' : 'Browser local storage'))),
            React.createElement(Note, { tone: "warn" },
                React.createElement("strong", null, "Phone and tablet do not automatically sync."),
                " Export a JSON backup on the device with the newest data, then import it on the other device. Import replaces the whole local ledger; it does not merge records. Back up before uninstalling or clearing app data."),
            React.createElement("div", { className: "two-col" },
                React.createElement("section", { className: "card" },
                    React.createElement(SectionTitle, { title: "Save a backup", sub: "All batches, entries, scenarios and infrastructure" }),
                    React.createElement("p", null, "Keep a dated JSON copy outside the app. You can restore it or transfer it to your other device."),
                    React.createElement("button", { className: "btn primary", onClick: this.backup },
                        React.createElement(Icon, { name: "save" }),
                        "Export JSON backup")),
                React.createElement("section", { className: "card" },
                    React.createElement(SectionTitle, { title: "Restore or transfer", sub: "Choose a backup file or paste its contents" }),
                    React.createElement("button", { className: "btn secondary", onClick: this.chooseBackup }, "Choose JSON backup file"),
                    React.createElement("input", { hidden: true, id: "backup-file", type: "file", accept: ".json,application/json", onChange: e => { var _a; const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]; if (!file)
                            return; if (file.size > 4500000) {
                            this.setState({ importError: 'Backup exceeds 4.5 MB.' });
                            return;
                        } const reader = new FileReader(); reader.onload = () => this.setState({ importText: String(reader.result), importError: '' }); reader.onerror = () => this.setState({ importError: 'Could not read this file.' }); reader.readAsText(file); e.target.value = ''; } }),
                    React.createElement(Field, { label: "Backup JSON", wide: true },
                        React.createElement("textarea", { rows: 6, spellCheck: false, value: this.state.importText, placeholder: "Paste a Flock Ledger backup here\u2026", onChange: e => this.setState({ importText: e.target.value, importError: '' }) })),
                    this.state.importError && React.createElement(Note, { tone: "error" }, this.state.importError),
                    React.createElement("button", { className: "btn primary", disabled: !this.state.importText.trim(), onClick: this.importBackup }, "Validate & restore backup"))));
    }
    renderAbout() {
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: "page-title" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "MORE"),
                    React.createElement("h1", null, "About & calculation definitions"),
                    React.createElement("p", null, "Flock Ledger 1.0 \u00B7 offline records")),
                React.createElement("button", { type: "button", className: "btn secondary", onClick: () => this.openMore('menu') }, "Back")),
            React.createElement("section", { className: "card" },
                React.createElement(SectionTitle, { title: "About this build", sub: "Offline records on this device" }),
                React.createElement("p", null, "Records and calculations run entirely on your device. The APK has no internet permission, analytics or advertising. No feed-price service or market-price feed is connected."),
                React.createElement("div", { className: "detail-grid" },
                    React.createElement("div", null,
                        React.createElement("small", null, "Currency"),
                        React.createElement("strong", null, "Philippine pesos")),
                    React.createElement("div", null,
                        React.createElement("small", null, "Date basis"),
                        React.createElement("strong", null, "Device-local calendar dates")),
                    React.createElement("div", null,
                        React.createElement("small", null, "Measured vs modeled"),
                        React.createElement("strong", null, "Always labeled separately")),
                    React.createElement("div", null,
                        React.createElement("small", null, "Weight basis"),
                        React.createElement("strong", null, "Live and dressed kept separate"))),
                React.createElement("hr", null),
                React.createElement("h3", null, "What \u201Ccost\u201D means here"),
                React.createElement("p", null,
                    React.createElement("strong", null, "Recorded cash:"),
                    " chicks + feed purchases + expenses. Unused feed still belongs in this cash total."),
                React.createElement("p", null,
                    React.createElement("strong", null, "Logged production cost:"),
                    " chicks + priced feed-use logs + historical feed-use adjustments + expenses. Missing logs make this incomplete."),
                React.createElement("p", null,
                    React.createElement("strong", null, "Forecast cost:"),
                    " your entered starting production cost plus modeled future feed use and daily expenses. Budgets and shared capital are not silently added."),
                React.createElement("p", null,
                    React.createElement("strong", null, "Capital recovery:"),
                    " a separate allocation across your selected number of batches. First-year comparisons recover the shared capital once."),
                React.createElement("p", null,
                    React.createElement("strong", null, "Data quality:"),
                    " purchase date may be approximate; age at purchase, survivors, feed quantity and weights can remain unknown. No breed growth targets are embedded.")));
    }
    renderMore() {
        const page = this.state.morePage || 'menu';
        if (page === 'batches')
            return this.renderBatches();
        if (page === 'infrastructure')
            return this.renderInfrastructure();
        if (page === 'backup')
            return this.renderBackup();
        if (page === 'about')
            return this.renderAbout();
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: "page-title" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "MORE"),
                    React.createElement("h1", null, "More"),
                    React.createElement("p", null, "Batches, infrastructure, backup, and how the ledger calculates cost."))),
            React.createElement("nav", { className: "more-menu", "aria-label": "More pages" },
                React.createElement("button", { type: "button", className: "more-link", "aria-label": "Batches", onClick: () => this.openMore('batches') },
                    React.createElement("strong", null, "Batches"),
                    React.createElement("span", null, "Add or open a flock")),
                React.createElement("button", { type: "button", className: "more-link", "aria-label": "Shared infrastructure", onClick: () => this.openMore('infrastructure') },
                    React.createElement("strong", null, "Shared infrastructure"),
                    React.createElement("span", null, "Capital, separate from operating cost")),
                React.createElement("button", { type: "button", className: "more-link", "aria-label": "Backup & transfer", onClick: () => this.openMore('backup') },
                    React.createElement("strong", null, "Backup & transfer"),
                    React.createElement("span", null, "Export or restore this device")),
                React.createElement("button", { type: "button", className: "more-link", "aria-label": "About & calculation definitions", onClick: () => this.openMore('about') },
                    React.createElement("strong", null, "About & calculation definitions"),
                    React.createElement("span", null, "What recorded cash, production cost, and forecast cost mean"))));
    }
    render() {
        const s = this.state;
        if (!s.data)
            return React.createElement("main", { className: "recovery" },
                React.createElement("h1", null, "Your saved ledger could not be opened"),
                React.createElement(Note, { tone: "error" }, s.loadError),
                React.createElement("p", null, "No stored data has been overwritten. Close and reopen the app, or restore a valid JSON backup. Keep a copy of the original data before replacing it."),
                React.createElement("textarea", { id: "recovery-raw", readOnly: true, rows: 8, value: (() => { try {
                        return storeRead() || '';
                    }
                    catch (e) {
                        return '';
                    } })() }),
                React.createElement("p", null, "Raw saved data is shown above for recovery."),
                NATIVE && React.createElement("button", { className: "btn secondary", onClick: this.chooseBackup }, "Choose a JSON backup"),
                React.createElement(Field, { label: "Paste or selected backup" },
                    React.createElement("textarea", { rows: 6, value: s.importText, onChange: e => this.setState({ importText: e.target.value, importError: '' }) })),
                s.importError && React.createElement(Note, { tone: "error" }, s.importError),
                React.createElement("button", { className: "btn primary", disabled: !s.importText.trim(), onClick: this.importBackup }, "Validate and restore"));
        if (!s.data.batches.length)
            return React.createElement("main", { className: "recovery" },
                React.createElement("span", { className: "eyebrow" }, "FLOCK LEDGER \u00B7 OFFLINE RECORDS"),
                React.createElement("h1", null, "Start your flock ledger"),
                React.createElement("p", null, "This public build starts empty. Enter your own batch details, or restore your private JSON backup. No farm records are bundled."),
                s.storageError && React.createElement(Note, { tone: "error" }, s.storageError),
                s.tab === 'backup' ? React.createElement(React.Fragment, null,
                    React.createElement("button", { className: "btn secondary", onClick: () => this.setState({ tab: 'today' }) }, "Create a batch instead"),
                    this.renderBackup()) : React.createElement(React.Fragment, null,
                    React.createElement("section", { className: "card" },
                        React.createElement(BatchForm, { onCancel: () => this.setState({ tab: 'backup' }), onSave: (values) => { this.mutate((d) => { const b = M.makeBatch(values); d.batches.push(b); d.selectedBatchId = b.id; }, 'First batch saved'); this.setState({ tab: 'today', scenarioDraft: null, selectedDay: null }); } })),
                    React.createElement("button", { className: "btn secondary", onClick: () => this.setState({ tab: 'backup' }) }, "Restore an existing backup")),
                s.toast && React.createElement("div", { className: "toast", role: "status" }, s.toast));
        const b = this.b();
        const tabs = [['today', 'home', 'Today'], ['feed', 'feed', 'Feed'], ['records', 'log', 'Records'], ['forecast', 'chart', 'Forecast'], ['more', 'flock', 'More']];
        const commandBatch = s.modal && s.modal.command ? s.data.batches.find((x) => x.id === s.modal.command.batchId) : b;
        return React.createElement("div", { className: "app" },
            React.createElement("aside", { className: "sidebar" },
                React.createElement("div", { className: "wordmark" },
                    React.createElement("div", { className: "brand-symbol" },
                        React.createElement(Icon, { name: "flock", size: 28 })),
                    React.createElement("div", null,
                        "FLOCK",
                        React.createElement("span", null, "LEDGER"))),
                React.createElement("p", { className: "side-caption" },
                    "Know your flock.",
                    React.createElement("br", null),
                    "Know your real costs."),
                React.createElement("nav", { "aria-label": "Main navigation" }, tabs.map(([key, icon, label]) => React.createElement("button", { key: key, className: s.tab === key ? 'active' : '', onClick: () => this.switchTab(key) },
                    React.createElement(Icon, { name: icon }),
                    React.createElement("span", null, label)))),
                React.createElement("div", { className: "side-footer" },
                    React.createElement("span", { className: "status-dot" }),
                    "Works offline",
                    React.createElement("small", null, "OFFLINE \u00B7 1.0"))),
            React.createElement("div", { className: "workspace" },
                React.createElement("header", { className: "topbar" },
                    React.createElement("div", { className: "mobile-brand" },
                        React.createElement(Icon, { name: "flock", size: 23 }),
                        "Flock Ledger"),
                    React.createElement("div", { className: "batch-selector" },
                        React.createElement("span", { className: "eyebrow" }, "BATCH"),
                        React.createElement("select", { "aria-label": "Selected batch", value: b.id, onChange: e => { const v = e.target.value; if (v === '__manage') {
                                this.openMore('batches');
                                return;
                            } if (v === '__new') {
                                this.setState({ modal: { kind: 'batch' } });
                                return;
                            } try {
                                this.mutate((d) => { d.selectedBatchId = v; });
                                this.setState({ scenarioDraft: null, selectedDay: null, filter: 'all' });
                            }
                            catch (err) {
                                this.toast(err.message);
                            } } },
                            s.data.batches.map((b) => React.createElement("option", { key: b.id, value: b.id },
                                b.name,
                                b.status === 'closed' ? ' · closed' : '')),
                            React.createElement("option", { value: "__manage" }, "Manage batches"),
                            React.createElement("option", { value: "__new" }, "New batch"))),
                    React.createElement("div", { className: "top-date" },
                        dateLabel(M.today()),
                        React.createElement("span", null,
                            React.createElement("i", { className: "status-dot" }),
                            "Saved locally")),
                    React.createElement("button", { className: "header-add", "aria-label": "Add record", onClick: this.openChooser },
                        React.createElement(Icon, { name: "plus" }))),
                React.createElement("main", null,
                    s.storageError && React.createElement(Note, { tone: "error" }, s.storageError),
                    s.tab === 'today' ? this.renderToday() : s.tab === 'feed' ? this.renderFeed() : s.tab === 'records' ? this.renderRecords() : s.tab === 'forecast' ? this.renderForecast() : s.tab === 'backup' ? this.renderBackup() : this.renderMore(),
                    React.createElement("footer", null,
                        "Flock Ledger \u00B7 ",
                        b.name,
                        " \u00B7 Offline records"))),
            React.createElement("nav", { className: "bottom-nav", "aria-label": "Mobile navigation" }, tabs.map(([key, icon, label]) => React.createElement("button", { key: key, className: s.tab === key ? 'active' : '', onClick: () => this.switchTab(key) },
                React.createElement(Icon, { name: icon }),
                React.createElement("span", null, label)))),
            s.toast && React.createElement("div", { className: "toast", role: "status" },
                React.createElement(Icon, { name: "check", size: 18 }),
                s.toast),
            s.modal && React.createElement("div", { className: 'modal-backdrop ' + (s.modal.kind === 'batch' ? '' : 'entry-backdrop'), role: "presentation", onClick: e => { if (e.target === e.currentTarget) {
                    if (s.modal.kind === 'batch')
                        this.setState({ modal: null });
                    else
                        this.dismissEditor();
                } } },
                React.createElement("section", { role: "dialog", "aria-modal": "true", "aria-label": s.modal.kind === 'task' ? (ACTION_META[s.modal.command.action] || {}).title || 'Task' : s.modal.kind === 'chooser' ? 'Choose an action' : 'Batch editor', className: 'modal ' + (s.modal.kind === 'batch' ? '' : 'entry-surface') },
                    React.createElement(React.Fragment, null, s.modal.kind === 'chooser' ? React.createElement(ActionChooser, { onCancel: this.dismissEditor, onPick: (action) => this.openAction({ action, date: this.state.selectedDate }) }) : s.modal.kind === 'task' ? React.createElement(TaskForm, { key: draftKey(s.modal.command) + (s.modal.command.eventId || ''), command: s.modal.command, batch: commandBatch, draft: (this.ui().drafts || {})[draftKey(s.modal.command)] || null, onDraft: (draft) => this.setState({ pendingDraft: draft }), onCancel: this.dismissEditor, onSave: (records, opts) => { try {
                            this.saveRecords(records, opts);
                        }
                        catch (err) {
                            throw err;
                        } }, onBuyFeed: () => this.openAction({ action: 'feed', date: s.modal.command.date }), onEdit: (event) => this.openAction({ action: event.type, event }) }) : React.createElement(BatchForm, { batch: s.modal.batch, onCancel: () => this.setState({ modal: null }), onSave: (values) => { this.mutate((d) => { if (s.modal.batch) {
                            const index = d.batches.findIndex((x) => x.id === s.modal.batch.id);
                            d.batches[index] = Object.assign(Object.assign({}, d.batches[index]), values);
                            delete d.batches[index].error;
                        }
                        else {
                            const n = M.makeBatch(values);
                            d.batches.push(n);
                            d.selectedBatchId = n.id;
                        } }); this.setState({ modal: null, scenarioDraft: null, selectedDay: null }); } })))));
    }
}
ReactDOM.render(React.createElement(App, null), document.getElementById('root'));
