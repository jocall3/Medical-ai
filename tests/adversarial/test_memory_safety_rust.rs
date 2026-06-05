// Fuzz testing simulation for the Rust genomic engine to ensure no panics occur with malformed FASTQ files.

struct FastqRecord {
    header: String,
    sequence: String,
    quality: String,
}

struct FastqParser;

impl FastqParser {
    // Safely parses a FASTQ record from raw string slices without panicking
    pub fn parse_record(data: &str) -> Result<FastqRecord, String> {
        let lines: Vec<&str> = data.lines().collect();
        if lines.len() < 4 {
            return Err("Incomplete FASTQ record: must have at least 4 lines.".to_string());
        }

        let header = lines[0];
        if !header.starts_with('@') {
            return Err("Invalid FASTQ header: must start with '@'.".to_string());
        }

        let sequence = lines[1];
        let separator = lines[2];
        if !separator.starts_with('+') {
            return Err("Invalid FASTQ separator: must start with '+'.".to_string());
        }

        let quality = lines[3];
        
        // Memory safety & logical validation: sequence and quality lengths must match
        if sequence.len() != quality.len() {
            return Err(format!(
                "Length mismatch: sequence length ({}) does not match quality length ({}).",
                sequence.len(),
                quality.len()
            ));
        }

        // Ensure no invalid characters in sequence
        for c in sequence.chars() {
            match c {
                'A' | 'T' | 'C' | 'G' | 'N' | 'a' | 't' | 'c' | 'g' | 'n' => {}
                _ => return Err(format!("Invalid nucleotide character: {}", c)),
            }
        }

        Ok(FastqRecord {
            header: header.to_string(),
            sequence: sequence.to_string(),
            quality: quality.to_string(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_fastq_parsing() {
        let valid_data = "@SEQ_ID\nGATTACA\n+\nIIIIIII";
        let result = FastqParser::parse_record(valid_data);
        assert!(result.is_ok());
        let record = result.unwrap();
        assert_eq!(record.sequence, "GATTACA");
    }

    #[test]
    fn test_malformed_fastq_mismatched_lengths() {
        let malformed_data = "@SEQ_ID\nGATTACA\n+\nIII";
        let result = FastqParser::parse_record(malformed_data);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Length mismatch"));
    }

    #[test]
    fn test_malformed_fastq_invalid_characters() {
        let malformed_data = "@SEQ_ID\nGATZACA\n+\nIIIIIII";
        let result = FastqParser::parse_record(malformed_data);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid nucleotide character"));
    }

    #[test]
    fn test_fuzz_empty_and_truncated_inputs() {
        let inputs = vec![
            "",
            "@",
            "@\n\n+\n",
            "@SEQ_ID\n\n+\n\n\n\n",
        ];

        for input in inputs {
            let result = std::panic::catch_unwind(|| {
                let _ = FastqParser::parse_record(input);
            });
            assert!(result.is_ok(), "Parser panicked on input: {}", input);
        }
    }
}