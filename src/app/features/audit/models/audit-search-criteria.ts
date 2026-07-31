import { AuditEventType } from './audit-event-type';
import { AuditResourceType } from './audit-resource-type';

/**
 * Critères facultatifs transmis à l'API d'audit.
 */
export interface AuditSearchCriteria {
  page: number;
  size: number;
  eventType?: AuditEventType;
  resourceType?: AuditResourceType;
  actorUsername?: string;
  policyNumber?: string;
  fromDate?: string;
  toDate?: string;
}