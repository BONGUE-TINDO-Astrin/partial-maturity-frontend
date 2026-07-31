import { AuditEventType } from '../../audit/models/audit-event-type';

/**
 * Dernier événement enregistré dans le journal.
 */
export interface LatestAuditEvent {
  id: number;
  eventType: AuditEventType;
  actorUsername: string;
  summary: string;
  occurredAt: string;
}

/**
 * Indicateurs du journal d'audit.
 */
export interface AuditDashboard {
  totalEvents: number;
  eventsToday: number;
  lastEvent: LatestAuditEvent | null;
}