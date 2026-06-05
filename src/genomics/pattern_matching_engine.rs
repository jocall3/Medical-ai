use aho_corasick::AhoCorasick;
use rayon::prelude::*;

pub fn match_oncogenic_kmers(reads: Vec<String>, patterns: &[String]) -> Vec<Vec<usize>> {
    let ac = AhoCorasick::new(patterns).unwrap();
    reads.par_iter().map(|read| {
        ac.find_iter(read).map(|mat| mat.pattern().as_usize()).collect()
    }).collect()
}