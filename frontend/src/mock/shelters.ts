import { Shelter } from '../types';

export const INITIAL_SHELTERS: Shelter[] = [
  {
    id: 'shelter-001',
    name: 'Civic Community Indoor Sports Arena',
    locationName: 'North Park Road & 2nd Avenue',
    coordinates: [12.9850, 77.5980],
    capacity: 600,
    occupancy: 382,
    availability: 'AVAILABLE',
    services: ['Emergency Medical', 'Hot Meals', 'Power Generator', 'Clean Sanitation', 'Child Care'],
    currentRisk: 'LOW',
    status: 'OPEN',
    contactPerson: 'Director Sarah Jenkins',
    contactPhone: '+1 (555) 018-4411',
    assignedZoneId: 'zone-flood-a'
  },
  {
    id: 'shelter-002',
    name: 'East Community College Gymnasium',
    locationName: 'East College Campus Drive',
    coordinates: [12.9710, 77.6180],
    capacity: 450,
    occupancy: 410,
    availability: 'NEAR_CAPACITY',
    services: ['Hot Meals', 'First Aid', 'Blankets', 'Water Station'],
    currentRisk: 'MODERATE',
    status: 'OPEN',
    contactPerson: 'Capt. Robert Vance',
    contactPhone: '+1 (555) 018-9922',
    assignedZoneId: 'zone-flood-b'
  },
  {
    id: 'shelter-003',
    name: 'South Heights High School Shelter',
    locationName: 'South Ridge Boulevard',
    coordinates: [12.9520, 77.5950],
    capacity: 500,
    occupancy: 120,
    availability: 'AVAILABLE',
    services: ['Hot Meals', 'Medical Team', 'Clean Water', 'Pet Shelter Section'],
    currentRisk: 'LOW',
    status: 'OPEN',
    contactPerson: 'Elena Rostova',
    contactPhone: '+1 (555) 018-7733',
    assignedZoneId: 'zone-storm-a'
  },
  {
    id: 'shelter-004',
    name: 'West Municipal Pavilion',
    locationName: 'West End Civic Center',
    coordinates: [12.9650, 77.5720],
    capacity: 350,
    occupancy: 350,
    availability: 'FULL',
    services: ['Emergency Meals', 'Basic First Aid', 'Cots'],
    currentRisk: 'MODERATE',
    status: 'OPEN',
    contactPerson: 'Marcus Thorne',
    contactPhone: '+1 (555) 018-2200',
    assignedZoneId: 'zone-landslide-b'
  }
];
