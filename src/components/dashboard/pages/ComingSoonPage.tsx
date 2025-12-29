import { Rocket, Calendar, Bell } from "lucide-react";
import { WorkspaceLayout } from "../layout/WorkspaceLayout";
import { Button } from "@/components/ui/button";

/**
 * Coming Soon page - For features under development
 */
export function ComingSoonPage() {
    return (
        <WorkspaceLayout>
            <div className="flex flex-col items-center justify-center h-full px-4 py-12">
                <div className="max-w-md w-full text-center space-y-6">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
                            <div className="relative bg-primary/10 border-2 border-primary/20 rounded-full p-6">
                                <Rocket className="h-12 w-12 text-primary" />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Sắp Ra Mắt
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Tính năng đang được phát triển
                        </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Chúng tôi đang nỗ lực hoàn thiện các gói dịch vụ với nhiều tính năng hấp dẫn.
                            Trang này sẽ sớm có mặt với những ưu đãi đặc biệt dành cho bạn.
                        </p>

                        {/* Feature highlights */}
                        <div className="grid gap-3 pt-2">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="bg-primary/10 rounded-full p-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-muted-foreground text-left">
                                    Các gói dịch vụ linh hoạt và phù hợp với mọi nhu cầu
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="bg-primary/10 rounded-full p-2">
                                    <Bell className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-muted-foreground text-left">
                                    Nhận thông báo khi tính năng chính thức ra mắt
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="pt-6">
                        <Button
                            size="lg"
                            className="w-full sm:w-auto"
                            onClick={() => window.location.href = '/'}
                        >
                            Quay Lại Trang Chủ
                        </Button>
                    </div>
                </div>
            </div>
        </WorkspaceLayout>
    );
}
