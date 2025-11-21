// Comprehensive Chapter and Topic Structure for JEE and NEET

export const CHAPTERS_TOPICS = {
  Physics: [
    {
      chapter: "Mechanics",
      topics: ["Kinematics", "Laws of Motion", "Work Energy Power", "Circular Motion", "Rotational Motion", "Gravitation", "Simple Harmonic Motion"]
    },
    {
      chapter: "Electrostatics",
      topics: ["Electric Charges and Fields", "Electric Potential", "Capacitance", "Gauss Law"]
    },
    {
      chapter: "Current Electricity",
      topics: ["Ohm's Law", "Kirchhoff's Laws", "RC Circuits", "Wheatstone Bridge", "Meter Bridge"]
    },
    {
      chapter: "Magnetic Effects of Current",
      topics: ["Biot-Savart Law", "Ampere's Law", "Magnetic Field", "Force on Moving Charges", "Torque on Current Loop"]
    },
    {
      chapter: "Electromagnetic Induction",
      topics: ["Faraday's Law", "Lenz Law", "Self Induction", "Mutual Induction", "AC Circuits"]
    },
    {
      chapter: "Optics",
      topics: ["Ray Optics", "Reflection", "Refraction", "Lens", "Prism", "Wave Optics", "Interference", "Diffraction", "Polarization"]
    },
    {
      chapter: "Modern Physics",
      topics: ["Photoelectric Effect", "Bohr Model", "X-rays", "Nuclear Physics", "Radioactivity", "Semiconductors"]
    },
    {
      chapter: "Thermodynamics",
      topics: ["Zeroth Law", "First Law", "Second Law", "Carnot Engine", "Heat Transfer", "Kinetic Theory of Gases"]
    },
    {
      chapter: "Waves and Sound",
      topics: ["Wave Motion", "Sound Waves", "Doppler Effect", "Standing Waves", "Resonance"]
    },
    {
      chapter: "Oscillations",
      topics: ["Simple Harmonic Motion", "Spring Mass System", "Pendulum", "Energy in SHM"]
    }
  ],
  Chemistry: [
    {
      chapter: "Physical Chemistry",
      topics: ["Atomic Structure", "Chemical Bonding", "Thermodynamics", "Chemical Equilibrium", "Ionic Equilibrium", "Redox Reactions", "Electrochemistry"]
    },
    {
      chapter: "Organic Chemistry",
      topics: ["Hydrocarbons", "Alkanes", "Alkenes", "Alkynes", "Aromatic Compounds", "Haloalkanes", "Alcohols", "Aldehydes", "Ketones", "Carboxylic Acids", "Amines"]
    },
    {
      chapter: "Inorganic Chemistry",
      topics: ["Periodic Table", "s-Block Elements", "p-Block Elements", "d-Block Elements", "f-Block Elements", "Coordination Compounds", "Chemical Bonding"]
    },
    {
      chapter: "Solutions",
      topics: ["Types of Solutions", "Concentration", "Raoult's Law", "Colligative Properties", "Henry's Law"]
    },
    {
      chapter: "States of Matter",
      topics: ["Gaseous State", "Liquid State", "Solid State", "Gas Laws", "Kinetic Theory"]
    },
    {
      chapter: "Chemical Kinetics",
      topics: ["Rate of Reaction", "Order of Reaction", "Half Life", "Activation Energy", "Collision Theory"]
    },
    {
      chapter: "Surface Chemistry",
      topics: ["Adsorption", "Colloids", "Emulsions", "Catalysis"]
    },
    {
      chapter: "Metallurgy",
      topics: ["Extraction of Metals", "Refining", "Alloys", "Corrosion"]
    }
  ],
  Mathematics: [
    {
      chapter: "Algebra",
      topics: ["Complex Numbers", "Quadratic Equations", "Sequences and Series", "Permutations and Combinations", "Binomial Theorem", "Matrices", "Determinants"]
    },
    {
      chapter: "Calculus",
      topics: ["Limits", "Continuity", "Differentiability", "Derivatives", "Applications of Derivatives", "Integration", "Definite Integrals", "Indefinite Integrals", "Area Under Curves"]
    },
    {
      chapter: "Coordinate Geometry",
      topics: ["Straight Lines", "Circles", "Parabola", "Ellipse", "Hyperbola", "3D Geometry", "Direction Cosines"]
    },
    {
      chapter: "Trigonometry",
      topics: ["Trigonometric Ratios", "Identities", "Equations", "Inverse Trigonometry", "Heights and Distances"]
    },
    {
      chapter: "Vectors",
      topics: ["Vector Addition", "Dot Product", "Cross Product", "Scalar Triple Product", "Vector Triple Product"]
    },
    {
      chapter: "Probability",
      topics: ["Basic Probability", "Conditional Probability", "Bayes Theorem", "Random Variables", "Distributions"]
    },
    {
      chapter: "Statistics",
      topics: ["Mean", "Median", "Mode", "Standard Deviation", "Variance", "Correlation"]
    },
    {
      chapter: "Differential Equations",
      topics: ["Formation", "Solution of DE", "First Order DE", "Second Order DE", "Applications"]
    }
  ],
  Biology: [
    {
      chapter: "Cell Biology",
      topics: ["Cell Structure", "Cell Organelles", "Cell Division", "Mitosis", "Meiosis", "Cell Cycle"]
    },
    {
      chapter: "Genetics",
      topics: ["Mendel's Laws", "Chromosomal Theory", "DNA Structure", "DNA Replication", "Gene Expression", "Genetic Disorders"]
    },
    {
      chapter: "Evolution",
      topics: ["Origin of Life", "Darwin's Theory", "Natural Selection", "Speciation", "Human Evolution"]
    },
    {
      chapter: "Plant Physiology",
      topics: ["Photosynthesis", "Respiration", "Plant Growth", "Plant Hormones", "Transpiration", "Mineral Nutrition"]
    },
    {
      chapter: "Human Physiology",
      topics: ["Digestion", "Respiration", "Circulation", "Excretion", "Nervous System", "Endocrine System", "Reproduction"]
    },
    {
      chapter: "Ecology",
      topics: ["Ecosystem", "Food Chain", "Energy Flow", "Biogeochemical Cycles", "Population Ecology", "Biodiversity", "Conservation"]
    },
    {
      chapter: "Biotechnology",
      topics: ["Genetic Engineering", "rDNA Technology", "PCR", "Gene Therapy", "Cloning", "Transgenic Organisms"]
    },
    {
      chapter: "Diversity of Living Organisms",
      topics: ["Classification", "Five Kingdom System", "Bacteria", "Fungi", "Algae", "Plants", "Animals"]
    },
    {
      chapter: "Molecular Biology",
      topics: ["DNA", "RNA", "Proteins", "Enzymes", "Central Dogma", "Gene Regulation"]
    },
    {
      chapter: "Reproduction",
      topics: ["Asexual Reproduction", "Sexual Reproduction", "Human Reproduction", "Reproductive Health", "STDs"]
    }
  ]
};

// Helper function to get chapters for a subject
export const getChapters = (subject) => {
  return CHAPTERS_TOPICS[subject]?.map(item => item.chapter) || [];
};

// Helper function to get topics for a chapter
export const getTopics = (subject, chapter) => {
  const chapterData = CHAPTERS_TOPICS[subject]?.find(item => item.chapter === chapter);
  return chapterData?.topics || [];
};
