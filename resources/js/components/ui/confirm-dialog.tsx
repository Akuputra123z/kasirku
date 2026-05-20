"use client"

import { Icon } from '@iconify/react';
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "default"
  loading?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-[1.75rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-neutral-950">
        <div className="p-7 pb-0">
          <div className="flex flex-col items-center text-center gap-4">
            <div className={`size-14 rounded-full flex items-center justify-center ${
              variant === "danger"
                ? "bg-red-50 dark:bg-red-950/50"
                : "bg-neutral-100 dark:bg-neutral-900"
            }`}>
              <Icon
                icon={variant === "danger" ? "solar:danger-triangle-bold-duotone" : "solar:info-circle-bold-duotone"}
                width={28}
                className={variant === "danger" ? "text-red-500" : "text-neutral-500"}
              />
            </div>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">
                {title}
              </DialogTitle>
              <DialogDescription className="text-[13px] font-medium text-neutral-500 leading-relaxed">
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <DialogFooter className="px-7 pb-7 pt-4 border-0 bg-transparent flex flex-row gap-2.5 sm:flex-row sm:justify-center">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="h-11 rounded-xl flex-1 font-bold text-[13px] border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              {cancelText}
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={loading}
            onClick={() => {
              onConfirm();
            }}
            className={`h-11 rounded-xl flex-1 font-bold text-[13px] shadow-lg flex items-center gap-2 ${
              variant === "danger"
                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                : "bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
            }`}
          >
            {loading && (
              <div className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            )}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
