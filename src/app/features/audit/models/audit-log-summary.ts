import { AuditEventType } from './audit-event-type';
import { AuditResourceType } from './audit-resource-type';

/**
 * Résumé d'une entrée affichée dans la liste paginée.
 *
 * Cette interface doit rester alignée avec la réponse
 * résumée retournée par le backend.
 */
export interface AuditLogSummary {
  id: number;
  eventType: AuditEventType;
  resourceType: AuditResourceType;
  resourceId: string;
  policyNumber: string | null;
  actorUsername: string;
  occurredAt: string;
  summary: string;
}