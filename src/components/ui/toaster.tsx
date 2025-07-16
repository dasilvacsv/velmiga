"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="max-w-sm">
            <div className="grid gap-1">
              {title && <ToastTitle className="text-sm font-medium">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-xs">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      {/* CAMBIO: Viewport posicionado arriba a la izquierda y más pequeño */}
      <ToastViewport className="fixed top-4 left-4 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[300px] sm:flex-col md:max-w-[350px]" />
    </ToastProvider>
  )
}