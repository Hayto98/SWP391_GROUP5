import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { useRef } from "react";
import ImageSection from "@/components/ui/image-section";

function ReportSummary({
  description,
  setDescription,
  files,
  setFiles,
  onSubmit,
  submitting,
}) {
  const fileInputRef = useRef(null);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter((file) => {
      const isValidType = ["image/jpeg", "image/png", "image/jpg"].includes(
        file.type,
      );
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    const newImages = validFiles.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
    }));

    // Backend currently accepts one file field named `file`.
    if (newImages[0]) {
      setFiles([newImages[0]]);
    }

    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    const validFiles = droppedFiles.filter((file) => {
      const isValidType = ["image/jpeg", "image/png", "image/jpg"].includes(
        file.type,
      );
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    const newImages = validFiles.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
    }));

    if (newImages[0]) {
      setFiles([newImages[0]]);
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
    setFiles(files.filter((img) => img.id !== id));
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
        <h3 className="text-sm font-semibold text-start mt-4">Tải ảnh lên</h3>

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
            <p className="text-xs text-green-500">
              Hỗ trợ JPG, PNG (Tối đa 5MB)
            </p>
          </div>
        ) : (
          <div className="relative rounded-lg border p-3">
            <ImageSection title="Ảnh đã chọn" image={files[0]?.preview} />

            <div className="absolute top-14 right-6 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={openFilePicker}
              >
                Thay đổi ảnh
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="gap-1"
                onClick={() => removeImage(files[0]?.id)}
              >
                <X className="size-3" />
                Xóa ảnh
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end mt-6">
        <Button onClick={onSubmit} size="lg" disabled={submitting}>
          {submitting ? "Đang gửi..." : "Gửi báo cáo thu gom"}
        </Button>
      </div>
    </>
  );
}

export default ReportSummary;
