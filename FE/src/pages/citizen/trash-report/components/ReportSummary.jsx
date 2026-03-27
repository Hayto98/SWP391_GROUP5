import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Camera, X, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { processAIPredictWaste } from "@/services/wasteReportService";
import ImageSection from "@/components/ui/image-section";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function ReportSummary({
  description,
  setDescription,
  files,
  setFiles,
  onSubmit,
  submitting,
  onAIPrediction,
}) {
  const fileInputRef = useRef(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const mergeValidImages = (incomingFiles) => {
    const oversizedFiles = incomingFiles.filter(
      (file) => file.size > MAX_FILE_SIZE_BYTES,
    );

    if (oversizedFiles.length > 0) {
      toast.warning("Ảnh vượt quá 5MB. Vui lòng chọn ảnh dưới 5MB.");
    }

    const validFiles = incomingFiles.filter((file) => {
      const isValidType = ["image/jpeg", "image/png", "image/jpg"].includes(
        file.type,
      );
      const isValidSize = file.size <= MAX_FILE_SIZE_BYTES;
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) return [];

    const remainingSlots = Math.max(0, 5 - files.length);
    if (remainingSlots === 0) {
      toast.warning("Bạn chỉ có thể tải lên tối đa 5 ảnh.");
      return [];
    }

    if (validFiles.length > remainingSlots) {
      toast.warning("Chỉ thêm được tối đa 5 ảnh cho mỗi báo cáo.");
    }

    const filesToAdd = validFiles.slice(0, remainingSlots);

    return filesToAdd.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
    }));
  };

  const processFileAI = async (file) => {
    if (!onAIPrediction) return;

    setIsPredicting(true);
    try {
      const response = await processAIPredictWaste(file);
      if (response && response.data && response.data.analysis) {
        onAIPrediction(response.data.analysis);
      }
    } catch (error) {
      console.error("AI Error:", error);
      toast.error(
        "Không thể phân tích ảnh bằng AI: " +
          (error.message || "Lỗi không xác định"),
      );
    } finally {
      setIsPredicting(false);
    }
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newImages = mergeValidImages(selectedFiles);

    if (newImages.length > 0) {
      setFiles((prev) => [...prev, ...newImages]);
      await processFileAI(newImages[0].file);
    }

    e.target.value = "";
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    const newImages = mergeValidImages(droppedFiles);

    if (newImages.length > 0) {
      setFiles((prev) => [...prev, ...newImages]);
      await processFileAI(newImages[0].file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeImage = (id) => {
    const target = files.find((img) => img.id === id);
    if (target?.preview) {
      URL.revokeObjectURL(target.preview);
    }
    setFiles((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <>
      {/* Mô tả */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-start">Mô tả</h3>
        <Textarea
          placeholder="Mô tả thêm về tình trạng rác thải tại các địa điểm (ví dụ: rác cồng kềnh, cần hỗ trợ khuân vác...)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-25 resize-none"
        />
      </div>

      {/* Upload ảnh */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mt-4">
          <h3 className="text-sm font-semibold text-start">
            Tải ảnh lên
            <span className="text-destructive"> *</span>
          </h3>
          {isPredicting && (
            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md animate-pulse">
              <Sparkles className="size-3" />
              AI đang phân tích ảnh...
            </div>
          )}
        </div>

        {files.length === 0 ? (
          <div
            onClick={openFilePicker}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-colors"
          >
            <Camera className="size-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">
              Nhấn để tải lên hoặc kéo thả ảnh
            </p>
            <p className="text-xs text-secondary-foreground mt-2">
              <Sparkles className="size-3 inline-block mr-1 text-yellow-500" />
              AI sẽ tự động nhận diện loại rác
            </p>
            <p className="text-xs text-green-500 mt-1">
              Hỗ trợ JPG, PNG (Tối đa 5MB mỗi ảnh và 5 ảnh mỗi báo cáo.)
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {files.map((img) => (
                <div
                  key={img.id}
                  className="relative overflow-hidden rounded-lg border bg-muted aspect-square"
                >
                  <ImageSection
                    image={img.preview}
                    className="h-full"
                    imageClassName="h-full w-full rounded-none border-0"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 inline-flex items-center justify-center size-6 rounded-full bg-black/70 text-white hover:bg-black/85"
                    aria-label="Xóa ảnh"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}

              {files.length < 5 && (
                <button
                  type="button"
                  onClick={openFilePicker}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-600 hover:border-green-400 hover:bg-green-50/30 transition-colors p-2"
                >
                  + Thêm ảnh
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Đã chọn {files.length}/5 ảnh</span>
              <span>Tối đa 5MB mỗi ảnh</span>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end mt-6">
        <Button
          onClick={onSubmit}
          size="lg"
          disabled={submitting || isPredicting}
        >
          {submitting ? "Đang gửi..." : "Gửi báo cáo thu gom"}
        </Button>
      </div>
    </>
  );
}

export default ReportSummary;
