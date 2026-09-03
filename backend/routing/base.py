from abc import ABC, abstractmethod
from typing import Optional
from models.route import NormalizedRoute

class BaseRoutingProvider(ABC):
    @abstractmethod
    def get_routes(self, origin: str, destination: str) -> list[NormalizedRoute]:
        pass
