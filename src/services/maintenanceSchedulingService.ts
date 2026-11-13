import {
  MaintenanceTechnician,
  MaintenanceTicket,
  ActiveAnomalyAlert,
  TechnicianSpecialization,
  TicketUrgency,
  SystemAuditLogEntry
} from '../types';

/**
 * Automated Predictive Maintenance Scheduling Service
 * Correlates real-time equipment anomalies and vibration alerts with
 * certified technician availability, skill qualifications, and zone proximity.
 */

export const INITIAL_TECHNICIANS: MaintenanceTechnician[] = [
  {
    id: 'TECH-VIB-01',
    name: 'Devon Vance, PE',
    specialization: 'VIBRATION_ANALYSIS_CAT_III',
    certification: 'ISO 18436-2 Category III Vibration Specialist',
    status: 'AVAILABLE',
    assignedZone: 'Outdoor-Construction-Sector-4',
    shiftWindow: '06:00 - 14:30',
    rating: 4.95,
    experienceYears: 12,
    activeTicketsCount: 0,
    contactPhone: '+1 (555) 782-VIB-1',
    estimatedArrivalMin: 4
  },
  {
    id: 'TECH-MECH-02',
    name: 'Carlos Mendez',
    specialization: 'ELECTRO_MECHANICAL_MILLWRIGHT',
    certification: 'Certified Industrial Millwright & Precision Alignment',
    status: 'AVAILABLE',
    assignedZone: 'Outdoor-Construction-Sector-4',
    shiftWindow: '07:00 - 15:30',
    rating: 4.88,
    experienceYears: 9,
    activeTicketsCount: 0,
    contactPhone: '+1 (555) 901-MECH',
    estimatedArrivalMin: 6
  },
  {
    id: 'TECH-HVAC-03',
    name: 'Sarah Jenkins',
    specialization: 'HVAC_THERMAL_CHILLER',
    certification: 'Universal EPA 608 & Industrial Chiller Specialist',
    status: 'AVAILABLE',
    assignedZone: 'Warehouse-Logistics-Hub-North',
    shiftWindow: '08:00 - 16:30',
    rating: 4.92,
    experienceYears: 11,
    activeTicketsCount: 0,
    contactPhone: '+1 (555) 340-CHILL',
    estimatedArrivalMin: 8
  },
  {
    id: 'TECH-HYD-04',
    name: 'Oleg Voronin',
    specialization: 'HYDRAULIC_TURBINE_PUMP',
    certification: 'Fluid Power Certified Mechanical Specialist (FPCMS)',
    status: 'ON_REPAIR',
    assignedZone: 'Manufacturing-Assembly-Line-B',
    shiftWindow: '07:00 - 15:30',
    rating: 4.82,
    experienceYears: 14,
    activeTicketsCount: 1,
    contactPhone: '+1 (555) 882-PUMP',
    estimatedArrivalMin: 22
  },
  {
    id: 'TECH-CTRL-05',
    name: 'Priya Sharma',
    specialization: 'INSTRUMENTATION_CONTROLS',
    certification: 'ISA-CCST Level III Certified Control Systems Technician',
    status: 'AVAILABLE',
    assignedZone: 'Manufacturing-Assembly-Line-B',
    shiftWindow: '06:00 - 14:30',
    rating: 4.96,
    experienceYears: 8,
    activeTicketsCount: 0,
    contactPhone: '+1 (555) 412-CTRL',
    estimatedArrivalMin: 5
  },
  {
    id: 'TECH-VIB-06',
    name: 'Kenji Takahashi',
    specialization: 'VIBRATION_ANALYSIS_CAT_III',
    certification: 'Mobius Institute Vibration Master Cat IV',
    status: 'ON_BREAK',
    assignedZone: 'Warehouse-Logistics-Hub-North',
    shiftWindow: '09:00 - 17:30',
    rating: 4.98,
    experienceYears: 16,
    activeTicketsCount: 0,
    contactPhone: '+1 (555) 299-VIB-2',
    estimatedArrivalMin: 15
  }
];

export const INITIAL_MAINTENANCE_TICKETS: MaintenanceTicket[] = [
  {
    id: 'TKT-PM-9042',
    alertId: 'ALR-PM-9042',
    equipmentId: 'MTR-DRIVE-4B',
    equipmentName: 'Conveyor Drive Motor 4B',
    equipmentSubsystem: 'Drive Roller Bearing Sleeve & Stator',
    zone: 'Outdoor-Construction-Sector-4',
    vibrationMmS: 6.85,
    isoClass: 'ISO 10816-3 Class II (Severe Zone C/D)',
    urgency: 'BEARING_REPLACEMENT',
    issueDescription:
      'Excessive high-frequency roller cage vibration (6.85 mm/s RMS) with localized casing thermal saturation (86.4°C). Imminent bearing ball spalling risk.',
    recommendedAction:
      'LOTO Stage 2: Immediate conveyor drive motor isolation and roller bearing replacement to prevent shaft seizure.',
    assignedTechnicianId: undefined,
    assignedTechnicianName: undefined,
    status: 'STAGED',
    createdAt: '18 mins ago',
    estimatedMttrHours: 2.5,
    requiredParts: ['SKF 6205-2Z Deep Groove Ball Bearing', 'Mobil Polyrex EM Grease', 'Hydraulic Puller Tool'],
    lotoRequired: true,
    matchScorePct: 98
  },
  {
    id: 'TKT-PM-7120',
    alertId: 'ALR-PM-7120',
    equipmentId: 'PMP-CHILLER-02',
    equipmentName: 'Primary HVAC Chilled Water Pump',
    equipmentSubsystem: 'Impeller Shaft & Thrust Bearing',
    zone: 'Warehouse-Logistics-Hub-North',
    vibrationMmS: 4.92,
    isoClass: 'ISO 10816-3 Class II (Warning Zone B/C)',
    urgency: 'SCHEDULED_LUBRICATION',
    issueDescription:
      'Rotor harmonic jitter (4.92 mm/s RMS) with elevated pump casing temperature (74.8°C). Potential fluid cavitation and grease degradation.',
    recommendedAction:
      'Apply synthetic high-temp lubrication to thrust bearing assembly; inspect suction manifold for fluid cavitation.',
    assignedTechnicianId: undefined,
    assignedTechnicianName: undefined,
    status: 'STAGED',
    createdAt: '36 mins ago',
    estimatedMttrHours: 1.5,
    requiredParts: ['Shell Gadus S3 V220C Synthetic Grease', 'Strobe Tachometer', 'Laser Thermometer'],
    lotoRequired: false,
    matchScorePct: 94
  },
  {
    id: 'TKT-PM-4105',
    alertId: 'ALR-PM-4105',
    equipmentId: 'FAN-EXHAUST-03',
    equipmentName: 'Subgrade Exhaust Ventilation Fan 03',
    equipmentSubsystem: 'Multi-Blade Impeller & Belt Drive Pulley',
    zone: 'Subgrade-Tunnel-Conduit-7',
    vibrationMmS: 5.8,
    isoClass: 'ISO 10816-3 Class II (Warning Zone C)',
    urgency: 'ROTOR_REBALANCE',
    issueDescription:
      'Dynamic rotor unbalance detected across 1X running frequency with severe acoustic resonance in confined tunnel conduit.',
    recommendedAction:
      'Dynamic in-situ trim balancing and inspect v-belt tension deflection to avert blade shearing.',
    assignedTechnicianId: undefined,
    assignedTechnicianName: undefined,
    status: 'STAGED',
    createdAt: '1.2h ago',
    estimatedMttrHours: 2.0,
    requiredParts: ['Steel Rotor Balancing Clip Kit', 'Laser Pulley Alignment Tool', 'Optibelt Red Power V-Belt'],
    lotoRequired: true,
    matchScorePct: 91
  }
];

class MaintenanceSchedulingManager {
  private technicians: MaintenanceTechnician[] = [...INITIAL_TECHNICIANS];
  private tickets: MaintenanceTicket[] = [...INITIAL_MAINTENANCE_TICKETS];
  private listeners: Set<() => void> = new Set();

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getTechnicians(): MaintenanceTechnician[] {
    return [...this.technicians];
  }

  public getTickets(): MaintenanceTicket[] {
    return [...this.tickets];
  }

  public getUnassignedTickets(): MaintenanceTicket[] {
    return this.tickets.filter((t) => t.status === 'STAGED');
  }

  public getAvailableTechnicians(): MaintenanceTechnician[] {
    return this.technicians.filter((t) => t.status === 'AVAILABLE');
  }

  /**
   * Correlates an equipment predictive alert or ticket with technician availability
   * Calculates a match score (0-100%) based on skill suitability, zone proximity, and availability.
   */
  public correlateTechniciansForTicket(ticket: MaintenanceTicket): {
    technician: MaintenanceTechnician;
    score: number;
    matchReasons: string[];
  }[] {
    const scored = this.technicians.map((tech) => {
      let score = 50;
      const matchReasons: string[] = [];

      // 1. Skill & Specialization correlation
      if (
        (ticket.urgency === 'BEARING_REPLACEMENT' || ticket.vibrationMmS > 6.0) &&
        tech.specialization === 'VIBRATION_ANALYSIS_CAT_III'
      ) {
        score += 35;
        matchReasons.push('Certified ISO Cat III Vibration Expert for bearing failure diagnosis');
      } else if (
        (ticket.equipmentId.includes('MTR') || ticket.urgency === 'BEARING_REPLACEMENT') &&
        tech.specialization === 'ELECTRO_MECHANICAL_MILLWRIGHT'
      ) {
        score += 30;
        matchReasons.push('Master Millwright qualified for mechanical motor overhaul');
      } else if (
        (ticket.equipmentId.includes('PMP') || ticket.equipmentId.includes('CHILLER')) &&
        (tech.specialization === 'HYDRAULIC_TURBINE_PUMP' || tech.specialization === 'HVAC_THERMAL_CHILLER')
      ) {
        score += 35;
        matchReasons.push('Direct domain qualification for industrial pump & thermal systems');
      } else if (
        ticket.urgency === 'ROTOR_REBALANCE' &&
        (tech.specialization === 'VIBRATION_ANALYSIS_CAT_III' || tech.specialization === 'ELECTRO_MECHANICAL_MILLWRIGHT')
      ) {
        score += 28;
        matchReasons.push('Qualified for in-situ dynamic trim balancing');
      }

      // 2. Zone Proximity correlation
      if (tech.assignedZone === ticket.zone) {
        score += 15;
        matchReasons.push(`Located on-site in ${ticket.zone} (~${tech.estimatedArrivalMin} min transit)`);
      } else {
        matchReasons.push(`Located in ${tech.assignedZone} (~${tech.estimatedArrivalMin + 8} min transit)`);
      }

      // 3. Availability status
      if (tech.status === 'AVAILABLE') {
        score += 10;
        matchReasons.push('Immediately Available with zero active repair load');
      } else if (tech.status === 'ON_BREAK') {
        score -= 15;
        matchReasons.push('Currently on scheduled shift rest break');
      } else if (tech.status === 'ON_REPAIR') {
        score -= 30;
        matchReasons.push('Currently dispatched to active work order');
      } else {
        score = 0;
        matchReasons.push('Off duty / Shift concluded');
      }

      // 4. Rating & Experience weight
      if (tech.rating >= 4.9) {
        score += 5;
      }

      const finalScore = Math.max(10, Math.min(99, Math.round(score)));
      return {
        technician: tech,
        score: finalScore,
        matchReasons
      };
    });

    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Assigns a repair ticket to a specific technician
   */
  public assignTicket(
    ticketId: string,
    technicianId: string,
    managerNotes?: string
  ): { ticket: MaintenanceTicket; technician: MaintenanceTechnician; auditEntry: SystemAuditLogEntry } | null {
    const ticketIndex = this.tickets.findIndex((t) => t.id === ticketId);
    const techIndex = this.technicians.findIndex((t) => t.id === technicianId);

    if (ticketIndex === -1 || techIndex === -1) return null;

    const tech = this.technicians[techIndex];
    const ticket = this.tickets[ticketIndex];

    const updatedTicket: MaintenanceTicket = {
      ...ticket,
      assignedTechnicianId: tech.id,
      assignedTechnicianName: tech.name,
      status: 'ASSIGNED',
      assignedAt: new Date().toLocaleTimeString(),
      managerNotes: managerNotes || ticket.managerNotes
    };

    const updatedTech: MaintenanceTechnician = {
      ...tech,
      status: 'ON_REPAIR',
      activeTicketsCount: tech.activeTicketsCount + 1
    };

    this.tickets[ticketIndex] = updatedTicket;
    this.technicians[techIndex] = updatedTech;

    const auditEntry: SystemAuditLogEntry = {
      id: `AUD-MNT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Safety Director',
      userRole: 'EHS Manager on Duty',
      category: 'MAINTENANCE_DISPATCH',
      targetModule: 'Automated Predictive Maintenance Scheduler',
      parameter: `Dispatch Ticket ${ticket.id} (${ticket.equipmentId})`,
      previousValue: `Status: STAGED, Unassigned`,
      newValue: `Assigned: ${tech.name} (${tech.certification})`,
      justification: `Correlated predictive maintenance alert for ${ticket.equipmentName} (${ticket.issueDescription.slice(0, 60)}...) with technician availability. LOTO: ${ticket.lotoRequired ? 'Mandatory' : 'Standard'}.`,
      approvalStatus: 'VERIFIED'
    };

    this.notify();
    return { ticket: updatedTicket, technician: updatedTech, auditEntry };
  }

  /**
   * Auto-schedules the best correlated technician for a given ticket
   */
  public autoScheduleTicket(ticketId: string): {
    ticket: MaintenanceTicket;
    technician: MaintenanceTechnician;
    auditEntry: SystemAuditLogEntry;
  } | null {
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    const ranked = this.correlateTechniciansForTicket(ticket);
    const best = ranked[0];

    if (!best) return null;

    return this.assignTicket(ticketId, best.technician.id, `Auto-scheduled based on highest correlation score (${best.score}%)`);
  }

  /**
   * Advances ticket lifecycle (ASSIGNED -> IN_PROGRESS -> RESOLVED)
   */
  public advanceTicketStatus(ticketId: string, newStatus: 'IN_PROGRESS' | 'RESOLVED'): MaintenanceTicket | null {
    const index = this.tickets.findIndex((t) => t.id === ticketId);
    if (index === -1) return null;

    const ticket = this.tickets[index];
    const updated: MaintenanceTicket = {
      ...ticket,
      status: newStatus,
      completedAt: newStatus === 'RESOLVED' ? new Date().toLocaleTimeString() : ticket.completedAt
    };

    this.tickets[index] = updated;

    // If resolved, free up the technician
    if (newStatus === 'RESOLVED' && ticket.assignedTechnicianId) {
      this.technicians = this.technicians.map((t) => {
        if (t.id === ticket.assignedTechnicianId) {
          const newCount = Math.max(0, t.activeTicketsCount - 1);
          return {
            ...t,
            activeTicketsCount: newCount,
            status: newCount === 0 ? 'AVAILABLE' : t.status
          };
        }
        return t;
      });
    }

    this.notify();
    return updated;
  }

  /**
   * Staged new ticket from an active predictive maintenance alert
   */
  public stageTicketFromAlert(alert: ActiveAnomalyAlert): MaintenanceTicket {
    const existing = this.tickets.find((t) => t.alertId === alert.id);
    if (existing) return existing;

    const newTicket: MaintenanceTicket = {
      id: `TKT-PM-${Math.floor(1000 + Math.random() * 9000)}`,
      alertId: alert.id,
      equipmentId: alert.equipment_id || 'EQUIP-GENERIC-01',
      equipmentName: alert.equipment_name || 'Industrial Mechanical Drive',
      equipmentSubsystem: alert.equipment_subsystem || 'Shaft & Bearing Drive Assembly',
      zone: alert.location_zone,
      vibrationMmS: alert.vibration_mm_s || 5.2,
      isoClass: alert.iso_10816_class || 'ISO 10816-3 Warning Class',
      urgency: (alert.maintenance_urgency as TicketUrgency) || 'SCHEDULED_LUBRICATION',
      issueDescription: alert.anomaly_metric,
      recommendedAction: alert.recommended_action,
      status: 'STAGED',
      createdAt: 'Just now',
      estimatedMttrHours: 2.0,
      requiredParts: ['Standard Mechanical Replacement Kit', 'Synthetic Lubricant ISO VG 220'],
      lotoRequired: true,
      matchScorePct: 92
    };

    this.tickets = [newTicket, ...this.tickets];
    this.notify();
    return newTicket;
  }
}

export const maintenanceSchedulingService = new MaintenanceSchedulingManager();
