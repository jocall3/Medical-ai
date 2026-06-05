import scapy.all as scapy

class TrafficAnalyzer:
    def __init__(self):
        self.packet_buffer = []

    def process_packet(self, packet):
        if packet.haslayer(scapy.IP):
            return {"src": packet[scapy.IP].src, "dst": packet[scapy.IP].dst, "proto": packet[scapy.IP].proto}
        return None