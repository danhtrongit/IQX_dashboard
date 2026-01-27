import { toast as sonnerToast, type ExternalToast } from 'sonner';
import {
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Info,
    Loader2,
    X,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

// ==================== Types ====================

interface ToastOptions extends ExternalToast {
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
    cancel?: {
        label: string;
        onClick: () => void;
    };
}

// ==================== Toast Variants ====================

type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'default';

const VARIANT_CONFIG: Record<ToastVariant, {
    icon: React.ElementType;
    containerClass: string;
    iconClass: string;
    progressClass: string;
}> = {
    success: {
        icon: CheckCircle2,
        containerClass: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-50',
        iconClass: 'text-emerald-400 bg-emerald-500/20',
        progressClass: 'bg-emerald-500',
    },
    error: {
        icon: AlertCircle,
        containerClass: 'bg-red-950/90 border-red-500/30 text-red-50',
        iconClass: 'text-red-400 bg-red-500/20',
        progressClass: 'bg-red-500',
    },
    warning: {
        icon: AlertTriangle,
        containerClass: 'bg-amber-950/90 border-amber-500/30 text-amber-50',
        iconClass: 'text-amber-400 bg-amber-500/20',
        progressClass: 'bg-amber-500',
    },
    info: {
        icon: Info,
        containerClass: 'bg-blue-950/90 border-blue-500/30 text-blue-50',
        iconClass: 'text-blue-400 bg-blue-500/20',
        progressClass: 'bg-blue-500',
    },
    loading: {
        icon: Loader2,
        containerClass: 'bg-popover/95 border-border text-popover-foreground',
        iconClass: 'text-primary bg-primary/10',
        progressClass: 'bg-primary',
    },
    default: {
        icon: Sparkles,
        containerClass: 'bg-popover/95 border-border text-popover-foreground',
        iconClass: 'text-foreground/70 bg-muted',
        progressClass: 'bg-primary',
    },
};

// ==================== Custom Toast Component ====================

interface CustomToastProps {
    title?: React.ReactNode;
    description?: React.ReactNode;
    variant?: ToastVariant;
    action?: ToastOptions['action'];
    cancel?: ToastOptions['cancel'];
    onDismiss?: () => void;
    duration?: number;
    showProgress?: boolean;
}

const CustomToast = ({
    title,
    description,
    variant = 'default',
    action,
    cancel,
    onDismiss,
    duration = 4000,
    showProgress = true,
}: CustomToastProps) => {
    const config = VARIANT_CONFIG[variant];
    const Icon = config.icon;
    const isLoading = variant === 'loading';

    return (
        <div
            className={cn(
                // Base styles
                'group relative flex w-full max-w-sm items-start gap-3',
                'rounded-xl border p-3.5',
                'backdrop-blur-xl backdrop-saturate-150',
                'shadow-lg shadow-black/20',
                // Animation
                'animate-in slide-in-from-top-2 fade-in-0 duration-300',
                // Variant styles
                config.containerClass
            )}
        >
            {/* Icon Container */}
            <div
                className={cn(
                    'flex shrink-0 items-center justify-center',
                    'size-8 rounded-lg',
                    config.iconClass
                )}
            >
                <Icon
                    className={cn(
                        'size-4',
                        isLoading && 'animate-spin'
                    )}
                />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
                {title && (
                    <p className="text-sm font-semibold leading-tight truncate">
                        {title}
                    </p>
                )}
                {description && (
                    <p className="mt-0.5 text-xs leading-relaxed opacity-80 line-clamp-2">
                        {description}
                    </p>
                )}

                {/* Actions */}
                {(action || cancel) && (
                    <div className="mt-2.5 flex items-center gap-2">
                        {action && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick();
                                }}
                                className={cn(
                                    'inline-flex items-center justify-center',
                                    'h-7 px-3 rounded-md',
                                    'text-xs font-semibold',
                                    'bg-white/15 hover:bg-white/25',
                                    'transition-colors duration-200',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                                )}
                            >
                                {action.label}
                            </button>
                        )}
                        {cancel && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    cancel.onClick();
                                }}
                                className={cn(
                                    'inline-flex items-center justify-center',
                                    'h-7 px-3 rounded-md',
                                    'text-xs font-medium opacity-70 hover:opacity-100',
                                    'transition-opacity duration-200'
                                )}
                            >
                                {cancel.label}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Dismiss Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss?.();
                }}
                className={cn(
                    'absolute right-2 top-2',
                    'flex items-center justify-center',
                    'size-6 rounded-md',
                    'opacity-0 group-hover:opacity-100',
                    'hover:bg-white/10',
                    'transition-all duration-200',
                    'focus-visible:outline-none focus-visible:opacity-100'
                )}
            >
                <X className="size-3.5 opacity-60" />
            </button>

            {/* Progress Bar */}
            {showProgress && !isLoading && duration !== Infinity && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-xl">
                    <div
                        className={cn(
                            'h-full origin-left',
                            config.progressClass,
                            'animate-[shrink_linear_forwards]'
                        )}
                        style={{
                            animation: `shrink ${duration}ms linear forwards`,
                        }}
                    />
                </div>
            )}
        </div>
    );
};

// Add keyframes to document (only once)
if (typeof document !== 'undefined') {
    const styleId = 'toast-progress-keyframes';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes shrink {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

// ==================== Toast API ====================

const createToast = (
    message: React.ReactNode,
    variant: ToastVariant,
    options?: ToastOptions
) => {
    const defaultDurations: Record<ToastVariant, number> = {
        success: 3000,
        error: 5000,
        warning: 4500,
        info: 4000,
        loading: Infinity,
        default: 4000,
    };

    const duration = options?.duration ?? defaultDurations[variant];

    return sonnerToast.custom(
        (id) => (
            <CustomToast
                title={message}
                description={options?.description}
                action={options?.action}
                cancel={options?.cancel}
                variant={variant}
                duration={duration}
                showProgress={variant !== 'loading'}
                onDismiss={() => sonnerToast.dismiss(id)}
            />
        ),
        { ...options, duration }
    );
};

export const toast = {
    // Main variants
    success: (message: React.ReactNode, options?: ToastOptions) =>
        createToast(message, 'success', options),

    error: (message: React.ReactNode, options?: ToastOptions) =>
        createToast(message, 'error', options),

    warning: (message: React.ReactNode, options?: ToastOptions) =>
        createToast(message, 'warning', options),

    info: (message: React.ReactNode, options?: ToastOptions) =>
        createToast(message, 'info', options),

    loading: (message: React.ReactNode, options?: ToastOptions) =>
        createToast(message, 'loading', options),

    // Default (neutral)
    default: (message: React.ReactNode, options?: ToastOptions) =>
        createToast(message, 'default', options),

    // Promise handler
    promise: <T,>(
        promise: Promise<T> | (() => Promise<T>),
        data: {
            loading: React.ReactNode;
            success: (data: T) => React.ReactNode;
            error: (error: Error) => React.ReactNode;
            description?: {
                loading?: React.ReactNode;
                success?: (data: T) => React.ReactNode;
                error?: (error: Error) => React.ReactNode;
            };
        }
    ) => {
        const toastId = toast.loading(data.loading, {
            description: data.description?.loading,
        });

        const promiseToExecute = typeof promise === 'function' ? promise() : promise;

        promiseToExecute
            .then((result) => {
                sonnerToast.dismiss(toastId);
                toast.success(data.success(result), {
                    description: data.description?.success?.(result),
                });
            })
            .catch((error: Error) => {
                sonnerToast.dismiss(toastId);
                toast.error(data.error(error), {
                    description: data.description?.error?.(error),
                });
            });

        return toastId;
    },

    // Utility methods
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),

    // Dismiss all toasts
    dismissAll: () => sonnerToast.dismiss(),
};

// Export types for external use
export type { ToastOptions, ToastVariant };
