import { Shelter } from '../types';

export const INITIAL_SHELTERS: Shelter[] = [
  {
    id: 'shelter-001',
    name: 'Nagalapuram Community Disaster Relief Shelter',
    locationName: 'Main Road, Nagalapuram Town Center',
    coordinates: [13.3850, 79.7990],
    capacity: 800,
    occupancy: 120,
    availability: 'AVAILABLE',
    services: ['Emergency Medical', 'Hot Meals', 'Power Generator', 'Clean Sanitation', 'Child Care'],
    currentRisk: 'LOW',
    status: 'OPEN',
    contactPerson: 'Relief Officer K. Ramana',
    contactPhone: '+91-877-2244-9900',
    assignedZoneId: 'zone-flood-a'
  },
  {
    id: 'shelter-002',
    name: 'Sankarapuram Emergency High School Center',
    locationName: 'North High School Campus, Sadasiva Sankarapuram',
    coordinates: [13.3880, 79.7960],
    capacity: 1500,
    occupancy: 340,
    availability: 'AVAILABLE',
    services: ['Hot Meals', 'First Aid', 'Blankets', 'Water Station', 'Emergency Power'],
    currentRisk: 'LOW',
    status: 'OPEN',
    contactPerson: 'Principal V. Subrahmanyam',
    contactPhone: '+91-877-2244-8811',
    assignedZoneId: 'zone-flood-b'
  },
  {
    id: 'shelter-003',
    name: 'West Foothills Community Hall',
    locationName: 'Foothills Approach Road, Nagalapuram Ridge',
    coordinates: [13.3820, 79.7750],
    capacity: 500,
    occupancy: 80,
    availability: 'AVAILABLE',
    services: ['Hot Meals', 'Medical Team', 'Clean Water', 'Emergency Radio'],
    currentRisk: 'LOW',
    status: 'OPEN',
    contactPerson: 'M. Sridhar (Coordinator)',
    contactPhone: '+91-877-2244-7722',
    assignedZoneId: 'zone-landslide-a'
  },
  {
    id: 'shelter-004',
    name: 'Eastern Lowland Agricultural Godown Center',
    locationName: 'Canal Bund Road, Eastern Lowlands',
    coordinates: [13.3830, 79.8250],
    capacity: 650,
    occupancy: 210,
    availability: 'AVAILABLE',
    services: ['Emergency Meals', 'Basic First Aid', 'Cots', 'Animal Staging'],
    currentRisk: 'MODERATE',
    status: 'OPEN',
    contactPerson: 'P. Balaji (Revenue Officer)',
    contactPhone: '+91-877-2244-5544',
    assignedZoneId: 'zone-flood-c'
  }
];
