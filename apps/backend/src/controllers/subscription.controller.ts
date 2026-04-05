import Subscription from "@/models/subscription";
import { ApiError } from "@/utils/apiError";
import type {
  IUserDocument,
  ISubscription,
  CreateSubscriptionInput,
  CreateSubscriptionOutput,
  GetSubscriptionOutput,
  GetPlansOutput,
} from "@/types";
import Razorpay from "razorpay";

type RazorpayClientLike = {
  orders: {
    create: (input: {
      amount: number;
      currency: string;
      receipt: string;
    }) => Promise<{ id: string }>;
  };
  subscriptions: {
    cancel: (subscriptionId: string) => Promise<unknown>;
    pause: (subscriptionId: string, input: { pause_at: "now" }) => Promise<unknown>;
    resume: (subscriptionId: string, input: { resume_at: "now" }) => Promise<unknown>;
  };
};

const isTestRuntime = (): boolean => {
  return process.env.NODE_ENV === "test";
};

const getRazorpayClient = (): RazorpayClientLike => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    if (isTestRuntime()) {
      return {
        orders: {
          create: async () => ({ id: `order_test_${Date.now()}` }),
        },
        subscriptions: {
          cancel: async () => ({}),
          pause: async () => ({}),
          resume: async () => ({}),
        },
      };
    }

    throw new ApiError(500, "Razorpay is not configured");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  }) as unknown as RazorpayClientLike;
};

const SUBSCRIPTION_PLANS = {
  basic_20: {
    name: "Basic",
    amount: 20,
    period: "monthly",
    description: "Basic subscription - ₹20/month",
  },
  pro_50: {
    name: "Pro",
    amount: 50,
    period: "monthly",
    description: "Pro subscription - ₹50/month",
  },
};

type SubscriptionPlanInfo = {
  id: keyof typeof SUBSCRIPTION_PLANS;
  name: string;
  amount: number;
};

type SubscriptionHistoryItem = Omit<ISubscription, "_id" | "userId"> & {
  _id: string;
  userId: string;
  plan?: SubscriptionPlanInfo;
};

export const createSubscription = async (
  input: CreateSubscriptionInput,
  user: IUserDocument
): Promise<CreateSubscriptionOutput> => {
  try {
    const planConfig = SUBSCRIPTION_PLANS[input.planId];
    if (!planConfig) {
      throw new ApiError(400, "Invalid plan ID");
    }

    const existingSubscription = await Subscription.findOne({
      userId: user._id,
      status: "active",
      isDeleted: false,
    });

    if (existingSubscription) {
      throw new ApiError(400, "User already has an active subscription");
    }

    const razorpay = getRazorpayClient();

    const order = (await razorpay.orders.create({
      amount: planConfig.amount * 100,
      currency: "INR",
      receipt: `sub_${user._id}_${Date.now()}`,
    })) as unknown as { id: string };

    const subscription = await Subscription.create({
      userId: user._id,
      planId: input.planId,
      status: "active",
    });

    return {
      subscriptionId: subscription._id.toString(),
      orderId: order.id,
      amount: planConfig.amount,
      currency: "INR",
      planId: input.planId,
      firstName: user.name,
      email: user.email,
      contact: "",
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Failed to create subscription");
  }
};

export const getSubscription = async (
  user: IUserDocument
): Promise<GetSubscriptionOutput> => {
  try {
    const subscription = await Subscription.findOne({
      userId: user._id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return {
        subscription: null,
        plan: null,
      };
    }

    const planConfig = SUBSCRIPTION_PLANS[subscription.planId];
    const subObj = subscription.toObject();

    return {
      subscription: {
        ...subObj,
        _id: subObj._id.toString(),
        userId: subObj.userId.toString(),
      },
      plan: planConfig
        ? {
          id: subscription.planId,
          name: planConfig.name,
          amount: planConfig.amount,
        }
        : null,
    };
  } catch {
    throw new ApiError(500, "Failed to fetch subscription details");
  }
};

export const cancelSubscription = async (
  user: IUserDocument
): Promise<{ message: string; cancelledAt: Date }> => {
  try {
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: "active",
      isDeleted: false,
    });

    if (!subscription) {
      throw new ApiError(404, "No active subscription found");
    }

    const razorpay = getRazorpayClient();

    if (subscription.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.cancel(
          subscription.razorpaySubscriptionId
        );
      } catch (error) {
        console.error("Error cancelling Razorpay subscription:", error);
      }
    }

    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();
    await subscription.save();

    return {
      message: "Subscription cancelled successfully",
      cancelledAt: subscription.cancelledAt,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Failed to cancel subscription");
  }
};

export const pauseSubscription = async (
  user: IUserDocument
): Promise<{ message: string; pausedAt: Date }> => {
  try {
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: "active",
      isDeleted: false,
    });

    if (!subscription) {
      throw new ApiError(404, "No active subscription found");
    }

    const razorpay = getRazorpayClient();

    if (subscription.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.pause(
          subscription.razorpaySubscriptionId,
          { pause_at: "now" }
        );
      } catch (error) {
        console.error("Error pausing Razorpay subscription:", error);
      }
    }

    subscription.status = "paused";
    subscription.pausedAt = new Date();
    await subscription.save();

    return {
      message: "Subscription paused successfully",
      pausedAt: subscription.pausedAt,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Failed to pause subscription");
  }
};

export const resumeSubscription = async (
  user: IUserDocument
): Promise<{ message: string; status: string }> => {
  try {
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: "paused",
      isDeleted: false,
    });

    if (!subscription) {
      throw new ApiError(404, "No paused subscription found");
    }

    const razorpay = getRazorpayClient();

    if (subscription.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.resume(
          subscription.razorpaySubscriptionId,
          { resume_at: "now" }
        );
      } catch (error) {
        console.error("Error resuming Razorpay subscription:", error);
      }
    }

    subscription.status = "active";
    subscription.pausedAt = undefined;
    await subscription.save();

    return {
      message: "Subscription resumed successfully",
      status: "active",
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Failed to resume subscription");
  }
};

export const getSubscriptionPlans = (): GetPlansOutput => {
  return {
    plans: [
      {
        id: "basic_20",
        name: SUBSCRIPTION_PLANS.basic_20.name,
        amount: SUBSCRIPTION_PLANS.basic_20.amount,
        period: SUBSCRIPTION_PLANS.basic_20.period,
        description: SUBSCRIPTION_PLANS.basic_20.description,
      },
      {
        id: "pro_50",
        name: SUBSCRIPTION_PLANS.pro_50.name,
        amount: SUBSCRIPTION_PLANS.pro_50.amount,
        period: SUBSCRIPTION_PLANS.pro_50.period,
        description: SUBSCRIPTION_PLANS.pro_50.description,
      },
    ],
  };
};

export const handlePaymentSuccess = async (
  subscriptionId: string,
  razorpaySubscriptionId: string
): Promise<{ message: string; success: boolean }> => {
  try {
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      throw new ApiError(404, "Subscription not found");
    }

    subscription.razorpaySubscriptionId = razorpaySubscriptionId;
    subscription.status = "active";
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );
    subscription.nextBillingDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );
    subscription.totalPayments = (subscription.totalPayments || 0) + 1;

    const planConfig = SUBSCRIPTION_PLANS[subscription.planId];
    if (planConfig) {
      subscription.totalPaid =
        (subscription.totalPaid || 0) + planConfig.amount;
    }

    await subscription.save();

    return {
      message: "Subscription activated successfully",
      success: true,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Failed to process payment success");
  }
};

export const getSubscriptionHistory = async (
  user: IUserDocument
): Promise<SubscriptionHistoryItem[]> => {
  try {
    const subscriptions = await Subscription.find({
      userId: user._id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return subscriptions.map((sub) => {
      const subObj = sub.toObject() as unknown as ISubscription;
      const planConfig = SUBSCRIPTION_PLANS[sub.planId];

      return {
        ...subObj,
        _id: subObj._id.toString(),
        userId: subObj.userId.toString(),
        plan: planConfig
          ? {
            id: sub.planId,
            name: planConfig.name,
            amount: planConfig.amount,
          }
          : undefined,
      };
    });
  } catch {
    throw new ApiError(500, "Failed to fetch subscription history");
  }
};
