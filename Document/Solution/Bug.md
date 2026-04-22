# Bug Report

## BUG-001: Backend does not validate that PostalCode is numeric
- **Status**: FIXED
- **Severity**: Medium
- **Component**: backend
- **Description**: The `PostalCode` field in `CreatePersonRequest` is validated only for length (exactly 5 characters) using `[StringLength(5, MinimumLength = 5)]`. There is no check that all characters are numeric digits. As a result, values like `"ABCDE"` or `"1A3B5"` pass backend validation and are persisted to the database.
- **Steps to Reproduce**:
  1. Send `POST http://localhost:5000/api/persons` with the following body:
     ```json
     {
       "firstName": "Test",
       "lastName": "User",
       "houseNumber": "1",
       "subDistrict": "Test",
       "district": "Test",
       "province": "Test",
       "postalCode": "ABCDE",
       "birthDate": "1990-01-01"
     }
     ```
  2. Observe the response.
- **Expected**: HTTP 400 with a validation error indicating that `postalCode` must consist of exactly 5 numeric digits.
- **Actual**: HTTP 201 — the record is created with `postalCode = "ABCDE"`.
- **Fix Suggestion**: Add a `[RegularExpression(@"^\d{5}$", ErrorMessage = "PostalCode must be exactly 5 numeric digits")]` data annotation to the `PostalCode` property in `CreatePersonRequest` (`back-end/DTOs/PersonDto.cs`). The `[StringLength]` attribute can then be removed as the regex already enforces the 5-character length.

---

## BUG-002: Table shows "ไม่มีข้อมูล" instead of an error message when the API call fails
- **Status**: FIXED
- **Severity**: Medium
- **Component**: frontend
- **Description**: `PersonTable.tsx` uses the `usePersons` hook but only checks `isLoading` and whether `persons` is empty. It does not check the `isError` state returned by React Query. When the API is unreachable or returns a 5xx error, `isLoading` becomes `false` and `persons` is `undefined`, causing the "ไม่มีข้อมูล" empty-state message to be displayed. This misleads the user into thinking the database is empty rather than that an error occurred.
- **Steps to Reproduce**:
  1. Stop the backend server.
  2. Open the frontend application in a browser.
  3. Observe the table body.
- **Expected**: An error message such as "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" is displayed so the user knows the data could not be loaded.
- **Actual**: The message "ไม่มีข้อมูล" is displayed, which implies the list is simply empty.
- **Fix Suggestion**: Destructure `isError` (and optionally `error`) from `usePersons()` in `PersonTable.tsx` and add an explicit error-state row before the empty-state check. Example:
  ```tsx
  const { data: persons, isLoading, isError } = usePersons()
  // ...
  {isError && (
    <tr>
      <td colSpan={5} className="px-4 py-6 text-center text-sm text-red-500">
        เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
      </td>
    </tr>
  )}
  {!isLoading && !isError && (!persons || persons.length === 0) && (
    <tr>
      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
        ไม่มีข้อมูล
      </td>
    </tr>
  )}
  ```
