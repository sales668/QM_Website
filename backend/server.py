from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ---------- Config ----------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = "HS256"
ACCESS_TOKEN_MIN = 60 * 24  # 24h
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@qualitymetalsltd.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "QualityMetals2025")

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)
ALLOWED_IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Quality Metals API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
log = logging.getLogger("qm-api")


# ---------- Helpers ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MIN),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=401, detail="Not authorized")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------- Models ----------
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AuthOut(BaseModel):
    token: str
    user: dict


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str               # Product TYPE: "Pipes", "BW Fittings", "Flanges", "Fasteners", etc.
    category_slug: str          # "pipes", "bw-fittings", "flanges", "fasteners", etc.
    name: str                   # Specific item: "Seamless Pipes", "90° LR Elbow", "Stud Bolts"
    subtype: str = ""           # Optional sub-type: "90° LR Elbow", "Equal Tee", "Stud Bolt", "WN Flange"
    grade: str = ""             # Headline / primary grade summary (e.g. "Multi-grade")
    grades: List[str] = []      # All grades available for this product
    standards: List[str] = []   # ["ASME B16.9", "ASTM A234"]
    sizes: str = ""             # "1/2\" – 48\" NPS, Sch 10 – XXS"
    forms: List[str] = []       # legacy field, still supported
    applications: List[str] = []
    description: str = ""
    image_url: str = ""         # Product image (URL)
    featured: bool = False
    sort_order: int = 100
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ProductCreate(BaseModel):
    category: str
    category_slug: str
    name: str
    subtype: str = ""
    grade: str = ""
    grades: List[str] = []
    standards: List[str] = []
    sizes: str = ""
    forms: List[str] = []
    applications: List[str] = []
    description: str = ""
    image_url: str = ""
    featured: bool = False
    sort_order: int = 100


class ProductUpdate(BaseModel):
    category: Optional[str] = None
    category_slug: Optional[str] = None
    name: Optional[str] = None
    subtype: Optional[str] = None
    grade: Optional[str] = None
    grades: Optional[List[str]] = None
    standards: Optional[List[str]] = None
    sizes: Optional[str] = None
    forms: Optional[List[str]] = None
    applications: Optional[List[str]] = None
    description: Optional[str] = None
    featured: Optional[bool] = None
    sort_order: Optional[int] = None


class Inquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    company: str = ""
    email: EmailStr
    phone: str = ""
    country: str = ""
    materials: str = ""           # e.g. "316L Pipes 6m, Duplex 2205 Plates"
    quantity: str = ""
    message: str = ""
    status: str = "new"           # new | in_review | quoted | closed
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class InquiryCreate(BaseModel):
    name: str
    company: str = ""
    email: EmailStr
    phone: str = ""
    country: str = ""
    materials: str = ""
    quantity: str = ""
    message: str = ""


class InquiryUpdate(BaseModel):
    status: str


# ---------- Auth Routes ----------
def _get_client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        # first hop is the original client
        return xff.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip", "")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"


@api.post("/auth/login", response_model=AuthOut)
async def login(payload: LoginIn, request: Request, response: Response):
    email = payload.email.lower().strip()
    ip = _get_client_ip(request)
    identifier = f"{ip}:{email}"

    # brute-force check
    rec = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if rec and rec.get("count", 0) >= 5:
        last_str = rec.get("last_attempt")
        try:
            last_dt = datetime.fromisoformat(last_str) if last_str else datetime.now(timezone.utc) - timedelta(hours=1)
        except Exception:
            last_dt = datetime.now(timezone.utc) - timedelta(hours=1)
        if datetime.now(timezone.utc) - last_dt < timedelta(minutes=15):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})

    token = create_access_token(user["id"], user["email"])
    response.set_cookie(
        key="access_token", value=token, httponly=True,
        secure=False, samesite="lax", max_age=ACCESS_TOKEN_MIN * 60, path="/",
    )
    safe_user = {"id": user["id"], "email": user["email"], "name": user.get("name", "Admin"), "role": user.get("role", "admin")}
    return AuthOut(token=token, user=safe_user)


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(admin=Depends(get_current_admin)):
    return admin


# ---------- Public Routes ----------
@api.get("/")
async def root():
    return {"service": "Quality Metals Limited API", "status": "ok"}


@api.get("/categories")
async def list_categories():
    """Returns all unique product categories with counts."""
    pipeline = [
        {"$group": {"_id": {"slug": "$category_slug", "name": "$category"}, "count": {"$sum": 1}}},
        {"$sort": {"_id.name": 1}},
    ]
    docs = await db.products.aggregate(pipeline).to_list(length=200)
    return [{"slug": d["_id"]["slug"], "name": d["_id"]["name"], "count": d["count"]} for d in docs]


@api.get("/products", response_model=List[Product])
async def list_products(category: Optional[str] = None, featured: Optional[bool] = None):
    q: dict = {}
    if category:
        q["category_slug"] = category
    if featured is not None:
        q["featured"] = featured
    docs = await db.products.find(q, {"_id": 0}).sort([("sort_order", 1), ("name", 1)]).to_list(length=500)
    return docs


@api.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return doc


@api.post("/inquiries", response_model=Inquiry)
async def create_inquiry(payload: InquiryCreate):
    obj = Inquiry(**payload.model_dump())
    doc = obj.model_dump()
    await db.inquiries.insert_one(doc)
    return obj


# ---------- Admin Routes ----------
@api.post("/products", response_model=Product)
async def create_product(payload: ProductCreate, admin=Depends(get_current_admin)):
    obj = Product(**payload.model_dump())
    await db.products.insert_one(obj.model_dump())
    return obj


@api.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, payload: ProductUpdate, admin=Depends(get_current_admin)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.products.update_one({"id": product_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    return doc


@api.delete("/products/{product_id}")
async def delete_product(product_id: str, admin=Depends(get_current_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


@api.post("/admin/upload-image")
async def upload_image(file: UploadFile = File(...), admin=Depends(get_current_admin)):
    """Upload an image (any common format), save to disk, return its public URL."""
    ext = ("." + file.filename.rsplit(".", 1)[-1].lower()) if "." in (file.filename or "") else ""
    if ext not in ALLOWED_IMG_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_IMG_EXT))}")
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large. Max {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")
    fname = f"{uuid.uuid4().hex}{ext}"
    fpath = UPLOAD_DIR / fname
    fpath.write_bytes(contents)
    return {"url": f"/api/uploads/{fname}", "filename": fname, "size": len(contents)}


@api.get("/inquiries", response_model=List[Inquiry])
async def list_inquiries(status: Optional[str] = None, admin=Depends(get_current_admin)):
    q: dict = {}
    if status:
        q["status"] = status
    docs = await db.inquiries.find(q, {"_id": 0}).sort([("created_at", -1)]).to_list(length=1000)
    return docs


@api.patch("/inquiries/{inquiry_id}", response_model=Inquiry)
async def update_inquiry(inquiry_id: str, payload: InquiryUpdate, admin=Depends(get_current_admin)):
    if payload.status not in ("new", "in_review", "quoted", "closed"):
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.inquiries.update_one({"id": inquiry_id}, {"$set": {"status": payload.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return await db.inquiries.find_one({"id": inquiry_id}, {"_id": 0})


@api.delete("/inquiries/{inquiry_id}")
async def delete_inquiry(inquiry_id: str, admin=Depends(get_current_admin)):
    result = await db.inquiries.delete_one({"id": inquiry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return {"ok": True}


@api.get("/admin/stats")
async def admin_stats(admin=Depends(get_current_admin)):
    total_products = await db.products.count_documents({})
    total_inquiries = await db.inquiries.count_documents({})
    new_inquiries = await db.inquiries.count_documents({"status": "new"})
    by_category_pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}]
    by_cat = await db.products.aggregate(by_category_pipeline).to_list(length=50)
    return {
        "total_products": total_products,
        "total_inquiries": total_inquiries,
        "new_inquiries": new_inquiries,
        "products_by_category": [{"category": d["_id"], "count": d["count"]} for d in by_cat],
    }


# ---------- Startup: indexes + seed ----------
# Reusable grade lists
GRADES_FERROUS = [
    "ASTM A106 Gr B", "ASTM A333 Gr 6", "API 5L X42-X70",
    "SS 304 / 304L", "SS 316 / 316L", "SS 321 / 321H", "SS 347 / 347H", "SS 904L",
    "Duplex 2205 (S32205)", "Lean Duplex 2101 (S32101)", "Super Duplex 2507 (S32750)",
    "Inconel 625 / 718", "Incoloy 800H / 825", "Hastelloy C-276",
    "Monel 400 / K-500", "Alloy 20", "Titanium Gr 2 / Gr 5",
]
GRADES_BW = [
    "A234 WPB / WPC", "A420 WPL6", "A234 WP11/WP22/WP91",
    "A403 WP304L / WP316L / WP321 / WP347", "A815 S31803 (Duplex)", "B366 WPNCMC (Inconel)",
]
GRADES_FORGED = [
    "A105 (CS)", "A350 LF2 (Low-temp CS)", "A182 F11 / F22 / F91",
    "A182 F304L / F316L / F321 / F347",
    "A182 F51 (Duplex 2205)", "A182 F53/F55 (Super Duplex)", "B564 (Inconel/Monel)",
]
GRADES_FAS_ALL = [
    "ASTM A193 B7 / B7M / B16",
    "ASTM A320 L7 / L7M (Low-temp)",
    "A2-70 / A4-80 (SS 304 / 316)",
    "Duplex 2205 (S32205)",
    "Super Duplex 2507 (S32750)",
    "Inconel 625 / 718",
    "Monel 400 / K-500",
    "Alloy 20", "Titanium Gr 2 / Gr 5",
]

# Image URLs — using one verified-working industrial photo for all products as a safe baseline.
# Admin can later upload product-specific photos via the dashboard.
_PIPES_IMG = "https://images.pexels.com/photos/19730402/pexels-photo-19730402.jpeg?auto=compress&cs=tinysrgb&w=900"
_BARS_IMG  = "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=900"
_SECTIONS_IMG = "https://images.pexels.com/photos/2117937/pexels-photo-2117937.jpeg?auto=compress&cs=tinysrgb&w=900"

IMG = {
    "pipes_stack": _PIPES_IMG,
    "pipes_smls":  _PIPES_IMG,
    "pipes_3lpp":  _PIPES_IMG,
    "pipes_fbe":   _PIPES_IMG,
    "bw_fittings": _PIPES_IMG,
    "elbow":       _PIPES_IMG,
    "tee":         _PIPES_IMG,
    "forged_fit":  _PIPES_IMG,
    "flanges":     _PIPES_IMG,
    "flange_face": _PIPES_IMG,
    "forgings":    _PIPES_IMG,
    "bars_round":  _PIPES_IMG,
    "sections":    _PIPES_IMG,
    "h_beams":     _PIPES_IMG,
    "fasteners":   _PIPES_IMG,
    "stud_bolts":  _PIPES_IMG,
    "hex_bolts":   _PIPES_IMG,
    "valves":      _PIPES_IMG,
    "spools":      _PIPES_IMG,
}

SEED_PRODUCTS = [
    # ---------- PIPES ----------
    {"category": "Pipes", "category_slug": "pipes", "name": "Seamless Pipes (SMLS)", "subtype": "SMLS",
     "grade": "Multi-grade", "grades": GRADES_FERROUS,
     "standards": ["ASTM A106", "ASTM A312", "ASTM A335", "ASTM A790", "ASME B36.10/19"],
     "sizes": "1/2\" – 24\" NPS, Sch 10 – XXS", "applications": ["High-pressure", "High-temp", "Refinery", "Petrochemical"],
     "description": "Hot-finished and cold-drawn seamless pipe across CS, SS, Duplex, and Nickel alloys.",
     "image_url": IMG["pipes_smls"], "featured": True, "sort_order": 10},
    {"category": "Pipes", "category_slug": "pipes", "name": "ERW / HFW Welded Pipes", "subtype": "ERW / HFW",
     "grade": "Multi-grade", "grades": ["API 5L X42-X70", "ASTM A53", "ASTM A671", "ASTM A672"],
     "standards": ["API 5L", "ASTM A53", "ASTM A671/A672"],
     "sizes": "1/2\" – 24\" NPS", "applications": ["Pipelines", "Structural", "Water"],
     "description": "Electric-resistance and high-frequency welded line pipe — including project-grade orders shipped globally.",
     "image_url": IMG["pipes_stack"], "featured": True, "sort_order": 11},
    {"category": "Pipes", "category_slug": "pipes", "name": "HSAW / SAW Welded Pipes", "subtype": "HSAW",
     "grade": "Multi-grade", "grades": ["API 5L X52-X70", "ASTM A672", "ASTM A691"],
     "standards": ["API 5L", "ASTM A672", "ASTM A691"],
     "sizes": "16\" – 100\" OD", "applications": ["Long-distance pipelines", "Water transmission"],
     "description": "Helical / longitudinal submerged-arc welded pipe for large-diameter projects.",
     "image_url": IMG["pipes_stack"], "sort_order": 12},
    {"category": "Pipes", "category_slug": "pipes", "name": "3LPP Coated Pipes", "subtype": "3LPP Coating",
     "grade": "API 5L + 3LPP", "grades": ["API 5L X42-X70 + 3LPP"],
     "standards": ["DIN 30670", "CSA Z245.21", "ISO 21809-1"],
     "sizes": "Up to 56\" OD", "applications": ["Buried pipelines", "Onshore oil & gas"],
     "description": "Three-layer polypropylene anti-corrosion coating — FBE primer, copolymer adhesive, PP topcoat.",
     "image_url": IMG["pipes_3lpp"], "featured": True, "sort_order": 13},
    {"category": "Pipes", "category_slug": "pipes", "name": "FBE Coated Pipes", "subtype": "FBE Coating",
     "grade": "API 5L + FBE", "grades": ["API 5L Gr B–X70 + FBE"],
     "standards": ["AWWA C213", "CSA Z245.20", "ISO 21809-2"],
     "sizes": "Up to 60\" OD", "applications": ["Onshore pipelines", "Buried service"],
     "description": "Fusion-bonded epoxy single-coat anti-corrosion system.",
     "image_url": IMG["pipes_fbe"], "sort_order": 14},
    {"category": "Pipes", "category_slug": "pipes", "name": "DFBE / Internal-Lined Pipes", "subtype": "DFBE / Internal Epoxy",
     "grade": "Multi-grade", "grades": ["API 5L + DFBE", "API 5L + Internal Epoxy"],
     "standards": ["AWWA C213", "API RP 5L2"],
     "sizes": "Up to 56\" OD", "applications": ["Sour service", "Water injection", "Aggressive media"],
     "description": "Dual-layer FBE and internal flow-coat epoxy for abrasion and corrosion protection.",
     "image_url": IMG["pipes_fbe"], "sort_order": 15},

    # ---------- BW FITTINGS ----------
    {"category": "BW Fittings", "category_slug": "bw-fittings", "name": "90° Long Radius Elbow", "subtype": "90° LR Elbow",
     "grade": "Multi-grade", "grades": GRADES_BW,
     "standards": ["ASME B16.9", "MSS SP-43"], "sizes": "1/2\" – 48\" NPS",
     "applications": ["Process piping", "Pipelines", "Refinery"],
     "description": "Long radius butt-weld elbow, seamless and welded.",
     "image_url": IMG["elbow"], "featured": True, "sort_order": 20},
    {"category": "BW Fittings", "category_slug": "bw-fittings", "name": "45° Elbow", "subtype": "45° Elbow",
     "grade": "Multi-grade", "grades": GRADES_BW,
     "standards": ["ASME B16.9"], "sizes": "1/2\" – 48\" NPS",
     "applications": ["Process piping"], "description": "45-degree butt-weld elbow.",
     "image_url": IMG["bw_fittings"], "sort_order": 21},
    {"category": "BW Fittings", "category_slug": "bw-fittings", "name": "180° Return Bend", "subtype": "180° Return",
     "grade": "Multi-grade", "grades": GRADES_BW,
     "standards": ["ASME B16.9"], "sizes": "1/2\" – 24\" NPS",
     "applications": ["Heat exchangers", "Manifolds"], "description": "Long-radius 180° return bend.",
     "image_url": IMG["bw_fittings"], "sort_order": 22},
    {"category": "BW Fittings", "category_slug": "bw-fittings", "name": "Equal Tee", "subtype": "Equal Tee",
     "grade": "Multi-grade", "grades": GRADES_BW,
     "standards": ["ASME B16.9"], "sizes": "1/2\" – 48\" NPS",
     "applications": ["Branching headers"], "description": "Straight-through equal tee.",
     "image_url": IMG["tee"], "featured": True, "sort_order": 23},
    {"category": "BW Fittings", "category_slug": "bw-fittings", "name": "Reducing Tee", "subtype": "Reducing Tee",
     "grade": "Multi-grade", "grades": GRADES_BW,
     "standards": ["ASME B16.9"], "sizes": "1/2\" – 48\" NPS",
     "applications": ["Branching with size change"], "description": "Reducing branch tee.",
     "image_url": IMG["bw_fittings"], "sort_order": 24},
    {"category": "BW Fittings", "category_slug": "bw-fittings", "name": "Concentric Reducer", "subtype": "Concentric Reducer",
     "grade": "Multi-grade", "grades": GRADES_BW,
     "standards": ["ASME B16.9"], "sizes": "1/2\" – 48\" NPS",
     "applications": ["Vertical lines", "Pump suction"], "description": "Coaxial size reducer.",
     "image_url": IMG["bw_fittings"], "sort_order": 25},
    {"category": "BW Fittings", "category_slug": "bw-fittings", "name": "Eccentric Reducer", "subtype": "Eccentric Reducer",
     "grade": "Multi-grade", "grades": GRADES_BW,
     "standards": ["ASME B16.9"], "sizes": "1/2\" – 48\" NPS",
     "applications": ["Horizontal lines", "Drainable runs"], "description": "Off-axis size reducer for horizontal piping.",
     "image_url": IMG["bw_fittings"], "sort_order": 26},
    {"category": "BW Fittings", "category_slug": "bw-fittings", "name": "Cross", "subtype": "Cross",
     "grade": "Multi-grade", "grades": GRADES_BW,
     "standards": ["ASME B16.9"], "sizes": "1/2\" – 24\" NPS",
     "applications": ["4-way junctions"], "description": "Equal and reducing cross.",
     "image_url": IMG["bw_fittings"], "sort_order": 27},
    {"category": "BW Fittings", "category_slug": "bw-fittings", "name": "Cap", "subtype": "Cap",
     "grade": "Multi-grade", "grades": GRADES_BW,
     "standards": ["ASME B16.9"], "sizes": "1/2\" – 48\" NPS",
     "applications": ["Pipe end closures"], "description": "Butt-weld pipe cap.",
     "image_url": IMG["bw_fittings"], "sort_order": 28},
    {"category": "BW Fittings", "category_slug": "bw-fittings", "name": "Stub End (Lap-Joint)", "subtype": "Stub End",
     "grade": "Multi-grade", "grades": GRADES_BW,
     "standards": ["ASME B16.9", "MSS SP-43"], "sizes": "1/2\" – 24\" NPS",
     "applications": ["Lap-joint flange systems"], "description": "Type A / B stub ends for use with lap-joint flanges.",
     "image_url": IMG["bw_fittings"], "sort_order": 29},

    # ---------- FORGED FITTINGS (SW & THREADED) ----------
    {"category": "Forged Fittings", "category_slug": "forged-fittings", "name": "Socket-Weld Elbow 90°", "subtype": "SW 90° Elbow",
     "grade": "Multi-grade", "grades": GRADES_FORGED,
     "standards": ["ASME B16.11"], "sizes": "1/8\" – 4\" NPS, 3000# / 6000# / 9000#",
     "applications": ["Small-bore high-pressure piping"], "description": "Forged socket-weld elbow.",
     "image_url": IMG["forged_fit"], "sort_order": 30},
    {"category": "Forged Fittings", "category_slug": "forged-fittings", "name": "Socket-Weld Tee", "subtype": "SW Tee",
     "grade": "Multi-grade", "grades": GRADES_FORGED,
     "standards": ["ASME B16.11"], "sizes": "1/8\" – 4\" NPS",
     "applications": ["Small-bore high-pressure piping"], "description": "Forged socket-weld equal/reducing tee.",
     "image_url": IMG["forged_fit"], "sort_order": 31},
    {"category": "Forged Fittings", "category_slug": "forged-fittings", "name": "Threaded Coupling", "subtype": "NPT Coupling",
     "grade": "Multi-grade", "grades": GRADES_FORGED,
     "standards": ["ASME B16.11", "ASME B1.20.1"], "sizes": "1/8\" – 4\" NPS",
     "applications": ["Instrument lines", "Utility piping"], "description": "Full / half / reducing threaded coupling.",
     "image_url": IMG["forged_fit"], "sort_order": 32},
    {"category": "Forged Fittings", "category_slug": "forged-fittings", "name": "Union", "subtype": "Union",
     "grade": "Multi-grade", "grades": GRADES_FORGED,
     "standards": ["ASME B16.11"], "sizes": "1/8\" – 4\" NPS",
     "applications": ["Removable joints"], "description": "Forged threaded / socket-weld union.",
     "image_url": IMG["forged_fit"], "sort_order": 33},

    # ---------- FLANGES ----------
    {"category": "Flanges", "category_slug": "flanges", "name": "Weld Neck (WN) Flange", "subtype": "WN",
     "grade": "Multi-grade", "grades": GRADES_FORGED,
     "standards": ["ASME B16.5", "ASME B16.47", "MSS SP-44"],
     "sizes": "1/2\" – 60\", 150# – 2500#", "applications": ["High-pressure piping", "Critical service"],
     "description": "Tapered-hub weld neck flange — preferred for high-cycle and high-temp service.",
     "image_url": IMG["flanges"], "featured": True, "sort_order": 40},
    {"category": "Flanges", "category_slug": "flanges", "name": "Slip-On (SO) Flange", "subtype": "SO",
     "grade": "Multi-grade", "grades": GRADES_FORGED,
     "standards": ["ASME B16.5"], "sizes": "1/2\" – 24\", 150# – 600#",
     "applications": ["General-purpose piping"], "description": "Slip-on flange for ease of fit-up.",
     "image_url": IMG["flange_face"], "sort_order": 41},
    {"category": "Flanges", "category_slug": "flanges", "name": "Blind (BL) Flange", "subtype": "BL",
     "grade": "Multi-grade", "grades": GRADES_FORGED,
     "standards": ["ASME B16.5"], "sizes": "1/2\" – 60\", 150# – 2500#",
     "applications": ["Pipeline pigging", "Vessel access"], "description": "Solid blind flange for line termination.",
     "image_url": IMG["flange_face"], "sort_order": 42},
    {"category": "Flanges", "category_slug": "flanges", "name": "Socket-Weld (SW) Flange", "subtype": "SW",
     "grade": "Multi-grade", "grades": GRADES_FORGED,
     "standards": ["ASME B16.5"], "sizes": "1/2\" – 3\", 150# – 1500#",
     "applications": ["Small-bore high-pressure"], "description": "Socket-weld flange for small-bore piping.",
     "image_url": IMG["flanges"], "sort_order": 43},
    {"category": "Flanges", "category_slug": "flanges", "name": "Lap Joint (LJ) Flange", "subtype": "LJ",
     "grade": "Multi-grade", "grades": GRADES_FORGED,
     "standards": ["ASME B16.5"], "sizes": "1/2\" – 24\"",
     "applications": ["Frequent disassembly", "Stub-end systems"], "description": "Lap-joint flange used with stub ends.",
     "image_url": IMG["flanges"], "sort_order": 44},
    {"category": "Flanges", "category_slug": "flanges", "name": "Threaded Flange", "subtype": "Threaded",
     "grade": "Multi-grade", "grades": GRADES_FORGED,
     "standards": ["ASME B16.5"], "sizes": "1/2\" – 4\"",
     "applications": ["Utility & instrument lines"], "description": "Female-threaded flange for non-welded connections.",
     "image_url": IMG["flanges"], "sort_order": 45},
    {"category": "Flanges", "category_slug": "flanges", "name": "Spectacle Blind / Spacer & Blind", "subtype": "Spectacle / Spacer",
     "grade": "Multi-grade", "grades": GRADES_FORGED,
     "standards": ["ASME B16.48"], "sizes": "1/2\" – 48\"",
     "applications": ["Isolation", "Maintenance"], "description": "Figure-8 spectacle blinds, spacers, and paddle blanks.",
     "image_url": IMG["flange_face"], "sort_order": 46},
    {"category": "Flanges", "category_slug": "flanges", "name": "Long Weld Neck (LWN)", "subtype": "LWN",
     "grade": "Multi-grade", "grades": GRADES_FORGED,
     "standards": ["MSS SP-44", "ASME B16.5"], "sizes": "1/2\" – 24\"",
     "applications": ["Vessel nozzles", "High-pressure outlets"], "description": "Long-tapered weld neck for vessel and column service.",
     "image_url": IMG["flange_face"], "sort_order": 47},

    # ---------- FORGINGS ----------
    {"category": "Forgings", "category_slug": "forgings", "name": "Open-Die Forgings", "subtype": "Open-Die",
     "grade": "Multi-grade", "grades": GRADES_FORGED,
     "standards": ["ASTM A105", "ASTM A350", "ASTM A182"], "sizes": "Up to 30 MT per piece",
     "applications": ["Shafts", "Rings", "Discs"], "description": "Open-die forgings: blocks, shafts, rings.",
     "image_url": IMG["forgings"], "sort_order": 50},
    {"category": "Forgings", "category_slug": "forgings", "name": "Closed-Die Custom Forgings", "subtype": "Closed-Die / Custom",
     "grade": "Multi-grade", "grades": GRADES_FORGED,
     "standards": ["Per drawing"], "sizes": "Per drawing",
     "applications": ["Custom geometries", "Special components"],
     "description": "Closed-die and impression-die custom forgings, machined-to-drawing.",
     "image_url": IMG["forgings"], "featured": True, "sort_order": 51},
    {"category": "Forgings", "category_slug": "forgings", "name": "Forged Rings & Discs", "subtype": "Rings / Discs",
     "grade": "Multi-grade", "grades": GRADES_FORGED,
     "standards": ["ASTM A182", "EN 10222"], "sizes": "OD up to 4 m",
     "applications": ["Wind energy", "Pressure vessels"], "description": "Seamless rolled rings and discs.",
     "image_url": IMG["forgings"], "sort_order": 52},

    # ---------- BARS ----------
    {"category": "Bars", "category_slug": "bars", "name": "Round Bars", "subtype": "Round",
     "grade": "Multi-grade", "grades": GRADES_FERROUS,
     "standards": ["ASTM A276", "ASTM A479", "EN 10088"], "sizes": "Ø 8 mm – Ø 600 mm",
     "applications": ["Machining stock", "Shafts", "Fasteners"], "description": "Hot-rolled / forged / peeled round bars.",
     "image_url": IMG["bars_round"], "sort_order": 60},
    {"category": "Bars", "category_slug": "bars", "name": "Square & Rectangular Bars", "subtype": "Square / Flat",
     "grade": "Multi-grade", "grades": GRADES_FERROUS,
     "standards": ["ASTM A276", "ASTM A484"], "sizes": "10 mm – 250 mm",
     "applications": ["Tooling", "Structural components"], "description": "Square, rectangular and flat bar stock.",
     "image_url": IMG["bars_round"], "sort_order": 61},
    {"category": "Bars", "category_slug": "bars", "name": "Hex Bars", "subtype": "Hex",
     "grade": "Multi-grade", "grades": ["SS 304/316", "Brass", "CS bright bar"],
     "standards": ["ASTM A276"], "sizes": "AF 6 mm – 80 mm",
     "applications": ["Machined fittings", "Fasteners"], "description": "Hexagonal cross-section bars for machining.",
     "image_url": IMG["bars_round"], "sort_order": 62},

    # ---------- SECTIONS ----------
    {"category": "Sections", "category_slug": "sections", "name": "SHS / RHS Hollow Sections", "subtype": "SHS / RHS",
     "grade": "Multi-grade", "grades": ["S235/S355", "ASTM A500", "Duplex 2205", "SS 304/316"],
     "standards": ["EN 10210", "EN 10219", "ASTM A500"], "sizes": "20×20 – 400×400 mm",
     "applications": ["Structural", "Architecture"], "description": "Square and rectangular hollow sections.",
     "image_url": IMG["sections"], "sort_order": 70},
    {"category": "Sections", "category_slug": "sections", "name": "CHS Circular Hollow Sections", "subtype": "CHS",
     "grade": "Multi-grade", "grades": ["S235/S355", "SS 304/316"],
     "standards": ["EN 10210", "ASTM A500"], "sizes": "21.3 – 508 mm OD",
     "applications": ["Structural columns", "Handrails"], "description": "Circular hollow structural sections.",
     "image_url": IMG["sections"], "sort_order": 71},
    {"category": "Sections", "category_slug": "sections", "name": "H-Beams & I-Beams", "subtype": "H-Beam / I-Beam",
     "grade": "Multi-grade", "grades": ["S235/S355", "ASTM A36", "ASTM A992"],
     "standards": ["EN 10025", "ASTM A6"], "sizes": "100 – 900 mm depth",
     "applications": ["Structural framing", "Bridges"], "description": "Hot-rolled / welded H and I sections.",
     "image_url": IMG["h_beams"], "featured": True, "sort_order": 72},
    {"category": "Sections", "category_slug": "sections", "name": "Angles & Channels", "subtype": "Angle / Channel",
     "grade": "Multi-grade", "grades": ["S235/S355", "ASTM A36"],
     "standards": ["EN 10025"], "sizes": "Up to 200 mm",
     "applications": ["Structural fabrication"], "description": "Equal / unequal angles and U/C channels.",
     "image_url": IMG["sections"], "sort_order": 73},

    # ---------- FASTENERS ----------
    {"category": "Fasteners", "category_slug": "fasteners", "name": "Stud Bolts (Double-End)", "subtype": "Stud Bolt",
     "grade": "Multi-grade", "grades": GRADES_FAS_ALL,
     "standards": ["ASME B18.31.2", "ASTM A193 / A320 / F593"],
     "sizes": "M6 – M100 / 1/4\" – 4\"", "applications": ["Flange bolting", "Pressure systems", "Wind energy (10.9)"],
     "description": "Double-ended stud bolts in CS alloy, SS, Duplex, Super Duplex, Inconel, Monel, Titanium.",
     "image_url": IMG["stud_bolts"], "featured": True, "sort_order": 80},
    {"category": "Fasteners", "category_slug": "fasteners", "name": "Hex Bolts", "subtype": "Hex Bolt",
     "grade": "Multi-grade", "grades": GRADES_FAS_ALL,
     "standards": ["ASME B18.2.1", "DIN 931 / 933"],
     "sizes": "M6 – M64 / 1/4\" – 2-1/2\"", "applications": ["Structural", "Mechanical"],
     "description": "Hex-head bolts across all process-industry grades.",
     "image_url": IMG["hex_bolts"], "sort_order": 81},
    {"category": "Fasteners", "category_slug": "fasteners", "name": "Hex Nuts (incl. Heavy & Coupling)", "subtype": "Hex Nut",
     "grade": "Multi-grade", "grades": GRADES_FAS_ALL,
     "standards": ["ASTM A194 (2H/4/7/8)", "ISO 4032", "DIN 934/6915"],
     "sizes": "M6 – M100", "applications": ["With studs / hex bolts"],
     "description": "Standard, heavy hex, and coupling nuts.",
     "image_url": IMG["fasteners"], "sort_order": 82},
    {"category": "Fasteners", "category_slug": "fasteners", "name": "Washers (Flat / Spring / Locking)", "subtype": "Washer",
     "grade": "Multi-grade", "grades": GRADES_FAS_ALL,
     "standards": ["ASTM F436", "DIN 125 / 127"],
     "sizes": "M6 – M64", "applications": ["Bolted joints"],
     "description": "Flat, spring, lock, Belleville and bonded washers.",
     "image_url": IMG["fasteners"], "sort_order": 83},
    {"category": "Fasteners", "category_slug": "fasteners", "name": "Anchor Bolts", "subtype": "Anchor Bolt",
     "grade": "Multi-grade", "grades": ["ASTM F1554 Gr 36/55/105", "Duplex 2205", "SS 316"],
     "standards": ["ASTM F1554"], "sizes": "M12 – M64",
     "applications": ["Foundations", "Equipment skids"], "description": "Headed, hooked, and J-type anchor bolts.",
     "image_url": IMG["fasteners"], "sort_order": 84},
    {"category": "Fasteners", "category_slug": "fasteners", "name": "U-Bolts & Custom Machined Fasteners", "subtype": "U-Bolt / Custom",
     "grade": "Multi-grade", "grades": GRADES_FAS_ALL,
     "standards": ["Per drawing"], "sizes": "Per drawing",
     "applications": ["Pipe supports", "Special clamping"], "description": "U-bolts, eye-bolts, and machined-to-drawing fasteners.",
     "image_url": IMG["fasteners"], "sort_order": 85},
    {"category": "Fasteners", "category_slug": "fasteners", "name": "Coated Fasteners (HDG / PTFE / Zinc Flake)", "subtype": "Coated",
     "grade": "Multi-grade",
     "grades": ["HDG (ASTM F3125)", "PTFE / Xylan (Blue, Red, Green)", "Zinc Flake (Geomet/Dacromet)", "Cadmium / Chromium plated"],
     "standards": ["ASTM F3125", "ASTM B117 (salt spray)", "DIN 50018"],
     "sizes": "Standard fastener sizes",
     "applications": ["Marine", "Oil & gas", "Aerospace", "Wind energy"],
     "description": "Hot-dip galvanised, PTFE/Xylan colour-coded, zinc-flake (Dacromet/Geomet), cad and chrome plated coatings — applied per spec.",
     "image_url": IMG["stud_bolts"], "featured": True, "sort_order": 86},

    # ---------- VALVES ----------
    {"category": "Valves", "category_slug": "valves", "name": "Gate Valves", "subtype": "Gate",
     "grade": "Multi-grade", "grades": ["A216 WCB", "A351 CF8/CF8M", "Duplex CD3MN", "Inconel/Monel"],
     "standards": ["API 600", "API 6D", "BS 1414"], "sizes": "1/2\" – 48\", 150# – 2500#",
     "applications": ["Isolation"], "description": "OS&Y gate valves in CS / SS / Duplex.",
     "image_url": IMG["valves"], "sort_order": 90},
    {"category": "Valves", "category_slug": "valves", "name": "Globe Valves", "subtype": "Globe",
     "grade": "Multi-grade", "grades": ["A216 WCB", "A351 CF8M", "Duplex"],
     "standards": ["BS 1873"], "sizes": "1/2\" – 24\"",
     "applications": ["Throttling"], "description": "Bolted-bonnet globe valves.",
     "image_url": IMG["valves"], "sort_order": 91},
    {"category": "Valves", "category_slug": "valves", "name": "Check Valves", "subtype": "Check",
     "grade": "Multi-grade", "grades": ["A216 WCB", "A351 CF8M"],
     "standards": ["API 6D", "BS 1868"], "sizes": "1/2\" – 36\"",
     "applications": ["Backflow prevention"], "description": "Swing / piston / dual-plate check valves.",
     "image_url": IMG["valves"], "sort_order": 92},
    {"category": "Valves", "category_slug": "valves", "name": "Ball Valves", "subtype": "Ball",
     "grade": "Multi-grade", "grades": ["A216 WCB", "A351 CF8M", "Duplex", "Super Duplex"],
     "standards": ["API 6D", "ISO 17292"], "sizes": "1/2\" – 56\"",
     "applications": ["On/off service", "Pipelines"], "description": "Floating and trunnion-mounted ball valves.",
     "image_url": IMG["valves"], "featured": True, "sort_order": 93},
    {"category": "Valves", "category_slug": "valves", "name": "Butterfly Valves", "subtype": "Butterfly",
     "grade": "Multi-grade", "grades": ["A216 WCB", "A351 CF8M", "Duplex"],
     "standards": ["API 609", "ISO 5752"], "sizes": "2\" – 60\"",
     "applications": ["Large-diameter shut-off"], "description": "Wafer / lugged / double-flanged butterfly valves.",
     "image_url": IMG["valves"], "sort_order": 94},

    # ---------- SPOOLS / PRE-FAB ----------
    {"category": "Spools & Pre-Fab", "category_slug": "spools", "name": "Pipe Spools (Pipe + Flange Welded)", "subtype": "Pre-Fab Spool",
     "grade": "Multi-grade", "grades": GRADES_FERROUS,
     "standards": ["ASME B31.3", "ASME B31.1"], "sizes": "Per isometric",
     "applications": ["Modular construction", "Skid piping"],
     "description": "Shop-fabricated spools — pipe + fittings + flanges welded, NDT'd and ready for site bolt-up.",
     "image_url": IMG["spools"], "featured": True, "sort_order": 100},
    {"category": "Spools & Pre-Fab", "category_slug": "spools", "name": "Manifolds & Headers", "subtype": "Manifold",
     "grade": "Multi-grade", "grades": GRADES_FERROUS,
     "standards": ["ASME B31.3"], "sizes": "Per drawing",
     "applications": ["Pump skids", "Distribution headers"],
     "description": "Welded manifolds and headers fabricated to drawing.",
     "image_url": IMG["spools"], "sort_order": 101},
]


async def seed_admin():
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing is None:
        new_admin = {
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(new_admin)
        log.info(f"Seeded admin user: {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one(
            {"email": ADMIN_EMAIL},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
        )
        log.info(f"Updated admin password for {ADMIN_EMAIL}")


async def seed_products():
    # Detect old schema (material-grouped). If old schema present, wipe and reseed with new product-type taxonomy.
    has_pipes = await db.products.find_one({"category_slug": "pipes"})
    has_old_material_cat = await db.products.find_one({"category_slug": {"$in": ["carbon-steel", "mild-steel", "stainless-steel", "duplex", "high-nickel-alloys", "titanium"]}})
    count = await db.products.count_documents({})

    if has_old_material_cat or (count > 0 and not has_pipes):
        deleted = await db.products.delete_many({})
        log.info(f"Removed {deleted.deleted_count} legacy products (old material-grouped schema)")
        count = 0

    if count > 0:
        return

    docs = []
    for sp in SEED_PRODUCTS:
        p = Product(**sp)
        docs.append(p.model_dump())
    if docs:
        await db.products.insert_many(docs)
        log.info(f"Seeded {len(docs)} products (product-type taxonomy)")


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.products.create_index("id", unique=True)
    await db.products.create_index("category_slug")
    await db.inquiries.create_index("id", unique=True)
    await db.inquiries.create_index("created_at")
    await db.login_attempts.create_index("identifier")
    await seed_admin()
    await seed_products()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# Mount router + middleware
app.include_router(api)
# Static files for uploaded images — accessible at /api/uploads/<filename>
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
