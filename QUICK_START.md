# Quick Start - Using the Backend

## TL;DR - Import and Use

```typescript
// Import any server function
import { recordAttendance, getFeeSummary, issueBook } from "~/server";

// Call with parameters
const response = await recordAttendance({
  sessionDate: "2025-05-22",
  grade: "10",
  section: "A",
  studentId: "uuid-here",
  studentName: "John Doe",
  status: "present",
  markedByName: "Ms. Teacher",
  markedById: "uuid-here",
  userRole: "teacher",
});

// Check response
if (response.success) {
  console.log("Success:", response.data);
  toast.success("Attendance recorded");
} else {
  console.error("Error:", response.error);
  toast.error(response.error);
}
```

---

## Copy-Paste Examples by Module

### 1. Record Attendance

```typescript
const response = await recordAttendance({
  sessionDate: new Date().toISOString().split("T")[0],
  grade: "10",
  section: "A",
  studentId: "student-uuid",
  studentName: "Student Name",
  status: "present", // "present" | "absent" | "late" | "leave"
  markedByName: user.full_name,
  markedById: user.id,
  userRole: user.role, // must be "admin" or "teacher"
});

if (response.success) {
  console.log("Recorded:", response.data);
} else {
  console.error(response.error);
}
```

### 2. Get Student Fees

```typescript
const response = await getFeeSummary({
  studentId: "student-uuid",
});

if (response.success) {
  const { totalAmount, totalPaid, totalDue, percentagePaid } = response.data;
  console.log(`Paid: ₹${totalPaid}/${totalAmount} (${percentagePaid}%)`);
} else {
  console.error(response.error);
}
```

### 3. Record Payment

```typescript
const response = await recordPayment({
  studentId: "student-uuid",
  feeRecordId: "fee-record-uuid",
  amount: 5000,
  method: "bank_transfer", // "bank_transfer" | "card" | "cash" | "upi"
  receiptNo: "RECEIPT123",
  gatewayRef: "gateway-ref",
  paidBy: "Parent Name",
  userRole: user.role,
});

if (response.success) {
  console.log("Payment recorded and fee status auto-updated");
}
```

### 4. Issue Book

```typescript
const response = await issueBook({
  bookId: "book-uuid",
  studentId: "student-uuid",
  studentName: "Student Name",
  dueDays: 14,
  userRole: user.role, // must be "admin" or "teacher"
});

if (response.success) {
  const { book_title, due_date } = response.data;
  console.log(`${book_title} due on ${due_date}`);
}
```

### 5. Return Book

```typescript
const response = await returnBook({
  circulationId: "circulation-uuid",
  userRole: user.role,
});

if (response.success) {
  console.log("Book returned, inventory updated");
}
```

### 6. Get Student Books

```typescript
const response = await getStudentBooks({
  studentId: "student-uuid",
});

if (response.success) {
  const { issued, overdue, returned } = response.data;
  console.log(`Issued: ${issued.length}, Overdue: ${overdue.length}`);
}
```

### 7. Create Hostel Complaint

```typescript
const response = await createHostelComplaint({
  studentId: user.id,
  studentName: user.full_name,
  room: "A-101",
  category: "plumbing", // "plumbing" | "electrical" | "maintenance" | "cleaning" | "security" | "other"
  description: "Tap is leaking continuously",
  userRole: user.role,
});

if (response.success) {
  console.log("Complaint registered with ID:", response.data.id);
}
```

### 8. Get Hostel Statistics

```typescript
const response = await getHostelStats({
  userRole: user.role,
});

if (response.success) {
  const { occupancyPercentage, availableSpaces } = response.data;
  console.log(`Occupancy: ${occupancyPercentage}%, Available: ${availableSpaces}`);
}
```

### 9. Create Leave Request

```typescript
const response = await createLeaveRequest({
  staffId: user.id,
  staffName: user.full_name,
  leaveType: "sick", // "sick" | "casual" | "earned" | "maternity" | "unpaid" | "other"
  startDate: "2025-06-01",
  endDate: "2025-06-03",
  reason: "Medical appointment",
  userRole: user.role,
});

if (response.success) {
  console.log("Leave request submitted, awaiting approval");
}
```

### 10. Get Pending Leave Requests (Admin)

```typescript
const response = await getPendingLeaveRequests({
  userRole: user.role, // must be "admin"
});

if (response.success) {
  const { count, requests } = response.data;
  requests.forEach((req) => {
    console.log(`${req.staff_name}: ${req.start_date} to ${req.end_date}`);
  });
}
```

### 11. Approve Leave Request (Admin)

```typescript
const response = await approveLeaveRequest({
  requestId: "request-uuid",
  approvedBy: user.full_name,
  userRole: user.role, // must be "admin"
});

if (response.success) {
  console.log("Leave approved");
}
```

### 12. Get Transport Routes

```typescript
const response = await getTransportRoutes();

if (response.success) {
  response.data.forEach((route) => {
    console.log(`Route: ${route.route_no}, Bus: ${route.bus_no}, Driver: ${route.driver_name}`);
  });
}
```

### 13. Update GPS Location (Real-time Tracking)

```typescript
const response = await updateGPSLocation({
  routeId: "route-uuid",
  latitude: 19.076,
  longitude: 72.877,
  tripActive: true,
  userRole: user.role,
});

if (response.success) {
  console.log("Location updated at", response.data.last_location_at);
}
```

### 14. Get Library Statistics

```typescript
const response = await getLibraryStats({
  userRole: user.role,
});

if (response.success) {
  const { totalCopies, availableCopies, circulationPercentage } = response.data;
  console.log(
    `${availableCopies}/${totalCopies} available (${circulationPercentage}% in circulation)`,
  );
}
```

### 15. Record Grade

```typescript
const response = await recordGrade({
  studentId: "student-uuid",
  studentName: "Student Name",
  subject: "Mathematics",
  grade: "10",
  section: "A",
  score: 88,
  maxScore: 100,
  term: "Term 1",
  userRole: user.role, // must be "admin" or "teacher"
});

if (response.success) {
  console.log("Grade recorded");
}
```

### 16. Get Student Grades

```typescript
const response = await getStudentGrades({
  studentId: "student-uuid",
});

if (response.success) {
  response.data.forEach((grade) => {
    console.log(`${grade.subject} (${grade.term}): ${grade.score}/${grade.max_score}`);
  });
}
```

### 17. Get Student Performance

```typescript
const response = await getStudentPerformance({
  studentId: "student-uuid",
  term: "Term 1",
});

if (response.success) {
  const { totalSubjects, averageScore } = response.data;
  console.log(`${totalSubjects} subjects, Average: ${averageScore}`);
}
```

---

## Using with React Query

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { getFeeSummary, recordPayment } from "~/server";

export function StudentFees() {
  // Query (read data)
  const feesQuery = useQuery({
    queryKey: ["fees", studentId],
    queryFn: () => getFeeSummary({ studentId }),
  });

  // Mutation (write data)
  const paymentMutation = useMutation({
    mutationFn: (data) => recordPayment(data),
    onSuccess: () => {
      // Refetch fees after successful payment
      feesQuery.refetch();
      toast.success("Payment recorded");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div>
      {feesQuery.isLoading && <p>Loading...</p>}
      {feesQuery.isError && <p>Error: {feesQuery.error.message}</p>}
      {feesQuery.data && (
        <>
          <p>Total: ₹{feesQuery.data.totalAmount}</p>
          <p>Paid: ₹{feesQuery.data.totalPaid}</p>
          <button
            onClick={() => paymentMutation.mutate({...})}
            disabled={paymentMutation.isPending}
          >
            {paymentMutation.isPending ? "Recording..." : "Record Payment"}
          </button>
        </>
      )}
    </div>
  );
}
```

---

## Status Codes & Errors

| Code | Meaning          | Example                                                      |
| ---- | ---------------- | ------------------------------------------------------------ |
| 200  | Success (GET)    | Fetched data                                                 |
| 201  | Created (POST)   | New record inserted                                          |
| 400  | Validation error | Invalid input                                                |
| 403  | Unauthorized     | Student trying to record attendance                          |
| 404  | Not found        | Resource doesn't exist                                       |
| 409  | Conflict         | Duplicate entry (e.g., attendance for same student same day) |
| 500  | Server error     | Database connection failed                                   |

---

## Common Patterns

### Pattern 1: Fetch and Display

```typescript
const query = useQuery({
  queryKey: ["data"],
  queryFn: async () => {
    const res = await fetchFunction();
    if (!res.success) throw new Error(res.error);
    return res.data;
  },
});

if (query.isPending) return <Loading />;
if (query.isError) return <Error message={query.error.message} />;
return <Display data={query.data} />;
```

### Pattern 2: Form Submission

```typescript
const mutation = useMutation({
  mutationFn: async (formData) => {
    const res = await submitFunction(formData);
    if (!res.success) throw new Error(res.error);
    return res.data;
  },
  onSuccess: () => {
    toast.success("Saved successfully");
    form.reset();
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

return (
  <form onSubmit={(e) => {
    e.preventDefault();
    mutation.mutate(getFormData());
  }}>
    {/* form fields */}
    <button disabled={mutation.isPending}>
      {mutation.isPending ? "Saving..." : "Save"}
    </button>
  </form>
);
```

### Pattern 3: Paginated List

```typescript
const [page, setPage] = useState(1);
const query = useQuery({
  queryKey: ["list", page],
  queryFn: () => fetchList({ page, limit: 10 }),
});

return (
  <div>
    {query.data?.data.map(item => <Item key={item.id} {...item} />)}
    <Pagination
      current={page}
      total={query.data?.pagination.pages}
      onChange={setPage}
    />
  </div>
);
```

---

## Need More?

See `BACKEND_IMPLEMENTATION.md` for:

- Detailed error handling
- RBAC matrix
- Full code examples
- Architecture overview
