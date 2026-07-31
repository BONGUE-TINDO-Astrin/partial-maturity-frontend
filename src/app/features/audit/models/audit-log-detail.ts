import { AuditEventType } from './audit-event-type';
import { AuditResourceType } from './audit-resource-type';

/**
 * Détail complet d'une entrée du journal d'audit.
 *
 * details contient les informations structurées
 * désérialisées depuis detail_json par le backend.
 */
export interface AuditLogDetail {
  id: number;
  eventType: AuditEventType;
  resourceType: AuditResourceType;
  resourceId: string;
  policyNumber: string | null;
  actorUsername: string;
  occurredAt: string;
  summary: string;
  details: Record<string, unknown>;
}