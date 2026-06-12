import { useEffect, useMemo, useState } from "react";
import { Atom, Building2, ChevronRight, CircleDot, Coins, FlaskConical, Gauge, Landmark, Orbit, Pause, Play, Rocket, Save, Sparkles, Users, X } from "lucide-react";
import { advanceMonolith, BUILDINGS, buyResource, chooseEvent, colonizeWorld, createGame, Focus, GameState, issueFleetOrder, loadGame, MARKET_PRICES, queueBuilding, RESOURCE_META, ResourceKey, saveGame, selectResearch, setFocus, TECHNOLOGIES, tickMonth, ViewKey } from "./game/engine";

const tabs: { id: ViewKey; label: string; icon: typeof Orbit }[] = [
  { id: "system", label: "System", icon: Orbit }, { id: "colonies", label: "Colonies", icon: Building2 },
  { id: "market", label: "Market", icon: Coins },
  { id: "technology", label: "Technology", icon: FlaskConical }, { id: "politics", label: "Council", icon: Landmark },
  { id: "fleets", label: "Fleets", icon: Rocket },
];

const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toString();
const date = (g: GameState) => `${String(g.month).padStart(2, "0")}.${g.year}`;

export default function App() {
  const [game, setGame] = useState<GameState>(() => loadGame() ?? createGame());
  const [view, setView] = useState<ViewKey>("system");
  const [intro, setIntro] = useState(true);
  const [menu, setMenu] = useState(false);
  const colony = game.colonies[game.selectedColony];

  useEffect(() => {
    if (!game.speed || intro || game.activeEvent || game.ending) return;
    const id = setInterval(() => setGame(g => tickMonth(g)), 900 / game.speed);
    return () => clearInterval(id);
  }, [game.speed, intro, game.activeEvent, game.ending]);

  const research = TECHNOLOGIES.find(t => t.id === game.researchTarget);
  const selectColony = (id: string) => { setGame(g => ({ ...g, selectedColony: id })); };
  const notification = game.notifications[0];

  return <div className="app">
    <div className="starfield" />
    <header>
      <button className="brand" onClick={() => setView("system")}><span className="brand-mark"><Orbit /></span><span><b>HELIOS</b><small>ACCORD</small></span></button>
      <div className="resources">{(Object.keys(RESOURCE_META) as ResourceKey[]).map(key => <div className="resource" key={key} title={RESOURCE_META[key].label}><span style={{ color: RESOURCE_META[key].color }}>{RESOURCE_META[key].icon}</span><b>{fmt(game.resources[key])}</b><small className={game.income[key] >= 0 ? "positive" : "negative"}>{game.income[key] >= 0 ? "+" : ""}{game.income[key].toFixed(1)}</small></div>)}</div>
      <div className="time-controls"><button onClick={() => setGame(g => ({ ...g, speed: 0 }))}><Pause size={14} /></button>{[1, 2, 4].map(n => <button key={n} className={game.speed === n ? "active" : ""} onClick={() => setGame(g => ({ ...g, speed: n }))}>{n === 1 ? <Play size={13} /> : `×${n}`}</button>)}<strong>{date(game)}</strong><button onClick={() => { saveGame(game); setMenu(true); }}><Save size={15} /></button></div>
    </header>

    <nav>{tabs.map(t => <button key={t.id} className={view === t.id ? "active" : ""} onClick={() => setView(t.id)}><t.icon size={16} /><span>{t.label}</span></button>)}</nav>

    <main>
      {view === "system" && <SystemView game={game} selectColony={selectColony} openColony={() => setView("colonies")} />}
      {view === "colonies" && <ColonyView game={game} setGame={setGame} selectColony={selectColony} />}
      {view === "market" && <MarketView game={game} setGame={setGame} />}
      {view === "technology" && <TechnologyView game={game} setGame={setGame} />}
      {view === "politics" && <PoliticsView game={game} setGame={setGame} />}
      {view === "fleets" && <FleetsView game={game} setGame={setGame} />}
    </main>

    <aside className="right-rail">
      <div className="rail-title"><span>Situation log</span><small>{game.notifications.length} entries</small></div>
      <div className="objective-card">
        <span className="eyebrow">{game.monolith.stage ? "EXTRA-SOLAR CONTACT" : "COUNCIL MANDATE"}</span>
        <h3>{game.monolith.stage ? "The Silent Geometry" : "Unite the Inner System"}</h3>
        <p>{game.monolith.stage ? "Determine the intent of the impossible object beyond Neptune." : `Raise stability and expand humanity. ${Object.values(game.worlds).filter(w => !w.colonized).length} worlds await colonization.`}</p>
        {(game.monolith.stage === 1 || game.monolith.stage === 3) && <button className="primary" onClick={() => setGame(advanceMonolith)}>Advance contact <ChevronRight size={15} /></button>}
      </div>
      <div className="alerts">{game.notifications.map((n, i) => <button key={`${n}${i}`}><span className={i === 0 ? "pulse" : ""} />{n}</button>)}</div>
      <div className="rail-footer"><Gauge size={15} /><span>System stability</span><b>{Math.round(Object.values(game.colonies).reduce((a, c) => a + c.stability, 0) / Object.keys(game.colonies).length)}%</b></div>
    </aside>

    {intro && <div className="overlay intro"><div className="intro-panel"><div className="intro-orbit"><span /><span /><i /></div><span className="eyebrow">GRAND STRATEGY WITHIN ONE STAR</span><h1>THE HELIOS<br /><em>ACCORD</em></h1><p>Humanity has crossed the void between worlds, but not the distance between itself. Shape every colony. Balance every faction. Decide what our species becomes.</p><button className="launch" onClick={() => setIntro(false)}>ASSUME THE MANDATE <ChevronRight /></button><small>Campaign begins · January 2180</small></div></div>}
    {game.activeEvent && <EventModal game={game} setGame={setGame} />}
    {game.ending && <Ending ending={game.ending} restart={() => setGame(createGame())} />}
    {menu && <div className="toast"><Save size={15} /> Campaign saved locally<button onClick={() => setMenu(false)}><X size={14} /></button></div>}
    {research && <div className="research-strip"><Atom size={15} /><span>Researching <b>{research.name}</b></span><div><i style={{ width: `${Math.min(100, game.researchProgress / research.cost * 100)}%` }} /></div><small>{Math.round(game.researchProgress)} / {research.cost}</small></div>}
  </div>;
}

function SystemView({ game, selectColony, openColony }: { game: GameState; selectColony: (id: string) => void; openColony: () => void }) {
  const selected = game.colonies[game.selectedColony];
  return <section className="system-view">
    <div className="map-label"><span className="eyebrow">SOL // LOCAL COMMAND SPACE</span><h2>Helios System</h2><p>{Object.keys(game.colonies).length} settled worlds · {Object.values(game.colonies).reduce((a, c) => a + c.population, 0).toFixed(1)} billion citizens</p></div>
    <div className="solar-map"><div className="sun"><i /></div>{[15,22,39,61,70,82,91,97].map(r => <div className="orbit-line" key={r} style={{ width: `${r * 1.45}%`, height: `${r * 1.45}%` }} />)}
      {Object.values(game.worlds).map(w => { const c = game.colonies[w.id]; const rad = w.angle * Math.PI / 180; const x = 50 + Math.cos(rad) * w.distance * .48; const y = 50 + Math.sin(rad) * w.distance * .48; return <button key={w.id} onClick={() => c && selectColony(c.id)} className={`planet ${c && game.selectedColony === c.id ? "selected" : ""} ${!w.colonized ? "uncolonized" : ""}`} style={{ left: `${x}%`, top: `${y}%`, "--planet": w.color, "--size": `${w.size}px` } as React.CSSProperties}><span /><label>{w.name}<small>{c ? `${c.population.toFixed(1)}B · ${c.focus}` : `${w.habitability}% habitability · Uncolonized`}</small></label></button>; })}
      <div className="asteroids">{Array.from({ length: 42 }).map((_, i) => <i key={i} style={{ transform: `rotate(${i * 23}deg) translateX(${210 + i % 8 * 4}px)`, opacity: .2 + (i % 5) / 10 }} />)}</div>
      {game.monolith.stage > 0 && <button className="monolith" onClick={() => {}}><i /><label>UNKNOWN OBJECT<small>Beyond Neptune</small></label></button>}
    </div>
    <div className="selected-card" style={{ "--planet": selected.color } as React.CSSProperties}><div className="world-art"><span /></div><div><span className="eyebrow">{selected.kind}</span><h3>{selected.name}</h3><p>{selected.subtitle}</p></div><div className="mini-stats"><span><Users size={14} /> POPULATION <b>{selected.population.toFixed(1)}B</b></span><span><Gauge size={14} /> STABILITY <b>{selected.stability}%</b></span><span><Building2 size={14} /> SPECIALIZATION <b>{selected.focus}</b></span></div><button className="primary" onClick={openColony}>Manage colony <ChevronRight size={15} /></button></div>
  </section>;
}

function MarketView({ game, setGame }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState>> }) {
  const [amount, setAmount] = useState(25);
  const available = (Object.keys(MARKET_PRICES) as ResourceKey[]);
  return <section className="panel-view"><div className="section-heading"><div><span className="eyebrow">INTERPLANETARY COMMODITY EXCHANGE</span><h2>Solar Marketplace</h2><p>Convert trade points into the resources your civilization needs.</p></div><div className="mandate"><Coins /><span>TRADE RESERVES<b>{fmt(game.resources.trade)} ¤</b></span></div></div>
    <div className="market-intro card"><div><span className="eyebrow">MARKET ORDER SIZE</span><h3>Purchase quantity</h3></div><div className="amount-picker">{[10,25,50,100].map(n => <button className={amount === n ? "active" : ""} onClick={() => setAmount(n)} key={n}>{n}</button>)}</div><p>Trade points are generated by Interplanetary Exchanges. Trade-world specialization greatly increases their output.</p></div>
    <div className="market-grid">{available.map(k => { const cost = Math.ceil(MARKET_PRICES[k]! * amount); return <div className="market-card" key={k} style={{ "--accent": RESOURCE_META[k].color } as React.CSSProperties}><span className="market-icon">{RESOURCE_META[k].icon}</span><span className="eyebrow">{RESOURCE_META[k].label}</span><h3>{fmt(game.resources[k])}</h3><p>Acquire {amount} units from system-wide commercial reserves.</p><button disabled={game.resources.trade < cost} onClick={() => setGame(g => buyResource(g, k, amount))}><span>Purchase {amount}</span><b>{cost} ¤</b></button></div>})}</div>
    <div className="card trade-guide"><span className="eyebrow">HOW TO GROW TRADE</span><h3>Build exchanges on specialized trade worlds</h3><p>Ceres begins with an exchange. Research Interplanetary Markets, construct exchanges on more colonies, then set their specialization to Trade to maximize monthly trade-point generation.</p></div>
  </section>;
}

function ColonyView({ game, setGame, selectColony }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState>>; selectColony: (id: string) => void }) {
  const c = game.colonies[game.selectedColony]; const focuses: Focus[] = ["Balanced", "Mining", "Industrial", "Agricultural", "Research", "Trade", "Military"];
  return <section className="panel-view"><div className="section-heading"><div><span className="eyebrow">PLANETARY ECONOMIES</span><h2>Colony Directorate</h2></div><div className="colony-tabs">{Object.values(game.colonies).map(x => <button onClick={() => selectColony(x.id)} className={x.id === c.id ? "active" : ""} key={x.id}><i style={{ background: x.color }} />{x.name}</button>)}</div></div>
    <div className="colony-hero" style={{ "--planet": c.color } as React.CSSProperties}><div className="world-art large"><span /></div><div><span className="eyebrow">{c.kind}</span><h1>{c.name}</h1><p>{c.subtitle} · {c.traits.join(" · ")}</p></div>{[["Population", `${c.population.toFixed(1)}B`], ["Jobs", `${c.jobs}`], ["Housing", `${c.housing}`], ["Stability", `${c.stability}%`], ["Happiness", `${c.happiness}%`]].map(x => <span className="hero-stat" key={x[0]}><small>{x[0]}</small><b>{x[1]}</b></span>)}</div>
    <div className="colony-grid"><div className="card"><div className="card-head"><div><span className="eyebrow">ECONOMIC DOCTRINE</span><h3>Colony specialization</h3></div></div><div className="focus-grid">{focuses.map(f => <button className={c.focus === f ? "active" : ""} onClick={() => setGame(g => setFocus(g, c.id, f))} key={f}>{f}<small>{f === "Balanced" ? "Flexible output" : `Boost ${f.toLowerCase()} sectors`}</small></button>)}</div></div>
      <div className="card output-card"><div className="card-head"><div><span className="eyebrow">MONTHLY LEDGER</span><h3>Local economy</h3></div></div>{(Object.keys(c.output) as ResourceKey[]).filter(k => c.output[k] !== 0).map(k => <div className="ledger" key={k}><span style={{ color: RESOURCE_META[k].color }}>{RESOURCE_META[k].icon}</span><label>{RESOURCE_META[k].label}</label><b className={c.output[k] >= 0 ? "positive" : "negative"}>{c.output[k] >= 0 ? "+" : ""}{c.output[k].toFixed(1)}</b></div>)}</div>
      <div className="card buildings-card"><div className="card-head"><div><span className="eyebrow">MODULAR INFRASTRUCTURE</span><h3>Districts & buildings</h3></div><small>{c.buildings.length} operational</small></div><div className="building-list">{c.buildings.map((id, i) => { const b = BUILDINGS[id]; return <div className="building" key={`${id}${i}`}><span>{b.icon}</span><div><b>{b.name}</b><small>{b.description}</small></div><em>ONLINE</em></div>})}{c.queue.map((q, i) => <div className="building queued" key={`${q.id}${i}`}><span>{BUILDINGS[q.id].icon}</span><div><b>{BUILDINGS[q.id].name}</b><small>Construction in progress</small></div><em>{q.remaining} MO</em></div>)}</div></div>
      <div className="card construction"><div className="card-head"><div><span className="eyebrow">CONSTRUCTION</span><h3>Available projects</h3></div></div><div className="project-list">{Object.values(BUILDINGS).filter(b => b.cost > 0 && game.unlockedBuildings.includes(b.id)).map(b => <button onClick={() => setGame(g => queueBuilding(g, c.id, b.id))} disabled={game.resources.minerals < b.cost} key={b.id}><span>{b.icon}</span><div><b>{b.name}</b><small>{b.cost} ◆ · {b.buildMonths} months · {b.jobs} jobs</small></div><ChevronRight size={15} /></button>)}</div></div></div>
    <ColonizationPanel game={game} setGame={setGame} />
  </section>;
}

function ColonizationPanel({ game, setGame }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState>> }) {
  const targets = Object.values(game.worlds).filter(w => !w.colonized);
  return <div className="card colonization-card"><div className="card-head"><div><span className="eyebrow">EXPANSION DIRECTORATE</span><h3>Colonization targets</h3></div><small>{targets.length} worlds available</small></div><div className="colonization-list">{targets.map(w => { const techReady = !w.requires || game.researched.includes(w.requires); const affordable = game.resources.alloys >= w.costAlloys && game.resources.influence >= w.costInfluence; return <div className="colony-target" key={w.id}><i style={{ "--planet": w.color } as React.CSSProperties} /><div><b>{w.name}</b><small>{w.kind} · {w.habitability}% habitability · {w.traits.join(" · ")}</small><span>{techReady ? `${w.costAlloys} alloys · ${w.costInfluence} influence` : `Requires ${TECHNOLOGIES.find(t => t.id === w.requires)?.name}`}</span></div><button disabled={!techReady || !affordable} onClick={() => setGame(g => colonizeWorld(g, w.id))}>Colonize <Rocket size={13} /></button></div>})}</div></div>;
}

function TechnologyView({ game, setGame }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState>> }) {
  return <section className="panel-view"><div className="section-heading"><div><span className="eyebrow">RESEARCH DIRECTORATE</span><h2>Technological Horizon</h2><p>Choose one strategic breakthrough at a time.</p></div><div className="science-total"><Atom /><span>LIFETIME SCIENCE<b>{fmt(game.totalScience)}</b></span></div></div>
    <div className="tech-columns">{(["PHYSICS", "SOCIETY", "ENGINEERING"] as const).map(cat => <div className="tech-column" key={cat}><div className="tech-title"><span>{cat === "PHYSICS" ? "⌬" : cat === "SOCIETY" ? "◈" : "⬢"}</span><h3>{cat}</h3></div>{TECHNOLOGIES.filter(t => t.category === cat).map(t => { const done = game.researched.includes(t.id), locked = !!t.requires && !game.researched.includes(t.requires); return <button key={t.id} disabled={done || locked} className={`tech-card ${done ? "done" : ""} ${game.researchTarget === t.id ? "active" : ""}`} style={{ "--accent": t.accent } as React.CSSProperties} onClick={() => setGame(g => selectResearch(g, t.id))}><span className="tech-cost">{done ? "RESEARCHED" : locked ? "LOCKED" : `${t.cost} ⌬`}</span><h4>{t.name}</h4><p>{t.description}</p>{t.requires && <small>Requires: {TECHNOLOGIES.find(x => x.id === t.requires)?.name}</small>}</button>})}</div>)}</div>
  </section>;
}

function PoliticsView({ game, setGame }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState>> }) {
  const cycle = (key: string, values: string[]) => setGame(g => ({ ...g, policies: { ...g.policies, [key]: values[(values.indexOf(g.policies[key]) + 1) % values.length] }, resources: { ...g.resources, influence: g.resources.influence - 10 } }));
  return <section className="panel-view"><div className="section-heading"><div><span className="eyebrow">INTERPLANETARY COUNCIL</span><h2>The Human Mandate</h2><p>A federation held together by argument, trade, and common purpose.</p></div><div className="mandate"><Landmark /><span>COUNCIL APPROVAL<b>62%</b></span></div></div><div className="politics-grid"><div className="card government"><span className="eyebrow">GOVERNMENT</span><h3>Federal Solar Republic</h3><p>Executive mandate held by First Coordinator Amara Okafor. Next election: {game.year + 4}.</p><div className="seal"><Orbit /><span>UNIFIED<br />SOLAR<br />COUNCIL</span></div></div><div className="card factions"><div className="card-head"><div><span className="eyebrow">POLITICAL FACTIONS</span><h3>Seats & demands</h3></div></div>{game.factions.map(f => <div className="faction" key={f.name}><i style={{ background: f.color }} /><div><b>{f.name}</b><small>{f.demand}</small><span><u style={{ width: `${f.approval}%`, background: f.color }} /></span></div><em>{f.support}%<small>support</small></em></div>)}</div><div className="card policies"><div className="card-head"><div><span className="eyebrow">LAWS & POLICIES</span><h3>Government program</h3></div></div>{Object.entries(game.policies).map(([k, v]) => <button disabled={game.resources.influence < 10} key={k} onClick={() => cycle(k, k === "economy" ? ["Mixed Economy", "Mobilized Industry", "Open Markets"] : k === "rights" ? ["Universal Citizenship", "Merit Citizenship", "Collective Duty"] : ["Guided Autonomy", "Federal Control", "Full Autonomy"])}><span>{k}</span><b>{v}</b><ChevronRight size={15} /></button>)}</div></div></section>;
}

function FleetsView({ game, setGame }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState>> }) {
  const [selectedFleet, setSelectedFleet] = useState<number | null>(null); const fleet = selectedFleet === null ? undefined : game.fleets[selectedFleet];
  const orders = fleet?.type === "Survey Vessel" ? ["Survey Mercury", "Survey Venus", "Survey Neptune", "Escort colony ship", "Return for repairs"] : ["Patrol Inner System", "Patrol Belt Corridor", "Patrol Outer System", "Escort colony ship", "Return for repairs"];
  return <section className="panel-view"><div className="section-heading"><div><span className="eyebrow">SOLAR NAVY COMMAND</span><h2>Fleet Operations</h2><p>Civilian exploration and collective defense.</p></div><div className="mandate"><Rocket /><span>COMBINED POWER<b>{game.fleets.reduce((a, f) => a + f.power, 0)}</b></span></div></div><div className="fleet-grid">{game.fleets.map((f, i) => <div className="fleet-card" key={f.name}><div className="ship-art"><Rocket /></div><span className="eyebrow">{f.type}</span><h3>{f.name}</h3><p>Current station: {f.location}<br />Assignment: {f.order}</p><div><span>Fleet power <b>{f.power}</b></span><span>Readiness <b>{f.readiness}%</b></span></div><button onClick={() => setSelectedFleet(i)}>Open command interface <ChevronRight size={15} /></button></div>)}<div className="fleet-card new"><CircleDot /><h3>Commission new fleet</h3><p>Requires alloys and an available orbital shipyard.</p><button disabled>Shipyard expansion required</button></div></div>
    {fleet && <div className="command-drawer"><button className="command-close" onClick={() => setSelectedFleet(null)}><X size={16} /></button><div className="command-ship"><Rocket /></div><span className="eyebrow">{fleet.type} // ACTIVE COMMAND</span><h2>{fleet.name}</h2><p>Issue operational orders to this fleet. Orders take effect immediately and may reduce readiness until the fleet returns for repairs.</p><div className="command-status"><span>LOCATION<b>{fleet.location}</b></span><span>CURRENT ORDER<b>{fleet.order}</b></span><span>READINESS<b>{fleet.readiness}%</b></span><span>POWER<b>{fleet.power}</b></span></div><span className="eyebrow">AVAILABLE ORDERS</span><div className="command-orders">{orders.map(order => <button key={order} onClick={() => setGame(g => issueFleetOrder(g, selectedFleet!, order))}><span>{order}</span><ChevronRight size={14} /></button>)}</div></div>}
  </section>;
}

function EventModal({ game, setGame }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState>> }) {
  const e = game.activeEvent!; return <div className="overlay event-overlay"><div className="event-modal"><div className="event-visual"><div className="black-object" /><div className="event-stars" /></div><div className="event-copy"><span className="eyebrow">{e.kicker}</span><h2>{e.title}</h2><p>{e.body}</p><div className="event-choices">{e.choices.map(c => <button key={c.label} onClick={() => setGame(g => chooseEvent(g, c.effect, c.result))}><span>{c.label}</span><ChevronRight /></button>)}</div></div></div></div>;
}

function Ending({ ending, restart }: { ending: string; restart: () => void }) {
  const copy: Record<string, string> = { ASCENSION: "Humanity steps beyond matter and distance. The solar system falls silent, then begins to sing.", "THE ACCORD": "Humanity joins an ancient community among the stars, carrying Earth within it.", "THE LONG DAWN": "The visitors depart. Alone and free, humanity turns outward on its own terms." };
  return <div className="overlay ending"><div><Sparkles /><span className="eyebrow">CAMPAIGN COMPLETE</span><h1>{ending}</h1><p>{copy[ending]}</p><button className="launch" onClick={restart}>BEGIN A NEW TIMELINE</button></div></div>;
}
