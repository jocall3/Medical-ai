import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Variant {
  id: string;
  gene: string;
  chromosome: string;
  position: number;
  ref: string;
  alt: string;
  consequence: string;
  hgvsC: string;
  hgvsP: string;
  alleleFrequency: number;
  clinVar: 'Pathogenic' | 'Likely Pathogenic' | 'VUS' | 'Likely Benign' | 'Benign';
  caddScore: number;
  revelScore: number;
  depth: number;
  zygosity: 'Heterozygous' | 'Homozygous';
  somatic: boolean;
  therapeuticImplications: string[];
  clinicalTrials: Array<{ id: string; title: string; phase: string; status: string }>;
}

export interface PatientMetadata {
  id: string;
  name: string;
  dob: string;
  gender: string;
  indication: string;
  sequencingPlatform: string;
  meanDepth: number;
  targetCoverage: number;
}

interface GenomicsContextType {
  variants: Variant[];
  selectedVariant: Variant | null;
  setSelectedVariant: (variant: Variant | null) => void;
  patient: PatientMetadata;
  filters: {
    search: string;
    chromosome: string;
    gene: string;
    pathogenicity: string;
    somaticOnly: boolean;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    search: string;
    chromosome: string;
    gene: string;
    pathogenicity: string;
    somaticOnly: boolean;
  }>>;
  runOncologyPrediction: (variantId: string) => Promise<any>;
}

const mockPatient: PatientMetadata = {
  id: "PT-90821",
  name: "Eleanor Vance",
  dob: "1978-04-12",
  gender: "Female",
  indication: "Non-Small Cell Lung Carcinoma (NSCLC)",
  sequencingPlatform: "Illumina NovaSeq 6000 (WES)",
  meanDepth: 150,
  targetCoverage: 99.8
};

const mockVariants: Variant[] = [
  {
    id: "VAR-001",
    gene: "EGFR",
    chromosome: "chr17",
    position: 7577121,
    ref: "C",
    alt: "T",
    consequence: "Missense Variant",
    hgvsC: "c.2369C>T",
    hgvsP: "p.Thr790Met",
    alleleFrequency: 0.00002,
    clinVar: "Pathogenic",
    caddScore: 28.4,
    revelScore: 0.89,
    depth: 142,
    zygosity: "Heterozygous",
    somatic: true,
    therapeuticImplications: [
      "Confers resistance to first-generation EGFR TKIs (Erlotinib, Gefitinib).",
      "Sensitive to third-generation EGFR TKI (Osimertinib)."
    ],
    clinicalTrials: [
      { id: "NCT04862780", title: "Osimertinib Combination Therapy in EGFR-Mutant NSCLC", phase: "Phase III", status: "Recruiting" },
      { id: "NCT05012345", title: "Novel EGFR Inhibitor for T790M Positive Patients", phase: "Phase I/II", status: "Active" }
    ]
  },
  {
    id: "VAR-002",
    gene: "BRAF",
    chromosome: "chr7",
    position: 140453136,
    ref: "A",
    alt: "T",
    consequence: "Missense Variant",
    hgvsC: "c.1799T>A",
    hgvsP: "p.Val600Glu",
    alleleFrequency: 0.00001,
    clinVar: "Pathogenic",
    caddScore: 32.0,
    revelScore: 0.94,
    depth: 188,
    zygosity: "Heterozygous",
    somatic: true,
    therapeuticImplications: [
      "Sensitive to BRAF inhibitors (Dabrafenib, Vemurafenib) in combination with MEK inhibitors (Trametinib)."
    ],
    clinicalTrials: [
      { id: "NCT04234567", title: "Dabrafenib + Trametinib in BRAF V600E Solid Tumors", phase: "Phase II", status: "Recruiting" }
    ]
  },
  {
    id: "VAR-003",
    gene: "BRCA1",
    chromosome: "chr17",
    position: 41197764,
    ref: "G",
    alt: "T",
    consequence: "Nonsense Variant",
    hgvsC: "c.181T>G",
    hgvsP: "p.Cys61Gly",
    alleleFrequency: 0.00015,
    clinVar: "Pathogenic",
    caddScore: 34.0,
    revelScore: 0.97,
    depth: 110,
    zygosity: "Heterozygous",
    somatic: false,
    therapeuticImplications: [
      "Indicates high susceptibility to breast and ovarian cancer.",
      "Predicts sensitivity to PARP inhibitors (Olaparib, Talazoparib)."
    ],
    clinicalTrials: [
      { id: "NCT03782341", title: "Olaparib Maintenance Therapy in BRCA-Mutated Cancers", phase: "Phase III", status: "Active" }
    ]
  },
  {
    id: "VAR-004",
    gene: "TP53",
    chromosome: "chr17",
    position: 7577538,
    ref: "C",
    alt: "T",
    consequence: "Missense Variant",
    hgvsC: "c.818G>A",
    hgvsP: "p.Arg273His",
    alleleFrequency: 0.00005,
    clinVar: "Pathogenic",
    caddScore: 29.1,
    revelScore: 0.88,
    depth: 165,
    zygosity: "Heterozygous",
    somatic: true,
    therapeuticImplications: [
      "Associated with multi-drug resistance and poor prognosis across multiple tumor types.",
      "Investigational therapies targeting mutant TP53 (e.g., APR-246) may be considered."
    ],
    clinicalTrials: [
      { id: "NCT04382833", title: "Eprenetapopt (APR-246) in TP53-Mutant Malignancies", phase: "Phase II", status: "Recruiting" }
    ]
  },
  {
    id: "VAR-005",
    gene: "KRAS",
    chromosome: "chr12",
    position: 25398284,
    ref: "C",
    alt: "A",
    consequence: "Missense Variant",
    hgvsC: "c.34G>T",
    hgvsP: "p.Gly12Cys",
    alleleFrequency: 0.00008,
    clinVar: "Pathogenic",
    caddScore: 26.5,
    revelScore: 0.82,
    depth: 130,
    zygosity: "Heterozygous",
    somatic: true,
    therapeuticImplications: [
      "Predicts sensitivity to KRAS G12C covalent inhibitors (Sotorasib, Adagrasib).",
      "Associated with resistance to EGFR-targeted monoclonal antibodies (Cetuximab, Panitumumab)."
    ],
    clinicalTrials: [
      { id: "NCT04625647", title: "Sotorasib vs Docetaxel in Advanced KRAS G12C NSCLC", phase: "Phase III", status: "Active" }
    ]
  },
  {
    id: "VAR-006",
    gene: "EGFR",
    chromosome: "chr17",
    position: 7577012,
    ref: "A",
    alt: "G",
    consequence: "Synonymous Variant",
    hgvsC: "c.2361A>G",
    hgvsP: "p.Gln787Gln",
    alleleFrequency: 0.342,
    clinVar: "Benign",
    caddScore: 1.2,
    revelScore: 0.05,
    depth: 155,
    zygosity: "Homozygous",
    somatic: false,
    therapeuticImplications: [],
    clinicalTrials: []
  },
  {
    id: "VAR-007",
    gene: "ALK",
    chromosome: "chr2",
    position: 29443612,
    ref: "G",
    alt: "A",
    consequence: "Missense Variant",
    hgvsC: "c.3520G>A",
    hgvsP: "p.Gly1174Ser",
    alleleFrequency: 0.00003,
    clinVar: "Likely Pathogenic",
    caddScore: 24.2,
    revelScore: 0.76,
    depth: 140,
    zygosity: "Heterozygous",
    somatic: true,
    therapeuticImplications: [
      "Confers resistance to Crizotinib.",
      "Remains sensitive to second-generation (Ceritinib, Alectinib) and third-generation (Lorlatinib) ALK inhibitors."
    ],
    clinicalTrials: [
      { id: "NCT03052608", title: "Lorlatinib in ALK-Positive Advanced Lung Cancer", phase: "Phase III", status: "Active" }
    ]
  },
  {
    id: "VAR-008",
    gene: "PIK3CA",
    chromosome: "chr3",
    position: 178936091,
    ref: "A",
    alt: "G",
    consequence: "Missense Variant",
    hgvsC: "c.1633G>A",
    hgvsP: "p.Glu545Lys",
    alleleFrequency: 0.00012,
    clinVar: "Pathogenic",
    caddScore: 27.8,
    revelScore: 0.85,
    depth: 172,
    zygosity: "Heterozygous",
    somatic: true,
    therapeuticImplications: [
      "Predicts sensitivity to PI3K inhibitors (Alpelisib) in combination with endocrine therapy for HR+/HER2- breast cancer."
    ],
    clinicalTrials: [
      { id: "NCT02437383", title: "Alpelisib + Fulvestrant in PIK3CA-Mutated Breast Cancer", phase: "Phase III", status: "Completed" }
    ]
  }
];

const GenomicsContext = createContext<GenomicsContextType | undefined>(undefined);

export const GenomicsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [variants] = useState<Variant[]>(mockVariants);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(mockVariants[0]);
  const [filters, setFilters] = useState({
    search: '',
    chromosome: 'All',
    gene: 'All',
    pathogenicity: 'All',
    somaticOnly: false
  });

  const runOncologyPrediction = async (variantId: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const variant = variants.find(v => v.id === variantId);
        if (!variant) return resolve(null);
        resolve({
          variantId: variant.id,
          gene: variant.gene,
          mutation: variant.hgvsP,
          confidenceScore: 0.985,
          recommendedTherapies: variant.therapeuticImplications,
          clinicalTrials: variant.clinicalTrials,
          fdaApproved: variant.clinVar === 'Pathogenic',
          evidenceLevel: "Level 1A (FDA Approved / Guideline-directed)"
        });
      }, 800);
    });
  };

  return (
    <GenomicsContext.Provider value={{
      variants,
      selectedVariant,
      setSelectedVariant,
      patient: mockPatient,
      filters,
      setFilters,
      runOncologyPrediction
    }}>
      {children}
    </GenomicsContext.Provider>
  );
};

export const useGenomics = () => {
  const context = useContext(GenomicsContext);
  if (!context) {
    throw new Error('useGenomics must be used within a GenomicsProvider');
  }
  return context;
};