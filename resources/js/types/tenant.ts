export type Tenant = {
    id: string;
    name: string;
    slug: string;
    address: string;
    phone: string;
    logo: string | null;
    logo_url: string | null;
    color_theme: string;
    points_per_currency?: number;
    point_value?: number;
    min_redeem_points?: number;
};
