import { Infrastructure } from '../types';
import { INITIAL_INFRASTRUCTURE } from '../mock/infrastructure';

export interface InfrastructureApi {
  getInfrastructure(): Promise<Infrastructure[]>;
}

class MockInfrastructureApi implements InfrastructureApi {
  private data: Infrastructure[] = [...INITIAL_INFRASTRUCTURE];

  async getInfrastructure(): Promise<Infrastructure[]> {
    return Promise.resolve([...this.data]);
  }
}

export const infrastructureApi: InfrastructureApi = new MockInfrastructureApi();
