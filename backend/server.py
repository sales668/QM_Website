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

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
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
    category: str               # e.g. "Stainless Steel"
    category_slug: str          # e.g. "stainless-steel"
    name: str                   # e.g. "316L Stainless Steel"
    grade: str                  # e.g. "316L"
    standards: List[str] = []   # ["ASTM A312", "ASME SA240"]
    forms: List[str] = []       # ["Pipes", "Plates"]
    applications: List[str] = []
    description: str = ""
    featured: bool = False
    sort_order: int = 100
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ProductCreate(BaseModel):
    category: str
    category_slug: str
    name: str
    grade: str
    standards: List[str] = []
    forms: List[str] = []
    applications: List[str] = []
    description: str = ""
    featured: bool = False
    sort_order: int = 100


class ProductUpdate(BaseModel):
    category: Optional[str] = None
    category_slug: Optional[str] = None
    name: Optional[str] = None
    grade: Optional[str] = None
    standards: Optional[List[str]] = None
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
@api.post("/auth/login", response_model=AuthOut)
async def login(payload: LoginIn, request: Request, response: Response):
    email = payload.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
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
SEED_PRODUCTS = [
    # Carbon Steel
    {"category": "Carbon Steel", "category_slug": "carbon-steel", "name": "ASTM A106 Gr B Pipes", "grade": "A106 Gr B",
     "standards": ["ASTM A106", "ASME SA106"], "forms": ["Seamless Pipes", "Tubes"],
     "applications": ["High-temp service", "Boiler", "Refinery piping"],
     "description": "Seamless carbon steel pipe for high-temperature service.", "featured": True, "sort_order": 10},
    {"category": "Carbon Steel", "category_slug": "carbon-steel", "name": "ASTM A516 Gr 60/70 Plates", "grade": "A516 Gr 70",
     "standards": ["ASTM A516", "ASME SA516"], "forms": ["Plates", "Sheets"],
     "applications": ["Pressure vessels", "Boilers", "Storage tanks"],
     "description": "Carbon steel pressure vessel plate, fine-grain practice.", "featured": True, "sort_order": 11},
    {"category": "Carbon Steel", "category_slug": "carbon-steel", "name": "ASTM A36 Structural Steel", "grade": "A36",
     "standards": ["ASTM A36"], "forms": ["Plates", "Bars", "Structural sections"],
     "applications": ["Structural", "General fabrication"], "description": "General-purpose carbon structural steel.", "sort_order": 12},
    {"category": "Carbon Steel", "category_slug": "carbon-steel", "name": "ASTM A333 Low-Temp Pipes", "grade": "A333 Gr 6",
     "standards": ["ASTM A333"], "forms": ["Seamless Pipes"],
     "applications": ["Cryogenic", "Low-temperature service"], "description": "Seamless and welded steel pipe for low-temperature service.", "sort_order": 13},

    # Mild Steel
    {"category": "Mild Steel", "category_slug": "mild-steel", "name": "IS 2062 Structural Plates", "grade": "IS 2062 E250",
     "standards": ["IS 2062", "ASTM A283"], "forms": ["Plates", "Angles", "Channels", "Beams"],
     "applications": ["Structural fabrication", "Frames", "Supports"], "description": "Hot-rolled mild steel for general structural use.", "sort_order": 20},

    # Stainless Steel
    {"category": "Stainless Steel", "category_slug": "stainless-steel", "name": "304 / 304L Stainless", "grade": "304L",
     "standards": ["ASTM A312", "ASTM A240", "ASME SA240"], "forms": ["Pipes", "Tubes", "Plates", "Sheets", "Coils", "Bars"],
     "applications": ["Food & dairy", "Process piping", "Architectural"],
     "description": "General-purpose austenitic stainless with low carbon for weldability.", "featured": True, "sort_order": 30},
    {"category": "Stainless Steel", "category_slug": "stainless-steel", "name": "316 / 316L Stainless", "grade": "316L",
     "standards": ["ASTM A312", "ASTM A240", "ASME SA240"], "forms": ["Pipes", "Tubes", "Plates", "Sheets", "Flanges", "Fittings"],
     "applications": ["Marine", "Chemical processing", "Pharma"],
     "description": "Molybdenum-bearing austenitic stainless with superior chloride pitting resistance.", "featured": True, "sort_order": 31},
    {"category": "Stainless Steel", "category_slug": "stainless-steel", "name": "310 / 310S Heat-Resistant", "grade": "310S",
     "standards": ["ASTM A240"], "forms": ["Plates", "Sheets", "Pipes"],
     "applications": ["Furnace components", "Heat treatment fixtures"], "description": "High-chromium nickel grade for elevated temperature service.", "sort_order": 32},
    {"category": "Stainless Steel", "category_slug": "stainless-steel", "name": "321 / 321H Stabilized", "grade": "321H",
     "standards": ["ASTM A312"], "forms": ["Pipes", "Tubes"],
     "applications": ["High-temperature piping", "Aircraft exhaust"], "description": "Titanium-stabilized austenitic for intergranular corrosion resistance.", "sort_order": 33},
    {"category": "Stainless Steel", "category_slug": "stainless-steel", "name": "904L Super Austenitic", "grade": "904L",
     "standards": ["ASTM B677", "UNS N08904"], "forms": ["Pipes", "Plates", "Bars"],
     "applications": ["Sulphuric acid", "Aggressive chemicals"], "description": "Low-carbon, high-Cr-Ni-Mo austenitic for severe corrosion.", "sort_order": 34},

    # Duplex
    {"category": "Duplex & Super Duplex", "category_slug": "duplex", "name": "Duplex 2205", "grade": "UNS S32205 / S31803",
     "standards": ["ASTM A790", "ASTM A240"], "forms": ["Pipes", "Tubes", "Plates", "Bars", "Flanges", "Fasteners", "SHS", "RHS"],
     "applications": ["Marine piping", "Offshore", "Chemical plants", "Pressure systems"],
     "description": "Workhorse duplex stainless balancing strength and corrosion resistance.", "featured": True, "sort_order": 40},
    {"category": "Duplex & Super Duplex", "category_slug": "duplex", "name": "Lean Duplex 2101", "grade": "UNS S32101",
     "standards": ["ASTM A240"], "forms": ["Plates", "Pipes", "Bars"],
     "applications": ["Structural", "Process applications"], "description": "Cost-effective lean duplex with improved corrosion resistance.", "sort_order": 41},
    {"category": "Duplex & Super Duplex", "category_slug": "duplex", "name": "Super Duplex 2507", "grade": "UNS S32750 / S32760",
     "standards": ["ASTM A790", "ASTM A182"], "forms": ["Pipes", "Tubes", "Plates", "Forged Fittings", "Flanges"],
     "applications": ["Subsea", "Seawater systems", "Desalination", "Oil & gas"],
     "description": "Super duplex for highly aggressive chloride environments.", "featured": True, "sort_order": 42},

    # High Nickel Alloys
    {"category": "High Nickel Alloys", "category_slug": "high-nickel-alloys", "name": "Inconel 625", "grade": "UNS N06625",
     "standards": ["ASTM B443", "ASTM B444"], "forms": ["Pipes", "Plates", "Bars", "Fittings"],
     "applications": ["Marine piping", "Aerospace", "Chemical"], "description": "High-strength nickel-chromium-molybdenum alloy with excellent corrosion resistance.", "featured": True, "sort_order": 50},
    {"category": "High Nickel Alloys", "category_slug": "high-nickel-alloys", "name": "Incoloy 800/800H", "grade": "UNS N08800 / N08810",
     "standards": ["ASTM B407", "ASTM B408"], "forms": ["Pipes", "Tubes", "Plates", "Bars"],
     "applications": ["Furnaces", "Petrochemical", "Heat exchangers"], "description": "Iron-nickel-chromium for elevated temperature strength and oxidation resistance.", "sort_order": 51},
    {"category": "High Nickel Alloys", "category_slug": "high-nickel-alloys", "name": "Incoloy 825", "grade": "UNS N08825",
     "standards": ["ASTM B423"], "forms": ["Pipes", "Tubes", "Plates"],
     "applications": ["Acid service", "Seawater", "Offshore"], "description": "Nickel-iron-chromium with Mo and Cu for acid/seawater corrosion resistance.", "sort_order": 52},
    {"category": "High Nickel Alloys", "category_slug": "high-nickel-alloys", "name": "Hastelloy C-276", "grade": "UNS N10276",
     "standards": ["ASTM B575", "ASTM B619"], "forms": ["Plates", "Pipes", "Fittings"],
     "applications": ["Chemical processing", "Pharma", "FGD"], "description": "Excellent pitting and crevice corrosion resistance in oxidizing/reducing media.", "sort_order": 53},
    {"category": "High Nickel Alloys", "category_slug": "high-nickel-alloys", "name": "Monel 400 / K-500", "grade": "UNS N04400 / N05500",
     "standards": ["ASTM B164", "ASTM B127"], "forms": ["Bars", "Pipes", "Fasteners"],
     "applications": ["Marine", "Pumps", "Marine fasteners"], "description": "Nickel-copper alloy with outstanding seawater corrosion resistance.", "sort_order": 54},
    {"category": "High Nickel Alloys", "category_slug": "high-nickel-alloys", "name": "Alloy 20", "grade": "UNS N08020",
     "standards": ["ASTM B463"], "forms": ["Pipes", "Plates"],
     "applications": ["Sulfuric acid piping", "Chemical"], "description": "Nickel-iron-chromium alloy specifically designed for sulfuric acid.", "sort_order": 55},

    # Titanium
    {"category": "Titanium Alloys", "category_slug": "titanium", "name": "Titanium Grade 2", "grade": "UNS R50400",
     "standards": ["ASTM B265", "ASTM B338"], "forms": ["Plates", "Tubes", "Bars"],
     "applications": ["Heat exchangers", "Marine", "Chemical"], "description": "Commercially pure titanium with excellent corrosion resistance.", "sort_order": 60},
    {"category": "Titanium Alloys", "category_slug": "titanium", "name": "Titanium Grade 5 (Ti-6Al-4V)", "grade": "UNS R56400",
     "standards": ["ASTM B348", "ASTM B381"], "forms": ["Bars", "Plates", "Forgings"],
     "applications": ["Aerospace", "High-strength components"], "description": "Workhorse titanium alpha-beta alloy with high strength-to-weight.", "sort_order": 61},

    # Fasteners
    {"category": "Fasteners", "category_slug": "fasteners", "name": "ASTM A193 B7 Stud Bolts", "grade": "B7",
     "standards": ["ASTM A193"], "forms": ["Stud bolts", "Hex bolts", "Nuts"],
     "applications": ["High-strength bolting", "Pressure flanges"], "description": "Alloy steel stud bolts for high-temperature, high-pressure service.", "sort_order": 70},
    {"category": "Fasteners", "category_slug": "fasteners", "name": "ASTM A320 L7 Low-Temp Bolts", "grade": "L7",
     "standards": ["ASTM A320"], "forms": ["Stud bolts", "Hex bolts"],
     "applications": ["Low-temperature service", "Cryogenic"], "description": "Low-temperature alloy steel bolting.", "sort_order": 71},
    {"category": "Fasteners", "category_slug": "fasteners", "name": "Duplex 2205 Fasteners", "grade": "UNS S32205",
     "standards": ["ASTM F593", "ASTM F594"], "forms": ["Stud bolts", "Hex bolts", "Nuts", "Anchor bolts"],
     "applications": ["Marine", "Offshore", "Chemical plants"], "description": "Duplex fasteners for chloride-rich corrosive environments.", "sort_order": 72},
    {"category": "Fasteners", "category_slug": "fasteners", "name": "Super Duplex 2507 Fasteners", "grade": "UNS S32750",
     "standards": ["ASTM F593"], "forms": ["Stud bolts", "Hex bolts", "Nuts"],
     "applications": ["Subsea", "Desalination", "Aggressive chloride"], "description": "Super duplex fasteners for the most aggressive marine service.", "sort_order": 73},
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
    count = await db.products.count_documents({})
    if count > 0:
        return
    docs = []
    for sp in SEED_PRODUCTS:
        p = Product(**sp)
        docs.append(p.model_dump())
    if docs:
        await db.products.insert_many(docs)
        log.info(f"Seeded {len(docs)} products")


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
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
