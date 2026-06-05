class ModelCompatibilityTest:
    def test_workflow_continuity(self, old_model, new_model, test_data):
        old_out = old_model.predict(test_data)
        new_out = new_model.predict(test_data)
        return old_out == new_out