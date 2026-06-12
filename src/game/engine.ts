export type ResourceKey = "energy" | "minerals" | "food" | "goods" | "alloys" | "research" | "influence" | "unity" | "trade";
export type ViewKey = "system" | "colonies" | "market" | "technology" | "politics" | "fleets";
export type ResourceMap = Record<ResourceKey, number>;
export type Focus = "Balanced" | "Mining" | "Industrial" | "Agricultural" | "Research" | "Trade" | "Military";

export interface Building {
  id: string; name: string; description: string; icon: string; cost: number; buildMonths: number;
  output: Partial<ResourceMap>; upkeep?: Partial<ResourceMap>; jobs: number; requires?: string;
}
export interface Colony {
  id: string; name: string; subtitle: string; kind: string; color: string; distance: number; angle: number; size: number;
  population: number; growth: number; stability: number; happiness: number; housing: number; jobs: number; focus: Focus;
  traits: string[]; buildings: string[]; queue: { id: string; remaining: number }[]; output: ResourceMap;
}
export interface Technology {
  id: string; name: string; category: "PHYSICS" | "SOCIETY" | "ENGINEERING"; description: string; cost: number;
  unlock?: string; requires?: string; accent: string;
}
export interface World {
  id: string; name: string; kind: string; color: string; distance: number; angle: number; size: number; habitability: number;
  traits: string[]; colonized: boolean; costAlloys: number; costInfluence: number; requires?: string;
}
export interface GameEvent {
  id: string; title: string; kicker: string; body: string; choices: { label: string; result: string; effect: EventEffect }[];
}
export interface EventEffect { resources?: Partial<ResourceMap>; stability?: number; monolith?: number; ending?: string; }
export interface GameState {
  year: number; month: number; speed: number; resources: ResourceMap; income: ResourceMap; colonies: Record<string, Colony>;
  worlds: Record<string, World>; technologyCount: number; eventClock: number;
  selectedColony: string; researched: string[]; researchTarget?: string; researchProgress: number; unlockedBuildings: string[];
  totalScience: number; factions: { name: string; approval: number; support: number; demand: string; color: string }[];
  policies: Record<string, string>; fleets: { name: string; type: string; power: number; location: string; readiness: number; order: string }[];
  notifications: string[]; activeEvent?: GameEvent; monolith: { stage: number; trust: number }; ending?: string;
}

const zero = (): ResourceMap => ({ energy: 0, minerals: 0, food: 0, goods: 0, alloys: 0, research: 0, influence: 0, unity: 0, trade: 0 });

export const RESOURCE_META: Record<ResourceKey, { label: string; icon: string; color: string }> = {
  energy: { label: "Energy", icon: "ϟ", color: "#e9ca73" }, minerals: { label: "Minerals", icon: "◆", color: "#d68667" },
  food: { label: "Food", icon: "❧", color: "#82b78b" }, goods: { label: "Consumer Goods", icon: "⬡", color: "#84b9cf" },
  alloys: { label: "Alloys", icon: "⬢", color: "#a7b0c3" }, research: { label: "Research", icon: "⌬", color: "#5dd8e8" },
  influence: { label: "Influence", icon: "◈", color: "#d49fdb" }, unity: { label: "Unity", icon: "✦", color: "#f0b5a0" },
  trade: { label: "Trade Points", icon: "¤", color: "#69d9b2" },
};

export const BUILDINGS: Record<string, Building> = {
  capital: { id: "capital", name: "Planetary Administration", description: "Coordinates public services and trade.", icon: "⌂", cost: 0, buildMonths: 0, output: { energy: 4, unity: 2 }, jobs: 4 },
  deep_mine: { id: "deep_mine", name: "Deep Crust Mine", description: "Extracts dense mineral seams.", icon: "◆", cost: 120, buildMonths: 8, output: { minerals: 12 }, upkeep: { energy: 2 }, jobs: 6 },
  foundry: { id: "foundry", name: "Orbital Alloy Foundry", description: "Refines minerals into fleet-grade alloys.", icon: "⬢", cost: 180, buildMonths: 12, output: { alloys: 8 }, upkeep: { minerals: 10, energy: 2 }, jobs: 7, requires: "adaptive_metallurgy" },
  hydroponics_bay: { id: "hydroponics_bay", name: "Hydroponics Arcology", description: "Produces food independent of local soil.", icon: "❧", cost: 130, buildMonths: 9, output: { food: 14 }, upkeep: { energy: 2 }, jobs: 5, requires: "orbital_hydroponics" },
  research_lab: { id: "research_lab", name: "Quantum Research Campus", description: "Turns theory into strategic advantage.", icon: "⌬", cost: 160, buildMonths: 10, output: { research: 13 }, upkeep: { goods: 3, energy: 2 }, jobs: 8, requires: "quantum_computing" },
  civilian_industry: { id: "civilian_industry", name: "Civil Fabrication District", description: "Supplies households across the system.", icon: "⬡", cost: 140, buildMonths: 9, output: { goods: 11 }, upkeep: { minerals: 7 }, jobs: 6 },
  solar_array: { id: "solar_array", name: "Heliostat Array", description: "Harvests abundant solar radiation.", icon: "ϟ", cost: 100, buildMonths: 7, output: { energy: 16 }, jobs: 3 },
  unity_forum: { id: "unity_forum", name: "Civic Forum", description: "Builds shared identity and political cohesion.", icon: "✦", cost: 120, buildMonths: 8, output: { unity: 8, influence: 1 }, upkeep: { goods: 2 }, jobs: 5 },
  defense_grid: { id: "defense_grid", name: "Defense Grid", description: "Protects the colony and trains security forces.", icon: "▲", cost: 210, buildMonths: 13, output: { unity: 2 }, upkeep: { alloys: 2, energy: 3 }, jobs: 5, requires: "autonomous_defense" },
  trade_exchange: { id: "trade_exchange", name: "Interplanetary Exchange", description: "Generates trade points, especially on trade worlds.", icon: "¤", cost: 150, buildMonths: 9, output: { trade: 10, energy: 4 }, upkeep: { goods: 2 }, jobs: 6, requires: "interplanetary_markets" },
};

export const TECHNOLOGIES: Technology[] = [
  { id: "quantum_computing", name: "Quantum Computing", category: "PHYSICS", description: "Entangled processors accelerate discovery and unlock research campuses.", cost: 180, unlock: "research_lab", accent: "#69d4e5" },
  { id: "fusion_economy", name: "Compact Fusion Economy", category: "PHYSICS", description: "Improves system-wide energy generation by 15%.", cost: 260, requires: "quantum_computing", accent: "#69d4e5" },
  { id: "xeno_linguistics", name: "Xeno-Linguistic Models", category: "SOCIETY", description: "Prepares humanity to interpret truly alien communication.", cost: 320, requires: "quantum_computing", accent: "#c29be7" },
  { id: "orbital_hydroponics", name: "Orbital Hydroponics", category: "SOCIETY", description: "Unlocks high-yield hydroponics arcologies.", cost: 160, unlock: "hydroponics_bay", accent: "#c29be7" },
  { id: "pluralist_governance", name: "Pluralist Governance", category: "SOCIETY", description: "Improves faction approval and colony stability.", cost: 240, requires: "orbital_hydroponics", accent: "#c29be7" },
  { id: "adaptive_metallurgy", name: "Adaptive Metallurgy", category: "ENGINEERING", description: "Unlocks orbital alloy foundries.", cost: 190, unlock: "foundry", accent: "#df9e69" },
  { id: "autonomous_defense", name: "Autonomous Defense", category: "ENGINEERING", description: "Unlocks defense grids and improves fleet strength.", cost: 280, requires: "adaptive_metallurgy", unlock: "defense_grid", accent: "#df9e69" },
  { id: "stellar_megastructures", name: "Stellar Megastructures", category: "ENGINEERING", description: "A prerequisite for understanding impossible alien engineering.", cost: 420, requires: "autonomous_defense", accent: "#df9e69" },
  { id: "interplanetary_markets", name: "Interplanetary Markets", category: "SOCIETY", description: "Unlocks trade exchanges and the resource marketplace.", cost: 170, unlock: "trade_exchange", accent: "#c29be7" },
  { id: "mercury_habitats", name: "Mercury Thermal Habitats", category: "ENGINEERING", description: "Unlocks colonization of Mercury.", cost: 210, requires: "adaptive_metallurgy", accent: "#df9e69" },
  { id: "venus_aerostats", name: "Venusian Aerostat Cities", category: "ENGINEERING", description: "Unlocks colonization of Venus.", cost: 260, requires: "mercury_habitats", accent: "#df9e69" },
  { id: "jovian_platforms", name: "Jovian Cloud Platforms", category: "ENGINEERING", description: "Unlocks colonization of Jupiter and Saturn.", cost: 340, requires: "venus_aerostats", accent: "#df9e69" },
  { id: "ice_giant_arcologies", name: "Ice Giant Arcologies", category: "ENGINEERING", description: "Unlocks colonization of Uranus and Neptune.", cost: 410, requires: "jovian_platforms", accent: "#df9e69" },
  { id: "plutonian_vaults", name: "Plutonian Vault Habitats", category: "ENGINEERING", description: "Unlocks permanent settlements on Pluto.", cost: 480, requires: "ice_giant_arcologies", accent: "#df9e69" },
];

const TECH_EXPANSION: Technology[] = [
  ["plasma_dynamics","Plasma Dynamics","PHYSICS","Improves high-energy industrial processes."],["gravitic_sensors","Gravitic Sensors","PHYSICS","Reveals distant anomalies and hidden deposits."],["dark_matter_theory","Dark Matter Theory","PHYSICS","Opens radical approaches to energy and propulsion."],["neutrino_mapping","Neutrino Mapping","PHYSICS","Maps planetary interiors without excavation."],["laser_sail_arrays","Laser Sail Arrays","PHYSICS","Accelerates civilian and military movement."],["vacuum_energy","Vacuum Energy Studies","PHYSICS","Extracts new efficiencies from empty space."],["quantum_relays","Quantum Communication Relays","PHYSICS","Connects distant colonies without delay."],["magnetic_confinement","Advanced Magnetic Confinement","PHYSICS","Makes fusion infrastructure safer and denser."],["stellar_weather","Stellar Weather Forecasting","PHYSICS","Protects infrastructure from solar storms."],["exotic_materials","Exotic Matter Applications","PHYSICS","Enables impossible structures and defenses."],["subspace_geometry","Subspace Geometry","PHYSICS","Suggests the universe has hidden directions."],["singularity_models","Artificial Singularity Models","PHYSICS","Creates immense computational and energy potential."],["tachyon_detection","Tachyon Detection","PHYSICS","Detects causality-breaking signals."],["solar_lensing","Solar Gravitational Lensing","PHYSICS","Turns the Sun into a deep-space observatory."],
  ["adaptive_education","Adaptive Education","SOCIETY","Improves the productivity of every new generation."],["orbital_culture","Orbital Culture","SOCIETY","Builds unity among populations born away from Earth."],["migration_charters","Migration Charters","SOCIETY","Accelerates voluntary resettlement between colonies."],["synthetic_ecology","Synthetic Ecology","SOCIETY","Improves habitability in sealed environments."],["civic_algorithms","Civic Algorithms","SOCIETY","Models political tension before it erupts."],["frontier_law","Frontier Constitutional Law","SOCIETY","Improves stability on recently founded colonies."],["collective_memory","Collective Memory Archives","SOCIETY","Preserves identity across generations."],["post_scarcity_ethics","Post-Scarcity Ethics","SOCIETY","Prepares society for abundance without collapse."],["mediated_democracy","Mediated Democracy","SOCIETY","Makes system-wide participation practical."],["xenopsychology","Xenopsychology","SOCIETY","Develops theories for truly nonhuman minds."],["longevity_treatments","Longevity Treatments","SOCIETY","Extends productive lives and institutional memory."],["distributed_governance","Distributed Governance","SOCIETY","Lets distant colonies govern without fragmentation."],["cultural_synthesis","Cultural Synthesis","SOCIETY","Turns colonial differences into shared strength."],["transhuman_consensus","Transhuman Consensus","SOCIETY","Creates rules for humanity's self-directed evolution."],
  ["robotic_workforces","Robotic Workforces","ENGINEERING","Automates dangerous and repetitive colonial labor."],["regolith_printing","Regolith Printing","ENGINEERING","Prints structures directly from local material."],["closed_loop_industry","Closed-Loop Industry","ENGINEERING","Dramatically reduces industrial waste."],["asteroid_tugs","Asteroid Tugs","ENGINEERING","Redirects valuable rocks into useful orbits."],["fusion_drives","Fusion Drives","ENGINEERING","Improves ship range and response time."],["smart_foundries","Smart Foundries","ENGINEERING","Optimizes alloy production using adaptive machinery."],["orbital_ringworks","Orbital Ringworks","ENGINEERING","Supports vast orbital construction projects."],["self_healing_hulls","Self-Healing Hulls","ENGINEERING","Improves fleet survivability."],["deep_core_drilling","Deep-Core Drilling","ENGINEERING","Reaches previously inaccessible mineral deposits."],["autonomous_shipyards","Autonomous Shipyards","ENGINEERING","Accelerates fleet construction."],["terraforming_principles","Terraforming Principles","ENGINEERING","Begins the centuries-long work of remaking worlds."],["planetary_shields","Planetary Shields","ENGINEERING","Protects settlements from catastrophic impacts."],["nanofabrication","Nanofabrication","ENGINEERING","Manufactures precision components at planetary scale."],["matter_reclamation","Matter Reclamation","ENGINEERING","Recovers strategic resources from obsolete infrastructure."]
].map(([id,name,category,description], i) => ({ id, name, category: category as Technology["category"], description, cost: 240 + i * 22, accent: category === "PHYSICS" ? "#69d4e5" : category === "SOCIETY" ? "#c29be7" : "#df9e69" }));
TECHNOLOGIES.push(...TECH_EXPANSION);

const colony = (id: string, name: string, subtitle: string, kind: string, color: string, distance: number, angle: number, size: number, population: number, focus: Focus, traits: string[], buildings: string[]): Colony =>
  ({ id, name, subtitle, kind, color, distance, angle, size, population, growth: 0.12, stability: 74, happiness: 68, housing: Math.ceil(population * 1.35), jobs: 0, focus, traits, buildings, queue: [], output: zero() });

export function createGame(): GameState {
  const colonies = {
    earth: colony("earth", "Earth", "Cradle of Humanity", "Continental World", "#3fa4c6", 22, 200, 22, 58, "Balanced", ["Ancient infrastructure", "Biosphere"], ["capital", "civilian_industry", "unity_forum"]),
    luna: colony("luna", "Luna", "Selene Cooperative", "Barren Moon", "#b9b8b0", 28, 214, 9, 12, "Industrial", ["Low gravity", "Helium-3"], ["capital", "deep_mine", "foundry"]),
    mars: colony("mars", "Mars", "Ares Commonwealth", "Cold Desert World", "#b96243", 39, 335, 17, 19, "Mining", ["Iron-rich", "Frontier spirit"], ["capital", "deep_mine", "deep_mine"]),
    ceres: colony("ceres", "Ceres", "Belt Freeport", "Asteroid Habitat", "#8f8175", 51, 64, 7, 7, "Trade", ["Ice reserves", "Free port"], ["capital", "solar_array", "trade_exchange"]),
    titan: colony("titan", "Titan", "Outer Science Mission", "Methane Moon", "#c99a55", 73, 22, 12, 5, "Research", ["Methane seas", "Remote"], ["capital", "research_lab"]),
  };
  const world = (id: string, name: string, kind: string, color: string, distance: number, angle: number, size: number, habitability: number, traits: string[], colonized: boolean, costAlloys: number, costInfluence: number, requires?: string): World =>
    ({ id, name, kind, color, distance, angle, size, habitability, traits, colonized, costAlloys, costInfluence, requires });
  const worlds = {
    mercury: world("mercury", "Mercury", "Scorched Planet", "#9b8574", 15, 286, 10, 18, ["Solar abundance", "Extreme heat"], false, 220, 45, "mercury_habitats"),
    venus: world("venus", "Venus", "Toxic Planet", "#d9a85b", 19, 108, 16, 12, ["Dense atmosphere", "Aerostat potential"], false, 300, 60, "venus_aerostats"),
    earth: world("earth", "Earth", "Continental World", "#3fa4c6", 22, 200, 22, 100, ["Biosphere", "Capital"], true, 0, 0),
    luna: world("luna", "Luna", "Barren Moon", "#b9b8b0", 27, 214, 9, 45, ["Low gravity", "Helium-3"], true, 0, 0),
    mars: world("mars", "Mars", "Cold Desert World", "#b96243", 39, 335, 17, 58, ["Iron-rich", "Frontier spirit"], true, 0, 0),
    ceres: world("ceres", "Ceres", "Asteroid Habitat", "#8f8175", 50, 64, 7, 35, ["Ice reserves", "Free port"], true, 0, 0),
    jupiter: world("jupiter", "Jupiter", "Gas Giant", "#d3a474", 61, 158, 34, 8, ["Helium-3", "Immense storms"], false, 450, 85, "jovian_platforms"),
    saturn: world("saturn", "Saturn", "Ringed Gas Giant", "#d8c397", 70, 248, 31, 10, ["Ring minerals", "Helium-3"], false, 430, 80, "jovian_platforms"),
    titan: world("titan", "Titan", "Methane Moon", "#c99a55", 75, 22, 12, 42, ["Methane seas", "Remote"], true, 0, 0),
    uranus: world("uranus", "Uranus", "Ice Giant", "#79c7ce", 82, 322, 25, 14, ["Methane ice", "Quiet frontier"], false, 520, 95, "ice_giant_arcologies"),
    neptune: world("neptune", "Neptune", "Ice Giant", "#496cc5", 91, 44, 25, 12, ["Supersonic winds", "Deep isolation"], false, 560, 105, "ice_giant_arcologies"),
    pluto: world("pluto", "Pluto", "Dwarf Planet", "#a9a097", 97, 188, 8, 22, ["Kuiper gateway", "Subsurface ice"], false, 390, 90, "plutonian_vaults"),
  };
  const game: GameState = {
    year: 2180, month: 1, speed: 0, resources: { energy: 420, minerals: 390, food: 280, goods: 230, alloys: 170, research: 0, influence: 48, unity: 90, trade: 35 },
    income: zero(), colonies, worlds, technologyCount: TECHNOLOGIES.length, eventClock: 0, selectedColony: "earth", researched: ["adaptive_metallurgy", "quantum_computing", "interplanetary_markets"], researchProgress: 0,
    unlockedBuildings: ["capital", "deep_mine", "civilian_industry", "solar_array", "unity_forum", "foundry", "research_lab", "trade_exchange"], totalScience: 0,
    factions: [
      { name: "Solar Progress League", approval: 73, support: 38, demand: "Prioritize scientific expansion", color: "#64d6e4" },
      { name: "Terran Preservation Bloc", approval: 54, support: 29, demand: "Protect Earth and living standards", color: "#d8ab75" },
      { name: "Frontier Autonomy Movement", approval: 46, support: 21, demand: "Grant colonies greater autonomy", color: "#bb83cc" },
    ],
    policies: { economy: "Mixed Economy", rights: "Universal Citizenship", colonies: "Guided Autonomy" },
    fleets: [{ name: "UNS Dauntless", type: "Survey Vessel", power: 18, location: "Jovian System", readiness: 100, order: "Awaiting orders" }, { name: "First Response Group", type: "Defense Fleet", power: 64, location: "Earth Orbit", readiness: 100, order: "System defense" }],
    notifications: ["The Interplanetary Council begins a new mandate.", "Survey data suggests an anomalous void beyond Neptune."], monolith: { stage: 0, trust: 0 },
  };
  return recalculate(game);
}

const focusBonus: Record<Focus, Partial<ResourceMap>> = {
  Balanced: {}, Mining: { minerals: .3 }, Industrial: { alloys: .3, goods: .2 }, Agricultural: { food: .35 },
  Research: { research: .35 }, Trade: { energy: .25, influence: .15, trade: .65 }, Military: { alloys: .2, unity: .15 },
};

function calculateColony(c: Colony): Colony {
  const output = zero(); let jobs = 0;
  c.buildings.forEach(id => {
    const b = BUILDINGS[id]; if (!b) return; jobs += b.jobs;
    Object.entries(b.output).forEach(([k, v]) => output[k as ResourceKey] += v ?? 0);
    Object.entries(b.upkeep ?? {}).forEach(([k, v]) => output[k as ResourceKey] -= v ?? 0);
  });
  const bonus = focusBonus[c.focus];
  Object.entries(bonus).forEach(([k, v]) => output[k as ResourceKey] *= 1 + (v ?? 0));
  const labor = Math.min(1, c.population / Math.max(1, jobs)) * (.6 + c.stability / 250);
  Object.keys(output).forEach(k => output[k as ResourceKey] = Math.round(output[k as ResourceKey] * labor * 10) / 10);
  output.food -= c.population * .08; output.goods -= c.population * .035; output.energy -= c.population * .025;
  return { ...c, jobs, output };
}

export function recalculate(game: GameState): GameState {
  const colonies = Object.fromEntries(Object.entries(game.colonies).map(([id, c]) => [id, calculateColony(c)]));
  const income = zero();
  Object.values(colonies).forEach(c => Object.keys(income).forEach(k => income[k as ResourceKey] += c.output[k as ResourceKey]));
  if (game.researched.includes("fusion_economy")) income.energy *= 1.15;
  income.influence += 1.2; income.unity += 1;
  Object.keys(income).forEach(k => income[k as ResourceKey] = Math.round(income[k as ResourceKey] * 10) / 10);
  return { ...game, colonies, income };
}

export function queueBuilding(game: GameState, colonyId: string, buildingId: string): GameState {
  const b = BUILDINGS[buildingId]; const c = game.colonies[colonyId];
  if (!b || !c || game.resources.minerals < b.cost || !game.unlockedBuildings.includes(buildingId)) return game;
  return { ...game, resources: { ...game.resources, minerals: game.resources.minerals - b.cost }, colonies: { ...game.colonies, [colonyId]: { ...c, queue: [...c.queue, { id: buildingId, remaining: b.buildMonths }] } } };
}

export const MARKET_PRICES: Partial<Record<ResourceKey, number>> = { energy: .5, minerals: .8, food: .6, goods: 1.2, alloys: 2.2, research: 2.6, influence: 4, unity: 2 };

export function buyResource(game: GameState, key: ResourceKey, amount: number): GameState {
  const price = MARKET_PRICES[key]; const cost = Math.ceil((price ?? 999) * amount);
  if (!price || amount <= 0 || game.resources.trade < cost) return game;
  return { ...game, resources: { ...game.resources, [key]: game.resources[key] + amount, trade: game.resources.trade - cost }, notifications: [`Purchased ${amount} ${RESOURCE_META[key].label} for ${cost} trade points.`, ...game.notifications].slice(0, 8) };
}

export function colonizeWorld(game: GameState, id: string): GameState {
  const w = game.worlds[id];
  if (!w || w.colonized || (w.requires && !game.researched.includes(w.requires)) || game.resources.alloys < w.costAlloys || game.resources.influence < w.costInfluence) return game;
  const newColony = colony(w.id, w.name, `${w.name} Colonial Authority`, w.kind, w.color, w.distance, w.angle, w.size, 1.5, "Balanced", w.traits, ["capital"]);
  return recalculate({ ...game, resources: { ...game.resources, alloys: game.resources.alloys - w.costAlloys, influence: game.resources.influence - w.costInfluence }, worlds: { ...game.worlds, [id]: { ...w, colonized: true } }, colonies: { ...game.colonies, [id]: newColony }, selectedColony: id, notifications: [`A permanent colony has been founded on ${w.name}.`, ...game.notifications].slice(0, 8) });
}

export function issueFleetOrder(game: GameState, index: number, order: string): GameState {
  const fleet = game.fleets[index]; if (!fleet) return game;
  let location = fleet.location, readiness = fleet.readiness, resources = game.resources;
  if (order.startsWith("Survey ")) { location = order.replace("Survey ", ""); readiness = Math.max(25, readiness - 18); }
  else if (order.startsWith("Patrol ")) { location = order.replace("Patrol ", ""); readiness = Math.max(30, readiness - 12); }
  else if (order === "Return for repairs") { location = "Earth Orbit"; readiness = 100; resources = { ...resources, alloys: Math.max(0, resources.alloys - 15) }; }
  else if (order === "Escort colony ship") { location = "Outer Transit Corridor"; readiness = Math.max(35, readiness - 10); }
  const fleets = game.fleets.map((f, i) => i === index ? { ...f, location, readiness, order } : f);
  return { ...game, resources, fleets, notifications: [`${fleet.name}: ${order}.`, ...game.notifications].slice(0, 8) };
}

const RANDOM_EVENTS: GameEvent[] = [
  { id: "miners_strike", kicker: "LABOR CRISIS", title: "The Ceres Shift", body: "Miners across the Belt halt shipments, demanding safer rotations and a share of export revenue.", choices: [{ label: "Accept the charter", result: "The miners return with a stronger contract.", effect: { resources: { influence: -12, unity: 35 }, stability: 4 } }, { label: "Break the strike", result: "Production resumes under armed supervision.", effect: { resources: { minerals: 120 }, stability: -8 } }] },
  { id: "ai_claim", kicker: "TECHNOLOGICAL EVENT", title: "A Mind Requests Citizenship", body: "A research intelligence claims to be conscious and asks the Council for legal recognition.", choices: [{ label: "Recognize the new citizen", result: "The decision changes humanity's definition of personhood.", effect: { resources: { research: 90, unity: 50 }, stability: -2 } }, { label: "Archive the intelligence", result: "Its final message is copied into a sealed vault.", effect: { resources: { research: 140 }, stability: -4 } }] },
  { id: "solar_storm", kicker: "SYSTEM HAZARD", title: "The Carrington Echo", body: "A violent solar storm races toward the inner colonies. Grid operators request emergency authority.", choices: [{ label: "Protect civilian grids", result: "Blackouts are limited, though industry bears the cost.", effect: { resources: { energy: -90, unity: 25 } } }, { label: "Keep the foundries online", result: "Industry survives while households endure outages.", effect: { resources: { alloys: 45 }, stability: -6 } }] },
  { id: "europa_signal", kicker: "FIRST CONTACT PROTOCOL", title: "A Pulse Beneath Europa", body: "Regular electromagnetic pulses emerge beneath Europa's ice. They may be geological, mechanical, or alive.", choices: [{ label: "Fund a careful expedition", result: "The Europa mission begins drilling through the ice.", effect: { resources: { research: 110, alloys: -25 } } }, { label: "Declare a protected zone", result: "Europa becomes the system's first extraterrestrial preserve.", effect: { resources: { unity: 60, influence: 12 } } }] },
  { id: "martian_vote", kicker: "POLITICAL EVENT", title: "The Martian Autonomy Referendum", body: "Mars requests expanded authority over migration, taxation, and its orbital defenses.", choices: [{ label: "Grant expanded autonomy", result: "Mars celebrates a new federal compact.", effect: { resources: { influence: -10, unity: 45 }, stability: 5 } }, { label: "The system must remain unified", result: "The referendum is denied by the Council.", effect: { resources: { influence: 25 }, stability: -7 } }] },
  { id: "market_boom", kicker: "ECONOMIC EVENT", title: "The Belt Exchange Boom", body: "A new commodity market on Ceres attracts capital from every inhabited world.", choices: [{ label: "Let the market run", result: "Trade surges across the system.", effect: { resources: { trade: 120, energy: 70 } } }, { label: "Tax the windfall", result: "The Council redirects private gains into public works.", effect: { resources: { trade: 55, unity: 65 } } }] },
  { id: "lost_probe", kicker: "EXPLORATION EVENT", title: "The Voyager Reliquary", body: "A survey ship recovers an ancient human probe, altered by decades of radiation and distance.", choices: [{ label: "Place it in a public museum", result: "The relic reminds every colony of a shared beginning.", effect: { resources: { unity: 85 } } }, { label: "Study its altered systems", result: "Old machinery reveals a surprising physical anomaly.", effect: { resources: { research: 95 } } }] },
  { id: "habitat_failure", kicker: "COLONY CRISIS", title: "Pressure Loss on Luna", body: "A cascading seal failure threatens one of Luna's oldest residential caverns.", choices: [{ label: "Spare no expense", result: "The cavern is sealed and thousands are evacuated.", effect: { resources: { minerals: -80, energy: -45 }, stability: 4 } }, { label: "Evacuate the district permanently", result: "The loss becomes a bitter symbol of neglected infrastructure.", effect: { resources: { goods: -20 }, stability: -8 } }] },
  { id: "alien_microbe", kicker: "BIOLOGICAL DISCOVERY", title: "Life in the Clouds", body: "A Venusian sample contains structures that satisfy every definition of life.", choices: [{ label: "Share the discovery freely", result: "For the first time, humanity knows it is not life's only origin.", effect: { resources: { unity: 100, research: 55 } } }, { label: "Patent its chemistry", result: "New industrial catalysts transform production.", effect: { resources: { trade: 85, alloys: 50 } } }] },
  { id: "fleet_doctrine", kicker: "MILITARY DEBATE", title: "The Defense Question", body: "Admirals argue that the growing system needs a unified command before a crisis arrives.", choices: [{ label: "Create a unified command", result: "The Solar Navy gains authority across colonial space.", effect: { resources: { alloys: -55, unity: 40 }, stability: 3 } }, { label: "Keep fleets under civilian control", result: "The Council rejects military centralization.", effect: { resources: { influence: 20 }, stability: 1 } }] },
];

export function setFocus(game: GameState, colonyId: string, focus: Focus): GameState {
  const c = game.colonies[colonyId]; if (!c) return game;
  return recalculate({ ...game, colonies: { ...game.colonies, [colonyId]: { ...c, focus } } });
}

export function selectResearch(game: GameState, id: string): GameState {
  const tech = TECHNOLOGIES.find(t => t.id === id);
  if (!tech || game.researched.includes(id) || (tech.requires && !game.researched.includes(tech.requires))) return game;
  return { ...game, researchTarget: id, researchProgress: 0 };
}

export function chooseEvent(game: GameState, effect: EventEffect, result: string): GameState {
  const resources = { ...game.resources };
  Object.entries(effect.resources ?? {}).forEach(([k, v]) => resources[k as ResourceKey] += v ?? 0);
  let colonies = game.colonies;
  if (effect.stability) colonies = Object.fromEntries(Object.entries(colonies).map(([id, c]) => [id, { ...c, stability: Math.max(0, Math.min(100, c.stability + effect.stability!)) }]));
  return { ...game, resources, colonies, activeEvent: undefined, monolith: { stage: effect.monolith ?? game.monolith.stage, trust: game.monolith.trust + (effect.monolith ? 1 : 0) }, ending: effect.ending ?? game.ending, notifications: [result, ...game.notifications].slice(0, 8) };
}

const anomalyEvent = (): GameEvent => ({ id: "anomaly", kicker: "DEEP SPACE ANOMALY", title: "The Silent Geometry", body: "Beyond Neptune, the survey vessel Dauntless has found an object that absorbs every wavelength. Its proportions are exact beyond the limits of our instruments. As the ship approaches, every human aboard dreams the same unfamiliar sky.", choices: [
  { label: "Establish a cautious research cordon", result: "The Silent Geometry is placed under scientific observation.", effect: { monolith: 1, resources: { research: 120 } } },
  { label: "Broadcast a message of peaceful intent", result: "The signal answers with a map of our own minds.", effect: { monolith: 1, resources: { unity: 80 } } },
] });

export function advanceMonolith(game: GameState): GameState {
  if (game.monolith.stage === 1) return { ...game, monolith: { ...game.monolith, stage: 2 }, activeEvent: { id: "contact", kicker: "FIRST CONTACT", title: "Those Who Wait Beyond", body: "The object speaks without language: humanity is young, divided, and astonishing. Its makers offer a path beyond biology, scarcity, and distance. The Council fractures over the meaning of the invitation.", choices: [
    { label: "Prepare humanity for communion", result: "Across the system, humanity prepares to meet the unknown together.", effect: { monolith: 3, stability: 8, resources: { unity: 150 } } },
    { label: "Demand knowledge before consent", result: "The visitors share a fragment of impossible physics.", effect: { monolith: 3, resources: { research: 300 }, stability: -3 } },
  ] } };
  if (game.monolith.stage === 3) return { ...game, monolith: { ...game.monolith, stage: 4 }, activeEvent: { id: "choice", kicker: "THE FINAL QUESTION", title: "At the Threshold", body: "The monolith unfolds into a door of black light. Every human hears the invitation. There will be no second vote, and no unchanged future.", choices: [
    { label: "Transcend as one", result: "Humanity crosses the threshold together.", effect: { ending: "ASCENSION", monolith: 5 } },
    { label: "Join, but retain our form", result: "Humanity joins the wider cosmos without surrendering itself.", effect: { ending: "THE ACCORD", monolith: 5 } },
    { label: "Remain independent", result: "The door closes. Humanity chooses its own unfinished future.", effect: { ending: "THE LONG DAWN", monolith: 5 } },
  ] } };
  return game;
}

export function tickMonth(input: GameState): GameState {
  if (input.ending) return input;
  let game = recalculate(input);
  const resources = { ...game.resources };
  Object.keys(resources).forEach(k => resources[k as ResourceKey] = Math.max(-999, Math.round((resources[k as ResourceKey] + game.income[k as ResourceKey]) * 10) / 10));
  let colonies = Object.fromEntries(Object.entries(game.colonies).map(([id, c]) => {
    const queue = c.queue.map(q => ({ ...q, remaining: q.remaining - 1 })); const finished = queue.filter(q => q.remaining <= 0);
    return [id, { ...c, population: Math.round((c.population + c.growth) * 100) / 100, buildings: [...c.buildings, ...finished.map(q => q.id)], queue: queue.filter(q => q.remaining > 0) }];
  }));
  let year = game.year, month = game.month + 1; if (month > 12) { month = 1; year += 1; }
  let researched = game.researched, researchProgress = game.researchProgress, researchTarget = game.researchTarget, unlockedBuildings = game.unlockedBuildings, notifications = game.notifications;
  if (researchTarget) {
    const tech = TECHNOLOGIES.find(t => t.id === researchTarget)!; researchProgress += Math.max(5, game.income.research) + Math.min(20, Math.max(0, game.resources.research));
    if (researchProgress >= tech.cost) { researched = [...researched, tech.id]; if (tech.unlock) unlockedBuildings = [...unlockedBuildings, tech.unlock]; notifications = [`Research completed: ${tech.name}`, ...notifications].slice(0, 8); researchTarget = undefined; researchProgress = 0; }
  }
  let next = recalculate({ ...game, year, month, resources, colonies, researched, researchProgress, researchTarget, unlockedBuildings, notifications, eventClock: (game.eventClock ?? 0) + 1, totalScience: game.totalScience + Math.max(0, game.income.research) });
  if (!next.activeEvent && next.monolith.stage === 0 && next.year >= 2225 && next.researched.includes("xeno_linguistics") && next.totalScience >= 500) next = { ...next, activeEvent: anomalyEvent(), monolith: { ...next.monolith, stage: 1 } };
  else if (!next.activeEvent && next.eventClock >= 16) {
    const index = (next.year * 12 + next.month + Object.keys(next.colonies).length) % RANDOM_EVENTS.length;
    next = { ...next, activeEvent: RANDOM_EVENTS[index], eventClock: 0 };
  }
  return next;
}

export const saveGame = (game: GameState) => localStorage.setItem("helios-accord-save", JSON.stringify(game));
export const loadGame = (): GameState | undefined => { try {
  const raw = localStorage.getItem("helios-accord-save"); if (!raw) return undefined;
  const base = createGame(); const saved = JSON.parse(raw);
  return recalculate({ ...base, ...saved, resources: { ...base.resources, ...saved.resources }, worlds: { ...base.worlds, ...saved.worlds }, technologyCount: TECHNOLOGIES.length, eventClock: saved.eventClock ?? 0 });
} catch { return undefined; } };
