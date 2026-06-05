import { useGenomics, Variant } from '../context/GenomicsContext';

export const useVariants = () => {
  const { variants, filters, setFilters, selectedVariant, setSelectedVariant } = useGenomics();

  const filteredVariants = variants.filter((variant) => {
    const matchesSearch = 
      variant.gene.toLowerCase().includes(filters.search.toLowerCase()) ||
      variant.hgvsP.toLowerCase().includes(filters.search.toLowerCase()) ||
      variant.hgvsC.toLowerCase().includes(filters.search.toLowerCase()) ||
      variant.id.toLowerCase().includes(filters.search.toLowerCase());

    const matchesChr = filters.chromosome === 'All' || variant.chromosome === filters.chromosome;
    const matchesGene = filters.gene === 'All' || variant.gene === filters.gene;
    const matchesPathogenicity = filters.pathogenicity === 'All' || variant.clinVar === filters.pathogenicity;
    const matchesSomatic = !filters.somaticOnly || variant.somatic;

    return matchesSearch && matchesChr && matchesGene && matchesPathogenicity && matchesSomatic;
  });

  const uniqueGenes = Array.from(new Set(variants.map(v => v.gene)));
  const uniqueChromosomes = Array.from(new Set(variants.map(v => v.chromosome)));

  const stats = {
    total: variants.length,
    filtered: filteredVariants.length,
    pathogenic: variants.filter(v => v.clinVar === 'Pathogenic' || v.clinVar === 'Likely Pathogenic').length,
    vus: variants.filter(v => v.clinVar === 'VUS').length,
    benign: variants.filter(v => v.clinVar === 'Benign' || v.clinVar === 'Likely Benign').length,
    somatic: variants.filter(v => v.somatic).length,
    germline: variants.filter(v => !v.somatic).length,
  };

  return {
    variants: filteredVariants,
    allVariants: variants,
    selectedVariant,
    setSelectedVariant,
    filters,
    setFilters,
    uniqueGenes,
    uniqueChromosomes,
    stats
  };
};