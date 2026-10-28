#!/usr/bin/env python3
import json
import time
import urllib.request
import urllib.error
import uuid

API = "http://localhost:8180"

def req(url, method="GET", body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode("utf-8") if body else None
    request = urllib.request.Request(f"{API}{url}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        error_content = e.read().decode("utf-8")
        try:
            parsed = json.loads(error_content)
        except Exception:
            parsed = {"error": error_content}
        return e.code, parsed

def main():
    print("=" * 70)
    print("CAREFLOW AI: RESTRICT STAFF ACCESS TO ASSIGNED DOCTORS & PATIENTS")
    print("=" * 70)

    # 1. Admin Login
    print("\n1. Authenticating Admin...")
    status, res = req("/api/v1/auth/login", "POST", {
        "email": "admin@careflow.local",
        "password": "CareFlowAdmin!2026"
    })
    assert status == 200, f"Admin login failed: {res}"
    admin_token = res["accessToken"]
    print("[PASS] Admin authenticated successfully.")

    # Get departments
    status, depts = req("/api/v1/departments", "GET", token=admin_token)
    assert status == 200, "Failed to load departments"
    dept_map = {d["name"]: d["departmentId"] for d in depts}
    pediatrics_id = dept_map.get("Pediatrics", "10000000-0000-0000-0000-000000000005")
    cardiology_id = dept_map.get("Cardiology", "10000000-0000-0000-0000-000000000001")
    print(f"  Pediatrics Department ID: {pediatrics_id}")
    print(f"  Cardiology Department ID: {cardiology_id}")

    # 2. Create or verify Doctor A (Pediatrics) and Doctor B (Cardiology)
    print("\n2. Provisioning Doctors in distinct departments...")
    ts = int(time.time())
    doc_a_email = f"doc_ped_{ts}@careflow.local"
    doc_b_email = f"doc_card_{ts}@careflow.local"

    status, doc_a = req("/api/v1/admin/doctors", "POST", {
        "fullName": f"Dr. Pediatrics {ts}",
        "email": doc_a_email,
        "password": "DoctorPass!2026",
        "departmentId": pediatrics_id,
        "specialization": "Pediatrics",
        "licenseNumber": f"LIC-PED-{ts}",
        "experienceYears": 10,
        "consultationFee": 50000
    }, token=admin_token)
    assert status in (200, 201), f"Failed to create Doctor A: {doc_a}"
    doc_a_id = doc_a["doctorId"]
    print(f"[PASS] Created Doctor A ({doc_a['fullName']}) in Pediatrics [ID: {doc_a_id}]")

    status, doc_b = req("/api/v1/admin/doctors", "POST", {
        "fullName": f"Dr. Cardiology {ts}",
        "email": doc_b_email,
        "password": "DoctorPass!2026",
        "departmentId": cardiology_id,
        "specialization": "Cardiology",
        "licenseNumber": f"LIC-CARD-{ts}",
        "experienceYears": 12,
        "consultationFee": 70000
    }, token=admin_token)
    assert status in (200, 201), f"Failed to create Doctor B: {doc_b}"
    doc_b_id = doc_b["doctorId"]
    print(f"[PASS] Created Doctor B ({doc_b['fullName']}) in Cardiology [ID: {doc_b_id}]")

    # 3. Create Staff A (Pediatrics) and Staff B (Cardiology)
    print("\n3. Provisioning Staff A (Pediatrics) and Staff B (Cardiology)...")
    staff_a_email = f"staff_ped_{ts}@careflow.local"
    staff_b_email = f"staff_card_{ts}@careflow.local"

    status, staff_a = req("/api/v1/admin/staff", "POST", {
        "fullName": f"Staff A Pediatrics {ts}",
        "email": staff_a_email,
        "password": "StaffPass!2026",
        "departmentId": pediatrics_id,
        "staffType": "NURSE",
        "designation": "Pediatric Support Nurse"
    }, token=admin_token)
    assert status in (200, 201), f"Failed to create Staff A: {staff_a}"
    print(f"[PASS] Created Staff A in Pediatrics: {staff_a['fullName']}")

    status, staff_b = req("/api/v1/admin/staff", "POST", {
        "fullName": f"Staff B Cardiology {ts}",
        "email": staff_b_email,
        "password": "StaffPass!2026",
        "departmentId": cardiology_id,
        "staffType": "NURSE",
        "designation": "Cardiac Care Nurse"
    }, token=admin_token)
    assert status in (200, 201), f"Failed to create Staff B: {staff_b}"
    print(f"[PASS] Created Staff B in Cardiology: {staff_b['fullName']}")

    # Authenticate Staff A and Staff B
    status, staff_a_auth = req("/api/v1/auth/login", "POST", {"email": staff_a_email, "password": "StaffPass!2026"})
    assert status == 200, f"Staff A login failed: {staff_a_auth}"
    staff_a_token = staff_a_auth["accessToken"]

    status, staff_b_auth = req("/api/v1/auth/login", "POST", {"email": staff_b_email, "password": "StaffPass!2026"})
    assert status == 200, f"Staff B login failed: {staff_b_auth}"
    staff_b_token = staff_b_auth["accessToken"]

    # 4. Provision Patients: Patient A (assigned to Doctor A) & Patient B (assigned to Doctor B)
    print("\n4. Registering Patients and creating departmental appointments...")
    pat_a_email = f"pat_a_{ts}@patient.local"
    pat_b_email = f"pat_b_{ts}@patient.local"

    # Patient A registered by Staff A
    status, pat_a = req("/api/v1/staff/patients", "POST", {
        "fullName": f"Patient A (Pediatric Child {ts})",
        "email": pat_a_email,
        "password": "PatientPass!2026",
        "phone": f"+9198765{ts % 100000:05d}",
        "gender": "FEMALE",
        "dateOfBirth": "2015-05-15"
    }, token=staff_a_token)
    assert status in (200, 201), f"Failed to register Patient A: {pat_a}"
    pat_a_id = pat_a["patientId"]
    print(f"[PASS] Registered Patient A: {pat_a['fullName']} [ID: {pat_a_id}]")

    # Patient B registered by Staff B
    status, pat_b = req("/api/v1/staff/patients", "POST", {
        "fullName": f"Patient B (Cardiac Adult {ts})",
        "email": pat_b_email,
        "password": "PatientPass!2026",
        "phone": f"+9198766{ts % 100000:05d}",
        "gender": "MALE",
        "dateOfBirth": "1972-10-20"
    }, token=staff_b_token)
    assert status in (200, 201), f"Failed to register Patient B: {pat_b}"
    pat_b_id = pat_b["patientId"]
    print(f"[PASS] Registered Patient B: {pat_b['fullName']} [ID: {pat_b_id}]")

    # Book appointments: Patient A with Doctor A (Pediatrics); Patient B with Doctor B (Cardiology)
    # Using tomorrow's slots
    future_start_a = "2026-11-20T10:00:00Z"
    future_start_b = "2026-11-20T11:00:00Z"

    status, appt_a = req("/api/v1/staff/appointments/book", "POST", {
        "patientId": pat_a_id,
        "doctorId": doc_a_id,
        "startsAt": future_start_a,
        "endsAt": "2026-11-20T10:30:00Z"
    }, token=staff_a_token)
    assert status in (200, 201), f"Staff A booking failed: {appt_a}"
    print(f"[PASS] Staff A booked appointment for Patient A with Doctor A: {appt_a.get('appointmentNumber')}")

    status, appt_b = req("/api/v1/staff/appointments/book", "POST", {
        "patientId": pat_b_id,
        "doctorId": doc_b_id,
        "startsAt": future_start_b,
        "endsAt": "2026-11-20T11:30:00Z"
    }, token=staff_b_token)
    assert status in (200, 201), f"Staff B booking failed: {appt_b}"
    print(f"[PASS] Staff B booked appointment for Patient B with Doctor B: {appt_b.get('appointmentNumber')}")

    # =========================================================================
    # REQUIREMENT 1 & 2: STAFF A ACCESS TESTING
    # =========================================================================
    print("\n" + "=" * 70)
    print("5. VERIFYING STAFF A ACCESS (Pediatrics Scope)")
    print("=" * 70)

    # 5.1 Doctor List: Staff A must see Doctor A and NOT Doctor B
    status, docs_for_a = req("/api/v1/staff/doctors", "GET", token=staff_a_token)
    assert status == 200, f"Failed to fetch doctors for Staff A: {docs_for_a}"
    doc_ids_a = [d["doctorId"] for d in docs_for_a]
    assert doc_a_id in doc_ids_a, "Staff A must see assigned Doctor A (Pediatrics)!"
    assert doc_b_id not in doc_ids_a, "Staff A must NOT see unassigned Doctor B (Cardiology)!"
    print(f"[PASS] GET /api/v1/staff/doctors: Staff A sees Doctor A and does NOT see Doctor B.")

    # 5.2 Direct Doctor Access: Staff A accesses Doctor A -> 200 OK
    status, doc_a_details = req(f"/api/v1/staff/doctors/{doc_a_id}", "GET", token=staff_a_token)
    assert status == 200, f"Staff A should be able to view assigned Doctor A: {doc_a_details}"
    print(f"[PASS] GET /api/v1/staff/doctors/{doc_a_id}: 200 OK (Assigned doctor details retrieved)")

    # 5.3 Direct Doctor Access: Staff A accesses Doctor B -> 403 Forbidden
    status, doc_b_details = req(f"/api/v1/staff/doctors/{doc_b_id}", "GET", token=staff_a_token)
    assert status == 403, f"Staff A accessing unassigned Doctor B MUST return 403 Forbidden! Got {status}: {doc_b_details}"
    print(f"[PASS] GET /api/v1/staff/doctors/{doc_b_id}: 403 Forbidden (Unassigned doctor rejected)")

    # 5.4 Patient List: Staff A must see Patient A and NOT Patient B
    status, pats_for_a = req("/api/v1/staff/patients", "GET", token=staff_a_token)
    assert status == 200, f"Failed to fetch patients for Staff A: {pats_for_a}"
    pat_ids_a = [p["patientId"] for p in pats_for_a]
    assert pat_a_id in pat_ids_a, "Staff A must see assigned Patient A!"
    assert pat_b_id not in pat_ids_a, "Staff A must NOT see unassigned Patient B!"
    print(f"[PASS] GET /api/v1/staff/patients: Staff A sees Patient A and does NOT see Patient B.")

    # 5.5 Direct Patient Access: Staff A accesses Patient A -> 200 OK
    status, pat_a_details = req(f"/api/v1/staff/patients/{pat_a_id}", "GET", token=staff_a_token)
    assert status == 200, f"Staff A should be able to view assigned Patient A: {pat_a_details}"
    print(f"[PASS] GET /api/v1/staff/patients/{pat_a_id}: 200 OK (Assigned patient details retrieved)")

    # 5.6 Direct Patient Access: Staff A accesses Patient B -> 403 Forbidden
    status, pat_b_details = req(f"/api/v1/staff/patients/{pat_b_id}", "GET", token=staff_a_token)
    assert status == 403, f"Staff A accessing unassigned Patient B MUST return 403 Forbidden! Got {status}: {pat_b_details}"
    print(f"[PASS] GET /api/v1/staff/patients/{pat_b_id}: 403 Forbidden (Unassigned patient rejected)")

    # 5.7 Direct Medical Records: Staff A accesses Patient B medical records -> 403 Forbidden
    status, pat_b_med_records = req(f"/api/v1/patients/{pat_b_id}/medical-records", "GET", token=staff_a_token)
    assert status == 403, f"Staff A accessing Patient B medical records MUST return 403 Forbidden! Got {status}"
    print(f"[PASS] GET /api/v1/patients/{pat_b_id}/medical-records: 403 Forbidden (Protected records)")

    # 5.8 Operations Records: Staff A accesses Patient B clinical records -> 403 Forbidden
    status, pat_b_op_records = req(f"/api/v1/operations/records/{pat_b_id}", "GET", token=staff_a_token)
    assert status == 403, f"Staff A accessing Patient B clinical records MUST return 403 Forbidden! Got {status}"
    print(f"[PASS] GET /api/v1/operations/records/{pat_b_id}: 403 Forbidden (Protected clinical records)")

    # 5.9 Patient Search: Staff A searches Patient B's name -> Empty / excluded
    status, search_res = req(f"/api/v1/operations/patients/search?query=Cardiac%20Adult", "GET", token=staff_a_token)
    assert status == 200, f"Search failed: {search_res}"
    assert not any(p["patient_id"] == pat_b_id for p in search_res), "Staff A search MUST NOT reveal Patient B!"
    print(f"[PASS] GET /api/v1/operations/patients/search: Patient B excluded from Staff A search results.")

    # 5.10 Appointments: Staff A must see Appointment A and NOT Appointment B
    status, appts_a = req("/api/v1/appointments", "GET", token=staff_a_token)
    assert status == 200, f"Appointments failed: {appts_a}"
    appt_ids_a = [a["appointmentId"] for a in appts_a]
    assert appt_a["appointmentId"] in appt_ids_a, "Staff A must see Appointment A!"
    assert appt_b["appointmentId"] not in appt_ids_a, "Staff A must NOT see Appointment B!"
    print(f"[PASS] GET /api/v1/appointments: Staff A receives only Pediatrics appointments.")

    # 5.11 Unauthorized Cross-Booking: Staff A tries to book with unassigned Doctor B -> 403 Forbidden
    status, cross_book = req("/api/v1/staff/appointments/book", "POST", {
        "patientId": pat_a_id,
        "doctorId": doc_b_id,
        "startsAt": "2026-11-20T14:00:00Z",
        "endsAt": "2026-11-20T14:30:00Z"
    }, token=staff_a_token)
    assert status == 403, f"Staff A booking with unassigned Doctor B must be rejected! Got {status}: {cross_book}"
    print(f"[PASS] POST /api/v1/staff/appointments/book: Cross-booking with Doctor B rejected with 403 Forbidden.")

    # =========================================================================
    # REQUIREMENT 1 & 2: STAFF B ACCESS TESTING
    # =========================================================================
    print("\n" + "=" * 70)
    print("6. VERIFYING STAFF B ACCESS (Cardiology Scope)")
    print("=" * 70)

    # 6.1 Doctor List: Staff B must see Doctor B and NOT Doctor A
    status, docs_for_b = req("/api/v1/staff/doctors", "GET", token=staff_b_token)
    assert status == 200, f"Failed to fetch doctors for Staff B: {docs_for_b}"
    doc_ids_b = [d["doctorId"] for d in docs_for_b]
    assert doc_b_id in doc_ids_b, "Staff B must see assigned Doctor B (Cardiology)!"
    assert doc_a_id not in doc_ids_b, "Staff B must NOT see unassigned Doctor A (Pediatrics)!"
    print(f"[PASS] GET /api/v1/staff/doctors: Staff B sees Doctor B and does NOT see Doctor A.")

    # 6.2 Direct Doctor Access: Staff B accesses Doctor B -> 200 OK
    status, doc_b_details = req(f"/api/v1/staff/doctors/{doc_b_id}", "GET", token=staff_b_token)
    assert status == 200, f"Staff B should be able to view assigned Doctor B: {doc_b_details}"
    print(f"[PASS] GET /api/v1/staff/doctors/{doc_b_id}: 200 OK (Assigned doctor details retrieved)")

    # 6.3 Direct Doctor Access: Staff B accesses Doctor A -> 403 Forbidden
    status, doc_a_details = req(f"/api/v1/staff/doctors/{doc_a_id}", "GET", token=staff_b_token)
    assert status == 403, f"Staff B accessing unassigned Doctor A MUST return 403 Forbidden! Got {status}: {doc_a_details}"
    print(f"[PASS] GET /api/v1/staff/doctors/{doc_a_id}: 403 Forbidden (Unassigned doctor rejected)")

    # 6.4 Patient List: Staff B must see Patient B and NOT Patient A
    status, pats_for_b = req("/api/v1/staff/patients", "GET", token=staff_b_token)
    assert status == 200, f"Failed to fetch patients for Staff B: {pats_for_b}"
    pat_ids_b = [p["patientId"] for p in pats_for_b]
    assert pat_b_id in pat_ids_b, "Staff B must see assigned Patient B!"
    assert pat_a_id not in pat_ids_b, "Staff B must NOT see unassigned Patient A!"
    print(f"[PASS] GET /api/v1/staff/patients: Staff B sees Patient B and does NOT see Patient A.")

    # 6.5 Direct Patient Access: Staff B accesses Patient B -> 200 OK
    status, pat_b_details = req(f"/api/v1/staff/patients/{pat_b_id}", "GET", token=staff_b_token)
    assert status == 200, f"Staff B should be able to view assigned Patient B: {pat_b_details}"
    print(f"[PASS] GET /api/v1/staff/patients/{pat_b_id}: 200 OK (Assigned patient details retrieved)")

    # 6.6 Direct Patient Access: Staff B accesses Patient A -> 403 Forbidden
    status, pat_a_details = req(f"/api/v1/staff/patients/{pat_a_id}", "GET", token=staff_b_token)
    assert status == 403, f"Staff B accessing unassigned Patient A MUST return 403 Forbidden! Got {status}: {pat_a_details}"
    print(f"[PASS] GET /api/v1/staff/patients/{pat_a_id}: 403 Forbidden (Unassigned patient rejected)")

    # 6.7 Direct Medical Records: Staff B accesses Patient A medical records -> 403 Forbidden
    status, pat_a_med_records = req(f"/api/v1/patients/{pat_a_id}/medical-records", "GET", token=staff_b_token)
    assert status == 403, f"Staff B accessing Patient A medical records MUST return 403 Forbidden! Got {status}"
    print(f"[PASS] GET /api/v1/patients/{pat_a_id}/medical-records: 403 Forbidden (Protected records)")

    # 6.8 Operations Records: Staff B accesses Patient A clinical records -> 403 Forbidden
    status, pat_a_op_records = req(f"/api/v1/operations/records/{pat_a_id}", "GET", token=staff_b_token)
    assert status == 403, f"Staff B accessing Patient A clinical records MUST return 403 Forbidden! Got {status}"
    print(f"[PASS] GET /api/v1/operations/records/{pat_a_id}: 403 Forbidden (Protected clinical records)")

    # 6.9 Appointments: Staff B must see Appointment B and NOT Appointment A
    status, appts_b = req("/api/v1/appointments", "GET", token=staff_b_token)
    assert status == 200, f"Appointments failed: {appts_b}"
    appt_ids_b = [a["appointmentId"] for a in appts_b]
    assert appt_b["appointmentId"] in appt_ids_b, "Staff B must see Appointment B!"
    assert appt_a["appointmentId"] not in appt_ids_b, "Staff B must NOT see Appointment A!"
    print(f"[PASS] GET /api/v1/appointments: Staff B receives only Cardiology appointments.")

    # 6.10 Unauthorized Modification: Staff B attempts to cancel Appointment A -> 403 Forbidden
    status, cancel_res = req(f"/api/v1/appointments/{appt_a['appointmentId']}/cancel", "POST", {
        "reason": "Unauthorized attempt by Staff B"
    }, token=staff_b_token)
    assert status == 403, f"Staff B cancelling Appointment A must return 403 Forbidden! Got {status}: {cancel_res}"
    print(f"[PASS] POST /api/v1/appointments/{appt_a['appointmentId']}/cancel: 403 Forbidden (Cross-staff cancel blocked)")

    # =========================================================================
    # REQUIREMENT 3: ADMIN ACCESS TESTING
    # =========================================================================
    print("\n" + "=" * 70)
    print("7. VERIFYING ADMIN UNRESTRICTED ACCESS")
    print("=" * 70)

    # Admin accesses both Doctor A and Doctor B
    status, admin_doc_a = req(f"/api/v1/staff/doctors/{doc_a_id}", "GET", token=admin_token)
    assert status == 200, "Admin must be able to view Doctor A"
    status, admin_doc_b = req(f"/api/v1/staff/doctors/{doc_b_id}", "GET", token=admin_token)
    assert status == 200, "Admin must be able to view Doctor B"

    # Admin accesses both Patient A and Patient B
    status, admin_pat_a = req(f"/api/v1/staff/patients/{pat_a_id}", "GET", token=admin_token)
    assert status == 200, "Admin must be able to view Patient A"
    status, admin_pat_b = req(f"/api/v1/staff/patients/{pat_b_id}", "GET", token=admin_token)
    assert status == 200, "Admin must be able to view Patient B"

    # Admin sees all appointments
    status, admin_appts = req("/api/v1/appointments", "GET", token=admin_token)
    admin_appt_ids = [a["appointmentId"] for a in admin_appts]
    assert appt_a["appointmentId"] in admin_appt_ids and appt_b["appointmentId"] in admin_appt_ids, "Admin must see all appointments"

    print("[PASS] Admin retains unrestricted oversight across all departments, doctors, and patients.")

    print("\n" + "=" * 70)
    print("ALL 16 VERIFICATION SCENARIOS PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    main()
