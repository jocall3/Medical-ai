import pysam

class GenomicDataLoader:
    def load_bam(self, file_path):
        return pysam.AlignmentFile(file_path, 'rb')

    def parse_fastq(self, file_path):
        with pysam.FastxFile(file_path) as fh:
            for entry in fh:
                yield entry