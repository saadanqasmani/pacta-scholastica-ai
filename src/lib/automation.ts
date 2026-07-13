/**
 * IRIS Autopilot — automated agenda generation.
 *
 * Scans the institution's live data and derives the actions that would
 * otherwise be tracked by hand: MOU renewals coming due, stale
 * partnerships, unanswered requests, mobility imbalance, and assessment
 * cadence. Computed fresh on every dashboard load — no stored state, so
 * it can never drift out of sync with the data.
 */
import { db, ensureSeeded } from '@/lib/localdb';
import type { IMGIPIResult } from '@/lib/imgIpi';

export interface ActionItem {
  id: string;
  kind: 'mou_renewal' | 'mou_pending' | 'stale_partner' | 'request' | 'imbalance' | 'reassess';
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  route: string;
  dueLabel?: string;
}

const DAY = 24 * 60 * 60 * 1000;
type Row = Record<string, unknown>;

export async function computeActionItems(universityId: string): Promise<ActionItem[]> {
  await ensureSeeded();
  const now = Date.now();
  const items: ActionItem[] = [];

  const [mous, interactions, requests, mobility, assessments, universities] = await Promise.all([
    db.mous
      .filter((m) => m.initiator_university_id === universityId || m.partner_university_id === universityId)
      .toArray() as Promise<Row[]>,
    db.partnership_interactions.where('university_id').equals(universityId).toArray() as Promise<Row[]>,
    db.partner_requests.where('to_university_id').equals(universityId).toArray() as Promise<Row[]>,
    db.mobility_records.where('university_id').equals(universityId).toArray() as Promise<Row[]>,
    db.img_ipi_assessments.where('university_id').equals(universityId).toArray() as unknown as Promise<
      { result: IMGIPIResult; created_at: string }[]
    >,
    db.universities.toArray() as Promise<Row[]>,
  ]);
  const nameOf = (id: unknown) => String(universities.find((u) => u.id === id)?.name ?? 'partner');
  const partnerOf = (m: Row) =>
    m.initiator_university_id === universityId ? m.partner_university_id : m.initiator_university_id;

  // 1. MOU renewals — standard 5-year term, flag within 6 months of expiry.
  for (const m of mous.filter((m) => m.status === 'accepted')) {
    const created = new Date(String(m.created_at)).getTime();
    const expiry = created + 5 * 365 * DAY;
    const daysLeft = Math.round((expiry - now) / DAY);
    if (daysLeft <= 180) {
      items.push({
        id: `renewal-${m.id}`,
        kind: 'mou_renewal',
        severity: daysLeft <= 60 ? 'high' : 'medium',
        title: `MOU with ${nameOf(partnerOf(m))} ${daysLeft < 0 ? 'has expired' : `expires in ${daysLeft} days`}`,
        detail: 'Standard 5-year term. Start the renewal conversation before mobility planning is affected.',
        route: '/mou',
        dueLabel: new Date(expiry).toLocaleDateString(),
      });
    }
  }

  // 2. Pending MOUs waiting too long.
  for (const m of mous.filter((m) => ['pending', 'revised', 'counter_proposed'].includes(String(m.status)))) {
    const waitedDays = Math.round((now - new Date(String(m.updated_at ?? m.created_at)).getTime()) / DAY);
    if (waitedDays >= 30) {
      items.push({
        id: `pending-${m.id}`,
        kind: 'mou_pending',
        severity: waitedDays >= 90 ? 'high' : 'medium',
        title: `MOU with ${nameOf(partnerOf(m))} idle for ${waitedDays} days (${String(m.status).replace('_', ' ')})`,
        detail: 'Follow up or set a decision deadline — idle negotiations drive your Item 6 abandonment rate.',
        route: '/mou',
      });
    }
  }

  // 3. Stale partnerships — active MOU but no recorded interaction in 12 months.
  const interactedPartnerIds = new Set(
    interactions
      .filter((i) => now - new Date(String(i.meeting_date ?? i.created_at)).getTime() < 365 * DAY)
      .map((i) => String(i.partner_university_id))
  );
  for (const m of mous.filter((m) => m.status === 'accepted')) {
    const pid = String(partnerOf(m));
    if (!interactedPartnerIds.has(pid)) {
      items.push({
        id: `stale-${pid}`,
        kind: 'stale_partner',
        severity: 'low',
        title: `No recorded contact with ${nameOf(pid)} in the past year`,
        detail: 'Schedule a coordination call and log it in Partnership Management to keep the agreement alive.',
        route: '/partnerships',
      });
    }
  }

  // 4. Unanswered partnership requests.
  for (const r of requests.filter((r) => r.status === 'pending')) {
    const waitedDays = Math.round((now - new Date(String(r.created_at)).getTime()) / DAY);
    if (waitedDays >= 7) {
      items.push({
        id: `request-${r.id}`,
        kind: 'request',
        severity: waitedDays >= 21 ? 'high' : 'medium',
        title: `Unanswered request: "${String(r.subject)}"`,
        detail: `From ${nameOf(r.from_university_id)}, waiting ${waitedDays} days. Slow responses are exactly the Item 1 delay the IMG measures.`,
        route: '/partnerships',
      });
    }
  }

  // 5. Mobility imbalance this academic year.
  const thisYear = mobility.filter((m) => m.academic_year === '2025-2026');
  const inc = thisYear.filter((m) => m.direction === 'incoming').reduce((a, m) => a + Number(m.student_count || 0), 0);
  const out = thisYear.filter((m) => m.direction === 'outgoing').reduce((a, m) => a + Number(m.student_count || 0), 0);
  if (inc + out >= 10 && Math.abs(inc - out) / Math.max(inc, out) > 0.4) {
    items.push({
      id: 'imbalance',
      kind: 'imbalance',
      severity: 'medium',
      title: `Mobility imbalance: ${inc} incoming vs ${out} outgoing (2025–2026)`,
      detail:
        inc > out
          ? 'Reciprocity risk: partners sending more than they receive will renegotiate. Promote outgoing calls.'
          : 'Under-used incoming capacity: remind partners of open nomination quotas.',
      route: '/mobility',
    });
  }

  // 6. Assessment cadence — quarterly re-measurement keeps the trajectory honest.
  const latest = assessments.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
  if (!latest) {
    items.push({
      id: 'assess-first',
      kind: 'reassess',
      severity: 'high',
      title: 'No IMG/IPI assessment on file',
      detail: 'Run the 17-item diagnostic to establish the baseline that drives forecasts and recommendations.',
      route: '/diagnostics',
    });
  } else {
    const ageDays = Math.round((now - new Date(latest.created_at).getTime()) / DAY);
    if (ageDays >= 90) {
      items.push({
        id: 'assess-again',
        kind: 'reassess',
        severity: 'low',
        title: `IMG/IPI assessment is ${ageDays} days old`,
        detail: `Re-measure to track your trajectory (last IMG ${latest.result.img.toFixed(3)}, ${latest.result.imgBand}).`,
        route: '/diagnostics',
        dueLabel: 'quarterly cadence',
      });
    }
  }

  const rank = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, 10);
}
