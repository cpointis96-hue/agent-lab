import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function ContextResetExercise() {
  const [context, setContext] = useState("Temporary notes: compare the visible handoff payload.");
  return <Card className="context-exercise"><CardHeader><span className="eyebrow">CONTEXT RESET</span><CardTitle>Temporary context is not a file</CardTitle></CardHeader><CardContent><p>{context || "Temporary context cleared. Persistent project files remain untouched."}</p><div className="dialog-actions"><Button variant="ghost" onClick={() => setContext("")} disabled={!context}>Reset temporary context</Button><Button variant="secondary" onClick={() => setContext("Temporary notes: compare the visible handoff payload.")}>Restore exercise note</Button></div></CardContent></Card>;
}
