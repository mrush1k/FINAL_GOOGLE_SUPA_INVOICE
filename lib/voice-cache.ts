interface VoiceCommand {
  id: string
  transcript: string
  timestamp: number
  processed: boolean
  invoiceData?: any
}

class VoiceCache {
  private storageKey = 'voice-invoice-cache'

  saveCommand(transcript: string, invoiceData?: any): string {
    const command: VoiceCommand = {
      id: Date.now().toString(),
      transcript,
      timestamp: Date.now(),
      processed: false,
      invoiceData
    }

    const existingCommands = this.getCommands()
    const updatedCommands = [...existingCommands, command]
    
    localStorage.setItem(this.storageKey, JSON.stringify(updatedCommands))
    return command.id
  }

  getCommands(): VoiceCommand[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  getPendingCommands(): VoiceCommand[] {
    return this.getCommands().filter(cmd => !cmd.processed)
  }

  markAsProcessed(commandId: string): void {
    const commands = this.getCommands()
    const updatedCommands = commands.map(cmd => 
      cmd.id === commandId ? { ...cmd, processed: true } : cmd
    )
    localStorage.setItem(this.storageKey, JSON.stringify(updatedCommands))
  }

  clearProcessedCommands(): void {
    const commands = this.getCommands()
    const pendingCommands = commands.filter(cmd => !cmd.processed)
    localStorage.setItem(this.storageKey, JSON.stringify(pendingCommands))
  }

  clearAll(): void {
    localStorage.removeItem(this.storageKey)
  }

  getCommandCount(): { total: number; pending: number } {
    const commands = this.getCommands()
    return {
      total: commands.length,
      pending: commands.filter(cmd => !cmd.processed).length
    }
  }
}

export const voiceCache = new VoiceCache()

// Network status utilities
export const isOnline = (): boolean => {
  return navigator.onLine
}

export const onNetworkChange = (callback: (online: boolean) => void): (() => void) => {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}