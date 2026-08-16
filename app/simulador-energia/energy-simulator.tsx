"use client";

import { useMemo, useState } from "react";
import { appliances, ApplianceUse, consumptionLevel, monthlyConsumption } from "../../lib/energy-simulator";

const categories = Array.from(new Set(appliances.map((item) => item.category)));

export function EnergySimulator() {
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [uses, setUses] = useState<Record<string, ApplianceUse>>({});
  const [showResults, setShowResults] = useState(false);

  const selected = appliances.filter((item) => uses[item.id]?.quantity > 0);
  const total = selected.reduce((sum, item) => sum + monthlyConsumption(item, uses[item.id]), 0);
  const byCategory = useMemo(() => categories.map((category) => ({ category, value: appliances.filter((item) => item.category === category && uses[item.id]).reduce((sum, item) => sum + monthlyConsumption(item, uses[item.id]), 0) })).filter((item) => item.value > 0).sort((a, b) => b.value - a.value), [uses]);
  const level = consumptionLevel(total);

  function add(id: string) {
    const appliance = appliances.find((item) => item.id === id)!;
    setUses((current) => ({ ...current, [id]: current[id] ?? { quantity: 1, hoursPerDay: appliance.defaultHours, daysPerMonth: 30 } }));
    setShowResults(false);
  }

  function update(id: string, field: keyof ApplianceUse, value: number) {
    setUses((current) => ({ ...current, [id]: { ...current[id], [field]: value } })); setShowResults(false);
  }

  function remove(id: string) { setUses((current) => { const next = { ...current }; delete next[id]; return next; }); setShowResults(false); }

  return <div className="energy-simulator">
    <section className="simulator-intro"><span className="eyebrow">Herramienta de autogestión</span><h1>¿Cuánta energía consume tu hogar?</h1><p>Elegí tus artefactos e indicá cuánto los usás. Obtendrás una estimación mensual en kWh y podrás reconocer dónde concentrar tus hábitos de ahorro.</p><div className="simulator-formula"><strong>Potencia × horas de uso × días</strong><span>El resultado es orientativo y no calcula el importe de la factura.</span></div></section>
    <section className="simulator-workspace">
      <div className="appliance-picker">
        <div className="simulator-step"><b>1</b><span><strong>Seleccioná tus artefactos</strong><small>Están agrupados por uso.</small></span></div>
        <div className="category-tabs" role="tablist" aria-label="Categorías de artefactos">{categories.map((category) => <button role="tab" aria-selected={activeCategory === category} className={activeCategory === category ? "active" : ""} key={category} onClick={() => setActiveCategory(category)}>{category}<small>{appliances.filter((item) => item.category === category && uses[item.id]).length}</small></button>)}</div>
        <div className="appliance-grid">{appliances.filter((item) => item.category === activeCategory).map((item) => { const enabled = Boolean(uses[item.id]); return <article key={item.id} className={enabled ? "selected" : ""}><div><span>{item.watts >= 1000 ? `${item.watts / 1000} kW` : `${item.watts} W`}</span><h3>{item.name}</h3>{item.note && <small>{item.note}</small>}</div><button onClick={() => enabled ? remove(item.id) : add(item.id)} aria-pressed={enabled}>{enabled ? "Quitar" : "Agregar +"}</button></article>; })}</div>
      </div>
      <aside className="consumption-summary">
        <div className="simulator-step"><b>2</b><span><strong>Indicá el uso</strong><small>Ajustá cantidad, horas y días.</small></span></div>
        {!selected.length && <div className="simulator-empty"><strong>Tu hogar está vacío</strong><p>Agregá artefactos para comenzar la estimación.</p></div>}
        <div className="selected-appliances">{selected.map((item) => <article key={item.id}><div><strong>{item.name}</strong><button onClick={() => remove(item.id)} aria-label={`Quitar ${item.name}`}>×</button></div><div className="usage-fields"><label>Cantidad<input type="number" min="1" max="20" value={uses[item.id].quantity} onChange={(event) => update(item.id, "quantity", Math.max(1, Number(event.target.value)))} /></label><label>Horas/día<input type="number" min="0.05" max="24" step="0.25" value={uses[item.id].hoursPerDay} onChange={(event) => update(item.id, "hoursPerDay", Math.min(24, Math.max(.05, Number(event.target.value))))} /></label><label>Días/mes<input type="number" min="1" max="31" value={uses[item.id].daysPerMonth} onChange={(event) => update(item.id, "daysPerMonth", Math.min(31, Math.max(1, Number(event.target.value))))} /></label></div><output>{monthlyConsumption(item, uses[item.id]).toFixed(1)} kWh/mes</output></article>)}</div>
        <div className="running-total"><span>Consumo mensual estimado</span><strong>{total.toFixed(1)} <small>kWh</small></strong><button disabled={!selected.length} onClick={() => setShowResults(true)}>Ver mis resultados →</button></div>
      </aside>
    </section>
    {showResults && <section className="simulator-results" aria-live="polite"><div className={`result-score ${level.tone}`}><small>Estimación mensual</small><strong>{total.toFixed(1)} kWh</strong><span>{level.label}</span></div><div className="category-breakdown"><h2>Así se compone tu consumo</h2>{byCategory.map((item) => <div key={item.category}><span>{item.category}</span><i><b style={{ width: `${Math.max(4, item.value / total * 100)}%` }} /></i><strong>{item.value.toFixed(1)} kWh</strong></div>)}</div><div className="saving-tips"><h2>Oportunidades de ahorro</h2><ul><li>Revisá primero la categoría de mayor consumo.</li><li>En calefacción y agua caliente, reducir una hora diaria puede producir una diferencia importante.</li><li>Apagá equipos en espera y aprovechá iluminación LED.</li><li>Compará esta estimación con los kWh de tu factura, no con el importe en pesos.</li></ul><button onClick={() => { setUses({}); setShowResults(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Comenzar de nuevo</button></div></section>}
    <p className="simulator-legal">Estimación educativa basada en potencias típicas. El consumo real depende del modelo, eficiencia, ciclos automáticos, clima y hábitos. No reemplaza una medición eléctrica ni determina categorías tarifarias.</p>
  </div>;
}
