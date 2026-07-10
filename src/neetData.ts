/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NEETSubject } from './types';

export interface SyllabusChapter {
  name: string;
  subject: NEETSubject;
  unit: string;
}

export const NEET_SYLLABUS: SyllabusChapter[] = [
  // --- PHYSICS ---
  { name: "Basic Maths", subject: "Physics", unit: "Basics" },
  { name: "Mathematical Tools & Vectors", subject: "Physics", unit: "Basics" },
  { name: "Units and Measurements", subject: "Physics", unit: "Mechanics" },
  { name: "Motion in a Straight Line", subject: "Physics", unit: "Mechanics" },
  { name: "Motion in a Plane", subject: "Physics", unit: "Mechanics" },
  { name: "Laws of Motion", subject: "Physics", unit: "Mechanics" },
  { name: "Work, Energy and Power", subject: "Physics", unit: "Mechanics" },
  { name: "System of Particles and Rotational Motion", subject: "Physics", unit: "Mechanics" },
  { name: "Gravitation", subject: "Physics", unit: "Mechanics" },
  { name: "Mechanical Properties of Solids", subject: "Physics", unit: "Properties of Matter" },
  { name: "Mechanical Properties of Fluids", subject: "Physics", unit: "Properties of Matter" },
  { name: "Thermal Properties of Matter", subject: "Physics", unit: "Heat & Thermo" },
  { name: "Thermodynamics", subject: "Physics", unit: "Heat & Thermo" },
  { name: "Kinetic Theory of Gases", subject: "Physics", unit: "Heat & Thermo" },
  { name: "Oscillations", subject: "Physics", unit: "Oscillations & Waves" },
  { name: "Waves", subject: "Physics", unit: "Oscillations & Waves" },
  { name: "Electric Charges and Fields", subject: "Physics", unit: "Electrodynamics" },
  { name: "Electrostatic Potential and Capacitance", subject: "Physics", unit: "Electrodynamics" },
  { name: "Current Electricity", subject: "Physics", unit: "Electrodynamics" },
  { name: "Moving Charges and Magnetism", subject: "Physics", unit: "Electrodynamics" },
  { name: "Magnetism and Matter", subject: "Physics", unit: "Electrodynamics" },
  { name: "Electromagnetic Induction", subject: "Physics", unit: "Electrodynamics" },
  { name: "Alternating Current", subject: "Physics", unit: "Electrodynamics" },
  { name: "Electromagnetic Waves", subject: "Physics", unit: "Electrodynamics" },
  { name: "Ray Optics and Optical Instruments", subject: "Physics", unit: "Optics" },
  { name: "Wave Optics", subject: "Physics", unit: "Optics" },
  { name: "Dual Nature of Radiation and Matter", subject: "Physics", unit: "Modern Physics" },
  { name: "Atoms", subject: "Physics", unit: "Modern Physics" },
  { name: "Nuclei", subject: "Physics", unit: "Modern Physics" },
  { name: "Semiconductor Electronics: Materials, Devices & Simple Circuits", subject: "Physics", unit: "Modern Physics" },

  // --- CHEMISTRY ---
  { name: "Some Basic Concepts of Chemistry", subject: "Chemistry", unit: "Physical Chemistry" },
  { name: "Structure of Atom", subject: "Chemistry", unit: "Physical Chemistry" },
  { name: "Classification of Elements and Periodicity in Properties", subject: "Chemistry", unit: "Inorganic Chemistry" },
  { name: "Chemical Bonding and Molecular Structure", subject: "Chemistry", unit: "Inorganic Chemistry" },
  { name: "Chemical Thermodynamics", subject: "Chemistry", unit: "Physical Chemistry" },
  { name: "Equilibrium", subject: "Chemistry", unit: "Physical Chemistry" },
  { name: "Redox Reactions", subject: "Chemistry", unit: "Physical Chemistry" },
  { name: "Organic Chemistry: Some Basic Principles and Techniques", subject: "Chemistry", unit: "Organic Chemistry" },
  { name: "Hydrocarbons", subject: "Chemistry", unit: "Organic Chemistry" },
  { name: "Solutions", subject: "Chemistry", unit: "Physical Chemistry" },
  { name: "Electrochemistry", subject: "Chemistry", unit: "Physical Chemistry" },
  { name: "Chemical Kinetics", subject: "Chemistry", unit: "Physical Chemistry" },
  { name: "The d- and f-Block Elements", subject: "Chemistry", unit: "Inorganic Chemistry" },
  { name: "Coordination Compounds", subject: "Chemistry", unit: "Inorganic Chemistry" },
  { name: "Haloalkanes and Haloarenes", subject: "Chemistry", unit: "Organic Chemistry" },
  { name: "Alcohols, Phenols and Ethers", subject: "Chemistry", unit: "Organic Chemistry" },
  { name: "Aldehydes, Ketones and Carboxylic Acids", subject: "Chemistry", unit: "Organic Chemistry" },
  { name: "Amines", subject: "Chemistry", unit: "Organic Chemistry" },
  { name: "Biomolecules", subject: "Chemistry", unit: "Organic Chemistry / Bio" },
  { name: "Purification and Characterisation of Organic Compounds", subject: "Chemistry", unit: "Organic Chemistry" },
  { name: "Principles Related to Practical Chemistry", subject: "Chemistry", unit: "Practical Chemistry" },

  // --- BIOLOGY ---
  { name: "The Living World", subject: "Biology", unit: "Diversity in Living World" },
  { name: "Biological Classification", subject: "Biology", unit: "Diversity in Living World" },
  { name: "Plant Kingdom", subject: "Biology", unit: "Diversity in Living World" },
  { name: "Animal Kingdom", subject: "Biology", unit: "Diversity in Living World" },
  { name: "Morphology of Flowering Plants", subject: "Biology", unit: "Structural Organisation" },
  { name: "Anatomy of Flowering Plants", subject: "Biology", unit: "Structural Organisation" },
  { name: "Structural Organisation in Animals", subject: "Biology", unit: "Structural Organisation" },
  { name: "Cell: The Unit of Life", subject: "Biology", unit: "Cell: Structure & Function" },
  { name: "Biomolecules (Bio)", subject: "Biology", unit: "Cell: Structure & Function" },
  { name: "Cell Cycle and Cell Division", subject: "Biology", unit: "Cell: Structure & Function" },
  { name: "Photosynthesis in Higher Plants", subject: "Biology", unit: "Plant Physiology" },
  { name: "Respiration in Plants", subject: "Biology", unit: "Plant Physiology" },
  { name: "Plant Growth and Development", subject: "Biology", unit: "Plant Physiology" },
  { name: "Breathing and Exchange of Gases", subject: "Biology", unit: "Human Physiology" },
  { name: "Body Fluids and Circulation", subject: "Biology", unit: "Human Physiology" },
  { name: "Excretory Products and their Elimination", subject: "Biology", unit: "Human Physiology" },
  { name: "Locomotion and Movement", subject: "Biology", unit: "Human Physiology" },
  { name: "Neural Control and Coordination", subject: "Biology", unit: "Human Physiology" },
  { name: "Chemical Coordination and Integration", subject: "Biology", unit: "Human Physiology" },
  { name: "Sexual Reproduction in Flowering Plants", subject: "Biology", unit: "Reproduction" },
  { name: "Human Reproduction", subject: "Biology", unit: "Reproduction" },
  { name: "Reproductive Health", subject: "Biology", unit: "Reproduction" },
  { name: "Principles of Inheritance and Variation", subject: "Biology", unit: "Genetics and Evolution" },
  { name: "Molecular Basis of Inheritance", subject: "Biology", unit: "Genetics and Evolution" },
  { name: "Evolution", subject: "Biology", unit: "Genetics and Evolution" },
  { name: "Human Health and Disease", subject: "Biology", unit: "Biology in Human Welfare" },
  { name: "Microbes in Human Welfare", subject: "Biology", unit: "Biology in Human Welfare" },
  { name: "Biotechnology: Principles and Processes", subject: "Biology", unit: "Biotechnology" },
  { name: "Biotechnology and its Applications", subject: "Biology", unit: "Biotechnology" },
  { name: "Organisms and Populations", subject: "Biology", unit: "Ecology" },
  { name: "Ecosystem", subject: "Biology", unit: "Ecology" },
  { name: "Biodiversity and Conservation", subject: "Biology", unit: "Ecology" }
];

export const SUBJECT_COLORS = {
  Physics: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
    fill: '#3b82f6',
    glow: 'shadow-blue-50',
  },
  Chemistry: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-100',
    fill: '#ef4444',
    glow: 'shadow-red-50',
  },
  Biology: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    fill: '#10b981',
    glow: 'shadow-emerald-50',
  }
};

export function getChapterSubject(chapterName: string): NEETSubject {
  const nameLower = chapterName.toLowerCase();
  const found = NEET_SYLLABUS.find(c => c.name.toLowerCase() === nameLower);
  if (found) return found.subject;
  
  if (
    nameLower.includes('math') || 
    nameLower.includes('vector') || 
    nameLower.includes('physics') || 
    nameLower.includes('mechanic') ||
    nameLower.includes('motion') ||
    nameLower.includes('gravitat') ||
    nameLower.includes('thermodynam') ||
    nameLower.includes('optics') ||
    nameLower.includes('electron') ||
    nameLower.includes('current')
  ) {
    return 'Physics';
  }
  if (
    nameLower.includes('chemistry') || 
    nameLower.includes('chemical') || 
    nameLower.includes('organic') || 
    nameLower.includes('acid') || 
    nameLower.includes('reaction') ||
    nameLower.includes('compound') ||
    nameLower.includes('bond') ||
    nameLower.includes('biomolecule') ||
    nameLower.includes('equilibrium')
  ) {
    return 'Chemistry';
  }
  return 'Biology';
}
