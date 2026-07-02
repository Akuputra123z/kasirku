import { z } from 'zod';

export const checkoutAddressSchema = z.object({
    recipient_name: z.string().min(1, 'Nama penerima harus diisi'),
    phone: z.string().min(1, 'No. HP harus diisi'),
    address: z.string().min(1, 'Alamat harus diisi'),
    city: z.string().min(1, 'Kota harus diisi'),
    province: z.string().min(1, 'Provinsi harus diisi'),
    rajaongkir_city_id: z.string().optional(),
    postal_code: z.string().optional(),
    label: z.string().optional(),
});

export type CheckoutAddress = z.infer<typeof checkoutAddressSchema>;

export const customerLoginSchema = z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(1, 'Password harus diisi'),
    redirect: z.string().optional(),
});

export type CustomerLogin = z.infer<typeof customerLoginSchema>;

export const customerRegisterSchema = z.object({
    name: z.string().min(1, 'Nama harus diisi'),
    email: z.string().email('Email tidak valid'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Minimal 8 karakter'),
    password_confirmation: z.string().min(1, 'Konfirmasi password harus diisi'),
    redirect: z.string().optional(),
}).refine((data) => data.password === data.password_confirmation, {
    message: 'Password tidak cocok',
    path: ['password_confirmation'],
});

export type CustomerRegister = z.infer<typeof customerRegisterSchema>;

export const storeLoginSchema = z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(1, 'Password harus diisi'),
    remember: z.boolean().optional(),
});

export type StoreLogin = z.infer<typeof storeLoginSchema>;

export const storeRegisterSchema = z.object({
    name: z.string().min(1, 'Nama harus diisi'),
    email: z.string().email('Email tidak valid'),
    password: z.string().min(8, 'Minimal 8 karakter'),
    password_confirmation: z.string().min(1, 'Konfirmasi password harus diisi'),
}).refine((data) => data.password === data.password_confirmation, {
    message: 'Password tidak cocok',
    path: ['password_confirmation'],
});

export type StoreRegister = z.infer<typeof storeRegisterSchema>;
