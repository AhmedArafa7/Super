'use client';

/**
 * [UTILITY: Web Serial Engine]
 * محرك مستقل لإدارة الاتصال بالأجهزة عبر الـ USB.
 * يمكن استخدامه في أي مكان في التطبيق (IDE, Admin, Diagnostics).
 */

export interface SerialPortState {
  isConnected: boolean;
  isReading: boolean;
  port: any | null;
}

export const webSerialEngine = {
  /**
   * طلب الاتصال بجهاز جديد
   */
  requestPort: async (baudRate: number = 115200) => {
    if (!("serial" in navigator)) {
      throw new Error("Web Serial API not supported");
    }
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate });
    return port;
  },

  /**
   * بدء قراءة البيانات من المنفذ
   */
  readStream: async (port: any, onData: (data: string) => void, signal: { isReading: boolean }) => {
    const decoder = new TextDecoder();
    while (port.readable && signal.isReading) {
      const reader = port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          onData(decoder.decode(value));
        }
      } catch (error) {
        console.error("Read error:", error);
        break;
      } finally {
        reader.releaseLock();
      }
    }
  },

  /**
   * إغلاق الاتصال
   */
  closePort: async (port: any) => {
    if (port) {
      await port.close();
    }
  }
};
