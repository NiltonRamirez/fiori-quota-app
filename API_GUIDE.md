# API Integration Guide - Quota Management

## 📡 Backend API Specification

### Base URL
```
https://ccb-is-dev-5v6vds1v.it-cpi034-rt.cfapps.us10-002.hana.ondemand.com
```

**Note:** All API calls MUST go through the SAP BTP Destination `dest_int_s`. Never hardcode this URL in the frontend code.

---

## 🔐 Authentication

All endpoints use OAuth2 Client Credentials flow, handled automatically by the SAP BTP Destination service.

**Destination Configuration:**
- Type: HTTP
- Authentication: OAuth2ClientCredentials
- Token Service URL: https://ccb-is-dev-5v6vds1v.authentication.us10.hana.ondemand.com/oauth/token

---

## 📋 Endpoints

### 1. Get Quota Overview

**Purpose:** Retrieve quota availability for a specific week

**Endpoint:** `POST /http/api/quota/overview`

**Request Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "x-user-id": "00200240",
  "weekStartDate": "2026-02-16T00:00:00.000"
}
```

**Parameters:**
- `x-user-id` (string, required): Employee ID from IAS
- `weekStartDate` (string, required): ISO 8601 date string for Monday of the week

**Success Response (200 OK):**
```json
{
  "employeeId": "10000",
  "weekStartDate": "2026-02-16T00:00:00.000",
  "children": [
    {
      "dependentId": "6789_d1",
      "fullName": "Juan Esteban Rivera",
      "days": [
        {
          "date": "2026-02-16",
          "dayOfWeek": "MONDAY",
          "available": true,
          "alreadyAssigned": false,
          "remainingQuota": 24
        },
        {
          "date": "2026-02-18",
          "dayOfWeek": "WEDNESDAY",
          "available": false,
          "alreadyAssigned": false,
          "remainingQuota": 0,
          "disabledReason": "NO_QUOTA"
        }
      ]
    }
  ]
}
```

**Error Response - No Children (404):**
```json
{
  "error": {
    "code": "404",
    "message": {
      "lang": "es",
      "value": "No tiene Hijos Menores a 6 Años"
    }
  }
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `dependentId` | string | Unique identifier for the child |
| `fullName` | string | Child's full name |
| `date` | string | Date in YYYY-MM-DD format |
| `dayOfWeek` | enum | MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY |
| `available` | boolean | Whether the day is available for booking |
| `alreadyAssigned` | boolean | Whether already assigned for this child/date |
| `remainingQuota` | number | Number of available slots |
| `disabledReason` | enum | NO_QUOTA, HOLIDAY, ABSENCE (only when not available) |

**Business Rules:**
- `available=true, alreadyAssigned=false` → Can book
- `available=false, disabledReason=NO_QUOTA` → Can book (waiting list warning)
- `available=false, disabledReason=HOLIDAY` → Cannot book
- `available=false, disabledReason=ABSENCE` → Cannot book  
- `alreadyAssigned=true` → Cannot book (already booked)

---

### 2. Save Assignments

**Purpose:** Save quota assignments for one or more children/dates

**Endpoint:** `POST /http/saveAssignments`

**Request Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "employeeId": "00200241",
  "assignments": [
    {
      "dependentId": "200241-1",
      "date": "2026-02-23"
    },
    {
      "dependentId": "200241-2",
      "date": "2026-02-25"
    }
  ]
}
```

**Parameters:**
- `employeeId` (string, required): Employee ID
- `assignments` (array, required): Array of assignment objects
  - `dependentId` (string, required): Child identifier
  - `date` (string, required): Date in YYYY-MM-DD format

**Success Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "results": [
    {
      "dependentId": "200241-1",
      "date": "2026-02-23",
      "assignmentStatus": "CONFIRMED"
    },
    {
      "dependentId": "200241-2",
      "date": "2026-02-25",
      "assignmentStatus": "WAITING_LIST"
    }
  ]
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | enum | SUCCESS, ERROR |
| `assignmentStatus` | enum | CONFIRMED, WAITING_LIST |

**Business Rules:**
- If quota available → `CONFIRMED`
- If no quota available → `WAITING_LIST`
- Both statuses indicate successful save

---

### 3. Get My Assignments

**Purpose:** Retrieve existing assignments for a specific week

**Endpoint:** `GET /http/myAssignments`

**Request Headers:**
```http
Content-Type: application/json
```

**Query Parameters:**
- `employeeId` (string, required): Employee ID
- `weekStartDate` (string, required): ISO 8601 date string (URL encoded)

**Example:**
```
GET /http/myAssignments?employeeId=00200241&weekStartDate=2026-02-16T00:00:00.000
```

**Success Response (200 OK):**
```json
{
  "employeeId": "00200241",
  "weekStartDate": "2026-02-16T00:00:00.000",
  "assignments": [
    {
      "dependentId": "200241-1",
      "childName": "María López",
      "date": "2026-02-17",
      "dayOfWeek": "TUESDAY",
      "assignmentStatus": "CONFIRMED"
    },
    {
      "dependentId": "200241-2",
      "childName": "Pedro López",
      "date": "2026-02-19",
      "dayOfWeek": "THURSDAY",
      "assignmentStatus": "WAITING_LIST"
    }
  ]
}
```

**Empty Response (200 OK):**
```json
{
  "employeeId": "00200241",
  "weekStartDate": "2026-02-16T00:00:00.000",
  "assignments": []
}
```

---

### 4. Cancel Assignments

**Purpose:** Cancel one or more existing assignments

**Endpoint:** `POST /http/cancelAssignments`

**Request Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "employeeId": "00200241",
  "cancellations": [
    {
      "dependentId": "200241-1",
      "date": "2026-02-23"
    },
    {
      "dependentId": "200241-3",
      "date": "2026-02-24"
    }
  ]
}
```

**Parameters:**
- `employeeId` (string, required): Employee ID
- `cancellations` (array, required): Array of cancellation objects
  - `dependentId` (string, required): Child identifier
  - `date` (string, required): Date in YYYY-MM-DD format

**Success Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "results": [
    {
      "dependentId": "200241-1",
      "date": "2026-02-23",
      "cancellationStatus": "CANCELLED"
    },
    {
      "dependentId": "200241-3",
      "date": "2026-02-24",
      "cancellationStatus": "CANCELLED"
    }
  ]
}
```

---

## 🔄 Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "500",
    "message": {
      "lang": "es",
      "value": "Error interno del servidor"
    }
  }
}
```

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication failed |
| 404 | Not Found - Resource not found or business rule (no children) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Frontend Error Handling Pattern

```javascript
quotaService.getQuotaOverview(userId, weekStartDate)
  .then(function(data) {
    // Handle success
  })
  .catch(function(error) {
    if (error.businessError && error.error.code === "404") {
      // Handle "No Children" business case
      MessageStrip.show(error.error.message.value);
    } else {
      // Handle technical error
      MessageBox.error("Error: " + error.message);
    }
  });
```

---

## 🧪 Testing

### Test User IDs
```
10000 - User with children
00200240 - User with children
00200241 - User for testing assignments
99999 - User without children (404 response)
```

### Test Week Dates
```
2026-02-16T00:00:00.000 - Week with availability
2026-02-23T00:00:00.000 - Week with mixed availability
```

### Sample cURL Commands

**Get Overview:**
```bash
curl -X POST https://ccb-is-dev-5v6vds1v.it-cpi034-rt.cfapps.us10-002.hana.ondemand.com/http/api/quota/overview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "x-user-id": "10000",
    "weekStartDate": "2026-02-16T00:00:00.000"
  }'
```

**Save Assignment:**
```bash
curl -X POST https://ccb-is-dev-5v6vds1v.it-cpi034-rt.cfapps.us10-002.hana.ondemand.com/http/saveAssignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "employeeId": "00200241",
    "assignments": [
      {
        "dependentId": "200241-1",
        "date": "2026-02-23"
      }
    ]
  }'
```

---

## 📌 Implementation Notes

### Date Format Standards
- **ISO 8601 with timezone:** Used for week start dates
  - Format: `YYYY-MM-DDTHH:mm:ss.SSS`
  - Example: `2026-02-16T00:00:00.000`
  
- **Date only:** Used for specific day assignments
  - Format: `YYYY-MM-DD`
  - Example: `2026-02-23`

### Week Calculation
Week always starts on Monday:
```javascript
var oMonday = new Date(oDate);
var day = oMonday.getDay();
var diff = oMonday.getDate() - day + (day === 0 ? -6 : 1);
oMonday.setDate(diff);
oMonday.setHours(0, 0, 0, 0);
```

### User ID Source
User ID should be obtained from SAP IAS via the BTP User API:
```javascript
fetch("/services/userapi/currentUser")
  .then(response => response.json())
  .then(userData => {
    var userId = userData.name || userData.email;
  });
```

---

## 🔒 Security Considerations

1. **Never hardcode URLs** - Always use Destination
2. **Never expose Client Secrets** - Managed by BTP
3. **Validate user permissions** - Backend should verify userId matches authenticated user
4. **CSRF Protection** - Handled by xs-app.json routing
5. **Rate Limiting** - Backend should implement rate limiting per user

---

## 📞 Support & Contact

For API issues or questions:
- Backend Team: Integration Suite Support
- Frontend Team: Fiori Development Team

**Last Updated:** February 2026
