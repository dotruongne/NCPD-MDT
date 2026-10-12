// Dữ liệu tĩnh cho Cheat Sheet. Chỉnh theo server của bạn.
export const TEN_CODES: [string, string][] = [
  ["10-0", "Cẩn thận / nguy hiểm"],
  ["10-1", "Tín hiệu yếu"],
  ["10-4", "Đã nhận / OK"],
  ["10-6", "Đang bận"],
  ["10-7", "Out of service / nghỉ"],
  ["10-8", "Sẵn sàng / In service"],
  ["10-11", "Dừng xe (Traffic Stop)"],
  ["10-15", "Đã bắt giữ nghi phạm"],
  ["10-20", "Vị trí hiện tại"],
  ["10-32", "Có người cầm súng"],
  ["10-50", "Tai nạn giao thông"],
  ["10-70", "Truy đuổi / Pursuit"],
  ["10-71", "Có tiếng súng nổ"],
  ["10-80", "Truy đuổi bằng xe"],
  ["10-99", "Sĩ quan cần hỗ trợ khẩn cấp (Panic)"],
  ["Code 3", "Có còi, có đèn – khẩn cấp"],
  ["Code 4", "Tình huống đã ổn định"],
];

export const MIRANDA = `Bạn có quyền giữ im lặng. Mọi điều bạn nói có thể và sẽ được dùng chống lại bạn trước tòa.
Bạn có quyền có luật sư. Nếu bạn không đủ khả năng thuê luật sư, thành phố sẽ chỉ định một người cho bạn.
Bạn có hiểu những quyền này mà tôi vừa đọc không?`;

export const SOP: { level: string; text: string }[] = [
  { level: "Cấp 1 – Hiện diện", text: "Có mặt, ra lệnh bằng lời. Chưa rút vũ khí." },
  { level: "Cấp 2 – Taser / Chất gây mê", text: "Dùng khi nghi phạm kháng cự, chưa có vũ khí chết người." },
  { level: "Cấp 3 – Súng ngắn chĩa", text: "Chỉ khi nghi phạm có vũ khí hoặc đe dọa nghiêm trọng." },
  { level: "Cấp 4 – Nổ súng", text: "Chỉ khi tính mạng sĩ quan/dân thường bị đe dọa trực tiếp. Phải cảnh báo trước nếu có thể." },
  { level: "Lưu ý", text: "Mọi vụ nổ súng phải làm báo cáo trong ca trực và thông báo Supervisor." },
];
