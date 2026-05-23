export interface SupplementGuideEntry {
  id: string;
  name: string;
  emoji: string;
  category: string;
  shortDesc: string;
  benefits: string[];
  dosage: string;
  timing: string;
  sideEffects: string[];
  tip: string;
}

export const SUPPLEMENT_CATEGORIES: string[] = [
  "Protein & Amino Acids",
  "Creatine & Strength",
  "Pre-Workout & Energy",
  "Fat Loss",
  "Recovery & Sleep",
  "Vitamins & Minerals",
  "Hormonal & Adaptogens",
  "Joint & Bone Health",
];

export const SUPPLEMENT_GUIDE: SupplementGuideEntry[] = [
  // ─── Protein & Amino Acids ───────────────────────────────────────────────
  {
    id: "whey",
    name: "Whey Protein",
    emoji: "🥛",
    category: "Protein & Amino Acids",
    shortDesc:
      "A fast-digesting complete protein derived from milk, ideal for muscle repair and growth. It contains all essential amino acids and is highly bioavailable.",
    benefits: [
      "Stimulates muscle protein synthesis rapidly after training",
      "Provides all 9 essential amino acids in optimal ratios",
      "Supports lean muscle gain and helps preserve muscle during fat loss",
      "Convenient way to hit daily protein targets",
    ],
    dosage: "20–40g per serving",
    timing: "Within 30–60 minutes post-workout, or between meals to meet protein goals",
    sideEffects: [
      "May cause bloating or digestive discomfort in lactose-sensitive individuals",
      "Excessive intake can contribute to kidney strain in those with pre-existing kidney issues",
      "Some flavored products contain high amounts of artificial sweeteners",
    ],
    tip: "Choose whey isolate over concentrate if you are lactose intolerant — it has had most of the lactose removed.",
  },
  {
    id: "casein",
    name: "Casein Protein",
    emoji: "🌙",
    category: "Protein & Amino Acids",
    shortDesc:
      "A slow-digesting milk protein that forms a gel in the stomach, releasing amino acids steadily over 5–7 hours. Best used to prevent muscle breakdown during fasting periods.",
    benefits: [
      "Provides a sustained release of amino acids for up to 7 hours",
      "Reduces muscle protein breakdown overnight",
      "Promotes greater overnight muscle protein synthesis compared to no protein",
      "High calcium content supports bone health",
    ],
    dosage: "25–40g per serving",
    timing: "Before bed or during long periods without food",
    sideEffects: [
      "Can cause bloating or gas, especially in lactose-sensitive individuals",
      "Thicker texture may be less palatable than whey",
      "Not suitable for those with a milk protein allergy",
    ],
    tip: "Mix casein with water rather than milk before bed to keep calories in check while still getting its slow-release benefits.",
  },
  {
    id: "plant_protein",
    name: "Plant Protein",
    emoji: "🌿",
    category: "Protein & Amino Acids",
    shortDesc:
      "A vegan-friendly protein sourced from peas, rice, hemp, or blends. Blending multiple plant sources creates a complete amino acid profile comparable to whey.",
    benefits: [
      "Suitable for vegans and those with dairy or egg allergies",
      "Blended plant proteins offer a complete essential amino acid profile",
      "Generally easier to digest than whey for sensitive individuals",
      "Often contains additional fiber and micronutrients from plant sources",
    ],
    dosage: "25–40g per serving",
    timing: "Post-workout or anytime as a meal supplement",
    sideEffects: [
      "Some plant proteins have a gritty or earthy taste and texture",
      "Individual sources (e.g., pea alone) may be low in certain amino acids like methionine",
      "May contain higher levels of heavy metals if sourced poorly — choose tested brands",
    ],
    tip: "Look for a blend of pea and rice protein to ensure all essential amino acids are covered in adequate amounts.",
  },
  {
    id: "bcaa",
    name: "BCAA",
    emoji: "💊",
    category: "Protein & Amino Acids",
    shortDesc:
      "Branched-Chain Amino Acids (leucine, isoleucine, valine) are key triggers of muscle protein synthesis. Most useful when training fasted or when total protein intake is low.",
    benefits: [
      "Leucine directly activates the mTOR pathway to stimulate muscle growth",
      "Reduces exercise-induced muscle soreness and fatigue",
      "Helps preserve muscle mass during caloric deficits",
      "Can be used during training without disrupting a fasted state significantly",
    ],
    dosage: "5–10g per serving (2:1:1 leucine:isoleucine:valine ratio)",
    timing: "During or immediately before fasted training",
    sideEffects: [
      "Largely redundant if total daily protein intake is already sufficient",
      "Excess intake may compete with tryptophan absorption, potentially affecting mood",
      "Some products contain artificial dyes and sweeteners",
    ],
    tip: "If you eat enough total protein daily, BCAAs add little extra benefit — prioritize whole food protein sources first.",
  },
  {
    id: "eaa",
    name: "EAA — Essential Amino Acids",
    emoji: "🔬",
    category: "Protein & Amino Acids",
    shortDesc:
      "Essential Amino Acids include all 9 amino acids the body cannot synthesize on its own. EAAs are superior to BCAAs alone for muscle protein synthesis.",
    benefits: [
      "Provides all 9 EAAs needed for complete muscle protein synthesis",
      "More effective than BCAAs alone at stimulating anabolism",
      "Useful for fasted training or periods between meals",
      "Supports recovery, immune function, and enzyme production",
    ],
    dosage: "10–15g per serving",
    timing: "Intra-workout or between meals when whole protein intake is limited",
    sideEffects: [
      "May cause mild nausea if consumed in large amounts on an empty stomach",
      "Often more expensive than BCAA products",
      "Unnecessary if adequate complete protein is consumed throughout the day",
    ],
    tip: "EAAs are a better investment than BCAAs if you train fasted — they provide the full anabolic stimulus BCAAs alone cannot.",
  },
  {
    id: "glutamine",
    name: "L-Glutamine",
    emoji: "🔄",
    category: "Protein & Amino Acids",
    shortDesc:
      "The most abundant amino acid in the body, glutamine plays a key role in gut integrity, immune function, and muscle recovery — especially after intense or prolonged exercise.",
    benefits: [
      "Supports gut lining integrity and reduces intestinal permeability",
      "Fuels immune cells, reducing illness risk during heavy training phases",
      "May reduce delayed onset muscle soreness (DOMS) after intense sessions",
      "Assists glycogen replenishment when carbohydrate availability is low",
    ],
    dosage: "5–10g per day",
    timing: "Post-workout or before bed",
    sideEffects: [
      "Generally very well tolerated at recommended doses",
      "Very high doses (>40g/day) may cause gastrointestinal discomfort",
      "Not recommended for individuals with certain liver or kidney conditions",
    ],
    tip: "Glutamine is most beneficial for athletes doing multiple training sessions per week or those under significant physical stress.",
  },

  // ─── Creatine & Strength ─────────────────────────────────────────────────
  {
    id: "creatine",
    name: "Creatine Monohydrate",
    emoji: "💪",
    category: "Creatine & Strength",
    shortDesc:
      "The most researched performance supplement in existence. Creatine increases phosphocreatine stores in muscle, enabling more ATP production during high-intensity efforts.",
    benefits: [
      "Increases maximal strength and power output by 5–15%",
      "Enhances high-intensity exercise capacity and sprint performance",
      "Promotes muscle cell volumization, supporting hypertrophy",
      "Emerging research supports cognitive benefits and neuroprotection",
    ],
    dosage: "3–5g per day (no loading phase required)",
    timing: "Any time of day — consistency matters more than timing",
    sideEffects: [
      "May cause water retention in muscle tissue (this is beneficial, not fat gain)",
      "Rare reports of stomach cramps when taken in large doses without adequate water",
      "Individuals with kidney disease should consult a doctor before use",
    ],
    tip: "There is no need to cycle creatine — take 3–5g daily year-round and stay well hydrated to maximize its benefits.",
  },
  {
    id: "beta_alanine",
    name: "Beta-Alanine",
    emoji: "⚡",
    category: "Creatine & Strength",
    shortDesc:
      "A non-essential amino acid that raises muscle carnosine levels, buffering lactic acid during high-intensity exercise and delaying muscular fatigue.",
    benefits: [
      "Increases muscle carnosine concentrations, improving acid buffering capacity",
      "Delays muscular fatigue during sets lasting 60–240 seconds",
      "Improves performance in high-intensity interval training",
      "Synergistic with creatine for endurance-based strength work",
    ],
    dosage: "3.2–6.4g per day (split into multiple doses to reduce tingling)",
    timing: "Pre-workout or split throughout the day",
    sideEffects: [
      "Causes paresthesia (harmless tingling/flushing sensation) in most users",
      "Takes 4–6 weeks of daily use to meaningfully elevate muscle carnosine",
      "Higher single doses intensify the tingling — split doses to minimise it",
    ],
    tip: "Split your daily dose into 1.6g portions taken 3–4 times throughout the day to minimize the tingling sensation without reducing effectiveness.",
  },
  {
    id: "citrulline",
    name: "Citrulline Malate",
    emoji: "🍉",
    category: "Creatine & Strength",
    shortDesc:
      "An amino acid that converts to arginine in the kidneys, boosting nitric oxide production. This widens blood vessels, improving blood flow and nutrient delivery to muscles.",
    benefits: [
      "Increases nitric oxide production for enhanced muscle pumps and vasodilation",
      "Reduces fatigue and soreness, enabling more volume per session",
      "Improves oxygen and nutrient delivery to working muscles",
      "More effective than arginine at raising blood arginine levels",
    ],
    dosage: "6–8g per day (as citrulline malate 2:1)",
    timing: "30–60 minutes before training",
    sideEffects: [
      "May cause mild stomach discomfort at high doses",
      "Can lower blood pressure — use caution if you take antihypertensive medications",
      "Some users report mild headaches at the start of supplementation",
    ],
    tip: "Take citrulline malate on an empty stomach 45 minutes before your workout for maximum vasodilation and pump during training.",
  },

  // ─── Pre-Workout & Energy ─────────────────────────────────────────────────
  {
    id: "caffeine",
    name: "Caffeine",
    emoji: "☕",
    category: "Pre-Workout & Energy",
    shortDesc:
      "The world's most widely used stimulant, caffeine blocks adenosine receptors to reduce perceived fatigue and enhance focus, endurance, and strength performance.",
    benefits: [
      "Improves endurance performance by reducing perceived exertion",
      "Enhances strength output and peak power during resistance training",
      "Sharpens mental focus, alertness, and reaction time",
      "Increases fat oxidation rates during aerobic exercise",
    ],
    dosage: "150–300mg per session (3–6mg/kg body weight)",
    timing: "30–45 minutes before training; avoid within 6 hours of sleep",
    sideEffects: [
      "Regular use builds tolerance — cycle off periodically to restore sensitivity",
      "Can disrupt sleep quality and increase anxiety at high doses",
      "May cause elevated heart rate, jitteriness, or GI upset in sensitive individuals",
    ],
    tip: "Take a 1–2 week caffeine break every 6–8 weeks to reset your tolerance and restore its full performance-enhancing effects.",
  },
  {
    id: "preworkout",
    name: "Pre-Workout Blend",
    emoji: "🔥",
    category: "Pre-Workout & Energy",
    shortDesc:
      "A multi-ingredient formula typically combining caffeine, citrulline, beta-alanine, and other compounds to amplify energy, focus, pump, and workout performance.",
    benefits: [
      "Provides a synergistic blend of energy, pump, and endurance ingredients",
      "Improves motivation and mental drive going into a training session",
      "Boosts muscular endurance and reduces perceived fatigue",
      "Convenient single product replacing multiple separate supplements",
    ],
    dosage: "1 serving (typically 10–20g powder) per session",
    timing: "20–30 minutes before training",
    sideEffects: [
      "High stimulant content can cause anxiety, elevated heart rate, or crashes",
      "Many blends use proprietary matrices — exact ingredient doses may be hidden",
      "Not suitable for caffeine-sensitive individuals or those with cardiovascular conditions",
    ],
    tip: "Always check the label for caffeine content and avoid stacking with other stimulants — many blends already contain 200–400mg per serving.",
  },

  // ─── Fat Loss ─────────────────────────────────────────────────────────────
  {
    id: "cla",
    name: "CLA — Conjugated Linoleic Acid",
    emoji: "🔻",
    category: "Fat Loss",
    shortDesc:
      "A naturally occurring fatty acid found in meat and dairy that has been studied for its modest effects on reducing body fat and preserving lean muscle during a caloric deficit.",
    benefits: [
      "Modestly reduces body fat percentage over time when combined with a deficit",
      "May help preserve lean muscle mass during weight loss phases",
      "Has antioxidant and anti-inflammatory properties",
      "Supports immune function through fatty acid signaling pathways",
    ],
    dosage: "3–6g per day with meals",
    timing: "Split across 2–3 meals throughout the day",
    sideEffects: [
      "Can cause digestive upset, loose stools, or nausea, especially when starting out",
      "High doses may negatively affect blood lipid profiles in some individuals",
      "Effects on fat loss are modest — should not replace diet and exercise",
    ],
    tip: "CLA's fat loss effect is small on its own — treat it as a support tool alongside a caloric deficit, not a primary fat loss strategy.",
  },
  {
    id: "carnitine",
    name: "L-Carnitine",
    emoji: "🚀",
    category: "Fat Loss",
    shortDesc:
      "An amino acid derivative that shuttles long-chain fatty acids into the mitochondria for oxidation. It supports fat burning during aerobic exercise and aids recovery.",
    benefits: [
      "Facilitates transport of fatty acids into mitochondria for energy production",
      "May improve exercise recovery and reduce muscle soreness",
      "Supports heart health and cardiovascular function",
      "Can enhance fat oxidation during moderate-intensity cardio",
    ],
    dosage: "1–3g per day",
    timing: "30 minutes before cardio or meals, ideally with carbohydrates to enhance uptake",
    sideEffects: [
      "High doses can cause fishy body odor due to TMAO production",
      "May cause nausea or diarrhea at doses above 3g",
      "Emerging research links high TMAO from carnitine to cardiovascular risks — stay within recommended doses",
    ],
    tip: "Take L-carnitine with a carbohydrate-containing meal to significantly increase its uptake into muscle tissue via insulin signaling.",
  },
  {
    id: "green_tea",
    name: "Green Tea Extract",
    emoji: "🍵",
    category: "Fat Loss",
    shortDesc:
      "A concentrated source of catechins (especially EGCG) and caffeine that synergistically boost fat oxidation and metabolic rate, with added antioxidant benefits.",
    benefits: [
      "EGCG inhibits catechol-O-methyltransferase, prolonging norepinephrine's fat-burning effect",
      "Mildly increases resting metabolic rate by 3–4%",
      "Rich in antioxidants that combat oxidative stress from training",
      "Supports cardiovascular health and blood sugar regulation",
    ],
    dosage: "400–500mg EGCG per day (standardized to ≥45% EGCG)",
    timing: "With meals — morning or before cardio",
    sideEffects: [
      "Contains caffeine — may disrupt sleep if taken late in the day",
      "High doses taken on an empty stomach can cause nausea or liver stress",
      "May interact with blood thinners and certain medications",
    ],
    tip: "Choose a decaffeinated green tea extract if you are already using caffeine pre-workout to avoid stacking stimulants unintentionally.",
  },
  {
    id: "thermogenic",
    name: "Thermogenic Blend",
    emoji: "🌡️",
    category: "Fat Loss",
    shortDesc:
      "A multi-ingredient fat-loss formula combining stimulants, thermogenics, and metabolic boosters to increase calorie expenditure and suppress appetite.",
    benefits: [
      "Increases thermogenesis and daily caloric expenditure",
      "Suppresses appetite, making caloric restriction more manageable",
      "Enhances fat mobilization and oxidation during exercise",
      "Provides energy and focus, which can improve training output during a deficit",
    ],
    dosage: "1–2 servings per day as directed on label",
    timing: "Morning and optionally early afternoon; never within 6 hours of bedtime",
    sideEffects: [
      "Stimulant-heavy formulas can cause anxiety, rapid heartbeat, and high blood pressure",
      "Habituation and tolerance develop quickly, reducing effectiveness over time",
      "Some products contain synephrine or yohimbine, which require caution in sensitive individuals",
    ],
    tip: "Cycle thermogenics 8 weeks on, 4 weeks off to prevent tolerance and give your adrenal system a break.",
  },

  // ─── Recovery & Sleep ─────────────────────────────────────────────────────
  {
    id: "melatonin",
    name: "Melatonin",
    emoji: "😴",
    category: "Recovery & Sleep",
    shortDesc:
      "A hormone naturally produced by the pineal gland that regulates the sleep-wake cycle. Supplemental melatonin helps reset circadian rhythms and improve sleep onset.",
    benefits: [
      "Reduces time to fall asleep (sleep onset latency)",
      "Helps re-synchronize circadian rhythm after shift work or jet lag",
      "Improves overall sleep quality and duration at low doses",
      "Supports GH release indirectly by improving deep sleep quality",
    ],
    dosage: "0.5–3mg per night (lower doses are often as effective as higher ones)",
    timing: "30–60 minutes before intended sleep time",
    sideEffects: [
      "Morning grogginess or drowsiness if taken too late or in high doses",
      "May cause vivid dreams in some individuals",
      "Long-term high-dose use may suppress the body's natural melatonin production",
    ],
    tip: "Start with the lowest effective dose (0.5mg) rather than the commonly sold 10mg — lower doses work just as well with far fewer side effects.",
  },
  {
    id: "zma",
    name: "ZMA",
    emoji: "⭐",
    category: "Recovery & Sleep",
    shortDesc:
      "A combination of zinc, magnesium aspartate, and vitamin B6 formulated to support overnight recovery, hormonal balance, and sleep quality in athletes.",
    benefits: [
      "Replenishes zinc and magnesium commonly depleted through sweat during training",
      "Supports natural testosterone levels in zinc-deficient individuals",
      "Improves sleep quality and promotes deeper, more restorative sleep stages",
      "Enhances overnight muscle recovery and protein synthesis",
    ],
    dosage: "1 serving (typically 30mg zinc, 450mg magnesium, 10.5mg B6) nightly",
    timing: "30–60 minutes before bed on an empty stomach",
    sideEffects: [
      "High zinc intake can cause nausea on an empty stomach",
      "Excess zinc long-term can interfere with copper absorption",
      "Magnesium may cause loose stools — start with a lower dose if needed",
    ],
    tip: "Take ZMA away from calcium-rich foods or dairy, as calcium competes with zinc and magnesium for absorption.",
  },
  {
    id: "magnesium_supp",
    name: "Magnesium",
    emoji: "🧲",
    category: "Recovery & Sleep",
    shortDesc:
      "An essential mineral involved in over 300 enzymatic reactions, including muscle contraction, protein synthesis, and energy production. Most people are deficient.",
    benefits: [
      "Supports muscle relaxation and reduces nighttime cramps",
      "Involved in ATP synthesis — essential for all energy-dependent processes",
      "Improves sleep quality and reduces anxiety when deficiency is corrected",
      "Supports cardiovascular health and healthy blood pressure",
    ],
    dosage: "200–400mg elemental magnesium per day",
    timing: "Before bed for sleep benefits; with meals to reduce GI discomfort",
    sideEffects: [
      "Can cause loose stools or diarrhea at high doses (especially magnesium oxide form)",
      "Very high doses may lower blood pressure excessively",
      "May interact with certain antibiotics and medications — space them apart",
    ],
    tip: "Choose magnesium glycinate or magnesium threonate for best absorption and minimal laxative effect compared to magnesium oxide.",
  },
  {
    id: "omega3",
    name: "Omega-3 Fish Oil",
    emoji: "🐟",
    category: "Recovery & Sleep",
    shortDesc:
      "A rich source of EPA and DHA fatty acids with powerful anti-inflammatory effects. Omega-3s support heart health, joint recovery, brain function, and muscle protein synthesis.",
    benefits: [
      "Reduces systemic inflammation and exercise-induced muscle soreness",
      "Supports cardiovascular health by improving lipid profiles and arterial function",
      "Enhances muscle protein synthesis when combined with resistance training",
      "Promotes brain health, mood regulation, and cognitive function",
    ],
    dosage: "2–3g combined EPA+DHA per day",
    timing: "With meals to improve absorption and reduce fishy burps",
    sideEffects: [
      "May cause fishy aftertaste or burps — refrigerating capsules reduces this",
      "Blood-thinning properties at high doses — consult a doctor if on anticoagulants",
      "Poor-quality products may be oxidized and pro-inflammatory — choose tested brands",
    ],
    tip: "Look for the total EPA+DHA content on the label, not just 'fish oil' — you may need 3–4 capsules to reach 2–3g of active fatty acids.",
  },

  // ─── Vitamins & Minerals ──────────────────────────────────────────────────
  {
    id: "vitamin_d3",
    name: "Vitamin D3",
    emoji: "☀️",
    category: "Vitamins & Minerals",
    shortDesc:
      "A fat-soluble vitamin synthesized through sun exposure that regulates calcium absorption, immune function, hormonal health, and muscle function. Deficiency is extremely common.",
    benefits: [
      "Supports calcium absorption and bone mineralization",
      "Regulates immune function and reduces risk of respiratory illness",
      "Optimizes testosterone levels and hormonal health in deficient individuals",
      "Improves muscle function, reducing fall and injury risk",
    ],
    dosage: "2,000–5,000 IU per day (test blood levels to personalize)",
    timing: "With the largest meal of the day (fat-soluble — requires dietary fat for absorption)",
    sideEffects: [
      "Toxicity is possible at very high doses (>10,000 IU/day long-term) — monitor blood levels",
      "Hypercalcemia symptoms: nausea, weakness, frequent urination — rare at standard doses",
      "Should be paired with vitamin K2 to direct calcium to bones and away from arteries",
    ],
    tip: "Pair vitamin D3 with vitamin K2 (MK-7 form) to ensure calcium is deposited in bones rather than soft tissues.",
  },
  {
    id: "vitamin_c",
    name: "Vitamin C",
    emoji: "🍊",
    category: "Vitamins & Minerals",
    shortDesc:
      "A water-soluble antioxidant essential for collagen synthesis, immune defense, and iron absorption. Athletes may have higher needs due to increased oxidative stress.",
    benefits: [
      "Potent antioxidant that neutralizes free radicals generated by intense exercise",
      "Essential for collagen synthesis — supports tendons, ligaments, and skin",
      "Enhances non-heme iron absorption from plant-based foods",
      "Supports immune function and may reduce duration of colds",
    ],
    dosage: "500–1,000mg per day",
    timing: "With meals; split into two doses for better absorption",
    sideEffects: [
      "Doses above 2,000mg/day commonly cause diarrhea and GI distress",
      "May interfere with copper absorption at very high doses",
      "Kidney stone risk (oxalate) may increase with very high long-term doses in susceptible individuals",
    ],
    tip: "Take vitamin C with iron-rich plant foods to dramatically improve non-heme iron absorption — a practical nutrition strategy for vegetarians.",
  },
  {
    id: "multivitamin",
    name: "Multivitamin",
    emoji: "💊",
    category: "Vitamins & Minerals",
    shortDesc:
      "A broad-spectrum formula covering essential micronutrients to fill dietary gaps. Useful for athletes with restricted diets or high training volumes that increase micronutrient needs.",
    benefits: [
      "Provides a baseline of essential vitamins and minerals to cover dietary gaps",
      "Supports energy metabolism through B vitamins and coenzymes",
      "Helps maintain immune function during periods of heavy training",
      "Reduces risk of micronutrient deficiencies that impair performance and health",
    ],
    dosage: "1–2 servings per day as directed on label",
    timing: "With food to improve absorption and prevent stomach upset",
    sideEffects: [
      "Iron-containing formulas can cause constipation or GI discomfort",
      "Fat-soluble vitamins (A, D, E, K) can accumulate — avoid mega-dosed products",
      "Some ingredients may interact with medications — check with a pharmacist",
    ],
    tip: "A multivitamin is insurance, not a replacement for a varied diet — prioritize whole foods and use it to fill specific gaps.",
  },
  {
    id: "zinc",
    name: "Zinc",
    emoji: "⚙️",
    category: "Vitamins & Minerals",
    shortDesc:
      "An essential trace mineral involved in immune defense, testosterone synthesis, protein synthesis, and wound healing. Athletes frequently lose zinc through sweat.",
    benefits: [
      "Supports testosterone production and male reproductive health",
      "Critical for immune cell development and antiviral defense",
      "Involved in protein synthesis and wound healing",
      "Acts as an antioxidant co-factor in superoxide dismutase enzyme",
    ],
    dosage: "15–30mg elemental zinc per day",
    timing: "With a meal to reduce nausea; not with iron or calcium supplements",
    sideEffects: [
      "Nausea and vomiting if taken on an empty stomach",
      "Long-term high doses (>50mg/day) deplete copper — supplement copper alongside zinc if using high doses",
      "May reduce absorption of certain antibiotics and medications",
    ],
    tip: "Zinc bisglycinate or zinc picolinate forms are absorbed significantly better than zinc oxide — check the form on your supplement label.",
  },
  {
    id: "iron",
    name: "Iron",
    emoji: "🩸",
    category: "Vitamins & Minerals",
    shortDesc:
      "An essential mineral central to red blood cell production and oxygen transport. Iron deficiency is the most common nutritional deficiency, especially in female athletes and endurance athletes.",
    benefits: [
      "Essential for hemoglobin and myoglobin production — critical for oxygen delivery",
      "Deficiency correction dramatically improves endurance capacity and reduces fatigue",
      "Supports energy metabolism as a co-factor in the electron transport chain",
      "Required for healthy immune function and thyroid hormone production",
    ],
    dosage: "18mg/day (RDA); therapeutic: 100–200mg/day elemental iron under medical supervision",
    timing: "On an empty stomach with vitamin C for best absorption; away from calcium and coffee",
    sideEffects: [
      "Commonly causes constipation, nausea, and dark stools",
      "Iron overload is toxic — only supplement if deficiency is confirmed by blood test",
      "May interact with thyroid medications and certain antibiotics",
    ],
    tip: "Always confirm iron deficiency with a serum ferritin blood test before supplementing — excess iron is harmful and supplementing without deficiency is unnecessary.",
  },

  // ─── Hormonal & Adaptogens ────────────────────────────────────────────────
  {
    id: "ashwagandha",
    name: "Ashwagandha",
    emoji: "🌱",
    category: "Hormonal & Adaptogens",
    shortDesc:
      "An Ayurvedic adaptogenic root (Withania somnifera) clinically shown to lower cortisol, reduce stress and anxiety, and support testosterone levels in men under physical stress.",
    benefits: [
      "Reduces cortisol levels by up to 30%, blunting the physiological stress response",
      "Clinically shown to increase testosterone and luteinizing hormone in men",
      "Improves exercise performance, VO2 max, and recovery capacity",
      "Reduces anxiety and improves subjective well-being and sleep quality",
    ],
    dosage: "300–600mg standardized root extract (≥5% withanolides) per day",
    timing: "With meals; can be split morning and evening or taken before bed",
    sideEffects: [
      "May cause drowsiness — avoid driving if sensitive",
      "Rare reports of liver injury at very high doses — stick to recommended amounts",
      "Not recommended during pregnancy or for those with autoimmune conditions",
    ],
    tip: "Look for KSM-66 or Sensoril branded ashwagandha extracts — these are the most studied and standardized forms with clinical evidence behind them.",
  },
  {
    id: "rhodiola",
    name: "Rhodiola Rosea",
    emoji: "🌸",
    category: "Hormonal & Adaptogens",
    shortDesc:
      "An Arctic adaptogenic herb that enhances mental and physical performance under stress, reduces fatigue, and supports mood — particularly effective during intense training blocks.",
    benefits: [
      "Reduces physical and mental fatigue, improving endurance performance",
      "Enhances cognitive function and focus under stress",
      "Exhibits antidepressant-like effects by modulating serotonin and dopamine",
      "Speeds recovery between training sessions by reducing oxidative stress",
    ],
    dosage: "200–600mg standardized extract (3% rosavins, 1% salidroside) per day",
    timing: "Morning or 30 minutes before training, on an empty stomach",
    sideEffects: [
      "Can cause agitation, irritability, or insomnia at high doses",
      "May have mild stimulant properties — avoid late-day use",
      "Quality varies widely — choose products with standardized active compounds",
    ],
    tip: "Cycle rhodiola rosea (6 weeks on, 2 weeks off) as evidence suggests its adaptogenic effects are stronger when not taken continuously.",
  },
  {
    id: "tongkat_ali",
    name: "Tongkat Ali",
    emoji: "🌿",
    category: "Hormonal & Adaptogens",
    shortDesc:
      "A Southeast Asian medicinal root (Eurycoma longifolia) traditionally used to support male hormonal health. Research shows it can increase free testosterone by reducing sex hormone-binding globulin (SHBG).",
    benefits: [
      "Increases free testosterone by inhibiting SHBG binding",
      "Improves libido, sexual health, and reproductive function in men",
      "Reduces cortisol-to-testosterone ratio, supporting recovery and body composition",
      "Enhances muscle strength and lean body mass over time",
    ],
    dosage: "200–400mg standardized extract (≥40% glycosaponins) per day",
    timing: "Morning with or without food",
    sideEffects: [
      "May cause restlessness or mild insomnia in sensitive individuals",
      "Not well studied in women — avoid during pregnancy",
      "May interact with diabetes medications due to blood sugar-lowering properties",
    ],
    tip: "Choose Tongkat Ali products standardized to eurycomanone content (≥1%) and glycosaponin percentage to ensure potency and purity.",
  },

  // ─── Joint & Bone Health ──────────────────────────────────────────────────
  {
    id: "collagen",
    name: "Collagen Peptides",
    emoji: "🦴",
    category: "Joint & Bone Health",
    shortDesc:
      "Hydrolyzed collagen provides amino acids (glycine, proline, hydroxyproline) that stimulate the body's own collagen synthesis in tendons, ligaments, cartilage, and skin.",
    benefits: [
      "Supports tendon and ligament collagen synthesis when taken before exercise",
      "Reduces joint pain and stiffness in athletes with overuse injuries",
      "Improves skin elasticity and hydration",
      "Contains high glycine content, which supports sleep and gut health",
    ],
    dosage: "10–15g per day",
    timing: "30–60 minutes before exercise for joint benefit; anytime for skin/gut benefits",
    sideEffects: [
      "May cause mild digestive upset or feelings of fullness",
      "Not a complete protein — lacks tryptophan, so should not replace whey",
      "Quality varies — sourcing matters (bovine vs. marine); check for third-party testing",
    ],
    tip: "Take collagen peptides with 50mg of vitamin C 30–60 minutes before training — vitamin C is a required co-factor for collagen synthesis in tendons.",
  },
  {
    id: "glucosamine",
    name: "Glucosamine",
    emoji: "🔩",
    category: "Joint & Bone Health",
    shortDesc:
      "A natural compound found in cartilage that supports joint structure, reduces inflammation, and may slow the degradation of cartilage in individuals with joint wear.",
    benefits: [
      "Provides precursors for cartilage matrix components (glycosaminoglycans)",
      "Reduces joint pain and stiffness, particularly in the knees",
      "May slow cartilage breakdown in osteoarthritis when used long-term",
      "Often combined with chondroitin for synergistic joint protection effects",
    ],
    dosage: "1,500mg glucosamine sulfate per day",
    timing: "With meals, split into 2–3 doses; benefits take 4–8 weeks to appear",
    sideEffects: [
      "May cause mild nausea, heartburn, or diarrhea in some individuals",
      "Shellfish-derived glucosamine is not suitable for shellfish allergy sufferers (look for vegan/fermented versions)",
      "May affect blood sugar regulation — diabetics should monitor glucose levels",
    ],
    tip: "Give glucosamine at least 8–12 weeks at the full 1,500mg/day dose before assessing effectiveness — results are slow but meaningful for chronic joint issues.",
  },
  {
    id: "calcium",
    name: "Calcium + D3",
    emoji: "🦷",
    category: "Joint & Bone Health",
    shortDesc:
      "The primary mineral for bone density and strength, calcium works synergistically with vitamin D3 (for absorption) and vitamin K2 (for bone deposition) to maintain skeletal health.",
    benefits: [
      "Essential for bone mineralization and maintaining bone density",
      "Supports muscle contraction, nerve signaling, and blood clotting",
      "Pairing with D3 increases absorption by up to 30–40%",
      "Reduces risk of stress fractures in high-impact sport athletes",
    ],
    dosage: "1,000–1,200mg elemental calcium per day (from food + supplements combined)",
    timing: "Split into 500mg doses with meals — the gut cannot absorb more than 500mg at once",
    sideEffects: [
      "Excessive intake (>2,500mg/day) may increase cardiovascular risk via arterial calcification",
      "Can cause constipation — increase fluid and fiber intake when supplementing",
      "Calcium carbonate requires stomach acid — take with food; calcium citrate can be taken any time",
    ],
    tip: "Get as much calcium from food (dairy, fortified foods, leafy greens) as possible and use supplements only to bridge remaining gaps — food-based calcium carries fewer risks.",
  },
];
