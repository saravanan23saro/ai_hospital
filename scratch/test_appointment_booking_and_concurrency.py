import urllib.request
import json
import datetime
import uuid
import sys
import concurrent.futures

BASE_URL = "http://localhost:8180"

def request(path, method="GET", body=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            text = resp.read().decode("utf-8")
            return resp.status, json.loads(text) if text else {}
    except urllib.error.HTTPError as e:
        text = e.read().decode("utf-8")
        try:
            err_json = json.loads(text)
        except:
            err_json = {"raw": text}
        return e.code, err_json

def login(email, password):
    status, data = request("/api/v1/auth/login", "POST", {"email": email, "password": password})
    assert status == 200, f"Login failed for {email}: {data}"
    return data["accessToken"]

def register_and_onboard_patient(name):
    email = f"patient_{uuid.uuid4().hex[:8]}@careflow.local"
    status, reg = request("/api/v1/auth/register", "POST", {
        "fullName": name,
        "email": email,
        "password": "Password123!"
    })
    assert status == 201, f"Failed to register patient: {reg}"
    token = reg["accessToken"]

    phone = f"+9198{uuid.uuid4().int % 100000000:08d}"
    emergency = f"+9197{uuid.uuid4().int % 100000000:08d}"
    status, prof = request("/api/v1/patients/me", "PUT", {
        "fullName": name,
        "dateOfBirth": "1995-06-20",
        "gender": "FEMALE",
        "phone": phone,
        "address": "456 Wellness Blvd",
        "emergencyContact": emergency,
        "preferredLanguage": "English",
        "bloodGroup": "B_POSITIVE",
        "allergies": "None",
        "medicalConditions": "None"
    }, token=token)
    assert status in [200, 201], f"Onboarding failed: {prof}"
    return token, prof

def run_tests():
    print("=" * 70)
    print("RUNNING APPOINTMENT BOOKING, CONCURRENCY & CANCELLATION TEST SUITE")
    print("=" * 70)

    # Setup
    admin_token = login("admin@careflow.local", "CareFlowAdmin!2026")
    status, doctors = request("/api/v1/admin/doctors", "GET", token=admin_token)
    assert status == 200 and len(doctors) > 0, "No doctors available"
    doc = doctors[0]
    doctor_id = doc["doctorId"]
    department_id = doc["departmentId"]
    print(f"Using Doctor: {doc['fullName']} (ID: {doctor_id})")

    token_a, patient_a = register_and_onboard_patient("Patient Alpha")
    token_b, patient_b = register_and_onboard_patient("Patient Beta")
    token_c, patient_c = register_and_onboard_patient("Patient Gamma")
    print("Registered and onboarded Patient A, Patient B, and Patient C.")

    # Find a date with at least 3 open slots (skipping Sundays/off-days)
    test_date = None
    initial_slots = []
    for offset in range(1, 15):
        candidate = (datetime.date.today() + datetime.timedelta(days=offset)).isoformat()
        status, cand_slots = request(f"/api/v1/slots?departmentId={department_id}&doctorId={doctor_id}&date={candidate}", "GET", token=token_a)
        if status == 200 and len(cand_slots) >= 3:
            test_date = candidate
            initial_slots = cand_slots
            break

    assert test_date is not None, f"Could not find a date with available slots: {initial_slots}"
    print(f"Selected test date {test_date} with {len(initial_slots)} slots available.")

    slot_to_book = initial_slots[0]
    slot_to_race = initial_slots[1]
    slot_time = slot_to_book["startsAt"]
    print(f"Target slot for single booking: {slot_time}")

    # =========================================================================
    print("\n--- Test 1: Patient A books a slot successfully ---")
    # =========================================================================
    status, res_a = request("/api/v1/reservations", "POST", {
        "doctorId": doctor_id,
        "startsAt": slot_to_book["startsAt"]
    }, token=token_a)
    assert status == 201, f"Failed to reserve slot: {res_a}"
    res_id_a = res_a["reservationId"]

    status, appt_a = request("/api/v1/appointments", "POST", {
        "reservationId": res_id_a
    }, token=token_a)
    assert status == 201, f"Patient A booking failed: {appt_a}"
    assert appt_a["status"] == "CONFIRMED"
    appt_a_id = appt_a["appointmentId"]
    print(f"PASS: Patient A booked appointment {appt_a['appointmentNumber']} (Status: {appt_a['status']})")

    # =========================================================================
    print("\n--- Test 2: Patient B searches and no longer sees that slot ---")
    # =========================================================================
    status, slots_after_book = request(f"/api/v1/slots?departmentId={department_id}&doctorId={doctor_id}&date={test_date}", "GET", token=token_b)
    assert status == 200
    available_times = [s["startsAt"] for s in slots_after_book]
    assert slot_time not in available_times, f"Booked slot {slot_time} should NOT be in available slots: {available_times}"
    print(f"PASS: Slot {slot_time} is not in available slots for Patient B ({len(available_times)} remaining).")

    # Also test the new endpoint /api/v1/appointments/available-slots
    status, alias_slots = request(f"/api/v1/appointments/available-slots?doctorId={doctor_id}&date={test_date}", "GET", token=token_b)
    assert status == 200
    alias_times = [s["startsAt"] for s in alias_slots]
    assert slot_time not in alias_times, "Slot should not be in /api/v1/appointments/available-slots"
    print("PASS: /api/v1/appointments/available-slots also confirms slot is unavailable.")

    # =========================================================================
    print("\n--- Test 3: Patient B attempts to book the already-booked slot ---")
    # =========================================================================
    # Attempt via direct booking
    status, err_book = request("/api/v1/appointments", "POST", {
        "doctorId": doctor_id,
        "startsAt": slot_time
    }, token=token_b)
    assert status == 409, f"Expected 409 Conflict, got {status}: {err_book}"
    assert "no longer available" in str(err_book) or err_book.get("code") in ["SLOT_ALREADY_BOOKED", "INVALID_APPOINTMENT_STATE"], f"Unexpected error: {err_book}"
    print(f"PASS: Direct booking attempt rejected with HTTP 409: {err_book.get('message')}")

    # Attempt via reservation
    status, err_res = request("/api/v1/reservations", "POST", {
        "doctorId": doctor_id,
        "startsAt": slot_time
    }, token=token_b)
    assert status == 409, f"Expected 409 Conflict for reservation, got {status}: {err_res}"
    print(f"PASS: Reservation attempt rejected with HTTP 409: {err_res.get('message')}")

    # =========================================================================
    print("\n--- Test 4: Concurrency test - Two patients book the same slot simultaneously ---")
    # =========================================================================
    race_time = slot_to_race["startsAt"]
    print(f"Racing two simultaneous bookings for slot: {race_time}")

    def attempt_booking(tok):
        return request("/api/v1/appointments", "POST", {
            "doctorId": doctor_id,
            "startsAt": race_time
        }, token=tok)

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(attempt_booking, token_b)
        f2 = executor.submit(attempt_booking, token_c)
        r1_status, r1_body = f1.result()
        r2_status, r2_body = f2.result()

    statuses = [r1_status, r2_status]
    print(f"Concurrency results: Status 1 = {r1_status}, Status 2 = {r2_status}")
    assert 201 in statuses, f"At least one booking must succeed. Got statuses: {statuses}"
    assert 409 in statuses, f"The conflicting booking must receive 409 Conflict. Got statuses: {statuses}"
    print("PASS: Concurrency test succeeded! Exactly one request received 201 Created and the other received 409 Conflict.")

    # =========================================================================
    print("\n--- Test 5: Patient A cancels the appointment ---")
    # =========================================================================
    status, cancel_resp = request(f"/api/v1/appointments/{appt_a_id}/cancel", "PATCH", {
        "reason": "Family schedule conflict"
    }, token=token_a)
    assert status == 200, f"Cancellation failed: {cancel_resp}"
    assert cancel_resp["status"] == "CANCELLED"
    assert cancel_resp["cancellationReason"] == "Family schedule conflict"
    print(f"PASS: Appointment cancelled successfully. Status: {cancel_resp['status']}, Reason: {cancel_resp['cancellationReason']}")

    # =========================================================================
    print("\n--- Test 6: Cancelled slot becomes available to Patient B immediately ---")
    # =========================================================================
    status, slots_after_cancel = request(f"/api/v1/slots?departmentId={department_id}&doctorId={doctor_id}&date={test_date}", "GET", token=token_b)
    assert status == 200
    available_times_after_cancel = [s["startsAt"] for s in slots_after_cancel]
    assert slot_time in available_times_after_cancel, f"Released slot {slot_time} MUST be available again! Available: {available_times_after_cancel}"
    print(f"PASS: Released slot {slot_time} is immediately available again without application restart.")

    # =========================================================================
    print("\n--- Test 7: Patient B successfully books the released slot ---")
    # =========================================================================
    status, appt_b = request("/api/v1/appointments", "POST", {
        "doctorId": doctor_id,
        "startsAt": slot_time
    }, token=token_b)
    assert status == 201, f"Patient B failed to book released slot: {appt_b}"
    assert appt_b["status"] == "CONFIRMED"
    appt_b_id = appt_b["appointmentId"]
    print(f"PASS: Patient B booked the released slot! Appointment number: {appt_b['appointmentNumber']}")

    # =========================================================================
    print("\n--- Test 8: Patient A cannot cancel Patient B's appointment without authorization ---")
    # =========================================================================
    status, unauthorized_cancel = request(f"/api/v1/appointments/{appt_b_id}/cancel", "PATCH", {
        "reason": "Malicious cancellation attempt"
    }, token=token_a)
    assert status in [403, 404], f"Expected 403 or 404 for unauthorized cancellation, got {status}: {unauthorized_cancel}"
    print(f"PASS: Unauthorized cancellation rejected with HTTP {status}: {unauthorized_cancel.get('message')}")

    # =========================================================================
    print("\n--- Test 9: Cancelled appointment remains in appointment history ---")
    # =========================================================================
    status, patient_a_appts = request("/api/v1/patients/me/appointments", "GET", token=token_a)
    assert status == 200
    matching = [a for a in patient_a_appts if a["appointmentId"] == appt_a_id]
    assert len(matching) == 1, "Cancelled appointment must remain in appointment history"
    assert matching[0]["status"] == "CANCELLED"
    assert matching[0]["cancellationReason"] == "Family schedule conflict"
    print(f"PASS: Cancelled appointment remains in history with status 'CANCELLED' and preserved reason.")

    # =========================================================================
    print("\n--- Test 10: Cache invalidation and availability refresh work correctly ---")
    # =========================================================================
    # Slot was booked by Patient B in Test 7; verify cache or DB confirms it is now unavailable
    status, slots_recheck = request(f"/api/v1/slots?departmentId={department_id}&doctorId={doctor_id}&date={test_date}", "GET", token=token_c)
    assert status == 200
    times_recheck = [s["startsAt"] for s in slots_recheck]
    assert slot_time not in times_recheck, f"Slot {slot_time} should not be available after Patient B booked it"
    print("PASS: Cache invalidation verified; slot booked by Patient B is not offered in fresh search.")

    # =========================================================================
    print("\n--- Test 11: Past slots cannot be booked ---")
    # =========================================================================
    past_time = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2)).isoformat()
    status, past_err = request("/api/v1/appointments", "POST", {
        "doctorId": doctor_id,
        "startsAt": past_time
    }, token=token_c)
    assert status in [400, 409], f"Past slot booking should be rejected with 400 or 409, got {status}: {past_err}"
    print(f"PASS: Past slot booking correctly rejected with HTTP {status}: {past_err.get('message')}")

    # =========================================================================
    print("\n--- Test 12: Existing doctor appointments and general appointments endpoint ---")
    # =========================================================================
    status, general_appts = request("/api/v1/appointments", "GET", token=token_b)
    assert status == 200 and len(general_appts) > 0, f"Expected appointments for Patient B: {general_appts}"
    assert any(a["appointmentId"] == appt_b_id for a in general_appts)
    print(f"PASS: GET /api/v1/appointments returns appointments according to user permissions ({len(general_appts)} items).")

    print("\n" + "=" * 70)
    print("ALL 12 APPOINTMENT BOOKING & CANCELLATION SCENARIOS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
