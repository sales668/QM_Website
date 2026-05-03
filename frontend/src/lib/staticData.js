import React from "react";

// PRODUCT CATEGORIES = product types (what we sell), NOT material grades
export const CATEGORIES = [
  { slug: "pipes", name: "Pipes", code: "PI", desc: "Seamless, ERW/HFW, HSAW + 3LPP / FBE / DFBE coatings" },
  { slug: "bw-fittings", name: "BW Fittings", code: "BW", desc: "Elbows, tees, reducers, caps, stub ends, crosses" },
  { slug: "forged-fittings", name: "Forged Fittings", code: "FF", desc: "Socket-weld & threaded — elbow, tee, coupling, union" },
  { slug: "flanges", name: "Flanges", code: "FL", desc: "WN, SO, BL, SW, LJ, threaded, spectacle, LWN" },
  { slug: "forgings", name: "Forgings", code: "FG", desc: "Open-die, closed-die, custom forgings, rings & discs" },
  { slug: "bars", name: "Bars", code: "BR", desc: "Round, square, rectangular, flat, hex" },
  { slug: "sections", name: "Sections", code: "SE", desc: "SHS, RHS, CHS, H-beam, I-beam, angles, channels" },
  { slug: "fasteners", name: "Fasteners", code: "FA", desc: "Stud bolts, hex bolts, nuts, washers, anchor & U-bolts (HDG / PTFE / Zinc-flake)" },
  { slug: "valves", name: "Valves", code: "VL", desc: "Gate, globe, check, ball, butterfly" },
  { slug: "spools", name: "Spools & Pre-Fab", code: "SP", desc: "Pipe spools, manifolds, headers — shop-fabricated" },
];

// Material GRADES (cross-cutting filter — every product can come in many of these)
export const ALL_GRADES = [
  "Carbon Steel (A106 / A53 / API 5L)",
  "Low-Temp CS (A333 / A350 LF2)",
  "Alloy Steel (A335 P-grades / A182 F-grades)",
  "Stainless Steel 304 / 304L",
  "Stainless Steel 316 / 316L",
  "Stainless Steel 321 / 321H",
  "Stainless Steel 347 / 347H",
  "Stainless Steel 904L",
  "Duplex 2205 (S32205 / S31803)",
  "Lean Duplex 2101 (S32101)",
  "Super Duplex 2507 (S32750 / S32760)",
  "Inconel 600 / 625 / 718",
  "Incoloy 800H / 825",
  "Hastelloy C-276 / C-22",
  "Monel 400 / K-500",
  "Alloy 20",
  "Titanium Gr 2 / Gr 5",
];

export const INDUSTRIES = [
  { name: "Marine & Shipbuilding", code: "MAR-01", description: "ASTM A131 hulls, 316L piping, Monel marine fasteners — chloride-tested, class-approved.", icon: "Anchor" },
  { name: "Oil & Gas / Offshore", code: "OG-02", description: "Super Duplex 2507, Inconel 625, A333 low-temp pipe for subsea, topside, and process service.", icon: "OilCan" },
  { name: "Petrochemical & Refining", code: "PCR-03", description: "A106 Gr B, A335 P-grades, Incoloy 800H — high-temperature, high-pressure compliant.", icon: "Factory" },
  { name: "Chemical Processing", code: "CHM-04", description: "Hastelloy C-276, Alloy 20, 904L for sulfuric/HCl service and severe corrosion.", icon: "TestTube" },
  { name: "Food, Dairy & Pharma", code: "FDP-05", description: "304L / 316L sanitary tube, BPE/3-A compliant fittings, full traceability.", icon: "ForkKnife" },
  { name: "Structural Engineering", code: "STR-06", description: "A36, IS 2062, lean duplex SHS/RHS for load-bearing and infrastructure projects.", icon: "Buildings" },
];

export const SERVICES = [
  {
    code: "SVC-01",
    title: "Material Sourcing",
    summary: "One-stop supply across pipes, fittings, flanges, fasteners, sections.",
    bullets: [
      "Flexible sourcing from China, India & Europe",
      "Approved manufacturer network",
      "Class-approved & specification-compliant",
      "Mixed-item container loading",
    ],
  },
  {
    code: "SVC-02",
    title: "Contract Manufacturing & Custom Forgings",
    summary: "Partnered fabrication, machining and forging capacity.",
    bullets: [
      "Custom open- and closed-die forgings",
      "BW & forged fittings on demand",
      "Drawing & BOM-driven supply",
      "Pre-fab pipe spools — pipe + flanges welded",
    ],
  },
  {
    code: "SVC-03",
    title: "Coatings — 3LPP, FBE, DFBE & Internal Epoxy",
    summary: "Anti-corrosion coatings for buried & sour-service pipelines.",
    bullets: [
      "3LPP three-layer polypropylene (DIN 30670)",
      "FBE fusion-bonded epoxy (AWWA C213)",
      "DFBE dual-layer FBE for abrasion resistance",
      "Internal flow-coat epoxy",
      "Fastener coatings: HDG, PTFE/Xylan, Zinc Flake (Geomet/Dacromet)",
    ],
  },
  {
    code: "SVC-04",
    title: "Quality, Testing & Inspection",
    summary: "Independent verification and full traceability.",
    bullets: [
      "EN 10204 3.1 / 3.2 certification",
      "Positive Material Identification (PMI)",
      "Mechanical & chemical testing",
      "SGS / BV / TÜV third-party inspection",
      "Heat number traceability throughout supply chain",
    ],
  },
  {
    code: "SVC-05",
    title: "Logistics & Project Supply",
    summary: "Engineered packing for global, project-grade delivery.",
    bullets: [
      "Seaworthy & VCI packing",
      "Project-wise tagging & colour coding",
      "Mixed-item container loading",
      "Door-to-door global logistics",
    ],
  },
];

export const STANDARDS = [
  "ASTM", "ASME", "API", "EN", "DIN", "AS-NZ", "ISO", "MSS-SP",
];

export const COMPLIANCE_HIGHLIGHTS = [
  { code: "Q-01", title: "EN 10204 3.1 / 3.2", desc: "Mill test certificates with full traceability — heat number, chemistry, mechanicals, and inspector sign-off." },
  { code: "Q-02", title: "Positive Material Identification (PMI)", desc: "On-site XRF verification of grade and chemistry before dispatch — no surprises at site." },
  { code: "Q-03", title: "Independent Inspection", desc: "Third-party witness by SGS, Bureau Veritas or TÜV — release notes per project specification." },
  { code: "Q-04", title: "Class-Approved Material", desc: "DNV, Lloyd's, ABS, and equivalent class society approvals where the project demands it." },
  { code: "Q-05", title: "Heat Number Traceability", desc: "Hard-stamped, paint-marked, and document-linked from mill to final delivery." },
];
