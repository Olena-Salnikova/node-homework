# Assignment 7 — Advanced Prisma ORM Testing Documentation

## 1. API Testing (curl)

The API was tested manually using Postman. The following curl commands can be used to reproduce the main Assignment 7 features.

Run the application locally before testing. Replace `3000` with the configured server port if necessary.

### Register a User (Transaction)

Registration creates a user and three welcome tasks within a Prisma transaction.

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Assignment Seven","email":"assignment7@example.com","password":"TestPassword123!"}'
```

Expected response: `201 Created`, including `user`, `welcomeTasks`, and `transactionStatus: "success"`.

### Log In

```bash
curl -X POST http://localhost:3000/api/users/logon \
  -H "Content-Type: application/json" \
  -d '{"email":"assignment7@example.com","password":"TestPassword123!"}'
```

### Create a Task with Priority

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Review Prisma","priority":"high"}'
```

Task validation rules:

- `title`: required for creation, 3–30 characters.
- `isCompleted`: boolean, defaults to `false`.
- `priority`: `low`, `medium`, or `high`; defaults to `medium`.
- PATCH requests must contain at least one valid field.

### Bulk Task Creation

```bash
curl -X POST http://localhost:3000/api/tasks/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {"title":"Review transactions","priority":"high"},
      {"title":"Test analytics","priority":"medium"},
      {"title":"Update documentation","priority":"low"}
    ]
  }'
```

Expected response: `201 Created`, including `tasksCreated` and `totalRequested`.

Each task is validated before Prisma `createMany()` is called. Invalid input returns `400 Bad Request`.

### Task Pagination and Filtering

```bash
curl -X GET "http://localhost:3000/api/tasks?page=1&limit=10&find=Prisma"
```

Query parameters:

- `page`: positive integer, default `1`.
- `limit`: positive integer, default `10`, maximum `100`.
- `find`: optional case-insensitive task title filter.

Results are sorted by `createdAt` in descending order.

The response includes task data, selected user information, and pagination metadata.

### Get User Analytics

Replace `USER_ID` with an existing user ID.

```bash
curl -X GET http://localhost:3000/api/analytics/users/USER_ID
```

The response includes:

- `taskStats`: task counts grouped by completion status.
- `recentTasks`: up to 10 recently created tasks.
- `weeklyProgress`: task creation statistics for the last seven days, grouped by creation timestamp.

An invalid user ID returns `400`. A nonexistent user returns `404`.

### Get Users with Task Statistics

```bash
curl -X GET "http://localhost:3000/api/analytics/users?page=1&limit=10"
```

The response includes:

- User information without password hashes.
- Total task count for each user using Prisma `_count`.
- Up to five incomplete task IDs per user.
- Pagination metadata.

The maximum allowed `limit` is `100`.

### Search Tasks Using Raw SQL

```bash
curl -X GET "http://localhost:3000/api/analytics/tasks/search?q=Prisma&limit=20"
```

Query parameters:

- `q`: required search term, minimum two characters.
- `limit`: positive integer, default `20`, maximum `100`.

Search is case-insensitive and matches task titles or user names.

The query uses parameterized Prisma `$queryRaw` with PostgreSQL `ILIKE`. Results prioritize exact title matches, then prefix matches, followed by other matches.

### Log Out

```bash
curl -X POST http://localhost:3000/api/users/logoff
```

Note: Authentication in this assignment uses a server-side `global.user_id` value. The curl commands above illustrate individual requests; independent curl processes do not provide isolated user sessions.

## 2. Test Results

The following scenarios were verified manually in Postman during Assignment 7 development.

| Endpoint | Test | Result |
| --- | --- | --- |
| POST `/api/users/register` | Register user with three welcome tasks | 201 — Passed |
| POST `/api/users/register` | Duplicate email | 400 — Passed |
| POST `/api/users/logon` | Valid login | 200 — Passed |
| POST `/api/users/logoff` | Log out | 200 — Passed |
| GET `/api/tasks` | Access after logout | 401 — Passed |
| POST `/api/tasks/bulk` | Create three tasks | 201 — Passed |
| POST `/api/tasks/bulk` | Invalid task priority | 400 — Passed |
| GET `/api/tasks` | Retrieve tasks | 200 — Passed |
| GET `/api/tasks?page=0` | Invalid pagination | 400 — Passed |
| GET `/api/tasks?page=999` | Page not found | 404 — Passed |
| GET `/api/tasks/:id` | Retrieve owned task | 200 — Passed |
| PATCH `/api/tasks/:id` | Update owned task | 200 — Passed |
| DELETE `/api/tasks/:id` | Delete owned task | 200 — Passed |
| GET `/api/tasks/:id` | Access another user's task | 404 — Passed |
| PATCH `/api/tasks/:id` | Update another user's task | 404 — Passed |
| DELETE `/api/tasks/:id` | Delete another user's task | 404 — Passed |
| GET `/api/tasks/:id` | Retrieve deleted task | 404 — Passed |
| GET `/api/analytics/users/:id` | Existing user analytics | 200 — Passed |
| GET `/api/analytics/users/:id` | Nonexistent user | 404 — Passed |
| GET `/api/analytics/users` | Users with pagination | 200 — Passed |
| GET `/api/analytics/tasks/search` | Search with matching results | 200 — Passed |
| GET `/api/analytics/tasks/search` | Search without matches | 200 — Passed |
| GET `/api/analytics/tasks/search?limit=1` | Limit search results | 200 — Passed |

## 3. Prisma Client Verification

The following advanced Prisma features were implemented and verified through application behavior and automated tests.

### Schema and Migration

The `Task` model includes a `priority` field with a default value of `"medium"`.

Migration:

`20261113191641_add_priority_field`

The migration was applied successfully to both development and test databases.

### Transactions

User registration uses `prisma.$transaction()` to create a user and three welcome tasks atomically.

Prisma transactions ensure atomic operations: all changes are committed together, or rolled back if an operation fails.

### Batch Operations

Bulk task creation uses `prisma.task.createMany()` after validating all requested tasks.

### Aggregation and Relationships

- `groupBy()` calculates task statistics.
- `_count` retrieves user task counts.
- `select` limits returned fields.
- Related user data is loaded together with task data to avoid separate lookups for each task.

### Raw SQL

`prisma.$queryRaw` performs parameterized task searches using PostgreSQL `ILIKE`.

### Pagination and Filtering

Prisma `skip`, `take`, `where`, `orderBy`, and `count()` are used for paginated and filtered results.

## 4. Implementation Notes and Solutions

- **Task priority:** Added the `priority` field to the Prisma schema and created a database migration.
- **Task validation:** Added Joi validation for `low`, `medium`, and `high` priority values.
- **Bulk validation:** Validated all tasks before calling `createMany()` to prevent inserting a partially validated batch.
- **Duplicate email:** Handled Prisma error `P2002` and returned an appropriate response.
- **Task ownership:** Restricted task retrieval, updates, and deletion to the current user.
- **Pagination errors:** Added validation for invalid page and limit values and handling for unavailable task pages.
- **Sensitive user data:** Excluded password hashes from analytics responses.
- **SQL safety:** Used parameterized `$queryRaw` instead of constructing SQL with untrusted input.

## 5. Automated Testing

Command:

```bash
npm run tdd assignment7
```

Final result:

```text
PASS tdd/assignment7.test.js

Test Suites: 1 passed, 1 total
Tests:       51 passed, 51 total
```

All 51 Assignment 7 automated tests passed successfully.

Manual Postman testing also confirmed the main API functionality, validation, authorization checks, and error responses.
