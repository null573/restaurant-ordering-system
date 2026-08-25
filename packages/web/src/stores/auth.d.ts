interface UserInfo {
    id: string;
    tenantId: string;
    phone: string;
    name: string | null;
    role: string;
}
export declare const useAuthStore: import("pinia").StoreDefinition<"auth", Pick<{
    token: import("vue").Ref<string, string>;
    refreshToken: import("vue").Ref<string, string>;
    user: import("vue").Ref<{
        id: string;
        tenantId: string;
        phone: string;
        name: string | null;
        role: string;
    } | null, UserInfo | {
        id: string;
        tenantId: string;
        phone: string;
        name: string | null;
        role: string;
    } | null>;
    isLoggedIn: import("vue").ComputedRef<boolean>;
    role: import("vue").ComputedRef<string>;
    login: (phone: string, password: string) => Promise<void>;
    register: (data: {
        name: string;
        contactPhone: string;
        password: string;
        managerName?: string;
    }) => Promise<any>;
    logout: () => void;
}, "refreshToken" | "token" | "user">, Pick<{
    token: import("vue").Ref<string, string>;
    refreshToken: import("vue").Ref<string, string>;
    user: import("vue").Ref<{
        id: string;
        tenantId: string;
        phone: string;
        name: string | null;
        role: string;
    } | null, UserInfo | {
        id: string;
        tenantId: string;
        phone: string;
        name: string | null;
        role: string;
    } | null>;
    isLoggedIn: import("vue").ComputedRef<boolean>;
    role: import("vue").ComputedRef<string>;
    login: (phone: string, password: string) => Promise<void>;
    register: (data: {
        name: string;
        contactPhone: string;
        password: string;
        managerName?: string;
    }) => Promise<any>;
    logout: () => void;
}, "role" | "isLoggedIn">, Pick<{
    token: import("vue").Ref<string, string>;
    refreshToken: import("vue").Ref<string, string>;
    user: import("vue").Ref<{
        id: string;
        tenantId: string;
        phone: string;
        name: string | null;
        role: string;
    } | null, UserInfo | {
        id: string;
        tenantId: string;
        phone: string;
        name: string | null;
        role: string;
    } | null>;
    isLoggedIn: import("vue").ComputedRef<boolean>;
    role: import("vue").ComputedRef<string>;
    login: (phone: string, password: string) => Promise<void>;
    register: (data: {
        name: string;
        contactPhone: string;
        password: string;
        managerName?: string;
    }) => Promise<any>;
    logout: () => void;
}, "login" | "register" | "logout">>;
export {};
//# sourceMappingURL=auth.d.ts.map