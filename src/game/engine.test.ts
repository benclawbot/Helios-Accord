import { describe, expect, it } from "vitest";
import { BUILDINGS, buyResource, colonizeWorld, createGame, issueFleetOrder, queueBuilding, selectResearch, tickMonth } from "./engine";

describe("Helios Accord simulation", () => {
  it("finishing a mine increases colony mineral output", () => {
    let game = createGame();
    const before = game.colonies.earth.output.minerals;
    game.resources.minerals = 1000;
    game = queueBuilding(game, "earth", "deep_mine");
    for (let i = 0; i < BUILDINGS.deep_mine.buildMonths; i += 1) game = tickMonth(game);
    expect(game.colonies.earth.output.minerals).toBeGreaterThan(before);
  });

  it("completed research unlocks its building", () => {
    let game = createGame();
    game = selectResearch(game, "orbital_hydroponics");
    game.resources.research = 1000;
    for (let i = 0; i < 10; i += 1) game = tickMonth(game);
    expect(game.researched).toContain("orbital_hydroponics");
    expect(game.unlockedBuildings).toContain("hydroponics_bay");
  });

  it("reveals the monolith only after the late-game threshold", () => {
    let game = createGame();
    game.year = 2199;
    game.researched = ["quantum_computing", "xeno_linguistics"];
    game.totalScience = 5000;
    game = tickMonth(game);
    expect(game.monolith.stage).toBe(0);
    game.year = 2240;
    game = tickMonth(game);
    expect(game.monolith.stage).toBe(1);
  });

  it("buys resources using trade points", () => {
    let game = createGame();
    game.resources.trade = 100;
    const before = game.resources.alloys;
    game = buyResource(game, "alloys", 10);
    expect(game.resources.alloys).toBe(before + 10);
    expect(game.resources.trade).toBeLessThan(100);
  });

  it("colonizes an available world when requirements are met", () => {
    let game = createGame();
    game.resources.alloys = 1000;
    game.resources.influence = 1000;
    game.researched.push("mercury_habitats");
    game = colonizeWorld(game, "mercury");
    expect(game.colonies.mercury).toBeDefined();
    expect(game.worlds.mercury.colonized).toBe(true);
  });

  it("contains a long-term technology catalog", () => {
    const game = createGame();
    expect(game.technologyCount).toBeGreaterThanOrEqual(50);
  });

  it("triggers a run-changing event after enough quiet months", () => {
    let game = createGame();
    for (let i = 0; i < 16; i += 1) game = tickMonth(game);
    expect(game.activeEvent).toBeDefined();
    expect(game.activeEvent?.choices.length).toBeGreaterThanOrEqual(2);
  });

  it("issues fleet orders that change assignment and readiness", () => {
    let game = createGame();
    game = issueFleetOrder(game, 0, "Survey Neptune");
    expect(game.fleets[0].location).toBe("Neptune");
    expect(game.fleets[0].readiness).toBeLessThan(100);
    expect(game.fleets[0].order).toBe("Survey Neptune");
  });
});
