"""Comprehensive pytest suite for Quality Metals API.

Covers: health, public endpoints, inquiry creation, auth (login/me/logout),
brute-force lockout, admin CRUD (products + inquiries), admin stats.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Backend runs the frontend env; fall back to reading frontend/.env manually
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@qualitymetalsltd.com"
ADMIN_PASSWORD = "QualityMetals2025"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Cannot login as admin: {r.status_code} {r.text}")
    data = r.json()
    assert "token" in data and "user" in data
    return data["token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------- Health ----------
class TestHealth:
    def test_root(self, s):
        r = s.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"


# ---------- Public endpoints ----------
class TestPublic:
    def test_categories(self, s):
        r = s.get(f"{API}/categories")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 5
        slugs = {c["slug"] for c in data}
        # should contain at least these from seed
        for expected in ["stainless-steel", "duplex", "high-nickel-alloys"]:
            assert expected in slugs, f"missing {expected}"
        for c in data:
            assert "_id" not in c
            assert "name" in c and "count" in c

    def test_products_all(self, s):
        r = s.get(f"{API}/products")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 20
        assert all("_id" not in p for p in data)
        assert all({"id", "name", "category", "category_slug"} <= set(p.keys()) for p in data)

    def test_products_filter_category(self, s):
        r = s.get(f"{API}/products", params={"category": "stainless-steel"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        assert all(p["category_slug"] == "stainless-steel" for p in data)

    def test_products_filter_featured(self, s):
        r = s.get(f"{API}/products", params={"featured": "true"})
        assert r.status_code == 200
        data = r.json()
        assert all(p["featured"] is True for p in data)
        assert len(data) >= 1

    def test_get_product_by_id(self, s):
        r = s.get(f"{API}/products")
        pid = r.json()[0]["id"]
        r2 = s.get(f"{API}/products/{pid}")
        assert r2.status_code == 200
        assert r2.json()["id"] == pid

    def test_get_product_not_found(self, s):
        r = s.get(f"{API}/products/does-not-exist-xyz")
        assert r.status_code == 404


# ---------- Inquiries (public create) ----------
class TestInquiryPublic:
    def test_create_inquiry(self, s):
        payload = {
            "name": "TEST_Inquiry Customer",
            "email": "test_inquiry@example.com",
            "materials": "316L Pipes 6m",
            "message": "Need quote for 10 tonnes",
            "company": "Acme Ltd",
            "phone": "+64 123",
            "country": "NZ",
            "quantity": "10t",
        }
        r = s.post(f"{API}/inquiries", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "new"
        assert data["name"] == payload["name"]
        assert data["email"] == payload["email"]
        assert "id" in data
        assert "_id" not in data


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        d = r.json()
        assert "token" in d
        assert d["user"]["email"] == ADMIN_EMAIL
        assert d["user"]["role"] == "admin"
        # httpOnly cookie should be set
        assert "access_token" in r.cookies or any(
            "access_token" in c for c in r.headers.get("set-cookie", "").split(",")
        )

    def test_me_with_bearer(self, s, admin_token):
        r = s.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == ADMIN_EMAIL
        assert "password_hash" not in d

    def test_me_without_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_login_wrong_password(self):
        s2 = requests.Session()
        r = s2.post(f"{API}/auth/login", json={"email": "nobody_test@example.com", "password": "wrongpass"})
        assert r.status_code == 401


class TestBruteForce:
    """Exercise brute-force lockout using a unique non-existent email to avoid locking real admin."""

    def test_lockout_after_5_failures(self):
        unique_email = f"brute_{uuid.uuid4().hex[:8]}@example.com"
        s2 = requests.Session()
        status_codes = []
        for _ in range(6):
            r = s2.post(f"{API}/auth/login", json={"email": unique_email, "password": "wrong"})
            status_codes.append(r.status_code)
        # 6th should be 429, first 5 should be 401
        assert status_codes[0] == 401
        assert status_codes[-1] == 429, f"Expected 429 lockout, got {status_codes}"


# ---------- Admin protection ----------
class TestAdminProtection:
    @pytest.mark.parametrize("method,path,body", [
        ("POST", "/products", {"category": "x", "category_slug": "x", "name": "x", "grade": "x"}),
        ("PUT", "/products/fake-id", {"name": "x"}),
        ("DELETE", "/products/fake-id", None),
        ("GET", "/inquiries", None),
        ("PATCH", "/inquiries/fake-id", {"status": "new"}),
        ("DELETE", "/inquiries/fake-id", None),
        ("GET", "/admin/stats", None),
    ])
    def test_requires_auth(self, method, path, body):
        r = requests.request(method, f"{API}{path}", json=body)
        assert r.status_code == 401, f"{method} {path} -> {r.status_code}"


# ---------- Admin product CRUD ----------
class TestAdminProductCRUD:
    def test_full_crud_flow(self, auth_headers):
        create_payload = {
            "category": "Test Category",
            "category_slug": "TEST_test-cat",
            "name": "TEST_Product_" + uuid.uuid4().hex[:6],
            "grade": "TG1",
            "standards": ["ASTM T1"],
            "forms": ["Plates"],
            "applications": ["Testing"],
            "description": "Test desc",
            "featured": False,
            "sort_order": 999,
        }
        r = requests.post(f"{API}/products", json=create_payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        prod = r.json()
        pid = prod["id"]
        assert prod["name"] == create_payload["name"]

        # GET verifies persistence
        r2 = requests.get(f"{API}/products/{pid}")
        assert r2.status_code == 200
        assert r2.json()["grade"] == "TG1"

        # UPDATE
        r3 = requests.put(f"{API}/products/{pid}", json={"grade": "TG2", "featured": True}, headers=auth_headers)
        assert r3.status_code == 200
        assert r3.json()["grade"] == "TG2"
        assert r3.json()["featured"] is True

        # GET confirms update
        r4 = requests.get(f"{API}/products/{pid}")
        assert r4.json()["grade"] == "TG2"

        # DELETE
        r5 = requests.delete(f"{API}/products/{pid}", headers=auth_headers)
        assert r5.status_code == 200

        # GET confirms delete
        r6 = requests.get(f"{API}/products/{pid}")
        assert r6.status_code == 404


# ---------- Admin inquiries ----------
class TestAdminInquiries:
    def test_list_and_update_status(self, auth_headers):
        # seed a test inquiry
        payload = {
            "name": "TEST_StatusFlow",
            "email": "test_status@example.com",
            "materials": "Duplex 2205 Plates",
            "message": "status test",
        }
        rc = requests.post(f"{API}/inquiries", json=payload)
        assert rc.status_code == 200
        iid = rc.json()["id"]

        # list
        r = requests.get(f"{API}/inquiries", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert any(i["id"] == iid for i in data)
        assert all("_id" not in i for i in data)

        # filter ?status=new
        r2 = requests.get(f"{API}/inquiries", params={"status": "new"}, headers=auth_headers)
        assert r2.status_code == 200
        assert all(i["status"] == "new" for i in r2.json())

        # patch status -> in_review
        r3 = requests.patch(f"{API}/inquiries/{iid}", json={"status": "in_review"}, headers=auth_headers)
        assert r3.status_code == 200
        assert r3.json()["status"] == "in_review"

        # invalid status
        r4 = requests.patch(f"{API}/inquiries/{iid}", json={"status": "bogus"}, headers=auth_headers)
        assert r4.status_code == 400

        # delete
        r5 = requests.delete(f"{API}/inquiries/{iid}", headers=auth_headers)
        assert r5.status_code == 200


# ---------- Admin stats ----------
class TestAdminStats:
    def test_stats_shape(self, auth_headers):
        r = requests.get(f"{API}/admin/stats", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ("total_products", "total_inquiries", "new_inquiries", "products_by_category"):
            assert k in d
        assert isinstance(d["products_by_category"], list)
        assert d["total_products"] >= 20
