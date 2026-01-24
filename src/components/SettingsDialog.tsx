"use client";

import { useState } from "react";
import { Settings, Download, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "./PWAInstaller";
import { useToast } from "@/hooks/use-toast";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t } = useTranslation();
  const { install, canInstall, isInstalled } = usePWAInstall();
  const { toast } = useToast();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const success = await install();
      if (success) {
        toast({
          title: t("pwa.installSuccess", "Đã cài đặt!"),
          description: t("pwa.installSuccessDescription", "Vivu Go đã được cài đặt thành công."),
        });
      } else {
        toast({
          variant: "destructive",
          title: t("pwa.installError", "Không thể cài đặt"),
          description: t(
            "pwa.installErrorDescription",
            "Trình duyệt của bạn không hỗ trợ cài đặt ứng dụng hoặc ứng dụng đã được cài đặt.",
          ),
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("pwa.installError", "Không thể cài đặt"),
        description: t("pwa.installErrorDescription", "Đã xảy ra lỗi khi cài đặt."),
      });
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("settings.title", "Cài đặt")}
          </DialogTitle>
          <DialogDescription>{t("settings.description", "Quản lý cài đặt ứng dụng")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* PWA Install Section */}
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t("pwa.title", "Cài đặt ứng dụng")}</h3>
                <p className="text-muted-foreground text-sm">
                  {isInstalled
                    ? t("pwa.alreadyInstalled", "Ứng dụng đã được cài đặt")
                    : t(
                        "pwa.installDescription",
                        "Cài đặt ứng dụng để sử dụng offline và truy cập nhanh hơn.",
                      )}
                </p>
              </div>
            </div>
            {!isInstalled && (
              <Button
                onClick={handleInstall}
                disabled={!canInstall || installing}
                className="w-full"
                variant={canInstall ? "default" : "outline"}
              >
                <Download className="mr-2 h-4 w-4" />
                {installing
                  ? t("pwa.installing", "Đang cài đặt...")
                  : canInstall
                    ? t("pwa.installNow", "Cài đặt ngay")
                    : t("pwa.notAvailable", "Không khả dụng")}
              </Button>
            )}
            {isInstalled && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <X className="h-4 w-4 text-green-500" />
                {t("pwa.installed", "Đã cài đặt")}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
