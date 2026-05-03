"""Backend API tests for Quality Metals — iteration 2 (product-type taxonomy + image upload)."""
import io
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://iron-trader-1.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@qualitymetalsltd.com"
ADMIN_PASSWORD = "QualityMetals2025"

EXPECTED_SLUGS = {
    "pipes", "bw-fittings", "forged-fittings", "flanges", "forgings",
    "bars", "sections", "fasteners", "valves", "spools",
}


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------- Categories ----------
class TestCategories:
    def test_list_categories(self, session):
        r = session.get(f"{BASE_URL}/api/categories")
        assert r.status_code == 200
        data = r.json()
        slugs = {c["slug"] for c in data}
        assert slugs == EXPECTED_SLUGS, f"Got slugs: {slugs}"
        assert len(data) == 10
        for c in data:
            assert c["count"] >= 1
            assert "name" in c


# ---------- Products list ----------
class TestProducts:
    def test_total_products_52(self, session):
        r = session.get(f"{BASE_URL}/api/products")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 52, f"Expected 52 products, got {len(data)}"

    def test_product_schema(self, session):
        r = session.get(f"{BASE_URL}/api/products")
        data = r.json()
        for p in data:
            for k in ("id", "category", "category_slug", "name", "subtype",
                      "grades", "sizes", "image_url", "standards"):
                assert k in p, f"Missing key {k} in {p.get('name')}"
            assert isinstance(p["grades"], list)
            assert isinstance(p["standards"], list)
            assert p["image_url"].startswith("/api/uploads/cat-"), f"Bad image_url: {p['image_url']}"

    def test_filter_fasteners(self, session):
        r = session.get(f"{BASE_URL}/api/products", params={"category": "fasteners"})
        assert r.status_code == 200
        d = r.json()
        assert len(d) == 7, f"Expected 7 fasteners, got {len(d)}"
        assert all(p["category_slug"] == "fasteners" for p in d)

    def test_filter_pipes(self, session):
        r = session.get(f"{BASE_URL}/api/products", params={"category": "pipes"})
        assert r.status_code == 200
        assert len(r.json()) == 6

    def test_filter_flanges(self, session):
        r = session.get(f"{BASE_URL}/api/products", params={"category": "flanges"})
        assert r.status_code == 200
        assert len(r.json()) == 8

    def test_featured(self, session):
        r = session.get(f"{BASE_URL}/api/products", params={"featured": "true"})
        assert r.status_code == 200
        d = r.json()
        assert len(d) >= 1
        assert all(p.get("featured") is True for p in d)


# ---------- Static image ----------
class TestStaticImages:
    def test_serve_pipes_image(self, session):
        r = session.get(f"{BASE_URL}/api/uploads/cat-pipes.jpg")
        assert r.status_code == 200
        assert "image" in r.headers.get("content-type", "").lower()

    def test_serve_all_category_images(self, session):
        for slug in EXPECTED_SLUGS:
            url = f"{BASE_URL}/api/uploads/cat-{slug}.jpg"
            r = session.get(url)
            assert r.status_code == 200, f"{url} -> {r.status_code}"


# ---------- Auth ----------
class TestAuth:
    def test_login_ok(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login",
                         json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and isinstance(d["token"], str) and len(d["token"]) > 10
        assert d["user"]["email"] == ADMIN_EMAIL


# ---------- Image upload ----------
# Tiny 1x1 PNG bytes
PNG_1x1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8"
    b"\xcf\xc0\x00\x00\x00\x03\x00\x01\xc7\xc8\x9eR\x00\x00\x00\x00IEND\xaeB`\x82"
)


class TestUpload:
    def test_upload_anonymous_401(self):
        files = {"file": ("a.png", io.BytesIO(PNG_1x1), "image/png")}
        r = requests.post(f"{BASE_URL}/api/admin/upload-image", files=files)
        assert r.status_code == 401

    def test_upload_invalid_type_400(self, admin_token):
        files = {"file": ("note.txt", io.BytesIO(b"hello"), "text/plain")}
        r = requests.post(f"{BASE_URL}/api/admin/upload-image",
                          headers={"Authorization": f"Bearer {admin_token}"},
                          files=files)
        assert r.status_code == 400

    def test_upload_too_large_413(self, admin_token):
        big = b"\x00" * (9 * 1024 * 1024)  # 9 MB
        files = {"file": ("big.jpg", io.BytesIO(big), "image/jpeg")}
        r = requests.post(f"{BASE_URL}/api/admin/upload-image",
                          headers={"Authorization": f"Bearer {admin_token}"},
                          files=files)
        assert r.status_code == 413

    def test_upload_success_returns_url(self, admin_token):
        files = {"file": ("test.png", io.BytesIO(PNG_1x1), "image/png")}
        r = requests.post(f"{BASE_URL}/api/admin/upload-image",
                          headers={"Authorization": f"Bearer {admin_token}"},
                          files=files)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "url" in d and d["url"].startswith("/api/uploads/")
        assert "filename" in d
        assert d["size"] == len(PNG_1x1)
        # Verify file is served back
        r2 = requests.get(f"{BASE_URL}{d['url']}")
        assert r2.status_code == 200


# ---------- Admin product CRUD with new schema ----------
class TestProductCRUD:
    def test_create_update_delete(self, session, admin_headers):
        payload = {
            "category": "Pipes",
            "category_slug": "pipes",
            "name": "TEST_New Pipe Product",
            "subtype": "TestSubtype",
            "grade": "Multi-grade",
            "grades": ["SS 304", "SS 316"],
            "standards": ["ASTM A312"],
            "sizes": "1/2\" – 12\" NPS",
            "applications": ["Test"],
            "description": "Created by automated test",
            "image_url": "/api/uploads/cat-pipes.jpg",
            "featured": False,
            "sort_order": 999,
        }
        r = session.post(f"{BASE_URL}/api/products", json=payload, headers=admin_headers)
        assert r.status_code == 200, r.text
        created = r.json()
        pid = created["id"]
        assert created["subtype"] == "TestSubtype"
        assert created["grades"] == ["SS 304", "SS 316"]
        assert created["sizes"] == payload["sizes"]
        assert created["image_url"] == payload["image_url"]

        # GET to verify persistence
        r2 = session.get(f"{BASE_URL}/api/products/{pid}")
        assert r2.status_code == 200
        got = r2.json()
        assert got["name"] == payload["name"]
        assert got["grades"] == ["SS 304", "SS 316"]

        # UPDATE
        r3 = session.put(f"{BASE_URL}/api/products/{pid}",
                         json={"subtype": "UpdatedSubtype", "sizes": "Updated sizes"},
                         headers=admin_headers)
        assert r3.status_code == 200
        assert r3.json()["subtype"] == "UpdatedSubtype"

        # DELETE
        r4 = session.delete(f"{BASE_URL}/api/products/{pid}", headers=admin_headers)
        assert r4.status_code == 200
        r5 = session.get(f"{BASE_URL}/api/products/{pid}")
        assert r5.status_code == 404
