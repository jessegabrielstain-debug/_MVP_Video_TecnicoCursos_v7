import pytest
import requests
import time
from auth_utils import get_authenticated_headers

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_certificate_generation_and_verification():
    # Authenticate
    auth_headers = get_authenticated_headers()
    
    project_id = None
    try:
        # 1. Create a Project
        create_payload = {
            "name": "Certificate Test Project",
            "description": "Project for testing certificate generation."
        }
        create_resp = requests.post(f"{BASE_URL}/api/projects", json=create_payload, headers=auth_headers, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Project creation failed: {create_resp.text}"
        project_id = create_resp.json().get("data", {}).get("id") or create_resp.json().get("id")
        assert project_id, "Project ID missing"

        # 2. Validate Compliance (Prerequisite for certificate)
        validate_payload = {
            "projectId": project_id,
            "nrType": "NR-10"
        }
        # We assume validation passes or we mock it. 
        # For this test, we might need to force a compliance record if the validation API is complex.
        # But let's try calling the real validation endpoint first.
        requests.post(f"{BASE_URL}/api/compliance/validate", json=validate_payload, headers=auth_headers, timeout=TIMEOUT)
        
        # 3. Generate Certificate
        # Endpoint: POST /api/certificates
        cert_payload = {
            "projectId": project_id,
            "courseName": "NR-10 Segurança em Instalações Elétricas",
            "studentName": "Test User"
        }
        cert_resp = requests.post(f"{BASE_URL}/api/certificates", json=cert_payload, headers=auth_headers, timeout=TIMEOUT)
        
        if cert_resp.status_code == 404:
            pytest.fail("Certificate API endpoint not implemented (404)")
            
        assert cert_resp.status_code == 201, f"Certificate generation failed: {cert_resp.text}"
        cert_data = cert_resp.json()
        certificate_id = cert_data.get("id")
        assert certificate_id, "Certificate ID missing"
        assert cert_data.get("certificateUrl"), "Certificate URL missing"
        certificate_code = cert_data.get("code")
        assert certificate_code, "Certificate Code missing"

        # 4. Verify Certificate
        # Endpoint: GET /api/certificates/verify?code={certificate_code}
        verify_resp = requests.get(f"{BASE_URL}/api/certificates/verify?code={certificate_code}", timeout=TIMEOUT)
        assert verify_resp.status_code == 200, f"Certificate verification failed: {verify_resp.text}"
        verify_data = verify_resp.json()
        assert verify_data.get("valid") is True, "Certificate should be valid"
        assert verify_data.get("project_id") == project_id, "Certificate project ID mismatch"

    finally:
        if project_id:
            requests.delete(f"{BASE_URL}/api/projects/{project_id}", headers=auth_headers, timeout=TIMEOUT)

if __name__ == "__main__":
    test_certificate_generation_and_verification()
