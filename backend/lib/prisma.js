// Shared Prisma client instance.
// Import this file wherever you need database access in new code.
// Never import PrismaClient directly — always use this singleton.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma