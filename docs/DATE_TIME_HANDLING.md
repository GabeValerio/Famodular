# Date and Time Handling Standards

This document outlines the standards for handling dates and times in the Famodular codebase. Adhering to these standards ensures consistency across modules and prevents timezone-related bugs.

## Core Concepts

There are two distinct strategies for handling dates in this application, depending on the use case:

1.  **Timestamp / History Strategy**: For recording events that happened at a specific moment in time.
2.  **Deadline / Logical Date Strategy**: For setting future dates where the specific time is irrelevant or standardized.

---

## 1. Timestamp / History Strategy

**Use Case**: Recording past actions (e.g., "I watered the plant at 8:00 PM", "I worked from 9:00 AM to 5:00 PM").

**Problem**: Databases store timestamps in UTC. If a user in New York (UTC-5) records an event at 8:00 PM on Tuesday (`Oct 27`), it is stored as `Oct 28, 01:00 AM UTC`. If we simply display the UTC date, the user sees "Wednesday, Oct 28", which is incorrect from their perspective.

**Solution**: Always extract and display the date/time using the **User's Local Time**.

**Implementation**:
Use the helper functions from `lib/utils.ts` when initializing form inputs or displaying data.

```typescript
import { toLocalDateInputValue, toLocalTimeInputValue } from '@/lib/utils';

// ... inside your component
const [date, setDate] = useState(toLocalDateInputValue(new Date(entry.startTime)));
const [time, setTime] = useState(toLocalTimeInputValue(new Date(entry.startTime)));
```

**Affected Modules**:
*   Time Tracker
*   Plants (Last Watered)
*   Calendar (Event Start Time)
*   Kitchen (Expiration Date - *treated as local date*)

---

## 2. Deadline / Logical Date Strategy

**Use Case**: Setting deadlines or due dates (e.g., "Task due on Dec 25th").

**Problem**: If we use local time for deadlines, a task due "Dec 25th" might appear as "Dec 24th" to a user in a different timezone if the stored time shifts across midnight.

**Solution**: Use a **"Noon UTC" Anchor**.
*   Deadlines are stored as `YYYY-MM-DD 12:00:00 UTC`.
*   This ensures that for almost all inhabited timezones, the date remains stable (it is still Dec 25th in California and Japan).

**Implementation**:
Use standardized ISO string extraction. Do **NOT** use the local time helpers for these specific fields unless you are refactoring the entire module's logic.

```typescript
// Standard pattern for deadlines
const dateStr = date.toISOString().split('T')[0];
```

**Affected Modules**:
*   Task Planner (Due Dates)
*   Todos (Due Dates)

---

## Helper Functions Reference (`lib/utils.ts`)

### `toLocalDateInputValue(date: Date): string`
Returns a string in `YYYY-MM-DD` format based on the **local** timezone of the user's browser.
*   *Use for*: Date inputs (`type="date"`) where the specific historical date matters (e.g., "I did this yesterday").

### `toLocalTimeInputValue(date: Date): string`
Returns a string in `HH:mm` format (24-hour) based on the **local** timezone of the user's browser.
*   *Use for*: Time inputs (`type="time"`).

---

## Best Practices Checklist

1.  **Identify the Data Type**: Is this a *Timestamp* (happened at X moment) or a *Logical Date* (due on X day)?
2.  **Timestamps**:
    *   Store as UTC in Database.
    *   Display/Edit using `toLocalDateInputValue` / `toLocalTimeInputValue`.
3.  **Logical Dates**:
    *   Store as UTC Noon (`12:00:00Z`).
    *   Display/Edit using `toISOString().split('T')[0]`.
4.  **New Modules**: Default to the **Timestamp** strategy if dealing with user activity logs. Default to **Logical Date** strategy for planning/future scheduling unless specific times are required.

