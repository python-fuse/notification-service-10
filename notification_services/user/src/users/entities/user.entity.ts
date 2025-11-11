import { Prisma } from "@prisma/client";

export class User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    pushToken?: string | null;
    preferences?: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
}

