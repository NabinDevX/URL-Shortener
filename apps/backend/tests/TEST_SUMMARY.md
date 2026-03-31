# Backend Test Suite Documentation

## Overview

This document provides a comprehensive overview of all test cases for the URL Shortener Backend API. The test suite covers user authentication, URL management, subscriptions, integrations, and error handling.

## Test Files and Coverage

### 1. **Health & Connection Tests** (`01-health.spec.ts`)

- Server health check endpoint
- Database connection verification
- Server startup and listening

### 2. **Database Connection Tests** (`02-connect.spec.ts`)

- MongoDB connection establishment
- Connection status verification
- Database cleanup and setup

### 3. **URL CRUD Operations** (`03-create.spec.ts`)

- Create URL documents with valid data
- Verify automatic field generation
- Test input validation
- Check constraint enforcement

### 4. **URL Listing and Pagination** (`04-list.spec.ts`)

- List URLs with default pagination
- Filter URLs by user
- Search URLs by shortId
- Pagination with skip and limit
- Sorting (ascending/descending)
- Status filtering (active/deleted)
- Counting documents
- Verifying sorting order

### 5. **URL Update and Deletion** (`05-update-delete.spec.ts`)

- Update URL properties
- Soft delete functionality
- Hard delete functionality
- Soft delete restoration
- Multiple document deletion
- Selective deletion with filters
- Visit history tracking
- Atomic operations with $push

### 6. **API Route Integration** (`06-api-routes.spec.ts`)

- Rate limiting by API key
- Request validation
- Response format verification
- Authentication and authorization

### 7. **User Authentication** (`07-user-auth.spec.ts`) - **NEW**

#### User Creation and Signup

- Create user with email, password, name
- Password hashing verification
- Unique email enforcement
- Initial refresh token setup

#### Password Management

- Verify correct password
- Reject incorrect password
- Password updates
- Hash verification

#### Token Management

- Access token generation
- Refresh token generation
- Token verification
- Token storage

#### API Key Management

- API key generation
- Custom API key expiry
- API key storage
- API key lookup

#### Google OAuth Integration

- User creation with Google ID
- Hybrid account support (password + Google)
- Email verification tracking

#### User Data Access

- Sensitive field exclusion
- Find user by email
- Find user by API key
- Account status changes

#### User Account Updates

- Update user name
- Update user email
- Update email verification status

### 8. **URL Operations** (`08-url-operations.spec.ts`) - **NEW**

#### Generate Short URLs

- Auto-generated shortId
- Custom shortId
- Specified ID length
- Invalid character rejection
- Length validation
- Duplicate detection
- Invalid URL rejection

#### URL Analytics

- Visit history tracking
- Click counting
- Zero analytics for new URLs

#### Update and Delete

- QR code updates
- Non-owner rejection
- Soft deletion
- Soft delete restoration
- Non-owner delete rejection

#### URL Listing and Pagination

- Default pagination
- Custom limits
- Multi-page navigation
- Ascending/descending sort
- Exclude deleted URLs
- Total click summation

#### URL Ownership

- Non-owner access control
- URL count accuracy
- User isolation

### 9. **Subscription Management** (`09-subscription.spec.ts`) - **NEW**

#### Subscription Creation

- Create basic plan subscription
- Create pro plan subscription
- Prevent duplicate active subscriptions
- Database persistence

#### Subscription Retrieval

- Get active subscription
- Handle no subscription case
- Include plan details
- Get most recent subscription

#### Subscription Cancellation

- Cancel active subscription
- Set cancelledAt timestamp
- Error on no subscription

#### Subscription History

- Retrieve past subscriptions
- Exclude deleted subscriptions
- Include plan details in history

#### Plan Information

- List available plans
- Include plan details
- Plan metadata

#### Subscription Status Transitions

- Pause subscription
- Resume subscription

#### Subscription Validation

- Plan ID validation
- Error handling

### 10. **Integration Tests** (`10-integration.spec.ts`) - **NEW**

#### Cross-User Operations

- User URL isolation
- Prevent cross-user modification
- Prevent cross-user deletion

#### URL Generation Edge Cases

- Special characters in URLs
- Very long URLs
- HTTP and HTTPS support
- URLs with authentication
- URLs with port numbers

#### URL Search and Filtering

- Active URL filtering
- Date-based sorting
- Multi-criteria filtering

#### Visit History Tracking

- Timestamp persistence
- Analytics calculation
- Time-series visit data

#### URL Soft Delete and Recovery

- Data preservation on delete
- URL recovery capability
- Count accuracy after deletion

#### QR Code Management

- QR code updates
- Empty QR code rejection

### 11. **Error Handling and Validation** (`11-error-handling.spec.ts`) - **NEW**

#### URL Validation

- Invalid URL format rejection
- Missing protocol rejection
- Query parameter support
- Fragment support

#### Custom Short ID Validation

- Alphanumeric acceptance
- Hyphen support
- Underscore support
- Space rejection
- Special character rejection
- Minimum length enforcement
- Maximum length enforcement
- Duplicate handling

#### Pagination Validation

- Invalid page number handling
- Invalid limit handling
- Out-of-range page handling

#### URL Not Found Scenarios

- Analytics for non-existent URL
- Delete non-existent URL
- Update non-existent URL

#### Null and Undefined Handling

- Null redirectUrl rejection
- Missing userId handling

#### Concurrent Operations

- Multiple simultaneous creations
- Race condition prevention
- Duplicate ID handling

#### Database Consistency

- Referential integrity
- Timestamp updates

#### Large Data Handling

- Maximum length URLs
- Large visit history

## Test Statistics

| Category          | Test File                     | Tests Count |
| ----------------- | ----------------------------- | ----------- |
| Setup & Health    | 01-health.spec.ts             | 3           |
| Connection        | 02-connect.spec.ts            | 2           |
| Create            | 03-create.spec.ts             | 5           |
| List & Pagination | 04-list.spec.ts               | 12          |
| Update & Delete   | 05-update-delete.spec.ts      | 12          |
| API Routes        | 06-api-routes.spec.ts         | 4           |
| User Auth         | **07-user-auth.spec.ts**      | **45**      |
| URL Operations    | **08-url-operations.spec.ts** | **38**      |
| Subscriptions     | **09-subscription.spec.ts**   | **28**      |
| Integration       | **10-integration.spec.ts**    | **32**      |
| Error Handling    | **11-error-handling.spec.ts** | **35**      |
| **TOTAL**         | **11 files**                  | **~216**    |

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Specific Test File

```bash
pnpm test -- 07-user-auth.spec.ts
pnpm test -- 08-url-operations.spec.ts
```

### Run Tests in Watch Mode

```bash
pnpm test -- --watch
```

### Run with Coverage

```bash
pnpm test -- --coverage
```

## Test Coverage Goals

- **Unit Tests**: Individual function/method testing
- **Integration Tests**: Multi-component workflows
- **Error Handling**: Edge cases and exceptional scenarios
- **Data Validation**: Input validation and constraints
- **Concurrency**: Race conditions and simultaneous operations
- **Security**: Authorization and access control
- **Performance**: Large data handling and pagination

## Key Test Patterns

### 1. Setup and Teardown

```typescript
beforeAll(async () => await setupDb());
afterAll(async () => await teardownDb());
beforeEach(async () => await resetDb());
```

### 2. Error Testing

```typescript
try {
  await operation();
  fail("Should throw error");
} catch (error: any) {
  expect(error.statusCode).toBe(expectedCode);
}
```

### 3. Data Isolation

- Each test creates isolated data
- Database is reset between tests
- Multiple users are used to verify isolation

### 4. Pagination Testing

- Boundary conditions (page 1, last page)
- Out-of-range handling
- Limit variations

## Future Test Additions

Consider adding tests for:

1. Rate limiting edge cases
2. OAuth token refresh flows
3. Subscription payment webhooks
4. Email verification flows
5. API key rotation
6. Bulk operations
7. Export functionality
8. Analytics aggregation

## Notes

- Tests use `mongoose.Types.ObjectId()` for user ID generation
- Timestamps are verified within reasonable ranges
- Async operations are properly awaited
- Error messages are checked for user-friendly content
- Database state is isolated between tests
