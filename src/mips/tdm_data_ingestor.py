class TDMDataIngestor:
    def parse_serum_concentration(self, raw_data):
        return {'time': raw_data['t'], 'concentration': raw_data['c']}

    def update_priors(self, patient_id, new_data):
        # Logic to update Bayesian priors based on new TDM data
        pass