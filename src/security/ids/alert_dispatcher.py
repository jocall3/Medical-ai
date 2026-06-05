import logging

class AlertDispatcher:
    def dispatch(self, alert_data):
        logging.warning(f"SECURITY ALERT: {alert_data}")