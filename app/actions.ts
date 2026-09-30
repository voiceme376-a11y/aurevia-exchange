'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { placeOrder } from '@/lib/orders';

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().max(40).optional(),
  country: z.string().min(2).max(80),
  twoFactorEnabled: z.boolean(),
});

const orderSchema = z.object({
  instrumentId: z.string().min(1),
  side: z.enum(['BUY', 'SELL']),
  type: z.enum(['MARKET', 'LIMIT', 'STOP']),
  quantity: z.number().positive(),
  price: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
});

export async function updateProfile(input: unknown) {
  const user = await requireUser();
  const payload = profileSchema.parse(input);

  const result = await db.user.update({
    where: { id: user.id },
    data: payload,
    select: { id: true, email: true, name: true, phone: true, country: true },
  });

  revalidatePath('/settings');
  return result;
}

export async function placeOrderAction(input: unknown) {
  const user = await requireUser();
  const payload = orderSchema.parse(input);

  const result = await placeOrder(user.id, payload);

  revalidatePath('/trade');
  revalidatePath('/dashboard');
  return result;
}

export async function toggleTwoFactor(enabled: boolean) {
  const user = await requireUser();

  const result = await db.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: enabled },
    select: { id: true, twoFactorEnabled: true },
  });

  revalidatePath('/settings');
  return result;
}

export async function submitKyc(data: {
  legalName: string;
  dob: string;
  address: string;
  idType: string;
  idNumber: string;
}) {
  const user = await requireUser();

  const result = await db.kycProfile.upsert({
    where: { userId: user.id },
    update: {
      legalName: data.legalName,
      dob: new Date(data.dob),
      address: data.address,
      idType: data.idType,
      idNumber: data.idNumber,
      submittedAt: new Date(),
    },
    create: {
      userId: user.id,
      legalName: data.legalName,
      dob: new Date(data.dob),
      address: data.address,
      idType: data.idType,
      idNumber: data.idNumber,
      submittedAt: new Date(),
    },
  });

  revalidatePath('/kyc');
  return result;
}
