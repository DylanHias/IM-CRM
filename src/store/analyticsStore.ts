import { create } from 'zustand';
import type {
  PersonalStats,
  PipelineData,
  CustomerHealthData,
  ActivityPatternsData,
  DateRange,
} from '@/types/analytics';

interface AnalyticsState {
  personal: PersonalStats | null;
  pipeline: PipelineData | null;
  customers: CustomerHealthData | null;
  activity: ActivityPatternsData | null;

  isLoadingPersonal: boolean;
  isLoadingPipeline: boolean;
  isLoadingCustomers: boolean;
  isLoadingActivity: boolean;

  loadPersonal: (userId: string, range: DateRange, prevRange: DateRange) => Promise<void>;
  loadPipeline: () => Promise<void>;
  loadCustomers: () => Promise<void>;
  loadActivity: (userId: string, range: DateRange) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  personal: null,
  pipeline: null,
  customers: null,
  activity: null,

  isLoadingPersonal: false,
  isLoadingPipeline: false,
  isLoadingCustomers: false,
  isLoadingActivity: false,

  loadPersonal: async (userId, range, prevRange) => {
    set({ isLoadingPersonal: true });
    try {
      const { queryPersonalStats } = await import('@/lib/db/queries/analytics');
      const personal = await queryPersonalStats(userId, range, prevRange);
      set({ personal });
    } catch (e) {
      console.error('[analytics] loadPersonal failed:', e);
    } finally {
      set({ isLoadingPersonal: false });
    }
  },

  loadPipeline: async () => {
    set({ isLoadingPipeline: true });
    try {
      const { queryPipelineData } = await import('@/lib/db/queries/analytics');
      const pipeline = await queryPipelineData();
      set({ pipeline });
    } catch (e) {
      console.error('[analytics] loadPipeline failed:', e);
    } finally {
      set({ isLoadingPipeline: false });
    }
  },

  loadCustomers: async () => {
    set({ isLoadingCustomers: true });
    try {
      const { queryCustomerHealthData } = await import('@/lib/db/queries/analytics');
      const customers = await queryCustomerHealthData();
      set({ customers });
    } catch (e) {
      console.error('[analytics] loadCustomers failed:', e);
    } finally {
      set({ isLoadingCustomers: false });
    }
  },

  loadActivity: async (userId, range) => {
    set({ isLoadingActivity: true });
    try {
      const { queryActivityPatternsData } = await import('@/lib/db/queries/analytics');
      const activity = await queryActivityPatternsData(userId, range);
      set({ activity });
    } catch (e) {
      console.error('[analytics] loadActivity failed:', e);
    } finally {
      set({ isLoadingActivity: false });
    }
  },
}));
