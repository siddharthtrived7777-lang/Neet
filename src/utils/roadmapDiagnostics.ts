/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudyEntry, ChapterStatus, TestEntry, RevisionTask, NEETSubject, ConfidenceLevel, LowConfidenceChapterAnalysis, GeneratedRoadmap, RoadmapDay, RoadmapSession } from '../types';
import { NEET_SYLLABUS } from '../neetData';

// High-yield NCERT key focus points for smart scheduling
export const HIGH_YIELD_NEET_CHAPTER_TOPICS: Record<string, string[]> = {
  // Physics
  "Basic Maths": ["Differentiation & Integration essentials", "Trigonometric identities", "Logarithms & Graph slopes"],
  "Mathematical Tools & Vectors": ["Cross & Dot product", "Vector resolution", "Triangle and Parallelogram laws"],
  "Units and Measurements": ["Dimensional analysis", "Significant figures & Vernier calipers", "Error propagation"],
  "Motion in a Straight Line": ["Equations of motion under gravity", "v-t and s-t graph analysis", "Stopping distance"],
  "Motion in a Plane": ["Projectile trajectory & maximum range", "Relative velocity in 2D", "Centripetal acceleration"],
  "Laws of Motion": ["FBD & Tension problems", "Friction (static vs kinetic)", "Banking of curved roads"],
  "Work, Energy and Power": ["Work-Energy theorem", "Conservative forces & Potential energy", "Elastic & Inelastic collisions"],
  "System of Particles and Rotational Motion": ["Moment of inertia theorems", "Rolling motion on inclined plane", "Torque & Angular momentum conservation"],
  "Gravitation": ["Variation of g with height/depth", "Orbital & Escape speed", "Kepler's planetary laws"],
  "Mechanical Properties of Solids": ["Stress-strain curve", "Young's modulus & elastic potential energy", "Bulk modulus"],
  "Mechanical Properties of Fluids": ["Bernoulli's theorem & Venturimeter", "Pascal's principle", "Surface tension & Capillarity"],
  "Thermal Properties of Matter": ["Thermal expansion & Anomalous expansion of water", "Newton's law of cooling", "Thermal conductivity & Wien's displacement"],
  "Thermodynamics": ["First Law (Q = U + W)", "Isothermal vs Adiabatic processes", "Carnot engine efficiency & Second Law"],
  "Kinetic Theory of Gases": ["RMS, Average & Most probable speeds", "Degrees of freedom & Law of equipartition", "Mean free path"],
  "Oscillations": ["SHM equation & Phase differences", "Simple pendulum time period", "Energy in SHM (KE & PE curves)"],
  "Waves": ["Doppler effect & Wave velocity", "Standing waves in organ pipes (open/closed)", "Beats & Resonance"],
  "Electric Charges and Fields": ["Coulomb's Law in vector form", "Gauss's Law applications", "Electric dipole & Torque in uniform field"],
  "Electrostatic Potential and Capacitance": ["Equipotential surfaces", "Capacitor with dielectric slab", "Series & Parallel capacitor combinations"],
  "Current Electricity": ["Ohm's law & Drift velocity", "Kirchhoff's Voltage and Current Laws", "Wheatstone bridge & Meter bridge"],
  "Moving Charges and Magnetism": ["Biot-Savart Law", "Ampere's Circuital Law", "Lorentz force & Cyclotron / Helical motion"],
  "Magnetism and Matter": ["Earth's magnetic elements (declination/dip)", "Dia, Para & Ferromagnetism", "Magnetic susceptibility & Curie law"],
  "Electromagnetic Induction": ["Faraday's Laws & Lenz's Law", "Motional EMF", "Self & Mutual inductance"],
  "Alternating Current": ["Series LCR circuit & Resonance", "Phasor diagrams & Power factor", "Transformer turns ratio & energy losses"],
  "Electromagnetic Waves": ["Displacement current", "EM spectrum wavelength order & uses", "E/B ratio & Poynting vector"],
  "Ray Optics and Optical Instruments": ["Lens Maker's formula & Thin lens combination", "Total Internal Reflection & Critical angle", "Compound Microscope & Astronomical Telescope"],
  "Wave Optics": ["Young's Double Slit Experiment (YDSE) fringe width", "Huygens wavelets & wavefronts", "Diffraction single slit minima/maxima"],
  "Dual Nature of Radiation and Matter": ["Einstein's photoelectric equation", "Stopping potential vs frequency graphs", "de Broglie matter wavelength"],
  "Atoms": ["Bohr's atomic model postulates", "Rydberg formula for spectral series", "Radius & Energy level transitions"],
  "Nuclei": ["Mass defect & Binding energy per nucleon curve", "Nuclear fission & fusion", "Radioactivity decay law (N = N0 e^-λt)"],
  "Semiconductor Electronics: Materials, Devices & Simple Circuits": ["p-n junction diode forward/reverse bias", "Full-wave & Half-wave rectifiers", "Zener diode as voltage regulator & Logic gates"],

  // Chemistry
  "Some Basic Concepts of Chemistry": ["Mole concept & Limiting reagent", "Molarity, Molality & Mole fraction", "Empirical vs Molecular formula"],
  "Structure of Atom": ["de Broglie & Heisenberg Uncertainty principle", "Quantum numbers (n, l, m, s)", "Aufbau, Pauli & Hund's rules"],
  "Classification of Elements and Periodicity in Properties": ["Ionization enthalpy exceptions (B vs Be, N vs O)", "Electron gain enthalpy (Cl vs F)", "Electronegativity trends & Lanthanoid contraction"],
  "Chemical Bonding and Molecular Structure": ["VSEPR theory & Molecular geometry", "Hybridization (sp, sp2, sp3, sp3d)", "Molecular Orbital Theory (MOT) bond order & magnetism"],
  "Chemical Thermodynamics": ["Enthalpy of formation, combustion & bond energy", "Hess's Law of constant heat summation", "Gibbs Free Energy (ΔG = ΔH - TΔS) & spontaneity"],
  "Equilibrium": ["Le Chatelier's principle shifts", "pH calculations & Buffer solutions (Henderson eq)", "Solubility product (Ksp) & Common ion effect"],
  "Redox Reactions": ["Oxidation state determination rules", "Ion-electron method for balancing redox equations", "Standard electrode potentials & reducing strength"],
  "Organic Chemistry: Some Basic Principles and Techniques": ["IUPAC nomenclature rules", "Inductive, Electromeric & Hyperconjugation effects", "Carbocation & Carbanion stability orders"],
  "Hydrocarbons": ["Markovnikov & Anti-Markovnikov addition", "Ozonolysis of alkenes & alkynes", "Friedel-Crafts alkylation & acylation on benzene"],
  "Solutions": ["Raoult's Law & Ideal vs Non-ideal solutions", "Colligative properties (Elevation in boiling, Depression in freezing)", "Van 't Hoff factor (i) for association/dissociation"],
  "Electrochemistry": ["Nernst Equation calculations", "Kohlrausch's Law of independent migration", "Faraday's Laws of electrolysis & Fuel cells"],
  "Chemical Kinetics": ["Order of reaction (Zero & First order half-life equations)", "Arrhenius equation & Activation energy (Ea)", "Rate law from experimental table data"],
  "The d- and f-Block Elements": ["Variable oxidation states & magnetic moments (spin-only)", "Preparation & reactions of KMnO4 and K2Cr2O7", "Lanthanoid contraction consequences"],
  "Coordination Compounds": ["Werner's coordination theory & IUPAC naming", "Isomerism (Geometrical, Optical, Ionization, Linkage)", "Crystal Field Theory (CFT) splitting & spectrochemical series"],
  "Haloalkanes and Haloarenes": ["SN1 vs SN2 reaction mechanisms & stereochemistry", "Elimination vs Substitution (Saytzeff's rule)", "Reactivity of chlorobenzene towards nucleophilic substitution"],
  "Alcohols, Phenols and Ethers": ["Lucas test for primary/secondary/tertiary alcohols", "Reimer-Tiemann & Kolbe's carboxylation of phenol", "Williamson ether synthesis & Cleavage of ethers with HI"],
  "Aldehydes, Ketones and Carboxylic Acids": ["Aldol condensation & Cannizzaro reaction mechanisms", "Tollens' & Fehling's tests distinction", "Clemmensen & Wolff-Kishner reduction & HVZ reaction"],
  "Amines": ["Hoffmann Bromamide degradation reaction", "Gabriel Phthalimide synthesis of primary amines", "Carbylamine test & Hinsberg test distinction"],
  "Biomolecules": ["Structure of D-Glucose & Fructose (open & ring forms)", "Peptide bond & Primary/Secondary/Tertiary protein structures", "DNA vs RNA structure, double helix & nucleotides"],

  // Biology
  "The Living World": ["Taxonomic categories hierarchy", "Binomial nomenclature rules", "Defining vs Non-defining characteristics of life"],
  "Biological Classification": ["Five Kingdom system (Whittaker)", "Monera (Eubacteria vs Archaebacteria)", "Fungi classes (Phyco, Asco, Basidio, Deutero) & Lichens / Viruses"],
  "Plant Kingdom": ["Algae pigment classification (Chlorophyceae, Phaeophyceae, Rhodophyceae)", "Bryophytes & Pteridophytes life cycles", "Gymnosperms & Angiosperms alternation of generations"],
  "Animal Kingdom": ["Phylum level diagnostic features (Porifera to Chordata)", "Coelom classification & Symmetry", "Respiratory & Excretory organs table in animals"],
  "Morphology of Flowering Plants": ["Root, Stem & Leaf modifications", "Inflorescence (Racemose vs Cymose)", "Floral formula & characteristics of Fabaceae, Solanaceae, Liliaceae"],
  "Anatomy of Flowering Plants": ["Meristematic vs Permanent tissues", "Monocot vs Dicot stem/root vascular bundles anatomy", "Secondary growth & Heartwood vs Sapwood"],
  "Structural Organisation in Animals": ["Epithelial tissue types & Junctions (Tight, Adhering, Gap)", "Connective tissue (Dense, Loose, Bone, Cartilage)", "Cockroach digestive, reproductive & nervous systems"],
  "Cell: The Unit of Life": ["Prokaryotic vs Eukaryotic cell comparison", "Endomembrane system (ER, Golgi, Lysosomes, Vacuoles)", "Mitochondria & Chloroplast double membrane structure & Ribosomes"],
  "Biomolecules (Bio)": ["Enzyme kinetics, Km value & competitive inhibition", "Structure of Amino acids & Zwitterion", "Lipids, Phospholipids & Polysaccharide bonds"],
  "Cell Cycle and Cell Division": ["Phases of cell cycle (G1, S, G2, M)", "Prophase-I stages (Leptotene, Zygotene, Pachytene, Diplotene, Diakinesis)", "Mitosis vs Meiosis differences & significance"],
  "Photosynthesis in Higher Plants": ["Light reaction, Photosystems I & II and Z-scheme", "Calvin cycle (C3 pathway) ATP/NADPH consumption", "C4 pathway (Kranz anatomy) vs C3 and Photorespiration"],
  "Respiration in Plants": ["Glycolysis steps & ATP yield", "Krebs cycle (TCA) and Oxidative phosphorylation (ETC complexes)", "Fermentation & Respiratory Quotient (RQ) values"],
  "Plant Growth and Development": ["Plant growth regulators (Auxin, Gibberellin, Cytokinin, Ethylene, ABA)", "Differentiation, Dedifferentiation, Redifferentiation", "Photoperiodism & Vernalization"],
  "Breathing and Exchange of Gases": ["Mechanism of pulmonary ventilation", "Respiratory volumes & capacities (TV, IRV, ERV, RV, VC, TLC)", "Oxygen-hemoglobin dissociation curve shifts"],
  "Body Fluids and Circulation": ["Blood grouping (ABO & Rh factor incompatibility)", "Cardiac cycle & ECG waves (P, QRS, T interpretations)", "Double circulation & Regulation of cardiac activity"],
  "Excretory Products and their Elimination": ["Nephron structure & mechanism of urine formation (counter-current)", "RAAS mechanism & ANF regulation", "Disorders of excretory system (Uremia, Renal calculi)"],
  "Locomotion and Movement": ["Types of movements & Skeletal system bones count", "Sliding filament theory of muscle contraction", "Joints classification & Disorders (Myasthenia, Tetany, Arthritis)"],
  "Neural Control and Coordination": ["Generation & conduction of nerve impulses (action potential)", "Structure of Neuron & Synaptic transmission", "Human brain divisions & Reflex arc"],
  "Chemical Coordination and Integration": ["Pituitary, Thyroid, Parathyroid, Adrenal, Pancreas hormones", "Mechanism of hormone action (peptide vs steroid receptors)", "Endocrine disorders (Diabetes insipidus vs mellitus, Addison's, Cushing's)"],
  "Reproduction in Organisms": ["Asexual vs Sexual reproduction modes", "Juvenile, Reproductive and Senescent phases"],
  "Sexual Reproduction in Flowering Plants": ["Microsporogenesis & Megasporogenesis steps", "Double fertilization & Triple fusion", "Development of Endosperm, Embryo & Apomixis"],
  "Human Reproduction": ["Male & Female reproductive systems histology", "Spermatogenesis & Oogenesis comparisons", "Menstrual cycle hormone surges (LH, FSH, Estrogen, Progesterone) & Fertilization"],
  "Reproductive Health": ["Contraceptive methods & MTP Act", "Sexually transmitted infections (STIs)", "Assisted Reproductive Technologies (IVF, ZIFT, GIFT, ICSI)"],
  "Principles of Inheritance and Variation": ["Mendel's monohybrid & dihybrid crosses (phenotypic/genotypic ratios)", "Incomplete dominance & Co-dominance (ABO blood group)", "Chromosomal theory of inheritance, Linkage & Genetic disorders (Down, Turner, Klinefelter)"],
  "Molecular Basis of Inheritance": ["Structure of DNA & Watson-Crick model dimensions", "Meselson & Stahl experiment on semi-conservative replication", "Transcription, Genetic Code & Translation (Lac Operon mechanism)"],
  "Evolution": ["Origin of life & Miller-Urey experiment", "Homologous vs Analogous organs (Divergent vs Convergent)", "Hardy-Weinberg principle & Human evolutionary milestones"],
  "Human Health and Disease": ["Infectious disease causal agents (Typhoid, Pneumonia, Malaria life cycle)", "Innate vs Acquired immunity & Antibody structure (IgG, IgA, IgM)", "Cancer mechanisms & AIDS pathogen and replication"],
  "Microbes in Human Welfare": ["Microbes in household food processing (LAB, Baker's yeast)", "Sewage treatment (primary & secondary biological)", "Biogas production, Biocontrol agents & Biofertilizers"],
  "Biotechnology: Principles and Processes": ["Restriction enzymes & Gel electrophoresis", "Cloning vectors (pBR322 selectable markers ampR, tetR)", "Polymerase Chain Reaction (PCR) steps & Bioreactors"],
  "Biotechnology and its Applications": ["Bt crops (Bt cotton mechanism of Cry toxins)", "RNA interference (RNAi) in Meloidogyne incognita", "Genetically engineered human insulin & Gene therapy (ADA deficiency)"],
  "Organisms and Populations": ["Major abiotic factors & Adaptations in animals and desert plants", "Population attributes & Growth models (Exponential vs Logistic)", "Population interactions (Mutualism, Competition, Parasitism, Commensalism)"],
  "Ecosystem": ["Ecological pyramids (Number, Biomass, Energy upright rule)", "Productivity (GPP vs NPP) & Decomposition steps", "Nutrient cycling (Carbon, Phosphorus) & Ecological succession"],
  "Biodiversity and Conservation": ["Patterns of biodiversity (Latitudinal gradients & Species-Area relationship)", "Causes of biodiversity loss ('The Evil Quartet')", "In-situ vs Ex-situ conservation strategies (National Parks vs Botanical gardens)"]
};

/**
 * Evaluates the user's database to identify chapters that have the lowest confidence level.
 * Weights:
 * - Chapters with explicit 'Low' confidenceLevel in recent sessions: highest urgency.
 * - Chapters with 'Medium' confidence + poor accuracy: high urgency.
 * - Chapters with low accuracy (< 65%): high urgency.
 * - Chapters flagged weak in mock test scorecards: added urgency.
 * - Overdue revision stages: added urgency.
 */
export function diagnoseLowConfidenceChapters(
  entries: StudyEntry[],
  chapterStatuses: ChapterStatus[],
  tests: TestEntry[],
  revisions: RevisionTask[]
): LowConfidenceChapterAnalysis[] {
  // Aggregate weak chapters flagged across mock tests
  const testWeakSet = new Set<string>();
  const testWrongSet = new Set<string>();
  tests.forEach(test => {
    (test.weakChapters || []).forEach(c => testWeakSet.add(c.trim().toLowerCase()));
    (test.wrongChapters || []).forEach(c => testWrongSet.add(c.trim().toLowerCase()));
  });

  // Count overdue revisions per chapter
  const overdueCountMap = new Map<string, number>();
  const todayStr = new Date().toISOString().split('T')[0];
  revisions.forEach(rev => {
    if (!rev.completed && rev.dueDate < todayStr) {
      const key = rev.chapterName.trim().toLowerCase();
      overdueCountMap.set(key, (overdueCountMap.get(key) || 0) + 1);
    }
  });

  // Map of chapter name -> entries
  const entriesByChapter = new Map<string, StudyEntry[]>();
  entries.forEach(e => {
    const key = e.chapter.trim().toLowerCase();
    if (!entriesByChapter.has(key)) entriesByChapter.set(key, []);
    entriesByChapter.get(key)!.push(e);
  });

  // Map of chapter name -> ChapterStatus
  const statusByChapter = new Map<string, ChapterStatus>();
  chapterStatuses.forEach(s => {
    statusByChapter.set(s.chapterName.trim().toLowerCase(), s);
  });

  const analyzedChapters: LowConfidenceChapterAnalysis[] = [];

  // Iterate through all NEET syllabus chapters
  NEET_SYLLABUS.forEach(syllabusItem => {
    const key = syllabusItem.name.trim().toLowerCase();
    const chEntries = entriesByChapter.get(key) || [];
    const chStatus = statusByChapter.get(key);
    const isWeakInMocks = testWeakSet.has(key) || testWrongSet.has(key);
    const overdueRevs = overdueCountMap.get(key) || 0;

    let currentConfidence: ConfidenceLevel | 'Unrated' = 'Unrated';
    let lowConfidenceCount = 0;
    let mediumConfidenceCount = 0;
    let highConfidenceCount = 0;
    let totalMcqsSolved = chStatus?.totalMcqs || 0;
    let avgAccuracy = chStatus?.averageAccuracy || 0;
    let totalHoursStudied = chStatus?.totalHours || 0;
    let lastDate = chStatus?.lastStudiedDate || null;

    if (chEntries.length > 0) {
      // Sort entries by date descending to find latest confidence
      const sortedEntries = [...chEntries].sort((a, b) => b.date.localeCompare(a.date));
      currentConfidence = sortedEntries[0].confidenceLevel;
      lastDate = sortedEntries[0].date;

      chEntries.forEach(entry => {
        if (entry.confidenceLevel === 'Low') lowConfidenceCount++;
        else if (entry.confidenceLevel === 'Medium') mediumConfidenceCount++;
        else if (entry.confidenceLevel === 'High') highConfidenceCount++;
      });

      if (totalHoursStudied === 0) {
        totalHoursStudied = chEntries.reduce((sum, e) => sum + (e.durationMinutes / 60), 0);
      }
      if (totalMcqsSolved === 0) {
        totalMcqsSolved = chEntries.reduce((sum, e) => sum + e.mcqsSolved, 0);
      }
      if (avgAccuracy === 0 && totalMcqsSolved > 0) {
        const correct = chEntries.reduce((sum, e) => sum + e.mcqsCorrect, 0);
        avgAccuracy = Math.round((correct / totalMcqsSolved) * 100);
      }
    } else if (chStatus && chStatus.confidenceTrend && chStatus.confidenceTrend.length > 0) {
      currentConfidence = chStatus.confidenceTrend[chStatus.confidenceTrend.length - 1];
    }

    // Determine Urgency & Vulnerability Score (0 to 100)
    let urgencyScore = 0;
    let reasons: string[] = [];

    // Explicit Low confidence logged
    if (currentConfidence === 'Low') {
      urgencyScore += 50;
      reasons.push("Logged 'Low' confidence rating");
      if (lowConfidenceCount > 1) {
        urgencyScore += Math.min(15, lowConfidenceCount * 5);
        reasons.push(`${lowConfidenceCount} consecutive low confidence sessions`);
      }
    } else if (currentConfidence === 'Medium') {
      urgencyScore += 25;
      reasons.push("Logged 'Medium' confidence rating");
    } else if (currentConfidence === 'Unrated') {
      // Unstudied or not rated
      urgencyScore += 15;
      reasons.push("Unrated / zero confidence logged");
    }

    // Poor MCQ accuracy penalty
    if (totalMcqsSolved > 0) {
      if (avgAccuracy < 50) {
        urgencyScore += 30;
        reasons.push(`Critical MCQ accuracy (${avgAccuracy}%)`);
      } else if (avgAccuracy < 70) {
        urgencyScore += 18;
        reasons.push(`Sub-optimal accuracy (${avgAccuracy}%)`);
      }
    }

    // Mock test red flags
    if (isWeakInMocks) {
      urgencyScore += 20;
      reasons.push("Flagged in Mock Test scorecard errors");
    }

    // Overdue revisions
    if (overdueRevs > 0) {
      urgencyScore += Math.min(15, overdueRevs * 5);
      reasons.push(`${overdueRevs} overdue spaced revision(s)`);
    }

    // Time decay: if studied long ago with low/medium confidence
    if (lastDate && currentConfidence !== 'High') {
      const daysAgo = Math.floor((new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo > 14) {
        urgencyScore += 10;
        reasons.push(`No review for ${daysAgo} days`);
      }
    }

    // If never studied
    if (totalHoursStudied === 0 && chEntries.length === 0) {
      reasons.push("Syllabus chapter not yet started");
    }

    const finalReason = reasons.length > 0 
      ? reasons.join(" • ") 
      : "Regular syllabus consolidation";

    analyzedChapters.push({
      chapterName: syllabusItem.name,
      subject: syllabusItem.subject,
      currentConfidence,
      averageAccuracy: Number(avgAccuracy.toFixed(1)),
      totalHours: Number(totalHoursStudied.toFixed(1)),
      totalMcqs: totalMcqsSolved,
      reason: finalReason,
      urgencyScore: Math.min(100, Math.max(5, urgencyScore)),
      lastStudiedDate: lastDate,
      overdueRevisionCount: overdueRevs,
      isWeakInMocks
    });
  });

  // Sort: Lowest confidence first (i.e. 'Low' -> 'Medium' -> 'Unrated' -> 'High', and highest urgencyScore)
  return analyzedChapters.sort((a, b) => {
    const confWeight = (c: ConfidenceLevel | 'Unrated') => {
      switch (c) {
        case 'Low': return 4;
        case 'Medium': return 3;
        case 'Unrated': return 2;
        case 'High': return 1;
      }
    };
    const diff = confWeight(b.currentConfidence) - confWeight(a.currentConfidence);
    if (diff !== 0) return diff;
    return b.urgencyScore - a.urgencyScore;
  });
}

/**
 * Intelligent client-side algorithmic fallback that creates a pristine,
 * scientifically paced 7-Day remediation schedule targeting the diagnosed lowest confidence chapters.
 */
export function generateAlgorithmicRoadmap(
  targetChapters: LowConfidenceChapterAnalysis[],
  options: {
    dailyHours?: number;
    intensity?: 'moderate' | 'balanced' | 'rigorous';
    focusMode?: string;
  }
): GeneratedRoadmap {
  const dailyHours = options.dailyHours || 6;
  const intensity = options.intensity || 'balanced';

  // Take top priority weak chapters (typically 4 to 8 chapters for a 7-day week)
  const prioritizedChapters = targetChapters.slice(0, Math.min(8, Math.max(3, targetChapters.length)));

  // If no specific low confidence chapters found, pick diverse high-yield defaults
  const activeChapters = prioritizedChapters.length > 0 
    ? prioritizedChapters 
    : [
        { chapterName: "Ray Optics and Optical Instruments", subject: "Physics" as NEETSubject, currentConfidence: "Low" as ConfidenceLevel, reason: "High weightage NEET optics", urgencyScore: 88, averageAccuracy: 52, totalHours: 1.5, totalMcqs: 25, lastStudiedDate: null, overdueRevisionCount: 0 },
        { chapterName: "Aldehydes, Ketones and Carboxylic Acids", subject: "Chemistry" as NEETSubject, currentConfidence: "Low" as ConfidenceLevel, reason: "High weightage organic reaction mechanisms", urgencyScore: 85, averageAccuracy: 58, totalHours: 2.0, totalMcqs: 30, lastStudiedDate: null, overdueRevisionCount: 0 },
        { chapterName: "Principles of Inheritance and Variation", subject: "Biology" as NEETSubject, currentConfidence: "Low" as ConfidenceLevel, reason: "High yield genetics numericals and pedigree", urgencyScore: 82, averageAccuracy: 64, totalHours: 3.0, totalMcqs: 45, lastStudiedDate: null, overdueRevisionCount: 0 },
        { chapterName: "Current Electricity", subject: "Physics" as NEETSubject, currentConfidence: "Medium" as ConfidenceLevel, reason: "Circuit analysis and Kirchhoff laws", urgencyScore: 78, averageAccuracy: 60, totalHours: 2.5, totalMcqs: 40, lastStudiedDate: null, overdueRevisionCount: 0 },
        { chapterName: "Chemical Thermodynamics", subject: "Chemistry" as NEETSubject, currentConfidence: "Medium" as ConfidenceLevel, reason: "Thermodynamics enthalpy and spontaneity", urgencyScore: 75, averageAccuracy: 62, totalHours: 2.0, totalMcqs: 35, lastStudiedDate: null, overdueRevisionCount: 0 },
        { chapterName: "Molecular Basis of Inheritance", subject: "Biology" as NEETSubject, currentConfidence: "Medium" as ConfidenceLevel, reason: "DNA replication and Lac operon", urgencyScore: 74, averageAccuracy: 68, totalHours: 2.5, totalMcqs: 50, lastStudiedDate: null, overdueRevisionCount: 0 },
      ];

  const daysOfWeek = [
    { dayNumber: 1, label: "Day 1 (Monday)", theme: "Foundation Repair & High-Yield Concept Drill" },
    { dayNumber: 2, label: "Day 2 (Tuesday)", theme: "Numerical Mastery & Reaction Mechanisms" },
    { dayNumber: 3, label: "Day 3 (Wednesday)", theme: "NCERT Deep Dive & High-Yield Tables" },
    { dayNumber: 4, label: "Day 4 (Thursday)", theme: "Speed & Timed MCQ Simulation" },
    { dayNumber: 5, label: "Day 5 (Friday)", theme: "Error Log Remediation & Formula Reinforcement" },
    { dayNumber: 6, label: "Day 6 (Saturday)", theme: "Interleaved Cross-Chapter Mixed Practice" },
    { dayNumber: 7, label: "Day 7 (Sunday)", theme: "Comprehensive Review & Confidence Upgrade Assessment" }
  ];

  let totalPhysicsHrs = 0;
  let totalChemistryHrs = 0;
  let totalBiologyHrs = 0;

  const weeklySchedule: RoadmapDay[] = daysOfWeek.map((day, idx) => {
    // Interleave the active weak chapters across days
    const primaryChapter = activeChapters[idx % activeChapters.length];
    const secondaryChapter = activeChapters[(idx + 1) % activeChapters.length];
    const tertiaryChapter = activeChapters[(idx + 2) % activeChapters.length];

    // Compute session durations in minutes
    // Morning session: Physics/Physical Chem (demanding numericals)
    // Afternoon session: Organic/Inorganic Chem
    // Evening session: Biology (NCERT memorization & active recall)
    const morningMins = Math.round(dailyHours * 60 * 0.45);
    const afternoonMins = Math.round(dailyHours * 60 * 0.30);
    const eveningMins = Math.round(dailyHours * 60 * 0.25);

    const primaryTopics = HIGH_YIELD_NEET_CHAPTER_TOPICS[primaryChapter.chapterName] || [
      "NCERT core definitions & theory",
      "Standard formula derivations & constraints",
      "High-yield exemplar problems"
    ];

    const secondaryTopics = HIGH_YIELD_NEET_CHAPTER_TOPICS[secondaryChapter.chapterName] || [
      "Reaction mechanisms & reagents",
      "Concept checkpoint questions",
      "Common examiner traps"
    ];

    const tertiaryTopics = HIGH_YIELD_NEET_CHAPTER_TOPICS[tertiaryChapter.chapterName] || [
      "NCERT diagram labels & summaries",
      "Scientific names & exception tables",
      "Assertion-Reason practice"
    ];

    const sessions: RoadmapSession[] = [
      {
        id: `sess-${day.dayNumber}-1`,
        timeSlot: "Morning Focus (07:00 - 10:00)",
        subject: primaryChapter.subject,
        chapter: primaryChapter.chapterName,
        activityType: day.dayNumber % 2 === 1 ? 'Concept Drill' : 'PYQ / MCQ Speed Test',
        taskDescription: `Target lowest confidence in ${primaryChapter.chapterName}. Eliminate core conceptual doubt and solve 35 targeted questions.`,
        durationMinutes: morningMins,
        highYieldTopics: primaryTopics.slice(0, 2),
        targetMcqs: Math.round(morningMins / 4),
        completed: false
      },
      {
        id: `sess-${day.dayNumber}-2`,
        timeSlot: "Afternoon Block (14:00 - 16:30)",
        subject: secondaryChapter.subject,
        chapter: secondaryChapter.chapterName,
        activityType: 'NCERT Line-by-Line',
        taskDescription: `Active revision of ${secondaryChapter.chapterName}. Read NCERT lines carefully, mark highlighted exceptions, and test recall.`,
        durationMinutes: afternoonMins,
        highYieldTopics: secondaryTopics.slice(0, 2),
        targetMcqs: Math.round(afternoonMins / 5),
        completed: false
      },
      {
        id: `sess-${day.dayNumber}-3`,
        timeSlot: "Evening Consolidation (19:00 - 21:00)",
        subject: tertiaryChapter.subject,
        chapter: tertiaryChapter.chapterName,
        activityType: 'Active Recall & Error Log',
        taskDescription: `Solve error notebook entries from ${tertiaryChapter.chapterName}. Re-test incorrect questions from previous test attempts.`,
        durationMinutes: eveningMins,
        highYieldTopics: tertiaryTopics.slice(0, 2),
        targetMcqs: Math.round(eveningMins / 4),
        completed: false
      }
    ];

    // Tally hours
    sessions.forEach(s => {
      const hrs = s.durationMinutes / 60;
      if (s.subject === 'Physics') totalPhysicsHrs += hrs;
      else if (s.subject === 'Chemistry') totalChemistryHrs += hrs;
      else totalBiologyHrs += hrs;
    });

    const tips = [
      "Start with pen and paper: solving 10 numericals on your own creates 3x better retention than passively reading solutions.",
      "Organic reactions: write down the reagent and cover the product. Force your brain to reconstruct the mechanism.",
      "Biology NCERT: Pay special attention to the introductory scientist biographies and summary paragraphs—NEET loves picking tricky one-liners from them.",
      "Timed sprints: Practice questions in batches of 25 with a 30-minute timer. Don't look at answer keys until the batch is finished.",
      "The 'Feynman Test': Explain the hardest concept in your weak chapter out loud as if teaching a beginner.",
      "Error Notebook: Every wrong MCQ today goes directly into your active error list with the exact reason (Calculation / Conceptual / Silly Mistake).",
      "Sunday Assessment: Take a 45-minute chapter test. If accuracy is > 80%, upgrade confidence level to 'High' in your syllabus tracker!"
    ];

    return {
      dayNumber: day.dayNumber,
      dayLabel: day.label,
      focusTheme: day.theme,
      totalHours: Number(dailyHours.toFixed(1)),
      sessions,
      dailyChecklist: [
        `Complete all 3 targeted sessions (${dailyHours}h total)`,
        `Solve minimum ${Math.round(dailyHours * 15)} MCQs across target chapters`,
        `Maintain active error log for every mistake made`,
        `Review formula sheet before sleeping`
      ],
      confidenceBoostTip: tips[idx % tips.length],
      completed: false
    };
  });

  return {
    id: `roadmap-${Date.now()}`,
    createdAt: new Date().toISOString(),
    title: `7-Day Low-Confidence Weakness Eradication Roadmap`,
    overview: `This personalized weekly study plan directly targets the ${activeChapters.length} chapters identified with lowest confidence ratings and sub-optimal MCQ accuracy in your database. It balances cognitive load with morning numerical drills, afternoon conceptual review, and evening active recall.`,
    strategy: `Interleaved High-Yield Spaced Practice: Rather than cramming one weak chapter for 3 full days (which causes rapid forgetting), this roadmap cycles between your lowest confidence Physics, Chemistry, and Biology chapters daily. This prevents mental fatigue and accelerates long-term neural consolidation for NEET.`,
    targetChaptersSummary: activeChapters.map(c => ({
      chapterName: c.chapterName,
      subject: c.subject,
      currentConfidence: c.currentConfidence,
      targetMilestone: `Boost practice accuracy to > 80% and elevate confidence from ${c.currentConfidence} to High`
    })),
    weeklySchedule,
    milestones: [
      `Complete minimum ${(dailyHours * 7).toFixed(0)} hours of disciplined study`,
      `Target ${(dailyHours * 7 * 15).toFixed(0)}+ practice MCQs with detailed error analysis`,
      `Elevate confidence level in at least 3 diagnosed weak chapters from 'Low' to 'High'`,
      `Zero unaddressed errors in your personalized error notebook`
    ],
    subjectSplit: {
      physicsHours: Number(totalPhysicsHrs.toFixed(1)),
      chemistryHours: Number(totalChemistryHrs.toFixed(1)),
      biologyHours: Number(totalBiologyHrs.toFixed(1))
    },
    dailyHoursTarget: dailyHours,
    generationMode: 'algorithmic'
  };
}
