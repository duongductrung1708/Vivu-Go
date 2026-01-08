"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Calendar, Users, DollarSign, MoreVertical, Trash2, Edit, Share2, Clock, Globe } from 'lucide-react';
import { ItineraryShareDialog } from '@/components/ItineraryShareDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useItineraries, useDeleteItinerary } from '@/hooks/useItineraries';
import Loading from '@/components/Loading';
import Navbar from '@/components/Navbar';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { data: itineraries, isLoading } = useItineraries();
  const deleteItinerary = useDeleteItinerary();


  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  const handleCreateNew = () => {
    router.push("/trip");
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa lịch trình này?')) {
      try {
        await deleteItinerary.mutateAsync(id);
        toast({
          title: "Đã xóa",
          description: "Lịch trình đã được xóa thành công.",
        });
      } catch {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể xóa lịch trình. Vui lòng thử lại.",
        });
      }
    }
  };

  if (authLoading || isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-secondary/20 to-lavender/20">
      <Navbar variant="fixed" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Lịch trình của bạn</h2>
            <p className="text-muted-foreground mt-1">
              Quản lý và lên kế hoạch cho những chuyến đi tuyệt vời
            </p>
          </div>

          <Button 
            onClick={handleCreateNew}
            className="bg-linear-to-r from-primary to-accent hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo lịch trình mới
          </Button>
        </div>

        {/* Itineraries Grid */}
        {itineraries?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Chưa có lịch trình nào</h3>
            <p className="text-muted-foreground mb-6">
              Bắt đầu tạo lịch trình đầu tiên của bạn ngay!
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo lịch trình mới
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {itineraries?.map((itinerary, index) => {
                const tripData = itinerary.trip_data;
                const daysCount = tripData?.days?.length || 0;
                const placesCount = tripData?.days?.reduce((sum, day) => sum + (day.places?.length || 0), 0) || 0;
                const startDate = itinerary.start_date ? new Date(itinerary.start_date) : null;
                
                return (
                  <motion.div
                    key={itinerary.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50 bg-linear-to-br from-card to-card/50 overflow-hidden relative"
                      onClick={() => router.push(`/itinerary/${itinerary.id}`)}
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <CardHeader className="pb-4 relative z-10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors">
                                {itinerary.title}
                              </CardTitle>
                              {itinerary.is_public && (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                                  <Globe className="w-3 h-3" />
                                  <span>Công khai</span>
                                </div>
                              )}
                            </div>
                            {itinerary.description && (
                              <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                                {itinerary.description}
                              </CardDescription>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/itinerary/${itinerary.id}`);
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <ItineraryShareDialog itineraryId={itinerary.id}>
                                <DropdownMenuItem>
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Chia sẻ
                                </DropdownMenuItem>
                              </ItineraryShareDialog>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(itinerary.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="relative z-10 space-y-4">
                        {/* Stats Row */}
                        <div className="flex flex-wrap gap-3">
                          {daysCount > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-medium">{daysCount} ngày</span>
                            </div>
                          )}
                          {placesCount > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm font-medium">{placesCount} điểm</span>
                            </div>
                          )}
                          {itinerary.people_count > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground">
                              <Users className="w-4 h-4" />
                              <span className="text-sm font-medium">{itinerary.people_count} người</span>
                            </div>
                          )}
                        </div>

                        {/* Info Row */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          {startDate && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4 shrink-0" />
                              <div>
                                <div className="text-xs text-muted-foreground/70">Ngày bắt đầu</div>
                                <div className="font-medium text-foreground">
                                  {format(startDate, 'dd/MM/yyyy', { locale: vi })}
                                </div>
                              </div>
                            </div>
                          )}
                          {itinerary.total_budget > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <DollarSign className="w-4 h-4 shrink-0" />
                              <div>
                                <div className="text-xs text-muted-foreground/70">Ngân sách</div>
                                <div className="font-semibold text-foreground">
                                  {itinerary.total_budget.toLocaleString('vi-VN')} đ
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
