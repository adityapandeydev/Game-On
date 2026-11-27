import { lazy, type ComponentType } from "react";
import type { GameId } from "../lib/types";
import type { StageProps } from "./types";

type Stage = ComponentType<StageProps<never>>;
type Loader = () => Promise<{ default: Stage }>;

const loaders: Record<GameId, Loader> = {
  stackfall: () => import("./stackfall/Stackfall"),
  "drop-four": () => import("./dropfour/DropFour"),
  "tic-tac-toe": () => import("./tictactoe/TicTacToe"),
  "sliding-puzzle": () => import("./sliding/Sliding"),
  typestorm: () => import("./typestorm/TypeStorm"),
  "geo-quest": () => import("./geoquest/GeoQuest"),
  "quantum-guess": () => import("./quantum/Quantum"),
  "guess-number": () => import("./guessnumber/GuessNumber"),
  pig: () => import("./pig/Pig"),
};

/** Each game's stage is its own chunk, loaded when that game is opened. */
export const stages = Object.fromEntries(Object.entries(loaders).map(([id, load]) => [id, lazy(load)])) as Record<
  GameId,
  React.LazyExoticComponent<Stage>
>;

/** Starts downloading a stage chunk early (e.g. while the lobby is showing). */
export const preloadStage = (id: GameId) => void loaders[id]?.();
