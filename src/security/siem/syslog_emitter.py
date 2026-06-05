import socket
import time
from enum import IntEnum
from typing import Optional

class SyslogFacility(IntEnum):
    KERN = 0
    USER = 1
    MAIL = 2
    DAEMON = 3
    AUTH = 4
    SYSLOG = 5
    LPR = 6
    NEWS = 7
    UUCP = 8
    CRON = 9
    AUTHPRIV = 10
    FTP = 11
    LOCAL0 = 16
    LOCAL1 = 17
    LOCAL2 = 18
    LOCAL3 = 19
    LOCAL4 = 20
    LOCAL5 = 21
    LOCAL6 = 22
    LOCAL7 = 23

class SyslogSeverity(IntEnum):
    EMERG = 0
    ALERT = 1
    CRIT = 2
    ERR = 3
    WARNING = 4
    NOTICE = 5
    INFO = 6
    DEBUG = 7

class SyslogEmitter:
    """
    Emits security events via standard Syslog protocol (RFC 5424 / RFC 3164)
    over UDP or TCP.
    """
    def __init__(
        self,
        host: str = "localhost",
        port: int = 514,
        protocol: str = "UDP",
        facility: SyslogFacility = SyslogFacility.AUTHPRIV,
        hostname: Optional[str] = None
    ):
        self.host = host
        self.port = port
        self.protocol = protocol.upper()
        self.facility = facility
        self.hostname = hostname or socket.gethostname()
        self.socket: Optional[socket.socket] = None
        self._connect()

    def _connect(self) -> None:
        if self.protocol == "TCP":
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            try:
                self.socket.connect((self.host, self.port))
            except Exception:
                self.socket = None
        else:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    def emit(
        self,
        message: str,
        severity: SyslogSeverity = SyslogSeverity.INFO,
        app_name: str = "MedicalAI"
    ) -> bool:
        """Formats and sends a syslog message."""
        pri = (self.facility * 8) + severity
        timestamp = time.strftime("%b %d %H:%M:%S", time.localtime())
        syslog_msg = f"<{pri}>{timestamp} {self.hostname} {app_name}: {message}"
        
        try:
            if not self.socket:
                self._connect()
                if not self.socket:
                    return False
            
            payload = syslog_msg.encode('utf-8')
            if self.protocol == "TCP":
                self.socket.sendall(payload + b"\n")
            else:
                self.socket.sendto(payload, (self.host, self.port))
            return True
        except Exception:
            self.socket = None
            return False

    def close(self) -> None:
        if self.socket:
            self.socket.close()
            self.socket = None
