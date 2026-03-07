import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { useRef } from "react";

function ReportSummary({
  description,
  setDescription,
  files,
  setFiles,
  onSubmit,
  submitting,
}) {
  const fileInputRef = useRef(null);

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

        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-colors"
        >
          <Camera className="size-12 text-green-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Nhấn để tải lên hoặc kéo thả ảnh
          </p>
          <p className="text-xs text-green-500">Hỗ trợ JPG, PNG (Tối đa 5MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Preview uploaded images */}
        {files.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {files.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.preview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(image.id)}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
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
