class TrustZoneBridge: def __init__(self): self.session = None
    def open_session(self, uuid): pass
    def invoke_command(self, cmd_id, payload): return f'TZ_CMD_{cmd_id}'