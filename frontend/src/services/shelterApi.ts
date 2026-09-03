import { Shelter } from '../types';
import { INITIAL_SHELTERS } from '../mock/shelters';

export interface ShelterApi {
  getShelters(): Promise<Shelter[]>;
}

class MockShelterApi implements ShelterApi {
  private data: Shelter[] = [...INITIAL_SHELTERS];

  async getShelters(): Promise<Shelter[]> {
    return Promise.resolve([...this.data]);
  }
}

export const shelterApi: ShelterApi = new MockShelterApi();
