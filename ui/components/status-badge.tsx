type BadgeVariant = 'green' | 'yellow' | 'red' | 'gray' | 'blue';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-800',
};

const USER_STATUS_LABELS: Record<string, { label: string; variant: BadgeVariant }> = {
  VerifiedUser: { label: 'מאומת', variant: 'green' },
  PendingVerification: { label: 'ממתין לאימות', variant: 'yellow' },
};

const USER_ROLE_LABELS: Record<string, { label: string; variant: BadgeVariant }> = {
  Admin: { label: 'מנהל מערכת', variant: 'red' },
  Moderator: { label: 'מנהל תוכן', variant: 'blue' },
  Senior: { label: 'מנהל בכיר', variant: 'blue' },
  User: { label: 'משתמש', variant: 'gray' },
};

const REQUEST_STATUS_LABELS: Record<string, { label: string; variant: BadgeVariant }> = {
  Draft: { label: 'טיוטה', variant: 'gray' },
  Pending: { label: 'ממתין', variant: 'yellow' },
  Approved: { label: 'אושר', variant: 'green' },
  Rejected: { label: 'נדחה', variant: 'red' },
  Obsolete: { label: 'מיושן', variant: 'gray' },
};

interface StatusBadgeProps {
  type: 'userStatus' | 'userRole' | 'requestStatus';
  value: string;
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  const map =
    type === 'userStatus'
      ? USER_STATUS_LABELS
      : type === 'userRole'
        ? USER_ROLE_LABELS
        : REQUEST_STATUS_LABELS;

  const config = map[value] ?? { label: value, variant: 'gray' as BadgeVariant };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANT_CLASSES[config.variant]}`}
    >
      {config.label}
    </span>
  );
}
