/**
 * Pre-bundled realistic sample quizzes with diagrams/illustrations
 * so users can test immediately without uploading a document.
 */

// High quality embedded SVG diagrams for immediate visual demonstration
const SAMPLE_DIAGRAMS = {
  cellDiagram: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
    <defs>
      <radialGradient id="cellGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="%231e3a8a" stop-opacity="0.3"/>
        <stop offset="70%" stop-color="%233b82f6" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="%2360a5fa" stop-opacity="0.4"/>
      </radialGradient>
      <linearGradient id="mitoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%23f97316"/>
        <stop offset="100%" stop-color="%23ea580c"/>
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="%230f172a" rx="16"/>
    <!-- Outer Cell Membrane -->
    <path d="M 120,200 C 120,100 200,60 320,70 C 440,80 500,130 510,210 C 520,300 430,350 300,345 C 180,340 120,300 120,200 Z" fill="url(%23cellGrad)" stroke="%2338bdf8" stroke-width="4" stroke-dasharray="6,3"/>
    <text x="310" y="45" fill="%2338bdf8" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">TYPICAL EUKARYOTIC CELL DIAGRAM</text>
    
    <!-- Nucleus -->
    <circle cx="280" cy="200" r="65" fill="%234338ca" stroke="%23818cf8" stroke-width="3"/>
    <circle cx="270" cy="195" r="30" fill="%23312e81" stroke="%23a5b4fc" stroke-width="2"/>
    <text x="280" y="240" fill="%23e0e7ff" font-size="12" font-family="sans-serif" text-anchor="middle">Nucleus</text>
    <text x="270" y="200" fill="%23cbd5e1" font-size="10" font-family="sans-serif" text-anchor="middle">Nucleolus</text>

    <!-- Mitochondria (Target of Question) -->
    <g transform="translate(400, 150) rotate(25)">
      <ellipse cx="0" cy="0" rx="42" ry="22" fill="url(%23mitoGrad)" stroke="%23fb923c" stroke-width="2.5"/>
      <path d="M -30,0 Q -15,-12 0,0 T 30,0" fill="none" stroke="%23ffedd5" stroke-width="2.5"/>
      <circle cx="0" cy="0" r="3" fill="%23ffffff"/>
    </g>
    <!-- Arrow & Label [A] -->
    <line x1="480" y1="120" x2="425" y2="145" stroke="%23f43f5e" stroke-width="2.5" marker-end="url(%23arrow)"/>
    <rect x="475" y="100" width="90" height="28" rx="6" fill="%23e11d48"/>
    <text x="520" y="119" fill="%23ffffff" font-size="13" font-family="sans-serif" font-weight="bold" text-anchor="middle">Organelle [X]</text>

    <!-- Ribosomes & Endoplasmic Reticulum -->
    <path d="M 210,180 Q 180,160 175,220 T 195,260" fill="none" stroke="%2310b981" stroke-width="4" stroke-linecap="round"/>
    <text x="160" y="280" fill="%2334d479" font-size="11" font-family="sans-serif">Rough ER</text>

    <!-- Golgi apparatus -->
    <path d="M 330,290 C 360,285 370,305 400,295" fill="none" stroke="%23ec4899" stroke-width="5" stroke-linecap="round"/>
    <path d="M 335,305 C 365,300 375,320 405,310" fill="none" stroke="%23ec4899" stroke-width="4" stroke-linecap="round"/>
    <text x="410" y="325" fill="%23f472b6" font-size="11" font-family="sans-serif">Golgi Body</text>
  </svg>`,

  logicGateDiagram: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" width="100%" height="100%">
    <rect width="600" height="320" fill="%23090d16" rx="16"/>
    <text x="300" y="40" fill="%2338bdf8" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">DIGITAL LOGIC CIRCUIT ANALYSIS</text>
    
    <!-- Input A -->
    <line x1="80" y1="100" x2="220" y2="100" stroke="%2338bdf8" stroke-width="4"/>
    <rect x="50" y="85" width="45" height="30" rx="4" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/>
    <text x="72" y="106" fill="%2338bdf8" font-size="14" font-weight="bold" text-anchor="middle">A=1</text>

    <!-- Input B -->
    <line x1="80" y1="160" x2="220" y2="160" stroke="%2338bdf8" stroke-width="4"/>
    <rect x="50" y="145" width="45" height="30" rx="4" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/>
    <text x="72" y="166" fill="%2338bdf8" font-size="14" font-weight="bold" text-anchor="middle">B=0</text>

    <!-- XOR Gate Body -->
    <path d="M 215,85 C 230,110 230,150 215,175" fill="none" stroke="%23a855f7" stroke-width="4"/>
    <path d="M 225,85 C 240,110 240,150 225,175 C 255,175 285,155 305,130 C 285,105 255,85 225,85 Z" fill="%233b0764" stroke="%23a855f7" stroke-width="3"/>
    <text x="255" y="135" fill="%23e9d5ff" font-size="13" font-weight="bold" text-anchor="middle">XOR</text>

    <!-- Gate Output to AND Gate -->
    <line x1="305" y1="130" x2="380" y2="130" stroke="%2310b981" stroke-width="4"/>
    <text x="345" y="120" fill="%2334d399" font-size="12" font-weight="bold">Output 1</text>

    <!-- Input C -->
    <line x1="80" y1="220" x2="380" y2="220" stroke="%2338bdf8" stroke-width="4"/>
    <rect x="50" y="205" width="45" height="30" rx="4" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/>
    <text x="72" y="226" fill="%2338bdf8" font-size="14" font-weight="bold" text-anchor="middle">C=1</text>

    <!-- AND Gate Body -->
    <path d="M 380,110 L 415,110 C 445,110 455,145 455,175 C 455,205 445,240 415,240 L 380,240 Z" fill="%23064e3b" stroke="%2310b981" stroke-width="3"/>
    <text x="410" y="180" fill="%23a7f3d0" font-size="13" font-weight="bold" text-anchor="middle">AND</text>

    <!-- Final Output Q -->
    <line x1="455" y1="175" x2="520" y2="175" stroke="%23f59e0b" stroke-width="4"/>
    <circle cx="535" cy="175" r="18" fill="%23b45309" stroke="%23fbbf24" stroke-width="3"/>
    <text x="535" y="181" fill="%23ffffff" font-size="15" font-weight="bold" text-anchor="middle">Q</text>
    <text x="535" y="220" fill="%23fbbf24" font-size="13" font-weight="bold" text-anchor="middle">Output ?</text>
  </svg>`,

  solarSystemDiagram: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 320" width="100%" height="100%">
    <rect width="650" height="320" fill="%23030712" rx="16"/>
    <!-- Stars Background -->
    <circle cx="45" cy="40" r="1.5" fill="%23fff" opacity="0.8"/>
    <circle cx="150" cy="80" r="1" fill="%23fff" opacity="0.6"/>
    <circle cx="280" cy="30" r="2" fill="%23fff" opacity="0.9"/>
    <circle cx="420" cy="65" r="1.5" fill="%23fff" opacity="0.7"/>
    <circle cx="560" cy="45" r="1" fill="%23fff" opacity="0.8"/>
    <circle cx="590" cy="270" r="2" fill="%23fff" opacity="0.9"/>
    <circle cx="120" cy="280" r="1.5" fill="%23fff" opacity="0.5"/>
    
    <!-- Sun -->
    <circle cx="0" cy="160" r="70" fill="%23f59e0b" stroke="%23fbbf24" stroke-width="6"/>
    <text x="35" y="165" fill="%2378350f" font-size="14" font-weight="bold">SUN</text>

    <!-- Orbits and Planets -->
    <!-- Mercury -->
    <circle cx="110" cy="160" r="6" fill="%2394a3b8"/>
    <text x="110" y="190" fill="%2394a3b8" font-size="10" text-anchor="middle">Mercury</text>

    <!-- Venus -->
    <circle cx="160" cy="160" r="10" fill="%23f97316"/>
    <text x="160" y="190" fill="%23fed7aa" font-size="10" text-anchor="middle">Venus</text>

    <!-- Earth -->
    <circle cx="225" cy="160" r="12" fill="%230284c7" stroke="%2338bdf8" stroke-width="1.5"/>
    <circle cx="220" cy="157" r="4" fill="%2322c55e"/>
    <text x="225" y="190" fill="%23bae6fd" font-size="10" text-anchor="middle">Earth</text>

    <!-- Mars -->
    <circle cx="290" cy="160" r="8" fill="%23dc2626"/>
    <text x="290" y="190" fill="%23fca5a5" font-size="10" text-anchor="middle">Mars</text>

    <!-- Highlighted Mystery Giant Planet [Target] -->
    <g transform="translate(390, 160)">
      <circle cx="0" cy="0" r="32" fill="%23ea580c" stroke="%23fdba74" stroke-width="2"/>
      <ellipse cx="0" cy="0" rx="55" ry="10" fill="none" stroke="%23fed7aa" stroke-width="5" stroke-opacity="0.75"/>
      <text x="0" y="5" fill="%23ffffff" font-size="16" font-weight="bold" text-anchor="middle">?</text>
    </g>
    <rect x="345" y="60" width="90" height="28" rx="6" fill="%238b5cf6"/>
    <text x="390" y="79" fill="%23ffffff" font-size="12" font-weight="bold" text-anchor="middle">Planet [P]</text>
    <line x1="390" y1="90" x2="390" y2="120" stroke="%238b5cf6" stroke-width="2" stroke-dasharray="3,3"/>

    <!-- Saturn / Uranus / Neptune -->
    <circle cx="510" cy="160" r="22" fill="%23065f46" stroke="%2334d399" stroke-width="2"/>
    <text x="510" y="200" fill="%23a7f3d0" font-size="10" text-anchor="middle">Uranus</text>

    <circle cx="590" cy="160" r="20" fill="%231e40af" stroke="%2360a5fa" stroke-width="2"/>
    <text x="590" y="200" fill="%23bfdbfe" font-size="10" text-anchor="middle">Neptune</text>
  </svg>`
};

const DEFAULT_SAMPLE_QUIZZES = [
  {
    id: "general-science-sample",
    title: "General Science & Visual Analysis Exam",
    description: "A comprehensive practice quiz covering Biology, Digital Logic, Astronomy, and General Science with embedded diagrams.",
    category: "Science & Engineering",
    timeLimitMinutes: 15,
    questions: [
      {
        id: 1,
        question: "Refer to the eukaryotic cell diagram below. What is the primary function of the organelle labeled [X]?",
        image: SAMPLE_DIAGRAMS.cellDiagram,
        imageCaption: "Figure 1.1: Eukaryotic Cell Structure Diagram",
        options: [
          "Synthesis of proteins and packaging for vesicle export",
          "Generation of ATP chemical energy via cellular respiration (Powerhouse)",
          "Storage of genetic DNA and regulation of gene transcription",
          "Degradation of cellular waste via hydrolytic enzymes"
        ],
        correctAnswer: 1, // B (0-indexed: 1)
        explanation: "The organelle highlighted as [X] with inner cristae folds is the Mitochondrion. Mitochondria are known as the powerhouse of the cell because they generate most of the chemical energy needed to power the cell's biochemical reactions (ATP)."
      },
      {
        id: 2,
        question: "Based on the Digital Logic circuit provided in the diagram, if Input A = 1, Input B = 0, and Input C = 1, what is the final logic value of Output Q?",
        image: SAMPLE_DIAGRAMS.logicGateDiagram,
        imageCaption: "Figure 1.2: Two-stage Combinational Logic Circuit",
        options: [
          "Q = 0 (LOW voltage state)",
          "Q = 1 (HIGH voltage state)",
          "Q = High Impedance (Z)",
          "Q = Undefined oscillation"
        ],
        correctAnswer: 1, // B
        explanation: "1) First stage is an XOR gate with inputs A=1 and B=0. 1 XOR 0 = 1. So Output 1 = 1.\n2) Second stage is an AND gate with inputs (Output 1 = 1) and (C = 1). 1 AND 1 = 1.\nTherefore, the final output Q is 1."
      },
      {
        id: 3,
        question: "Which organelle in plant cells is responsible for carrying out photosynthesis to produce glucose?",
        image: null,
        options: [
          "Ribosome",
          "Chloroplast",
          "Vacuole",
          "Centrosome"
        ],
        correctAnswer: 1, // B
        explanation: "Chloroplasts contain chlorophyll pigments and thylakoid membranes that absorb solar photons to convert carbon dioxide and water into glucose through photosynthesis."
      },
      {
        id: 4,
        question: "Examine the planetary diagram. Identify the planet labeled [P] which is famous for its prominent planetary ring system and is the second largest planet in our solar system:",
        image: SAMPLE_DIAGRAMS.solarSystemDiagram,
        imageCaption: "Figure 1.3: Solar System Planetary Overview",
        options: [
          "Jupiter",
          "Saturn",
          "Mars",
          "Venus"
        ],
        correctAnswer: 1, // B
        explanation: "The planet [P] positioned between Jupiter and Uranus with broad prominent rings is Saturn. Saturn is the 6th planet from the Sun and the second largest in the Solar System."
      },
      {
        id: 5,
        question: "What is the SI unit of electric resistance?",
        image: null,
        options: [
          "Ampere (A)",
          "Volt (V)",
          "Ohm (Ω)",
          "Watt (W)"
        ],
        correctAnswer: 2, // C
        explanation: "The Ohm (symbol: Ω) is the SI unit of electrical resistance, named after German physicist Georg Simon Ohm (Ohm's Law: V = I * R)."
      },
      {
        id: 6,
        question: "In computer science, which data structure operates strictly on a First-In, First-Out (FIFO) principle?",
        image: null,
        options: [
          "Stack (LIFO)",
          "Queue (FIFO)",
          "Binary Search Tree",
          "Hash Map"
        ],
        correctAnswer: 1, // B
        explanation: "A Queue operates on the First-In, First-Out (FIFO) principle where elements are inserted at the back (enqueue) and removed from the front (dequeue)."
      },
      {
        id: 7,
        question: "What chemical element has the atomic number 1 on the Periodic Table and is the most abundant chemical substance in the universe?",
        image: null,
        options: [
          "Helium (He)",
          "Oxygen (O)",
          "Hydrogen (H)",
          "Carbon (C)"
        ],
        correctAnswer: 2, // C
        explanation: "Hydrogen has atomic number 1, 1 proton, and constitutes roughly 75% of all baryonic mass in the universe."
      }
    ]
  }
];

if (typeof window !== 'undefined') {
  window.DEFAULT_SAMPLE_QUIZZES = DEFAULT_SAMPLE_QUIZZES;
}
