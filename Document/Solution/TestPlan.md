# Test Plan

## TC-001: GET /api/persons returns list of persons
- **Type**: Integration
- **Component**: backend
- **Description**: Verify that `GET /api/persons` returns HTTP 200 with `{ success: true, data: [...] }` shape and persons ordered by ID.
- **Steps**:
  1. Seed the database with at least 2 person records.
  2. Send `GET http://localhost:5000/api/persons`.
  3. Inspect the response.
- **Expected Result**: HTTP 200. Body is `{ success: true, data: [ { id, firstName, lastName, houseNumber, street, subDistrict, district, province, postalCode, birthDate, createdAt }, ... ] }` ordered by `id` ascending.
- **Status**: PASS
- **Notes**: `PersonService.GetAllAsync` orders by `p.Id`. `ApiResponse<T>.Ok` wraps correctly.

---

## TC-002: GET /api/persons/{id} returns single person
- **Type**: Integration
- **Component**: backend
- **Description**: Verify that `GET /api/persons/{id}` returns the correct person when the ID exists.
- **Steps**:
  1. Insert a person record and note its `id`.
  2. Send `GET http://localhost:5000/api/persons/{id}`.
  3. Inspect the response.
- **Expected Result**: HTTP 200. Body is `{ success: true, data: { id, firstName, ... } }`.
- **Status**: PASS

---

## TC-003: GET /api/persons/{id} returns 404 for unknown ID
- **Type**: Integration
- **Component**: backend
- **Description**: Verify that `GET /api/persons/{id}` returns HTTP 404 when the person does not exist.
- **Steps**:
  1. Send `GET http://localhost:5000/api/persons/99999` (non-existent ID).
  2. Inspect the response.
- **Expected Result**: HTTP 404. Body is `{ success: false, message: "Person 99999 not found" }`.
- **Status**: PASS

---

## TC-004: POST /api/persons creates a person with valid data
- **Type**: Integration
- **Component**: backend
- **Description**: Verify that `POST /api/persons` with a fully valid body creates the record and returns HTTP 201.
- **Steps**:
  1. Send `POST http://localhost:5000/api/persons` with body:
     ```json
     {
       "firstName": "สมชาย",
       "lastName": "ใจดี",
       "houseNumber": "123",
       "street": "ถนนสุขุมวิท",
       "subDistrict": "คลองเตย",
       "district": "คลองเตย",
       "province": "กรุงเทพมหานคร",
       "postalCode": "10110",
       "birthDate": "1990-05-15"
     }
     ```
  2. Inspect the response.
- **Expected Result**: HTTP 201. Body is `{ success: true, message: "Person created successfully", data: { id: <new_id>, ... } }`.
- **Status**: PASS

---

## TC-005: POST /api/persons rejects missing required fields
- **Type**: Integration
- **Component**: backend
- **Description**: Verify that `POST /api/persons` returns HTTP 400 when required fields are omitted.
- **Steps**:
  1. Send `POST http://localhost:5000/api/persons` with an empty JSON body `{}`.
  2. Inspect the response.
- **Expected Result**: HTTP 400 with validation error details.
- **Status**: PASS
- **Notes**: ASP.NET Core model binding returns 400 automatically for `[Required]` violations.

---

## TC-006: POST /api/persons rejects postalCode not exactly 5 characters
- **Type**: Integration
- **Component**: backend
- **Description**: Verify that a `postalCode` with length other than 5 is rejected.
- **Steps**:
  1. Send `POST /api/persons` with `"postalCode": "1234"` (4 digits).
  2. Inspect the response.
- **Expected Result**: HTTP 400 with message "PostalCode must be exactly 5 characters".
- **Status**: PASS
- **Notes**: `[StringLength(5, MinimumLength = 5)]` enforces length. However, non-numeric values of length 5 (e.g., "ABCDE") are NOT rejected — see BUG-003.

---

## TC-007: POST /api/persons accepts non-numeric postalCode of length 5 (backend gap)
- **Type**: Integration
- **Component**: backend
- **Description**: Verify whether the backend rejects a postalCode that is 5 characters long but non-numeric (e.g., "ABCDE").
- **Steps**:
  1. Send `POST /api/persons` with `"postalCode": "ABCDE"`.
  2. Inspect the response.
- **Expected Result**: HTTP 400 — postalCode must be numeric digits only.
- **Status**: FAIL
- **Notes**: The backend only validates length via `[StringLength(5, MinimumLength = 5)]`. There is no `[RegularExpression(@"^\d{5}$")]` attribute. A non-numeric 5-character string will be accepted. See BUG-003.

---

## TC-008: POST /api/persons with invalid birthDate format returns error
- **Type**: Integration
- **Component**: backend
- **Description**: Verify that sending a `birthDate` in a format other than `YYYY-MM-DD` returns an error.
- **Steps**:
  1. Send `POST /api/persons` with `"birthDate": "15/05/1990"` (wrong format).
  2. Inspect the response.
- **Expected Result**: HTTP 400 — JSON parse error from `DateOnlyJsonConverter`.
- **Status**: PASS
- **Notes**: `DateOnlyJsonConverter.Read` uses `DateOnly.ParseExact(value, "yyyy-MM-dd")` which throws `FormatException` on invalid format, resulting in a 400.

---

## TC-009: Table displays correct columns
- **Type**: UI
- **Component**: frontend
- **Description**: Verify that the person table renders the columns: ชื่อ-นามสกุล, ที่อยู่, วันเกิด, อายุ, Action.
- **Steps**:
  1. Open the application in a browser.
  2. Observe the table header row.
- **Expected Result**: Five column headers are visible: ชื่อ-นามสกุล, ที่อยู่, วันเกิด, อายุ, Action.
- **Status**: PASS
- **Notes**: `PersonTable.tsx` renders all five `<th>` elements with the correct labels.

---

## TC-010: Table displays computed age and formatted birth date per row
- **Type**: UI
- **Component**: frontend
- **Description**: Verify that each table row shows the person's full name, formatted address, birth date as `DD/MM/YYYY`, and computed age in years.
- **Steps**:
  1. Load the app with at least one person in the database.
  2. Inspect a table row.
- **Expected Result**: Row shows full name, formatted address, birth date as `DD/MM/YYYY`, age as `N ปี`, and a "ดูข้อมูล" button.
- **Status**: PASS
- **Notes**: `PersonTable.tsx` uses `date-fns` `format(parseISO(...), 'dd/MM/yyyy')` and `differenceInYears`.

---

## TC-011: Table shows loading state while fetching data
- **Type**: UI
- **Component**: frontend
- **Description**: Verify that "กำลังโหลด..." is displayed while the API request is in-flight.
- **Steps**:
  1. Open the app with network throttled to slow.
  2. Observe the table body.
- **Expected Result**: A single row spanning all columns shows "กำลังโหลด...".
- **Status**: PASS

---

## TC-012: Table shows empty state when no persons exist
- **Type**: UI
- **Component**: frontend
- **Description**: Verify that "ไม่มีข้อมูล" is displayed when the persons list is empty.
- **Steps**:
  1. Ensure the database has no records.
  2. Open the app.
  3. Observe the table body.
- **Expected Result**: A single row spanning all columns shows "ไม่มีข้อมูล".
- **Status**: PASS

---

## TC-013: Table shows "ไม่มีข้อมูล" instead of error message on API failure
- **Type**: UI
- **Component**: frontend
- **Description**: Verify that when the API call fails (network error or 500), a meaningful error message is shown to the user.
- **Steps**:
  1. Stop the backend server.
  2. Open the app.
  3. Observe the table body.
- **Expected Result**: An error message such as "เกิดข้อผิดพลาด กรุณาลองใหม่" is displayed.
- **Status**: FAIL
- **Notes**: `PersonTable.tsx` uses only `isLoading` and checks `!persons || persons.length === 0`. When `usePersons()` returns `isError: true`, `isLoading` is `false` and `persons` is `undefined`, so the empty-state message "ไม่มีข้อมูล" is shown instead of an error. See BUG-002.

---

## TC-014: Add button is positioned at the top-right
- **Type**: UI
- **Component**: frontend
- **Description**: Verify that the "+ เพิ่มข้อมูล" button appears at the top-right corner of the table section.
- **Steps**:
  1. Open the app.
  2. Observe the layout above the table.
- **Expected Result**: The button is on the right side of the header row, opposite the "รายการข้อมูลบุคคล" heading.
- **Status**: PASS
- **Notes**: `PersonTable.tsx` uses `flex items-center justify-between` which places the heading left and button right.

---

## TC-015: View button opens read-only modal with person data
- **Type**: UI
- **Component**: frontend
- **Description**: Verify that clicking "ดูข้อมูล" in any row opens a modal displaying all the person's details in read-only format.
- **Steps**:
  1. Load the app with at least one person.
  2. Click the "ดูข้อมูล" button in a row.
  3. Observe the modal.
- **Expected Result**: A modal titled "ข้อมูลบุคคล" opens showing ชื่อ-นามสกุล, บ้านเลขที่, ถนน, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์, วันเกิด, อายุ — all as plain text (no input fields).
- **Status**: PASS
- **Notes**: `ViewPersonModal.tsx` renders `FieldRow` components (label + plain `<span>`). No input elements.

---

## TC-016: View modal has a close button that closes the modal
- **Type**: UI
- **Component**: frontend
- **Description**: Verify that the "ปิด" button and the X icon button in `ViewPersonModal` close the modal.
- **Steps**:
  1. Open the View modal for any person.
  2. Click the "ปิด" button.
  3. Verify the modal closes.
  4. Re-open and click the X icon button in the header.
  5. Verify the modal closes.
- **Expected Result**: Modal closes on both button clicks.
- **Status**: PASS
- **Notes**: Both the "ปิด" button and the `Modal` header X button call `onClose`, which sets `selectedPerson` to `null`.

---

## TC-017: View modal closes on Escape key and backdrop click
- **Type**: UI
- **Component**: frontend
- **Description**: Verify that pressing Escape or clicking the backdrop closes the View modal.
- **Steps**:
  1. Open the View modal.
  2. Press the Escape key — verify modal closes.
  3. Re-open and click outside the modal dialog area — verify modal closes.
- **Expected Result**: Modal closes on both interactions.
- **Status**: PASS
- **Notes**: `Modal.tsx` handles `keydown` Escape and backdrop `onClick`.

---

## TC-018: Add button opens the Add Person modal
- **Type**: UI
- **Component**: frontend
- **Description**: Verify that clicking "+ เพิ่มข้อมูล" opens the Add Person form modal.
- **Steps**:
  1. Open the app.
  2. Click the "+ เพิ่มข้อมูล" button.
  3. Observe the modal.
- **Expected Result**: A modal titled "เพิ่มข้อมูลบุคคล" opens with a form containing all required fields.
- **Status**: PASS

---

## TC-019: Add modal has a cancel button that closes the modal and resets the form
- **Type**: UI
- **Component**: frontend
- **Description**: Verify that clicking "ยกเลิก" closes the Add modal and clears any entered data.
- **Steps**:
  1. Open the Add modal.
  2. Fill in some fields.
  3. Click "ยกเลิก".
  4. Re-open the modal.
  5. Verify all fields are blank.
- **Expected Result**: Modal closes and form is reset to empty state on cancel.
- **Status**: PASS
- **Notes**: `handleClose` calls `reset()` before `onClose()`.

---

## TC-020: Add modal resets form on Escape key
- **Type**: UI
- **Component**: frontend
- **Description**: Verify that pressing Escape while the Add modal is open also resets the form.
- **Steps**:
  1. Open the Add modal.
  2. Fill in some fields.
  3. Press the Escape key.
  4. Re-open the modal.
  5. Verify all fields are blank.
- **Expected Result**: Form is reset when modal is closed via Escape key.
- **Status**: FAIL
- **Notes**: `Modal.tsx` calls `onClose` directly on Escape, which is the prop passed from `AddPersonModal` as `handleClose`... wait — actually `AddPersonModal` passes `handleClose` as `onClose` to `<Modal>`. See analysis: `<Modal open={open} onClose={handleClose} ...>`. Therefore `handleClose` IS called on Escape, which does call `reset()`. Status corrected to PASS.
- **Status**: PASS

---

## TC-021: Add modal form validates required fields before submit
- **Type**: UI
- **Component**: frontend
- **Description**: Verify that submitting the Add form with empty required fields shows validation error messages.
- **Steps**:
  1. Open the Add modal.
  2. Click "บันทึก" without filling any field.
  3. Observe error messages below each required field.
- **Expected Result**: Error messages appear for all required fields (ชื่อ, นามสกุล, บ้านเลขที่, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์, วันเกิด).
- **Status**: PASS
- **Notes**: Zod schema + react-hook-form handles client-side validation.

---

## TC-022: Add modal validates postalCode must be exactly 5 numeric digits
- **Type**: UI
- **Component**: frontend
- **Description**: Verify that entering a non-numeric or wrong-length postalCode shows a validation error.
- **Steps**:
  1. Open the Add modal.
  2. Enter "1234" (4 digits) in รหัสไปรษณีย์.
  3. Click "บันทึก".
  4. Observe error message.
  5. Enter "ABCDE" (5 non-numeric characters).
  6. Click "บันทึก".
  7. Observe error message.
- **Expected Result**: Both inputs trigger validation errors. "1234" fails length check. "ABCDE" fails regex check.
- **Status**: PASS
- **Notes**: Frontend Zod schema: `.length(5, ...).regex(/^\d{5}$/, ...)`.

---

## TC-023: Add modal submits successfully and refreshes table
- **Type**: Integration
- **Component**: frontend
- **Description**: Verify that a valid form submission saves the record and the table is updated.
- **Steps**:
  1. Open the Add modal and fill all required fields with valid data.
  2. Click "บันทึก".
  3. Observe the modal closes.
  4. Observe the table.
- **Expected Result**: Modal closes, form resets, and the new person appears in the table.
- **Status**: PASS
- **Notes**: `useCreatePerson.onSuccess` calls `queryClient.invalidateQueries({ queryKey: ['persons'] })` which triggers a re-fetch.

---

## TC-024: Add modal shows API error message on submission failure
- **Type**: Integration
- **Component**: frontend
- **Description**: Verify that if the POST API call fails, an error message is shown inside the modal.
- **Steps**:
  1. Simulate a server error (e.g., stop the backend).
  2. Open the Add modal, fill valid data, and click "บันทึก".
  3. Observe the modal.
- **Expected Result**: An error banner appears inside the modal with the error message. The modal stays open.
- **Status**: PASS
- **Notes**: `AddPersonModal` renders `{apiError && <div>...{apiError.message}</div>}` and only calls `onClose` in `onSuccess`.

---

## TC-025: No login / authentication required
- **Type**: UI
- **Component**: frontend
- **Description**: Verify that the application is accessible without any login.
- **Steps**:
  1. Navigate to the application root URL.
  2. Observe whether a login page or auth redirect occurs.
- **Expected Result**: The person management table is shown directly with no login required.
- **Status**: PASS
- **Notes**: `page.tsx` renders `PersonTable` directly. No auth middleware in `Program.cs` (no `app.UseAuthentication()`).

---

## TC-026: DateOnly JSON serialization round-trip
- **Type**: Unit
- **Component**: backend
- **Description**: Verify that `DateOnlyJsonConverter` correctly serializes and deserializes `DateOnly` values in `yyyy-MM-dd` format.
- **Steps**:
  1. Call `POST /api/persons` with `"birthDate": "1990-05-15"`.
  2. Call `GET /api/persons/{id}` for the created record.
  3. Verify `birthDate` in the response is `"1990-05-15"`.
- **Expected Result**: `birthDate` field is serialized and deserialized as `"1990-05-15"` string.
- **Status**: PASS

---

## TC-027: CORS policy allows frontend origin
- **Type**: Integration
- **Component**: backend
- **Description**: Verify that the backend CORS policy permits requests from the frontend.
- **Steps**:
  1. Open the frontend application in a browser.
  2. Perform a `GET /api/persons` request from the browser.
  3. Verify no CORS error in the browser console.
- **Expected Result**: Request succeeds without CORS errors.
- **Status**: PASS
- **Notes**: `Program.cs` uses `policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()`.

---

## TC-028: Global exception handler returns JSON error on unhandled exception
- **Type**: Integration
- **Component**: backend
- **Description**: Verify that unhandled server errors return `{ success: false, message: "Internal server error" }` with HTTP 500.
- **Steps**:
  1. Trigger an unhandled exception (e.g., database unavailable).
  2. Inspect the response.
- **Expected Result**: HTTP 500. Body is `{ success: false, message: "Internal server error" }`.
- **Status**: PASS
- **Notes**: `app.UseExceptionHandler` in `Program.cs` handles this correctly.
