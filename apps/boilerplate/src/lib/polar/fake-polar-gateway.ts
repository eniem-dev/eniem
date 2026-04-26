import type { CustomerState } from "@polar-sh/sdk/models/components/customerstate.js";
import type { CustomerStateSubscription } from "@polar-sh/sdk/models/components/customerstatesubscription.js";
import type { CustomerStateBenefitGrant } from "@polar-sh/sdk/models/components/customerstatebenefitgrant.js";
import type { PolarGateway } from "./polar-gateway";
import type {
  BillingOrder,
  Downloadable,
  GitHubBenefit,
  PolarSubscription,
  UsageEvent,
  UsageHistoryEvent,
  UsageHistoryResult,
} from "./polar-domain";

export interface FakeCustomer {
  userId: string;
  customerId: string;
  orders?: BillingOrder[];
  meters?: Array<{ meterId: string; balance: number }>;
  activeSubscriptions?: PolarSubscription[];
  benefitGrants?: number;
  downloadables?: Downloadable[];
  githubBenefits?: GitHubBenefit[];
  usageEvents?: UsageHistoryEvent[];
}

export interface FakePolarGateway extends PolarGateway {
  seedCustomer(customer: FakeCustomer): void;
  removeCustomer(userId: string): void;
  getRecordedEvents(userId: string): UsageEvent[];
}

function fakeSubscription(sub: PolarSubscription): CustomerStateSubscription {
  return sub as unknown as CustomerStateSubscription;
}

function fakeBenefitGrant(): CustomerStateBenefitGrant {
  return {} as unknown as CustomerStateBenefitGrant;
}

export function createFakePolarGateway(
  seed: FakeCustomer[] = []
): FakePolarGateway {
  const customers = new Map<string, FakeCustomer>();
  const recordedEvents = new Map<string, UsageEvent[]>();

  for (const c of seed) customers.set(c.userId, c);

  function seedCustomer(customer: FakeCustomer): void {
    customers.set(customer.userId, customer);
  }

  function removeCustomer(userId: string): void {
    customers.delete(userId);
    recordedEvents.delete(userId);
  }

  function getRecordedEvents(userId: string): UsageEvent[] {
    return recordedEvents.get(userId) ?? [];
  }

  return {
    seedCustomer,
    removeCustomer,
    getRecordedEvents,
    async listUserOrders(userId) {
      return customers.get(userId)?.orders ?? [];
    },
    async getCreditBalance(userId, meterId) {
      const c = customers.get(userId);
      if (!c) return null;
      const meter = c.meters?.find((m) => m.meterId === meterId);
      return {
        meterId,
        balance: meter?.balance ?? 0,
        customerId: c.customerId,
      };
    },
    async recordUsage(userId, events) {
      const arr = Array.isArray(events) ? events : [events];
      const existing = recordedEvents.get(userId) ?? [];
      recordedEvents.set(userId, [...existing, ...arr]);
    },
    async listUsageHistory(userId, opts) {
      const c = customers.get(userId);
      const page = opts?.page ?? 1;
      if (!c) {
        return {
          events: [],
          pagination: { totalCount: 0, maxPage: 1, currentPage: page },
        } satisfies UsageHistoryResult;
      }
      const events = c.usageEvents ?? [];
      return {
        events,
        pagination: {
          totalCount: events.length,
          maxPage: 1,
          currentPage: page,
        },
      };
    },
    async getUserCustomerState(userId) {
      const c = customers.get(userId);
      if (!c) return null;
      const grantCount = c.benefitGrants ?? 0;
      const state: CustomerState = {
        id: c.customerId,
        createdAt: new Date(0),
        modifiedAt: null,
        metadata: {},
        externalId: userId,
        email: `${userId}@example.test`,
        emailVerified: true,
        name: null,
        billingAddress: null,
        taxId: null,
        organizationId: "org_fake",
        deletedAt: null,
        activeSubscriptions: (c.activeSubscriptions ?? []).map(fakeSubscription),
        grantedBenefits: Array.from({ length: grantCount }, fakeBenefitGrant),
        activeMeters: (c.meters ?? []).map((m) => ({
          id: `meter_${m.meterId}`,
          createdAt: new Date(0),
          modifiedAt: null,
          meterId: m.meterId,
          consumedUnits: 0,
          creditedUnits: m.balance,
          balance: m.balance,
        })),
        avatarUrl: "",
      };
      return state;
    },
    async fetchActiveSubscriptions(userId) {
      return customers.get(userId)?.activeSubscriptions ?? [];
    },
    async hasAnyBenefitGrant(userId) {
      const c = customers.get(userId);
      return (c?.benefitGrants ?? 0) > 0;
    },
    async listDownloadables(userId) {
      return customers.get(userId)?.downloadables ?? [];
    },
    async listGitHubBenefits(userId) {
      return customers.get(userId)?.githubBenefits ?? [];
    },
    async deleteUserCustomer(userId) {
      customers.delete(userId);
      recordedEvents.delete(userId);
    },
  };
}
