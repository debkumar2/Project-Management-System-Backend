import prisma from "./src/prisma/index.js";

async function checkConstraint() {
    try {
        const result = await prisma.$queryRaw`
            SELECT pg_get_constraintdef(oid) AS def
            FROM pg_constraint 
            WHERE conname = 'login_history_login_type_check';
        `;
        console.log(result);
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}
checkConstraint();
