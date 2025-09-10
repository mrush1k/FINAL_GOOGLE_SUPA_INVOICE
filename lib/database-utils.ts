import { PrismaClient } from '@prisma/client'

// Singleton pattern for Prisma client to avoid multiple connections
class PrismaClientSingleton {
  private static instance: PrismaClient | null = null

  static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      })
    }
    return PrismaClientSingleton.instance
  }
}

export const prisma = PrismaClientSingleton.getInstance()

// Optimized queries with proper includes and selects
export const optimizedQueries = {
  // Dashboard data with minimal fields
  getDashboardData: async (userId: string) => {
    const [
      overdueInvoices,
      paidInvoices,
      totalOutstanding,
      totalPaid,
      invoiceCount,
      customerCount
    ] = await Promise.all([
      // Overdue invoices - only essential fields
      prisma.invoice.findMany({
        where: {
          userId,
          status: { in: ['SENT', 'APPROVED'] },
          dueDate: { lt: new Date() }
        },
        select: {
          id: true,
          number: true,
          status: true,
          dueDate: true,
          total: true,
          customer: { select: { displayName: true } }
        },
        orderBy: { dueDate: 'asc' },
        take: 10 // Limit results
      }),

      // Recent paid invoices - only essential fields
      prisma.invoice.findMany({
        where: {
          userId,
          status: { in: ['PAID', 'PARTIALLY_PAID'] }
        },
        select: {
          id: true,
          number: true,
          status: true,
          total: true,
          customer: { select: { displayName: true } },
          payments: {
            select: { amount: true, paymentDate: true },
            orderBy: { paymentDate: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10 // Limit results
      }),

      // Aggregate queries for totals
      prisma.invoice.aggregate({
        where: {
          userId,
          status: { not: 'PAID' }
        },
        _sum: { total: true }
      }),

      prisma.invoice.aggregate({
        where: {
          userId,
          status: 'PAID'
        },
        _sum: { total: true }
      }),

      prisma.invoice.count({
        where: { userId }
      }),

      prisma.customer.count({
        where: { userId }
      })
    ])

    return {
      overdueInvoices,
      paidInvoices,
      totalOutstanding: totalOutstanding._sum.total || 0,
      totalPaid: totalPaid._sum.total || 0,
      invoiceCount,
      customerCount
    }
  },

  // Optimized invoice list with pagination
  getInvoiceList: async (userId: string, page = 1, limit = 10) => {
    const skip = (page - 1) * limit
    
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId },
        select: {
          id: true,
          number: true,
          status: true,
          issueDate: true,
          dueDate: true,
          total: true,
          customer: {
            select: {
              displayName: true,
              email: true
            }
          },
          _count: {
            select: { payments: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.invoice.count({ where: { userId } })
    ])

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  },

  // Optimized customer list with invoice counts
  getCustomerList: async (userId: string) => {
    return prisma.customer.findMany({
      where: { userId },
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        country: true,
        _count: {
          select: { invoices: true }
        }
      },
      orderBy: { displayName: 'asc' }
    })
  }
}

// Connection cleanup on shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})