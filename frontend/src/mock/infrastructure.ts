import { Infrastructure } from '../types';

export const INITIAL_INFRASTRUCTURE: Infrastructure[] = [
  {
    id: 'inf-001',
    name: 'Metro City Central Trauma Hospital',
    type: 'HOSPITAL',
    coordinates: [12.9750, 77.6050],
    status: 'OPERATIONAL',
    capacityDetails: '650 Beds (48 ICU Available)',
    backupPower: true,
    currentExposureSeverity: 'HIGH',
    assignedZoneId: 'zone-flood-a',
    contactNumber: '+1 (555) 019-2831',
    notes: 'Emergency generators operating on raised podium platform.'
  },
  {
    id: 'inf-002',
    name: 'Fire Station Headquarters #4',
    type: 'FIRE_STATION',
    coordinates: [12.9710, 77.5890],
    status: 'OPERATIONAL',
    capacityDetails: '8 Rescue Trucks, 3 Water Pumping Units',
    backupPower: true,
    currentExposureSeverity: 'MODERATE',
    assignedZoneId: 'zone-flood-a',
    contactNumber: '+1 (555) 019-9911',
    notes: 'Standard response ready.'
  },
  {
    id: 'inf-003',
    name: 'Central Ambulance Dispatch Hub',
    type: 'AMBULANCE_STATION',
    coordinates: [12.9760, 77.5960],
    status: 'DEGRADED',
    capacityDetails: '14 Ambulances (3 Flooded Access Routes)',
    backupPower: true,
    currentExposureSeverity: 'CRITICAL',
    assignedZoneId: 'zone-flood-a',
    contactNumber: '+1 (555) 019-3322',
    notes: 'Underpass inundation blocking primary outbound arterial road.'
  },
  {
    id: 'inf-004',
    name: 'West Substation 33kV Electrical Yard',
    type: 'POWER_SUBSTATION',
    coordinates: [12.9680, 77.5780],
    status: 'OPERATIONAL',
    capacityDetails: 'Grid Feed 120MW',
    backupPower: false,
    currentExposureSeverity: 'MODERATE',
    assignedZoneId: 'zone-heat-b',
    contactNumber: '+1 (555) 019-4455',
    notes: 'High transformer thermal load monitored.'
  },
  {
    id: 'inf-005',
    name: 'South Stormwater Pumping Station #2',
    type: 'PUMPING_STATION',
    coordinates: [12.9600, 77.5900],
    status: 'CRITICAL',
    capacityDetails: '4x 500kW Heavy Pumps (1 Pump Tripped)',
    backupPower: true,
    currentExposureSeverity: 'CRITICAL',
    assignedZoneId: 'zone-flood-a',
    contactNumber: '+1 (555) 019-7788',
    notes: 'Operating at 75% flow rate capacity due to debris blockage at intake.'
  },
  {
    id: 'inf-006',
    name: 'North Ridge Primary School Complex',
    type: 'SCHOOL',
    coordinates: [12.9860, 77.5850],
    status: 'OPERATIONAL',
    capacityDetails: 'Capacity 800 Students (Evacuated to Shelter)',
    backupPower: true,
    currentExposureSeverity: 'HIGH',
    assignedZoneId: 'zone-landslide-b',
    contactNumber: '+1 (555) 019-1234',
    notes: 'Classrooms converted to designated emergency staging area.'
  },
  {
    id: 'inf-007',
    name: 'Telecom Central Relay Mast #1',
    type: 'COMMUNICATION_TOWER',
    coordinates: [12.9800, 77.5940],
    status: 'OPERATIONAL',
    capacityDetails: '5G/LTE Edge Node / Emergency Band',
    backupPower: true,
    currentExposureSeverity: 'HIGH',
    assignedZoneId: 'zone-flood-a',
    contactNumber: '+1 (555) 019-8800',
    notes: 'Local Edge gateway hardware online.'
  }
];
