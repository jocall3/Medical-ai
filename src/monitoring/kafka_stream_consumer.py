import json
import logging
from typing import Callable, Dict, Any
from src.monitoring.monitoring_config import MonitoringConfig

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("KafkaStreamConsumer")

class MockKafkaConsumer:
    """Fallback mock consumer if confluent-kafka or kafka-python is not installed."""
    def __init__(self, topic: str, bootstrap_servers: str, group_id: str):
        self.topic = topic
        self.bootstrap_servers = bootstrap_servers
        self.group_id = group_id
        self.running = False

    def subscribe(self, topics: list):
        logger.info(f"Mock subscribed to topics: {topics}")

    def poll(self, timeout: float = 1.0):
        # Returns None to simulate idle stream in mock mode
        return None

    def close(self):
        logger.info("Mock consumer closed.")

class KafkaStreamConsumer:
    def __init__(self, config: MonitoringConfig):
        self.config = config
        self.consumer = None
        self.running = False
        self._init_consumer()

    def _init_consumer(self):
        try:
            from kafka import KafkaConsumer
            self.consumer = KafkaConsumer(
                self.config.KAFKA_TOPIC_VITAL_SIGNS,
                bootstrap_servers=self.config.KAFKA_BOOTSTRAP_SERVERS,
                group_id=self.config.KAFKA_GROUP_ID,
                value_deserializer=lambda x: json.loads(x.decode('utf-8')),
                auto_offset_reset='latest',
                enable_auto_commit=True
            )
            logger.info("Successfully initialized kafka-python consumer.")
        except ImportError:
            try:
                from confluent_kafka import Consumer
                conf = {
                    'bootstrap.servers': self.config.KAFKA_BOOTSTRAP_SERVERS,
                    'group.id': self.config.KAFKA_GROUP_ID,
                    'auto.offset.reset': 'latest'
                }
                self.consumer = Consumer(conf)
                self.consumer.subscribe([self.config.KAFKA_TOPIC_VITAL_SIGNS])
                logger.info("Successfully initialized confluent-kafka consumer.")
            except ImportError:
                logger.warning("Neither kafka-python nor confluent-kafka is installed. Falling back to MockKafkaConsumer.")
                self.consumer = MockKafkaConsumer(
                    topic=self.config.KAFKA_TOPIC_VITAL_SIGNS,
                    bootstrap_servers=self.config.KAFKA_BOOTSTRAP_SERVERS,
                    group_id=self.config.KAFKA_GROUP_ID
                )

    def start_streaming(self, process_callback: Callable[[Dict[str, Any]], None]):
        """
        Starts the high-throughput streaming loop.
        Passes each incoming message to the process_callback.
        """
        self.running = True
        logger.info("Starting streaming consumer loop...")
        
        # Handle different consumer implementations
        if hasattr(self.consumer, 'poll') and not hasattr(self.consumer, 'assign'):
            # confluent-kafka or Mock
            while self.running:
                msg = self.consumer.poll(timeout=1.0)
                if msg is None:
                    continue
                if hasattr(msg, 'error') and msg.error():
                    logger.error(f"Consumer error: {msg.error()}")
                    continue
                
                try:
                    # confluent-kafka message value needs decoding
                    val = msg.value()
                    if isinstance(val, bytes):
                        val = json.loads(val.decode('utf-8'))
                    process_callback(val)
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
        else:
            # kafka-python consumer
            try:
                for message in self.consumer:
                    if not self.running:
                        break
                    try:
                        process_callback(message.value)
                    except Exception as e:
                        logger.error(f"Error processing message: {e}")
            except Exception as e:
                logger.error(f"Kafka consumer loop encountered error: {e}")

    def stop(self):
        self.running = False
        if self.consumer:
            self.consumer.close()
        logger.info("Streaming consumer stopped.")
