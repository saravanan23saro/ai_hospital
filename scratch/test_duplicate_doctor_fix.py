import urllib.request
import json
import sys
import time

API = "http://localhost:8180"

def get_token(email, password):
    req = urllib.request.Request(
        f"{API}/api/v1/auth/login",
        data=json.dumps({"email": email, "password": password}).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        return data["accessToken"]

def get_patient_token():
    email = f"test_patient_{int(time.time())}@careflow.local"
    req = urllib.request.Request(
        f"{API}/api/v1/auth/register",
        data=json.dumps({"email": email, "password": "PatientPass123!", "fullName": "Test Patient"}).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        token = data["accessToken"]
    phone_num = f"987{int(time.time()) % 10000000:07d}"
    prof_req = urllib.request.Request(
        f"{API}/api/v1/patients/me",
        data=json.dumps({
            "fullName": "Test Patient",
            "dateOfBirth": "1990-01-01",
            "phone": phone_num,
            "gender": "FEMALE",
            "address": "123 Main St",
            "emergencyContact": phone_num,
            "preferredLanguage": "English",
            "bloodGroup": "O_POSITIVE",
            "allergies": "None",
            "medicalConditions": "None"
        }).encode('utf-8'),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
        method="PUT"
    )
    with urllib.request.urlopen(prof_req):
        pass
    return token

def test_duplicate_doctor_fix():
    print("=== STARTING DUPLICATE DOCTOR FIX VERIFICATION ===")
    admin_token = get_token("admin@careflow.local", "CareFlowAdmin!2026")
    patient_token = get_patient_token()

    # 1. Fetch departments
    req = urllib.request.Request(f"{API}/api/v1/departments", headers={"Authorization": f"Bearer {patient_token}"})
    with urllib.request.urlopen(req) as resp:
        departments = json.loads(resp.read().decode('utf-8'))
    
    orthopedics = next((d for d in departments if d["name"] == "Orthopedics"), None)
    assert orthopedics is not None, "Orthopedics department not found!"
    ortho_id = orthopedics["departmentId"]
    print(f"Orthopedics Dept ID: {ortho_id}")

    # 2. Query available slots for Orthopedics on tomorrow's date
    tomorrow = (time.time() + 86400)
    date_str = time.strftime("%Y-%m-%d", time.gmtime(tomorrow))
    req_slots = urllib.request.Request(
        f"{API}/api/v1/slots?departmentId={ortho_id}&date={date_str}",
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    with urllib.request.urlopen(req_slots) as resp:
        slots = json.loads(resp.read().decode('utf-8'))

    print(f"Total slots returned: {len(slots)}")
    doctor_map = {}
    for slot in slots:
        doc_id = slot["doctorId"]
        doc_name = slot["doctorName"]
        if doc_id not in doctor_map:
            doctor_map[doc_id] = {"name": doc_name, "slots": []}
        doctor_map[doc_id]["slots"].append(slot["startsAt"])

    doctor_names = [d["name"] for d in doctor_map.values()]
    print(f"Unique doctor IDs count: {len(doctor_map)}")
    print(f"Doctor names in results: {doctor_names}")

    # TEST 1 & TEST 2: Unique doctors
    srinivas_cards = [d for d in doctor_map.values() if "srinivas" in d["name"].lower()]
    print(f"Srinivas doctor cards count: {len(srinivas_cards)}")
    assert len(srinivas_cards) == 1, f"Expected 1 Srinivas card, found {len(srinivas_cards)}"

    priya_cards = [d for d in doctor_map.values() if "priya raman" in d["name"].lower()]
    assert len(priya_cards) == 1, f"Expected 1 Dr. Priya Raman card, found {len(priya_cards)}"

    riya_cards = [d for d in doctor_map.values() if "riya thomas" in d["name"].lower()]
    assert len(riya_cards) == 1, f"Expected 1 Dr. Riya Thomas card, found {len(riya_cards)}"

    srinivas_slots = srinivas_cards[0]["slots"]
    print(f"Srinivas available slots count: {len(srinivas_slots)}")
    assert len(srinivas_slots) >= 5, f"Expected at least 5 slots for Srinivas, found {len(srinivas_slots)}"

    # TEST 7: Attempt duplicate doctor registration with same name in Orthopedics -> expect CONFLICT (409)
    dup_name_payload = {
        "email": f"srinivas_test_dup_{date_str}@careflow.local",
        "password": "DoctorPass123!",
        "fullName": "Srinivas",
        "specialization": "Orthopedic Surgery",
        "departmentId": ortho_id,
        "licenseNumber": f"MED-TN-DUP-{date_str}",
        "experienceYears": 8,
        "phone": "9876543210",
        "gender": "MALE",
        "dateOfBirth": "1985-05-15",
        "consultationFee": 60000
    }
    req_dup = urllib.request.Request(
        f"{API}/api/v1/admin/doctors",
        data=json.dumps(dup_name_payload).encode('utf-8'),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req_dup) as resp:
            print("ERROR: Duplicate doctor registration should have failed!")
            sys.exit(1)
    except urllib.error.HTTPError as err:
        err_body = err.read().decode('utf-8')
        print(f"Error status: {err.code}, body: {err_body}")
        assert err.code == 409, f"Expected HTTP 409 CONFLICT, got {err.code}: {err_body}"
        print(f"Duplicate doctor registration correctly rejected with HTTP {err.code} CONFLICT.")

    # TEST 9: Book appointment with Srinivas
    srinivas_doc_id = [k for k, v in doctor_map.items() if "srinivas" in v["name"].lower()][0]
    target_slot_starts = srinivas_slots[0]
    
    # Create reservation
    res_req = urllib.request.Request(
        f"{API}/api/v1/reservations",
        data=json.dumps({"doctorId": srinivas_doc_id, "startsAt": target_slot_starts}).encode('utf-8'),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {patient_token}"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(res_req) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            reservation_id = res_data["reservationId"]
    except urllib.error.HTTPError as err:
        print(f"Reservation Error {err.code}: {err.read().decode('utf-8')}")
        raise err

    # Confirm appointment
    appt_req = urllib.request.Request(
        f"{API}/api/v1/appointments",
        data=json.dumps({"reservationId": reservation_id}).encode('utf-8'),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {patient_token}"},
        method="POST"
    )
    with urllib.request.urlopen(appt_req) as resp:
        appt_data = json.loads(resp.read().decode('utf-8'))
        appt_id = appt_data["appointmentId"]
        print(f"Appointment booked with Srinivas: {appt_data['appointmentNumber']}")

    # TEST 10: Cancel appointment
    cancel_req = urllib.request.Request(
        f"{API}/api/v1/appointments/{appt_id}/cancel",
        data=json.dumps({"reason": "Test cancellation verification"}).encode('utf-8'),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {patient_token}"},
        method="POST"
    )
    with urllib.request.urlopen(cancel_req) as resp:
        cancel_data = json.loads(resp.read().decode('utf-8'))
        assert cancel_data["status"] == "CANCELLED"
        print(f"Appointment {appt_data['appointmentNumber']} cancelled successfully.")

    print("=== ALL DUPLICATE DOCTOR FIX TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_duplicate_doctor_fix()
