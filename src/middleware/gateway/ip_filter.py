class IPFilter:
    def __init__(self, whitelist: list = None, blacklist: list = None):
        self.whitelist = whitelist or []
        self.blacklist = blacklist or []

    def is_authorized(self, ip: str) -> bool:
        if self.blacklist and ip in self.blacklist: return False
        if self.whitelist and ip not in self.whitelist: return False
        return True