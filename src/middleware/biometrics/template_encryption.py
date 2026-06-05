from cryptography.fernet import Fernet

class TemplateEncryptor:
    def __init__(self, key: bytes):
        self.cipher = Fernet(key)

    def encrypt(self, template: bytes) -> bytes:
        return self.cipher.encrypt(template)