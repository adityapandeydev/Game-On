import type { GameSession } from "../lib/session";
import type { Game } from "../lib/types";

/** Props every game stage receives from the play page. */
export interface StageProps<S = unknown> {
  game: Game;
  session: GameSession<S>;
  difficulty: string;
}
