from fastapi import Request, HTTPException
import httpx

class ServiceRouter:
    def __init__(self, service_registry: dict):
        self.registry = service_registry

    async def route_request(self, service_name: str, request: Request):
        if service_name not in self.registry:
            raise HTTPException(status_code=404, detail="Service not found")
        target_url = self.registry[service_name]
        async with httpx.AsyncClient() as client:
            response = await client.request(request.method, target_url, headers=request.headers.raw, content=await request.body())
            return response