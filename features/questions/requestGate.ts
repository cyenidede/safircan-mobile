export function createRequestGate() {
  let active = true;
  let inFlight = false;
  let generation = 0;
  return {
    begin() {
      if (!active || inFlight) return null;
      inFlight = true;
      return generation;
    },
    isCurrent(ticket: number) { return active && ticket === generation; },
    finish(ticket: number) { if (ticket === generation) inFlight = false; },
    invalidate() { generation += 1; inFlight = false; },
    dispose() { active = false; generation += 1; inFlight = false; },
  };
}
