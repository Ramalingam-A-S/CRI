import { Infrastructure } from '../types';

export const INITIAL_INFRASTRUCTURE: Infrastructure[] = [
  {
    id: 'inf-001',
    name: 'Nagalapuram Primary Health Centre',
    type: 'HOSPITAL',
    coordinates: [13.3870, 79.8010],
    status: 'OPERATIONAL',
    capacityDetails: '35 Beds (Emergency Trauma Unit & Ambulance)',
    backupPower: true,
    currentExposureSeverity: 'MODERATE',
    assignedZoneId: 'zone-flood-a',
    contactNumber: '+91-877-2244-1100',
    notes: 'Emergency generators operating on raised podium platform.'
  },
  {
    id: 'inf-002',
    name: 'Nagalapuram Emergency Fire & Rescue Station',
    type: 'FIRE_STATION',
    coordinates: [13.3845, 79.7940],
    status: 'OPERATIONAL',
    capacityDetails: '4 Rescue Trucks, 2 High-Volume Mud/Water Pumps',
    backupPower: true,
    currentExposureSeverity: 'LOW',
    assignedZoneId: 'zone-flood-a',
    contactNumber: '+91-877-2244-1101',
    notes: 'Rapid response crew on active standby.'
  },
  {
    id: 'inf-003',
    name: 'Tirupati District Emergency Ambulance Bay #2',
    type: 'AMBULANCE_STATION',
    coordinates: [13.3865, 79.7995],
    status: 'OPERATIONAL',
    capacityDetails: '6 Advanced Life Support Ambulances',
    backupPower: true,
    currentExposureSeverity: 'HIGH',
    assignedZoneId: 'zone-flood-a',
    contactNumber: '+91-877-2244-1108',
    notes: 'Lowland road access monitored for flash inundation.'
  },
  {
    id: 'inf-004',
    name: 'Sankarapuram 33kV Power Substation',
    type: 'POWER_SUBSTATION',
    coordinates: [13.3840, 79.7970],
    status: 'OPERATIONAL',
    capacityDetails: '33/11kV Distribution Transformer (Feed 25MW)',
    backupPower: false,
    currentExposureSeverity: 'HIGH',
    assignedZoneId: 'zone-flood-b',
    contactNumber: '+91-877-2244-2200',
    notes: 'Raised switchyard perimeter; moisture and thermal sensors active.'
  },
  {
    id: 'inf-005',
    name: 'East Sankarapuram Drainage Pumping Station',
    type: 'PUMPING_STATION',
    coordinates: [13.3835, 79.8150],
    status: 'OPERATIONAL',
    capacityDetails: '3x 250kW Heavy Dewatering Pumps',
    backupPower: true,
    currentExposureSeverity: 'MODERATE',
    assignedZoneId: 'zone-flood-c',
    contactNumber: '+91-877-2244-3344',
    notes: 'Primary floodwater evacuation channel into eastern reservoir.'
  },
  {
    id: 'inf-006',
    name: 'Sankarapuram Emergency High School Staging Ground',
    type: 'SCHOOL',
    coordinates: [13.3880, 79.7960],
    status: 'OPERATIONAL',
    capacityDetails: 'Auditorium & Classrooms (Capacity 1500)',
    backupPower: true,
    currentExposureSeverity: 'LOW',
    assignedZoneId: 'zone-flood-b',
    contactNumber: '+91-877-2244-8811',
    notes: 'Designated civil protection shelter and food supply point.'
  },
  {
    id: 'inf-007',
    name: 'Nagalapuram Emergency Telecom Repeater Mast',
    type: 'COMMUNICATION_TOWER',
    coordinates: [13.3910, 79.7920],
    status: 'OPERATIONAL',
    capacityDetails: 'VHF Civil Defense / 4G LTE Micro-cell',
    backupPower: true,
    currentExposureSeverity: 'LOW',
    assignedZoneId: 'zone-storm-a',
    contactNumber: '+91-877-2244-9988',
    notes: 'Local mesh repeater node connected to district emergency network.'
  }
];
