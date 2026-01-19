import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Itinerary } from "@/hooks/useItineraries";
import { format } from "date-fns";
import "@/font/Quicksand-Regular-normal.js";
import "@/font/Quicksand-Bold-normal.js";

export async function exportItineraryToPDF(itinerary: Itinerary) {
  const doc = new jsPDF();

  // Set font to Quicksand (supports Vietnamese characters)
  // Nội dung thường dùng Regular
  doc.setFont("Quicksand-Regular", "normal");

  // Tiêu đề dùng Bold
  doc.setFont("Quicksand-Bold", "normal");
  doc.setFontSize(24);
  doc.setTextColor(59, 130, 246); // Primary blue
  doc.text(itinerary.title, 20, 25);

  // Description
  if (itinerary.description) {
    doc.setFont("Quicksand-Regular", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(itinerary.description, 20, 35);
  }

  // Trip info
  let yPos = itinerary.description ? 45 : 35;
  doc.setFont("Quicksand-Regular", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);

  const tripInfo = [];
  if (itinerary.start_date) {
    tripInfo.push(`Ngày bắt đầu: ${format(new Date(itinerary.start_date), "dd/MM/yyyy")}`);
  }
  if (itinerary.end_date) {
    tripInfo.push(`Ngày kết thúc: ${format(new Date(itinerary.end_date), "dd/MM/yyyy")}`);
  }

  tripInfo.forEach((info) => {
    doc.text(info, 20, yPos);
    yPos += 6;
  });

  // Derive trip data from itinerary.trip_data
  const tripData = itinerary.trip_data;
  const days = (tripData?.days || []) as Array<{
    date: string;
    places: Array<{
      name: string;
      timeSlot?: string;
      category?: string;
      estimatedCost?: number;
    }>;
  }>;

  type ExportPlace = {
    dayNumber: number;
    name: string;
    timeSlot?: string;
    category?: string;
    estimatedCost: number;
  };

  const allPlaces: ExportPlace[] = [];

  days.forEach((day, index) => {
    const dayNumber = index + 1;
    (day.places || []).forEach((place) => {
      allPlaces.push({
        dayNumber,
        name: place.name,
        timeSlot: place.timeSlot,
        category: place.category,
        estimatedCost: Number(place.estimatedCost || 0),
      });
    });
  });

  // Statistics
  yPos += 5;
  const totalDays = days.length || 1;
  const totalCost = allPlaces.reduce((sum, p) => sum + p.estimatedCost, 0);

  doc.setFont("Quicksand-Bold", "normal");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("THỐNG KÊ CHUYẾN ĐI", 20, yPos);
  yPos += 8;

  doc.setFont("Quicksand-Regular", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`• Tổng số ngày: ${totalDays} ngày`, 25, yPos);
  yPos += 6;
  doc.text(`• Tổng địa điểm: ${allPlaces.length} địa điểm`, 25, yPos);
  yPos += 6;
  doc.text(`• Tổng chi phí dự kiến: ${totalCost.toLocaleString("vi-VN")} VND`, 25, yPos);
  yPos += 15;

  // Group places by day
  const placesByDay = allPlaces.reduce(
    (acc, p) => {
      if (!acc[p.dayNumber]) acc[p.dayNumber] = [];
      acc[p.dayNumber].push(p);
      return acc;
    },
    {} as Record<number, ExportPlace[]>,
  );

  // Itinerary details for each day
  Object.entries(placesByDay)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([day, dayPlaces]) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Day header
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(20, yPos - 5, 170, 10, 2, 2, "F");
      doc.setFont("Quicksand-Bold", "normal");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(`NGÀY ${day}`, 25, yPos + 2);
      yPos += 15;

      // Destinations table
      const tableData = dayPlaces.map((place, index) => [
        `${index + 1}`,
        place.name,
        place.timeSlot || "-",
        place.category || "-",
        `${place.estimatedCost.toLocaleString("vi-VN")} VND`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["#", "Dia diem", "Thoi gian", "Loai", "Chi phi"]],
        body: tableData,
        styles: { font: "Quicksand-Regular" },
        headStyles: {
          fillColor: [100, 116, 139],
          fontSize: 9,
          font: "Quicksand-Bold",
        },
        bodyStyles: { fontSize: 9, font: "Quicksand-Regular" },
        theme: "striped",
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 40 },
          4: { cellWidth: 40 },
        },
        margin: { left: 20, right: 20 },
        didParseCell: function (data) {
          if (data.section === "head") {
            data.cell.styles.font = "Quicksand-Bold";
          } else {
            data.cell.styles.font = "Quicksand-Regular";
          }
        },
      });

      // Get the final Y position after the table
      const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
      yPos = (lastTable?.finalY ?? yPos) + 10;
    });

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("Quicksand-Regular", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Tạo bởi Travel Planner - Trang ${i}/${pageCount}`, 105, 290, {
      align: "center",
    });
  }

  // Save the PDF
  const fileName = `${itinerary.title.replace(/[^a-zA-Z0-9]/g, "_")}_itinerary.pdf`;
  doc.save(fileName);
}
