# Assignment 6 — Prisma ORM Testing Documentation

## 1. API Testing (curl)

The API was tested manually using Postman. The following curl commands can be used to reproduce the main CRUD operations.

Run the application locally before testing. Replace `3000` with the configured server port if necessary.

**Register a user:**

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"prisma-test@example.com","password":"TestPassword123!"}'
```

**Log in:**

```bash
curl -X POST http://localhost:3000/api/users/logon \
  -H "Content-Type: application/json" \
  -d '{"email":"prisma-test@example.com","password":"TestPassword123!"}'
```

**Create a task:**

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Prisma task"}'
```

**Get all tasks:**

```bash
curl -X GET http://localhost:3000/api/tasks
```

**Get, update, and delete a task:**

Replace `TASK_ID` with the ID returned when creating the task.

```bash
curl -X GET http://localhost:3000/api/tasks/TASK_ID

curl -X PATCH http://localhost:3000/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"isCompleted":true}'

curl -X DELETE http://localhost:3000/api/tasks/TASK_ID
```

**Log out:**

```bash
curl -X POST http://localhost:3000/api/users/logoff
```

## 2. Test Results

| Endpoint | Test | Result |
|---|---|---|
| POST `/api/users/register` | Register user | 201 — Passed |
| POST `/api/users/register` | Duplicate email | 400 — Passed |
| POST `/api/users/logon` | Valid credentials | 200 — Passed |
| POST `/api/users/logon` | Invalid password | 401 — Passed |
| POST `/api/users/logoff` | Log out | 200 — Passed |
| POST `/api/tasks` | Create task | 201 — Passed |
| GET `/api/tasks` | List tasks | 200 — Passed |
| GET `/api/tasks/:id` | Retrieve task | 200 — Passed |
| PATCH `/api/tasks/:id` | Update task | 200 — Passed |
| DELETE `/api/tasks/:id` | Delete task | 200 — Passed |
| GET `/api/tasks/:id` | Another user's task | 404 — Passed |
| PATCH `/api/tasks/:id` | Nonexistent task | 404 — Passed |
| GET `/api/tasks/abc` | Invalid ID | 400 — Passed |
| GET `/api/tasks` | Access after logout | 401 — Passed |
| GET `/health` | Database connection | 200 — Passed |

## 3. Prisma Client Verification

Commands:

```bash
npx prisma validate
npx prisma generate
```

**Result:** Schema validation passed, and Prisma Client v6.19.2 was generated successfully.

The initial migration was applied to the development and test databases.

Prisma relationships were also verified:

- `User.tasks` successfully returned a user with their tasks.
- `Task.user` successfully returned a task with its owner.

## 4. Issues and Solutions

- **Relationship naming:** Renamed Prisma relation fields to `tasks` and `user`, regenerated Prisma Client, and verified both relationships.
- **Incorrect relation field:** Fixed `task` to `tasks` after a Prisma Client validation error.
- **Legacy database module:** Kept `db/pg-pool.js` because Assignment 5 tests still depend on it.
- **Database connection error:** Tested an invalid connection URL and confirmed `PrismaClientInitializationError` was returned.

## 5. Automated Testing

Command:

```bash
npm run tdd assignment6
```

**Final result:** 35/35 tests passed (1 test suite passed).

All automated tests passed successfully after the Prisma relationship naming changes.