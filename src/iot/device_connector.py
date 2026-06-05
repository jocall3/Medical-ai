import asyncio
import logging

class DeviceConnector:
    def __init__(self, host='0.0.0.0', port=8080):
        self.host = host
        self.port = port
        self.logger = logging.getLogger(__name__)

    async def start_ingestion(self):
        self.logger.info(f"Starting IoT ingestion server on {self.host}:{self.port}")
        server = await asyncio.start_server(self.handle_client, self.host, self.port)
        async with server:
            await server.serve_forever()

    async def handle_client(self, reader, writer):
        data = await reader.read(1024)
        self.logger.info(f"Received telemetry: {data.decode()}")
        writer.close()
        await writer.wait_closed()