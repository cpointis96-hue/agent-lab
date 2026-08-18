import type { SimulationState, SimulationAction } from "../domain/simulation";
import { Button } from "./ui/button";

export function SimulationControls({ state, dispatch }: { state: SimulationState; dispatch: (action: SimulationAction) => void }) {
  return <div className="simulation-controls"><span className="eyebrow">SIMULATION</span><span className="simulation-status">{state.blocked ? "Awaiting approval" : state.cursor >= state.events.length ? "Complete" : `${state.cursor}/${state.events.length}`}</span><Button variant="ghost" size="sm" onClick={() => dispatch({ type: "play" })} disabled={state.playing || state.blocked || state.cursor >= state.events.length}>Play</Button><Button variant="ghost" size="sm" onClick={() => dispatch({ type: "step" })} disabled={state.blocked || state.cursor >= state.events.length}>Step</Button><Button variant="ghost" size="sm" onClick={() => dispatch({ type: "pause" })} disabled={!state.playing}>Pause</Button><Button variant="ghost" size="sm" onClick={() => dispatch({ type: "reset" })}>Reset</Button>{state.blocked && <Button onClick={() => dispatch({ type: "resolve-approval" })}>Resolve approval</Button>}</div>;
}
