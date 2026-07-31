/**
 * Types d'événements métier pouvant apparaître
 * dans le journal d'audit.
 *
 * Ces valeurs doivent rester alignées avec
 * AuditEventType dans le backend.
 */
export type AuditEventType =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_ACTIVATED'
  | 'USER_DEACTIVATED'
  | 'FILE_IMPORTED'
  | 'FILE_REJECTED'
  | 'PAYMENT_RECORDED'
  | 'PAYMENT_CANCELLED';