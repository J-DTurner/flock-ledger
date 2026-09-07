React.Fragment=React.Fragment||function Fragment(p){return p.children||null;};
const M = FlockMath;
const money = (n, dp = 0) => n === null || n === undefined || !Number.isFinite(n) ? '—' : '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: dp, maximumFractionDigits: dp });
const qty = (n, dp = 2) => n === null || n === undefined || !Number.isFinite(n) ? '—' : n.toLocaleString('en-PH', { maximumFractionDigits: dp, minimumFractionDigits: dp });
const dateLabel = (s) => M.validDate(s) ? new Date(s + 'T12:00:00').toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unknown';
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
const ICONS = { home: 'M3 11l9-8 9 8M5 10v11h5v-7h4v7h5V10', log: 'M5 3h14v18H5zM9 7h6M9 11h6M9 15h4', chart: 'M4 4v16h17M7 15l4-5 4 2 5-7', flock: 'M5 19v-5a7 7 0 0114 0v5M8 20h8M8 8V5h8v3', save: 'M5 3h12l3 3v15H4V3zM8 3v6h8V3M8 21v-7h8v7', plus: 'M12 5v14M5 12h14', arrow: 'M5 12h14M14 7l5 5-5 5', close: 'M6 6l12 12M18 6L6 18', edit: 'M4 20l4-1 12-12-4-4L4 15v5M14 5l4 4', down: 'M6 9l6 6 6-6', check: 'M5 12l4 4L19 6', feed: 'M5 7h14l2 14H3L5 7zM8 3h8M12 11v6', weight: 'M5 8h14l2 13H3L5 8zM9 8V5a3 3 0 016 0v3', trash: 'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7', info: 'M12 11v6M12 7v.1M22 12a10 10 0 11-20 0 10 10 0 0120 0' };
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
function LineChart({ series, title, unit = 'kg', xLabel = 'Days since purchase', floorZero = false }) {
    const all = series.reduce((a, s) => a.concat(s.points), []).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (!all.length)
        return React.createElement(Empty, { title: "No chart data yet", text: "Add a dated record to begin." });
    const W = 720, H = 285, L = 64, R = 25, T = 20, B = 46;
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
    return React.createElement("div", { className: "chart" },
        React.createElement("div", { className: "chart-legend" }, series.map((s, i) => React.createElement("span", { key: i },
            React.createElement("i", { className: s.dash ? 'dashed' : '', style: { borderColor: s.color } }),
            s.label))),
        React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": title + '; ' + unit + ' by ' + xLabel },
            [0, 1, 2, 3, 4].map(i => { const val = minY + (maxY - minY) * i / 4; return React.createElement("g", { key: i },
                React.createElement("line", { x1: L, x2: W - R, y1: y(val), y2: y(val), stroke: "#e7e9e2" }),
                React.createElement("text", { x: L - 11, y: y(val) + 4, textAnchor: "end", className: "axis-text" }, yfmt(val))); }),
            [0, 1, 2, 3, 4, 5].map(i => { const val = minX + (maxX - minX) * i / 5; return React.createElement("g", { key: i },
                React.createElement("text", { x: x(val), y: H - B + 22, textAnchor: "middle", className: "axis-text" }, Math.round(val))); }),
            React.createElement("line", { x1: L, x2: W - R, y1: H - B, y2: H - B, stroke: "#bac2b5" }),
            series.map((s, i) => React.createElement("g", { key: i },
                s.connect !== false && s.points.length > 1 && React.createElement("polyline", { fill: "none", stroke: s.color, strokeWidth: "2.7", strokeDasharray: s.dash ? '7 6' : undefined, points: s.points.map((p) => `${x(p.x)},${y(p.y)}`).join(' ') }),
                " ",
                s.points.filter((p, j) => s.markAll || s.points.length < 5 || j === 0 || j === s.points.length - 1).map((p, j) => React.createElement("circle", { key: j, cx: x(p.x), cy: y(p.y), r: s.connect === false ? 5 : 3, fill: s.open ? '#fff' : s.color, stroke: s.color, strokeWidth: "2" },
                    React.createElement("title", null, `Day ${p.x}: ${unit === '₱/kg' ? money(p.y, 2) : qty(p.y) + ' ' + unit}`))))),
            React.createElement("text", { x: (W + L - R) / 2, y: H - 3, textAnchor: "middle", className: "axis-text" }, xLabel)),
        React.createElement("small", { className: "chart-caption" },
            unit === '₱/kg' ? 'Focused vertical scale for comparing cost differences. ' : '',
            "Exact values are shown in the records or comparison table below."));
}
class RecordForm extends React.Component {
    constructor(props) {
        super(props);
        this.set = (k, v) => this.setState({ [k]: v, error: '' });
        this.input = (k, opts = {}) => React.createElement("input", Object.assign({ type: "number", inputMode: "decimal", step: "any", min: "0", value: this.state[k], onChange: e => this.set(k, e.target.value) }, opts));
        this.save = (ev) => {
            var _a, _b;
            ev.preventDefault();
            const s = this.state, n = (k, optional = false) => s[k] === '' ? (optional ? null : NaN) : Number(s[k]);
            let e = { id: ((_a = this.props.event) === null || _a === void 0 ? void 0 : _a.id) || M.uid(), type: s.type, date: s.date || null, createdAt: ((_b = this.props.event) === null || _b === void 0 ? void 0 : _b.createdAt) || new Date().toISOString(), note: s.note };
            if (['feed', 'expense', 'budget', 'openingUsage'].includes(s.type)) {
                e.cost = n('cost');
                e.name = s.name.trim() || { feed: 'Feed purchase', expense: 'Batch expense', budget: 'Feed budget', openingUsage: 'Historical feed used' }[s.type];
            }
            if (s.type === 'feed') {
                e.kg = n('kg', true);
                e.phase = s.phase;
            }
            if (s.type === 'usage') {
                e.kg = n('kg');
                e.lotId = s.lotId;
                e.startDate = s.startDate;
            }
            if (s.type === 'weigh') {
                e.method = s.method;
                e.avgKg = n('avgKg');
                e.minKg = n('minKg', true);
                e.maxKg = n('maxKg', true);
                e.sampleN = n('sampleN', true);
                e.weights = null;
                if (s.weights.trim()) {
                    const ws = s.weights.trim().split(/[\s,;]+/).map(Number);
                    if (ws.some((w) => !Number.isFinite(w) || w <= 0)) {
                        this.setState({ error: 'Enter individual weights as kilograms separated by commas or spaces.' });
                        return;
                    }
                    e.weights = ws;
                    e.avgKg = M.sum(ws) / ws.length;
                    e.minKg = Math.min(...ws);
                    e.maxKg = Math.max(...ws);
                    e.sampleN = ws.length;
                    e.method = 'measured';
                }
            }
            if (['count', 'loss', 'harvest'].includes(s.type))
                e.count = n('count');
            if (s.type === 'harvest') {
                e.liveKg = n('liveKg', true);
                e.dressedKg = n('dressedKg');
                e.revenue = n('revenue');
                e.homeKg = n('homeKg');
            }
            if (s.type === 'openingUsage')
                e.kg = n('kg', true);
            if (s.type === 'note') {
                e.name = s.name.trim() || 'Farm note';
            }
            try {
                this.props.onSave(e);
            }
            catch (err) {
                this.setState({ error: err.message });
            }
        };
        const e = props.event || {}, t = props.type || e.type || 'weigh';
        this.state = { type: t, date: e.date === null ? '' : e.date || M.today(), name: e.name || '', phase: e.phase || 'finisher', cost: e.cost === undefined ? '' : String(e.cost), kg: e.kg === null || e.kg === undefined ? '' : String(e.kg), lotId: e.lotId || '', startDate: e.startDate || M.addDays(M.today(), -1), avgKg: e.avgKg === undefined ? '' : String(e.avgKg), minKg: e.minKg === null || e.minKg === undefined ? '' : String(e.minKg), maxKg: e.maxKg === null || e.maxKg === undefined ? '' : String(e.maxKg), sampleN: e.sampleN === null || e.sampleN === undefined ? '' : String(e.sampleN), method: e.method || 'measured', weights: e.weights ? e.weights.join(', ') : '', count: e.count === undefined ? '' : String(e.count), liveKg: e.liveKg === null || e.liveKg === undefined ? '' : String(e.liveKg), dressedKg: e.dressedKg === undefined ? '' : String(e.dressedKg), revenue: e.revenue === undefined ? '0' : String(e.revenue), homeKg: e.homeKg === undefined ? '0' : String(e.homeKg), note: e.note || '', error: '' };
    }
    render() {
        const s = this.state;
        const titles = { weigh: 'Record a weighing', feed: 'Record a feed purchase', usage: 'Log feed used', count: 'Record live bird count', loss: 'Record birds removed / lost', harvest: 'Record a harvest', expense: 'Record a batch expense', budget: 'Set aside a budget', openingUsage: 'Log feed used before tracking', note: 'Add a farm note' };
        const lots = this.props.batch.events.filter((e) => e.type === 'feed' && e.kg !== null);
        return React.createElement("form", { onSubmit: this.save },
            React.createElement("div", { className: "modal-heading" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, this.props.event ? 'EDIT RECORD' : 'NEW RECORD'),
                    React.createElement("h2", null, titles[s.type])),
                React.createElement("button", { type: "button", className: "icon-btn", "aria-label": "Close form", onClick: this.props.onCancel },
                    React.createElement(Icon, { name: "close" }))),
            this.props.convert && React.createElement(Note, null, "The budget will be replaced by this purchase when you save. Enter the actual kilograms and amount paid."),
            React.createElement("div", { className: "form-grid" },
                React.createElement(Field, { label: "Record type", wide: true },
                    React.createElement("select", { value: s.type, disabled: !!this.props.event || !!this.props.convert, onChange: e => this.set('type', e.target.value) }, Object.entries(titles).map(([v, l]) => React.createElement("option", { key: v, value: v }, l)))),
                React.createElement(Field, { label: s.type === 'usage' ? 'Period end (inclusive)' : 'Date', hint: ['feed', 'expense', 'budget', 'openingUsage', 'note'].includes(s.type) ? 'Leave empty only when the original date is unknown.' : undefined },
                    React.createElement("input", { type: "date", value: s.date, min: this.props.batch.placementDate, onChange: e => this.set('date', e.target.value) })),
                ['feed', 'expense', 'budget', 'openingUsage', 'note'].includes(s.type) && React.createElement(Field, { label: s.type === 'feed' ? 'Brand / product name' : 'Description' },
                    React.createElement("input", { value: s.name, maxLength: 180, placeholder: s.type === 'feed' ? 'e.g. Sarimanok Finisher Pellet' : 'Description', onChange: e => this.set('name', e.target.value) })),
                s.type === 'feed' && React.createElement(React.Fragment, null,
                    React.createElement(Field, { label: "Feed stage" },
                        React.createElement("select", { value: s.phase, onChange: e => this.set('phase', e.target.value) }, ['starter', 'grower', 'finisher', 'booster', 'other', 'unknown'].map(v => React.createElement("option", { key: v, value: v }, v[0].toUpperCase() + v.slice(1))))),
                    React.createElement(Field, { label: "Total kilograms purchased", hint: "All sacks combined. Leave blank when unknown." }, this.input('kg', { placeholder: 'e.g. 100' }))),
                ['feed', 'expense', 'budget', 'openingUsage'].includes(s.type) && React.createElement(Field, { label: s.type === 'openingUsage' ? 'Cost of feed already USED (₱)' : 'Total amount (₱)', hint: s.type === 'openingUsage' ? 'Not a new payment; must already appear in feed purchases.' : undefined }, this.input('cost', { required: true, placeholder: 'e.g. 3000' })),
                s.type === 'feed' && Number(s.kg) > 0 && s.cost !== '' && React.createElement("div", { className: "field" },
                    React.createElement("span", null, "Calculated price"),
                    React.createElement("strong", { className: "calculated" },
                        money(Number(s.cost) / Number(s.kg), 2),
                        " / kg"),
                    React.createElement("small", null,
                        money(Number(s.cost) / Number(s.kg) * 50),
                        " per 50 kg equivalent")),
                s.type === 'usage' && React.createElement(React.Fragment, null,
                    React.createElement(Field, { label: "Period start (exclusive)" },
                        React.createElement("input", { type: "date", value: s.startDate, min: this.props.batch.placementDate, onChange: e => this.set('startDate', e.target.value) })),
                    React.createElement(Field, { label: "Which purchase / feed lot?", wide: true },
                        React.createElement("select", { value: s.lotId, onChange: e => this.set('lotId', e.target.value), required: true },
                            React.createElement("option", { value: "" }, "Select a feed purchase"),
                            lots.map((p) => React.createElement("option", { key: p.id, value: p.id },
                                p.name,
                                " \u00B7 ",
                                dateLabel(p.date),
                                " \u00B7 ",
                                qty(p.kg),
                                " kg bought")))),
                    React.createElement(Field, { label: "Kilograms used in this period", hint: "Include feed lost at the feeder. Unused stock stays in inventory." }, this.input('kg', { required: true })),
                    lots.length === 0 && React.createElement("div", { className: "wide" },
                        React.createElement(Note, { tone: "warn" }, "Add a feed purchase with a known kilogram quantity first."))),
                s.type === 'weigh' && React.createElement(React.Fragment, null,
                    React.createElement(Field, { label: "Measurement quality" },
                        React.createElement("select", { value: s.method, onChange: e => this.set('method', e.target.value) },
                            React.createElement("option", { value: "measured" }, "Weighed sample"),
                            React.createElement("option", { value: "estimate" }, "Rough estimate only"))),
                    React.createElement(Field, { label: "Individual weights (kg)", wide: true, hint: "Optional. Commas or spaces; average, range and sample count are calculated." },
                        React.createElement("textarea", { rows: 2, placeholder: "0.98, 1.04, 1.10, 0.95", value: s.weights, onChange: e => this.set('weights', e.target.value) })),
                    React.createElement(Field, { label: "Average live weight (kg)" }, this.input('avgKg', { disabled: !!s.weights.trim(), required: !s.weights.trim() })),
                    React.createElement(Field, { label: "Number of birds weighed" }, this.input('sampleN', { step: 1, disabled: !!s.weights.trim(), required: s.method === 'measured' && !s.weights.trim() })),
                    React.createElement(Field, { label: "Smallest bird (kg, optional)" }, this.input('minKg', { disabled: !!s.weights.trim() })),
                    React.createElement(Field, { label: "Largest bird (kg, optional)" }, this.input('maxKg', { disabled: !!s.weights.trim() }))),
                ['count', 'loss', 'harvest'].includes(s.type) && React.createElement(Field, { label: s.type === 'count' ? 'Birds actually alive and present' : s.type === 'harvest' ? 'Birds harvested' : 'Birds lost / removed', hint: s.type === 'count' ? 'A count is a snapshot, not a number to subtract.' : undefined }, this.input('count', { step: 1, required: true })),
                s.type === 'harvest' && React.createElement(React.Fragment, null,
                    React.createElement(Field, { label: "Total live weight (kg, optional)" }, this.input('liveKg')),
                    React.createElement(Field, { label: "Total dressed weight (kg)" }, this.input('dressedKg', { required: true })),
                    React.createElement(Field, { label: "Cash received for this harvest (\u20B1)", hint: "Use 0 for home consumption; not a retail-equivalent estimate." }, this.input('revenue', { required: true })),
                    React.createElement(Field, { label: "Dressed kg kept for home" }, this.input('homeKg', { required: true }))),
                s.type === 'openingUsage' && React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "wide" },
                        React.createElement(Note, { tone: "warn" }, "Use only for feed used before detailed tracking. Do not also log the same feed as lot usage. This entry adds production cost, not another cash payment.")),
                    React.createElement(Field, { label: "Historical kg used (optional)" }, this.input('kg'))),
                React.createElement(Field, { label: "Notes", wide: true },
                    React.createElement("textarea", { rows: 3, maxLength: 5000, value: s.note, onChange: e => this.set('note', e.target.value), placeholder: "Supplier, feed quality, flock health, or anything worth remembering." }))),
            s.error && React.createElement(Note, { tone: "error" }, s.error),
            React.createElement("div", { className: "modal-actions" },
                React.createElement("button", { type: "button", className: "btn secondary", onClick: this.props.onCancel }, "Cancel"),
                React.createElement("button", { type: "submit", className: "btn primary" },
                    React.createElement(Icon, { name: "check" }),
                    "Save record")));
    }
}
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
function recordDescription(e, b) { const p = b.events.find((x) => x.id === e.lotId); switch (e.type) {
    case 'feed': return `${e.kg === null ? 'kg unknown' : qty(e.kg) + ' kg'} · ${e.phase} · ${money(e.cost)}${e.kg ? ' · ' + money(e.cost / e.kg, 2) + '/kg' : ''}`;
    case 'usage': return `${qty(e.kg)} kg · ${(p === null || p === void 0 ? void 0 : p.name) || 'Feed lot'} · ${dateLabel(e.startDate)} → ${dateLabel(e.date)}`;
    case 'weigh': return `${qty(e.avgKg)} kg average${e.sampleN ? ' · ' + e.sampleN + ' weighed' : ''}${e.maxKg !== null ? ' · max ' + qty(e.maxKg) + ' kg' : ''}`;
    case 'count': return `${e.count} live birds counted`;
    case 'loss': return `${e.count} birds removed`;
    case 'harvest': return `${e.count} birds · ${qty(e.dressedKg)} kg dressed · ${money(e.revenue)} cash`;
    case 'openingUsage': return `${money(e.cost)} historical feed used · no new cash expense`;
    case 'note': return e.note || 'Farm note';
    default: return money(e.cost);
} }
const TYPELABEL = { feed: 'Feed purchase', usage: 'Feed used', weigh: 'Weighing', count: 'Live count', loss: 'Bird loss', harvest: 'Harvest', expense: 'Expense', budget: 'Budget only', openingUsage: 'Historical feed use', note: 'Note' };
class App extends React.Component {
    constructor(props) {
        super(props);
        this.keydown = (e) => { if (e.key === 'Escape' && this.state.modal)
            this.setState({ modal: null }); };
        this.b = () => this.state.data.batches.find((b) => b.id === this.state.data.selectedBatchId);
        this.toast = (msg) => { this.setState({ toast: msg }); setTimeout(() => this.setState({ toast: '' }), 4200); };
        this.commit = (data, msg = 'Saved on this device') => { M.validateState(data); storeWrite(data); this.setState({ data, storageError: '' }); this.toast(msg); };
        this.mutate = (fn, msg) => { const d = clone(this.state.data); fn(d, d.batches.find((b) => b.id === d.selectedBatchId)); this.commit(d, msg); };
        this.openRecord = (type = 'weigh', event = null, convert = null) => this.setState({ modal: { kind: 'record', type, event, convert } });
        this.saveRecord = (record) => { const modal = this.state.modal; this.mutate((d, b) => { if (modal.convert)
            b.events = b.events.filter((e) => e.id !== modal.convert.id); const i = b.events.findIndex((e) => e.id === record.id); if (i >= 0)
            b.events[i] = record;
        else
            b.events.push(record); }, 'Record saved'); this.setState({ modal: null }); };
        this.deleteRecord = (event) => { if (!window.confirm(`Delete this ${TYPELABEL[event.type].toLowerCase()}? This can change stock and costs.`))
            return; try {
            this.mutate((d, b) => { b.events = b.events.filter((e) => e.id !== event.id); }, 'Record deleted');
        }
        catch (e) {
            this.toast(e.message);
        } };
        this.capital = () => M.sum(this.state.data.settings.capital.map((a) => a.cost));
        this.projection = () => M.forecast(this.b(), this.state.scenarioDraft || this.b().forecast, this.capital(), this.state.data.settings.recoveryBatches);
        this.switchTab = (tab) => { this.setState({ tab }); window.scrollTo(0, 0); };
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
        this.state = { data, tab: 'overview', modal: null, toast: '', filter: 'all', scenarioDraft: null, selectedDay: null, importText: '', importError: '', storageError: error, loadError: !data ? error : '', capitalDraft: { name: '', cost: '', date: '' } };
    }
    componentDidMount() { window.checkPendingImport = () => { if (NATIVE) {
        const text = nativeCall('take-import');
        if (text)
            window.receiveNativeBackup(text);
    } }; window.receiveNativeBackup = (text) => { this.setState({ tab: 'backup', importText: text, importError: '' }); }; window.nativeNotice = (s) => this.toast(s); window.nativeBack = () => { if (this.state.modal) {
        this.setState({ modal: null });
        return true;
    } if (this.state.tab !== 'overview') {
        this.setState({ tab: 'overview' });
        return true;
    } return false; }; window.addEventListener('keydown', this.keydown); window.checkPendingImport(); }
    componentWillUnmount() { window.removeEventListener('keydown', this.keydown); }
    renderOverview() {
        var _a;
        const b = this.b(), s = M.summary(b), perf = M.recentPerformance(b), f = this.projection(), ws = M.records(b, 'weigh').filter((e) => e.date), live = M.headcount(b), age = M.days(b.placementDate, M.today());
        const series = [{ label: 'Measured sample', color: '#395a43', markAll: true, points: ws.filter((w) => w.method === 'measured').map((w) => ({ x: M.days(b.placementDate, w.date), y: w.avgKg })) }, { label: 'Rough estimate', color: '#a57636', connect: false, open: true, points: ws.filter((w) => w.method === 'estimate').map((w) => ({ x: M.days(b.placementDate, w.date), y: w.avgKg })) }];
        if (f.rows.length)
            series.push({ label: 'Editable scenario, not a prediction', color: '#788570', dash: true, points: f.rows.map((r) => ({ x: r.day, y: r.weight })) });
        const recent = b.events.slice().sort((a, c) => (c.date || '').localeCompare(a.date || '')).slice(0, 4);
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: "page-title" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "YOUR FLOCK, AT A GLANCE"),
                    React.createElement("h1", null, b.name),
                    React.createElement("p", null,
                        age < 0 ? 'Purchase is in the future' : `Day ${age} since purchase`,
                        " \u00B7 ",
                        b.placementEstimated ? 'Approximate purchase date' : 'Purchased',
                        " ",
                        dateLabel(b.placementDate),
                        b.ageAtPlacement !== null ? ` · approximately ${age + b.ageAtPlacement} days old` : '')),
                React.createElement("button", { className: "btn secondary small", onClick: () => this.setState({ modal: { kind: 'batch', batch: b } }) },
                    React.createElement(Icon, { name: "edit", size: 16 }),
                    "Edit batch")),
            React.createElement("div", { className: "metrics" },
                React.createElement(Metric, { label: "Chicks placed", value: b.initialBirds, sub: `${money(b.chickCost / b.initialBirds)} per chick` }),
                React.createElement(Metric, { label: "Live birds", value: live.confirmed ? live.count : 'Not counted', sub: live.confirmed ? 'Last count less recorded removals' : `${live.count} on the ledger; survival unverified` }),
                React.createElement(Metric, { label: ((_a = s.weigh) === null || _a === void 0 ? void 0 : _a.method) === 'estimate' ? 'Latest weight estimate' : 'Latest sample average', value: s.weigh ? qty(s.weigh.avgKg) + ' kg' : '—', sub: s.weigh ? dateLabel(s.weigh.date) : 'Add your first weighing' }),
                React.createElement(Metric, { label: "Batch cash recorded", value: money(s.cashPaid), sub: "Chicks + feed purchases + expenses", accent: true })),
            (!live.confirmed || !perf || s.inventoryIncomplete) && React.createElement(Note, { tone: "warn" },
                React.createElement("strong", null, "Some important data is still missing."),
                " ",
                !live.confirmed ? 'Add an actual live-bird count. ' : '',
                s.inventoryIncomplete ? 'Earlier feed kilograms are unknown. ' : '',
                !perf ? 'Two measured weigh-ins will unlock observed daily gain. ' : '',
                "Estimates are never presented as measured growth."),
            React.createElement("div", { className: "quick-actions" },
                React.createElement("button", { onClick: () => this.openRecord('weigh') },
                    React.createElement(Icon, { name: "weight" }),
                    React.createElement("span", null, "Weigh birds")),
                React.createElement("button", { onClick: () => this.openRecord('feed') },
                    React.createElement(Icon, { name: "feed" }),
                    React.createElement("span", null, "Buy feed")),
                React.createElement("button", { onClick: () => this.openRecord('usage') },
                    React.createElement(Icon, { name: "log" }),
                    React.createElement("span", null, "Log feed used")),
                React.createElement("button", { onClick: () => this.openRecord('count') },
                    React.createElement(Icon, { name: "flock" }),
                    React.createElement("span", null, "Count birds"))),
            React.createElement("div", { className: "two-col" },
                React.createElement("section", { className: "card" },
                    React.createElement(SectionTitle, { title: "Live weight over time", sub: "Kilograms per bird \u00B7 dated observations" }),
                    ws.length ? React.createElement(LineChart, { series: series.filter((s) => s.points.length), title: "Live weight over time", floorZero: true }) : React.createElement(Empty, { title: "Your growth chart starts here", text: "Add a dated weighing to see progress." }),
                    !perf && React.createElement("p", { className: "muted small-text" }, "One estimated point is not a growth curve. No growth rate is inferred from it.")),
                React.createElement("section", { className: "card" },
                    React.createElement(SectionTitle, { title: "Where the money goes", sub: "PHP \u00B7 current selected batch" }),
                    [['Chicks', b.chickCost], ['Feed purchased', s.feedPaid], ['Other expenses', s.otherPaid]].map(([label, v]) => React.createElement("div", { className: "cost-bar", key: label },
                        React.createElement("div", null,
                            React.createElement("span", null, label),
                            React.createElement("strong", null, money(v))),
                        React.createElement("div", { className: "bar-track" },
                            React.createElement("div", { style: { width: Math.max(0, (s.cashPaid ? v / s.cashPaid * 100 : 0)) + '%' } })))),
                    React.createElement("div", { className: "totals-row" },
                        React.createElement("span", null, "Separate feed budget"),
                        React.createElement("strong", null, money(s.budgets))),
                    React.createElement("div", { className: "totals-row" },
                        React.createElement("span", null, "Farm infrastructure"),
                        React.createElement("strong", null, money(this.capital()))),
                    React.createElement("p", { className: "muted small-text" }, "Budgets are not purchases. Infrastructure is shared across batches, never charged again as feed."))),
            React.createElement("div", { className: "two-col" },
                React.createElement("section", { className: "card" },
                    React.createElement(SectionTitle, { title: "Feed & production", sub: "Only what has been logged" }),
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
                    React.createElement("p", { className: "muted small-text" }, "A blank consumption log does not mean zero feed was eaten. Inventory excludes purchases with unknown kg."),
                    perf && React.createElement(Note, null,
                        React.createElement("strong", null,
                            qty(perf.gainG, 1),
                            " g/day"),
                        " observed sample growth (",
                        dateLabel(perf.start),
                        "\u2013",
                        dateLabel(perf.end),
                        "). ",
                        perf.fcr !== null ? `${qty(perf.fcr)} logged-feed ratio; incomplete usage logs can bias it.` : 'No comparable logged-feed ratio is available yet.')),
                React.createElement("section", { className: "card" },
                    React.createElement(SectionTitle, { title: "Harvest results", sub: "Actual carcass weights and cash" }),
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
                                " kg"))),
                    s.dressedKg > 0 && React.createElement(Note, null,
                        "Purchase-based cost to date: ",
                        React.createElement("strong", null,
                            money(s.cashPaid / s.dressedKg, 2),
                            "/harvested kg"),
                        ". ",
                        s.head.count > 0 ? 'This includes costs of birds still growing, so it is not a final batch unit cost.' : 'Includes all paid feed, even unused inventory; excludes the pen.'),
                    React.createElement("button", { className: "text-btn", onClick: () => this.openRecord('harvest') },
                        "Record a harvest ",
                        React.createElement(Icon, { name: "arrow", size: 16 })))),
            React.createElement("section", { className: "card" },
                React.createElement(SectionTitle, { title: "Latest entries", action: React.createElement("button", { className: "text-btn", onClick: () => this.switchTab('records') },
                        "All records ",
                        React.createElement(Icon, { name: "arrow", size: 16 })) }),
                recent.map((e) => React.createElement("div", { className: "recent-row", key: e.id },
                    React.createElement("div", null,
                        React.createElement(Badge, { kind: e.type === 'budget' || e.method === 'estimate' ? 'warn' : 'muted' }, TYPELABEL[e.type]),
                        React.createElement("strong", null, e.name || TYPELABEL[e.type]),
                        React.createElement("small", null, recordDescription(e, b))),
                    React.createElement("span", { className: "date" }, dateLabel(e.date))))));
    }
    renderRecords() {
        const b = this.b(), events = b.events.filter((e) => this.state.filter === 'all' || e.type === this.state.filter).sort((a, c) => (c.date || '').localeCompare(a.date || '')), inv = M.feedInventory(b);
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: "page-title" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "THE FARM LOGBOOK"),
                    React.createElement("h1", null, "Every entry, dated."),
                    React.createElement("p", null, "Purchases, consumption, weights, counts and harvests in one place.")),
                React.createElement("button", { className: "btn primary", onClick: () => this.openRecord('feed') },
                    React.createElement(Icon, { name: "plus" }),
                    "Add record")),
            React.createElement("section", { className: "card" },
                React.createElement("div", { className: "filter-row" },
                    React.createElement("label", null,
                        "Show ",
                        React.createElement("select", { "aria-label": "Filter records", value: this.state.filter, onChange: e => this.setState({ filter: e.target.value }) },
                            React.createElement("option", { value: "all" }, "All records"),
                            Object.entries(TYPELABEL).map(([v, l]) => React.createElement("option", { key: v, value: v }, l)))),
                    React.createElement("span", { className: "muted" },
                        events.length,
                        " entries")),
                !events.length ? React.createElement(Empty, { title: "No entries here yet", text: "Add a record for this batch." }) : events.map((e) => React.createElement("article", { className: "record", key: e.id },
                    React.createElement("div", { className: "record-top" },
                        React.createElement(Badge, { kind: e.type === 'budget' || e.method === 'estimate' ? 'warn' : 'muted' }, e.type === 'weigh' && e.method === 'estimate' ? 'Estimated weight' : TYPELABEL[e.type]),
                        React.createElement("span", null, dateLabel(e.date))),
                    React.createElement("h3", null, e.name || TYPELABEL[e.type]),
                    React.createElement("p", null, recordDescription(e, b)),
                    e.note && e.type !== 'note' && React.createElement("p", { className: "record-note" }, e.note),
                    React.createElement("div", { className: "record-buttons" },
                        e.type === 'budget' && React.createElement("button", { className: "text-btn", onClick: () => this.openRecord('feed', null, e) },
                            "Convert to purchase ",
                            React.createElement(Icon, { name: "arrow", size: 15 })),
                        React.createElement("div", { className: "spacer" }),
                        React.createElement("button", { className: "icon-btn", title: "Edit record", "aria-label": 'Edit ' + (e.name || TYPELABEL[e.type]), onClick: () => this.openRecord(e.type, e) },
                            React.createElement(Icon, { name: "edit", size: 17 })),
                        React.createElement("button", { className: "icon-btn danger", title: "Delete record", "aria-label": 'Delete ' + (e.name || TYPELABEL[e.type]), onClick: () => this.deleteRecord(e) },
                            React.createElement(Icon, { name: "trash", size: 17 })))))),
            React.createElement("section", { className: "card" },
                React.createElement(SectionTitle, { title: "Feed inventory", sub: "By purchase lot \u00B7 unknown quantities are not filled in" }),
                React.createElement("div", { className: "table-wrap" },
                    React.createElement("table", null,
                        React.createElement("thead", null,
                            React.createElement("tr", null,
                                React.createElement("th", null, "Feed / lot"),
                                React.createElement("th", null, "Bought kg"),
                                React.createElement("th", null, "Used kg"),
                                React.createElement("th", null, "Left kg"),
                                React.createElement("th", null, "\u20B1/kg"))),
                        React.createElement("tbody", null, inv.map((p) => React.createElement("tr", { key: p.id },
                            React.createElement("td", null,
                                p.name,
                                React.createElement("small", null, dateLabel(p.date))),
                            React.createElement("td", null, qty(p.kg)),
                            React.createElement("td", null, qty(p.used)),
                            React.createElement("td", null, qty(p.remaining)),
                            React.createElement("td", null, money(p.price, 2))))))),
                React.createElement("p", { className: "muted small-text" }, "Historical feed-use adjustments do not deduct kilograms from specific lots. Use them only for untracked historical feed; reconcile old stock before claiming complete inventory.")));
    }
    renderForecast() {
        const b = this.b(), p = this.state.scenarioDraft || b.forecast, f = this.projection(), s = M.summary(b, p.startDate || M.today()), perf = M.recentPerformance(b);
        const chosen = f.rows.find((r) => r.day === this.state.selectedDay) || f.best;
        const important = f.rows.filter((r) => { var _a; return [f.startDay, 35, 38, 40, 42, 45, 47, 49, 52, 56, 60, 70, 84, p.endDay, (_a = f.best) === null || _a === void 0 ? void 0 : _a.day, this.state.selectedDay].includes(r.day); });
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: "page-title" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "HARVEST PLANNER"),
                    React.createElement("h1", null, "The cost of another week."),
                    React.createElement("p", null, "Compare slaughter dates using explicit, editable assumptions.")),
                React.createElement(Badge, { kind: "warn" }, "Scenario, not a guarantee")),
            React.createElement(Note, { tone: "warn" }, "The earlier chat curves were illustrations, not measured forecasts. This planner does not assume 47 survivors, \u20B130/kg feed, or a guaranteed day-52 optimum. Supply the missing values below."),
            React.createElement("section", { className: "card" },
                React.createElement(SectionTitle, { title: "Your starting point", sub: "The cost and flock state must refer to the same date." }),
                React.createElement("div", { className: "form-grid three" },
                    React.createElement(Field, { label: "Projection start date" },
                        React.createElement("input", { type: "date", min: b.placementDate, value: p.startDate || '', onChange: e => this.setState({ scenarioDraft: Object.assign(Object.assign({}, p), { startDate: e.target.value }) }) })),
                    this.forecastInput('birds', 'Birds remaining at start', 'Required; use a real count or an explicitly chosen scenario.', 1),
                    this.forecastInput('weightKg', 'Average live weight at start (kg)', 'Use a weighed sample average. Rough estimates are not measured samples.'),
                    this.forecastInput('baselineCost', 'Operating cost USED by start (₱)', 'Chicks + feed already used + other costs. Exclude unused feed, budgets and the pen.'),
                    this.forecastInput('feedPrice', 'Future feed price (₱ per kg)', 'Enter your actual purchase price, or your chosen scenario price.'),
                    this.forecastInput('yieldPct', 'Dressed yield (%)', '70% is an editable illustration. Actual yield comes from harvest records.')),
                React.createElement("div", { className: "button-row" },
                    React.createElement("button", { className: "btn secondary small", onClick: () => { const w = M.latestWeigh(b); if (!w) {
                            this.toast('Add a weighing first.');
                            return;
                        } const h = M.headcount(b, w.date), inv = M.feedInventory(b).filter((p) => p.price !== null).sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || '').localeCompare(b.createdAt || '')); const next = Object.assign(Object.assign({}, p), { startDate: w.date, weightKg: w.avgKg }); if (h.confirmed)
                            next.birds = h.count; if (inv.length)
                            next.feedPrice = inv[inv.length - 1].price; this.setState({ scenarioDraft: next }); this.toast('Copied the latest weight; only a verified count and known feed price were copied.'); } }, "Use latest records"),
                    React.createElement("button", { className: "btn secondary small", onClick: () => this.setState({ scenarioDraft: Object.assign(Object.assign({}, p), { baselineCost: s.usedOperating }) }) },
                        "Use logged production costs (",
                        money(s.usedOperating),
                        ")")),
                React.createElement("p", { className: "muted small-text" }, "Logged production costs may be incomplete. Include only chicks, feed already used, and other incurred costs at the projection start. Exclude unused feed, future budgets, and shared infrastructure."),
                React.createElement("details", { className: "assumptions", open: true },
                    React.createElement("summary", null, "Growth, feed conversion and pricing assumptions"),
                    React.createElement("p", { className: "muted small-text" }, "The starting presets below are arbitrary planning inputs, not strain targets or a fitted biological growth model. They do not predict catch-up growth."),
                    React.createElement("div", { className: "form-grid three" },
                        this.forecastInput('gainG', 'Starting live gain (g/bird/day)', 'Illustrative 60 g; replace with your measured gain.'),
                        this.forecastInput('gainDeclinePct', 'Daily reduction in gain (%)', 'Compounded each day. 0 means constant growth.'),
                        this.forecastInput('fcr', 'Starting incremental FCR', 'Feed kg used per extra live kg, not lifetime FCR.'),
                        this.forecastInput('fcrRise', 'FCR increase per extra day', 'Linear change. 0 means constant feed efficiency.'),
                        this.forecastInput('dailyOther', 'Extra daily costs for whole flock (₱)', 'Labor, transport or electricity not already in the starting cost.'),
                        this.forecastInput('endDay', 'Compare through day since purchase', 'A day number, NOT days from today.', 1),
                        this.forecastInput('salePrice', 'Dressed sale / replacement price (₱/kg)', 'Optional. Home-use savings are not cash revenue.'),
                        this.forecastInput('downtime', 'Days between repeat batches', 'Cleaning, drying and scheduling time.', 1)),
                    perf && React.createElement("button", { className: "text-btn", onClick: () => { if (perf.gainG <= 0) {
                            this.toast('Recent measured gain is not positive; forecasts require a positive scenario.');
                            return;
                        } this.setState({ scenarioDraft: Object.assign(Object.assign({}, p), { gainG: Math.round(perf.gainG * 10) / 10 }) }); } },
                        "Use recent measured gain: ",
                        qty(perf.gainG, 1),
                        " g/day")),
                React.createElement("div", { className: "button-row" },
                    React.createElement("button", { className: "btn primary", onClick: this.saveScenario },
                        React.createElement(Icon, { name: "save", size: 17 }),
                        "Save scenario"),
                    this.state.scenarioDraft && React.createElement("button", { className: "btn secondary", onClick: () => this.setState({ scenarioDraft: null }) }, "Discard unsaved changes"))),
            f.errors.length > 0 ? React.createElement("section", { className: "card" },
                React.createElement(Empty, { title: "Complete the scenario to see the curves", text: "No costs or harvest date will be invented for missing inputs." }),
                React.createElement("div", { className: "requirements" }, f.errors.map((e, i) => React.createElement("p", { key: i }, e)))) : React.createElement(React.Fragment, null,
                React.createElement("div", { className: "metrics" },
                    React.createElement(Metric, { label: "Lowest within this scenario", value: money(f.best.perKg, 2) + '/kg', sub: `Day ${f.best.day} · ${dateLabel(f.best.date)}`, accent: true }),
                    React.createElement(Metric, { label: "Within 1% of that low", value: `Days ${f.nearBest[0].day}–${f.nearBest[f.nearBest.length - 1].day}`, sub: "Cost differences here are small" }),
                    React.createElement(Metric, { label: "Scenario weight at the low", value: qty(f.best.weight) + ' kg', sub: "Average live kg per remaining bird" }),
                    React.createElement(Metric, { label: "More feed to reach it", value: qty(f.best.feedKg, 1) + ' kg', sub: `${money(f.best.feedCost)} of feed used after start` })),
                f.atBoundary && React.createElement(Note, { tone: "warn" }, "The lowest modeled cost is at the edge of your selected date range. This does not establish an interior optimum or a biological harvest recommendation."),
                b.events.some((e) => e.type === 'harvest') && React.createElement(Note, { tone: "warn" }, "This is a forward scenario for the remaining birds only. Allocate the starting cost to those birds; do not load the full batch cost after a partial harvest. The app does not infer that allocation."),
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
                                    React.createElement("th", null, "Day / date"),
                                    React.createElement("th", null, "Live kg/bird"),
                                    React.createElement("th", null, "Extra feed kg"),
                                    React.createElement("th", null, "Operating \u20B1"),
                                    React.createElement("th", null, "Dressed kg"),
                                    React.createElement("th", null, "Operating \u20B1/kg"),
                                    React.createElement("th", null, "Next-day marginal \u20B1/kg*"))),
                            React.createElement("tbody", null, important.map((r) => { const next = f.rows.find((n) => n.day === r.day + 1); return React.createElement("tr", { key: r.day, className: r.day === chosen.day ? 'selected' : '', onClick: () => this.setState({ selectedDay: r.day }) },
                                React.createElement("td", null,
                                    React.createElement("button", { className: "day-pick", "aria-label": 'Select day ' + r.day },
                                        "Day ",
                                        r.day),
                                    React.createElement("small", null, dateLabel(r.date)),
                                    r.day === f.best.day && React.createElement(Badge, { kind: "green" }, "Scenario low")),
                                React.createElement("td", null, qty(r.weight)),
                                React.createElement("td", null, qty(r.feedKg, 1)),
                                React.createElement("td", null, money(r.cost)),
                                React.createElement("td", null, qty(r.dressed, 1)),
                                React.createElement("td", null,
                                    React.createElement("strong", null, money(r.perKg, 2))),
                                React.createElement("td", null, next ? money(next.marginal, 2) : '—')); })))),
                    React.createElement("p", { className: "muted small-text" }, "*Cost of the additional dressed gain during the next modeled day. Extra feed is cumulative from the projection start. It is feed consumed, not necessarily new feed to purchase."),
                    React.createElement("div", { className: "button-row" },
                        React.createElement("button", { className: "btn secondary small", onClick: () => this.exportForecast(f.rows) }, "Export daily comparison CSV"))),
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
                    React.createElement("p", { className: "small-text muted" }, "*Only cash profit if every modeled dressed kilogram is sold at the entered price. For home use it is replacement-value savings, not cash income. Excludes any labor, utilities, losses, taxes, selling or processing costs you have not entered. No overlapping flocks; downtime after each full cycle is counted conservatively. Repeating this batch's partial-age starting cost is a deliberate scenario, not a prediction for future flocks.")),
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
                    React.createElement("p", { className: "muted small-text" }, "Weights, gain and FCR here are explicit assumptions. No automatic breeding-strain curve, compensatory-growth claim or age-specific nutritional prescription is built in. Costs can rise beyond the feed budget."))));
    }
    renderBatches() {
        const d = this.state.data;
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: "page-title" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "ONE PEN. MANY BATCHES."),
                    React.createElement("h1", null, "Batch history & capital"),
                    React.createElement("p", null, "Keep each flock's records separate and reuse the infrastructure.")),
                React.createElement("button", { className: "btn primary", onClick: () => this.setState({ modal: { kind: 'batch' } }) },
                    React.createElement(Icon, { name: "plus" }),
                    "New batch")),
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
                            this.setState({ scenarioDraft: null, selectedDay: null, tab: 'overview' });
                        }
                        catch (e) {
                            this.toast(e.message);
                        } } }, selected ? 'Open current batch' : 'Open batch'),
                    React.createElement("button", { className: "icon-btn", "aria-label": 'Edit ' + b.name, onClick: () => this.setState({ modal: { kind: 'batch', batch: b } }) },
                        React.createElement(Icon, { name: "edit" })))); })),
            React.createElement("section", { className: "card" },
                React.createElement(SectionTitle, { title: "Shared infrastructure", sub: "One-time purchases, separate from feed and chicks." }),
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
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: "page-title" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "YOUR DATA STAYS YOURS"),
                    React.createElement("h1", null, "Backup & transfer"),
                    React.createElement("p", null, "Offline storage on this device. No account, subscription or cloud service.")),
                React.createElement(Badge, { kind: "green" }, NATIVE ? 'Android local storage' : 'Browser local storage')),
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
                    React.createElement("button", { className: "btn primary", disabled: !this.state.importText.trim(), onClick: this.importBackup }, "Validate & restore backup"))),
            React.createElement("section", { className: "card" },
                React.createElement(SectionTitle, { title: "About this build", sub: "Flock Ledger 1.0 \u00B7 private offline edition" }),
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
    render() {
        var _a, _b;
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
                    React.createElement("button", { className: "btn secondary", onClick: () => this.setState({ tab: 'overview' }) }, "Create a batch instead"),
                    this.renderBackup()) : React.createElement(React.Fragment, null,
                    React.createElement("section", { className: "card" },
                        React.createElement(BatchForm, { onCancel: () => this.setState({ tab: 'backup' }), onSave: (values) => { this.mutate((d) => { const b = M.makeBatch(values); d.batches.push(b); d.selectedBatchId = b.id; }, 'First batch saved'); this.setState({ tab: 'overview', scenarioDraft: null, selectedDay: null }); } })),
                    React.createElement("button", { className: "btn secondary", onClick: () => this.setState({ tab: 'backup' }) }, "Restore an existing backup")),
                s.toast && React.createElement("div", { className: "toast", role: "status" }, s.toast));
        const b = this.b();
        const tabs = [['overview', 'home', 'Overview'], ['records', 'log', 'Records'], ['forecast', 'chart', 'Forecast'], ['batches', 'flock', 'Batches'], ['backup', 'save', 'Backup']];
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
                    React.createElement("small", null, "PRIVATE FARM EDITION \u00B7 1.0"))),
            React.createElement("div", { className: "workspace" },
                React.createElement("header", { className: "topbar" },
                    React.createElement("div", { className: "mobile-brand" },
                        React.createElement(Icon, { name: "flock", size: 23 }),
                        "Flock Ledger"),
                    React.createElement("div", { className: "batch-selector" },
                        React.createElement("span", { className: "eyebrow" }, "BATCH"),
                        React.createElement("select", { "aria-label": "Selected batch", value: b.id, onChange: e => { try {
                                this.mutate((d) => { d.selectedBatchId = e.target.value; });
                                this.setState({ scenarioDraft: null, selectedDay: null, filter: 'all' });
                            }
                            catch (err) {
                                this.toast(err.message);
                            } } }, s.data.batches.map((b) => React.createElement("option", { key: b.id, value: b.id },
                            b.name,
                            b.status === 'closed' ? ' · closed' : '')))),
                    React.createElement("div", { className: "top-date" },
                        dateLabel(M.today()),
                        React.createElement("span", null,
                            React.createElement("i", { className: "status-dot" }),
                            "Saved locally")),
                    React.createElement("button", { className: "header-add", "aria-label": "Add record", onClick: () => this.openRecord() },
                        React.createElement(Icon, { name: "plus" }))),
                React.createElement("main", null,
                    s.storageError && React.createElement(Note, { tone: "error" }, s.storageError),
                    s.tab === 'overview' ? this.renderOverview() : s.tab === 'records' ? this.renderRecords() : s.tab === 'forecast' ? this.renderForecast() : s.tab === 'batches' ? this.renderBatches() : this.renderBackup(),
                    React.createElement("footer", null,
                        "Flock Ledger \u00B7 ",
                        b.name,
                        " \u00B7 Private, offline records"))),
            React.createElement("nav", { className: "bottom-nav", "aria-label": "Mobile navigation" }, tabs.map(([key, icon, label]) => React.createElement("button", { key: key, className: s.tab === key ? 'active' : '', onClick: () => this.switchTab(key) },
                React.createElement(Icon, { name: icon }),
                React.createElement("span", null, label)))),
            s.toast && React.createElement("div", { className: "toast", role: "status" },
                React.createElement(Icon, { name: "check", size: 18 }),
                s.toast),
            s.modal && React.createElement("div", { className: "modal-backdrop", role: "presentation", onClick: e => { if (e.target === e.currentTarget)
                    this.setState({ modal: null }); } },
                React.createElement("section", { role: "dialog", "aria-modal": "true", "aria-label": s.modal.kind === 'record' ? 'Record editor' : 'Batch editor', className: "modal" }, s.modal.kind === 'record' ? React.createElement(RecordForm, { key: (((_a = s.modal.event) === null || _a === void 0 ? void 0 : _a.id) || 'new') + (((_b = s.modal.convert) === null || _b === void 0 ? void 0 : _b.id) || '') + s.modal.type, type: s.modal.type, event: s.modal.event || (s.modal.convert ? Object.assign(Object.assign({}, s.modal.convert), { id: undefined, type: 'feed', kg: null, phase: 'finisher', date: M.today(), note: '' }) : null), convert: s.modal.convert, batch: b, onSave: this.saveRecord, onCancel: () => this.setState({ modal: null }) }) : React.createElement(BatchForm, { batch: s.modal.batch, onCancel: () => this.setState({ modal: null }), onSave: (values) => { this.mutate((d) => { if (s.modal.batch) {
                        const index = d.batches.findIndex((x) => x.id === s.modal.batch.id);
                        d.batches[index] = Object.assign(Object.assign({}, d.batches[index]), values);
                        delete d.batches[index].error;
                    }
                    else {
                        const n = M.makeBatch(values);
                        d.batches.push(n);
                        d.selectedBatchId = n.id;
                    } }); this.setState({ modal: null, scenarioDraft: null, selectedDay: null }); } }))));
    }
}
ReactDOM.render(React.createElement(App, null), document.getElementById('root'));
