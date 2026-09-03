import { CitizenReport } from '../types';
import { INITIAL_CITIZEN_REPORTS } from '../mock/citizenReports';

export interface CitizenReportApi {
  getReports(): Promise<CitizenReport[]>;
  createReport(report: Omit<CitizenReport, 'id' | 'timestamp' | 'upvotes' | 'verificationStatus'>): Promise<CitizenReport>;
  updateVerificationStatus(id: string, status: CitizenReport['verificationStatus']): Promise<CitizenReport>;
}

class MockCitizenReportApi implements CitizenReportApi {
  private reports: CitizenReport[] = [...INITIAL_CITIZEN_REPORTS];

  async getReports(): Promise<CitizenReport[]> {
    return Promise.resolve([...this.reports]);
  }

  async createReport(data: Omit<CitizenReport, 'id' | 'timestamp' | 'upvotes' | 'verificationStatus'>): Promise<CitizenReport> {
    const newReport: CitizenReport = {
      ...data,
      id: `rep-${Date.now()}`,
      timestamp: new Date().toISOString(),
      upvotes: 1,
      verificationStatus: 'UNVERIFIED'
    };
    this.reports.unshift(newReport);
    return Promise.resolve({ ...newReport });
  }

  async updateVerificationStatus(id: string, status: CitizenReport['verificationStatus']): Promise<CitizenReport> {
    const idx = this.reports.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Report ${id} not found`);
    this.reports[idx].verificationStatus = status;
    return Promise.resolve({ ...this.reports[idx] });
  }
}

export const citizenReportApi: CitizenReportApi = new MockCitizenReportApi();
