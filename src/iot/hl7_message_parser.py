class HL7Parser:
    def parse(self, raw_message):
        # Simplified HL7 v2 parsing logic
        segments = raw_message.split('\r')
        return {s[:3]: s.split('|') for s in segments if s}

    def generate_ack(self, message_id):
        return f"MSH|^~\\&|SYSTEM|HOSPITAL|||20260605||ACK|{message_id}|P|2.5"