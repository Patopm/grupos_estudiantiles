# Groups API Enhancement

This document describes the enhancements made to the existing groups API client to support the student groups and events integration feature.

## Overview

The enhanced groups API client adds missing functionality for detailed group information, statistics, and improved error handling while maintaining backward compatibility with existing code.

## New Features

### 1. Enhanced Data Models

#### GroupDetailData Interface

```typescript
interface GroupDetailData extends Group {
  members: GroupMember[];
  upcomingEvents: Event[];
  membershipHistory: MembershipActivity[];
  statistics: GroupStatistics;
}
```

#### GroupStatistics Interface

```typescript
interface GroupStatistics {
  totalMembers: number;
  activeMembers: number;
  upcomingEvents: number;
  totalEvents: number;
  membershipGrowth: number;
  eventAttendanceRate: number;
}
```

#### GroupError Interface

```typescript
interface GroupError extends ApiError {
  type?:
    | 'GROUP_FULL'
    | 'ALREADY_MEMBER'
    | 'PENDING_REQUEST'
    | 'NOT_FOUND'
    | 'PERMISSION_DENIED'
    | 'NETWORK_ERROR';
}
```

### 2. New API Methods

#### getDetailedById(id: string)

Fetches comprehensive group information including members and events.

**Requirements Addressed:** 1.1, 1.4, 2.3

**Usage:**

```typescript
const groupDetails = await groupsApi.getDetailedById('group-id');
console.log(groupDetails.statistics.totalMembers);
console.log(groupDetails.upcomingEvents.length);
```

#### getStatistics(id: string)

Retrieves group analytics and statistics.

**Requirements Addressed:** 1.1, 1.4, 2.3

**Usage:**

```typescript
const stats = await groupsApi.getStatistics('group-id');
console.log(`Active members: ${stats.activeMembers}/${stats.totalMembers}`);
```

#### handleGroupError(error: unknown, defaultMessage: string)

Enhanced error handling for group-specific edge cases.

**Requirements Addressed:** 1.1, 1.4, 2.3

**Features:**

- Maps API errors to user-friendly messages in Spanish
- Categorizes errors by type for better handling
- Provides fallback for unknown errors

#### canJoinGroup(id: string)

Validates if a user can join a group before attempting the join operation.

**Requirements Addressed:** 1.1, 1.4

**Usage:**

```typescript
const { canJoin, reason } = await groupsApi.canJoinGroup('group-id');
if (!canJoin) {
  console.log(`Cannot join: ${reason}`);
}
```

#### joinWithErrorHandling(id: string)

Enhanced join method with improved error handling.

**Requirements Addressed:** 1.1, 1.4

#### leaveWithErrorHandling(id: string)

Enhanced leave method with improved error handling.

**Requirements Addressed:** 2.1, 2.3

## Error Handling

The enhanced API provides comprehensive error handling with Spanish user-friendly messages:

| Error Type        | Status Code | User Message                                        |
| ----------------- | ----------- | --------------------------------------------------- |
| GROUP_FULL        | 400         | El grupo ha alcanzado su capacidad máxima           |
| ALREADY_MEMBER    | 400         | Ya eres miembro de este grupo                       |
| PENDING_REQUEST   | 400         | Ya tienes una solicitud pendiente para este grupo   |
| PERMISSION_DENIED | 403         | No tienes permisos para realizar esta acción        |
| NOT_FOUND         | 404         | El grupo no fue encontrado                          |
| NETWORK_ERROR     | 0           | Error de conexión. Verifica tu conexión a internet. |

## Events Integration

The enhanced groups API integrates with the events API to provide:

- Upcoming events for each group
- Event statistics in group analytics
- Seamless data fetching with parallel API calls

**Note:** The events API integration uses a stub implementation that gracefully handles cases where the events API is not available, returning empty arrays to maintain functionality.

## Backward Compatibility

All existing methods remain unchanged and fully functional:

- `getAll()`
- `getById()`
- `getMyGroups()`
- `getAvailable()`
- `create()`
- `update()`
- `delete()`
- `join()`
- `leave()`
- `getMembers()`
- `getRequests()`
- `approveRequest()`
- `rejectRequest()`

## Testing

The enhancement includes comprehensive tests:

- **Unit tests** for error handling and TypeScript interfaces
- **Integration tests** for API methods with mocked dependencies
- **Edge case testing** for various error scenarios

Run tests with:

```bash
npx vitest run lib/api/__tests__/groups-simple.test.ts lib/api/__tests__/groups-integration.test.ts
```

## Usage Examples

### Fetching Detailed Group Information

```typescript
try {
  const groupDetails = await groupsApi.getDetailedById('group-123');

  // Display group info
  console.log(`Group: ${groupDetails.name}`);
  console.log(`Members: ${groupDetails.statistics.totalMembers}`);
  console.log(`Upcoming Events: ${groupDetails.upcomingEvents.length}`);

  // Use member data
  groupDetails.members.forEach(member => {
    console.log(`${member.full_name} (${member.role})`);
  });
} catch (error) {
  if (error.type === 'NOT_FOUND') {
    console.log('Group not found');
  } else {
    console.log('Error loading group details');
  }
}
```

### Validating Group Join

```typescript
const handleJoinGroup = async (groupId: string) => {
  try {
    // Check if user can join first
    const { canJoin, reason } = await groupsApi.canJoinGroup(groupId);

    if (!canJoin) {
      switch (reason) {
        case 'GROUP_FULL':
          showError('This group is full');
          break;
        case 'ALREADY_MEMBER':
          showError('You are already a member');
          break;
        case 'PENDING_REQUEST':
          showError('You have a pending request');
          break;
        default:
          showError('Cannot join this group');
      }
      return;
    }

    // Proceed with join
    await groupsApi.joinWithErrorHandling(groupId);
    showSuccess('Successfully joined the group!');
  } catch (error) {
    showError(error.message);
  }
};
```

## Future Enhancements

When the full events API is implemented, the following will be automatically enhanced:

1. **Real event data** instead of empty arrays
2. **Event attendance statistics** for group analytics
3. **Membership history** tracking with event participation
4. **Advanced filtering** by event participation

The current implementation is designed to seamlessly integrate with the full events API without requiring changes to consuming code.
