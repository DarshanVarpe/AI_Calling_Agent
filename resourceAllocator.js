// resourceAllocator.js — Greedy resource-rebalancing heuristic for the
// Healthcare Resource Allocation demo (ORION hackathon problem statement #2).
//
// Not a full LP/MIP solve (no Gurobi/Pyomo dependency) — for each resource
// type independently, facilities are split into donors (available > needed)
// and receivers (needed > available), then matched largest-donor-to-largest-
// receiver until every donor's surplus or every receiver's deficit is used up.
// This is the standard greedy baseline for a transportation-style balancing
// problem: cheap to compute, deterministic, and explainable to judges as a
// heuristic rather than an optimum.

const RESOURCE_TYPES = [
  { key: 'beds', available: 'beds_available', needed: 'beds_needed', label: 'General Beds' },
  { key: 'icu', available: 'icu_available', needed: 'icu_needed', label: 'ICU Beds' },
  { key: 'ventilators', available: 'ventilators_available', needed: 'ventilators_needed', label: 'Ventilators' }
];

export function computeAllocation(facilities) {
  if (!facilities || facilities.length < 2) {
    return {
      transfers: [],
      perFacilitySummary: [],
      totalUnmetBefore: 0,
      totalUnmetAfter: 0,
      resolvedPercentage: 0,
      note: 'Need at least 2 facility reports to compute a rebalancing plan.'
    };
  }

  const transfers = [];
  const perFacilitySummary = facilities.map(f => ({
    facility_name: f.facility_name,
    unmetBefore: {},
    unmetAfter: {}
  }));

  for (const rt of RESOURCE_TYPES) {
    const balances = facilities.map(f => ({
      facility_name: f.facility_name,
      balance: (f[rt.available] || 0) - (f[rt.needed] || 0)
    }));

    for (const f of facilities) {
      const bal = balances.find(b => b.facility_name === f.facility_name);
      const summary = perFacilitySummary.find(s => s.facility_name === f.facility_name);
      summary.unmetBefore[rt.key] = Math.max(0, -bal.balance);
      summary.unmetAfter[rt.key] = Math.max(0, -bal.balance); // default: nothing resolved yet
    }

    const donors = balances
      .filter(b => b.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .map(b => ({ ...b }));
    const receivers = balances
      .filter(b => b.balance < 0)
      .sort((a, b) => a.balance - b.balance)
      .map(b => ({ facility_name: b.facility_name, need: -b.balance }));

    let di = 0, ri = 0;
    while (di < donors.length && ri < receivers.length) {
      const donor = donors[di];
      const receiver = receivers[ri];
      const amount = Math.min(donor.balance, receiver.need);

      if (amount > 0) {
        transfers.push({
          resource: rt.label,
          from: donor.facility_name,
          to: receiver.facility_name,
          amount
        });
        donor.balance -= amount;
        receiver.need -= amount;

        const summary = perFacilitySummary.find(s => s.facility_name === receiver.facility_name);
        summary.unmetAfter[rt.key] = Math.max(0, receiver.need);
      }

      if (donor.balance <= 0) di++;
      if (receiver.need <= 0) ri++;
    }
  }

  const sumValues = obj => Object.values(obj).reduce((a, b) => a + b, 0);
  const totalUnmetBefore = perFacilitySummary.reduce((sum, s) => sum + sumValues(s.unmetBefore), 0);
  const totalUnmetAfter = perFacilitySummary.reduce((sum, s) => sum + sumValues(s.unmetAfter), 0);

  return {
    transfers,
    perFacilitySummary,
    totalUnmetBefore,
    totalUnmetAfter,
    resolvedPercentage: totalUnmetBefore === 0 ? 100 : Math.round((1 - totalUnmetAfter / totalUnmetBefore) * 100)
  };
}
