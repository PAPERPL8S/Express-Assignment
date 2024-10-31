import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "test") {
    prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.TEST_DATABASE_URL || "file:./dev.db",
            },
        },
    });
} else {
    prisma = new PrismaClient();
}

prisma.$connect().catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
});

export { prisma };
export default prisma;
