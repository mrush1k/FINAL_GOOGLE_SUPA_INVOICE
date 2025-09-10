"use client"

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Invoice } from '@/lib/types'
import { Mail, Clock, CheckCircle, AlertCircle, Eye, MousePointer, Truck, XCircle } from 'lucide-react'
import { format } from 'date-fns'

interface EmailTrackingStatusProps {
  invoice: Invoice
  className?: string
}

export function EmailTrackingStatus({ invoice, className }: EmailTrackingStatusProps) {
  const getEmailStatus = () => {
    if (!invoice.sentAt && !invoice.lastEmailSentAt) {
      return {
        status: 'never-sent',
        label: 'Never Sent',
        icon: AlertCircle,
        color: 'bg-gray-100 text-gray-800'
      }
    }

    if (invoice.lastEmailSentAt) {
      const daysSinceLastSent = Math.floor(
        (Date.now() - new Date(invoice.lastEmailSentAt).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceLastSent === 0) {
        return {
          status: 'sent-today',
          label: 'Sent Today',
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800'
        }
      } else if (daysSinceLastSent <= 7) {
        return {
          status: 'sent-recently',
          label: `Sent ${daysSinceLastSent} day${daysSinceLastSent > 1 ? 's' : ''} ago`,
          icon: CheckCircle,
          color: 'bg-blue-100 text-blue-800'
        }
      } else {
        return {
          status: 'sent-long-ago',
          label: `Sent ${daysSinceLastSent} days ago`,
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800'
        }
      }
    }

    return {
      status: 'unknown',
      label: 'Unknown',
      icon: AlertCircle,
      color: 'bg-gray-100 text-gray-800'
    }
  }

  const emailStatus = getEmailStatus()
  const StatusIcon = emailStatus.icon

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <Badge className={emailStatus.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {emailStatus.label}
          </Badge>
        </div>

        {invoice.sentTo && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Sent to:</span>
            <span className="text-sm font-medium truncate max-w-[150px]" title={invoice.sentTo}>
              {invoice.sentTo}
            </span>
          </div>
        )}

        {invoice.emailCount !== undefined && invoice.emailCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Email Count:</span>
            <span className="text-sm font-medium">{invoice.emailCount}</span>
          </div>
        )}

        {invoice.lastEmailSentAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last Sent:</span>
            <span className="text-sm font-medium">
              {format(new Date(invoice.lastEmailSentAt), 'MMM dd, HH:mm')}
            </span>
          </div>
        )}

        {invoice.sentAt && invoice.sentAt !== invoice.lastEmailSentAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">First Sent:</span>
            <span className="text-sm font-medium">
              {format(new Date(invoice.sentAt), 'MMM dd, HH:mm')}
            </span>
          </div>
        )}

        {/* Enhanced tracking information */}
        {invoice.deliveryStatus && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Delivery Status:</span>
            <Badge className={
              invoice.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-800' :
              invoice.deliveryStatus === 'bounced' ? 'bg-red-100 text-red-800' :
              invoice.deliveryStatus === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }>
              {invoice.deliveryStatus === 'delivered' && <Truck className="w-3 h-3 mr-1" />}
              {invoice.deliveryStatus === 'bounced' && <XCircle className="w-3 h-3 mr-1" />}
              {invoice.deliveryStatus === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
              {invoice.deliveryStatus === 'sent' && <Mail className="w-3 h-3 mr-1" />}
              {invoice.deliveryStatus}
            </Badge>
          </div>
        )}

        {/* Email engagement indicators */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200">
          <div className="text-center">
            <div className={`flex items-center justify-center gap-1 text-xs ${
              invoice.emailOpened ? 'text-green-600' : 'text-gray-400'
            }`}>
              <Eye className="w-3 h-3" />
              <span>Opened</span>
            </div>
            {invoice.emailOpenedAt && (
              <div className="text-xs text-gray-500 mt-1">
                {format(new Date(invoice.emailOpenedAt), 'MMM dd, HH:mm')}
              </div>
            )}
          </div>
          
          <div className="text-center">
            <div className={`flex items-center justify-center gap-1 text-xs ${
              invoice.emailClicked ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <MousePointer className="w-3 h-3" />
              <span>Clicked</span>
            </div>
            {invoice.emailClickedAt && (
              <div className="text-xs text-gray-500 mt-1">
                {format(new Date(invoice.emailClickedAt), 'MMM dd, HH:mm')}
              </div>
            )}
          </div>
          
          <div className="text-center">
            <div className={`flex items-center justify-center gap-1 text-xs ${
              invoice.emailBounced ? 'text-red-600' : 'text-gray-400'
            }`}>
              <XCircle className="w-3 h-3" />
              <span>Bounced</span>
            </div>
            {invoice.emailBouncedAt && (
              <div className="text-xs text-gray-500 mt-1">
                {format(new Date(invoice.emailBouncedAt), 'MMM dd, HH:mm')}
              </div>
            )}
          </div>
        </div>

        {!invoice.sentTo && !invoice.lastEmailSentAt && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500 italic">
              This invoice has never been emailed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}