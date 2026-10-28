import urllib.request
import json
import datetime
import uuid
import sys

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

def main():
    print("--- 1. Authenticate users ---")
    admin_token = login("admin@careflow.local", "CareFlowAdmin!2026")
    print("Admin logged in successfully.")

    # Get seed doctor from admin list
    status, doctors_list = request("/api/v1/admin/doctors", "GET", token=admin_token)
    assert status == 200 and len(doctors_list) > 0, f"No doctors found: {doctors_list}"
    doc = doctors_list[0]
    doctor_email = doc["email"]
    doctor_user_id = doc["userId"]
    doctor_id = doc["doctorId"]
    department_id = doc["departmentId"]
    print(f"Target doctor: {doctor_email} (ID: {doctor_id}, UserID: {doctor_user_id})")

    # Reset doctor password using admin API
    status, resp = request(f"/api/v1/admin/users/{doctor_user_id}/reset-password", "POST", {"newPassword": "CareFlowDoctor!2026"}, token=admin_token)
    assert status == 200, f"Failed to reset doctor password: {resp}"
    print("Doctor password reset successfully.")

    # Doctor login
    doctor_token = login(doctor_email, "CareFlowDoctor!2026")
    print("Doctor logged in successfully.")

    # Register/login a test patient
    patient_email = f"reschedule_patient_{uuid.uuid4().hex[:6]}@careflow.local"
    status, reg_data = request("/api/v1/auth/register", "POST", {"fullName": "Test Reschedule Patient", "email": patient_email, "password": "PatientPassword123!"})
    assert status == 201, f"Register failed: {reg_data}"
    patient_token = reg_data["accessToken"]
    print(f"Test patient created: {patient_email}")

    phone = f"+9198{uuid.uuid4().int % 100000000:08d}"
    emergency = f"+9197{uuid.uuid4().int % 100000000:08d}"
    status, _ = request("/api/v1/patients/me", "PUT", {
        "fullName": "Test Reschedule Patient",
        "dateOfBirth": "1992-05-15",
        "gender": "MALE",
        "phone": phone,
        "address": "123 Medical Way",
        "emergencyContact": emergency,
        "preferredLanguage": "English",
        "bloodGroup": "O_POSITIVE",
        "allergies": "None",
        "medicalConditions": "None"
    }, token=patient_token)
    assert status in [200, 201], f"Onboarding failed: {_}"
    print("Patient onboarding completed.")

    # Find open slots for the doctor for tomorrow and day after
    tomorrow = (datetime.date.today() + datetime.timedelta(days=2)).isoformat()
    day_after = (datetime.date.today() + datetime.timedelta(days=3)).isoformat()

    status, slots_tomorrow = request(f"/api/v1/slots?doctorId={doctor_id}&date={tomorrow}", "GET", token=patient_token)
    assert status == 200 and len(slots_tomorrow) >= 2, f"Expected available slots tomorrow: {slots_tomorrow}"
    print(f"Found {len(slots_tomorrow)} slots for {tomorrow} using doctorId directly.")

    slot_1 = slots_tomorrow[0]
    slot_2 = slots_tomorrow[1]

    # Reserve slot_1 and book initial appointment
    status, res_1 = request("/api/v1/reservations", "POST", {
        "doctorId": doctor_id,
        "startsAt": slot_1["startsAt"]
    }, token=patient_token)
    assert status == 201, f"Failed to reserve slot: {res_1}"
    reservation_id = res_1["reservationId"]

    status, appt_1 = request("/api/v1/appointments", "POST", {"reservationId": reservation_id}, token=patient_token)
    assert status == 201, f"Failed to book appointment: {appt_1}"
    appt_1_id = appt_1["appointmentId"]
    print(f"Initial appointment booked: {appt_1['appointmentNumber']}, Status: {appt_1['status']}")

    print("\n--- 2. Test Case A: Patient reschedules when doctor/patient is unavailable ---")
    status, resched_1 = request(f"/api/v1/appointments/{appt_1_id}/reschedule", "POST", {
        "doctorId": doctor_id,
        "startsAt": slot_2["startsAt"]
    }, token=patient_token)
    assert status == 200, f"Reschedule failed: {resched_1}"
    assert resched_1["status"] == "CONFIRMED", f"Expected CONFIRMED status, got {resched_1['status']}"
    assert resched_1["rescheduledFromAppointmentId"] == appt_1_id, "Missing rescheduledFrom linkage"
    appt_2_id = resched_1["appointmentId"]
    print(f"Patient rescheduled successfully! New Appointment ID: {appt_2_id}, Status: {resched_1['status']}")

    # Verify old appointment is marked RESCHEDULED
    status, patient_appts = request("/api/v1/patients/me/appointments", "GET", token=patient_token)
    old_appt = next(a for a in patient_appts if a["appointmentId"] == appt_1_id)
    assert old_appt["status"] == "RESCHEDULED", f"Old appointment should be RESCHEDULED, got {old_appt['status']}"
    assert old_appt["rescheduledToAppointmentId"] == appt_2_id, "Missing rescheduledTo linkage"
    print(f"Verified original appointment {appt_1_id} status is RESCHEDULED.")

    print("\n--- 3. Test Case B: Doctor marks missed appointment (NO_SHOW) and doctor reschedules it ---")
    # Doctor marks appt_2 as NO_SHOW (patient missed appointment)
    status, trans_resp = request(f"/api/v1/appointments/{appt_2_id}/transition", "POST", {"status": "NO_SHOW"}, token=doctor_token)
    assert status == 200, f"Transition to NO_SHOW failed: {trans_resp}"
    assert trans_resp["status"] == "NO_SHOW", f"Expected NO_SHOW, got {trans_resp['status']}"
    print(f"Appointment {appt_2_id} marked as NO_SHOW (missed).")

    # Get slots for day after tomorrow
    status, slots_day_after = request(f"/api/v1/slots?doctorId={doctor_id}&date={day_after}", "GET", token=doctor_token)
    assert status == 200 and len(slots_day_after) >= 1, f"Expected available slots: {slots_day_after}"
    slot_3 = slots_day_after[0]

    # Doctor reschedules the missed appointment for the patient
    status, resched_doc = request(f"/api/v1/appointments/{appt_2_id}/reschedule", "POST", {
        "doctorId": doctor_id,
        "startsAt": slot_3["startsAt"],
        "reason": "Patient missed appointment, doctor rescheduled to new slot"
    }, token=doctor_token)
    assert status == 200, f"Doctor reschedule failed: {resched_doc}"
    assert resched_doc["status"] == "CONFIRMED", f"Expected CONFIRMED, got {resched_doc['status']}"
    appt_3_id = resched_doc["appointmentId"]
    print(f"Doctor successfully rescheduled missed appointment! New Appointment: {resched_doc['appointmentNumber']}")

    print("\n--- 4. Test Case C: Rescheduling a CANCELLED appointment ---")
    # Patient cancels appt_3
    status, cancel_resp = request(f"/api/v1/appointments/{appt_3_id}/cancel", "POST", {"reason": "Doctor emergency"}, token=patient_token)
    assert status == 200, f"Cancel failed: {cancel_resp}"
    assert cancel_resp["status"] == "CANCELLED", f"Expected CANCELLED, got {cancel_resp['status']}"
    print(f"Appointment {appt_3_id} cancelled.")

    # Slot 4
    slot_4 = slots_day_after[1]
    status, resched_cancel = request(f"/api/v1/appointments/{appt_3_id}/reschedule", "POST", {
        "doctorId": doctor_id,
        "startsAt": slot_4["startsAt"],
        "reason": "Rescheduling previously cancelled appointment"
    }, token=patient_token)
    assert status == 200, f"Rescheduling cancelled appointment failed: {resched_cancel}"
    assert resched_cancel["status"] == "CONFIRMED"
    print(f"Successfully rescheduled cancelled appointment! New ID: {resched_cancel['appointmentId']}")

    print("\n--- 5. Test Case D: Overlap prevention ---")
    # Attempting to reschedule to an already booked slot (slot_4 is now booked)
    status, conflict_resp = request(f"/api/v1/appointments/{appt_1_id}/reschedule", "POST", {
        "doctorId": doctor_id,
        "startsAt": slot_4["startsAt"]
    }, token=patient_token)
    assert status == 409, f"Expected 409 CONFLICT for overlapping slot, got {status}: {conflict_resp}"
    print(f"Overlap prevention verified: 409 CONFLICT correctly returned for occupied slot.")

    print("\n ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
