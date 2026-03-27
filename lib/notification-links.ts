export function getNotificationLink(entityType: string, entityId: string): string {
  switch (entityType) {
    case 'ArticleRevision':
      return `/revisions/${entityId}`;
    case 'VerificationRequest':
      return `/verification-requests/${entityId}`;
    case 'MinorChangeRequest':
      return `/admin/minor-changes/${entityId}`;
    case 'Image':
      return `/admin/images/${entityId}`;
    case 'User':
      return `/users/${entityId}`;
    case 'OpinionResponse':
      return `/opinions/${entityId}`;
    default:
      return '/notifications';
  }
}
