import urllib.request
import json
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

def test_delete_endpoints():
    print("=== TESTING DELETE DOCTOR AND DELETE STAFF ENDPOINTS ===")
    admin_token = get_token("admin@careflow.local", "CareFlowAdmin!2026")
    ts = int(time.time())

    # Get departments
    dept_req = urllib.request.Request(f"{API}/api/v1/departments", headers={"Authorization": f"Bearer {admin_token}"})
    with urllib.request.urlopen(dept_req) as resp:
        departments = json.loads(resp.read().decode('utf-8'))
    dept_id = departments[0]["departmentId"]

    # 1. Test Doctor Creation & Deletion
    doc_payload = {
        "fullName": f"Dr Delete Test {ts}",
        "email": f"delete_doc_{ts}@careflow.local",
        "password": "DoctorPass123!",
        "phone": "9887766554",
        "gender": "MALE",
        "dateOfBirth": "1988-06-12",
        "departmentId": dept_id,
        "specialization": "Cardiology",
        "licenseNumber": f"DEL-LIC-{ts}",
        "experienceYears": 6,
        "consultationFee": 50000
    }
    create_doc_req = urllib.request.Request(
        f"{API}/api/v1/admin/doctors",
        data=json.dumps(doc_payload).encode('utf-8'),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"},
        method="POST"
    )
    with urllib.request.urlopen(create_doc_req) as resp:
        doc_data = json.loads(resp.read().decode('utf-8'))
        doctor_id = doc_data["doctorId"]
        print(f"Created doctor: {doc_data['fullName']} (ID: {doctor_id})")

    # Verify doctor exists in list
    list_doc_req = urllib.request.Request(f"{API}/api/v1/admin/doctors", headers={"Authorization": f"Bearer {admin_token}"})
    with urllib.request.urlopen(list_doc_req) as resp:
        docs = json.loads(resp.read().decode('utf-8'))
        assert any(d["doctorId"] == doctor_id for d in docs), "Doctor not found in list!"
        print("Doctor successfully verified in doctors list.")

    # Delete doctor
    del_doc_req = urllib.request.Request(
        f"{API}/api/v1/admin/doctors/{doctor_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        method="DELETE"
    )
    with urllib.request.urlopen(del_doc_req) as resp:
        del_resp = json.loads(resp.read().decode('utf-8'))
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        print(f"DELETE /doctors response: {del_resp}")

    # Verify doctor no longer in list
    with urllib.request.urlopen(list_doc_req) as resp:
        docs_after = json.loads(resp.read().decode('utf-8'))
        assert not any(d["doctorId"] == doctor_id for d in docs_after), "Doctor still exists after deletion!"
        print("Doctor successfully deleted and confirmed absent from doctors list.")

    # 2. Test Staff Creation & Deletion
    staff_payload = {
        "fullName": f"Staff Delete Test {ts}",
        "email": f"delete_staff_{ts}@careflow.local",
        "password": "StaffPass123!",
        "phone": "9778899001",
        "gender": "FEMALE",
        "dateOfBirth": "1992-04-20",
        "departmentId": dept_id,
        "staffType": "NURSE",
        "designation": "Head Nurse",
        "employeeId": f"STF-{ts}"
    }
    create_staff_req = urllib.request.Request(
        f"{API}/api/v1/admin/staff",
        data=json.dumps(staff_payload).encode('utf-8'),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"},
        method="POST"
    )
    with urllib.request.urlopen(create_staff_req) as resp:
        staff_data = json.loads(resp.read().decode('utf-8'))
        staff_id = staff_data["staffId"]
        print(f"Created staff member: {staff_data['fullName']} (ID: {staff_id})")

    # Verify staff in list
    list_staff_req = urllib.request.Request(f"{API}/api/v1/admin/staff", headers={"Authorization": f"Bearer {admin_token}"})
    with urllib.request.urlopen(list_staff_req) as resp:
        staff_list = json.loads(resp.read().decode('utf-8'))
        assert any(s["staffId"] == staff_id for s in staff_list), "Staff not found in list!"
        print("Staff member verified in staff list.")

    # Delete staff
    del_staff_req = urllib.request.Request(
        f"{API}/api/v1/admin/staff/{staff_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        method="DELETE"
    )
    with urllib.request.urlopen(del_staff_req) as resp:
        del_staff_resp = json.loads(resp.read().decode('utf-8'))
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        print(f"DELETE /staff response: {del_staff_resp}")

    # Verify staff no longer in list
    with urllib.request.urlopen(list_staff_req) as resp:
        staff_after = json.loads(resp.read().decode('utf-8'))
        assert not any(s["staffId"] == staff_id for s in staff_after), "Staff member still exists after deletion!"
        print("Staff member successfully deleted and confirmed absent from staff list.")

    print("=== ALL DELETE FUNCTIONALITY VERIFIED SUCCESSFULLY ===")

if __name__ == "__main__":
    test_delete_endpoints()
