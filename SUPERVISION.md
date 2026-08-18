# Agent Lab — Fast Supervision Gate

The primary thread builds and integrates. Normal work is: targeted read → direct implementation → targeted check. Do not call a supervisor after each change.

Call the supervisor only at a milestone gate, after a high-risk structural filesystem change when independent verification is useful, or after two targeted fixes fail on the same cause. Use at most one supervisor and one writer at a time; never nest agents.

Before a milestone verdict, provide compact evidence: changed files, targeted/full checks, rebuilt `.app`, affected Computer Use journey, filesystem results, and known limitations. On FAIL, fix the stated root cause, run only the necessary targeted checks, and reuse the same supervisor where practical. Stop after three cycles on one unresolved cause.

Tier 3 gate: `npm run check`, Rust format/tests, one debug `.app` rebuild, complete packaged-app acceptance journey, direct filesystem evidence, then supervisor PASS. A milestone is complete only after that PASS.
