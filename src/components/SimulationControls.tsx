import type { SimulationState, SimulationAction } from "../domain/simulation";
import { Button } from "./ui/button";
import { useLanguage } from "../i18n/language";

export function SimulationControls({ state, dispatch }: { state: SimulationState; dispatch: (action: SimulationAction) => void }) {
  const { t } = useLanguage();
  return <div className="simulation-controls"><span className="eyebrow">{t("simulation.label")}</span><span className="simulation-status">{state.blocked ? t("simulation.awaitingApproval") : state.cursor >= state.events.length ? t("simulation.complete") : `${state.cursor}/${state.events.length}`}</span><Button variant="ghost" size="sm" onClick={() => dispatch({ type: "play" })} disabled={state.playing || state.blocked || state.cursor >= state.events.length}>{t("simulation.play")}</Button><Button variant="ghost" size="sm" onClick={() => dispatch({ type: "step" })} disabled={state.blocked || state.cursor >= state.events.length}>{t("simulation.step")}</Button><Button variant="ghost" size="sm" onClick={() => dispatch({ type: "pause" })} disabled={!state.playing}>{t("simulation.pause")}</Button><Button variant="ghost" size="sm" onClick={() => dispatch({ type: "reset" })}>{t("simulation.reset")}</Button>{state.blocked && <Button onClick={() => dispatch({ type: "resolve-approval" })}>{t("simulation.resolve")}</Button>}</div>;
}
