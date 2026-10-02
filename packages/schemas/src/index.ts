import { z } from "zod";

// BD phone = identity: 01XXXXXXXXX
export const bdPhoneSchema = z
  .string()
  .regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone (e.g. 017XXXXXXXX)");

export const requestOtpSchema = z.object({ phone: bdPhoneSchema });
export const verifyOtpSchema = z.object({
  phone: bdPhoneSchema,
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const moneyPaisa = z.number().int().nonnegative(); // 2500 BDT = 250000 paisa

export const cartItemSchema = z.object({
  variantId: z.string().cuid(),
  quantity: z.number().int().min(1).max(99),
});

export const addressSchema = z.object({
  name: z.string().min(2),
  phone: bdPhoneSchema,
  division: z.string().min(1),
  district: z.string().min(1),
  upazila: z.string().min(1),
  line1: z.string().min(5),
});

export const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1),
  address: addressSchema,
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["COD", "SSLCOMMERZ"]),
  guestToken: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
