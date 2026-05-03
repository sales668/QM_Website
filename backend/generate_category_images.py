"""
One-time script: generate 10 category-appropriate industrial product photos
via Gemini Nano Banana (gemini-3.1-flash-image-preview), save to /app/backend/uploads/,
and update each product's image_url to its category image.

Usage:  python generate_category_images.py
"""
import asyncio
import os
import base64
import uuid
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

from emergentintegrations.llm.chat import LlmChat, UserMessage  # noqa: E402
from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402

UPLOAD_DIR = ROOT / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]

# Product category → prompt
CATEGORY_PROMPTS = {
    "pipes": "A clean, professional industrial product photograph of a stack of large-diameter seamless steel pipes — bare metal silver-grey finish, freshly machined ends visible, neat horizontal stacking on an industrial warehouse floor, soft daylight, sharp focus, depth of field, no people, no text, photorealistic. 4:3 aspect ratio.",
    "bw-fittings": "A studio product photograph of butt-weld steel pipe fittings — a 90 degree long-radius elbow and a tee fitting in polished stainless steel, bevelled weld ends visible, placed on a matte grey concrete background, soft directional lighting, no people, no text, hyper-realistic detail, 4:3 aspect ratio.",
    "forged-fittings": "A close-up product photograph of small forged stainless-steel socket-weld fittings (couplings, elbows, tees), arranged on a matte dark grey surface, polished surfaces with rolled hex stamping visible, studio lighting from above, no text, photorealistic, 4:3 aspect ratio.",
    "flanges": "An industrial product photograph of a stack of weld-neck steel flanges, bolt-holes visible on the raised face, machined flange faces clean and bright, palletised in an industrial yard, daylight, no people, no text, photorealistic, 4:3 aspect ratio.",
    "forgings": "A close-up photograph of a heavy industrial steel forging — a forged ring or shaft on a workshop floor, rough scaled forged surface fading to a machined bright surface, atmospheric forge-shop lighting, sparks softly out of focus, no people, no text, photorealistic, 4:3 aspect ratio.",
    "bars": "An industrial product photograph of a bundle of round steel bars and square bars, ends cut clean showing the round and square cross-sections, neatly bundled on a steel-stockyard floor, daylight, no people, no text, photorealistic, 4:3 aspect ratio.",
    "sections": "An industrial wide-angle photograph of stacked structural steel H-beams and I-beams in a large warehouse, perspective receding into the distance, daylight from skylights, no people, no text, photorealistic, 4:3 aspect ratio.",
    "fasteners": "A close-up product photograph of industrial stud bolts and heavy hex nuts arranged neatly on a black matte surface — long threaded studs, hex nuts, stainless and black-coated, studio lighting from above, sharp macro detail, no people, no text, photorealistic, 4:3 aspect ratio.",
    "valves": "An industrial product photograph of a large steel gate valve and a ball valve on an oil and gas pipeline, painted blue and silver, flange connections, hand-wheel visible, factory floor background out of focus, daylight, no people, no text, photorealistic, 4:3 aspect ratio.",
    "spools": "An industrial photograph of pre-fabricated stainless-steel pipe spools — pipes welded with elbows and flanges, lined up in a fabrication shop yard, paint markings and heat-numbers visible, daylight, no people, no text, photorealistic, 4:3 aspect ratio.",
}


async def generate_one(slug: str, prompt: str) -> str:
    """Generate one image for a category. Returns saved filename."""
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"qm-img-{slug}-{uuid.uuid4().hex[:6]}",
        system_message="You are a product photographer producing industrial steel product images.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    msg = UserMessage(text=prompt)
    text, images = await chat.send_message_multimodal_response(msg)
    if not images:
        print(f"[{slug}] no image returned. text head: {(text or '')[:120]}")
        return ""
    img = images[0]
    ext = "png" if "png" in img.get("mime_type", "") else "jpg"
    fname = f"cat-{slug}.{ext}"
    fpath = UPLOAD_DIR / fname
    fpath.write_bytes(base64.b64decode(img["data"]))
    print(f"[{slug}] saved → uploads/{fname} ({fpath.stat().st_size} bytes)")
    return fname


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    slug_to_filename = {}
    for slug, prompt in CATEGORY_PROMPTS.items():
        try:
            fname = await generate_one(slug, prompt)
            if fname:
                slug_to_filename[slug] = fname
        except Exception as e:
            print(f"[{slug}] ERROR: {e}")

    # Update each product's image_url to point to its category image (served via /api/uploads/...)
    updated = 0
    for slug, fname in slug_to_filename.items():
        url = f"/api/uploads/{fname}"
        res = await db.products.update_many({"category_slug": slug}, {"$set": {"image_url": url}})
        updated += res.modified_count
        print(f"[{slug}] updated {res.modified_count} products → {url}")
    print(f"\nDone. Generated {len(slug_to_filename)} images, updated {updated} products.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
