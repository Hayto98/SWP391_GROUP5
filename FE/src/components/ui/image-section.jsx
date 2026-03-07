import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function ImageSection({ title, image, className }) {
  const [preview, setPreview] = useState(null);

  const src = typeof image === "string" ? image : image?.file_uri;

  return (
    <div className={`space-y-3 w-full ${className || ""}`}>
      <p className="text-base font-semibold">{title}</p>

      {!src ? (
        <div className=" rounded-lg border border-dashed p-6 text-sm text-muted-foreground text-center">
          Chưa có hình ảnh
        </div>
      ) : (
        <img
          src={src}
          alt={title}
          onClick={() => setPreview(src)}
          className="w-full h-60 object-cover rounded-xl border cursor-pointer transition"
        />
      )}

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-none min-w-[90vw] p-2 z-1000">
          <img
            src={preview}
            alt="preview"
            className="w-full h-[90vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ImageSection;
